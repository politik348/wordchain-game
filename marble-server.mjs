/** Self-contained, dependency-free online room API for Moyeo Marble.
 * Hook from existing server.js: import { handleMarbleRequest } from './marble-server.mjs';
 * and at the beginning of handler's try block: if(await handleMarbleRequest(req,res,pathname))return;
 */
import {randomBytes, randomInt} from 'node:crypto';
import {createGame,applyAction,chooseCatAction,surrender} from './public/marble/engine.mjs';
import {multiplayerAccount} from './auth.mjs';

const rooms=new Map();
const MAX_BYTES=12_000;
const code=()=>randomBytes(3).toString('hex').toUpperCase();
const fail=(status,message)=>Object.assign(new Error(message),{status});
const normSid=raw=>{const sid=String(raw||'').slice(0,70);if(!/^[A-Za-z0-9_-]{4,70}$/.test(sid))throw fail(400,'잘못된 플레이어 식별자입니다.');return sid;};
const cleanName=raw=>String(raw||'플레이어').replace(/[<>\r\n\u0000-\u001f]/g,'').trim().slice(0,16)||'플레이어';
const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function readJSON(req){
 let length=0;const chunks=[];
 for await(const chunk of req){length+=chunk.length;if(length>MAX_BYTES)throw fail(413,'요청 데이터가 너무 큽니다.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw fail(400,'잘못된 JSON 요청입니다.');}
}
function get(codeStr){const r=rooms.get(codeStr);if(!r)throw fail(404,'게임방을 찾을 수 없습니다.');return r;}
const member=(r,id)=>{const p=r.players.find(x=>x.id===id);if(!p)throw fail(403,'게임방 참가자가 아닙니다.');return p;};
const visible=r=>({code:r.code,host:r.host,players:r.players,state:r.state,rounds:r.rounds,version:r.version,deadline:r.deadline,turnSeconds:r.turnSeconds,now:Date.now(),status:r.state?'playing':'lobby'});
function notify(r){
 r.version++;r.updatedAt=Date.now();
 const packet=`event: state\ndata: ${JSON.stringify(visible(r))}\n\n`;
 for(const stream of r.subscribers){try{stream.write(packet);}catch{r.subscribers.delete(stream);}}
}
function finishTurnAction(r,sid,type,payload){
 try{r.state=applyAction(r.state,sid,type,payload,()=>randomInt(0,0x1_0000_0000)/0x1_0000_0000);}catch(e){throw fail(400,e.message);}
 r.deadline=r.state.phase==='finished'?null:Date.now()+r.turnSeconds*1000;
 notify(r);
}
function autoAdvance(r){
 if(!r.state||r.state.phase==='finished')return;
 const state=r.state,p=state.players[state.turnIndex];
 let type='pass',payload={};
 if(state.phase==='roll')type='roll';
 else if(state.phase==='travel'){type='travel';payload={index:0};}
 else if(state.phase==='chance'){type='pickCard';payload={index:randomInt(0,3)};}
 else if(state.phase==='island')type='islandRoll';
 else if(state.phase==='choice')type='pass';
 const action=p.ai?(chooseCatAction(state)||{type,payload}):{type,payload};
 finishTurnAction(r,p.id,action.type,action.payload||{});
}
const tick=setInterval(()=>{
 const now=Date.now();
 for(const [id,r] of rooms){
  if(now-r.updatedAt>2*60*60*1000){for(const stream of r.subscribers)stream.end();rooms.delete(id);continue;}
  if(r.state && r.state.phase!=='finished' && now>=r.deadline){try{autoAdvance(r);}catch{/* retry after next tick */}}
 }
},1000);
tick.unref?.();

export async function handleMarbleRequest(req,res,pathname){
 if(!pathname.startsWith('/api/marble'))return false;
 try{
  const u=new URL(req.url,'http://localhost');
  if(pathname==='/api/marble/health'&&req.method==='GET'){reply(res,200,{ok:true,rooms:rooms.size});return true;}
  if(pathname==='/api/marble/rooms'&&req.method==='POST'){
   const data=await readJSON(req),account=await multiplayerAccount(req,data.sid||null),sid=account?.id||normSid(data.sid);
   let id;do{id=code();}while(rooms.has(id));
   const r={code:id,host:sid,players:[{id:sid,name:account?.dripNickname||cleanName(data.name)}],state:null,rounds:[0,8,12,16,20].includes(Number(data.rounds))?Number(data.rounds):12,turnSeconds:[15,30,45].includes(Number(data.turnSeconds))?Number(data.turnSeconds):30,version:0,updatedAt:Date.now(),deadline:null,subscribers:new Set()};
   rooms.set(id,r);reply(res,201,visible(r));return true;
  }
  const match=pathname.match(/^\/api\/marble\/rooms\/([A-Z0-9]{6})(?:\/(join|leave|start|action|events))?$/i);
  if(!match)throw fail(404,'요청한 주소가 없습니다.');
  const r=get(match[1].toUpperCase()),op=match[2]||'';
  if(op==='events'&&req.method==='GET'){
   const sid=normSid(u.searchParams.get('sid'));await multiplayerAccount(req,sid);member(r,sid);
   res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
   r.subscribers.add(res);res.write(`event: state\ndata: ${JSON.stringify(visible(r))}\n\n`);
   const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},20000);
   req.on('close',()=>{clearInterval(ping);r.subscribers.delete(res);});return true;
  }
  if(op===''&&req.method==='GET'){
   const sid=normSid(u.searchParams.get('sid'));await multiplayerAccount(req,sid);member(r,sid);reply(res,200,visible(r));return true;
  }
  if(req.method!=='POST')throw fail(405,'POST 요청이 필요합니다.');
  const data=await readJSON(req),account=await multiplayerAccount(req,data.sid||null),sid=account?.id||normSid(data.sid);
  if(op==='join'){
   if(r.state&&!r.players.some(p=>p.id===sid))throw fail(400,'이미 진행 중인 게임입니다.');
   if(!r.players.some(p=>p.id===sid)){
    if(r.players.length>=4)throw fail(400,'4인 정원입니다.');
    r.players.push({id:sid,name:account?.dripNickname||cleanName(data.name)});
   }
   notify(r);reply(res,200,visible(r));return true;
  }
  member(r,sid);
  if(op==='start'){
   if(sid!==r.host)throw fail(403,'방장만 시작할 수 있습니다.');
   if(r.state && r.state.phase!=='finished')throw fail(400,'이미 진행 중입니다.');
   if(r.players.length<2)throw fail(400,'친구 1명 이상이 입장해야 시작할 수 있습니다.');
   r.state=createGame({players:r.players,maxRounds:r.rounds});r.deadline=Date.now()+r.turnSeconds*1000;
   notify(r);reply(res,200,visible(r));return true;
  }
  if(op==='action'){
   if(!r.state)throw fail(400,'게임을 시작해주세요.');
   const type=String(data.type||'');
   if(!['roll','pass','buy','upgrade','takeover','travel','islandRoll','payBail','startBuild','olympic','pickCard','takeLoan'].includes(type))throw fail(400,'허용되지 않는 행동입니다.');
   finishTurnAction(r,sid,type,data.payload||{});reply(res,200,visible(r));return true;
  }
  if(op==='leave'){
   if(r.state && r.state.phase!=='finished'){r.state=surrender(r.state,sid);r.deadline=r.state.phase==='finished'?null:Date.now()+r.turnSeconds*1000;}
   r.players=r.players.filter(p=>p.id!==sid);
   if(!r.players.length){for(const stream of r.subscribers)stream.end();rooms.delete(r.code);}
   else{if(r.host===sid)r.host=r.players[0].id;notify(r);}
   reply(res,200,{ok:true});return true;
  }
  throw fail(404,'요청한 주소가 없습니다.');
 }catch(error){
  if(!res.headersSent)reply(res,error.status||500,{error:error.status?error.message:'서버 오류가 발생했습니다.'});
  return true;
 }
}