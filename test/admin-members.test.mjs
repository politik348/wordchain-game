import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const dir=await mkdtemp(path.join(tmpdir(),'moyeo-members-test-'));
process.env.MOYEO_ADMIN_KEY='test-only-0123456789-admin-key-0123456789';
process.env.AUTH_STORE_PATH=path.join(dir,'auth.json');
delete process.env.DATABASE_URL;
const {handleAccountRequest}=await import('../auth.mjs');
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!await handleAccountRequest(req,res,pathname)){res.writeHead(404);res.end('not found');}
});
let base;
before(async()=>{server.listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;});
after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});});
const key=process.env.MOYEO_ADMIN_KEY;
async function request(route,{method='GET',body,admin=false}={}){
 const response=await fetch(base+route,{method,headers:{
  ...(admin?{Authorization:'Bearer '+key}:{}),
  ...(body?{'Content-Type':'application/json'}:{})
 },body:body?JSON.stringify(body):undefined});
 return {status:response.status,data:await response.json()};
}
test('member directory is admin-only, lists invites, and never returns secrets',async()=>{
 const anonymous=await request('/api/admin/members');
 assert.equal(anonymous.status,403);
 const issued=await request('/api/admin/invites',{method:'POST',admin:true,body:{dripNickname:'회원관리테스터',code:'7129'}});
 assert.equal(issued.status,201);
 const invited=await request('/api/admin/members',{admin:true});
 assert.equal(invited.status,200);
 assert.equal(invited.data.members.length,1);
 const invitedMember=invited.data.members[0];
 assert.equal(invitedMember.registrationStatus,'invited');
 assert.equal(invitedMember.username,null);
 assert.equal(invitedMember.gameAccess.escape,false);
 assert.equal(invitedMember.gameAccess.tetris,false);
 assert.ok(invitedMember.invitedAt>0);
 assert.ok(!JSON.stringify(invited.data).includes('7129'));
 assert.ok(!JSON.stringify(invited.data).includes('codeHash'));
 const verify=await request('/api/auth/verify',{method:'POST',body:{dripNickname:'회원관리테스터',code:'7129'}});
 assert.equal(verify.status,200);
 const registered=await request('/api/auth/register',{method:'POST',body:{registrationToken:verify.data.registrationToken,username:'members123',password:'Password-2026-Secure!'}});
 assert.equal(registered.status,201);
 const list=await request('/api/admin/members',{admin:true});
 assert.equal(list.data.members.length,1);
 const member=list.data.members[0];
 assert.equal(member.registrationStatus,'registered');
 assert.equal(member.username,'members123');
 assert.equal(member.dripNickname,'회원관리테스터');
 assert.ok(member.registeredAt>0);
 assert.ok(member.lastLoginAt>=member.registeredAt);
 assert.equal(member.gameAccess.escape,false);
 assert.equal(member.gameAccess.gamehell,true);
 assert.equal(member.gameAccess.tetris,true);
 assert.equal(member.gameAccess.logic,true);
 assert.equal(member.gameAccess.multiplayer,true);
 assert.ok(!JSON.stringify(list.data).includes('passwordHash'));
 assert.ok(!JSON.stringify(list.data).includes('salt'));
 assert.ok(!JSON.stringify(list.data).includes('tokenHash'));
 assert.ok(!JSON.stringify(list.data).includes('registrationToken'));
 assert.ok(!JSON.stringify(list.data).includes('7129'));
 const approved=await request('/api/admin/escape-access',{method:'POST',admin:true,body:{username:'members123',approve:true}});
 assert.equal(approved.status,200);
 assert.equal(approved.data.approved,true);
 const approvedList=await request('/api/admin/members',{admin:true});
 assert.equal(approvedList.data.members[0].escapeApproved,true);
 assert.equal(approvedList.data.members[0].gameAccess.escape,true);
 await new Promise(resolve=>setTimeout(resolve,10));
 const login=await request('/api/auth/login',{method:'POST',body:{username:'members123',password:'Password-2026-Secure!'}});
 assert.equal(login.status,200);
 const loginList=await request('/api/admin/members',{admin:true});
 assert.ok(loginList.data.members[0].lastLoginAt>=member.lastLoginAt);
 const persisted=JSON.parse(await readFile(process.env.AUTH_STORE_PATH,'utf8'));
 assert.ok(persisted.accounts[0].lastLoginAt>=persisted.accounts[0].createdAt);
 const revoked=await request('/api/admin/escape-access',{method:'POST',admin:true,body:{username:'members123',approve:false}});
 assert.equal(revoked.data.approved,false);
 const final=await request('/api/admin/members',{admin:true});
 assert.equal(final.data.members[0].gameAccess.escape,false);
});