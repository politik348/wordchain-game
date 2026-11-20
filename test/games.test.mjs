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
 assert.match(invalid.error,/사전에 없는/);
 assert.equal((await state(a)).state.turn,a.players[0].sid);
});

function connectDoodle(a,p){
 const ws=new WebSocket(base.replace(/^http/,'ws')+`/ws/doodle?code=${a.code}&sid=${a.players[p].sid}`);
 const messages=[];
 ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
 return {ws,messages};
}
async function waitFor(condition,timeout=1800){
 const started=Date.now();while(Date.now()-started<timeout){const v=condition();if(v)return v;await new Promise(r=>setTimeout(r,20));}
 throw Error('Expected WebSocket state was not received');
}
test('Doodle streams strokes and clears over WebSockets instead of POST',async()=>{
 const a=await make('doodle',2);assert.equal(a.room.state.artist,a.players[0].sid);
 const artist=connectDoodle(a,0),viewer=connectDoodle(a,1);
 try{
  await waitFor(()=>artist.messages.find(x=>x.type==='sync')&&viewer.messages.find(x=>x.type==='sync'));
  artist.ws.send(JSON.stringify({type:'stroke',round:a.room.state.round,payload:{points:[[.1,.2],[.3,.4]],color:'#29283f',width:5}}));
  const drawn=await waitFor(()=>viewer.messages.find(x=>x.type==='stroke'));
  assert.equal(drawn.seq,1);assert.deepEqual(drawn.stroke.points,[[.1,.2],[.3,.4]]);
  assert.equal((await state(a)).state.strokes.length,1);
  viewer.ws.send(JSON.stringify({type:'stroke',round:a.room.state.round,payload:{points:[[.2,.2]]}}));
  const refusal=await waitFor(()=>viewer.messages.find(x=>x.type==='error'));
  assert.match(refusal.message,/화가만/);
  await post(`/api/rooms/${a.code}/action`,{sid:a.players[0].sid,type:'stroke',payload:{points:[[.5,.5]]}},426);
  artist.ws.send(JSON.stringify({type:'clear',round:a.room.state.round,payload:{}}));
  const cleared=await waitFor(()=>viewer.messages.find(x=>x.type==='clear'));
  assert.ok(cleared.seq>drawn.seq);
  assert.equal((await state(a)).state.strokes.length,0);
  viewer.ws.send(JSON.stringify({type:'chat',round:a.room.state.round,payload:{text:'이건 뭘까요?'}}));
  await waitFor(()=>viewer.messages.find(x=>x.type==='error')?.message.includes('채팅')||false,100).catch(()=>{});
  await new Promise(r=>setTimeout(r,80));
  assert.equal((await state(a)).state.chat.at(-1).text,'이건 뭘까요?');
 }finally{artist.ws.close();viewer.ws.close();}
});
test('Doodle reconnect sync handles a snapshot larger than 64 KiB',async()=>{
 const a=await make('doodle',2);
 const artist=connectDoodle(a,0);
 let viewer;
 try{
  await waitFor(()=>artist.messages.find(x=>x.type==='sync'));
  const points=Array.from({length:105},(_,i)=>[i/105,(i%19)/19]);
  for(let i=0;i<85;i++)artist.ws.send(JSON.stringify({type:'stroke',round:a.room.state.round,payload:{points,color:'#29283f',width:5}}));
  await waitFor(()=>artist.messages.filter(x=>x.type==='stroke').length>=85,4000);
  viewer=connectDoodle(a,1);
  const sync=await waitFor(()=>viewer.messages.find(x=>x.type==='sync'),4000);
  assert.equal(sync.strokes.length,85);
  assert.equal(sync.seq,85);
  assert.ok(Buffer.byteLength(JSON.stringify(sync))>65535,'snapshot should exercise 64-bit payload length');
 }finally{artist.ws.close();viewer?.ws.close();}
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

test('Yut collects bonus throws, then allows selected toss movement',async()=>{
 const a=await make('yut',2),sidA=a.players[0].sid;
 assert.equal(a.room.state.pieces[sidA].length,4);
 let s=(await state(a)).state,attempts=0;
 while(s.turn===sidA&&s.phase==='throw'&&attempts++<26){
  await action(a,0,'roll');s=(await state(a)).state;
 }
 if(s.turn===sidA&&s.phase==='move'){
  assert.ok(s.rolls.length>0);
  const index=s.rolls.findIndex(n=>n>0);
  if(index>=0){
   await action(a,0,'move',{index:0,rollIndices:[index]});
   s=(await state(a)).state;
   assert.ok(Array.isArray(s.rolls));
  }
 }
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
