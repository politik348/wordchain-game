import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import {
 createGame,applyAction,chooseCatAction,surrender,TILES,START_CASH,PASS_BONUS,ISLAND_TURNS,
 BAIL_COST,LEVEL_NAMES,buildingCost,upgradeCost,maxBuildLevel,toll,propertyValue,
 countMonopolies,olympicCost,netWorth
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
test('city purchase offers land, villa, building and hotel from the very first turn',()=>{
 let a=newGame();a=landOn(a,'alice',2);
 assert.deepEqual(a.pending,{kind:'purchase',index:2});
 const land=applyAction(a,'alice','buy',{targetLevel:0},low);
 assert.equal(land.properties[2].level,0);assert.equal(land.players[0].cash,START_CASH-125);
 assert.ok(toll(land,2)>0,'bare land still charges a toll');
 for(const level of [1,2,3]){
  const built=applyAction(a,'alice','buy',{targetLevel:level},low);
  assert.equal(built.properties[2].level,level);
  assert.equal(built.players[0].cash,START_CASH-125-upgradeCost(2,0,level));
  assert.ok(toll(built,2)>toll(land,2));
 }
 assert.throws(()=>applyAction(a,'alice','buy',{targetLevel:4},low),/건설 단계/);
 assert.throws(()=>applyAction(land,'bob','roll',{},low),/다른 플레이어/);
});
test('building can reach a hotel without passing start, while a landmark follows the hotel',()=>{
 let s=newGame();s.properties[2]={owner:'alice',level:1};
 assert.equal(s.players[0].laps,0);
 assert.equal(maxBuildLevel(s,'alice',2),3);
 s=landOn(s,'alice',2);
 assert.equal(s.pending?.kind,'upgrade');
 s=applyAction(s,'alice','upgrade',{targetLevel:3},low);
 assert.equal(s.properties[2].level,3);
 assert.equal(s.players[0].laps,0,'building no longer requires a completed lap');
 assert.equal(maxBuildLevel(s,'alice',2),4);
 s=landOn(s,'alice',2);
 assert.equal(s.pending?.kind,'upgrade');
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
test('tourist attractions stay non-buildable but owning both no longer wins or multiplies toll',()=>{
 let s=newGame();s.properties[15]={owner:'alice',level:0};
 const initialToll=toll(s,15);
 s=landOn(s,'alice',21);
 assert.equal(s.pending.kind,'purchase');
 assert.throws(()=>applyAction(s,'alice','buy',{targetLevel:1},low),/건설 단계/);
 s=applyAction(s,'alice','buy',{targetLevel:0},low);
 assert.equal(s.properties[15].owner,'alice');
 assert.equal(s.properties[21].owner,'alice');
 assert.equal(s.winner,null,'tourist pair must never immediately win');
 assert.notEqual(s.phase,'finished');
 assert.equal(toll(s,15),initialToll,'tourist pair no longer doubles toll');
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
  assert.ok(['파산 승리','라인 독점','트리플 컬러 독점','라운드 종료 · 총자산 승리'].includes(s.reason));
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

test('endless mode never ends at a fixed round and ignores every monopoly win',()=>{
 let s=createGame({players,maxRounds:0});
 assert.equal(s.maxRounds,0);
 s.turnCount=9999;s.round=500;
 for(const i of [1,2,4,5,7,8,10,11,15,21])s.properties[i]={owner:'alice',level:0};
 s=setTurn(s,'alice');
 // The 2nd player remains solvent. Buying land must not end a bankruptcy-only match.
 s=landOn(s,'alice',13);
 assert.equal(s.pending?.kind,'purchase');
 s=applyAction(s,'alice','buy',{targetLevel:0},low);
 assert.equal(s.phase,'roll');
 assert.equal(s.winner,null);
 assert.ok(s.turnCount>=9999);
 assert.ok(toll(s,1)>0,'rent remains active after thousands of turns');
 // The game ends only when the other player is eliminated.
 s=surrender(s,'bob');
 assert.equal(s.phase,'finished');
 assert.equal(s.winner,'alice');
 assert.equal(s.reason,'파산 승리');
});

test('endless mode retains long-term rent pressure but finite mode rules unchanged',()=>{
 const unlimited=createGame({players,maxRounds:0});
 unlimited.properties[2]={owner:'alice',level:2};
 const beginning=toll(unlimited,2);
 unlimited.round=30;
 assert.ok(toll(unlimited,2)>beginning);
 const short=createGame({players,maxRounds:8});
 short.properties[2]={owner:'alice',level:2};
 assert.ok(toll(short,2)>0);
});

test('fortune card must be chosen explicitly and applies a visible deterministic reward',()=>{
 let s=landOn(newGame(),'alice',3);
 assert.equal(s.phase,'chance');
 assert.equal(s.pending?.kind,'fortune');
 assert.throws(()=>applyAction(s,'alice','roll',{},low),/주사위/);
 assert.throws(()=>applyAction(s,'alice','pickCard',{index:3},low),/1~3/);
 s=applyAction(s,'alice','pickCard',{index:0},low);
 assert.equal(s.lastCard,'대박 굿즈 출시!');
 assert.equal(s.cardReveal.effect,'cash');
 assert.equal(s.players[0].cash,START_CASH+240);
 assert.equal(s.lastEvent.type,'pickCard');
 assert.ok(s.lastEvent.message.includes('대박 굿즈'));
});

test('fortune card effects: angel, discount, free construction, and instant start',()=>{
 let s=newGame();s.phase='chance';s.pending={kind:'fortune'};
 // rng index=7 for angel, index=8 for discount
 s=applyAction(s,'alice','pickCard',{index:0},()=>7/15+.001);
 assert.equal(s.players[0].angel,1);
 s=newGame();s.phase='chance';s.pending={kind:'fortune'};
 s=applyAction(s,'alice','pickCard',{index:0},()=>8/15+.001);
 assert.equal(s.players[0].discountCards,1);
 s=newGame();s.properties[2]={owner:'alice',level:0};s.players[0].laps=1;s.phase='chance';s.pending={kind:'fortune'};
 s=applyAction(s,'alice','pickCard',{index:0},()=>11/15+.001);
 assert.equal(s.properties[2].level,1);
 s=newGame();s.phase='chance';s.pending={kind:'fortune'};
 s=applyAction(s,'alice','pickCard',{index:0},()=>10/15+.001);
 assert.equal(s.players[0].laps,1);
 assert.equal(s.players[0].cash,START_CASH+PASS_BONUS);
});

test('angel prevents toll, 50 percent card cuts toll and is consumed once',()=>{
 let s=newGame();s.properties[2]={owner:'bob',level:3};s.players[0].angel=1;
 s=landOn(s,'alice',2);
 assert.equal(s.players[0].angel,0);
 assert.equal(s.players[0].cash,START_CASH);
 assert.equal(s.players[1].cash,START_CASH);
 s=newGame();s.properties[2]={owner:'bob',level:3};s.players[0].discountCards=1;
 const expected=Math.round(toll(s,2)*.5/5)*5;
 s=landOn(s,'alice',2);
 assert.equal(s.players[0].cash,START_CASH-expected);
 assert.equal(s.players[0].discountCards,0);
 assert.equal(s.players[1].cash,START_CASH+expected);
});

test('one-time bank loan works in a choice, gets repaid from salary and cannot be duplicated',()=>{
 let s=landOn(newGame(),'alice',2);
 assert.equal(s.phase,'choice');
 s=applyAction(s,'alice','takeLoan',{},low);
 assert.equal(s.phase,'choice');
 assert.equal(s.players[0].cash,START_CASH+450);
 assert.equal(s.players[0].bankDebt,540);
 assert.equal(netWorth(s,'alice'),START_CASH-90);
 assert.throws(()=>applyAction(s,'alice','takeLoan',{},low),/한 번/);
 s=applyAction(s,'alice','buy',{targetLevel:0},low);
 s=setTurn(s,'alice');place(s,'alice',22);
 s=applyAction(s,'alice','roll',{},low);
 assert.equal(s.players[0].bankDebt,320);
 assert.equal(s.players[0].cash,START_CASH+450-125);
 s=setTurn(s,'alice');place(s,'alice',22);
 s=applyAction(s,'alice','roll',{},low);
 assert.equal(s.players[0].bankDebt,100);
 s=setTurn(s,'alice');place(s,'alice',22);
 s=applyAction(s,'alice','roll',{},low);
 assert.equal(s.players[0].bankDebt,0);
 assert.equal(s.players[0].cash,START_CASH+450-125+120);
});

test('AI handles chance and one-time loan without breaking turn flow',()=>{
 let s=createGame({players:[{id:'alice',name:'고양이',ai:true},{id:'bob',name:'밥'}],maxRounds:0});
 s.players[0].cash=120;
 assert.equal(chooseCatAction(s).type,'takeLoan');
 s=applyAction(s,'alice','takeLoan',{},low);
 assert.equal(chooseCatAction(s).type,'roll');
 s.phase='chance';s.pending={kind:'fortune'};
 assert.equal(chooseCatAction(s).type,'pickCard');
 const a=chooseCatAction(s);
 s=applyAction(s,'alice',a.type,a.payload,low);
 assert.notEqual(s.phase,'chance');
});

test('online game room accepts endless mode and legal bank loan, rejects bogus fortune actions',async()=>{
 const host='endless-host-'+Date.now();
 const guest='endless-guest-'+Date.now();
 const room=await request('/api/marble/rooms',{sid:host,name:'Host',rounds:0,turnSeconds:15},201);
 assert.equal(room.rounds,0);
 await request(`/api/marble/rooms/${room.code}/join`,{sid:guest,name:'Guest'});
 let r=await request(`/api/marble/rooms/${room.code}/start`,{sid:host});
 assert.equal(r.state.maxRounds,0);
 await request(`/api/marble/rooms/${room.code}/action`,{sid:guest,type:'takeLoan'},400);
 await request(`/api/marble/rooms/${room.code}/action`,{sid:host,type:'pickCard',payload:{index:0}},400);
 r=await request(`/api/marble/rooms/${room.code}/action`,{sid:host,type:'takeLoan'});
 assert.equal(r.state.players[0].bankDebt,540);
 await request(`/api/marble/rooms/${room.code}/action`,{sid:host,type:'takeLoan'},400);
});

test('bankrupt player with a double bonus never receives another turn',()=>{
 let s=createGame({players:[...players,{id:'charlie',name:'찰리'}],maxRounds:0});
 s.extraRoll=true;s.phase='chance';s.pending={kind:'fortune'};
 s.players[0].cash=0;
 s=applyAction(s,'alice','pickCard',{index:0},()=>13/15+.001); // costly maintenance
 assert.equal(s.players[0].bankrupt,true);
 assert.equal(s.phase,'roll');
 assert.equal(s.players[s.turnIndex].id,'bob');
 assert.equal(s.winner,null);
});

test('v5 ordinary mode supports 20 rounds while endless still has no round limit',()=>{
 const twenty=createGame({players,maxRounds:20});
 assert.equal(twenty.maxRounds,20);
 assert.equal(twenty.round,1);
 const endless=createGame({players,maxRounds:0});
 assert.equal(endless.maxRounds,0);
});

test('v5 online room preserves the selected 20-round length',async()=>{
 const host='round20-host-'+Date.now();
 const guest='round20-guest-'+Date.now();
 const room=await request('/api/marble/rooms',{sid:host,name:'A',rounds:20,turnSeconds:30},201);
 assert.equal(room.rounds,20);
 await request(`/api/marble/rooms/${room.code}/join`,{sid:guest,name:'B'});
 const result=await request(`/api/marble/rooms/${room.code}/start`,{sid:host});
 assert.equal(result.state.maxRounds,20);
});