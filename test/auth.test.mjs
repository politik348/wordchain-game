import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const dir=await mkdtemp(path.join(tmpdir(),'moyeo-auth-test-'));
process.env.MOYEO_ADMIN_KEY='0123456789abcdefghijklmnopqrstuvwxyz-TEST-ONLY-0123456789';
process.env.AUTH_STORE_PATH=path.join(dir,'auth.json');
const {handleAccountRequest,requireAuthenticatedAccount,multiplayerAccount}=await import('../auth.mjs');
const server=http.createServer(async(req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname;
 const handled=await handleAccountRequest(req,res,route);
 if(!handled){res.writeHead(404);res.end('not found');}
});
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dir,{force:true,recursive:true});});
async function post(route,payload,admin=null,cookie=null){
 const headers={'Content-Type':'application/json'};
 if(admin)headers.Authorization='Bearer '+admin;
 if(cookie)headers.Cookie=cookie;
 const response=await fetch(base+route,{method:'POST',headers,body:JSON.stringify(payload)});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
}
const admin=process.env.MOYEO_ADMIN_KEY;
test('admin-issued 4-digit codes are nickname-bound and spent once',async()=>{
 const nonAdmin=await post('/api/admin/invites',{dripNickname:'테스터',code:'0123'});
 assert.equal(nonAdmin.status,403);
 const issue=await post('/api/admin/invites',{dripNickname:'테스터',code:'0123'},admin);
 assert.equal(issue.status,201);assert.equal(issue.data.code,'0123');
 let bad=await post('/api/auth/verify',{dripNickname:'다른사람',code:'0123'});
 assert.equal(bad.status,400);
 bad=await post('/api/auth/verify',{dripNickname:'테스터',code:'9999'});
 assert.equal(bad.status,400);
 const verified=await post('/api/auth/verify',{dripNickname:'테스터',code:'0123'});
 assert.equal(verified.status,200);
 assert.equal(verified.data.registrationToken.length,64);
 const register=await post('/api/auth/register',{registrationToken:verified.data.registrationToken,username:'tester123',password:'SecurePassword2026!'});
 assert.equal(register.status,201,JSON.stringify(register.data));
 assert.equal(register.data.account.dripNickname,'테스터');
 assert.ok(register.cookie.includes('HttpOnly')&&register.cookie.includes('SameSite=Lax'));
 assert.ok(!register.data.account.passwordHash);
 const repeated=await post('/api/auth/register',{registrationToken:verified.data.registrationToken,username:'another',password:'SecurePassword2026!'});
 assert.equal(repeated.status,403);
 const file=await readFile(process.env.AUTH_STORE_PATH,'utf8');
 assert.ok(!file.includes('SecurePassword2026!'));
 assert.ok(!file.includes('"0123"'));
 const duplicated=await post('/api/admin/invites',{dripNickname:'테스터'},admin);
 assert.equal(duplicated.status,409);
 const wrongPassword=await post('/api/auth/login',{username:'tester123',password:'WrongPassword2026!'});
 assert.equal(wrongPassword.status,401);
 const login=await post('/api/auth/login',{username:'tester123',password:'SecurePassword2026!'});
 assert.equal(login.status,200);
 assert.equal(login.data.account.id,register.data.account.id);
 const cookie=login.cookie.split(';')[0];
 const whoami=await fetch(base+'/api/auth/me',{headers:{Cookie:cookie}});
 assert.equal((await whoami.json()).account.username,'tester123');
 const wasProduction=process.env.NODE_ENV;process.env.NODE_ENV='production';
 try{
  const accountRequest={headers:{cookie}};
  await assert.rejects(multiplayerAccount(accountRequest,'forged-participant'),e=>e.status===403);
  const checked=await multiplayerAccount(accountRequest,register.data.account.id);
  assert.equal(checked.dripNickname,'테스터');
 }finally{process.env.NODE_ENV=wasProduction;}

 const logout=await post('/api/auth/logout',{},null,cookie);
 assert.equal(logout.status,200);
 const whoamiAfter=await fetch(base+'/api/auth/me',{headers:{Cookie:cookie}});
 assert.equal((await whoamiAfter.json()).authenticated,false);
});
test('multiplayer session identity cannot be supplied via a forged SID',async()=>{
 const req={headers:{cookie:''}};
 await assert.rejects(requireAuthenticatedAccount(req),x=>x.status===401);
});
