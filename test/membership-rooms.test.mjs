import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';

// The ordinary integration tests use guest fixtures. Force the real production
// authorization path here to guarantee the public endpoints don't allow bypass.
process.env.NODE_ENV='test';
const {server}=await import('../server.js');
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
test('production multiplayer API requires membership even if client forges a SID',async()=>{
 const original=process.env.NODE_ENV;
 process.env.NODE_ENV='production';
 try{
  const guest='fake-guest-sid';
  const pairs=[
   ['/api/rooms','GET'],
   ['/api/rooms','POST',{game:'omok',sid:guest,nick:'가짜'}],
   ['/api/marble/rooms','POST',{sid:guest,name:'가짜'}]
  ];
  for(const [pathname,method,data] of pairs){
   const response=await fetch(base+pathname,{
    method,headers:data?{'Content-Type':'application/json'}:undefined,
    body:data?JSON.stringify(data):undefined
   });
   assert.equal(response.status,401,pathname+' '+method);
  }
  const health=await fetch(base+'/api/health');
  assert.equal(health.status,200);
 }finally{process.env.NODE_ENV=original;}
});
