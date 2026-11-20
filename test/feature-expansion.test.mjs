import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {loadDictionary} from '../data/load-lexicon.mjs';
import {dictionaryIndex,replies,validReply,TURN_SECONDS} from '../public/chain-utils.mjs';
const {server}=await import('../server.js');
const words=loadDictionary();
let base,seq=0;
const post=async (path,data,status=200)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await r.json();assert.equal(r.status,status,JSON.stringify(body));return body;};
const sid=()=>`newtest-${++seq}`;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{server.closeAllConnections();server.close();});
async function make(game,options,join=true){
 const a=sid(),b=sid();const cr=await post('/api/rooms',{game,sid:a,nick:'방장',options},201);
 const code=cr.room.id;
 if(join){await post(`/api/rooms/${code}/join`,{sid:b,nick:'참가자'});await post(`/api/rooms/${code}/action`,{sid:b,type:'ready'});}
 return {code,a,b,room:cr.room};
}
const act=(r,sid,type,payload={},status=200)=>post(`/api/rooms/${r.code}/action`,{sid,type,payload},status);
test('expanded dictionary includes dialect noun examples',()=>{
 assert.equal(words.length,437875);
 for(const w of ['꾼내','꾼소리','꾼지람','사과','학교'])assert.ok(words.includes(w),w);
 assert.equal(words.includes('꾼들'),false);
});
test('anti-repeat ending rule is mandatory for all players',()=>{
 assert.equal(validReply('가나다','초가',new Set(['초가']),'wordchain',new Set(['다'])),false);
 assert.equal(validReply('가나다','초가',new Set(['초가']),'wordchain',new Set(['바'])),true);
 assert.equal(validReply('가나다','초가',new Set(['초가']),'kungkungtta',new Set()),true);
 assert.equal(validReply('가나다라','초가',new Set(['초가']),'kungkungtta',new Set()),false);
});
test('no-next-word is detected using the official word index',()=>{
 const idx=new Map([['가',['가라','가구']],['라',['라면']]]);
 assert.deepEqual(replies(idx,'사과',new Set(['사과']),'wordchain',null,3),[]);
 assert.deepEqual(replies(idx,'바가',new Set(['바가']),'wordchain',null,3),['가라','가구']);
 assert.deepEqual(replies(idx,'가라',new Set(['가라']),'wordchain',null,3),['라면']);
 assert.deepEqual(replies(idx,'라면',new Set(['라면']),'wordchain',null,3),[]);
});
test('room settings synchronize 15 sec + kungkungtta, host-only',async()=>{
 const room=await make('wordchain',{turnSeconds:15,wordMode:'kungkungtta'});
 assert.equal(room.room.options.wordMode,'kungkungtta');
 assert.equal(room.room.options.turnSeconds,15);
 await act(room,room.b,'settings',{turnSeconds:60},403);
 await act(room,room.a,'settings',{turnSeconds:30});
 const started=await act(room,room.a,'start');
 assert.equal(started.room.state.timer,30);
 assert.equal(started.room.options.wordMode,'kungkungtta');
 assert.equal(started.room.state.history[0].length,3);
 assert.equal(started.room.state.deadline> Date.now()+29000,true);
 const invalid=await act(room,room.a,'word',{word:'가방'},400);
 assert.match(invalid.error,/정확히 3글자/);
});
test('omok and yut have server-enforced turn deadlines and selected settings',async()=>{
 const a=await make('omok',{stoneStyle:'crazy',turnSeconds:15});
 assert.equal(a.room.options.stoneStyle,'crazy');
 const started=await act(a,a.a,'start');
 assert.ok(started.room.state.deadline>Date.now()+14000);
 const moved=await act(a,a.a,'place',{x:7,y:7});
 assert.equal(moved.room.state.turn,a.b);
 assert.ok(moved.room.state.deadline>Date.now()+14000);
 const b=await make('yut',{turnSeconds:60});
 const yut=await act(b,b.a,'start');
 assert.ok(yut.room.state.deadline>Date.now()+59000);
});
test('server serves both crazy-mode stone images with correct MIME',async()=>{
 for(const name of ['crazy-black.webp','crazy-white.webp']){
  const r=await fetch(base+'/assets/'+name);
  assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/webp/);
  assert.ok((await r.arrayBuffer()).byteLength>5000);
 }
});
test('client configuration includes 15, 30, 45, 60, 90 second presets',()=>{
 assert.deepEqual(TURN_SECONDS,[15,30,45,60,90]);
});
