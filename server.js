import http from 'node:http';
import {createMafiaState,publicMafiaState,actMafia,tickMafia} from './mafia-engine.mjs';
import { readFile, stat } from 'node:fs/promises';
import { loadDictionary } from './data/load-lexicon.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomInt } from 'node:crypto';
import {acceptWebSocket} from './websocket-lite.mjs';
import {applyYutMove,legalYutMoves,yutSelectedSteps,usableYutRolls} from './public/yut-solo-engine.mjs';
import {startRummikub, sanitizeRummikub, actRummikub, tickRummikub, labelRummikub} from './rummikub/multiplayer.mjs';
import {handleMarbleRequest} from './marble-server.mjs';
import {handleAccountRequest,multiplayerAccount,requireEscapeAccess} from './auth.mjs';
import {TURN_SECONDS, dictionaryIndex, replies, validReply} from './public/chain-utils.mjs';
import { words as starterWords, startingWords, drawingWords, liarWords } from './data/words.js';
// An imported full dictionary overrides the starter lexicon for multiplayer.
let words = starterWords;
try {
  const imported = loadDictionary();
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
const wordIndex = dictionaryIndex(words);
const DICT_COUNT = words.length;
const START_POOL = {
 wordchain: [...startingWords.filter(w=>lexicon.has(w)), ...words.filter((w,i)=>i%97===0 && w.length>=2 && w.length<=5)],
 kungkungtta: [...startingWords.filter(w=>lexicon.has(w)&&w.length===3), ...words.filter((w,i)=>i%149===0 && w.length===3)]
};
const lastStartingWord={wordchain:null,kungkungtta:null};
function openingWord(mode){
 let pool=START_POOL[mode]||START_POOL.wordchain;
 // Opening must have at least one legal response; prefer a different opening each match.
 for(let n=0;n<50;n++){
  const candidate=n<12 ? pick(pool.slice(0,Math.min(12,pool.length))) : pick(pool);
  if(candidate!==lastStartingWord[mode] && replies(wordIndex,candidate,new Set([candidate]),mode,null,1).length){lastStartingWord[mode]=candidate;return candidate;}
 }
 const fallback=pool.find(w=>w!==lastStartingWord[mode]&&replies(wordIndex,w,new Set([w]),mode,null,1).length) || '사과';
 lastStartingWord[mode]=fallback;return fallback;
}
const configGames=new Set(['wordchain','omok','yut','doodle','rummikub']);
const defaults={wordchain:30,omok:30,yut:45,doodle:90,rummikub:60};
function makeOptions(game,value={}){
 const opts={turnSeconds:configGames.has(game)?defaults[game]:null,wordMode:'wordchain',stoneStyle:'normal'};
 if(game==='mafia')opts.mafiaMode=value.mafiaMode==='classic'?'classic':'special';
 if(configGames.has(game)&&TURN_SECONDS.includes(Number(value.turnSeconds)))opts.turnSeconds=Number(value.turnSeconds);
 if(game==='wordchain'&&value.wordMode==='kungkungtta')opts.wordMode='kungkungtta';
 if(game==='omok'&&value.stoneStyle==='crazy')opts.stoneStyle='crazy';
 return opts;
}


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
  rummikub: { name:'루미큐브', min:2, max:4 },
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
    players:r.players.map(p=>({id:p.id,nick:p.nick,ready:p.ready})),options:r.options,
    notices:r.notices.slice(-8),lobbyChat:(r.lobbyChat||[]).slice(-40),me:sid,now:Date.now(),updatedAt:r.updatedAt,version:r.version||0 };
  if(!r.state) return pub;
  const s=r.state;
  if(r.game==='rummikub') {pub.state=sanitizeRummikub(r,sid);
  } else if(r.game==='mafia') {
    pub.state=publicMafiaState(s,sid,r.status==='finished');
  } else if(r.game==='liar') {
    pub.state={...s,word: s.phase==='result' ? s.word : undefined,
      liar:s.phase==='result' ? s.liar : undefined,
      myWord:sid===s.liar?null:s.word,isLiar:sid===s.liar,
      votes:Object.keys(s.votes).map(v=>v)};
  } else if(r.game==='doodle') {
    pub.state={...s,word:sid===s.artist || r.status==='finished' ? s.word:undefined,
      wordLength:s.word.length};
  } else if(r.game==='wordchain') {
    pub.state={...s,hints:s.hints?.for===sid ? s.hints : undefined};
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
    case 'rummikub':startRummikub(r);break;
    case 'omok':r.state={board:Array(225).fill(null),turn:ids[0],winner:null,last:null,moves:0,deadline:Date.now()+r.options.turnSeconds*1000};break;
    case 'wordchain':r.state={turn:ids[0],turnIndex:0,history:[openingWord(r.options.wordMode)],used:[],usedEndings:Object.fromEntries(ids.map(x=>[x,[]])),hearts:Object.fromEntries(ids.map(x=>[x,2])),scores:Object.fromEntries(ids.map(x=>[x,0])),deadline:Date.now()+r.options.turnSeconds*1000,round:1,mission:pick(['사','가','구','나','리','자','이','도','수']),timer:r.options.turnSeconds,reason:null,hints:null,oneShot:false};break;
    case 'doodle':r.state={artist:ids[0],artistIndex:0,round:1,maxRounds:Math.min(12,ids.length*3),word:pick(drawingWords),strokes:[],strokeSeq:0,chat:[],scores:Object.fromEntries(ids.map(x=>[x,0])),deadline:Date.now()+r.options.turnSeconds*1000,revealed:false};break;
    case 'liar': {
      const [topic,word]=pick(liarWords);
      r.state={topic,word,liar:pick(ids),phase:'clue',speaker:ids[0],speakerIndex:0,clues:[],votes:{},guess:'',result:null};break;
    }
    case 'mafia':r.state=createMafiaState(ids,r.options.mafiaMode);break;
    case 'bell':r.state={cards:Object.fromEntries(ids.map(x=>[x,null])),scores:Object.fromEntries(ids.map(x=>[x,0])),pile:0,draws:0,maxDraws:24,lastDraw:Date.now(),round:1,feedback:'카드가 뒤집힐 때를 기다려요.',deadline:Date.now()+1900};break;
    case 'yut':r.state={turn:ids[0],turnIndex:0,pieces:Object.fromEntries(ids.map(x=>[x,Array.from({length:4},()=>({node:0,route:'outer',index:0,done:false}))])),pending:null,rolls:[],phase:'throw',throwsRemaining:1,rollName:null,history:[],result:null,deadline:Date.now()+r.options.turnSeconds*1000};break;
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
function nextDoodle(r) {
  const s=r.state,prev=s.word;
  if(s.round>=s.maxRounds){ finish(r,`그림 대결 종료! 우승: ${player(r,Object.entries(s.scores).sort((a,b)=>b[1]-a[1])[0][0])?.nick}`);return; }
  s.round++;
  s.artistIndex=(s.artistIndex+1)%r.players.length;
  s.artist=r.players[s.artistIndex].id;
  let next=pick(drawingWords);if(next===prev)next=pick(drawingWords);
  s.word=next;s.strokes=[];s.strokeSeq=0;s.deadline=Date.now()+r.options.turnSeconds*1000;s.revealed=false;
  touch(r,`${s.round}라운드: 새로운 화가가 그림을 그립니다.`);
}
function nextChainTurn(r) {
  const s=r.state,live=r.players.filter(p=>s.hearts[p.id]>0);
  if(live.length<=1){finish(r,live.length?`${live[0].nick}님 승리!`:'무승부');return;}
  s.turnIndex=nextIndex(r,(s.turnIndex+1)%r.players.length,p=>s.hearts[p.id]>0);
  s.turn=r.players[s.turnIndex].id;s.timer=r.options.turnSeconds;
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

function nextYutTurn(r,message){
 const s=r.state;s.rolls=[];s.pending=null;s.rollName=null;s.phase='throw';s.throwsRemaining=1;
 s.turnIndex=(s.turnIndex+1)%r.players.length;s.turn=r.players[s.turnIndex].id;
 s.deadline=Date.now()+r.options.turnSeconds*1000;touch(r,message||'다음 차례입니다.');
}
function moveYut(r,sid,pieceIndex,shortcut=true,rollIndices=[0]){
 const s=r.state,n=Number(pieceIndex);
 if(!Number.isInteger(n)||n<0||n>3)throw err(400,'말을 선택하세요.');
 if(s.phase!=='move'||!s.rolls?.length)throw err(400,'추가 던지기를 마친 뒤 말을 이동하세요.');
 let steps;try{steps=yutSelectedSteps(s.rolls,rollIndices);}catch{throw err(400,'이동할 윷 결과를 다시 선택하세요.');}
 const mine=s.pieces[sid];
 if(!legalYutMoves(mine,steps).some(m=>m.index===n&&m.shortcut===shortcut))throw err(400,'그 방향으로 이동할 수 없습니다.');
 const labels=rollIndices.map(i=>({'1':'도','2':'개','3':'걸','4':'윷','5':'모','-1':'빽도'})[s.rolls[i]]).join('+');
 const result=applyYutMove(mine,[],n,steps,shortcut);s.pieces[sid]=result.mine;let caught=0;
 if(!result.done&&result.to!==0)for(const [otherId,ps] of Object.entries(s.pieces)){
  if(otherId===sid)continue;
  ps.forEach((p,j)=>{if(!p.done&&p.node===result.to){ps[j]={node:0,route:'outer',index:0,done:false};caught++;}});
 }
 s.lastMove={sid,index:n,to:result.to,at:Date.now(),shortcut};
 s.history.push(`${player(r,sid)?.nick}: ${labels} → ${n+1}번 말${caught?' (상대 말 '+caught+'개 잡기!)':''}${result.done?' (완주!)':''}`);
 s.history=s.history.slice(-8);
 if(result.won){finish(r,`${player(r,sid).nick}님이 윷놀이에서 승리했습니다!`);return;}
 const used=new Set(rollIndices);s.rolls=s.rolls.filter((_,i)=>!used.has(i));
 s.rolls=usableYutRolls(s.pieces[sid],s.rolls);
 s.deadline=Date.now()+r.options.turnSeconds*1000;
 if(caught){s.phase='throw';s.throwsRemaining=1;touch(r,'상대 말을 잡았어요! 남은 결과를 유지하고 먼저 추가로 던지세요.');}
 else if(s.rolls.length){s.phase='move';touch(r,'남은 윷 결과를 골라 말을 움직이세요.');}
 else nextYutTurn(r,'모든 윷 결과를 사용했습니다. 다음 차례입니다.');
}
function act(r,sid,type,data={},transport='http') {
  requireMember(r,sid);
  const host=r.host===sid,st=r.status,s=r.state;
  if(type==='rename'){player(r,sid).nick=cleanNick(data.nick);touch(r);return;}
  if(type==='settings'){
    if(st!=='lobby'||!host)throw err(403,'대기실에서 방장만 설정할 수 있습니다.');
    r.options=makeOptions(r.game,{...r.options,...data});
    touch(r,'게임 설정이 변경되었습니다.');return;
  }
  if(type==='lobbyChat'){
    if(st!=='lobby')throw err(400,'대기실에서만 사용할 수 있는 채팅입니다.');
    const message=clampText(data.text,120).trim();
    if(!message)return;
    r.lobbyChatTimes??={};
    const now=Date.now();
    if(now-Number(r.lobbyChatTimes[sid]||0)<800)throw err(429,'채팅은 잠시 간격을 두고 보내주세요.');
    r.lobbyChatTimes[sid]=now;
    r.lobbyChat??=[];
    r.lobbyChat.push({id:id(),sid,nick:player(r,sid).nick,text:message,at:now});
    r.lobbyChat=r.lobbyChat.slice(-40);
    touch(r);return;
  }
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
  if(r.game==='rummikub') {
    actRummikub(r,sid,type,data);
    if(s.result)finish(r,labelRummikub(r,s.result));else touch(r,labelRummikub(r,s.lastMove));
    return;
  }
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
    s.turn=r.players.find(p=>p.id!==sid).id;s.deadline=Date.now()+r.options.turnSeconds*1000;touch(r);return;
  }
  if(r.game==='wordchain'){
    if(type!=='word')throw err(400,'올바른 단어를 입력하세요.');
    if(s.turn!==sid)throw err(400,'다른 사람의 차례입니다.');
    if(Date.now()>s.deadline)throw err(400,'제한 시간이 지났습니다.');
    const w=clampText(data.word,24).replace(/\s/g,'');
    if(!/^[가-힣]{2,24}$/.test(w))throw err(400,'한글 2~24글자를 입력하세요.');
    if(r.options.wordMode==='kungkungtta'&&w.length!==3)throw err(400,'쿵쿵따는 정확히 3글자 단어만 사용할 수 있습니다.');
    if(!lexicon.has(w))throw err(400,'확장 사전에 없는 단어입니다.');
    if(s.history.includes(w))throw err(400,'이미 사용한 단어입니다.');
    const spent=new Set(s.usedEndings[sid]);
    if(!validReply(w,s.history.at(-1),new Set(s.history),r.options.wordMode,spent)){
      if(spent.has(w.at(-1)))throw err(400,`같은 끝글자 '${w.at(-1)}'를 다시 사용할 수 없습니다.`);
      throw err(400,`'${lastChar(s.history.at(-1))}'(으)로 시작해야 합니다.`);
    }
    s.history.push(w);s.used.push(w);s.usedEndings[sid].push(w.at(-1));s.round++;
    const pts=w.length*10+(w.includes(s.mission)?35:0)+Math.floor(Math.max(0,s.deadline-Date.now())/1000)*3;
    s.scores[sid]+=pts;s.reason=`${player(r,sid).nick}: ${w} (+${pts}점)`;
    if(s.round%4===0)s.mission=pick(['사','가','구','나','리','자','이','도','수']);
    // A one-shot word means no currently unused dictionary reply at all.
    // No first-four-round exception. End immediately rather than timing out.
    const response=replies(wordIndex,w,new Set(s.history),r.options.wordMode,null,1);
    if(!response.length){s.oneShot=true;s.reason=`한방단어! ${w}`;finish(r,`한방단어 '${w}'! ${player(r,sid).nick}님 즉시 승리!`);return;}
    s.hints=null;nextChainTurn(r);touch(r,s.reason);return;
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
    const result=actMafia(s,sid,type,data,r.players,r.host);
    if(result.finish)finish(r,result.finish);else touch(r,result.message);
    return;
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
    if(s.phase!=='throw'||s.throwsRemaining<=0)throw err(400,'먼저 말을 이동하세요.');
    const roll=pick([1,1,1,2,2,2,3,3,3,4,4,5,-1]);
    s.rolls.push(roll);s.pending=null;s.lastRoll=roll;
    s.rollName=({'1':'도','2':'개','3':'걸','4':'윷','5':'모','-1':'빽도'})[roll];
    s.throwsRemaining--;if(roll===4||roll===5)s.throwsRemaining++;
    if(s.rolls.length>=24)s.throwsRemaining=0;
    s.deadline=Date.now()+r.options.turnSeconds*1000;
    if(s.throwsRemaining===0){
     s.rolls=usableYutRolls(s.pieces[sid],s.rolls);
     if(!s.rolls.length){nextYutTurn(r,'사용할 수 있는 윷 결과가 없어 다음 차례입니다.');return;}
     s.phase='move';touch(r,`${player(r,sid).nick}: ${s.rollName}! 모두 던졌습니다. 말을 움직이세요.`);
    }else touch(r,`${player(r,sid).nick}: ${s.rollName}! 추가로 던지세요.`);
    return;
   }
   if(type==='move'){moveYut(r,sid,data.index,data.shortcut!==false,Array.isArray(data.rollIndices)?data.rollIndices:[0]);return;}
  }
  throw err(400,'현재 상태에서 사용할 수 없는 행동입니다.');
}
function gameTick(){
  const now=Date.now();
  for(const r of rooms.values()) {
    if(r.status!=='playing') continue;
    const s=r.state;
    if(r.game==='mafia'){
      const result=tickMafia(s,r.players,now);
      if(result){if(result.finish)finish(r,result.finish);else touch(r,result.message);}
    } else if(r.game==='wordchain'&&now>s.deadline){
      const loser=s.turn;
      s.hints={for:loser,words:replies(wordIndex,s.history.at(-1),new Set(s.history),r.options.wordMode,new Set(s.usedEndings[loser]),3)};
      s.hearts[loser]--;s.reason=`${player(r,loser)?.nick}님 시간 초과! 목숨 -1`;
      nextChainTurn(r);touch(r,s.reason);
    } else if(r.game==='rummikub'&&tickRummikub(r)){
      if(s.result)finish(r,labelRummikub(r,s.result));else touch(r,labelRummikub(r,s.lastMove));
    } else if(r.game==='omok'&&now>s.deadline){
      const winner=r.players.find(p=>p.id!==s.turn);finish(r,`${player(r,s.turn).nick}님 시간 초과! ${winner?.nick}님 승리!`);
    } else if(r.game==='yut'&&now>s.deadline){
      nextYutTurn(r,'시간 초과! 다음 사람에게 차례가 넘어갑니다.');
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

// Keep social-preview tags consistent even when public/index.html is regenerated.
const SHARE_URL = 'https://wordchain-game-0nb3.onrender.com/';
const SHARE_IMAGE = SHARE_URL + 'preview-20261120.jpg';
const SOCIAL_TAGS = [
  '<meta property="og:type" content="website" />',
  '<meta property="og:site_name" content="모여게임즈" />',
  '<meta property="og:locale" content="ko_KR" />',
  '<meta property="og:title" content="모여게임즈 | 친구들과 함께하는 게임" />',
  '<meta property="og:description" content="끝말잇기, 오목, 그림 퀴즈까지! 친구들과 실시간으로 즐겨보세요." />',
  '<meta property="og:image" content="' + SHARE_IMAGE + '" />',
  '<meta property="og:image:secure_url" content="' + SHARE_IMAGE + '" />',
  '<meta property="og:image:type" content="image/jpeg" />',
  '<meta property="og:image:width" content="360" />',
  '<meta property="og:image:height" content="189" />',
  '<meta property="og:url" content="' + SHARE_URL + '" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:title" content="모여게임즈 | 친구들과 함께하는 게임" />',
  '<meta name="twitter:image" content="' + SHARE_IMAGE + '" />'
].join('\n  ');

function injectSocialTags(buffer) {
  let html = buffer.toString('utf8');
  // Replace old OG/Twitter tags instead of appending conflicting duplicates.
  html = html.replace(/^[ \t]*<meta\b(?=[^>]*\b(?:property\s*=\s*["']og:|name\s*=\s*["']twitter:))[^>]*>\s*/gmi, '');
  return Buffer.from(html.replace(/<\/head>/i, '  ' + SOCIAL_TAGS + '\n</head>'), 'utf8');
}

const MIME={'.avif':'image/avif','.webp':'image/webp','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
// Explicit public taste route: only the four EP01 client assets are shared.
// The official /escape/* URLs remain member + owner-approval protected.
const ESCAPE_TASTE_ASSETS=new Map([
 ['/taste/escape/index.html','escape/index.html'],
 ['/taste/escape/styles.css','escape/styles.css'],
 ['/taste/escape/game.js','escape/game.js'],
 ['/taste/escape/room3d.js','escape/room3d.js'],
 ['/taste/escape/storybook.js','escape/storybook.js'],
 ['/taste/escape/foyer-scene.avif','escape/foyer-scene.avif']
]);
const handler=async(req,res)=>{
  const u=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(u.pathname);
  try {
    if(await handleAccountRequest(req,res,pathname))return;
    if(await handleMarbleRequest(req,res,pathname))return;
    if(pathname==='/api/health')return simpleReply(res,200,{ok:true,rooms:rooms.size,dictionaryWords:DICT_COUNT,dictionarySource:'표준국어대사전 + 우리말샘'});
    if(pathname==='/api/dictionary'&&req.method==='GET'){res.setHeader('Cache-Control','public, max-age=86400');return simpleReply(res,200,words);}
    if(pathname==='/api/rooms'&&req.method==='GET'){
      await multiplayerAccount(req);
      const game=u.searchParams.get('game');const list=[...rooms.values()].filter(r=>r.status==='lobby'&&(!game||r.game===game)).map(r=>({id:r.id,game:r.game,host:player(r,r.host)?.nick,count:r.players.length,max:GAME_INFO[r.game].max}));
      return simpleReply(res,200,{rooms:list.slice(-40).reverse()});
    }
    if(pathname==='/api/rooms'&&req.method==='POST'){
      const b=await body(req);if(!GAME_INFO[b.game])throw err(400,'게임을 선택하세요.');
      const account=await multiplayerAccount(req,b.sid||null);
      const sid=account?.id||(b.sid?cleanSid(b.sid):id()),nick=account?.dripNickname||cleanNick(b.nick);
      let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
      const r={id:code,game:b.game,options:makeOptions(b.game,b.options),host:sid,players:[{id:sid,nick,ready:true}],status:'lobby',state:null,notices:[],updatedAt:Date.now()};
      rooms.set(code,r);return simpleReply(res,201,{sid,room:sanitize(r,sid)});
    }
    const roomPath=pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})(?:\/(join|action|leave))?$/i);
    if(roomPath){
      const r=getRoom(roomPath[1]);const op=roomPath[2];
      if(!op&&req.method==='GET'){
        const sid=cleanSid(u.searchParams.get('sid'));await multiplayerAccount(req,sid);requireMember(r,sid);return simpleReply(res,200,{room:sanitize(r,sid)});
      }
      if(req.method!=='POST')throw err(405,'지원하지 않는 요청입니다.');
      const b=await body(req);const account=await multiplayerAccount(req,b.sid||null),sid=account?.id||(b.sid?cleanSid(b.sid):id());
      if(op==='join'){
        if(!player(r,sid)){
          if(r.status!=='lobby')throw err(400,'진행 중인 방에는 참가할 수 없습니다.');
          if(r.players.length>=GAME_INFO[r.game].max)throw err(400,'방이 가득 찼습니다.');
          r.players.push({id:sid,nick:account?.dripNickname||cleanNick(b.nick),ready:false});
        }
        touch(r,`${player(r,sid).nick}님이 입장했습니다.`);
        return simpleReply(res,200,{sid,room:sanitize(r,sid)});
      }
      requireMember(r,sid);
      if(op==='action'){
        const action=clampText(b.type,40);
        if(account && action==='rename')throw err(403,'가입한 드립대학 닉네임은 게임 중 변경할 수 없습니다.');
        act(r,sid,action,b.payload||{});return simpleReply(res,200,{room:sanitize(r,sid)});
      }
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
      await multiplayerAccount(req,sid);
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
      const isEscapeTaste=pathname.startsWith('/taste/escape/');
      const tasteFile=ESCAPE_TASTE_ASSETS.get(pathname);
      if(isEscapeTaste&&!tasteFile)throw err(404,'맛보기 파일을 찾을 수 없습니다.');
      const protectedEscape=pathname==='/escape'||pathname.startsWith('/escape/');
      if(protectedEscape)await requireEscapeAccess(req);
      let file=tasteFile||(pathname==='/'?'index.html':pathname.replace(/^\//,''));
      const absolute=path.resolve(PUBLIC,file);
      if(!absolute.startsWith(PUBLIC+path.sep)&&absolute!==path.join(PUBLIC,'index.html'))throw err(403,'허용되지 않은 경로입니다.');
      let s;try{s=await stat(absolute);}catch{throw err(404,'파일이 없습니다.');}
      if(!s.isFile())throw err(404,'파일이 없습니다.');
      let data=await readFile(absolute);
      if(file==='index.html') data=injectSocialTags(data);
      res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':protectedEscape?'private, no-store':isEscapeTaste?'public, no-cache':path.extname(file)==='.html'?'no-cache':'public, max-age=300'});
      return res.end(data);
    }
    throw err(404,'요청을 찾지 못했습니다.');
  } catch(e) {simpleReply(res,e.status||500,{error:e.message||'서버 오류'});}
};
export const server=http.createServer(handler);
// Drawing, erasing, guessing and skipping are persistent bidirectional WebSocket messages.
server.on('upgrade',async(req,socket,head)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname!=='/ws/doodle')throw err(404,'WebSocket 경로가 아닙니다.');
  // Browser clients must be same-origin; sid identifies an existing room member.
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw err(403,'출처가 올바르지 않습니다.');
  const sid=cleanSid(u.searchParams.get('sid'));
  await multiplayerAccount(req,sid);
  const r=getRoom(u.searchParams.get('code'));
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
