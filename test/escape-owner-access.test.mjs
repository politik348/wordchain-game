import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const dir=await mkdtemp(path.join(tmpdir(),'moyeo-escape-access-'));
process.env.NODE_ENV='test';
process.env.AUTH_STORE_PATH=path.join(dir,'accounts.json');
process.env.MOYEO_ADMIN_KEY='moyeo-escape-test-secret-only-do-not-deploy-1234567890';
const {server}=await import('../server.js');
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dir,{force:true,recursive:true});});
const admin=process.env.MOYEO_ADMIN_KEY;
async function get(route,cookie,adminSecret){
 const response=await fetch(base+route,{headers:{...(cookie?{Cookie:cookie}:{}),...(adminSecret?{Authorization:'Bearer '+adminSecret}:{})},redirect:'manual'});
 const raw=await response.text();let data;try{data=JSON.parse(raw);}catch{data=raw;}
 return {status:response.status,data,cache:response.headers.get('cache-control'),cookie:response.headers.get('set-cookie')};
}
async function post(route,body,adminSecret){
 const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(adminSecret?{Authorization:'Bearer '+adminSecret}:{})},body:JSON.stringify(body)});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
}
test('escape content files are private while the entry and owner-approval pages are public',async()=>{
 for(const url of ['/escape/index.html','/escape/game.js','/escape/styles.css']){
  const denied=await get(url);
  assert.equal(denied.status,401,url);
  assert.ok(!String(denied.data).includes('gameScreen'),url);
 }
 for(const url of ['/escape-access/index.html','/admin-escape.html']){
  const page=await get(url);assert.equal(page.status,200,url);
 }
 const status=await get('/api/escape/access');
 assert.equal(status.status,200);
 assert.equal(status.data.authenticated,false);
 assert.equal(status.data.approved,false);
});
test('admin-only owner consent is bound to registered account and can be revoked',async()=>{
 const pending=await post('/api/admin/escape-access',{dripNickname:'탐험가',approve:true});
 assert.equal(pending.status,403);
 const missing=await post('/api/admin/escape-access',{dripNickname:'가입전',approve:true},admin);
 assert.equal(missing.status,404);
 const invitation=await post('/api/admin/invites',{dripNickname:'탐험가',code:'7015'},admin);
 assert.equal(invitation.status,201);
 const verify=await post('/api/auth/verify',{dripNickname:'탐험가',code:'7015'});
 assert.equal(verify.status,200);
 const register=await post('/api/auth/register',{registrationToken:verify.data.registrationToken,username:'escapeuser',password:'TestingPassword2026!'});
 assert.equal(register.status,201,JSON.stringify(register.data));
 const cookie=register.cookie.split(';')[0];
 const initial=await get('/api/escape/access',cookie);
 assert.equal(initial.data.authenticated,true);
 assert.equal(initial.data.approved,false);
 for(const url of ['/escape/index.html','/escape/game.js','/escape/styles.css']){
  assert.equal((await get(url,cookie)).status,403,url);
 }
 const unauthorized=await post('/api/admin/escape-access',{dripNickname:'탐험가',approve:true},'incorrect-admin-key-xxxxxxxxxxxxxxxxxxxxxxxx');
 assert.equal(unauthorized.status,403);
 const approved=await post('/api/admin/escape-access',{dripNickname:'탐험가',approve:true},admin);
 assert.equal(approved.status,200);
 assert.equal(approved.data.account.username,'escapeuser');
 assert.equal(approved.data.approved,true);
 const granted=await get('/api/escape/access',cookie);
 assert.equal(granted.data.approved,true);
 for(const url of ['/escape/index.html','/escape/game.js','/escape/styles.css']){
  const response=await get(url,cookie);
  assert.equal(response.status,200,url);
  assert.match(response.cache,/private, no-store/);
  assert.ok(response.data.length>500,url);
 }
 const list=await get('/api/admin/escape-access',null,admin);
 assert.equal(list.status,200);
 assert.ok(list.data.members.some(m=>m.username==='escapeuser'&&m.approved));
 const revoked=await post('/api/admin/escape-access',{username:'escapeuser',approve:false},admin);
 assert.equal(revoked.status,200);
 assert.equal(revoked.data.approved,false);
 assert.equal((await get('/api/escape/access',cookie)).data.approved,false);
 assert.equal((await get('/escape/index.html',cookie)).status,403);
 assert.equal((await get('/escape/game.js',cookie)).status,403);
 assert.equal((await get('/escape-access/index.html',cookie)).status,200);
});
