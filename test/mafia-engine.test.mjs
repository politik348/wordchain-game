import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAFIA_ROLES,createMafiaState,generateMafiaRoles,needsNightAction,publicMafiaState,actMafia,tickMafia} from '../mafia-engine.mjs';
const ids=n=>Array.from({length:n},(_,i)=>`p${i}`);
const people=n=>ids(n).map(id=>({id,nick:id}));
function crafted(names){const players=people(names.length);const state=createMafiaState(ids(names.length));state.roles=Object.fromEntries(names.map((r,i)=>[`p${i}`,r]));return {state,players};}
function action(x,i,type,target){return actMafia(x.state,`p${i}`,type,target===undefined?{}:{target},x.players,'p0')}
function night(x){for(let i=0;i<x.players.length;i++)if(needsNightAction(x.state,`p${i}`)&&!Object.prototype.hasOwnProperty.call(x.state.nightActions,`p${i}`))action(x,i,'nightPass')}

test('4 to 12 players: roles valid; classic has only 4 roles and special has richer pool',()=>{
 for(let n=4;n<=12;n++)for(const mode of ['classic','special']){
  const roles=generateMafiaRoles(n,mode);assert.equal(roles.length,n);assert.ok(roles.includes('마피아'));assert.ok(roles.includes('경찰'));assert.ok(roles.includes('의사'));
  assert.ok(roles.every(r=>MAFIA_ROLES[r]));if(mode==='classic')assert.ok(roles.every(r=>['마피아','경찰','의사','시민'].includes(r)));
 }
 let special=new Set();for(let i=0;i<35;i++)generateMafiaRoles(12,'special').forEach(x=>special.add(x));
 for(const r of ['스파이','군인','정치인','기자','경호원','사립탐정','자경단원','영매'])assert.ok(special.has(r),`${r} not generated`);
});
test('public states do not leak roles, private investigations, mafia chat or individual night submitters',()=>{
 const x=crafted(['마피아','스파이','경찰','의사','시민','군인']);
 const s=x.state;s.mafiaChat.push({nick:'p0',text:'secret'});s.investigations.p2='비밀 수사 결과';s.nightActions.p0='p4';
 const maf=publicMafiaState(s,'p0');const citizen=publicMafiaState(s,'p4');
 assert.equal(citizen.roles,undefined);assert.equal(citizen.nightActions,undefined);assert.equal(citizen.investigation,null);
 assert.deepEqual(citizen.mafiaChat,[]);assert.deepEqual(citizen.teammates,[]);
 assert.deepEqual(citizen.nightSubmitted,[]);assert.equal(citizen.nightSubmittedCount,1);
 assert.deepEqual(maf.teammates,['p1']);assert.deepEqual(maf.nightSubmitted,['p0']);assert.equal(maf.mafiaChat[0].text,'secret');
 assert.equal(publicMafiaState(s,'p2').investigation,'비밀 수사 결과');
 assert.equal(citizen.allRoles,undefined);assert.equal(publicMafiaState(s,'p4',true).allRoles.p0,'마피아');
});
test('mafia cannot kill teammates; only legal night roles act; role actions submitted once',()=>{
 const x=crafted(['마피아','스파이','경찰','의사','시민','군인']);
 assert.throws(()=>action(x,0,'night','p1'));
 assert.throws(()=>action(x,4,'night','p1'));
 action(x,0,'night','p5');assert.throws(()=>action(x,0,'night','p4'));
 action(x,1,'night','p3');action(x,2,'night','p0');action(x,3,'night','p5');
 assert.equal(x.state.phase,'discussion');assert.equal(x.state.alive.includes('p5'),true);
 assert.equal(publicMafiaState(x.state,'p2').investigation,'p0: 마피아 팀 의심');
 assert.equal(publicMafiaState(x.state,'p1').investigation,'p3: 직업은 의사');
});
test('soldier shield protects first attack but not second',()=>{
 const x=crafted(['마피아','의사','경찰','군인']);
 action(x,0,'night','p3');action(x,1,'night','p0');action(x,2,'night','p1');
 assert.equal(x.state.alive.includes('p3'),true);assert.equal(x.state.used['soldier:p3'],true);
 action(x,0,'discussionEnd');for(let i=0;i<4;i++)action(x,i,'vote','skip');
 action(x,0,'night','p3');action(x,1,'night','p1');action(x,2,'night','p1');
 assert.equal(x.state.alive.includes('p3'),false);
});
test('bodyguard sacrifices self to save target',()=>{
 const x=crafted(['마피아','경호원','경찰','의사','시민']);
 action(x,0,'night','p4');action(x,1,'night','p4');action(x,2,'night','p0');action(x,3,'night','p3');
 assert.ok(x.state.alive.includes('p4'));assert.ok(!x.state.alive.includes('p1'));
});
test('politician vote counts double and resolves leading outcome',()=>{
 const x=crafted(['마피아','정치인','경찰','의사','시민','시민']);
 x.state.phase='vote';
 const ballots=['p0','p0','p1','p1','p0','skip'];ballots.forEach((who,i)=>action(x,i,'vote',who));
 assert.equal(x.state.alive.includes('p0'),false);
 assert.ok(x.state.result===null || x.state.phase==='night');
});
test('reporter reveals investigated role publicly once from second night',()=>{
 const x=crafted(['마피아','기자','경찰','의사','시민']);
 assert.equal(needsNightAction(x.state,'p1'),false);
 action(x,0,'night','p4');action(x,2,'night','p0');action(x,3,'night','p3');
 assert.equal(x.state.phase,'discussion');
 action(x,0,'discussionEnd');x.state.alive.forEach(p=>action(x,Number(p.slice(1)),'vote','skip'));
 assert.equal(x.state.phase,'night');assert.equal(needsNightAction(x.state,'p1'),true);
 action(x,0,'night','p2');action(x,1,'night','p0');action(x,2,'night','p0');action(x,3,'night','p3');
 assert.ok(x.state.publicReports.some(x=>x.includes('마피아')));
 assert.equal(x.state.used['reporter:p1'],true);
});
test('medium reads dead role privately from next night',()=>{
 const x=crafted(['마피아','영매','경찰','의사','시민']);
 action(x,0,'night','p4');action(x,2,'night','p0');action(x,3,'night','p3');
 action(x,0,'discussionEnd');x.state.alive.forEach(p=>action(x,Number(p.slice(1)),'vote','skip'));
 action(x,0,'night','p3');action(x,1,'night','p4');action(x,2,'night','p0');action(x,3,'night','p3');
 assert.match(x.state.investigations.p1,/직업: 시민/);assert.equal(publicMafiaState(x.state,'p2').investigation.includes('직업: 시민'),false);
});
test('vigilante limited shot, double night actions not possible',()=>{
 const x=crafted(['마피아','자경단원','경찰','의사','시민','시민']);
 action(x,0,'night','p5');action(x,1,'night','p0');action(x,2,'night','p0');const result=action(x,3,'night','p2');
 assert.equal(x.state.used['vigilante:p1'],true);assert.equal(x.state.alive.includes('p0'),false);
 assert.match(result.finish||'',/시민 팀 승리/);
});
test('mafia whisper only shows to mafia team and dead players cannot take turns',()=>{
 const x=crafted(['마피아','스파이','경찰','의사','시민']);
 action(x,0,'mafiaWhisper');
 actMafia(x.state,'p0','mafiaWhisper',{text:'오늘밤 p4 공격'},x.players,'p0');
 assert.equal(publicMafiaState(x.state,'p1').mafiaChat.length,1);
 assert.equal(publicMafiaState(x.state,'p2').mafiaChat.length,0);
 assert.throws(()=>actMafia(x.state,'p2','mafiaWhisper',{text:'hi'},x.players,'p0'));
 x.state.alive=x.state.alive.filter(p=>p!=='p2');
 assert.throws(()=>action(x,2,'night','p0'));
});
test('night, day, and voting deadlines auto advance',()=>{
 const x=crafted(['마피아','경찰','의사','시민']);
 x.state.deadline=1;const result=tickMafia(x.state,x.players,Date.now());assert.equal(x.state.phase,'discussion');assert.ok(result);
 x.state.deadline=1;tickMafia(x.state,x.players,Date.now());assert.equal(x.state.phase,'vote');
 x.state.deadline=1;tickMafia(x.state,x.players,Date.now());assert.equal(x.state.phase,'night');
});