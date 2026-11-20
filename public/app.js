import {TURN_SECONDS, dictionaryIndex, replies as chainReplies, validReply, turnsLabel} from './chain-utils.mjs';
import {YUT_NAMES, freshYutPieces, rollYut, legalYutMoves, applyYutMove, chooseCatYutMove} from './yut-solo-engine.mjs';
import {renderSoloYut} from './yut-solo-ui.mjs';
const GAMES=[
 {id:'mafia',name:'가면단',genre:'마피아 · 심리전',players:'4~12명',emoji:'🎭',color:'#e8e0f7',badge:'인기 게임',desc:'낮에는 토론, 밤에는 비밀 임무! 가면 뒤의 마피아를 찾아내세요.',rules:[['낮과 밤','밤에는 직업별 능력을 사용하고, 낮에는 토론과 투표를 진행해요.'],['비밀 직업','마피아·의사·경찰·시민 역할을 비밀리에 배정받아요.'],['승리 조건','마피아를 모두 찾아내면 시민 승리, 마피아 수가 시민 이상이면 마피아 승리.']]},
 {id:'omok',name:'오목',genre:'두뇌 · 보드',players:'2명',emoji:'⚫',color:'#f4dfb8',badge:'1:1 대결',desc:'15×15 바둑판 위에서 펼쳐지는 흑과 백의 전략 대결!',rules:[['돌 놓기','흑돌이 먼저 시작하고 번갈아 빈 교차점에 돌을 둡니다.'],['승리 조건','가로·세로·대각선으로 같은 색 돌 다섯 개를 이으면 승리합니다.'],['금수','흑돌의 직선 열린 쌍삼 금수를 간소화하여 검사합니다.']]},
 {id:'yut',name:'윷놀이',genre:'전통놀이 · 전략',players:'2~4명',emoji:'🎲',color:'#dff1db',badge:'전통 게임',desc:'도·개·걸·윷·모! 말을 업고 잡으며 신나게 달려 보세요.',rules:[['윷 던지기','차례에 윷을 던져 이동할 칸 수를 결정합니다. 윷·모는 추가 차례를 줍니다.'],['말 이동','4개의 말 중 하나를 고르고 지름길을 이용할 수 있습니다.'],['도착','상대 말을 잡으면 한 번 더 던지고, 내 말 4개를 모두 도착시키면 승리합니다.']]},
 {id:'doodle',name:'낙서왕',genre:'그림 · 퀴즈',players:'2~8명',emoji:'🎨',color:'#ffe0e6',badge:'친구 추천',desc:'한 명이 그리면 모두가 맞혀요! 손끝에서 펼쳐지는 그림 퀴즈.',rules:[['돌아가며 그리기','각 라운드의 화가만 제시어를 볼 수 있고 그림을 그립니다.'],['정답 맞히기','그림을 보고 정답을 채팅으로 입력하면 점수를 획득합니다.'],['시간 제한','80초마다 화가와 단어가 바뀝니다. 점수가 가장 높은 사람이 우승합니다.']]},
 {id:'bell',name:'도깨비 종',genre:'순발력 · 카드',players:'2~4명',emoji:'🔔',color:'#fbedce',badge:'순발력 대결',desc:'짝이 보이면 딩동! 누구보다 먼저 종을 울려 점수를 모으세요.',rules:[['카드 펼치기','참가자 앞에 순서대로 카드가 펼쳐집니다.'],['종 치기','같은 그림 두 장 또는 도깨비 카드가 나타나면 바로 종을 치세요.'],['점수','정답이면 카드 더미만큼 득점, 오답이면 2점 감점. 24장 후 우승 결정.']]},
 {id:'liar',name:'라이어 게임',genre:'추리 · 말솜씨',players:'3~8명',emoji:'🕵️',color:'#e6e8ff',badge:'두뇌 싸움',desc:'모두가 같은 단어를 알고 있다? 단 한 명의 라이어를 찾아라!',rules:[['제시어 확인','일반 참가자는 같은 제시어를 받고, 라이어는 주제만 받습니다.'],['한 줄 설명','각자 제시어를 직접 말하지 않고 힌트를 남깁니다.'],['투표와 추리','라이어를 투표로 찾아내세요. 라이어는 잡혀도 제시어를 맞히면 승리합니다.']]},
 {id:'wordchain',name:'끝말잇기',genre:'단어 · 순발력',players:'2~10명',emoji:'🔤',color:'#dcebf9',badge:'고양이 대전 가능',desc:'끝 글자를 이어 빠르게 단어를 제출해요. 시간이 갈수록 더 긴장!',rules:[['단어 이어가기','마지막 단어의 끝 글자(두음법칙 일부 포함)로 시작하는 단어를 냅니다.'],['시간과 목숨','턴당 20초에서 점차 단축됩니다. 시간 초과 시 목숨 1개를 잃습니다.'],['미션과 점수','특정 글자가 들어간 단어와 빠른 입력에 보너스 점수가 붙습니다.']]} 
];
const GAME=Object.fromEntries(GAMES.map(g=>[g.id,g]));
const root=document.getElementById('app');
const $=id=>document.getElementById(id);
const user={nick:localStorage.getItem('moyeo-nick')||`게스트${Math.floor(Math.random()*899+100)}`,sid:sessionStorage.getItem('moyeo-sid')||crypto.randomUUID()};
sessionStorage.setItem('moyeo-sid',user.sid);
let view='home',selection='wordchain',room=null,eventSource=null,apiLive=true,solo=null,allWords=[],allWordSet=new Set(),allWordsByFirst=new Map(),startCounts=new Map(),soloTimer=null,roomList=[],lastRoomUrl='';
// Keep live typing and canvas strokes intact when asynchronous room updates arrive.
let deferredRoomRender=false, activeDoodleStroke=null, composingForm=false, pendingCompositionSubmit=null;
let previousSoloStarter=null, activeGomokuWorker=null;
const gamePrefs={
 wordchain:{turnSeconds:30,wordMode:'wordchain',stoneStyle:'normal'},
 omok:{turnSeconds:30,stoneStyle:'normal'},
 yut:{turnSeconds:45},
 doodle:{turnSeconds:90}
};
const dictionaryLabel='국립국어원 우리말샘 + 표준국어대사전 (확장 명사 437,875개)';
function optionsFor(game){return {...(gamePrefs[game]||{})};}
function settingsFields(game,values=optionsFor(game),roomSettings=false){
 if(!gamePrefs[game])return '';
 const controls=[];
 const attr=roomSettings?'data-room-setting':'data-pref';
 const disabled=roomSettings&&!amHost()?'disabled':'';
 const secondOpts=TURN_SECONDS.map(n=>`<option value="${n}" ${Number(values.turnSeconds)===n?'selected':''}>${n}초</option>`).join('');
 controls.push(`<label>한 수/차례 제한시간<select class="settings-select" ${attr}="turnSeconds" ${disabled}>${secondOpts}</select></label>`);
 if(game==='wordchain')controls.push(`<label>게임 규칙<select class="settings-select" ${attr}="wordMode" ${disabled}><option value="wordchain" ${values.wordMode!=='kungkungtta'?'selected':''}>끝말잇기</option><option value="kungkungtta" ${values.wordMode==='kungkungtta'?'selected':''}>쿵쿵따 (3글자)</option></select></label>`);
 if(game==='omok')controls.push(`<div class="omok-style-setting"><span class="omok-style-heading">오목 스타일 선택</span><div class="omok-style-grid" role="group" aria-label="오목 스타일"><button type="button" class="omok-style-card ${values.stoneStyle!=='crazy'?'selected':''}" data-stone-style-choice="normal" ${roomSettings?'data-stone-style-room="1"':''} ${disabled} aria-pressed="${values.stoneStyle!=='crazy'}"><span class="omok-style-art normal-art"><i></i><i></i></span><strong>정상 버전</strong><small>흑백돌로 두는 기본 오목</small><span class="style-check">${values.stoneStyle!=='crazy'?'●':'○'}</span></button><button type="button" class="omok-style-card ${values.stoneStyle==='crazy'?'selected':''}" data-stone-style-choice="crazy" ${roomSettings?'data-stone-style-room="1"':''} ${disabled} aria-pressed="${values.stoneStyle==='crazy'}"><span class="omok-style-art crazy-art"><i></i><i></i></span><strong>미친 버전</strong><small>캐릭터 오목돌로 두는 한 판</small><span class="style-check">${values.stoneStyle==='crazy'?'●':'○'}</span></button></div></div>`);
 return `<div class="game-settings"><strong>⚙️ 게임 설정 ${roomSettings?'· 방장 변경':''}</strong><div class="settings-grid">${controls.join('')}</div>${game==='wordchain'?'<small>확장 사전 고정 · 같은 사람의 반복 끝글자 자동 금지 · 한방단어 즉시 종료</small>':''}</div>`;
}

let doodleSocket=null, doodleReconnect=null, doodleQueue=[], doodleSocketRoom=null;
const chars=['🐶','🐱','🐻','🐼','🦊','🐰','🐸','🐨','🐧','🐵','🦁','🐯'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gname=game=>GAME[game]?.name||game;
const nick=id=>room?.players.find(p=>p.id===id)?.nick||'플레이어';
const isMe=id=>id===user.sid;
const amHost=()=>room?.host===user.sid;
const formatTime=n=>String(Math.max(0,Math.ceil(n))).padStart(2,'0');
const scoreMap=()=>room?.state?.scores||{};
const btn=(action,label,style='button-secondary',disabled=false,more='')=>`<button type="button" class="button ${style}" data-action="${action}" ${disabled?'disabled':''} ${more}>${label}</button>`;
function toast(message){const zone=$('toastZone');const el=document.createElement('div');el.className='toast';el.textContent=message;zone.append(el);setTimeout(()=>el.remove(),3300);}
function routeHome(){closeDoodleSocket();view='home';selection='wordchain';room=null;solo=null;eventSource?.close();eventSource=null;sessionStorage.removeItem('moyeo-last-room');history.replaceState(null,'',location.pathname);render();}
function setNav(which){document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('is-current',x.dataset.nav===which));}
function revealNickname(){const dialog=$('nickDialog');$('nicknameInput').value=user.nick;dialog.showModal();setTimeout(()=>$('nicknameInput').focus(),50);}
async function api(uri,options){
 const res=await fetch(uri,{...options,headers:{'Content-Type':'application/json',...(options?.headers||{})}});
 let data;try{data=await res.json();}catch{throw new Error('서버 응답을 읽을 수 없습니다.');}
 if(!res.ok)throw new Error(data.error||'요청에 실패했습니다.');return data;
}
function handleErr(e){toast(e.message||'요청에 실패했습니다.');console.error(e);}
async function refreshRooms(game=''){try{const result=await api('/api/rooms'+(game?`?game=${encodeURIComponent(game)}`:''));roomList=result.rooms;apiLive=true;$('serverStatus').textContent='실시간 서버 연결됨';document.querySelector('.online-dot').classList.remove('off');}
 catch(e){roomList=[];apiLive=false;$('serverStatus').textContent='고양이 대전 모드';document.querySelector('.online-dot').classList.add('off');}}
