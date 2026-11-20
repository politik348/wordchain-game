import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
const {server}=await import('../server.js');
let base,seq=0;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`;});
after(()=>{server.closeAllConnections();server.close();});
const req=async(url,payload,method='POST')=>{const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});const text=await r.text();assert.ok(r.ok,text);return JSON.parse(text);};
async function make(game){const sidA=`timeout-${++seq}-host`,sidB=`timeout-${++seq}-guest`;
 const room=(await req('/api/rooms',{game,sid:sidA,nick:'A',options:{turnSeconds:15}})).room;
 await req(`/api/rooms/${room.id}/join`,{sid:sidB,nick:'B'});
 await req(`/api/rooms/${room.id}/action`,{sid:sidB,type:'ready'});
 await req(`/api/rooms/${room.id}/action`,{sid:sidA,type:'start'});
 return {id:room.id,a:sidA,b:sidB};
}
test('15s timers: omok forfeits, yut passes, wordchain displays 3 hints to timed-out player',async()=>{
 const [omok,yut,chain]=await Promise.all(['omok','yut','wordchain'].map(make));
 await new Promise(r=>setTimeout(r,15900));
 const [o,y,c]=await Promise.all([[omok,omok.a],[yut,yut.a],[chain,chain.a]].map(([r,s])=>req(`/api/rooms/${r.id}?sid=${s}`,null,'GET')));
 assert.equal(o.room.status,'finished');assert.match(o.room.state.result,/시간 초과/);
 assert.equal(y.room.state.turn,yut.b);
 assert.equal(c.room.state.hearts[chain.a],1);
 assert.equal(c.room.state.hints.for,chain.a);
 assert.equal(c.room.state.hints.words.length,3);
 const other=await req(`/api/rooms/${chain.id}?sid=${chain.b}`,null,'GET');
 assert.equal(other.room.state.hints,undefined,'other player should not see tips');
});
