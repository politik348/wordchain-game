
import {randomBytes,randomInt,randomUUID} from 'node:crypto';
import E from './fortress-engine.mjs';
import {requireAuthenticatedAccount,fortressRecordMatch,fortressLeaderboard} from './auth.mjs';
const rooms=new Map(), fail=(status,message)=>Object.assign(new Error(message),{status});
const clock=()=>Date.now(), ordinary=Object.keys(E.TANKS).filter(k=>k!=='super');
const safeTank=k=>ordinary.includes(k)?k:'random';
const randomTank=()=>E.pick(()=>randomInt(0,1000000)/1000000);
function reply(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000)throw fail(413,'요청이 너무 큽니다.');}try{return JSON.parse(raw||'{}');}catch{throw fail(400,'잘못된 요청입니다.');}}
function publicRoom(r,id){return {code:r.code,host:r.host===id,size:r.size,map:r.map,timer:r.timer,collapse:r.collapse,phase:r.phase,players:r.players.map(p=>({nickname:p.nickname,team:p.team,tank:p.tank,ready:p.ready,host:p.id===r.host,me:p.id===id,slot:p.slot,forfeited:!!p.forfeited})),state:r.state,deadline:r.deadline,flight:r.flight,version:r.version,rankSaved:r.rankSaved,serverTime:clock()};}
function member(r,id){let p=r.players.find(p=>p.id===id);if(!p)throw fail(403,'참가한 방이 아닙니다.');return p;}
function current(r,p,b){if(r.phase!=='battle'||r.state.phase!=='aim'||r.state.turn!==p.slot||p.forfeited)throw fail(409,'현재 차례가 아닙니다.');if(b.nonce!==r.state.nonce)throw fail(409,'차례가 변경되었습니다.');}
function bump(r){r.version++;r.touched=clock();}
function nextDeadline(r){r.deadline=clock()+r.timer*1000;}
function finishRoom(r){r.phase='finished';r.flight=null;r.deadline=0;bump(r);persist(r);}
function persist(r){if(r.phase!=='finished'||r.rankSaved||r.saving)return;r.saving=true;fortressRecordMatch(r.matchId,r.players,r.state.winner).then(()=>{r.rankSaved=true;bump(r);}).catch(e=>console.error('Fortress ranking:',e.message)).finally(()=>{r.saving=false;});}
function after(r){if(r.state.phase==='over')finishRoom(r);else {nextDeadline(r);bump(r);}}
function victory(r){const s=r.state,a=s.tanks.some(t=>t.team===0&&t.hp>0),b=s.tanks.some(t=>t.team===1&&t.hp>0);if(a&&b)return false;s.phase='over';s.winner=a?0:b?1:-1;s.shots=[];finishRoom(r);return true;}
function tick(r){if(r.phase==='finished'){if(!r.rankSaved&&clock()-(r.lastRetry||0)>10000){r.lastRetry=clock();persist(r);}return;}if(r.phase!=='battle')return;
 if(r.state.phase==='flight'&&r.flight&&clock()>=r.flight.ends){E.finish(r.state);r.flight=null;after(r);}
 else if(r.state.phase==='aim'&&clock()>=r.deadline){E.skip(r.state);after(r);}
}
const interval=setInterval(()=>{for(const [code,r] of rooms){try{tick(r);if((r.phase==='lobby'&&clock()-r.touched>3600000)||(r.phase==='finished'&&r.rankSaved&&clock()-r.touched>1800000))rooms.delete(code);}catch(e){console.error('Fortress tick:',e.message);}}},250);interval.unref?.();
function createRoom(account,b){if(rooms.size>=100)throw fail(503,'현재 방이 가득 찼습니다.');if([...rooms.values()].some(r=>r.phase!=='finished'&&r.players.some(p=>p.id===account.id&&!p.forfeited)))throw fail(409,'이미 참가한 방이 있습니다. 기존 방에 다시 입장하세요.');let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));const size=[1,2,3,4].includes(+b.size)?+b.size:2;let r={code,matchId:randomUUID(),host:account.id,size,map:E.MAPS[b.map]?b.map:'valley',timer:[15,30,60].includes(+b.timer)?+b.timer:30,collapse:b.collapse!==false,phase:'lobby',players:[{id:account.id,nickname:account.dripNickname,team:0,tank:safeTank(b.tank),ready:false,slot:null}],state:null,flight:null,deadline:0,version:1,touched:clock(),rankSaved:false};rooms.set(code,r);return r;}
function join(r,account,b){if(r.players.some(p=>p.id===account.id))return;if(r.phase!=='lobby')throw fail(409,'이미 시작한 방입니다.');if([...rooms.values()].some(x=>x!==r&&x.phase!=='finished'&&x.players.some(p=>p.id===account.id&&!p.forfeited)))throw fail(409,'이미 다른 방에 참가했습니다.');let counts=[0,0];r.players.forEach(p=>counts[p.team]++);let team=Number(b.team);if(![0,1].includes(team))team=counts[0]<=counts[1]?0:1;if(counts[team]>=r.size)throw fail(409,'선택한 팀이 가득 찼습니다.');r.players.push({id:account.id,nickname:account.dripNickname,team,tank:safeTank(b.tank),ready:false,slot:null});bump(r);}
export function updateRoomSettings(r,p,b){
 if(r.phase!=='lobby')throw fail(409,'대기실에서만 설정을 변경할 수 있습니다.');
 if(r.host!==p.id)throw fail(403,'방장만 설정을 변경할 수 있습니다.');
 const {size,map,timer,collapse}=b;
 if(![1,2,3,4].includes(size)||typeof map!=='string'||!Object.hasOwn(E.MAPS,map)||![15,30,60].includes(timer)||typeof collapse!=='boolean')throw fail(400,'방 설정이 올바르지 않습니다.');
 if([0,1].some(t=>r.players.filter(x=>x.team===t).length>size))throw fail(409,'현재 팀원 수보다 작은 팀 규모로 변경할 수 없습니다.');
 if(r.size===size&&r.map===map&&r.timer===timer&&r.collapse===collapse)return false;
 Object.assign(r,{size,map,timer,collapse});r.players.forEach(x=>{x.ready=false;});bump(r);return true;
}
function act(r,p,b){tick(r);
 if(b.action==='settings'){updateRoomSettings(r,p,b);return;}
 if(b.action==='leave'){if(r.phase==='lobby'){r.players=r.players.filter(x=>x!==p);if(!r.players.length){rooms.delete(r.code);return;}if(r.host===p.id)r.host=r.players[0].id;bump(r);return;}if(r.phase==='battle'&&!p.forfeited){if(r.state.phase==='flight')throw fail(409,'포탄 비행 종료 후 나갈 수 있습니다.');p.forfeited=true;r.state.tanks[p.slot].hp=0;if(!victory(r)){if(r.state.turn===p.slot){E.skip(r.state);after(r);}else bump(r);}}return;}
 if(r.phase==='lobby'){
  if(b.action==='selectTank'){const next=safeTank(b.tank);if(next!==p.tank){p.tank=next;p.ready=false;bump(r);}return;}
  if(b.action==='ready'){p.ready=b.ready!==false;if(b.tank!==undefined)p.tank=safeTank(b.tank);bump(r);return;}
  if(b.action==='team'){let t=+b.team;if(![0,1].includes(t)||r.players.filter(x=>x!==p&&x.team===t).length>=r.size)throw fail(409,'해당 팀이 가득 찼습니다.');p.team=t;p.ready=false;bump(r);return;}
  if(b.action==='start'){if(r.host!==p.id)throw fail(403,'방장만 시작할 수 있습니다.');if([0,1].some(t=>r.players.filter(x=>x.team===t).length!==r.size)||r.players.some(x=>!x.ready))throw fail(409,'모든 팀원이 입장하고 준비해야 합니다.');r.players.sort((a,b)=>a.team-b.team);let lineup=r.players.map((p,i)=>{p.slot=i;return p.tank=p.tank==='random'?randomTank():p.tank;});r.state=E.create({size:r.size,map:r.map,timer:r.timer,collapse:r.collapse,seed:randomInt(0,2147483647),lineup});r.phase='battle';after(r);return;}
  throw fail(400,'대기실에서 사용할 수 없는 행동입니다.');
 }
 current(r,p,b);let s=r.state,t=s.tanks[s.turn];
 if(b.action==='move'){if(![-1,1].includes(b.dir))throw fail(400,'잘못된 방향');E.move(s,b.dir,4);}
 else if(b.action==='item'){if(!['heal','double','teleport','powerup','shield','wind'].includes(b.key)||!E.item(s,b.key))throw fail(409,'아이템을 사용할 수 없습니다.');}
 else if(b.action==='skip'){E.skip(s);after(r);return;}
 else if(b.action==='fire'){if(![0,1].includes(b.weapon)||![-1,1].includes(b.dir)||!Number.isFinite(b.angle)||!Number.isFinite(b.power))throw fail(400,'조준 값이 올바르지 않습니다.');E.aim(s,b.angle,b.power,b.dir,b.weapon);const paths=E.fire(s);const start=clock();r.flight={start,ends:start+E.flightDuration(paths)+900,paths};r.deadline=0;}
 else throw fail(400,'알 수 없는 행동입니다.');bump(r);
}
export async function handleFortressRequest(req,res,pathname){
 if(!pathname.startsWith('/api/fortress/'))return false;
 try{
 const account=await requireAuthenticatedAccount(req),method=req.method;
 if(method==='GET'&&pathname==='/api/fortress/ranking'){reply(res,200,await fortressLeaderboard(account.id));return true;}
 if(pathname==='/api/fortress/rooms'){
  if(method==='GET'){reply(res,200,{rooms:[...rooms.values()].filter(r=>r.phase==='lobby'||r.players.some(p=>p.id===account.id&&!p.forfeited)).map(r=>({code:r.code,size:r.size,map:r.map,count:r.players.length,phase:r.phase,joined:r.players.some(p=>p.id===account.id&&!p.forfeited)}))});return true;}
  if(method==='POST'){const r=createRoom(account,await body(req));reply(res,201,{room:publicRoom(r,account.id)});return true;}
 }
 const m=pathname.match(/^\/api\/fortress\/rooms\/([0-9A-F]{6})(?:\/(join|action))?$/i);if(!m)throw fail(404,'잘못된 경로입니다.');const r=rooms.get(m[1].toUpperCase());if(!r)throw fail(404,'방을 찾을 수 없습니다.');
 if(method==='POST'&&m[2]==='join'){join(r,account,await body(req));}
 else if(method==='POST'&&m[2]==='action'){act(r,member(r,account.id),await body(req));}
 else if(method==='GET'&&!m[2]){member(r,account.id);tick(r);const since=new URL(req.url||pathname,'http://localhost').searchParams.get('since');if(since!==null&&since===String(r.version)){reply(res,200,{unchanged:true,version:r.version,deadline:r.deadline,serverTime:clock()});return true;}}
 else throw fail(405,'허용되지 않은 요청입니다.');
 reply(res,200,{room:publicRoom(r,account.id)});return true;
 }catch(e){reply(res,e.status||500,{error:e.status?e.message:'포트리스 서버 오류'});if(!e.status)console.error(e);return true;}
}