async function createRoom(game){if(!apiLive)return toast('실시간 방은 Node.js 서버에서 실행해야 합니다.');try{const data=await api('/api/rooms',{method:'POST',body:JSON.stringify({game,sid:user.sid,nick:user.nick,options:optionsFor(game)})});enterRoom(data.room);}catch(e){handleErr(e);}}
async function joinRoom(code){if(!apiLive)return toast('실시간 서버 연결이 필요합니다.');try{const data=await api(`/api/rooms/${code.toUpperCase()}/join`,{method:'POST',body:JSON.stringify({sid:user.sid,nick:user.nick})});enterRoom(data.room);$('joinDialog').close();}catch(e){handleErr(e);}}
async function act(type,payload={}){if(!room)return false;try{const data=await api(`/api/rooms/${room.id}/action`,{method:'POST',body:JSON.stringify({sid:user.sid,type,payload})});if(data.room)updateRoom(data.room);return true;}catch(e){handleErr(e);return false;}}
async function leave(){if(room){try{await api(`/api/rooms/${room.id}/leave`,{method:'POST',body:JSON.stringify({sid:user.sid})});}catch{}}routeHome();}
function closeDoodleSocket(){
 clearTimeout(doodleReconnect);doodleReconnect=null;doodleSocketRoom=null;doodleQueue=[];
 const ws=doodleSocket;doodleSocket=null;
 if(ws){ws.onclose=null;ws.onerror=null;ws.onmessage=null;ws.close();}
}
function connectDoodleSocket(){
 if(view!=='room'||room?.game!=='doodle')return;
 if(doodleSocket && (doodleSocket.readyState===WebSocket.OPEN||doodleSocket.readyState===WebSocket.CONNECTING))return;
 const code=room.id;
 const url=`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws/doodle?code=${encodeURIComponent(code)}&sid=${encodeURIComponent(user.sid)}`;
 const ws=new WebSocket(url);doodleSocket=ws;doodleSocketRoom=code;
 ws.onopen=()=>{
  if(doodleSocket!==ws||room?.id!==code)return;
  ws.send(JSON.stringify({type:'sync'}));
  while(doodleQueue.length&&ws.readyState===WebSocket.OPEN){
   const packet=doodleQueue.shift();ws.send(JSON.stringify(packet));
  }
 };
 ws.onmessage=e=>{
  if(doodleSocket!==ws||view!=='room'||room?.id!==code||room?.game!=='doodle')return;
  let msg;try{msg=JSON.parse(e.data);}catch{return;}
  if(msg.type==='error'){toast(msg.message||'그림 전송 오류');return;}
  const state=room.state;if(!state)return;
  if(msg.type==='sync'){
   if(msg.round!==state.round||!Array.isArray(msg.strokes))return;
   // Never replace newer WebSocket events with an older delayed snapshot.
   if(Number(msg.seq||0)<Number(state.strokeSeq||0))return;
   state.strokes=msg.strokes;state.strokeSeq=msg.seq;paintDoodleCanvas();return;
  }
  if(msg.round!==state.round||msg.seq<=Number(state.strokeSeq||0))return;
  if(msg.seq>Number(state.strokeSeq||0)+1){ws.send(JSON.stringify({type:'sync'}));return;}
  state.strokeSeq=msg.seq;
  if(msg.type==='clear'){state.strokes=[];paintDoodleCanvas();}
  if(msg.type==='stroke'&&msg.stroke){state.strokes.push(msg.stroke);if(state.artist!==user.sid)drawDoodleSegment(msg.stroke);}
 };
 ws.onerror=()=>{ /* close event handles reconnect */ };
 ws.onclose=()=>{
  if(doodleSocket!==ws)return;
  doodleSocket=null;
  if(view==='room'&&room?.id===code&&room.game==='doodle'){
   doodleReconnect=setTimeout(connectDoodleSocket,1200);
  }
 };
}
function sendDoodle(type,payload={}){
 const packet={type,payload,round:room?.state?.round};
 if(room?.game!=='doodle'||view!=='room')return false;
 const ws=doodleSocket;
 if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<256000){ws.send(JSON.stringify(packet));return true;}
 if(doodleQueue.length>=200){toast('그림 연결이 느립니다. 잠시 후 다시 그려주세요.');return false;}
 doodleQueue.push(packet);connectDoodleSocket();return true;
}
function enterRoom(newRoom){closeDoodleSocket();room=newRoom;view='room';solo=null;selection=room.game;sessionStorage.setItem('moyeo-last-room',room.id);history.replaceState(null,'',`/?room=${room.id}`);eventSource?.close();eventSource=new EventSource(`/api/events?sid=${encodeURIComponent(user.sid)}&code=${room.id}`);eventSource.addEventListener('state',e=>{try{updateRoom(JSON.parse(e.data));}catch{}});eventSource.onerror=()=>{$('serverStatus').textContent='재연결 중';};render();if(room.game==='doodle')connectDoodleSocket();}
function userEditing() {
 const el=document.activeElement;
 return Boolean(el && root.contains(el) && (el.matches('input, textarea') || el.isContentEditable));
}
function refreshSidebar() {
 const sidebar=root.querySelector('.room-sidebar');
 if(sidebar && view==='room')sidebar.outerHTML=listSidebar();
}
function sameInputContext(a,b) {
 if(a.status!==b.status||a.game!==b.game)return false;
 if(!a.state||!b.state)return true;
 const x=a.state,y=b.state;
 return x.turn===y.turn && x.speaker===y.speaker && x.phase===y.phase && x.round===y.round && x.artist===y.artist;
}
function updateRoom(next) {
 if(!room||room.id!==next.id)return;
 const prev=room,changed=next.version!==prev.version || next.status!==prev.status;
 if(prev.game==='doodle'&&next.game==='doodle'&&prev.state&&next.state&&prev.state.round===next.state.round&&
    Number(prev.state.strokeSeq||0)>Number(next.state.strokeSeq||0)){
  next.state.strokes=prev.state.strokes;next.state.strokeSeq=prev.state.strokeSeq;
 }
 room=next;
 if(!changed)return;
 // Strokes and chat must never replace the canvas or an input element mid-action.
 if(view==='room' && prev.game==='doodle' && next.game==='doodle' && prev.status===next.status &&
    prev.state?.round===next.state?.round && prev.state?.artist===next.state?.artist &&
    patchDoodle(prev.state,next.state)) {
   refreshSidebar();
   return;
 }
 // An SSE update from another player must not cancel Korean IME composition,
 // reset a partially typed answer, or steal the text cursor.
 if(view==='room' && userEditing() && sameInputContext(prev,next)) {
   deferredRoomRender=true;
   refreshSidebar();
   return;
 }
 deferredRoomRender=false;
 render();
}
function card(g){return `<button class="game-card" data-game="${g.id}" aria-label="${g.name} 게임 선택"><div class="game-illust" style="--art-bg:${g.color}"><span class="art-sticker">${g.badge}</span><span class="game-emoji">${g.emoji}</span></div><div class="game-card-body"><div class="game-title-row"><h3>${g.name}</h3><span class="game-arrow">↗</span></div><p class="game-desc">${g.desc}</p><div class="game-meta"><span>👥 ${g.players}</span><span class="mini-tag">${g.genre.split(' · ')[0]}</span></div></div></button>`;}
function home(){setNav('home');return `<div class="home-wrap"><section class="hero"><div class="hero-content"><span class="hero-kicker">WELCOME TO MOYEO GAMES ✦</span><h1>친구들이랑 모여서<br/><em>오늘도 한 판!</em> 🎉</h1><p class="hero-subtitle">방 하나 만들고 링크만 보내면 끝!<br/>다운로드도, 회원가입도 필요 없는 게임 놀이터.</p><div class="hero-buttons">${btn('scrollGames','게임 골라보기 →','button-primary')}${btn('openJoin','초대 코드로 입장','button-secondary')}</div></div><div class="hero-art"><div class="hero-blob"><span class="hero-bunny">🐰</span><span class="hero-bear">🐻</span><span class="hero-dice">🎲</span><span class="hero-cloud">☁️</span><span class="hero-spark one">✳</span><span class="hero-spark two">✦</span></div></div></section><div class="stat-strip"><div class="stat-item"><span class="stat-icon">🎮</span><div><strong>7가지 미니게임</strong><small>골라 하는 즐거움</small></div></div><div class="stat-item"><span class="stat-icon">🫶</span><div><strong>친구와 실시간 대결</strong><small>코드 하나로 만나요</small></div></div><div class="stat-item"><span class="stat-icon">📱</span><div><strong>어디서든 바로</strong><small>PC · 모바일 모두 OK</small></div></div></div><section id="gamesSection"><div class="section-heading"><div><span class="section-eyebrow">PICK YOUR GAME</span><h2>어떤 게임부터 할까요? <span class="pill-count">7 GAMES</span></h2><p>친구들의 취향에 맞춰 골라보세요.</p></div></div><div class="game-grid">${GAMES.map(card).join('')}</div></section><section class="intro-panel"><div><span class="section-eyebrow">HOW TO PLAY</span><h3>딱 3단계면 준비 완료!</h3><p>닉네임 정하기 → 게임방 만들기 → 친구에게 코드 보내기</p></div><span class="intro-emoji">💌</span>${btn('guide','이용 방법 보기 →','button')}</section></div>`;}
function detail(){const g=GAME[selection];setNav('home');const list=roomList.filter(r=>r.game===g.id);return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span><span>게임 선택</span><span>›</span><span style="color:#5b5668">${g.name}</span></div><div class="detail-banner" style="--detail-bg:${g.color}"><div><span class="eyebrow">${g.genre.toUpperCase()}</span><h1>${g.name}</h1><p>${g.desc}</p></div><span class="detail-emoji">${g.emoji}</span></div><div class="detail-layout"><div><section class="panel"><div class="panel-title"><h2>📖 게임 방법</h2><span class="game-mode-tag">${g.players} 플레이</span></div><ul class="rule-list">${g.rules.map(([h,t],i)=>`<li><span class="rule-count">${i+1}</span><div><strong>${h}</strong><small>${t}</small></div></li>`).join('')}</ul>${g.id==='wordchain'?`<p class="game-note">${dictionaryLabel}</p>`:''}${g.id==='yut'?`<p class="game-note">온라인 버전은 이동·지름길·잡기를 중심으로 일부 규칙을 간소화했습니다.</p>`:''}</section><section class="panel" style="margin-top:18px"><div class="panel-title"><h2>👥 참여할 수 있는 게임방</h2><button class="choice-button" data-action="refreshRooms">↻ 새로고침</button></div>${list.length?list.map(r=>`<button class="room-entry" data-join="${r.id}"><span><strong>🔑 ${esc(r.id)}</strong><br/><small>방장 ${esc(r.host)}</small></span><span class="game-mode-tag">${r.count}/${r.max}명 입장 →</span></button>`).join(''):`<div class="empty-state"><span class="icon">🛋️</span><strong>아직 공개 대기방이 없어요.</strong><p>첫 번째 게임방을 만들어 친구를 초대해 보세요!</p></div>`}</section></div><aside class="panel action-panel"><h2>🚀 바로 플레이하기</h2><p>닉네임을 정하고 방을 만들면 초대 코드가 생깁니다.</p><div class="game-prompt">내 닉네임 <strong>${esc(user.nick)}</strong> <button data-action="nick" class="choice-button" style="padding:5px 7px;margin-left:6px">✎ 변경</button></div>${settingsFields(g.id)}${btn('createRoom','＋ 새 게임방 만들기','button-primary full',!apiLive)}${btn('openJoin','🔑 코드로 친구 방 입장','button-secondary full',!apiLive)}${['wordchain','omok','yut'].includes(g.id)?`${btn('solo','🐱 고양이를 이겨라','button-primary full')}`:''}<div class="side-message">${apiLive?'친구가 다른 기기에서 같은 주소로 접속해도 실시간으로 함께할 수 있어요.':'현재 정적 모드입니다. 고양이 대전은 가능하며 멀티플레이는 Node.js 서버 연결이 필요해요.'}</div></aside></div></div>`;}
function roomsPage(){setNav('rooms');return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span>열린 게임방</div><div class="panel"><div class="rooms-controls"><div><span class="section-eyebrow">PLAY TOGETHER</span><h2 style="margin:7px 0 0">현재 열린 게임방</h2></div><button class="choice-button" data-action="refreshRooms">↻ 새로고침</button></div>${roomList.length?roomList.map(r=>`<button class="room-entry" data-join="${r.id}"><span><strong>${GAME[r.game]?.emoji||'🎮'} ${gname(r.game)} · ${esc(r.id)}</strong><br/><small>방장 ${esc(r.host)}</small></span><span class="game-mode-tag">${r.count}/${r.max}명 참가 →</span></button>`).join(''):'<div class="empty-state"><span class="icon">🌤️</span><strong>대기 중인 공개 게임방이 없어요.</strong><p>홈에서 게임을 선택한 뒤 방을 만들어 보세요.</p></div>'}</div></div>`;}
function guidePage(){setNav('guide');return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span>이용 방법</div><div class="panel" style="max-width:780px;margin:auto"><span class="section-eyebrow">GETTING STARTED</span><h2 style="font-size:29px;margin-top:10px">함께 플레이하는 방법</h2><ul class="rule-list"><li><span class="rule-count">1</span><div><strong>닉네임 정하기</strong><small>오른쪽 상단 닉네임을 눌러 원하는 이름을 입력하세요.</small></div></li><li><span class="rule-count">2</span><div><strong>게임 고르고 방 만들기</strong><small>게임을 골라 방을 생성하면 여섯 자리 초대 코드와 공유 링크가 만들어집니다.</small></div></li><li><span class="rule-count">3</span><div><strong>친구를 초대하고 준비하기</strong><small>친구들이 링크나 코드로 입장해 준비 완료를 누르면 방장이 시작할 수 있습니다.</small></div></li><li><span class="rule-count">4</span><div><strong>즐겁게 플레이하기</strong><small>모든 게임 동작은 서버에서 검증하며 참가자의 화면으로 실시간 전달됩니다.</small></div></li></ul><div class="side-message">게임방 데이터는 서버 메모리에 저장됩니다. 서버가 재시작되면 현재 게임이 종료됩니다. 가입과 영구 전적 저장은 제공하지 않습니다.</div><div class="button-row" style="margin-top:22px">${btn('home','게임 선택으로 돌아가기','button-primary')}</div></div></div>`;}
function personPanel(p,i){const s=room.state;const scores=s?.scores;const alive=s?.alive;const hearts=s?.hearts;const turn=s?.turn===p.id||s?.speaker===p.id;let subtitle=p.id===room.host?'방장':'참가자';if(alive&&!alive.includes(p.id))subtitle='탈락';const value=scores?`${scores[p.id]||0}점`:hearts?`♥ ${hearts[p.id]||0}`:alive?(alive.includes(p.id)?'생존':'탈락'):(p.id===room.host?'HOST':p.ready?'준비 완료':'준비 중');return `<div class="player-card ${turn?'current-player':''}"><div class="player-id"><span class="player-avatar">${chars[i%chars.length]}</span><div><strong>${esc(p.nick)} ${p.id===user.sid?'(나)':''}</strong><small>${subtitle}${turn?' · 차례':''}</small></div></div><span class="player-score">${value}</span></div>`;}
function lobby(){const min=({mafia:4,omok:2,yut:2,doodle:2,bell:2,liar:3,wordchain:2})[room.game];const allReady=room.players.filter(p=>p.id!==room.host).every(p=>p.ready);return `<div class="room-lobby"><div class="waiting-visual">🧸</div><h2>친구들을 기다리고 있어요!</h2><p>링크를 공유하거나 방 코드를 알려주세요. ${min}명 이상 모이면 게임을 시작할 수 있습니다.</p><div class="invite-inline"><span>초대 코드 ${esc(room.id)}</span><button class="choice-button" data-action="copyCode">코드 복사 ⧉</button></div>${settingsFields(room.game,room.options||optionsFor(room.game),true)}<div class="button-row" style="justify-content:center">${amHost()?btn('start','▶ 게임 시작하기','button-primary',room.players.length<min||!allReady):btn('ready',room.players.find(p=>p.id===user.sid)?.ready?'✓ 준비 취소':'✓ 준비 완료','button-primary')}</div>${amHost()&&!allReady?'<p class="game-note">다른 참가자가 모두 준비하면 시작할 수 있어요.</p>':''}</div>`;}
function listSidebar(){return `<aside class="room-sidebar"><section class="panel" style="padding:17px"><div class="sidebar-heading"><h3>👥 플레이어</h3><small>${room.players.length}명 접속</small></div>${room.players.map(personPanel).join('')}</section><section class="panel" style="padding:17px"><div class="sidebar-heading"><h3>📣 게임 알림</h3></div>${room.notices?.length?[...room.notices].reverse().slice(0,5).map(x=>`<div class="notification">${esc(x.text)}</div>`).join(''):'<p class="game-note">여기에 게임 알림이 표시됩니다.</p>'}</section>${room.status==='finished'&&amHost()?`<section class="panel" style="padding:17px">${btn('rematch','↻ 재대결 준비','button-primary full')}</section>`:''}<button data-action="leave" class="button button-danger full">방 나가기</button></aside>`;}
function gameRoom(){setNav('home');const g=GAME[room.game];return `<div class="page-wrap"><div class="breadcrumb"><button data-action="homeConfirm">홈</button><span>›</span><span>${g.name}</span><span>›</span><span>게임방 ${esc(room.id)}</span></div><div class="room-head"><div><span class="subtle">${g.emoji} ${g.genre}</span><h1>${g.name} ${room.status==='lobby'?'· 대기실':'· 대전'}</h1></div><div class="button-row"><span class="code-badge">${esc(room.id)} <button data-action="copyCode" title="초대 코드 복사">⧉</button></span>${btn('share','🔗 초대 링크','button-secondary')}</div></div><div class="room-layout"><section class="game-panel">${room.status==='lobby'?lobby():gameRenderer()}</section>${listSidebar()}</div></div>`;}
function endBanner(){if(room.status!=='finished')return '';return `<div class="end-banner"><div class="trophy">🏆</div><h2>게임 종료!</h2><p>${esc(room.state?.result||'모든 라운드가 완료되었습니다.')}</p>${amHost()?btn('rematch','↻ 같은 멤버로 다시하기','button-primary'):''}</div>`;}
function gameRenderer(){switch(room.game){case'omok':return omokGame();case'wordchain':return chainGame();case'doodle':return doodleGame();case'liar':return liarGame();case'mafia':return mafiaGame();case'bell':return bellGame();case'yut':return yutGame();default:return'';}}
function omokGame(){const s=room.state;const isTurn=s.turn===user.sid;let cells='';for(let y=0;y<15;y++)for(let x=0;x<15;x++){const stone=s.board[y*15+x];const star=([3,7,11].includes(x)&&[3,7,11].includes(y))?'star':'';const edge=`${y===0?'top':''} ${y===14?'bottom':''} ${x===0?'left':''} ${x===14?'right':''}`;cells+=`<button type="button" data-action="place" data-x="${x}" data-y="${y}" class="omok-cell ${star} ${edge} ${s.last?.x===x&&s.last?.y===y?'last':''}" aria-label="${x+1}열 ${y+1}행 ${stone==='black'?'흑돌':stone==='white'?'백돌':'빈칸'}" ${stone||!isTurn||room.status==='finished'?'disabled':''}>${stone?`<span class="stone ${stone}"></span>`:''}</button>`;}
return `<div class="game-topline"><span class="stage-badge">⚫ 흑: ${esc(room.players[0].nick)} · ⚪ 백: ${esc(room.players[1].nick)}</span><span class="time-badge">${s.moves}수 진행</span>${room.status==='playing'?timeBar(s.deadline,room.options?.turnSeconds):''}</div><div class="game-prompt"><strong>${room.status==='finished'?'대국 종료':isTurn?'당신 차례입니다. 돌을 놓아주세요.':`${esc(nick(s.turn))}님이 생각 중입니다.`}</strong> · 먼저 5개를 연결하면 이깁니다.</div><div class="omok-wrapper"><div class="omok-board ${room.options?.stoneStyle==='crazy'?'crazy-board':''}">${cells}</div></div>${endBanner()}`;}
function timeBar(deadline,total){const n=Math.max(0,(deadline-Date.now())/1000);return `<span class="time-badge ${n<6?'warning':''}" data-deadline="${deadline}">${formatTime(n)}초</span>`;}
function responseTips(words,title='시간 초과! 낼 수 있었던 단어'){
 if(!words)return '';
 return `<div class="response-tips"><strong>💡 ${esc(title)}</strong>${words.length?`<div class="hint-chips">${words.slice(0,3).map(w=>`<span>${esc(w)}</span>`).join('')}</div>`:'<p>이 조건에서 이어갈 수 있는 단어가 없습니다.</p>'}</div>`;
}
function chainGame(){
 const s=room.state,last=s.history.at(-1)||'',myTurn=s.turn===user.sid&&room.status==='playing';const dead=s.hearts[user.sid]<=0;
 const mode=room.options?.wordMode||'wordchain';
 const oneShot=s.oneShot?'<div class="one-shot-banner">⚡ 한방단어! 즉시 종료</div>':'';
 return `<div class="game-topline"><span class="stage-badge">📘 ${turnsLabel(mode)} · ${s.round}번째 단어</span>${room.status==='playing'?timeBar(s.deadline,s.timer):''}</div>
 <div class="word-scoreboard">${room.players.map(p=>`<div class="word-player ${s.turn===p.id?'active':''}"><strong>${esc(p.nick)} ${s.turn===p.id?'⚡':''}</strong>♥ ${s.hearts[p.id]}　·　${s.scores[p.id]}점</div>`).join('')}</div>
 ${oneShot}<div class="wordchain-word central"><span class="wordchain-caption">마지막으로 나온 단어</span><div class="last-word">${esc(last.slice(0,-1))}<span>${esc(last.slice(-1))}</span></div><div class="wordchain-caption">다음 시작 글자 <span class="next-letter">${esc(last.slice(-1))}</span></div><div class="mission">오늘의 미션 글자 <strong>${esc(s.mission)}</strong> 포함 시 +35점</div></div>
 <div class="timer-track"><div class="timer-fill" data-timer-fill data-total="${s.timer}" data-deadline="${s.deadline}" style="width:${Math.min(100,Math.max(0,(s.deadline-Date.now())/s.timer/10))}%"></div></div>
 <p class="game-note">${room.status==='finished'?'승부가 끝났습니다.':dead?'목숨이 소진되어 관전 중입니다.':myTurn?'당신 차례예요! 아래 칸에 단어를 입력하세요.':`${esc(nick(s.turn))}님의 차례입니다.`}</p>
 <form data-form="word" class="action-form"><input class="text-input" id="wordInput" name="word" autocomplete="off" placeholder="${myTurn?(mode==='kungkungtta'?'정확히 3글자 입력':'끝말을 이어보세요'):'차례를 기다려 주세요'}" maxlength="${mode==='kungkungtta'?3:24}" ${!myTurn?'readonly':''} required/><button class="button button-primary" ${!myTurn?'disabled':''} type="submit">입력 →</button></form>
 ${s.hints?.words?responseTips(s.hints.words):''}
 <div class="section-heading" style="margin:29px 0 14px"><h2 style="font-size:17px">📝 나온 단어들</h2><span class="pill-count">${s.history.length} WORDS</span></div><div class="word-tags">${s.history.map(w=>`<span class="word-tag">${esc(w)}</span>`).join('')}</div><p class="game-note">${dictionaryLabel}. 동일 플레이어가 같은 끝글자를 반복할 수 없습니다.</p>${endBanner()}`;
}
function doodleChatHtml(chat) {
 return chat.length?chat.slice(-14).map(c=>`<div class="chat-row ${c.correct?'correct':''}"><strong>${esc(c.nick)}</strong> ${esc(c.text)}</div>`).join(''):'<span style="color:#aaa">채팅과 정답이 이곳에 나타납니다.</span>';
}
function doodleGame(){
 const s=room.state,artist=isMe(s.artist),draw=room.status==='playing';
 const shownWord=artist||room.status==='finished';
 const wordCard=shownWord
  ?`<div class="doodle-word-card artist-card"><div class="doodle-role">✏️ ${artist?'당신이 화가입니다 · 나만 볼 수 있는 제시어':'마지막 제시어'}</div><div class="doodle-word">${esc(s.word||'제시어를 불러오는 중...')}</div><p>단어 자체를 글자로 쓰지 않고 그림으로 설명하세요.</p></div>`
  :`<div class="doodle-word-card guesser-card"><div class="doodle-role">🔎 당신은 정답을 맞히는 사람입니다</div><div class="doodle-masked-word" aria-label="제시어 ${s.wordLength||0}글자">${'●'.repeat(s.wordLength||3)}</div><p>${s.wordLength||3}글자 단어 · 화가의 그림을 보고 아래 입력창에 정답을 입력하세요.</p></div>`;
 return `<div class="game-topline"><span class="stage-badge">🎨 ${s.round} / ${s.maxRounds} 라운드</span>${timeBar(s.deadline,80)}</div><div class="game-prompt">이번 라운드 화가: <strong>${esc(nick(s.artist))}</strong> ${artist?'· 제시어를 보고 그림을 그려주세요.':'· 그림을 보고 맞혀주세요.'}</div>${wordCard}${artist&&draw?`<div class="draw-tools">${['#29283f','#ff627a','#2777c5','#30a77a','#e5b23a'].map((c,i)=>`<button class="color-dot ${drawColor===c?'selected':''}" type="button" data-action="drawColor" data-color="${c}" aria-label="색상 ${i+1}" style="background:${c}"></button>`).join('')}<select id="drawWidth" class="text-input" style="width:88px;padding:9px" aria-label="펜 굵기"><option value="2" ${drawWidth===2?'selected':''}>얇게</option><option value="5" ${drawWidth===5?'selected':''}>보통</option><option value="9" ${drawWidth===9?'selected':''}>굵게</option><option value="16" ${drawWidth===16?'selected':''}>아주 굵게</option></select>${btn('clear','전체 지우기','button-quiet')}${btn('skip','넘기기 →','button-secondary')}</div>`:''}<canvas id="doodleCanvas" class="draw-board" width="900" height="675" style="cursor:${artist&&draw?'crosshair':'default'}" aria-label="낙서왕 그림판"></canvas><div class="draw-chat" id="drawChat">${doodleChatHtml(s.chat)}</div><form data-form="chat" class="action-form"><input class="text-input" name="text" maxlength="80" autocomplete="off" placeholder="${artist?'화가는 정답을 입력할 수 없습니다.':'그림의 정답을 입력하세요!'}" ${artist||!draw?'disabled':''} required/><button class="button button-primary" ${artist||!draw?'disabled':''} type="submit">보내기</button></form>${endBanner()}`;
}
function patchDoodle(previous,current){
 const canvas=$('doodleCanvas');
 if(!canvas || !current || !previous)return false;
 if(previous.strokes.length!==current.strokes.length)paintDoodleCanvas();
 const chat=$('drawChat');
 if(chat && previous.chat.length!==current.chat.length){
  const stick=chat.scrollHeight-chat.scrollTop-chat.clientHeight<60;
  chat.innerHTML=doodleChatHtml(current.chat);
  if(stick)chat.scrollTop=chat.scrollHeight;
 }
 return true;
}
function clues(){return room.state.clues.map(c=>`<div class="clue-line"><strong>${esc(nick(c.by))}</strong><span>${esc(c.text)}</span></div>`).join('');}
function votingChoices(action){const s=room.state;const already=s.votes.includes(user.sid);return `<div class="voter-grid">${room.players.map(p=>`<button class="choice-button" data-action="${action}" data-target="${p.id}" ${already||room.status==='finished'?'disabled':''}>${chars[room.players.indexOf(p)%chars.length]} ${esc(p.nick)}</button>`).join('')}</div>${already?'<p class="game-note">투표 완료. 다른 플레이어의 투표를 기다리고 있어요.</p>':''}`;}
function liarGame(){const s=room.state,isLiar=s.isLiar;const result=room.status==='finished';return `<div class="game-topline"><span class="stage-badge">🕵️ ${s.phase==='clue'?'한 줄 설명':s.phase==='vote'?'라이어 투표':s.phase==='guess'?'최후의 추리':'게임 결과'}</span><span class="time-badge">${esc(s.topic)} 주제</span></div><div class="secret-card ${isLiar?'is-liar':''}"><small>${isLiar?'당신은 라이어입니다!':'당신이 받은 비밀 제시어'}</small><div class="secret-word">${isLiar?'🤫 제시어를 모릅니다':esc(s.myWord||s.word||'')}</div>${isLiar?'<p class="game-note">상대방의 힌트를 보고 제시어를 추측하세요.</p>':''}</div>${s.clues.length?`<h3>💬 참가자들의 힌트</h3>${clues()}`:''}${s.phase==='clue'?`<div class="hint-panel">현재 순서: ${esc(nick(s.speaker))} · 제시어를 직접 말하면 안 됩니다.</div>${s.speaker===user.sid?`<form data-form="clue" class="action-form"><input name="text" class="text-input" maxlength="60" placeholder="제시어에 대한 한 줄 설명" required autocomplete="off"/><button type="submit" class="button button-primary">설명하기</button></form>`:''}`:s.phase==='vote'?`<h3>의심스러운 사람에게 투표하세요!</h3>${votingChoices('liarVote')}`:s.phase==='guess'?`<div class="hint-panel">${esc(nick(s.liar||s.chosen))}님이 라이어로 지목됐습니다. 제시어를 맞히면 역전!</div>${isLiar?`<form data-form="guess" class="action-form"><input name="text" class="text-input" maxlength="40" placeholder="제시어 정답 입력" autocomplete="off" required/><button type="submit" class="button button-primary">최후의 추리</button></form>`:''}`:''}${result?`<div class="game-prompt">정답: <strong>${esc(s.word)}</strong> · 라이어: <strong>${esc(nick(s.liar))}</strong></div>`:''}${endBanner()}`;}
function mafiaGame(){const s=room.state,alive=s.alive.includes(user.sid),day=s.phase!=='night',voted=s.votes.includes(user.sid);return `<div class="game-topline"><span class="stage-badge">🎭 ${s.day}일차</span><span class="time-badge">생존 ${s.alive.length}명 / ${room.players.length}명</span></div><div class="mafia-stage ${day?'day':''}"><span class="stage-icon">${day?'☀️':'🌙'}</span><div><h2>${s.phase==='night'?'깊은 밤입니다':s.phase==='discussion'?'낮 토론 시간':'운명의 투표 시간'}</h2><p>${s.phase==='night'?'마피아·의사·경찰은 자신의 능력을 사용하세요.':s.phase==='discussion'?'채팅으로 단서를 공유하고 범인을 추리하세요.':'의심되는 사람을 선택하세요.'}</p></div></div><div class="role-reveal"><span style="font-size:34px">${s.role==='마피아'?'🗡️':s.role==='의사'?'🩺':s.role==='경찰'?'🔍':'🏡'}</span><div><small>나의 비밀 역할</small><strong>${esc(s.role)}</strong>${s.investigation?`<small style="display:block;color:#e65d7b;margin-top:7px">수사 결과: ${esc(s.investigation)}</small>`:''}</div></div><div class="game-prompt"><strong>${alive?'당신은 생존 중입니다.':'탈락하여 관전 중입니다.'}</strong><br/>${s.phase==='night'?'밤의 역할을 가진 사람만 투표합니다. 일반 시민은 아침을 기다립니다.':s.phase==='discussion'?'의견을 나눈 뒤 방장이 투표를 시작합니다.':'기권도 가능합니다.'}</div>${s.phase==='night'&&alive&&s.role!=='시민'?`<h3>비밀 행동 대상 선택 ${s.nightSubmitted?.includes(user.sid)?'✓ 제출 완료':''}</h3><div class="voter-grid">${room.players.filter(p=>s.alive.includes(p.id)&&(s.role!=='마피아'||p.id!==user.sid)).map(p=>`<button class="choice-button" data-action="night" data-target="${p.id}" ${s.nightSubmitted?.includes(user.sid)?'disabled':''}>${chars[room.players.indexOf(p)]} ${esc(p.nick)}</button>`).join('')}</div>`:''}${s.phase==='discussion'&&amHost()?`<div class="button-row" style="margin:16px 0">${btn('discussionEnd','☀ 토론 마치고 투표 시작','button-primary')}</div>`:''}${s.phase==='vote'&&alive?`<div class="voter-grid">${room.players.filter(p=>s.alive.includes(p.id)).map(p=>`<button class="choice-button" data-action="mafiaVote" data-target="${p.id}" ${voted?'disabled':''}>${chars[room.players.indexOf(p)]} ${esc(p.nick)}</button>`).join('')}<button class="choice-button" data-action="mafiaVote" data-target="skip" ${voted?'disabled':''}>기권</button></div>`:''}${s.phase==='vote'&&!alive?'<p class="game-note">투표 중입니다. 관전해 주세요.</p>':''}${day&&alive?`<div class="draw-chat" style="margin-top:18px">${s.chat.slice(-18).map(c=>`<div class="chat-row"><strong>${esc(c.nick)}</strong> ${esc(c.text)}</div>`).join('')||'<span style="color:#aaa">여기에서 토론이 진행됩니다.</span>'}</div><form class="action-form" data-form="chat"><input class="text-input" name="text" maxlength="80" placeholder="추리와 의견을 나눠 보세요" autocomplete="off" required/><button type="submit" class="button button-primary">채팅</button></form>`:''}<div class="mafia-history">${s.history.slice(-5).map(h=>`<div>• ${esc(h.text)}</div>`).join('')}</div>${endBanner()}`;}
const cardEmoji={과일:'🍓',달:'🌙',별:'⭐',도깨비:'👹'};
function bellGame(){const s=room.state;return `<div class="game-topline"><span class="stage-badge">🔔 도깨비 밤 장터</span><span class="time-badge">카드 ${s.draws}/${s.maxDraws}</span></div><div class="bell-table"><h2>짝이 나오면 종을 쳐요!</h2><p class="game-note">같은 그림이 2장 이상이거나 도깨비가 등장하면 성공!</p><div class="bell-cards">${room.players.map(p=>`<div class="bell-card ${s.cards[p.id]?'':'face-down'}"><span>${s.cards[p.id]?cardEmoji[s.cards[p.id]]:'❔'}</span><strong>${esc(p.nick)}</strong></div>`).join('')}</div><div style="display:flex;justify-content:center"><button type="button" class="big-bell" data-action="ring" aria-label="종 치기" ${room.status==='finished'?'disabled':''}>🔔</button></div><div class="bell-caption">${esc(s.feedback||'카드가 나오기를 기다리세요.')}</div><div class="roll-pill">쌓인 카드 ${s.pile}장 · 정답시 획득!</div></div>${endBanner()}`;}
const yutCoords={0:[495,495],1:[495,402],2:[495,309],3:[495,216],4:[495,123],5:[495,30],6:[402,30],7:[309,30],8:[216,30],9:[123,30],10:[30,30],11:[30,123],12:[30,216],13:[30,309],14:[30,402],15:[30,495],16:[123,495],17:[216,495],18:[309,495],19:[402,495],20:[495,495],21:[408,117],22:[318,205],23:[263,263],24:[210,318],25:[117,408],26:[117,117],27:[205,205]};
const line=(a,b)=>`<path class="yut-path" d="M${yutCoords[a].join(',')} L${yutCoords[b].join(',')}"/>`;
function yutGame(){const s=room.state,myTurn=s.turn===user.sid;const outer=Array.from({length:20},(_,i)=>line(i,i+1)).join('');const inside=[line(5,21),line(21,22),line(22,23),line(23,24),line(24,25),line(25,15),line(10,26),line(26,27),line(27,23)].join('');const pieces=Object.entries(s.pieces).flatMap(([pid,ps],pi)=>ps.filter(p=>!p.done&&p.node!==0).map((p,j)=>{const [x,y]=yutCoords[p.node]||[495,495];const color=['#ff7582','#469bc4','#71bf90','#b18ad0'][pi];return `<circle class="yut-piece-dot" cx="${x+((j%2)*15-7)}" cy="${y+((Math.floor(j/2)%2)*15-7)}" r="10" fill="${color}"/>`;})).join('');return `<div class="game-topline"><span class="stage-badge">🎲 ${esc(nick(s.turn))}님 차례</span>${timeBar(s.deadline,room.options?.turnSeconds)}<span class="time-badge">${s.rollName||'윷을 던지세요'}</span></div><div class="yut-board"><svg class="yut-svg" viewBox="-15 -15 555 555" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="윷놀이 말판"><rect x="0" y="0" width="525" height="525" rx="17" fill="#fffaf0"/>${outer}${inside}${Object.entries(yutCoords).filter(([i])=>i!=='0').map(([i,[x,y]])=>`<circle class="yut-node ${[5,10,15,20].includes(+i)?'corner':''} ${+i===23?'center':''}" cx="${x}" cy="${y}" r="${[5,10,15,20,23].includes(+i)?19:12}"/>`).join('')}${pieces}<text x="438" y="522" font-size="14" fill="#9a6e56">출발/도착</text></svg></div><div class="yut-controls"><div class="central">${s.pending===null?`<p class="game-note">${myTurn?'윷을 던지세요!':`${esc(nick(s.turn))}님의 차례를 기다리는 중`}</p>${btn('roll','🎲 윷 던지기','button-primary',!myTurn||room.status==='finished')}`:`<div class="yut-roll-result">${esc(s.rollName)}! <span style="font-size:13px;color:#aaa">${s.pending>0?`${s.pending}칸 이동`:'한 칸 뒤로'}</span></div><p class="game-note">이동할 말을 선택하세요. 모서리에 있으면 지름길이 자동 적용됩니다.</p><div class="yut-token-list" style="justify-content:center">${s.pieces[user.sid].map((p,i)=>`<button class="choice-button" data-action="move" data-index="${i}" ${!myTurn||p.done||s.pending===-1&&p.node===0?'disabled':''}>${i+1}번 말 ${p.done?'🏁':p.node===0?'(출발 전)':`(${p.node}칸)`}</button>`).join('')}</div>`}</div><div class="game-prompt">완주한 말: ${Object.entries(s.pieces).map(([pid,ps])=>`${esc(nick(pid))} ${ps.filter(p=>p.done).length}/4`).join(' · ')}</div><div class="yut-guide">간소화한 윷놀이 규칙이며, 정밀한 전통 윷판과 일부 상황이 다를 수 있습니다.</div></div>${endBanner()}`;}
let drawColor='#29283f',drawWidth=5;
function drawDoodleSegment(st){
 const canvas=$('doodleCanvas');if(!canvas||!st?.points?.length)return;
 const ctx=canvas.getContext('2d'),pts=st.points;
 ctx.strokeStyle=st.color;ctx.fillStyle=st.color;ctx.lineWidth=st.width;
 ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
 ctx.moveTo(pts[0][0]*canvas.width,pts[0][1]*canvas.height);
 if(pts.length===1){ctx.arc(pts[0][0]*canvas.width,pts[0][1]*canvas.height,st.width/2,0,Math.PI*2);ctx.fill();}
 else {for(const [x,y] of pts.slice(1))ctx.lineTo(x*canvas.width,y*canvas.height);ctx.stroke();}
}
function paintDoodleCanvas(){
 const canvas=$('doodleCanvas');
 if(!canvas||!room?.state?.strokes)return;
 const ctx=canvas.getContext('2d');
 const paint=st=>{
  if(!st?.points?.length)return;
  const pts=st.points;
  ctx.strokeStyle=st.color;ctx.fillStyle=st.color;ctx.lineWidth=st.width;
  ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
  ctx.moveTo(pts[0][0]*canvas.width,pts[0][1]*canvas.height);
  if(pts.length===1){ctx.arc(pts[0][0]*canvas.width,pts[0][1]*canvas.height,st.width/2,0,Math.PI*2);ctx.fill();}
  else {for(const p of pts.slice(1))ctx.lineTo(p[0]*canvas.width,p[1]*canvas.height);ctx.stroke();}
 };
 ctx.clearRect(0,0,canvas.width,canvas.height);
 room.state.strokes.forEach(paint);
 if(activeDoodleStroke)paint(activeDoodleStroke);
}
function setupCanvas(){
 const c=$('doodleCanvas');if(!c||!room||room.game!=='doodle')return;
 activeDoodleStroke=null;
 paintDoodleCanvas();
 if(room.state.artist!==user.sid||room.status!=='playing')return;
 const coord=e=>{const b=c.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-b.left)/b.width)),Math.min(1,Math.max(0,(e.clientY-b.top)/b.height))];};
 let activePointer=null, lastDoodleFlush=0;
 const sendStroke=()=>{
  if(!activeDoodleStroke)return;
  const st=activeDoodleStroke;
  activeDoodleStroke=null;
  if(st.points.length)sendDoodle('stroke',st);
 };
 c.addEventListener('pointerdown',e=>{
  if(activePointer!==null)return;
  e.preventDefault();activePointer=e.pointerId;
  c.setPointerCapture(e.pointerId);
  activeDoodleStroke={points:[coord(e)],color:drawColor,width:drawWidth};
  drawDoodleSegment(activeDoodleStroke);
 });
 c.addEventListener('pointermove',e=>{
  if(e.pointerId!==activePointer||!activeDoodleStroke)return;
  const pts=activeDoodleStroke.points,pt=coord(e);
  const last=pts.at(-1);
  if(Math.abs(last[0]-pt[0])<0.001&&Math.abs(last[1]-pt[1])<0.001)return;
  pts.push(pt);
  // Draw locally immediately; stream small segments to peers every ~45ms.
  drawDoodleSegment({points:[last,pt],color:activeDoodleStroke.color,width:activeDoodleStroke.width});
  const now=performance.now();
  if(pts.length>=145||now-lastDoodleFlush>=45){
   const segment=activeDoodleStroke;
   activeDoodleStroke={points:[pt],color:segment.color,width:segment.width};
   sendDoodle('stroke',segment);
   lastDoodleFlush=now;
  }
 });
 c.addEventListener('pointerup',e=>{
  if(e.pointerId!==activePointer)return;
  e.preventDefault();activePointer=null;
  if(activeDoodleStroke){const point=coord(e),last=activeDoodleStroke.points.at(-1);
    if(Math.abs(point[0]-last[0])>0.001||Math.abs(point[1]-last[1])>0.001)activeDoodleStroke.points.push(point);
    sendStroke();}
 });
 c.addEventListener('pointercancel',e=>{
  if(e.pointerId!==activePointer)return;
  activePointer=null;sendStroke();
 });
 const chat=$('drawChat');if(chat)chat.scrollTop=chat.scrollHeight;
}
function render(){
 const active=document.activeElement;
 const wasEntry=active?.closest?.('form[data-form]');
 const field=wasEntry&&root.contains(active)?{type:wasEntry.dataset.form,name:active.name,value:active.value,start:active.selectionStart,end:active.selectionEnd}:null;
 $('headerNickname').textContent=user.nick;
 if(view==='home')root.innerHTML=home();
 else if(view==='detail')root.innerHTML=detail();
 else if(view==='rooms')root.innerHTML=roomsPage();
 else if(view==='guide')root.innerHTML=guidePage();
 else if(view==='room'&&room)root.innerHTML=gameRoom();
 else if(view==='solo')root.innerHTML=soloGame();
 if(view==='room'&&room?.game==='doodle'&&room?.status!=='lobby')setupCanvas();
 // Replacing the view must never require a second click before typing again.
 if(field){
  const candidate=[...root.querySelectorAll('form[data-form] input, form[data-form] textarea')]
    .find(el=>el.name===field.name&&el.closest('form')?.dataset.form===field.type);
  if(candidate&&!candidate.disabled){
   candidate.value=field.value;
   candidate.focus({preventScroll:true});
   try{candidate.setSelectionRange(field.start,field.end);}catch{}
   return;
  }
 }
 const turnIsMine=(view==='solo'&&solo?.game==='wordchain'&&solo.turn==='player'&&!solo.finished)
  ||(view==='room'&&room?.game==='wordchain'&&room.status==='playing'&&room.state?.turn===user.sid);
 if(turnIsMine && !document.querySelector('dialog[open]')){
  const candidate=root.querySelector('form[data-form="soloWord"] input, form[data-form="word"] input');
  if(candidate&&!candidate.disabled)candidate.focus({preventScroll:true});
 }
}
function nextNeeded(word){const n=word.charAt(word.length-1);const i=n.charCodeAt(0)-44032;const set=[n];if(i>=0&&i<11172){const cho=Math.floor(i/588),jung=Math.floor(i%588/28),tail=i%588;if(cho===5){set.push(String.fromCharCode(44032+( [2,6,12,17,20].includes(jung)?11:2)*588+tail));}if(cho===2&&[2,6,12,17,20].includes(jung))set.push(String.fromCharCode(44032+11*588+tail));}return set;}
function soloChoices(player='ai',max=1000){
 return chainReplies(allWordsByFirst,solo.history.at(-1),new Set(solo.history),solo.mode,new Set(solo.usedEndings[player]),max);
}
function soloOpeningWord(mode='wordchain'){
 const familiar=['사과','바나나','학교','우산','도토리','초콜릿','고양이','자전거','비둘기','토마토','사랑','자동차','고구마','기차','나무','강아지','여름','겨울','바다','하늘','김치','감자','의자','수박','포도','여행','건물','그림','가방','마음','동물','공책','책상','달력','선물','친구','우유','라면'];
 let eligible=familiar.filter(w=>allWordSet.has(w)&&(mode!=='kungkungtta'||w.length===3)&&chainReplies(allWordsByFirst,w,new Set([w]),mode,null,1).length);
 if(eligible.length<2){eligible=allWords.filter((w,i)=>i%53===0&&(mode!=='kungkungtta'?w.length>=2&&w.length<=5:w.length===3)&&chainReplies(allWordsByFirst,w,new Set([w]),mode,null,1).length).slice(0,5000);}
 if(!eligible.length)eligible=allWords.filter(w=>mode!=='kungkungtta'||w.length===3).slice(0,100);
 const options=eligible.filter(w=>w!==previousSoloStarter);
 const starter=(options.length?options:eligible)[Math.floor(Math.random()*(options.length||eligible.length))];
 previousSoloStarter=starter;return starter;
}
function soloStart(game){
 if(activeGomokuWorker){activeGomokuWorker.terminate();activeGomokuWorker=null;}
 const opts=optionsFor(game);const seconds=opts.turnSeconds||30;
 view='solo';selection=game;room=null;
 solo=game==='wordchain'
  ?{game,mode:opts.wordMode||'wordchain',history:[soloOpeningWord(opts.wordMode)],usedEndings:{player:[],ai:[]},playerLives:2,aiLives:2,turn:'player',round:1,deadline:Date.now()+seconds*1000,timeSeconds:seconds,score:0,finished:false,msg:'당신 차례입니다.',helpWords:null,oneShot:false}
  :game==='yut'
  ?{game,pieces:{player:freshYutPieces(),ai:freshYutPieces()},turn:'player',pending:null,rollName:null,bonus:false,history:[],timeSeconds:seconds,deadline:Date.now()+seconds*1000,finished:false,msg:'윷을 던져 고양이와 한판 승부하세요!'}
  :{game,stoneStyle:opts.stoneStyle||'normal',timeSeconds:seconds,deadline:Date.now()+seconds*1000,board:Array(225).fill(null),turn:'player',moves:0,finished:false,msg:'흑돌을 먼저 놓으세요.'};
 render();
}
function soloGame(){
 const game=solo.game;setNav('home');let content='';
 if(game==='wordchain'){
  const last=solo.history.at(-1);
  content=`<div class="game-topline"><span class="stage-badge">🐱 ${turnsLabel(solo.mode)} · 고양이를 이겨라</span>${!solo.finished?timeBar(solo.deadline,solo.timeSeconds):''}</div><div class="word-scoreboard"><div class="word-player ${solo.turn==='player'?'active':''}"><strong>🙂 ${esc(user.nick)}</strong>♥ ${solo.playerLives} · ${solo.score}점</div><div class="word-player ${solo.turn==='ai'?'active':''}"><strong>🐱 고양이</strong>♥ ${solo.aiLives}</div></div>${solo.oneShot?'<div class="one-shot-banner">⚡ 한방단어! 즉시 종료</div>':''}<div class="wordchain-word central"><span class="wordchain-caption">마지막으로 나온 단어</span><div class="last-word">${esc(last.slice(0,-1))}<span>${esc(last.at(-1))}</span></div><span class="next-letter">${esc(last.at(-1))}</span></div><p class="game-note">${esc(solo.msg)} · ${dictionaryLabel}</p><form data-form="soloWord" class="action-form"><input class="text-input" name="word" autocomplete="off" placeholder="${solo.mode==='kungkungtta'?'3글자 단어':'단어를 입력하세요'}" ${solo.turn!=='player'||solo.finished?'readonly':''} maxlength="${solo.mode==='kungkungtta'?3:24}" required/><button type="submit" class="button button-primary" ${solo.turn!=='player'||solo.finished?'disabled':''}>내기 →</button></form>${solo.helpWords?responseTips(solo.helpWords):''}<div class="word-tags">${solo.history.map(w=>`<span class="word-tag">${esc(w)}</span>`).join('')}</div>`;
 }else if(game==='yut'){
  content=renderSoloYut(solo,{coords:yutCoords,line,btn,timeBar,esc});
 }else{
  let cells='';for(let y=0;y<15;y++)for(let x=0;x<15;x++){const v=solo.board[y*15+x];const edge=`${y===0?'top':''} ${y===14?'bottom':''} ${x===0?'left':''} ${x===14?'right':''}`;cells+=`<button class="omok-cell ${edge}" data-action="soloPlace" data-x="${x}" data-y="${y}" ${v||solo.turn!=='player'||solo.finished?'disabled':''}>${v?`<span class="stone ${v}"></span>`:''}</button>`;}
  content=`<div class="game-topline"><span class="stage-badge">⚫ 나 vs ⚪ 🐱 고양이 · ${solo.stoneStyle==='crazy'?'미친 버전':'정상 버전'}</span><span class="time-badge">${solo.moves}수</span>${solo.turn==='player'&&!solo.finished?timeBar(solo.deadline,solo.timeSeconds):''}</div><div class="game-prompt"><strong>${esc(solo.msg)}</strong></div><div class="omok-wrapper"><div class="omok-board ${solo.stoneStyle==='crazy'?'crazy-board':''}">${cells}</div></div>`;
 }
 return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span><button data-action="backDetail">${gname(game)}</button><span>›</span>고양이를 이겨라</div><div class="room-head"><h1>🐱 고양이를 이겨라</h1><div class="button-row">${btn('soloReset','↻ 처음부터','button-quiet')}${btn('backDetail','게임 선택','button-secondary')}</div></div><div style="max-width:760px;margin:17px auto" class="game-panel">${content}${solo.finished?`<div class="end-banner"><div class="trophy">${solo.msg.includes('당신 승리')?'🏆':'🏁'}</div><h2>${esc(solo.msg)}</h2>${btn('soloReset','↻ 다시하기','button-primary')}</div>`:''}</div></div>`;
}
function soloPlayWord(w){
 if(!solo||solo.turn!=='player'||solo.finished)return false;
 w=w.trim();
 if(!/^[가-힣]{2,24}$/.test(w)){toast('한글 2~24글자를 입력하세요.');return false;}
 if(solo.mode==='kungkungtta'&&w.length!==3){toast('쿵쿵따는 정확히 3글자만 허용됩니다.');return false;}
 if(!allWordSet.has(w)){toast('확장 사전에 없는 단어입니다.');return false;}
 if(solo.history.includes(w)){toast('이미 나온 단어입니다.');return false;}
 if(solo.usedEndings.player.includes(w.at(-1))){toast(`같은 끝글자 '${w.at(-1)}'는 다시 사용할 수 없습니다.`);return false;}
 if(!validReply(w,solo.history.at(-1),new Set(solo.history),solo.mode,new Set(solo.usedEndings.player))){toast('앞 단어의 끝 글자로 시작해야 합니다.');return false;}
 solo.history.push(w);solo.usedEndings.player.push(w.at(-1));solo.score+=w.length*10;solo.round++;solo.helpWords=null;
 // A proper one-shot word wins immediately; never wait for the AI's turn.
 if(!chainReplies(allWordsByFirst,w,new Set(solo.history),solo.mode,null,1).length){
  solo.finished=true;solo.oneShot=true;solo.msg=`한방단어 '${w}'! 당신 승리!`;render();return true;
 }
 solo.turn='ai';solo.msg='고양이가 단어를 생각하고 있어요.';const current=solo;render();
 setTimeout(()=>{
  if(solo!==current||solo.game!=='wordchain'||solo.turn!=='ai'||solo.finished)return;
  const possible=soloChoices('ai',250);
  if(!possible.length){solo.finished=true;solo.msg='고양이가 이을 단어가 없습니다. 당신 승리!';render();return;}
  // Strong but transparent: prefer rare endings, then check whether the response is forced.
  const sorted=possible.sort((a,b)=>(startCounts.get(a.at(-1))||0)-(startCounts.get(b.at(-1))||0));
  const answer=sorted[Math.min(4,sorted.length-1)];
  solo.history.push(answer);solo.usedEndings.ai.push(answer.at(-1));
  if(!chainReplies(allWordsByFirst,answer,new Set(solo.history),solo.mode,null,1).length){
   solo.oneShot=true;solo.finished=true;solo.msg=`한방단어 '${answer}'! 고양이 승리!`;render();return;
  }
  solo.turn='player';solo.deadline=Date.now()+solo.timeSeconds*1000;solo.msg=`고양이: ${answer} · 당신 차례!`;render();
 },700);
 return true;
}
function countFive(board,x,y,v){for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){let n=1;for(const sign of [-1,1])for(let i=1;i<15;i++){const xx=x+i*dx*sign,yy=y+i*dy*sign;if(xx>=0&&xx<15&&yy>=0&&yy<15&&board[yy*15+xx]===v)n++;else break;}if(n>=5)return true;}return false;}
// Competitive Gomoku AI: generate moves near existing stones, value open-ended
// threats and broken-four patterns, and anticipate the opponent's best reply.
// Uses the same simplified five-in-a-row rules as the existing solo mode.
const OMOK_DIRECTIONS=[[1,0],[0,1],[1,1],[1,-1]];
function omokThreat(board,x,y,color){
 const index=y*15+x;if(board[index])return -Infinity;
 board[index]=color;
 if(countFive(board,x,y,color)){board[index]=null;return 1e9;}
 let score=0;
 for(const [dx,dy] of OMOK_DIRECTIONS){
  let count=1,open=0;
  for(const sign of [-1,1]){
   let i=1;
   while(i<5){const xx=x+dx*i*sign,yy=y+dy*i*sign;if(xx<0||xx>14||yy<0||yy>14||board[yy*15+xx]!==color)break;count++;i++;}
   const xx=x+dx*i*sign, yy=y+dy*i*sign;
   if(xx>=0&&xx<15&&yy>=0&&yy<15&&!board[yy*15+xx])open++;
  }
  if(count===4)score+=open===2?8000000:open===1?420000:0;
  else if(count===3)score+=open===2?110000:open===1?6500:0;
  else if(count===2)score+=open===2?2300:open===1?180:0;
  else if(open===2)score+=20;
  // Broken fours and threes (e.g. XX.XX, X.XXX) also count as threats.
  for(let offset=-4;offset<=0;offset++){
   let mine=0,empty=0,blocked=false;
   for(let j=0;j<5;j++){
    const xx=x+(offset+j)*dx,yy=y+(offset+j)*dy;
    if(xx<0||xx>=15||yy<0||yy>=15){blocked=true;break;}
    const v=board[yy*15+xx];if(v&&v!==color){blocked=true;break;}
    if(v===color)mine++;else empty++;
   }
   if(!blocked&&mine===4&&empty===1)score+=82000;
   else if(!blocked&&mine===3&&empty===2)score+=2000;
  }
 }
 board[index]=null;
 return score;
}
function omokCandidates(board){
 const occupied=[];
 for(let i=0;i<225;i++)if(board[i])occupied.push(i);
 if(!occupied.length)return [{x:7,y:7}];
 const found=new Set();
 for(const at of occupied){const x=at%15,y=Math.floor(at/15);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<15&&yy>=0&&yy<15&&!board[yy*15+xx])found.add(yy*15+xx);
  }
 }
 return [...found].map(i=>({x:i%15,y:Math.floor(i/15)}));
}
function chooseOmokMove(board){
 const moves=omokCandidates(board);
 if(!moves.length)return null;
 const ranked=moves.map(m=>{
  const offense=omokThreat(board,m.x,m.y,'white');
  const defense=omokThreat(board,m.x,m.y,'black');
  const center=(14-Math.abs(m.x-7)-Math.abs(m.y-7))*0.15;
  return {...m,offense,defense,score:offense*1.08+defense*1.26+center};
 }).sort((a,b)=>b.score-a.score);
 // Winning now takes precedence over blocking. Otherwise always stop a one-move win.
 const win=ranked.find(m=>m.offense>=1e9);
 if(win)return win;
 const forced=ranked.filter(m=>m.defense>=1e9);
 if(forced.length)return forced.sort((a,b)=>b.offense-a.offense)[0];
 // At this point no immediate forced win exists for either side. Search the
 // best tactical replies to avoid naive one-ply moves (especially open fours).
 let best=ranked[0],bestValue=-Infinity;
 for(const move of ranked.slice(0,Math.min(9,ranked.length))){
  board[move.y*15+move.x]='white';
  const replies=omokCandidates(board);
  let opponentBest=0,ownNext=0;
  for(const reply of replies){
   const black=omokThreat(board,reply.x,reply.y,'black');
   const white=omokThreat(board,reply.x,reply.y,'white');
   opponentBest=Math.max(opponentBest,black+white*1.17);
   ownNext=Math.max(ownNext,white);
  }
  board[move.y*15+move.x]=null;
  const value=move.score-opponentBest*0.76+ownNext*0.22;
  if(value>bestValue){bestValue=value;best=move;}
 }
 return best;
}
function soloPlace(x,y){
 if(!solo||solo.game!=='omok'||solo.finished||solo.turn!=='player')return;
 const ix=y*15+x;if(solo.board[ix])return;
 solo.board[ix]='black';solo.moves++;
 if(countFive(solo.board,x,y,'black')){solo.finished=true;solo.msg='당신 승리! 오목 완성.';render();return;}
 if(solo.moves>=225){solo.finished=true;solo.msg='무승부';render();return;}
  const current=solo;
 solo.turn='ai';solo.msg='고양이가 공격 수순을 탐색하고 있습니다…';render();
 if(activeGomokuWorker){activeGomokuWorker.terminate();activeGomokuWorker=null;}
 function finishAi(ch,reason){
  if(solo!==current||solo.finished||solo.game!=='omok'||solo.turn!=='ai')return;
  if(!ch || solo.board[ch.y*15+ch.x])ch=chooseOmokMove(solo.board);
  if(!ch){solo.finished=true;solo.msg='무승부';render();return;}
  solo.board[ch.y*15+ch.x]='white';solo.moves++;
  if(countFive(solo.board,ch.x,ch.y,'white')){solo.finished=true;solo.msg='고양이 승리! 오목 완성.';}
  else if(solo.moves>=225){solo.finished=true;solo.msg='무승부';}
  else {solo.turn='player';solo.deadline=Date.now()+solo.timeSeconds*1000;solo.msg=`당신 차례입니다. ${reason?'(AI: '+reason+')':''}`;}
  render();
 }
 if(typeof Worker!=='undefined'){
  try{
   const worker=new Worker('./gomoku-ai.worker.js?v=20261120f',{type:'module'});
   activeGomokuWorker=worker;
   worker.onmessage=e=>{
    if(activeGomokuWorker!==worker)return;
    worker.terminate();activeGomokuWorker=null;
    if(e.data?.error){console.warn('Gomoku search failed:',e.data.error);finishAi(chooseOmokMove(solo.board),'보조 AI');return;}
    finishAi({x:e.data.x,y:e.data.y},e.data.reason);
   };
   worker.onerror=e=>{
    console.error('Gomoku worker error',e.message);
    if(activeGomokuWorker!==worker)return;
    worker.terminate();activeGomokuWorker=null;
    finishAi(chooseOmokMove(solo.board),'보조 AI');
   };
   worker.postMessage({id:solo.moves,board:solo.board,timeMs:1750});
  }catch(error){console.warn(error);setTimeout(()=>finishAi(chooseOmokMove(solo.board),'보조 AI'),150);}
 }else setTimeout(()=>finishAi(chooseOmokMove(solo.board),'보조 AI'),150);
}

