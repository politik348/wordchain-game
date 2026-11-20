import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createSoloRummikub,soloPlayRummikub,catPlayRummikub,soloRoom} from '../public/rummikub/solo.mjs';
const {server}=await import('../server.js');
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();server.close();});
async function post(url,data,code=200){
 const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 const x=await r.json();assert.equal(r.status,code,JSON.stringify(x));return x;
}
async function get(url){
 const r=await fetch(base+url);assert.equal(r.status,200,url);return r;
}
test('new home offers both games and Marble assets/API are served',async()=>{
 const app=await (await get('/app.js')).text();
 assert.match(app,/id:'rummikub'/);
 assert.match(app,/id:'marble'/);
 assert.match(app,/고양이를 이겨라/);
 const html=await (await get('/marble/index.html')).text();
 assert.match(html,/모여마블/);
 assert.match(await (await get('/marble/app.mjs')).text(),/chooseCatAction/);
 const health=await (await get('/api/marble/health')).json();
 assert.equal(health.ok,true);
});
test('Rummikub joins through existing rooms and never reveals opponent racks',async()=>{
 const host='rummikub-user-host',guest='rummikub-user-guest';
 const created=await post('/api/rooms',{game:'rummikub',sid:host,nick:'나',options:{turnSeconds:60}},201);
 const code=created.room.id;
 assert.equal(created.room.options.turnSeconds,60);
 await post('/api/rooms/'+code+'/join',{sid:guest,nick:'친구'});
 await post('/api/rooms/'+code+'/action',{sid:guest,type:'ready'});
 const started=await post('/api/rooms/'+code+'/action',{sid:host,type:'start'});
 assert.equal(started.room.status,'playing');
 assert.equal(started.room.state.hand.length,14);
 assert.equal(started.room.state.remaining,106-28);
 assert.equal(started.room.state.counts[guest],14);
 assert.equal(started.room.state.bag,undefined);
 assert.equal(started.room.state.hands,undefined);
 const other=(await (await get('/api/rooms/'+code+'?sid='+guest)).json()).room;
 assert.equal(other.state.hand.length,14);
 assert.notDeepEqual(other.state.hand,started.room.state.hand);
 const onTurn=started.room.state.turn;
 const drawn=await post('/api/rooms/'+code+'/action',{sid:onTurn,type:'rkDraw'});
 assert.equal(drawn.room.state.counts[onTurn],15);
 assert.notEqual(drawn.room.state.turn,onTurn);
 await post('/api/rooms/'+code+'/action',{sid:onTurn,type:'rkDraw'},403);
});
test('Rummikub Cat AI responds to a legal solo draw',()=>{
 const solo=createSoloRummikub(60);
 assert.equal(soloRoom(solo).state.hand.length,14);
 soloPlayRummikub(solo,'rkDraw');
 assert.equal(solo.engine.turn,'cat');
 assert.equal(catPlayRummikub(solo),true);
 assert.equal(solo.engine.turn,'player');
 assert.equal(solo.engine.hands.cat.length>=0,true);
});
