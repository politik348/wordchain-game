import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMafiaState,actMafia,needsNightAction,tickMafia,publicMafiaState} from '../mafia-engine.mjs';
function play(n,mode){
 const players=Array.from({length:n},(_,i)=>({id:`id${i}`,nick:`플레이어${i}`}));
 const s=createMafiaState(players.map(p=>p.id),mode);
 let outcome=null,steps=0;
 while(!outcome&&steps++<250){
  if(s.phase==='night'){
   const ids=[...s.alive];
   for(const id of ids){
    if(s.phase!=='night')break;
    if(!needsNightAction(s,id))continue;
    const role=s.roles[id],options=(role==='영매'?players.filter(p=>!s.alive.includes(p.id)):players.filter(p=>s.alive.includes(p.id)))
     .filter(p=>!(['경호원','자경단원','기자','사립탐정','스파이','경찰'].includes(role)&&p.id===id))
     .filter(p=>!(role==='마피아'&&(['마피아','스파이'].includes(s.roles[p.id]))));
    const target=options.length?options[Math.floor(Math.random()*options.length)].id:null;
    const type=target?'night':'nightPass';
    const res=actMafia(s,id,type,{target},players,players[0].id);
    if(res.finish){outcome=res.finish;break;}
   }
  } else if(s.phase==='discussion'){
   {s.deadline=1;tickMafia(s,players,Date.now());}
  }else if(s.phase==='vote'){
   for(const id of [...s.alive]){
    const res=actMafia(s,id,'vote',{target:s.alive[Math.floor(Math.random()*s.alive.length)]},players,players[0].id);
    if(res.finish){outcome=res.finish;break;}
   }
  }
 }
 assert.ok(outcome,`game did not end ${n} ${mode}, phase ${s.phase}, alive ${s.alive.length}`);
 assert.ok(/팀 승리/.test(outcome));
 const p=publicMafiaState(s,players[0].id,false);
 assert.equal(p.allRoles,undefined);
 return steps;
}
test('full games 4–12 players all phases terminate without deadlocks',()=>{
 for(const mode of ['classic','special'])for(let n=4;n<=12;n++)for(let iter=0;iter<15;iter++)play(n,mode);
});