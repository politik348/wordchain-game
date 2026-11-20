import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import {
 createGame,applyAction,chooseCatAction,surrender,TILES,START_CASH,PASS_BONUS,ISLAND_TURNS,
 BAIL_COST,LEVEL_NAMES,buildingCost,upgradeCost,maxBuildLevel,toll,propertyValue,
 countMonopolies,tourismComplete,olympicCost,netWorth
} from '../public/marble/engine.mjs';
import {handleMarbleRequest} from '../marble-server.mjs';
const players=[{id:'alice',name:'앨리스'},{id:'bob',name:'밥'}];
const newGame=()=>createGame({players,maxRounds:8});
const low=()=>0;
const high=()=>0.999;
const place=(s,id,pos)=>{const p=s.players.find(x=>x.id===id);p.position=pos;return s;};
const setTurn=(s,id)=>{s.turnIndex=s.players.findIndex(x=>x.id===id);s.phase='roll';s.pending=null;s.extraRoll=false;s.doubles=0;return s;};
function landOn(s,id,index,rng=low){
 s=setTurn(s,id);place(s,id,(index+22)%24); // roll 1+1 => +2
 return applyAction(s,id,'roll',{},rng);
}
test('24-slot map, city pairs, scenic tourism and corner spaces',()=>{
 assert.equal(TILES.length,24);
 assert.equal(TILES.filter(x=>x.kind==='city').length,16);
 assert.equal(TILES.filter(x=>x.kind==='tourist').length,2);
 assert.equal(TILES[6].kind,'island');assert.equal(TILES[12].kind,'olympic');assert.equal(TILES[18].kind,'travel');
 assert.equal(newGame().players[0].cash,START_CASH);
 assert.deepEqual(LEVEL_NAMES,['토지','별장','빌딩','호텔','랜드마크']);
 assert.throws(()=>createGame({players:[players[0]]}),/2~4/);
 assert.throws(()=>createGame({players:[players[0],players[0]]}),/중복/);
});
test('buy bare land or buy city together with first villa',()=>{
 let a=newGame();a=landOn(a,'alice',2);
 assert.deepEqual(a.pending,{kind:'purchase',index:2});
 const land=applyAction(a,'alice','buy',{targetLevel:0},low);
 assert.equal(land.properties[2].level,0);assert.equal(land.players[0].cash,START_CASH-125);
 assert.ok(toll(land,2)>0,'bare land must still charge a toll');
 const villa=applyAction(a,'alice','buy',{targetLevel:1},low);
 assert.equal(villa.properties[2].level,1);assert.equal(villa.players[0].cash,START_CASH-125-buildingCost(2,0));
 assert.ok(toll(villa,2)>toll(land,2));
 assert.throws(()=>applyAction(a,'alice','buy',{targetLevel:2},low),/건물/);
 assert.throws(()=>applyAction(villa,'bob','roll',{},low),/다른 플레이어/);
});
test('building stages unlock after passing start; landmark after hotel',()=>{
 let s=newGame();s.properties[2]={owner:'alice',level:1};
 assert.equal(maxBuildLevel(s,'alice',2),1);
 s=landOn(s,'alice',2);assert.notEqual(s.phase,'choice','cannot make building 2 before first lap');
 s=newGame();s.properties[2]={owner:'alice',level:1};s.players[0].laps=1;
 s=landOn(s,'alice',2);assert.equal(s.pending?.kind,'upgrade');
 assert.throws(()=>applyAction(s,'alice','upgrade',{targetLevel:3},low),/단계/);
 s=applyAction(s,'alice','upgrade',{targetLevel:2},low);
 assert.equal(s.properties[2].level,2);
 s=newGame();s.properties[2]={owner:'alice',level:2};s.players[0].laps=2;
 s=landOn(s,'alice',2);s=applyAction(s,'alice','upgrade',{targetLevel:3},low);
 assert.equal(s.properties[2].level,3);
 s=setTurn(s,'alice');s=landOn(s,'alice',2);
 s=applyAction(s,'alice','upgrade',{targetLevel:4},low);
 assert.equal(s.properties[2].level,4);
 assert.equal(maxBuildLevel(s,'alice',2),4);
});
test('opponent pays toll before takeover and full double asset value is paid to seller',()=>{
 let s=newGame();s.properties[2]={owner:'bob',level:1};
 s=landOn(s,'alice',2);
 const due=toll(s,2),afterToll=s.players.find(p=>p.id==='alice').cash;
 assert.equal(afterToll,START_CASH-due);assert.equal(s.pending?.kind,'takeover');
 const price=propertyValue(2,1)*2;
 s=applyAction(s,'alice','takeover',{},low);
 assert.equal(s.properties[2].owner,'alice');
 assert.equal(s.players[0].cash,START_CASH-due-price);
 assert.equal(s.players[1].cash,START_CASH+due+price);
});
test('landmarks and tourist attractions are protected from takeover',()=>{
 let s=newGame();s.properties[2]={owner:'bob',level:4};
 s=landOn(s,'alice',2);assert.notEqual(s.pending?.kind,'takeover');
 assert.equal(s.properties[2].owner,'bob');
 s=newGame();s.properties[15]={owner:'bob',level:0};
 s=landOn(s,'alice',15);
 assert.notEqual(s.pending?.kind,'takeover');assert.equal(s.properties[15].owner,'bob');
});
test('color monopoly multiplies toll; losing one city removes it',()=>{
 const s=newGame();s.properties[1]={owner:'alice',level:1};
 const t=toll(s,1);s.properties[2]={owner:'alice',level:0};
 assert.equal(countMonopolies(s,'alice'),1);assert.equal(toll(s,1),t*2);
 s.properties[2].owner='bob';assert.equal(countMonopolies(s,'alice'),0);assert.equal(toll(s,1),t);
});
test('tourist attractions are unbuildable; owning both immediately wins',()=>{
 let s=newGame();s.properties[15]={owner:'alice',level:0};
 s=landOn(s,'alice',21);
 assert.equal(s.pending.kind,'purchase');
 assert.throws(()=>applyAction(s,'alice','buy',{targetLevel:1},low),/건물/);
 s=applyAction(s,'alice','buy',{targetLevel:0},low);
 assert.equal(tourismComplete(s,'alice'),true);
 assert.equal(s.winner,'alice');assert.equal(s.reason,'관광지 독점');
});
test('triple color and line monopoly trigger strategic wins',()=>{
 let s=newGame();
 for(const i of [1,2,4,5,7])s.properties[i]={owner:'alice',level:0};
 s=landOn(s,'alice',8);s=applyAction(s,'alice','buy',{targetLevel:0},low);
 assert.equal(s.reason,'트리플 컬러 독점');
 s=newGame();for(const i of [1,2,4])s.properties[i]={owner:'alice',level:0};
 s=landOn(s,'alice',5);s=applyAction(s,'alice','buy',{targetLevel:0},low);
 assert.equal(s.reason,'라인 독점');
});
test('three doubles force island, which permits bail, doubles, or waiting',()=>{
 let s=newGame();s=landOn(s,'alice',2);
 s=applyAction(s,'alice','pass',{},low);
 s=applyAction(s,'alice','roll',{},low); // +2 => index4
 s=applyAction(s,'alice','pass',{},low);
 s=applyAction(s,'alice','roll',{},low);
 assert.equal(s.players[0].position,6);
 assert.equal(s.players[0].stuck,ISLAND_TURNS);
 s=setTurn(s,'alice');s.phase='island';s.pending={kind:'island'};
 s=applyAction(s,'alice','payBail',{},low);assert.equal(s.phase,'roll');
 assert.equal(s.players[0].cash,START_CASH-BAIL_COST);
 let other=newGame();other.players[0].position=6;other.players[0].stuck=3;other.phase='island';other.pending={kind:'island'};
 other=applyAction(other,'alice','islandRoll',{},low);assert.equal(other.players[0].stuck,0);
 assert.equal(other.players[0].position,8);
 let waiting=newGame();waiting.players[0].position=6;waiting.players[0].stuck=3;waiting.phase='island';waiting.pending={kind:'island'};
 let n=0;waiting=applyAction(waiting,'alice','islandRoll',{},()=>n++%2?0.2:0);
 assert.equal(waiting.players[0].stuck,2);assert.equal(waiting.turnIndex,1);
});
test('world travel activates at the next own turn, not immediately',()=>{
 let s=newGame();s.players[0].position=16;
 s=applyAction(s,'alice','roll',{},low); // double two -> travel at 18, keeps extra roll
 assert.equal(s.players[0].position,18);
 assert.equal(s.players[0].travelTicket,true);
 assert.equal(s.phase,'roll'); // double immediately grants bonus throw, but ticket stays for next normal turn
 s=applyAction(s,'alice','roll',{},()=>0.25); // 2+2 -> index22, double
 if(s.phase==='choice')s=applyAction(s,'alice','pass',{},low);
 // Directly test the ticket state before a regular turn.
 s=setTurn(s,'bob');s.phase='choice';s.pending={kind:'purchase',index:1};s.extraRoll=false;
 // A real pass moves the next turn to the ticket holder.
 s=applyAction(s,'bob','pass',{},low);
 assert.equal(s.phase,'travel');assert.equal(s.players[s.turnIndex].id,'alice');
 assert.throws(()=>applyAction(s,'alice','travel',{index:18},low),/목적지/);
 s=applyAction(s,'alice','travel',{index:23},low);
 assert.equal(s.players[0].position,23);assert.equal(s.players[0].travelTicket,false);
 assert.equal(s.pending?.kind,'purchase');
});
test('passing start awards salary and exact landing offers special construction',()=>{
 let s=newGame();s.properties[2]={owner:'alice',level:1};s.players[0].laps=0;s.players[0].position=22;
 s=applyAction(s,'alice','roll',{},low);
 assert.equal(s.players[0].position,0);assert.equal(s.players[0].laps,1);
 assert.equal(s.players[0].cash,START_CASH+PASS_BONUS);
 assert.equal(s.pending?.kind,'startBuild');
 s=applyAction(s,'alice','startBuild',{index:2,targetLevel:2},low);
 assert.equal(s.properties[2].level,2);
});
test('Olympic hosting raises a chosen property toll up to fivefold',()=>{
 let s=newGame();s.properties[2]={owner:'alice',level:1};
 const base=toll(s,2);
 for(let k=2;k<=5;k++){
  s=landOn(s,'alice',12);
  assert.equal(s.pending?.kind,'olympic');
  const cost=olympicCost(s,2);
  assert.ok(cost>0);
  s=applyAction(s,'alice','olympic',{index:2},low);
  assert.equal(s.olympics[2],k);
  assert.equal(toll(s,2),base*k);
 }
 s=landOn(s,'alice',12);assert.notEqual(s.pending?.kind,'olympic');
});
test('odd/even dice tokens spend exactly three uses and respect chosen parity',()=>{
 let s=newGame();
 for(let k=0;k<3;k++){
  s=setTurn(s,'alice');s=applyAction(s,'alice','roll',{parity:'odd'},()=>0.1);
  assert.equal(s.lastEvent.dice.total%2,1);
 }
 assert.equal(s.players[0].parityUses,0);
 s=setTurn(s,'alice');assert.throws(()=>applyAction(s,'alice','roll',{parity:'even'},low),/홀짝/);
});
test('AI always chooses legal moves and games terminate for multiple seeded simulations',()=>{
 for(let seed=1;seed<=30;seed++){
  let x=seed;const rng=()=>{x=(1664525*x+1013904223)>>>0;return x/2**32;};
  let s=createGame({players:[{id:'a',name:'A',ai:true},{id:'b',name:'B',ai:true}],maxRounds:8});
  for(let i=0;i<1600&&s.phase!=='finished';i++){
   const p=s.players[s.turnIndex],a=chooseCatAction(s);
   assert.ok(a,`missing AI action at ${i}, phase ${s.phase}`);
   s=applyAction(s,p.id,a.type,a.payload||{},rng);
   assert.ok(s.players.every(p=>p.cash>=0));
  }
  assert.equal(s.phase,'finished',`seed ${seed}`);assert.ok(s.winner);
  assert.ok(['파산 승리','라인 독점','트리플 컬러 독점','관광지 독점','라운드 종료 · 총자산 승리'].includes(s.reason));
  assert.ok(netWorth(s,s.winner)>=0);
 }
});
test('win via bankruptcy and user surrender',()=>{
 let s=newGame();s=surrender(s,'alice');assert.equal(s.winner,'bob');assert.equal(s.reason,'파산 승리');
});
test('every action sends replayable event, property and money deltas',()=>{
 let s=newGame();s=landOn(s,'alice',2);
 assert.equal(s.actionSeq,1);assert.equal(s.lastEvent.actor,'alice');assert.equal(s.lastEvent.to,2);
 s=applyAction(s,'alice','buy',{targetLevel:1},low);
 assert.equal(s.actionSeq,2);assert.equal(s.lastEvent.propertyChanges[0].kind,'purchase');
 assert.ok(s.lastEvent.moneyChanges.some(x=>x.id==='alice'&&x.delta===-(125+buildingCost(2,0))));
 assert.deepEqual(s.events.map(e=>e.seq),[2,1]);
});
let server,origin;
before(async()=>{
 server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost');if(!await handleMarbleRequest(req,res,u.pathname)){res.writeHead(404);res.end();}});
 server.listen(0,'127.0.0.1');await once(server,'listening');origin=`http://127.0.0.1:${server.address().port}`;
});
after(()=>{server.closeAllConnections();server.close();});
async function request(uri,data,status=200){const res=await fetch(origin+uri,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const json=await res.json();assert.equal(res.status,status,JSON.stringify(json));return json;}
test('online server handles new legal actions and rejects forged/out-of-turn actions',async()=>{
 const one=await request('/api/marble/rooms',{sid:'tester_001',name:'A',rounds:8},201);
 assert.match(one.code,/^[0-9A-F]{6}$/);
 const two=await request(`/api/marble/rooms/${one.code}/join`,{sid:'tester_002',name:'B'});assert.equal(two.players.length,2);
 let s=await request(`/api/marble/rooms/${one.code}/start`,{sid:'tester_001'});assert.equal(s.state.phase,'roll');
 await request(`/api/marble/rooms/${one.code}/action`,{sid:'tester_002',type:'roll'},400);
 await request(`/api/marble/rooms/${one.code}/action`,{sid:'tester_001',type:'stealEverything'},400);
 s=await request(`/api/marble/rooms/${one.code}/action`,{sid:'tester_001',type:'roll',payload:{parity:'even',a:6,b:6}});
 assert.equal(s.state.lastEvent.dice.total%2,0);
 assert.equal(s.state.players[0].parityUses,2);
 await request(`/api/marble/rooms/${one.code}/action`,{sid:'stranger123',type:'roll'},403);
 await request(`/api/marble/rooms/${one.code}/leave`,{sid:'tester_002'});
 const end=await request(`/api/marble/rooms/${one.code}?sid=tester_001`);
 assert.equal(end.state.winner,'tester_001');
});