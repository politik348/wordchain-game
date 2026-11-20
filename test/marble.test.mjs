import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createGame,applyAction,chooseCatAction,surrender,TILES,toll,netWorth,buildingCost,countMonopolies} from '../public/marble/engine.mjs';
import http from 'node:http';
import {handleMarbleRequest} from '../marble-server.mjs';
const playerList=[{id:'alice',name:'앨리스'},{id:'bob',name:'밥'}];
const newGame=()=>createGame({players:playerList,maxRounds:8});
const zero=()=>0;
const mark={count:0};
function advanceChoice(s){
 const p=s.players[s.turnIndex];
 if(s.phase==='choice')return applyAction(s,p.id,s.pending.kind==='purchase'?'buy':s.pending.kind==='upgrade'?'upgrade':'pass',{},zero);
 return s;
}
test('initial map has 24 slots and supports balanced 2-4 player setup',()=>{
 assert.equal(TILES.length,24);
 assert.equal(TILES.filter(t=>t.kind==='city').length,16);
 const s=newGame();assert.equal(s.players.length,2);assert.equal(s.phase,'roll');assert.equal(s.players[0].cash,1600);
 assert.throws(()=>createGame({players:[playerList[0]]}),/2~4/);
 assert.throws(()=>createGame({players:[playerList[0],playerList[0]]}),/중복/);
});
test('roll/land/purchase deducts money and retains extra turn on double',()=>{
 let s=newGame();s=applyAction(s,'alice','roll',{},zero);
 assert.equal(s.players[0].position,2);assert.deepEqual(s.pending,{kind:'purchase',index:2});
 assert.equal(s.lastRoll.total,2);
 s=applyAction(s,'alice','buy',{},zero);
 assert.equal(s.properties[2].owner,'alice');assert.equal(s.players[0].cash,1475);assert.equal(s.turnIndex,0);
 assert.equal(s.phase,'roll');
 assert.throws(()=>applyAction(s,'bob','roll',{},zero),/다른 플레이어/);
});
test('three consecutive double rolls send current player to island',()=>{
 let s=newGame();s=applyAction(s,'alice','roll',{},zero);s=applyAction(s,'alice','pass',{},zero);
 s=applyAction(s,'alice','roll',{},zero);s=applyAction(s,'alice','pass',{},zero);
 s=applyAction(s,'alice','roll',{},zero);
 assert.equal(s.players[0].position,12);assert.equal(s.players[0].stuck,1);assert.equal(s.turnIndex,1);
});
test('non-owners pay toll, and color monopolies double it',()=>{
 let s=newGame();s.properties[1]={owner:'bob',level:2};s.properties[2]={owner:'bob',level:1};
 assert.equal(countMonopolies(s,'bob'),1);
 assert.ok(toll(s,1)>TILES[1].price*0.26*2);
 s.players[0].position=23;
 s=applyAction(s,'alice','roll',{},zero); // 23 + 2 -> position 1; passes start
 assert.equal(s.players[0].position,1);
 assert.equal(s.players[1].cash,1600+toll(s,1));
 assert.equal(s.players[0].cash,1600+180-toll(s,1));
 assert.equal(s.phase,'choice');
 assert.equal(s.pending.kind,'takeover');
 s=applyAction(s,'alice','pass',{},zero);
 assert.equal(s.phase,'roll');
});
test('upgrading own property builds landmarks and blocks takeover',()=>{
 let s=newGame();s.properties[2]={owner:'alice',level:3};s.players[0].position=0;
 s=applyAction(s,'alice','roll',{},zero);assert.equal(s.pending?.kind,'upgrade');
 const cost=buildingCost(2,3);s=applyAction(s,'alice','upgrade',{},zero);
 assert.equal(s.properties[2].level,4);assert.equal(s.players[0].cash,1600-cost);
});
test('travel requires a legal destination and can buy an unowned city',()=>{
 let s=newGame();s.phase='travel';s.pending={kind:'travel'};
 assert.throws(()=>applyAction(s,'alice','travel',{index:18}),/다시 선택/);
 s=applyAction(s,'alice','travel',{index:23},zero);
 assert.equal(s.players[0].position,23);assert.equal(s.pending.kind,'purchase');
});
test('conceding during an online match immediately gives remaining player the win',()=>{
 let s=newGame();s=surrender(s,'alice');
 assert.equal(s.phase,'finished');assert.equal(s.winner,'bob');assert.equal(s.reason,'파산 승리');
});
test('time limit resolves winner by net worth; AI takes only legal actions',()=>{
 let x=123456789;const rng=()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};
 let s=createGame({players:[{id:'a',name:'A',ai:true},{id:'b',name:'B',ai:true}],maxRounds:8});
 for(let i=0;i<1000 && s.phase!=='finished';i++){
  const p=s.players[s.turnIndex],act=chooseCatAction(s);
  assert.ok(act,`No AI action at step ${i} phase=${s.phase}`);
  s=applyAction(s,p.id,act.type,act.payload||{},rng);
  assert.ok(s.players.every(p=>p.cash>=0));
 }
 assert.equal(s.phase,'finished');assert.ok(['파산 승리','라인 독점','트리플 컬러 독점','라운드 종료 · 총자산 승리'].includes(s.reason));
 assert.ok(netWorth(s,s.winner)>=0);
});
let server,origin;
before(async()=>{
 server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(!await handleMarbleRequest(req,res,u.pathname)){res.writeHead(404);res.end();}});
 server.listen(0,'127.0.0.1');await once(server,'listening');origin=`http://127.0.0.1:${server.address().port}`;
});
after(()=>{server.closeAllConnections();server.close();});
async function request(uri,body,expected=200){const res=await fetch(origin+uri,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await res.json();assert.equal(res.status,expected,JSON.stringify(data));return data;}
test('online rooms: create, join, start, reject wrong-turn cheating, make server-side roll',async()=>{
 const one=await request('/api/marble/rooms',{sid:'tester_001',name:'A',rounds:8},201);
 assert.match(one.code,/^[0-9A-F]{6}$/);assert.equal(one.status,'lobby');
 let two=await request(`/api/marble/rooms/${one.code}/join`,{sid:'tester_002',name:'B'});
 assert.equal(two.players.length,2);
 const start=await request(`/api/marble/rooms/${one.code}/start`,{sid:'tester_001'});
 assert.equal(start.state.phase,'roll');
 await request(`/api/marble/rooms/${one.code}/action`,{sid:'tester_002',type:'roll'},400);
 const rolled=await request(`/api/marble/rooms/${one.code}/action`,{sid:'tester_001',type:'roll',payload:{a:6,b:6}});
 assert.ok(rolled.state.players[0].position>=2&&rolled.state.players[0].position<=12);
 if(rolled.state.lastRoll)assert.equal(rolled.state.lastRoll.total,rolled.state.lastRoll.a+rolled.state.lastRoll.b);
 await request(`/api/marble/rooms/${one.code}/action`,{sid:'stranger123',type:'roll'},403);
 await request(`/api/marble/rooms/${one.code}/leave`,{sid:'tester_002'});
 const end=await request(`/api/marble/rooms/${one.code}?sid=tester_001`);
 assert.equal(end.state.winner,'tester_001');
});
