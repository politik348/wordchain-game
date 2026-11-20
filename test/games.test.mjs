import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
process.env.NODE_ENV='test';
const {server}=await import('../server.js');
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{server.closeAllConnections();server.close();});
const post=async(uri,body,expected=200)=>{
 const r=await fetch(base+uri,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const json=await r.json();assert.equal(r.status,expected,JSON.stringify(json));return json;
};
const get=async(uri,expected=200)=>{const r=await fetch(base+uri);const json=await r.json();assert.equal(r.status,expected,JSON.stringify(json));return json;};
let seq=0;const sid=()=>`test-player-${++seq}`;
async function make(game,count){
 const players=Array.from({length:count},(_,i)=>({sid:sid(),nick:`플레이어${i+1}`}));
 const cr=await post('/api/rooms',{game,...players[0]},201);let room=cr.room;
 for(const p of players.slice(1)){const joined=await post(`/api/rooms/${room.id}/join`,p);room=joined.room;await post(`/api/rooms/${room.id}/action`,{sid:p.sid,type:'ready'});}
 const started=await post(`/api/rooms/${room.id}/action`,{sid:players[0].sid,type:'start'});
 return {code:room.id,players,room:started.room};
}
const action=async(a,p,type,payload={})=>post(`/api/rooms/${a.code}/action`,{sid:a.players[p].sid,type,payload});
const state=async(a,p=0)=>(await get(`/api/rooms/${a.code}?sid=${a.players[p].sid}`)).room;

test('site entrypoint and health',async()=>{
 const r=await fetch(base+'/');assert.equal(r.status,200);assert.match(await r.text(),/모여게임즈/);
 assert.equal((await get('/api/health')).ok,true);
});

test('lobby code, join, ready, room list, then Omok turn enforcement',async()=>{
 const a=await make('omok',2);assert.equal(a.room.status,'playing');assert.equal(a.room.state.board.length,225);
 const r=await action(a,0,'place',{x:7,y:7});assert.equal(r.room.state.board[7*15+7],'black');
 await post(`/api/rooms/${a.code}/action`,{sid:a.players[0].sid,type:'place',payload:{x:8,y:8}},400);
 const r2=await action(a,1,'place',{x:7,y:8});assert.equal(r2.room.state.board[8*15+7],'white');
});

test('Wordchain initializes round, validates lexicon and turn',async()=>{
 const a=await make('wordchain',2);assert.equal(a.room.state.history.length,1);
 const invalid=await post(`/api/rooms/${a.code}/action`,{sid:a.players[0].sid,type:'word',payload:{word:'없는단어예요'}},400);
 assert.match(invalid.error,/단어 목록/);
 assert.equal((await state(a)).state.turn,a.players[0].sid);
});

test('Doodle accepts strokes only from the artist and chat from other player',async()=>{
 const a=await make('doodle',2);assert.equal(a.room.state.artist,a.players[0].sid);
 await action(a,0,'stroke',{points:[[.1,.2],[.3,.4]],color:'#29283f',width:5});
 assert.equal((await state(a)).state.strokes.length,1);
 await post(`/api/rooms/${a.code}/action`,{sid:a.players[1].sid,type:'stroke',payload:{points:[[.5,.5]]}},403);
 await action(a,1,'chat',{text:'바나나'});
});

test('Liar game keeps word hidden from liar, accepts clues, voting and final guess',async()=>{
 const a=await make('liar',3);const views=await Promise.all(a.players.map((_,i)=>state(a,i)));
 const liarIndex=views.findIndex(v=>v.state.isLiar);assert.ok(liarIndex>=0);assert.equal(views[liarIndex].state.myWord,null);
 assert.ok(views.filter(v=>v.state.myWord).length===2);
 for(let i=0;i<3;i++)await action(a,i,'clue',{text:`힌트 ${i+1}`});
 assert.equal((await state(a)).state.phase,'vote');
 for(let i=0;i<3;i++)await action(a,i,'vote',{target:a.players[liarIndex].sid});
 assert.equal((await state(a)).state.phase,'guess');
 await action(a,liarIndex,'guess',{text:'이것은추측'});
 assert.equal((await state(a)).status,'finished');
});

test('Mafia role visibility, night actions, day discussion and win',async()=>{
 const a=await make('mafia',4);
 const views=await Promise.all(a.players.map((_,i)=>state(a,i)));
 for(let i=0;i<4;i++){assert.ok(['마피아','의사','경찰','시민'].includes(views[i].state.role));assert.equal(views[i].state.roles,undefined);}
 const roles=views.map(v=>v.state.role),maf=roles.indexOf('마피아');
 for(let i=0;i<4;i++)if(roles[i]==='마피아'||roles[i]==='의사'||roles[i]==='경찰'){
   await action(a,i,'night',{target:a.players[roles[i]==='마피아'?(i+1)%4:0].sid});
 }
 let st=(await state(a)).state;
 assert.ok(['discussion','result'].includes(st.phase)||st.result);
 if(st.phase==='discussion'){
   await action(a,0,'discussionEnd');
   const now=(await state(a)).state;
   for(let i=0;i<4;i++)if(now.alive.includes(a.players[i].sid))await action(a,i,'vote',{target:a.players[maf].sid});
   assert.equal((await state(a)).status,'finished');
 }
});

test('Bell awards or penalizes ring when cards are shown',async()=>{
 const a=await make('bell',2);
 await post(`/api/rooms/${a.code}/action`,{sid:a.players[0].sid,type:'ring'},400);
 await new Promise(r=>setTimeout(r,2200));
 const before=await state(a);assert.ok(before.state.draws>=1);
 await action(a,0,'ring');
 const after=await state(a);assert.ok(after.state.scores[a.players[0].sid]>=0);
});

test('Yut turn performs a throw and move or skips back-do',async()=>{
 const a=await make('yut',2);
 assert.equal(a.room.state.pieces[a.players[0].sid].length,4);
 await action(a,0,'roll');const s=(await state(a)).state;
 if(s.pending!==null){await action(a,0,'move',{index:0});}
 assert.equal((await state(a)).status,'playing');
});

test('room participants cannot join a running game',async()=>{
 const a=await make('wordchain',2);
 await post(`/api/rooms/${a.code}/join`,{sid:sid(),nick:'새 참가자'},400);
});

test('SSE broadcasts updated state to a connected room member',async()=>{
 const a=await make('omok',2);
 const response=await fetch(`${base}/api/events?sid=${a.players[1].sid}&code=${a.code}`);
 assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/text\/event-stream/);
 const reader=response.body.getReader();
 let data='';let found=false;
 try{
   await action(a,0,'place',{x:3,y:3});
   for(let i=0;i<6;i++){
     const part=await Promise.race([reader.read(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('SSE timed out')),2000))]);
     data+=new TextDecoder().decode(part.value);
     if(data.includes('"moves":1')){found=true;break;}
   }
 }finally{await reader.cancel();}
 assert.ok(found,'expected a turn update broadcast');
});
