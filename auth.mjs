// Invite-only Moyeo accounts. One-time 4-digit codes are bound to a specific Drip University nickname.
// Persistent storage is mandatory: PostgreSQL (DATABASE_URL) or a mounted disk (AUTH_STORE_PATH).
import {randomBytes, randomInt, createHash, createHmac, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {promisify} from 'node:util';

const scrypt=promisify(scryptCallback);
const cookieName='moyeo_auth';
const maxBody=12_000;
const sessionAge=7*24*60*60*1000;
const inviteAge=14*24*60*60*1000;
const verifyAge=10*60*1000;
const initial=()=>({accounts:[],invites:[],sessions:[]});
const pending=new Map(),attempts=new Map();
let queue=Promise.resolve(),pool=null;
const error=(status,message)=>Object.assign(new Error(message),{status});
const passwordParameters={N:32768,r:8,p:1,maxmem:64*1024*1024};
const hash=x=>createHash('sha256').update(String(x)).digest('hex');
const adminKey=()=>String(process.env.MOYEO_ADMIN_KEY||'');
const readyStore=()=>Boolean(process.env.DATABASE_URL||process.env.AUTH_STORE_PATH);
export const accountStorageReady=()=>readyStore() && adminKey().length>=24;
const nickKey=x=>String(x||'').normalize('NFC').trim().toLocaleLowerCase('ko');
const nickname=x=>String(x||'').normalize('NFC').trim();
const publicAccount=x=>x?{id:x.id,username:x.username,dripNickname:x.dripNickname}:null;
function validNick(n){if(n.length<2||n.length>24||/[<>\u0000-\u001f]/.test(n))throw error(400,'드립대학 닉네임은 2~24자로 입력하세요.');}
function validUser(s){if(!/^[a-z][a-z0-9_-]{3,19}$/.test(s))throw error(400,'아이디는 영문 소문자로 시작하는 4~20자(숫자, _ 및 - 허용)여야 합니다.');}
function validPassword(s){if(typeof s!=='string'||s.length<10||s.length>128)throw error(400,'비밀번호는 10~128자로 입력하세요.');}
function secretHash(code){return createHmac('sha256',adminKey()).update(code).digest('hex');}
function hexEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length||!/^[0-9a-f]+$/.test(a)||!/^[0-9a-f]+$/.test(b))return false;return timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));}
async function encryptPassword(password,salt){return (await scrypt(password,Buffer.from(salt,'hex'),64,passwordParameters)).toString('hex');}
async function fileRead(){
 try{return JSON.parse(await fs.readFile(process.env.AUTH_STORE_PATH,'utf8'));}
 catch(e){if(e.code==='ENOENT')return initial();throw e;}
}
async function fileWrite(data){
 const dest=process.env.AUTH_STORE_PATH;
 await fs.mkdir(path.dirname(dest),{recursive:true,mode:0o700});
 const tmp=dest+'.'+randomBytes(8).toString('hex')+'.tmp';
 await fs.writeFile(tmp,JSON.stringify(data),{mode:0o600});
 await fs.rename(tmp,dest);
}
async function postgres(){
 if(pool)return pool;
 const {Pool}=await import('pg');
 pool=new Pool({connectionString:process.env.DATABASE_URL,max:4,ssl:process.env.DATABASE_SSL==='require'?{rejectUnauthorized:true}:undefined});
 await pool.query('CREATE TABLE IF NOT EXISTS moyeo_auth_store (id INT PRIMARY KEY, data JSONB NOT NULL)');
 await pool.query('INSERT INTO moyeo_auth_store(id,data) VALUES(1,$1) ON CONFLICT(id) DO NOTHING',[initial()]);
 return pool;
}
async function readOrWrite(callback,update=false){
 if(!readyStore())throw error(503,'회원 데이터 저장소가 설정되지 않았습니다. 관리자에게 문의하세요.');
 if(process.env.DATABASE_URL){
  const conn=await (await postgres()).connect();
  try{
   await conn.query('BEGIN');
   const out=await conn.query('SELECT data FROM moyeo_auth_store WHERE id=1 FOR UPDATE');
   const data=out.rows[0].data;
   const value=await callback(data);
   if(update)await conn.query('UPDATE moyeo_auth_store SET data=$1 WHERE id=1',[JSON.stringify(data)]);
   await conn.query('COMMIT');return value;
  }catch(e){await conn.query('ROLLBACK');throw e;}finally{conn.release();}
 }
 const task=queue.then(async()=>{
  const data=await fileRead(),value=await callback(data);
  if(update)await fileWrite(data);return value;
 });
 queue=task.catch(()=>{});
 return task;
}
function getCookie(req){
 const raw=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));
 const token=raw?.slice(cookieName.length+1);
 return /^[a-f0-9]{64}$/.test(token||'')?token:null;
}
function issueCookie(res,token,req,clear=false){
 const secure=process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https'||req.socket?.encrypted;
 res.setHeader('Set-Cookie',cookieName+'='+(clear?'':token)+'; Path=/; HttpOnly; SameSite=Lax; '+(secure?'Secure; ':'')+(clear?'Max-Age=0':'Max-Age='+Math.floor(sessionAge/1000)));
}
export async function getAuthenticatedAccount(req){
 const token=getCookie(req);if(!token||!readyStore())return null;
 return readOrWrite(data=>{
  const now=Date.now(),session=data.sessions.find(x=>x.tokenHash===hash(token)&&x.expiresAt>now);
  return session?publicAccount(data.accounts.find(x=>x.id===session.accountId)):null;
 });
}
export async function requireAuthenticatedAccount(req){
 const user=await getAuthenticatedAccount(req);
 if(!user)throw error(401,'멀티플레이는 로그인 후 이용할 수 있습니다.');
 return user;
}
// Existing Node test-runner suites use legacy guest fixtures. This bypass is only active
// inside isolated node:test workers; production always requires a real account.
export async function multiplayerAccount(req,claimedSid=null){
 if(process.env.NODE_ENV!=='production' && process.env.NODE_TEST_CONTEXT)return null;
 const account=await requireAuthenticatedAccount(req);
 if(claimedSid!=null)assertIdentity(account,claimedSid);
 return account;
}
export function assertIdentity(account,sid){
 if(sid!==account.id)throw error(403,'로그인한 계정의 게임 참가 정보가 아닙니다.');
}
function respond(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function json(req){
 if(!String(req.headers['content-type']||'').startsWith('application/json'))throw error(415,'JSON 요청만 허용합니다.');
 const origin=req.headers.origin;if(origin){
  let same=false;try{const originUrl=new URL(origin);same=originUrl.host===req.headers.host&&(originUrl.protocol==='https:'||originUrl.protocol==='http:');}catch{}
  if(!same)throw error(403,'허용되지 않은 요청 출처입니다.');
 }
 const chunks=[];let size=0;
 for await(const chunk of req){size+=chunk.length;if(size>maxBody)throw error(413,'요청 크기 초과');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw error(400,'잘못된 요청 형식입니다.');}
}
function throttle(req,key,limit=8,windowMs=15*60*1000){
 const address=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0].slice(0,100);
 const name=address+'|'+key,now=Date.now(),last=attempts.get(name)||[];
 const current=last.filter(time=>now-time<windowMs);
 if(current.length>=limit)throw error(429,'요청 횟수가 많습니다. 잠시 후 다시 시도하세요.');
 current.push(now);attempts.set(name,current);
 if(attempts.size>4000)for(const [id,arr] of attempts)if(now-arr.at(-1)>windowMs)attempts.delete(id);
}
function adminCheck(req){
 const wanted=adminKey(),given=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
 if(wanted.length<24)throw error(503,'관리자 인증키가 설정되지 않았습니다.');
 if(!given||!hexEqual(hash(given),hash(wanted)))throw error(403,'관리자 인증이 필요합니다.');
}
export async function handleAccountRequest(req,res,pathname){
 if(!pathname.startsWith('/api/auth/')&&!pathname.startsWith('/api/admin/invites'))return false;
 try{
  if(pathname==='/api/auth/me'&&req.method==='GET'){
   const account=await getAuthenticatedAccount(req);
   respond(res,200,{authenticated:Boolean(account),account,storageConfigured:readyStore(),invitesEnabled:accountStorageReady()});return true;
  }
  if(!accountStorageReady())throw error(503,'회원가입을 위해 영구 저장소와 관리자 인증키 설정이 필요합니다.');
  if(pathname==='/api/admin/invites'&&req.method==='POST'){
   adminCheck(req);throttle(req,'adminIssue',50);
   const input=await json(req),name=nickname(input.dripNickname),key=nickKey(name);validNick(name);
   const code=await readOrWrite(state=>{
    if(state.accounts.some(x=>x.nickKey===key))throw error(409,'이미 등록한 드립대학 닉네임입니다.');
    const now=Date.now();
    state.invites=state.invites.filter(x=>x.nickKey!==key&&x.expiresAt>now&&!x.usedAt);
    const active=new Set(state.invites.map(x=>x.codeHash));
    const requested=String(input.code||'').trim();
    if(requested&&!/^\\d{4}$/.test(requested))throw error(400,'인증번호는 숫자 4자리여야 합니다.');
    let candidate=requested;
    if(candidate&&active.has(secretHash(candidate)))throw error(409,'이미 다른 회원에게 발급한 번호입니다.');
    if(!candidate)do{candidate=String(randomInt(0,10000)).padStart(4,'0');}while(active.has(secretHash(candidate)));
    state.invites.push({id:randomBytes(16).toString('hex'),dripNickname:name,nickKey:key,codeHash:secretHash(candidate),createdAt:now,expiresAt:now+inviteAge,usedAt:null});
    return candidate;
   },true);
   respond(res,201,{dripNickname:name,code,validDays:14,note:'1회용 코드입니다. 이 응답을 닫으면 서버에서 원문을 다시 보여주지 않습니다.'});return true;
  }
  if(pathname==='/api/auth/verify'&&req.method==='POST'){
   const input=await json(req),name=nickname(input.dripNickname),key=nickKey(name),code=String(input.code||'');
   validNick(name);if(!/^\d{4}$/.test(code))throw error(400,'4자리 인증번호를 입력하세요.');
   throttle(req,'verify:'+key,6,20*60*1000);
   const invite=await readOrWrite(state=>{
    if(state.accounts.some(x=>x.nickKey===key))return null;
    return state.invites.find(x=>x.nickKey===key&&!x.usedAt&&x.expiresAt>Date.now()&&hexEqual(x.codeHash,secretHash(code)))?.id||null;
   });
   if(!invite)throw error(400,'닉네임 또는 인증번호가 올바르지 않습니다.');
   const token=randomBytes(32).toString('hex');pending.set(hash(token),{nickKey:key,invite,expiresAt:Date.now()+verifyAge});
   if(pending.size>3000)for(const [id,p] of pending)if(p.expiresAt<Date.now())pending.delete(id);
   respond(res,200,{verified:true,registrationToken:token,expiresMinutes:10});return true;
  }
  if(pathname==='/api/auth/register'&&req.method==='POST'){
   const input=await json(req),token=String(input.registrationToken||''),key=hash(token);
   const verified=pending.get(key);
   if(!/^[0-9a-f]{64}$/.test(token)||!verified||verified.expiresAt<Date.now())throw error(403,'닉네임·인증번호를 먼저 확인해주세요.');
   throttle(req,'register:'+verified.nickKey,8);
   const username=String(input.username||'').toLowerCase().trim(),password=input.password;
   validUser(username);validPassword(password);
   const salt=randomBytes(16).toString('hex'),passwordHash=await encryptPassword(password,salt);
   const account=await readOrWrite(state=>{
    const invitation=state.invites.find(x=>x.id===verified.invite&&x.nickKey===verified.nickKey&&!x.usedAt&&x.expiresAt>Date.now());
    if(!invitation)throw error(409,'인증번호가 이미 사용되었거나 유효하지 않습니다.');
    if(state.accounts.some(x=>x.username===username))throw error(409,'이미 사용 중인 아이디입니다.');
    if(state.accounts.some(x=>x.nickKey===verified.nickKey))throw error(409,'이미 등록한 드립대학 닉네임입니다.');
    invitation.usedAt=Date.now();
    const value={id:randomBytes(16).toString('hex'),username,dripNickname:invitation.dripNickname,nickKey:verified.nickKey,salt,passwordHash,createdAt:Date.now()};
    state.accounts.push(value);return publicAccount(value);
   },true);
   pending.delete(key);
   const sessionToken=await createSession(account.id);issueCookie(res,sessionToken,req);
   respond(res,201,{authenticated:true,account});return true;
  }
  if(pathname==='/api/auth/login'&&req.method==='POST'){
   const input=await json(req),username=String(input.username||'').toLowerCase().trim(),password=input.password;
   throttle(req,'login:'+username,8,15*60*1000);
   if(!/^[a-z][a-z0-9_-]{3,19}$/.test(username)||typeof password!=='string')throw error(401,'아이디 또는 비밀번호가 올바르지 않습니다.');
   const person=await readOrWrite(state=>state.accounts.find(x=>x.username===username));
   // Perform a hash even for nonexistent users, so username lookup timing is less revealing.
   const salt=person?.salt||'00000000000000000000000000000000';
   const hashed=await encryptPassword(password.slice(0,129),salt);
   if(!person||!hexEqual(hashed,person.passwordHash))throw error(401,'아이디 또는 비밀번호가 올바르지 않습니다.');
   const token=await createSession(person.id);issueCookie(res,token,req);
   respond(res,200,{authenticated:true,account:publicAccount(person)});return true;
  }
  if(pathname==='/api/auth/logout'&&req.method==='POST'){
   await json(req);const token=getCookie(req);
   if(token)await readOrWrite(state=>{state.sessions=state.sessions.filter(x=>x.tokenHash!==hash(token));},true);
   issueCookie(res,'',req,true);respond(res,200,{authenticated:false});return true;
  }
  throw error(404,'존재하지 않는 회원 요청입니다.');
 }catch(e){if(!res.headersSent)respond(res,e.status||500,{error:e.status?e.message:'회원 처리 중 오류가 발생했습니다.'});return true;}
}
async function createSession(accountId){
 const token=randomBytes(32).toString('hex');
 await readOrWrite(state=>{
  const now=Date.now();
  state.sessions=state.sessions.filter(x=>x.expiresAt>now&&x.accountId!==accountId);
  state.sessions.push({tokenHash:hash(token),accountId,createdAt:now,expiresAt:now+sessionAge});
 },true);
 return token;
}
