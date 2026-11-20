import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomInt } from 'node:crypto';
import {acceptWebSocket} from './websocket-lite.mjs';
import { words as starterWords, startingWords, drawingWords, liarWords } from './data/words.js';
// An imported full dictionary overrides the starter lexicon for multiplayer.
let words = starterWords;
try {
  const imported = JSON.parse(readFileSync(new URL('./data/dictionary.json', import.meta.url), 'utf8'));
  if (Array.isArray(imported) && imported.length && imported.every(w => typeof w === 'string' && /^[가-힣]{2,24}$/.test(w))) {
    words = imported;
    console.log(`Dictionary loaded: ${words.length.toLocaleString('ko-KR')} words`);
  } else {
    console.warn('Invalid imported dictionary, retaining starter words.');
  }
} catch (e) {
  if (e.code !== 'ENOENT') console.warn('Dictionary load failed, retaining starter words:', e.message);
}
const lexicon = new Set(words);

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const rooms = new Map();
const connections = new Map();
const doodleSockets=new Map();
function sendDoodle(r,packet){
 for(const ws of doodleSockets.get(r.id)||[])ws.send(packet);
}
const MAX_BODY = 120_000;
const GAME_INFO = {
  mafia: { name:'가면단', min:4, max:12 },
  omok: { name:'오목', min:2, max:2 },
  yut: { name:'윷놀이', min:2, max:4 },
  doodle: { name:'낙서왕', min:2, max:8 },
  bell: { name:'도깨비 종', min:2, max:4 },
  liar: { name:'라이어 게임', min:3, max:8 },
  wordchain: { name:'끝말잇기', min:2, max:10 }
};
const id = () => randomBytes(12).toString('hex');
const pick = arr => arr[randomInt(arr.length)];
const clampText = (v,max=100) => String(v ?? '').trim().slice(0,max);
const cleanNick = s => clampText(s,14).replace(/[<>\r\n]/g,'') || '익명';
const cleanSid = s => { const v=clampText(s,60); if(!/^[A-Za-z0-9_-]{4,60}$/.test(v)) throw err(400,'잘못된 사용자 식별자입니다.'); return v; };
const err = (status,message) => Object.assign(new Error(message),{status});
const player = (r,sid) => r.players.find(p=>p.id===sid);
const aliveList = r => r.players.filter(p=>r.state.alive.includes(p.id));
const nextIndex = (r, index=0, valid=(p)=>true) => {
  for(let i=0;i<r.players.length;i++) {
    const n=(index+i)%r.players.length;
    if(valid(r.players[n])) return n;
  }
  return 0;
};
const touch = (r,message) => {
  if(message) { r.notices.push({id:id(),at:Date.now(),text:String(message).slice(0,160)}); r.notices=r.notices.slice(-15); }
  r.updatedAt=Date.now();r.version=(r.version||0)+1;
  for(const p of r.players) pushState(p.id,r);
};
function sanitize(r,sid) {
  const pub={ id:r.id,game:r.game,gameName:GAME_INFO[r.game].name,host:r.host,status:r.status,
    players:r.players.map(p=>({id:p.id,nick:p.nick,ready:p.ready})),
    notices:r.notices.slice(-8),me:sid,now:Date.now(),updatedAt:r.updatedAt,version:r.version||0 };
  if(!r.state) return pub;
  const s=r.state;
  if(r.game==='mafia') {
    pub.state={...s,roles:undefined,nightActions:undefined,investigations:undefined,
      role:s.roles[sid],investigation:s.investigations[sid]||null,
      votes:Object.keys(s.votes).map(v=>v),nightSubmitted:Object.keys(s.nightActions).map(v=>v)};
  } else if(r.game==='liar') {
    pub.state={...s,word: s.phase==='result' ? s.word : undefined,
      liar:s.phase==='result' ? s.liar : undefined,
      myWord:sid===s.liar?null:s.word,isLiar:sid===s.liar,
      votes:Object.keys(s.votes).map(v=>v)};
  } else if(r.game==='doodle') {
    pub.state={...s,word:sid===s.artist || r.status==='finished' ? s.word:undefined,
      wordLength:s.word.length};
  } else pub.state=s;
  return pub;
}
function pushState(sid,r) {
  const pack=`event: state\ndata: ${JSON.stringify(sanitize(r,sid))}\n\n`;
  for(const conn of connections.get(sid)||[]) {
    try{conn.write(pack);}catch(e){ /* disconnected */ }
  }
}
function simpleReply(res,code,obj) {
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}
async function body(req) {
  const chunks=[];let size=0;
  for await(const chunk of req) {
    size+=chunk.length;if(size>MAX_BODY) throw err(413,'요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
  catch {throw err(400,'잘못된 요청입니다.');}
}
function getRoom(code) {
  const r=rooms.get(String(code).toUpperCase());
  if(!r) throw err(404,'방을 찾지 못했습니다. 코드 또는 서버 상태를 확인하세요.');
  return r;
}
function requireMember(r,sid) {
  if(!sid||!player(r,sid)) throw err(403,'이 방의 참가자가 아닙니다.');
}
function reset(r) { r.status='lobby';r.state=null;r.players.forEach(p=>p.ready=false);touch(r,'다음 판을 준비할 수 있습니다.'); }
function finish(r,message) {r.status='finished';r.state.result=message;touch(r,message);}

function start(r) {
  const info=GAME_INFO[r.game];
  if(r.players.length<info.min) throw err(400,`최소 ${info.min}명이 필요합니다.`);
  if(r.players.some(p=>p.id!==r.host&&!p.ready)) throw err(400,'다른 참가자가 모두 준비해야 합니다.');
  r.status='playing';
  const ids=r.players.map(p=>p.id);
  switch(r.game){
    case 'omok':r.state={board:Array(225).fill(null),turn:ids[0],winner:null,last:null,moves:0};break;
    case 'wordchain':r.state={turn:ids[0],turnIndex:0,history:[pick(startingWords)],used:[],hearts:Object.fromEntries(ids.map(x=>[x,2])),scores:Object.fromEntries(ids.map(x=>[x,0])),deadline:Date.now()+20000,round:1,mission:pick(['사','가','구','나','리','자','이','도','수']),timer:20,reason:null};break;
    case 'doodle':r.state={artist:ids[0],artistIndex:0,round:1,maxRounds:Math.min(12,ids.length*3),word:pick(drawingWords),strokes:[],strokeSeq:0,chat:[],scores:Object.fromEntries(ids.map(x=>[x,0])),deadline:Date.now()+80000,revealed:false};break;
    case 'liar': {
      const [topic,word]=pick(liarWords);
      r.state={topic,word,liar:pick(ids),phase:'clue',speaker:ids[0],speakerIndex:0,clues:[],votes:{},guess:'',result:null};break;
    }
    case 'mafia': {
      const roles=ids.map((x,i)=>i < (ids.length>=8?2:1)?'마피아':i===(ids.length>=8?2:1)?'의사':i===(ids.length>=6?(ids.length>=8?3:2):-1)?'경찰':'시민');
      // Unbiased Fisher-Yates shuffle.
      for(let i=roles.length-1;i>0;i--){const j=randomInt(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}
      r.state={roles:Object.fromEntries(ids.map((x,i)=>[x,roles[i]])),alive:[...ids],phase:'night',day:1,nightActions:{},investigations:{},votes:{},chat:[],history:[{text:'첫 번째 밤이 시작되었습니다. 역할을 확인하고 행동하세요.'}],result:null};break;
    }
    case 'bell':r.state={cards:Object.fromEntries(ids.map(x=>[x,null])),scores:Object.fromEntries(ids.map(x=>[x,0])),pile:0,draws:0,maxDraws:24,lastDraw:Date.now(),round:1,feedback:'카드가 뒤집힐 때를 기다려요.',deadline:Date.now()+1900};break;
    case 'yut':r.state={turn:ids[0],turnIndex:0,pieces:Object.fromEntries(ids.map(x=>[x,Array.from({length:4},()=>({node:0,route:'outer',index:0,done:false}))])),pending:null,rollName:null,bonus:false,history:[],result:null};break;
  }
  touch(r,'게임이 시작되었습니다!');
}

function checkOmok(s,bx,by,who) {
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  const get=(x,y)=> x>=0&&x<15&&y>=0&&y<15?s.board[y*15+x]:null;
  const count=(dx,dy)=>{
    let total=1;
    for(const sign of [1,-1]) for(let t=1;t<15;t++){
      if(get(bx+dx*t*sign,by+dy*t*sign)===who)total++;else break;
    }
    return total;
  };
  const five=dirs.some(([dx,dy])=>count(dx,dy)>=5);
  if(five||who!==s.black) return {five,forbidden:false};
  // Common straight open-three case for black (simplified double-three).
  let openThrees=0;
  for(const [dx,dy] of dirs){
    let line='';
    for(let t=-4;t<=4;t++){
      const x=bx+t*dx,y=by+t*dy,v=get(x,y);
      line+=x<0||x>=15||y<0||y>=15||v&&v!==who?'#':v===who?'X':'_';
    }
    if(/_XXX_/.test(line)||/_XX_X_/.test(line)||/_X_XX_/.test(line))openThrees++;
  }
  return {five,forbidden:openThrees>=2};
}
function roleWinner(r) {
  const s=r.state,alive=s.alive;
  const mafia=alive.filter(x=>s.roles[x]==='마피아').length;
  if(mafia===0) {finish(r,'시민 팀 승리! 마피아를 모두 찾아냈습니다.');return true;}
  if(mafia>=alive.length-mafia){finish(r,'마피아 팀 승리! 도시를 장악했습니다.');return true;}
  return false;
}
function resolveNight(r) {
  const s=r.state,alive=s.alive,mafia=alive.filter(x=>s.roles[x]==='마피아');
  const targets=mafia.map(x=>s.nightActions[x]).filter(Boolean);
  const tallies={};targets.forEach(x=>tallies[x]=(tallies[x]||0)+1);
  const target=Object.entries(tallies).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const doc=alive.find(x=>s.roles[x]==='의사');
  const protectedId=s.nightActions[doc];
  const detective=alive.find(x=>s.roles[x]==='경찰');
  if(detective&&s.nightActions[detective]){
    const t=s.nightActions[detective];s.investigations[detective]=`${player(r,t)?.nick||'대상'}: ${s.roles[t]==='마피아'?'마피아':'마피아가 아님'}`;
  }
  if(target&&target!==protectedId){s.alive=s.alive.filter(x=>x!==target);s.history.push({text:`${player(r,target)?.nick}님이 밤에 사망했습니다.`});}
  else s.history.push({text:'밤사이 아무도 사망하지 않았습니다.'});
  s.phase='discussion';s.votes={};s.nightActions={};
  if(!roleWinner(r)) touch(r,`${s.day}일차 아침입니다. 토론해 보세요.`);
}
function resolveVote(r) {
  const s=r.state,votes=Object.values(s.votes);const totals={};
  votes.forEach(x=>totals[x]=(totals[x]||0)+1);
  const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  if(ranked.length && ranked[0][1]>(ranked[1]?.[1]||0) && ranked[0][0]!=='skip'){
    const eliminated=ranked[0][0]; s.alive=s.alive.filter(x=>x!==eliminated);
    s.history.push({text:`투표 결과 ${player(r,eliminated)?.nick}님이 추방되었습니다. (역할: ${s.roles[eliminated]})`});
  } else s.history.push({text:'투표 결과 동점 또는 기권으로 추방된 사람이 없습니다.'});
  if(roleWinner(r))return;
  s.day++;s.phase='night';s.votes={};s.nightActions={};s.investigations={};touch(r,`${s.day}번째 밤입니다.`);
}
function nextDoodle(r) {
  const s=r.state,prev=s.word;
  if(s.round>=s.maxRounds){ finish(r,`그림 대결 종료! 우승: ${player(r,Object.entries(s.scores).sort((a,b)=>b[1]-a[1])[0][0])?.nick}`);return; }
  s.round++;
  s.artistIndex=(s.artistIndex+1)%r.players.length;
  s.artist=r.players[s.artistIndex].id;
  let next=pick(drawingWords);if(next===prev)next=pick(drawingWords);
  s.word=next;s.strokes=[];s.strokeSeq=0;s.deadline=Date.now()+80000;s.revealed=false;
  touch(r,`${s.round}라운드: 새로운 화가가 그림을 그립니다.`);
}
function nextChainTurn(r) {
  const s=r.state,live=r.players.filter(p=>s.hearts[p.id]>0);
  if(live.length<=1){finish(r,live.length?`${live[0].nick}님 승리!`:'무승부');return;}
  s.turnIndex=nextIndex(r,(s.turnIndex+1)%r.players.length,p=>s.hearts[p.id]>0);
  s.turn=r.players[s.turnIndex].id;s.timer=Math.max(7,20-Math.floor(s.round/3));
  s.deadline=Date.now()+s.timer*1000;
}
const lastChar=w=>w.at(-1);
const initials = (c)=>{
  const set=new Set([c]);
  // Common initial-sound rule variants (ㄹ→ㄴ/ㅇ, ㄴ→ㅇ).
  const code=c.charCodeAt(0)-44032;
  if(code<0||code>=11172)return set;
  const cho=Math.floor(code/588),jung=Math.floor(code%588/28);
  if(cho===5){ // ㄹ
    if([2,6,12,17,20].includes(jung))set.add(String.fromCharCode(44032+11*588+code%588));
    else set.add(String.fromCharCode(44032+2*588+code%588));
  }
  if(cho===2&&[2,6,12,17,20].includes(jung))set.add(String.fromCharCode(44032+11*588+code%588));
  return set;
};
const YUT_ROUTES={
  outer:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
  left:[0,1,2,3,4,5,21,22,23,24,25,15,16,17,18,19,20],
  right:[0,1,2,3,4,5,6,7,8,9,10,26,27,23,24,25,15,16,17,18,19,20]
};
function moveYut(r,sid,pieceIndex,shortcut=true) {
  const s=r.state;
  const n=Number(pieceIndex);
  if(!Number.isInteger(n)||n<0||n>3)throw err(400,'말을 선택하세요.');
  const mine=s.pieces[sid],p=mine[n];
  if(p.done)throw err(400,'이미 도착한 말입니다.');
  let route=p.route,ix=p.index;
  if(p.node===5&&shortcut&&route==='outer') {route='left';ix=5;}
  if(p.node===10&&shortcut&&route==='outer') {route='right';ix=10;}
  const destination=ix+s.pending;
  if(destination<0)throw err(400,'빽도로 움직일 수 없는 말입니다.');
  const done=destination>=YUT_ROUTES[route].length;
  const to=done?20:YUT_ROUTES[route][destination];
  const stacked=mine.map((q,j)=>j).filter(j=>j!==n&&!mine[j].done&&p.node!==0&&mine[j].node===p.node);
  const moving=[n,...stacked];
  for(const j of moving){mine[j]={node:to,route,index:destination,done};}
  let caught=false;
  if(!done){
    for(const [otherId,ps] of Object.entries(s.pieces)){
      if(otherId===sid)continue;
      ps.forEach((other,j)=>{if(!other.done&&other.node===to&&to!==0){ps[j]={node:0,route:'outer',index:0,done:false};caught=true;}});
    }
  }
  s.history.push(`${player(r,sid)?.nick}: ${s.rollName} → ${n+1}번 말${caught?' (잡기!)':''}`);
  s.history=s.history.slice(-8);
  if(mine.every(q=>q.done)){finish(r,`${player(r,sid).nick}님이 윷놀이에서 승리했습니다!`);return;}
  const bonus=s.bonus||caught;
  s.pending=null;s.rollName=null;s.bonus=false;
  if(!bonus){s.turnIndex=(s.turnIndex+1)%r.players.length;s.turn=r.players[s.turnIndex].id;}
  touch(r,bonus?'한 번 더 던지세요!':'다음 차례입니다.');
}
function act(r,sid,type,data={},transport='http') {
  requireMember(r,sid);
  const host=r.host===sid,st=r.status,s=r.state;
  if(type==='rename'){player(r,sid).nick=cleanNick(data.nick);touch(r);return;}
  if(type==='ready') {if(st!=='lobby'||host)throw err(400,'준비를 바꿀 수 없습니다.');const p=player(r,sid);p.ready=!p.ready;touch(r);return;}
  if(type==='start') {if(!host||st!=='lobby')throw err(403,'방장만 게임을 시작할 수 있습니다.');start(r);return;}
  if(type==='rematch'){if(!host||st!=='finished')throw err(403,'종료 후 방장만 재대결을 준비할 수 있습니다.');reset(r);return;}
  if(type==='chat'){
    if(st!=='playing'||!['mafia','doodle'].includes(r.game))throw err(400,'채팅을 사용할 수 없습니다.');
    if(r.game==='mafia'&&(s.phase==='night'||!s.alive.includes(sid)))throw err(400,'낮에 생존자만 채팅할 수 있습니다.');
    if(r.game==='doodle'&&sid===s.artist)throw err(400,'화가는 정답을 채팅할 수 없습니다.');
    const msg=clampText(data.text,80);if(!msg)return;
    if(r.game==='doodle') {
      if(msg.replace(/\s/g,'')===s.word.replace(/\s/g,'')) {
        s.scores[sid]+=120;s.scores[s.artist]+=70;s.chat.push({nick:player(r,sid).nick,text:'정답을 맞혔습니다!',correct:true});
        touch(r,`${player(r,sid).nick}님 정답! ${s.word}`);
        nextDoodle(r);return;
      }
      s.chat.push({nick:player(r,sid).nick,text:msg});s.chat=s.chat.slice(-30);
    } else {s.chat.push({nick:player(r,sid).nick,text:msg});s.chat=s.chat.slice(-60);}
    touch(r);return;
  }
  if(st!=='playing')throw err(400,'게임이 진행 중이 아닙니다.');
  if(r.game==='omok') {
    if(type!=='place')throw err(400,'이 게임에서 지원하지 않는 행동입니다.');
    if(s.turn!==sid)throw err(400,'상대방 차례입니다.');
    const x=Number(data.x),y=Number(data.y),idx=y*15+x;
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>14||y<0||y>14||s.board[idx])throw err(400,'놓을 수 없는 자리입니다.');
    const stone=r.players[0].id===sid?'black':'white';s.black='black';s.board[idx]=stone;
    const result=checkOmok(s,x,y,stone);
    if(result.forbidden){s.board[idx]=null;throw err(400,'흑의 쌍삼 금수(직선 열린 삼)입니다.');}
    s.last={x,y};s.moves++;
    if(result.five){s.winner=sid;finish(r,`${player(r,sid).nick}님이 오목에서 승리했습니다!`);return;}
    if(s.moves===225){finish(r,'무승부입니다.');return;}
    s.turn=r.players.find(p=>p.id!==sid).id;touch(r);return;
  }
  if(r.game==='wordchain'){
    if(type!=='word')throw err(400,'올바른 단어를 입력하세요.');
    if(s.turn!==sid)throw err(400,'다른 사람의 차례입니다.');
    if(Date.now()>s.deadline){throw err(400,'제한 시간이 지났습니다.');}
    const w=clampText(data.word,24).replace(/\s/g,'');
    if(!/^[가-힣]{2,}$/.test(w))throw err(400,'두 글자 이상의 한글 단어를 입력하세요.');
    if(!lexicon.has(w))throw err(400,'현재 내장된 단어 목록에 없는 단어입니다.');
    if(s.history.includes(w))throw err(400,'이미 사용한 단어입니다.');
    if(!initials(lastChar(s.history.at(-1))).has(w[0]))throw err(400,`'${lastChar(s.history.at(-1))}'(으)로 시작해야 합니다.`);
    if(s.round<=4&&!words.some(t=>t!==w&&initials(lastChar(w)).has(t[0])&&!s.history.includes(t)))throw err(400,'첫 4턴에는 한방단어를 사용할 수 없습니다.');
    s.history.push(w);s.used.push(w);s.round++;
    const pts=w.length*10+(w.includes(s.mission)?35:0)+Math.floor(Math.max(0,s.deadline-Date.now())/1000)*3;
    s.scores[sid]+=pts;s.reason=`${player(r,sid).nick}: ${w} (+${pts}점)`;
    if(s.round%4===0)s.mission=pick(['사','가','구','나','리','자','이','도','수']);
    nextChainTurn(r);touch(r,s.reason);return;
  }
  if(r.game==='doodle') {
    if(type==='stroke'){
      if(sid!==s.artist)throw err(403,'화가만 그릴 수 있습니다.');
      const points=data.points;
      if(transport!=='ws')throw err(426,'낙서왕 그리기는 WebSocket으로 전송해야 합니다.');
      if(!Array.isArray(points)||points.length<1||points.length>160||s.strokes.length>=5000)throw err(400,'그림 데이터가 너무 큽니다.');
      if(!points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)))throw err(400,'잘못된 좌표입니다.');
      const stroke={points,color:['#29283f','#ff627a','#2777c5','#30a77a','#e5b23a'].includes(data.color)?data.color:'#29283f',width:[2,5,9,16].includes(data.width)?data.width:5};
      s.strokes.push(stroke);s.strokeSeq=(s.strokeSeq||0)+1;
      r.updatedAt=Date.now();sendDoodle(r,{type:'stroke',round:s.round,seq:s.strokeSeq,stroke});return;
    }
    if(type==='clear'){
      if(transport!=='ws')throw err(426,'낙서왕 지우기는 WebSocket으로 전송해야 합니다.');
      if(sid!==s.artist)throw err(403,'화가만 지울 수 있습니다.');
      s.strokes=[];s.strokeSeq=(s.strokeSeq||0)+1;
      r.updatedAt=Date.now();sendDoodle(r,{type:'clear',round:s.round,seq:s.strokeSeq});return;
    }
    if(type==='skip'){if(sid!==s.artist&&!host)throw err(403,'화가만 건너뛸 수 있습니다.');nextDoodle(r);return;}
  }
  if(r.game==='liar'){
    if(type==='clue'){
      if(s.phase!=='clue'||s.speaker!==sid)throw err(400,'설명할 차례가 아닙니다.');
      const clue=clampText(data.text,60);if(!clue)throw err(400,'힌트를 입력하세요.');
      if(clue.includes(s.word))throw err(400,'제시어를 직접 말할 수 없습니다.');
      s.clues.push({by:sid,text:clue});s.speakerIndex++;
      if(s.speakerIndex>=r.players.length){s.phase='vote';s.speaker=null;}
      else s.speaker=r.players[s.speakerIndex].id;
      touch(r);return;
    }
    if(type==='vote'){
      if(s.phase!=='vote'||s.votes[sid])throw err(400,'투표할 수 없습니다.');
      if(!r.players.some(p=>p.id===data.target))throw err(400,'투표 대상을 선택하세요.');
      s.votes[sid]=data.target;
      if(Object.keys(s.votes).length===r.players.length){
        const count={};Object.values(s.votes).forEach(x=>count[x]=(count[x]||0)+1);
        const tally=Object.entries(count).sort((a,b)=>b[1]-a[1]);
        if(tally.length>1&&tally[0][1]===tally[1][1]){s.phase='result';finish(r,'투표 동점! 라이어 승리.');return;}
        s.chosen=tally[0][0];
        if(s.chosen===s.liar){s.phase='guess';touch(r,'라이어를 찾아냈습니다! 라이어의 최후 추리 차례입니다.');return;}
        s.phase='result';finish(r,`라이어를 놓쳤습니다! 라이어: ${player(r,s.liar)?.nick} (${s.word})`);return;
      }
      touch(r);return;
    }
    if(type==='guess'){
      if(s.phase!=='guess'||sid!==s.liar)throw err(403,'라이어만 정답을 추측할 수 있습니다.');
      s.guess=clampText(data.text,40);s.phase='result';
      finish(r,s.guess===s.word?`라이어가 '${s.word}'를 맞혔습니다! 라이어 승리.`:`시민들이 라이어를 찾아냈습니다! 정답은 '${s.word}'입니다.`);return;
    }
  }
  if(r.game==='mafia'){
    if(!s.alive.includes(sid))throw err(403,'탈락한 플레이어는 행동할 수 없습니다.');
    if(type==='night'){
      if(s.phase!=='night')throw err(400,'밤이 아닙니다.');
      if(s.roles[sid]==='시민')throw err(403,'시민은 밤에 행동하지 않습니다.');
      const target=data.target;
      if(!s.alive.includes(target))throw err(400,'생존자를 선택하세요.');
      if(s.roles[sid]==='마피아'&&s.roles[target]==='마피아')throw err(400,'같은 마피아를 선택할 수 없습니다.');
      s.nightActions[sid]=target;
      const expected=s.alive.filter(x=>s.roles[x]!=='시민');
      if(expected.every(x=>s.nightActions[x]))resolveNight(r);else touch(r);return;
    }
    if(type==='discussionEnd'){
      if(s.phase!=='discussion'||!host)throw err(403,'방장만 토론을 종료할 수 있습니다.');
      s.phase='vote';touch(r,'투표가 시작되었습니다.');return;
    }
    if(type==='vote'){
      if(s.phase!=='vote'||s.votes[sid])throw err(400,'지금 투표할 수 없습니다.');
      const target=data.target;
      if(target!=='skip'&&!s.alive.includes(target))throw err(400,'생존자를 선택하세요.');
      s.votes[sid]=target;
      if(s.alive.every(x=>s.votes[x]))resolveVote(r);else touch(r);return;
    }
  }
  if(r.game==='bell'){
    if(type!=='ring')throw err(400,'종을 눌러 보세요.');
    if(!s.draws)throw err(400,'카드가 아직 열리지 않았습니다.');
    const cards=Object.values(s.cards).filter(Boolean);
    const counts={};cards.forEach(c=>counts[c]=(counts[c]||0)+1);
    const correct=Object.values(counts).some(n=>n>=2)||cards.includes('도깨비');
    if(correct){const gain=Math.max(2,s.pile);s.scores[sid]+=gain;s.pile=0;
      s.cards=Object.fromEntries(r.players.map(p=>[p.id,null]));s.feedback=`${player(r,sid).nick}님 정답! +${gain}점`;s.deadline=Date.now()+2100;
    }else{s.scores[sid]=Math.max(0,s.scores[sid]-2);s.feedback=`${player(r,sid).nick}님 오답! -2점`;s.deadline=Date.now()+1300;}
    touch(r,s.feedback);return;
  }
  if(r.game==='yut'){
    if(s.turn!==sid)throw err(403,'다른 사람의 차례입니다.');
    if(type==='roll'){
      if(s.pending!==null)throw err(400,'먼저 말을 이동하세요.');
      const roll=pick([1,1,1,2,2,2,3,3,3,4,4,5,-1]);
      s.pending=roll;s.rollName=({'1':'도','2':'개','3':'걸','4':'윷','5':'모','-1':'빽도'})[roll];s.bonus=roll===4||roll===5;
      if(roll===-1&&!s.pieces[sid].some(x=>x.node!==0&&!x.done)){
        s.pending=null;s.turnIndex=(s.turnIndex+1)%r.players.length;s.turn=r.players[s.turnIndex].id;
        touch(r,'움직일 말이 없어 빽도 차례를 넘깁니다.');return;
      }
      touch(r,`${player(r,sid).nick}: ${s.rollName}!`);return;
    }
    if(type==='move'){
      if(s.pending===null)throw err(400,'먼저 윷을 던지세요.');
      moveYut(r,sid,data.index,data.shortcut!==false);return;
    }
  }
  throw err(400,'현재 상태에서 사용할 수 없는 행동입니다.');
}
function gameTick(){
  const now=Date.now();
  for(const r of rooms.values()) {
    if(r.status!=='playing') continue;
    const s=r.state;
    if(r.game==='wordchain'&&now>s.deadline){
      const loser=s.turn;s.hearts[loser]--;s.reason=`${player(r,loser)?.nick}님 시간 초과! 목숨 -1`;
      nextChainTurn(r);touch(r,s.reason);
    } else if(r.game==='doodle'&&now>s.deadline){
      touch(r,`시간 종료! 정답: ${s.word}`);nextDoodle(r);
    } else if(r.game==='bell'&&now>s.deadline){
      if(s.draws>=s.maxDraws){
        const top=Object.entries(s.scores).sort((a,b)=>b[1]-a[1])[0];finish(r,`종 대결 종료! ${player(r,top[0])?.nick}님 우승 (${top[1]}점)`);continue;
      }
      const who=r.players[s.draws%r.players.length].id;
      s.cards[who]=pick(['과일','과일','달','달','별','별','도깨비']);
      s.draws++;s.pile++;s.deadline=now+1800;s.feedback='같은 그림이 두 장이거나 도깨비가 보이면 종을 치세요!';touch(r);
    }
  }
  for(const [code,r] of rooms)if(now-r.updatedAt>1000*60*60*4)rooms.delete(code);
}
const ticker=setInterval(gameTick,300);ticker.unref();

