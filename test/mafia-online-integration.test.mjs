import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {server} from '../server.js';

let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
async function send(uri,method='GET',data,expected=200){
 const res=await fetch(base+uri,{method,headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
 const json=await res.json();
 assert.equal(res.status,expected,JSON.stringify({uri,json}));
 return json;
}
const post=(uri,data,expected=200)=>send(uri,'POST',data,expected);

test('nine-player special Mafia room is playable through existing online room API with private roles',async()=>{
 const host='mafiahost_9';
 const created=await post('/api/rooms',{game:'mafia',sid:host,nick:'방장',options:{mafiaMode:'special'}},201);
 const code=created.room.id;
 assert.equal(created.room.options.mafiaMode,'special');
 const ids=[host];
 for(let i=1;i<9;i++){
  const sid='mafiaguest_'+i;ids.push(sid);
  const joined=await post('/api/rooms/'+code+'/join',{sid,nick:'게스트'+i});
  assert.equal(joined.room.players.length,i+1);
  await post('/api/rooms/'+code+'/action',{sid,type:'ready',payload:{}});
 }
 const started=await post('/api/rooms/'+code+'/action',{sid:host,type:'start',payload:{}});
 assert.equal(started.room.status,'playing');
 const states=await Promise.all(ids.map(async sid=>(await send('/api/rooms/'+code+'?sid='+sid)).room.state));
 for(const state of states){
  assert.equal(state.mafiaMode,'special');
  assert.equal(state.phase,'night');
  assert.ok(state.deadline>Date.now());
  assert.equal(state.alive.length,9);
  assert.equal(state.roles,undefined);
  assert.equal(state.nightActions,undefined);
  assert.equal(state.investigations,undefined);
  assert.equal(state.allRoles,undefined);
  assert.equal(state.nightSubmittedCount,0);
 }
 const mafiaAt=states.findIndex(s=>s.role==='마피아');
 const spyAt=states.findIndex(s=>s.role==='스파이');
 const townAt=states.findIndex(s=>s.roleInfo?.team==='town');
 assert.ok(mafiaAt>=0&&spyAt>=0&&townAt>=0);
 assert.equal(states[mafiaAt].roleInfo.team,'mafia');
 assert.ok(states[spyAt].teammates.includes(ids[mafiaAt]));
 assert.equal(states[townAt].teammates.length,0);
 const secret='팀만 읽을 수 있는 비밀 테스트';
 const sent=await post('/api/rooms/'+code+'/action',{sid:ids[mafiaAt],type:'mafiaWhisper',payload:{text:secret}});
 assert.equal(sent.room.status,'playing');
 const [mafia,spy,town]=await Promise.all([mafiaAt,spyAt,townAt].map(async i=>(await send('/api/rooms/'+code+'?sid='+ids[i])).room.state));
 assert.ok(mafia.mafiaChat.some(m=>m.text===secret));
 assert.ok(spy.mafiaChat.some(m=>m.text===secret));
 assert.ok(!JSON.stringify(town).includes(secret));
 assert.equal(town.mafiaChat.length,0);
 await post('/api/rooms/'+code+'/action',{sid:ids[townAt],type:'mafiaWhisper',payload:{text:'침입'}},403);
});