function soloYutNext(turn,message){
 if(!solo||solo.game!=='yut'||solo.finished)return;
 solo.turn=turn;solo.pending=null;solo.rollName=null;solo.bonus=false;
 solo.deadline=Date.now()+solo.timeSeconds*1000;
 solo.msg=message||(turn==='player'?'당신 차례입니다. 윷을 던지세요.':'고양이가 생각하고 있어요.');
 render();
 if(turn==='ai')soloYutAiTurn();
}
function soloYutRoll(){
 if(!solo||solo.game!=='yut'||solo.turn!=='player'||solo.finished||solo.pending!==null)return;
 const roll=rollYut(Math.random,false);
 solo.pending=roll;solo.rollName=YUT_NAMES[roll];solo.bonus=roll===4||roll===5;
 if(!legalYutMoves(solo.pieces.player,roll).length){
   solo.history.push('나: '+solo.rollName+' · 움직일 말 없음');
   soloYutNext('ai','빽도! 움직일 말이 없어 고양이에게 차례가 넘어갑니다.');
   return;
 }
 solo.msg='나: '+solo.rollName+'! 움직일 말을 선택하세요.';
 render();
}
function soloYutApply(side,index,shortcut=true){
 if(!solo||solo.game!=='yut'||solo.turn!==side||solo.finished||solo.pending===null)return;
 let result;
 try{result=applyYutMove(solo.pieces[side],solo.pieces[side==='player'?'ai':'player'],index,solo.pending,shortcut);}
 catch(error){if(side==='player')toast('이동할 수 없는 말입니다.');return;}
 solo.pieces[side]=result.mine;
 solo.pieces[side==='player'?'ai':'player']=result.enemy;
 const name=side==='player'?'나':'🐱 고양이';
 const message=name+': '+solo.rollName+' → '+(index+1)+'번 말'+(result.caught?' · 상대 말 '+result.caught+'개 잡기!':'')+(result.done?' · 완주!':'');
 solo.history.push(message);solo.history=solo.history.slice(-8);
 if(result.won){
   solo.finished=true;solo.pending=null;solo.msg=side==='player'?'당신 승리! 윷놀이에서 고양이를 이겼어요!':'고양이 승리! 다음 판에 다시 도전해 보세요.';
   render();return;
 }
 if(solo.bonus||result.caught){
   solo.pending=null;solo.rollName=null;solo.deadline=Date.now()+solo.timeSeconds*1000;
   solo.msg=message+' 한 번 더 던져요!';
   render();
   if(side==='ai')soloYutAiTurn();
 }else soloYutNext(side==='player'?'ai':'player',message);
}
function soloYutAiTurn(){
 const current=solo;
 if(!current||current.game!=='yut'||current.turn!=='ai'||current.finished||current.pending!==null)return;
 setTimeout(()=>{
   if(solo!==current||current.finished||current.turn!=='ai')return;
   const roll=rollYut(Math.random,true);
   current.pending=roll;current.rollName=YUT_NAMES[roll];current.bonus=roll===4||roll===5;
   current.msg='🐱 고양이: '+current.rollName+'! 다음 수를 계산 중...';
   render();
   const choice=chooseCatYutMove(current.pieces.ai,current.pieces.player,roll);
   setTimeout(()=>{
     if(solo!==current||current.finished||current.turn!=='ai'||current.pending!==roll)return;
     if(choice)soloYutApply('ai',choice.index,choice.shortcut);
     else {
       current.history.push('🐱 고양이: '+current.rollName+' · 움직일 말 없음');
       soloYutNext('player','고양이가 움직일 말을 찾지 못했어요. 당신 차례!');
     }
   },390);
 },460);
}
function updateTick(){
 document.querySelectorAll('[data-deadline]').forEach(el=>{const seconds=Math.max(0,(Number(el.dataset.deadline)-Date.now())/1000);if(el.classList.contains('time-badge')){el.textContent=formatTime(seconds)+'초';el.classList.toggle('warning',seconds<6);}});
 document.querySelectorAll('[data-timer-fill]').forEach(el=>{const total=Number(el.dataset.total)||30;el.style.width=`${Math.max(0,Math.min(100,(Number(el.dataset.deadline)-Date.now())/total/10))}%`;});
 if(view==='solo'&&solo&&!solo.finished&&solo.turn==='player'&&Date.now()>solo.deadline){
  if(solo.game==='wordchain'){
   solo.helpWords=soloChoices('player',3);solo.playerLives--;
   if(solo.playerLives<=0){solo.finished=true;solo.msg='시간 초과. 고양이 승리!';}
   else{solo.deadline=Date.now()+solo.timeSeconds*1000;solo.msg='시간 초과! 목숨이 하나 줄었습니다.';}
  }else if(solo.game==='omok'){
   solo.finished=true;solo.msg='한 수 제한시간 초과. 고양이 승리!';
   activeGomokuWorker?.terminate();activeGomokuWorker=null;
  }else if(solo.game==='yut'){
   soloYutNext('ai','시간 초과! 고양이 차례가 되었습니다.');
   return;
  }
  render();
 }
}
function scrollGames(){document.getElementById('gamesSection')?.scrollIntoView({behavior:'smooth'});}
document.addEventListener('click',async e=>{
 const g=e.target.closest('[data-game]');if(g){selection=g.dataset.game;view='detail';await refreshRooms(selection);render();window.scrollTo(0,0);return;}
 const join=e.target.closest('[data-join]');if(join){await joinRoom(join.dataset.join);return;}
 const b=e.target.closest('[data-action]');if(!b)return;
 const action=b.dataset.action;
 if(action==='home'){routeHome();return;}if(action==='homeConfirm'){if(confirm('현재 게임방을 나가고 홈으로 이동할까요?'))await leave();return;}
 if(action==='nick'){revealNickname();return;}if(action==='guide'){view='guide';render();scrollTo(0,0);return;}
 if(action==='openJoin'){$('joinInput').value='';$('joinDialog').showModal();return;}
 if(action==='scrollGames'){scrollGames();return;}if(action==='createRoom'){await createRoom(selection);return;}
 if(action==='refreshRooms'){await refreshRooms(view==='detail'?selection:'');render();return;}
 if(action==='clear'&&room?.game==='doodle'){sendDoodle('clear');return;}
 if(action==='skip'&&room?.game==='doodle'){sendDoodle('skip');return;}
 if(action==='start'||action==='ready'||action==='rematch'||action==='ring'||action==='roll'||action==='discussionEnd'){await act(action);return;}
 if(action==='leave'){if(confirm('게임방을 나가시겠습니까?'))await leave();return;}
 if(action==='share'||action==='copyCode'){if(!room)return;const text=action==='copyCode'?room.id:`${location.origin}/?room=${room.id}`;try{await navigator.clipboard.writeText(text);toast('초대 정보를 복사했습니다.');}catch{toast(text);}return;}
 if(action==='place'){await act('place',{x:Number(b.dataset.x),y:Number(b.dataset.y)});return;}
 if(action==='night'||action==='mafiaVote'||action==='liarVote'){await act(action==='mafiaVote'?'vote':action==='liarVote'?'vote':'night',{target:b.dataset.target});return;}
 if(action==='drawColor'){drawColor=b.dataset.color;document.querySelectorAll('.color-dot').forEach(el=>el.classList.toggle('selected',el.dataset.color===drawColor));return;}
 if(action==='move'){await act('move',{index:Number(b.dataset.index)});return;}
 if(action==='solo'){try{if(selection==='wordchain'&&!allWords.length){const res=await fetch('./words.json');
 if(!res.ok)throw new Error('Dictionary manifest unavailable');
 const manifest=await res.json();
 if(Array.isArray(manifest)){allWords=manifest;}
 else if(manifest.encoding==='gzip-json-shards' && Array.isArray(manifest.parts) && typeof DecompressionStream==='function'){
  const shards=await Promise.all(manifest.parts.map(async part=>{
   if(!/^dictionary\/part-\d{2}\.json\.gz$/.test(part)) throw new Error('Invalid dictionary shard path');
   const response=await fetch('./'+part);
   if(!response.ok)throw new Error('Dictionary shard download failed');
   return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }));
  allWords=shards.flat();
  if(allWords.length!==manifest.count)throw new Error('Dictionary count mismatch');
 }else{
  const response=await fetch('/api/dictionary');if(!response.ok)throw new Error('Dictionary download failed');allWords=await response.json();
 }
 allWordSet=new Set(allWords);allWordsByFirst=dictionaryIndex(allWords);startCounts=new Map();for(const [letter,arr] of allWordsByFirst)startCounts.set(letter,arr.length);}}catch(error){toast('사전 다운로드에 실패했습니다. 새로고침 후 다시 시도하세요.');console.error(error);return;}soloStart(selection);return;}
 if(action==='soloReset'){soloStart(selection);return;}
 if(action==='backDetail'){view='detail';solo=null;await refreshRooms(selection);render();return;}
 if(action==='soloPlace'){soloPlace(Number(b.dataset.x),Number(b.dataset.y));return;}
 if(action==='soloYutRoll'){soloYutRoll();return;}
 if(action==='soloYutMove'){soloYutApply('player',Number(b.dataset.index),b.dataset.shortcut!=='0');return;}
 if(b.hasAttribute('data-stone-style-choice')){
   const style=b.dataset.stoneStyleChoice;if(style!=='normal'&&style!=='crazy')return;
   if(b.hasAttribute('data-stone-style-room')){
     if(room?.status==='lobby'&&amHost())await act('settings',{stoneStyle:style});
   }else if(gamePrefs[selection]){gamePrefs[selection].stoneStyle=style;render();}
   return;
 }
});
document.addEventListener('change',async e=>{
 const p=e.target.closest?.('select[data-pref]');
 if(p&&gamePrefs[selection]){gamePrefs[selection][p.dataset.pref]=p.dataset.pref==='turnSeconds'?Number(p.value):p.value;return;}
 const r=e.target.closest?.('select[data-room-setting]');
 if(r&&room?.status==='lobby'&&amHost())await act('settings',{[r.dataset.roomSetting]:r.dataset.roomSetting==='turnSeconds'?Number(r.value):r.value});
});
// When Korean IME uses Enter to finish composing, that SAME key should
// submit the word once compositionend fires. No second click or Enter needed.
document.addEventListener('compositionstart',e=>{
 if(e.target.closest?.('form[data-form]')){composingForm=true;pendingCompositionSubmit=null;}
});
document.addEventListener('compositionend',e=>{
 const form=e.target.closest?.('form[data-form]');if(!form)return;
 composingForm=false;
 const pending=pendingCompositionSubmit;
 pendingCompositionSubmit=null;
 if(pending?.form===form){
  setTimeout(()=>{
   if(form.isConnected&&pending.input.isConnected&&form.contains(pending.input))form.requestSubmit();
  },0);
 }
});
document.addEventListener('keydown',e=>{
 const form=e.target.closest?.('form[data-form]');
 if(e.key!=='Enter'||!form)return;
 if(e.isComposing||composingForm||e.keyCode===229){
  e.preventDefault();pendingCompositionSubmit={form,input:e.target};
 }
},true);
document.addEventListener('focusout',e=>{
 if(!root.contains(e.target)||!deferredRoomRender)return;
 setTimeout(()=>{if(deferredRoomRender&&!userEditing()&&view==='room'&&room){deferredRoomRender=false;render();}},0);
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(form.id==='nickForm'){e.preventDefault();user.nick=($('nicknameInput').value.trim().slice(0,14)||'게스트');localStorage.setItem('moyeo-nick',user.nick);$('nickDialog').close();if(room)await act('rename',{nick:user.nick});render();toast('닉네임을 변경했습니다.');return;}
 if(form.id==='joinForm'){e.preventDefault();const code=$('joinInput').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6){toast('6자리 코드를 입력하세요.');return;}await joinRoom(code);return;}
 if(!form.dataset.form)return;e.preventDefault();if(composingForm)return;const values=Object.fromEntries(new FormData(form).entries());const type=form.dataset.form;
 if(type==='soloWord'){const input=form.querySelector('input[name=word]');if(input)input.value='';const worked=soloPlayWord(values.word);if(worked===false&&input){input.value=values.word;input.focus({preventScroll:true});}return;}
 const mapping={word:'word',chat:'chat',clue:'clue',guess:'guess'};
 if(mapping[type]){
  const input=form.querySelector('input,textarea');
  if(room?.game==='doodle'&&type==='chat'){
   if(sendDoodle('chat',values)){if(input)input.value='';input?.focus({preventScroll:true});}
   return;
  }
  if(input)input.value='';
  const accepted=await act(mapping[type],values);
  if(!accepted&&input?.isConnected){input.value=Object.values(values)[0]||'';input.focus({preventScroll:true});}
  if(accepted&&deferredRoomRender){deferredRoomRender=false;render();}
 }
});
$('brand').addEventListener('click',e=>{e.preventDefault();if(room){if(confirm('게임방을 나가고 홈으로 돌아갈까요?'))leave();}else routeHome();});
$('nicknameBtn').addEventListener('click',revealNickname);
$('closeNick').addEventListener('click',()=>$('nickDialog').close());
$('closeJoin').addEventListener('click',()=>$('joinDialog').close());
document.addEventListener('change',e=>{if(e.target.id==='drawWidth')drawWidth=Number(e.target.value);});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',async()=>{if(room&&!(confirm('게임방을 나가고 이동할까요?')))return;if(room)await leave();if(b.dataset.nav==='home'){routeHome();}else if(b.dataset.nav==='rooms'){view='rooms';await refreshRooms();render();}else{view='guide';render();}scrollTo(0,0);}));
setInterval(updateTick,200);
async function init(){await refreshRooms();const url=new URLSearchParams(location.search),code=url.get('room')||sessionStorage.getItem('moyeo-last-room');if(code&&/^[A-Za-z0-9]{6}$/.test(code)&&apiLive){try{await joinRoom(code);return;}catch(e){sessionStorage.removeItem('moyeo-last-room');}}render();}
init();