const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json; charset=utf-8'};
const handler=async(req,res)=>{
  const u=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(u.pathname);
  try {
    if(pathname==='/api/health')return simpleReply(res,200,{ok:true,rooms:rooms.size});
    if(pathname==='/api/rooms'&&req.method==='GET'){
      const game=u.searchParams.get('game');const list=[...rooms.values()].filter(r=>r.status==='lobby'&&(!game||r.game===game)).map(r=>({id:r.id,game:r.game,host:player(r,r.host)?.nick,count:r.players.length,max:GAME_INFO[r.game].max}));
      return simpleReply(res,200,{rooms:list.slice(-40).reverse()});
    }
    if(pathname==='/api/rooms'&&req.method==='POST'){
      const b=await body(req);if(!GAME_INFO[b.game])throw err(400,'게임을 선택하세요.');
      const sid=b.sid?cleanSid(b.sid):id();const nick=cleanNick(b.nick);
      let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
      const r={id:code,game:b.game,host:sid,players:[{id:sid,nick,ready:true}],status:'lobby',state:null,notices:[],updatedAt:Date.now()};
      rooms.set(code,r);return simpleReply(res,201,{sid,room:sanitize(r,sid)});
    }
    const roomPath=pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})(?:\/(join|action|leave))?$/i);
    if(roomPath){
      const r=getRoom(roomPath[1]);const op=roomPath[2];
      if(!op&&req.method==='GET'){
        const sid=cleanSid(u.searchParams.get('sid'));requireMember(r,sid);return simpleReply(res,200,{room:sanitize(r,sid)});
      }
      if(req.method!=='POST')throw err(405,'지원하지 않는 요청입니다.');
      const b=await body(req);const sid=b.sid?cleanSid(b.sid):id();
      if(op==='join'){
        if(!player(r,sid)){
          if(r.status!=='lobby')throw err(400,'진행 중인 방에는 참가할 수 없습니다.');
          if(r.players.length>=GAME_INFO[r.game].max)throw err(400,'방이 가득 찼습니다.');
          r.players.push({id:sid,nick:cleanNick(b.nick),ready:false});
        }
        touch(r,`${player(r,sid).nick}님이 입장했습니다.`);
        return simpleReply(res,200,{sid,room:sanitize(r,sid)});
      }
      requireMember(r,sid);
      if(op==='action'){act(r,sid,clampText(b.type,40),b.payload||{});return simpleReply(res,200,{room:sanitize(r,sid)});}
      if(op==='leave'){
        const wasHost=r.host===sid;
        r.players=r.players.filter(p=>p.id!==sid);
        if(!r.players.length){rooms.delete(r.id);}else{
          if(wasHost)r.host=r.players[0].id;
          if(r.status==='playing')reset(r);else touch(r,'참가자가 퇴장했습니다.');
        }
        return simpleReply(res,200,{ok:true});
      }
    }
    if(pathname==='/api/events'&&req.method==='GET'){
      const sid=cleanSid(u.searchParams.get('sid')),code=clampText(u.searchParams.get('code'),12).toUpperCase();
      const r=getRoom(code);requireMember(r,sid);
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
      res.write(': connected\n\n');
      if(!connections.has(sid))connections.set(sid,new Set());
      connections.get(sid).add(res);
      pushState(sid,r);
      const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},20000);
      req.on('close',()=>{clearInterval(ping);connections.get(sid)?.delete(res);});return;
    }
    if(req.method==='GET'&&!pathname.startsWith('/api/')){
      let file=pathname==='/'?'index.html':pathname.replace(/^\//,'');
      const absolute=path.resolve(PUBLIC,file);
      if(!absolute.startsWith(PUBLIC+path.sep)&&absolute!==path.join(PUBLIC,'index.html'))throw err(403,'허용되지 않은 경로입니다.');
      let s;try{s=await stat(absolute);}catch{throw err(404,'파일이 없습니다.');}
      if(!s.isFile())throw err(404,'파일이 없습니다.');
      const data=await readFile(absolute);
      res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':path.extname(file)==='.html'?'no-cache':'public, max-age=300'});
      return res.end(data);
    }
    throw err(404,'요청을 찾지 못했습니다.');
  } catch(e) {simpleReply(res,e.status||500,{error:e.message||'서버 오류'});}
};
export const server=http.createServer(handler);
// Drawing, erasing, guessing and skipping are persistent bidirectional WebSocket messages.
server.on('upgrade',(req,socket,head)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname!=='/ws/doodle')throw err(404,'WebSocket 경로가 아닙니다.');
  // Browser clients must be same-origin; sid identifies an existing room member.
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw err(403,'출처가 올바르지 않습니다.');
  const sid=cleanSid(u.searchParams.get('sid')),r=getRoom(u.searchParams.get('code'));
  requireMember(r,sid);
  if(r.game!=='doodle')throw err(403,'낙서왕 전용 연결입니다.');
  const clients=doodleSockets.get(r.id)||new Set();
  if(clients.size>=24)throw err(429,'그림판 연결이 너무 많습니다.');
  doodleSockets.set(r.id,clients);
  const transport=acceptWebSocket(req,socket,head,{
   message(packet,client){
    try{
     requireMember(r,sid);
     if(packet.type==='sync'){client.send({type:'sync',round:r.state?.round||0,seq:r.state?.strokeSeq||0,strokes:r.state?.strokes||[]});return;}
     if(packet.round!==r.state?.round)throw err(409,'이미 끝난 라운드의 그림입니다.');
     if(!['stroke','clear','chat','skip'].includes(packet.type))throw err(400,'잘못된 동작입니다.');
     // Validate all gameplay actions through the same rule engine.
     act(r,sid,packet.type,packet.payload||{},'ws');
    }catch(e){client.send({type:'error',message:e.message||'그림 입력에 실패했습니다.'});}
   },
   close(client){clients.delete(client);if(!clients.size)doodleSockets.delete(r.id);}
  });
  if(transport){clients.add(transport);transport.send({type:'sync',round:r.state?.round||0,seq:r.state?.strokeSeq||0,strokes:r.state?.strokes||[]});}
 }catch(e){socket.end(`HTTP/1.1 ${e.status||400} Error\r\nConnection: close\r\n\r\n`);}
});
if(process.env.NODE_ENV!=='test')server.listen(PORT,'0.0.0.0',()=>console.log(`모여게임즈: http://localhost:${PORT}`));
