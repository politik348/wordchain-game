import {TURN_SECONDS, dictionaryIndex, replies as chainReplies, validReply, turnsLabel} from './chain-utils.mjs';
import {chooseBeginnerCatWord} from './wordchain-beginner-ai.mjs?v=20261121beginner1';
import {renderMafiaGame,renderMafiaRoleCatalog} from './mafia-ui.mjs?v=20261120mafia2';
import {configureRummikubUI, renderRummikubGame} from './rummikub/ui.mjs?v=20261120rk3';
import {createSoloRummikub, soloRoom, soloPlayRummikub, soloTickRummikub, catPlayRummikub} from './rummikub/solo.mjs?v=20261120catlevels1';
import {YUT_NAMES, freshYutPieces, rollYut, legalYutMoves, applyYutMove, chooseCatYutMove, yutSelectedSteps, usableYutRolls} from './yut-solo-engine.mjs?v=20261122backdo1';
import {renderSoloYut} from './yut-solo-ui.mjs?v=20261122backdo1';
import {renderYutBoard,renderYutThrow,renderYutRouteChooser,renderYutRollTray,renderYutPieceStats} from './yut-board.mjs?v=20261122backdo1';
import {installYutPowerControl} from './yut-power.mjs?v=20261120yut5';
import {CAT_CHALLENGE_GAMES, renderCatFeatured, renderCatHub, renderCatSetup} from './cat-hub.mjs?v=20261121catart2';
import {createMembershipUI} from './auth-ui.mjs?v=20261120statusrefresh1';
import {renderPregame} from './pregame-lobbies.mjs?v=20261120catIcon2';
import {renderOnlineWaiting} from './waiting-room.mjs?v=20261120catlevels1';
const GAMES=[
 {id:'escape',name:'모여 방탈출',genre:'2.5D · 미스터리',players:'1명',emoji:'🔐',color:'#e2e8fa',badge:'주인장 승인 · v4.0',desc:'13번째 종소리 · 동화풍 달빛 저택의 4개 방을 탐험하고 퍼즐 10종을 풀어 기억을 되찾으세요. 주인장 플레이 승인 필요.',rules:[['주인장 이용 승인','회원가입·로그인한 뒤 주인장의 별도 승인을 받아야 플레이할 수 있습니다.'],['공간 탐색','현관·서재·온실·시계탑을 둘러보고 아이템을 조합하여 필수 퍼즐 8종과 선택 퍼즐 2종을 해결합니다.'],['3가지 결말','선택 수집품과 단서를 모아 일반·진실·대안 엔딩을 발견합니다.']]},
 {id:'gamehell',name:'모여게임지옥',genre:'아케이드 · 13종',players:'1명',emoji:'😼',color:'#e8dffd',badge:'정식판 회원 전용 · 체험판 공개',desc:'3종 체험판은 로그인 없이 플레이! 정식판 13종은 회원가입·로그인 후 기록과 캐릭터 수집을 즐겨요.',rules:[['13종 게임','낙하·점프·로켓·얼음 등 13가지 원터치 게임을 선택합니다.'],['기록 도전','최고 점수와 별조각은 현재 브라우저에 저장됩니다.'],['개인 기록 도전','다른 이용자와 대전하는 게임이 아니라 나의 최고기록을 갱신하는 아케이드입니다.']]},
 {id:'tetris',name:'모여 테트리스',genre:'퍼즐 · 블록',players:'1명',emoji:'🧩',color:'#f3e1c4',badge:'회원 전용 · 고양이 대전',desc:'클래식 테트리스! 블록을 회전·이동해 줄을 지우고 최고 점수에 도전해요.',rules:[['조작','방향키로 이동, 위쪽 방향키로 회전, 스페이스로 하드 드롭합니다.'],['점수','가로줄을 채우면 지워지며, 연속으로 지울수록 높은 점수를 얻습니다.'],['기록','최고 점수는 이 브라우저에 저장됩니다.']]},
 {id:'logic',name:'모여로직',genre:'두뇌 · 노노그램',players:'1명',emoji:'🧠',color:'#e5efff',badge:'회원 전용 · 그림 퍼즐',desc:'가로·세로 숫자를 따라 칸을 색칠하면 귀여운 그림이 나타나는 노노그램!',rules:[['힌트 숫자','숫자는 이어서 색칠할 칸 수를 나타냅니다.'],['표시','색칠·X 표시·지우기를 선택해 퍼즐을 풉니다.'],['그림 도감','퍼즐을 완성하면 그림과 진행 기록이 브라우저에 저장됩니다.']]},
 {id:'rummikub',name:'루미큐브',genre:'두뇌 · 숫자타일',players:'2~4명',emoji:'🀄',color:'#e4f5e9',badge:'친구 대전',desc:'숫자 타일을 조합하고 재배열하는 전략 게임. 친구들과 대결!',rules:[['최초 등록','내 타일만으로 30점 이상의 유효한 조합을 만듭니다.'],['묶음과 연속','같은 숫자 다른 색 3~4개, 같은 색 연속 숫자 3개 이상을 만듭니다.'],['재배열','최초 등록 이후 테이블의 모든 타일을 합법적으로 재배열할 수 있습니다.']]},
 {id:'marble',name:'모여마블',genre:'보드 · 부동산',players:'2~4명',emoji:'🌍',color:'#ffe7ef',badge:'친구 대전',desc:'귀여운 캐릭터와 함께하는 24칸 도시 투자! 일반 8·12·16·20라운드 또는 무한 파산전, 온라인/로컬 친구 대전.',rules:[['주사위','두 주사위를 굴려 도시를 이동합니다.'],['건설','도시를 구매하고 건물을 지어 통행료를 얻습니다.']]},

 {id:'mafia',name:'가면단',genre:'마피아 · 직업 추리',players:'4~12명',emoji:'🎭',color:'#e8e0f7',badge:'특수 직업 12종',desc:'마피아, 스파이, 경찰, 의사, 기자, 영매 등 12종 직업! 비밀 행동과 공개 투표로 정체를 추리하세요.',rules:[['직업 모드','기본 직업 또는 특수 직업 모드를 선택하세요.'],['밤의 비밀','각 직업이 능력을 쓰고 마피아는 팀 채팅으로 작전을 논의합니다.'],['낮의 추리','토론 후 투표로 마피아를 찾아내세요. 정치인은 2표를 행사합니다.']]},
 {id:'omok',name:'오목',genre:'두뇌 · 보드',players:'2명',emoji:'⚫',color:'#f4dfb8',badge:'1:1 대결',desc:'15×15 바둑판 위에서 펼쳐지는 흑과 백의 전략 대결!',rules:[['돌 놓기','흑돌이 먼저 시작하고 번갈아 빈 교차점에 돌을 둡니다.'],['승리 조건','가로·세로·대각선으로 같은 색 돌 다섯 개를 이으면 승리합니다.'],['금수','흑돌의 직선 열린 쌍삼 금수를 간소화하여 검사합니다.']]},
 {id:'yut',name:'윷놀이',genre:'전통놀이 · 전략',players:'2~4명',emoji:'🎲',color:'#dff1db',badge:'전통 게임',desc:'도·개·걸·윷·모! 말을 업고 잡으며 신나게 달려 보세요.',rules:[['윷 던지기','윷·모가 나오면 계속 던진 뒤, 모은 결과를 원하는 순서로 사용합니다.'],['말 이동','도·개·걸·윷·모를 따로 또는 합쳐 이동할 수 있습니다. 말을 고르면 경로를 미리 보여준 뒤 확정합니다.'],['도착','상대 말을 잡으면 한 번 더 던지고, 내 말 4개를 모두 도착시키면 승리합니다.']]},
 {id:'doodle',name:'낙서왕',genre:'그림 · 퀴즈',players:'2~8명',emoji:'🎨',color:'#ffe0e6',badge:'친구 추천',desc:'한 명이 그리면 모두가 맞혀요! 손끝에서 펼쳐지는 그림 퀴즈.',rules:[['돌아가며 그리기','각 라운드의 화가만 제시어를 볼 수 있고 그림을 그립니다.'],['정답 맞히기','그림을 보고 정답을 채팅으로 입력하면 점수를 획득합니다.'],['시간 제한','80초마다 화가와 단어가 바뀝니다. 점수가 가장 높은 사람이 우승합니다.']]},
 {id:'bell',name:'도깨비 종',genre:'순발력 · 카드',players:'2~4명',emoji:'🔔',color:'#fbedce',badge:'순발력 대결',desc:'짝이 보이면 딩동! 누구보다 먼저 종을 울려 점수를 모으세요.',rules:[['카드 펼치기','참가자 앞에 순서대로 카드가 펼쳐집니다.'],['종 치기','같은 그림 두 장 또는 도깨비 카드가 나타나면 바로 종을 치세요.'],['점수','정답이면 카드 더미만큼 득점, 오답이면 2점 감점. 24장 후 우승 결정.']]},
 {id:'liar',name:'라이어 게임',genre:'추리 · 말솜씨',players:'3~8명',emoji:'🕵️',color:'#e6e8ff',badge:'두뇌 싸움',desc:'모두가 같은 단어를 알고 있다? 단 한 명의 라이어를 찾아라!',rules:[['제시어 확인','일반 참가자는 같은 제시어를 받고, 라이어는 주제만 받습니다.'],['한 줄 설명','각자 제시어를 직접 말하지 않고 힌트를 남깁니다.'],['투표와 추리','라이어를 투표로 찾아내세요. 라이어는 잡혀도 제시어를 맞히면 승리합니다.']]},
 {id:'wordchain',name:'끝말잇기',genre:'단어 · 순발력',players:'2~10명',emoji:'🔤',color:'#dcebf9',badge:'단어 대결',desc:'끝 글자를 이어 빠르게 단어를 제출해요. 시간이 갈수록 더 긴장!',rules:[['단어 이어가기','마지막 단어의 끝 글자(두음법칙 일부 포함)로 시작하는 단어를 냅니다.'],['시간과 목숨','턴당 20초에서 점차 단축됩니다. 시간 초과 시 목숨 1개를 잃습니다.'],['미션과 점수','특정 글자가 들어간 단어와 빠른 입력에 보너스 점수가 붙습니다.']]} 
];
const GAME=Object.fromEntries(GAMES.map(g=>[g.id,g]));
const root=document.getElementById('app');
const $=id=>document.getElementById(id);
let membership=null;
const user={nick:localStorage.getItem('moyeo-nick')||`게스트${Math.floor(Math.random()*899+100)}`,sid:sessionStorage.getItem('moyeo-sid')||crypto.randomUUID()};
sessionStorage.setItem('moyeo-sid',user.sid);
let view='home',selection='wordchain',room=null,eventSource=null,apiLive=true,solo=null,allWords=[],allWordSet=new Set(),allWordsByFirst=new Map(),startCounts=new Map(),soloTimer=null,roomList=[],lastRoomUrl='';
// Keep live typing and canvas strokes intact when asynchronous room updates arrive.
let deferredRoomRender=false, activeDoodleStroke=null, composingForm=false, pendingCompositionSubmit=null;
let previousSoloStarter=null, activeGomokuWorker=null;
let yutRolling=null, yutRouteChoice=null, yutRollSelection=null;
const gamePrefs={
 wordchain:{turnSeconds:30,wordMode:'wordchain',stoneStyle:'normal',aiDifficulty:'beginner'},
 omok:{turnSeconds:30,stoneStyle:'normal',aiDifficulty:'beginner'},
 yut:{turnSeconds:45,aiDifficulty:'beginner'},
 rummikub:{turnSeconds:60,aiDifficulty:'beginner'},
 doodle:{turnSeconds:90},
 mafia:{mafiaMode:'special'}
};
const catGamesSupported=new Set(['omok','yut','wordchain','rummikub']);
const pregameModes={};
try{
 const previous=JSON.parse(localStorage.getItem('moyeo-pregame-settings-v1')||'{}');
 for(const [game,options] of Object.entries(previous)){
  if(!gamePrefs[game]||!options||typeof options!=='object')continue;
  if(TURN_SECONDS.includes(Number(options.turnSeconds)))gamePrefs[game].turnSeconds=Number(options.turnSeconds);
  if(catGamesSupported.has(game)&&['beginner','intermediate','advanced'].includes(options.aiDifficulty))gamePrefs[game].aiDifficulty=options.aiDifficulty;
  if(game==='omok'&&['normal','crazy'].includes(options.stoneStyle))gamePrefs[game].stoneStyle=options.stoneStyle;
  if(game==='wordchain'&&['wordchain','kungkungtta'].includes(options.wordMode))gamePrefs[game].wordMode=options.wordMode;
  if(game==='mafia'&&['classic','special'].includes(options.mafiaMode))gamePrefs[game].mafiaMode=options.mafiaMode;
 }
}catch{}
function persistPregamePrefs(){try{localStorage.setItem('moyeo-pregame-settings-v1',JSON.stringify(gamePrefs));}catch{}}
const catGames=catGamesSupported;
function pregameModesFor(game,catOnly=false){return catOnly?['cat']:catGames.has(game)?['online','cat']:['online'];}
function pregameSettingGroups(game){
 const prefs=gamePrefs[game];if(!prefs)return [];
 const groups=[];
 if(game==='mafia'){groups.push({key:'mafiaMode',label:'직업 구성',large:true,value:prefs.mafiaMode||'special',choices:[{value:'classic',label:'기본 직업',description:'마피아 · 경찰 · 의사 · 시민'},{value:'special',label:'특수 직업',description:'군인 · 기자 · 정치인 · 스파이 등 인원별 랜덤 직업'}]});return groups;}
 if(game==='omok')groups.push({key:'stoneStyle',label:'오목 스타일',large:true,value:prefs.stoneStyle||'normal',choices:[
  {value:'normal',label:'정상 모드',description:'깔끔한 흑돌과 백돌'},
  {value:'crazy',label:'미친 모드',description:'캐릭터 오목돌이 펼치는 대결'}
 ]});
 if(game==='wordchain')groups.push({key:'wordMode',label:'단어 대전 규칙',large:true,value:prefs.wordMode||'wordchain',choices:[
  {value:'wordchain',label:'끝말잇기',description:'마지막 글자를 이어 말하기'},
  {value:'kungkungtta',label:'쿵쿵따',description:'세 글자 단어만 사용'}
 ]});
 groups.push({key:'turnSeconds',label:game==='omok'?'한 수 제한시간':'턴 제한시간',hint:'실제 게임에 적용됩니다',value:prefs.turnSeconds,choices:TURN_SECONDS.map(n=>({value:n,label:n+'초'}))});
 return groups;
}
function pregameFor(game,catOnly=false){
 const g=GAME[game],allowedModes=pregameModesFor(game,catOnly);
 const mode=catOnly?'cat':allowedModes.includes(pregameModes[game])?pregameModes[game]:allowedModes[0];
 return renderPregame({game:g,allowedModes,mode,settings:pregameSettingGroups(game),aiDifficulty:gamePrefs[game]?.aiDifficulty||'beginner',rules:g.rules,rooms:catOnly?[]:roomList.filter(x=>x.game===game),showJoin:!catOnly,backAction:catOnly?'openCatHub':'home'})+(game==='mafia'?renderMafiaRoleCatalog():'');
}
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
 if(game==='omok')controls.push(`<div class="omok-style-setting"><span class="omok-style-heading">오목 스타일 선택</span><div class="omok-style-grid" role="group" aria-label="오목 스타일"><button type="button" class="omok-style-card ${values.stoneStyle!=='crazy'?'selected':''}" data-action="chooseStoneStyle" data-stone-style-choice="normal" ${roomSettings?'data-stone-style-room="1"':''} ${disabled} aria-pressed="${values.stoneStyle!=='crazy'}"><span class="omok-style-art normal-art"><i></i><i></i></span><strong>정상 버전</strong><small>흑백돌로 두는 기본 오목</small><span class="style-check">${values.stoneStyle!=='crazy'?'●':'○'}</span></button><button type="button" class="omok-style-card ${values.stoneStyle==='crazy'?'selected':''}" data-action="chooseStoneStyle" data-stone-style-choice="crazy" ${roomSettings?'data-stone-style-room="1"':''} ${disabled} aria-pressed="${values.stoneStyle==='crazy'}"><span class="omok-style-art crazy-art"><i></i><i></i></span><strong>미친 버전</strong><small>캐릭터 오목돌로 두는 한 판</small><span class="style-check">${values.stoneStyle==='crazy'?'●':'○'}</span></button></div></div>`);
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
function routeHome(){yutRouteChoice=null;yutRollSelection=null;yutRolling=null;closeDoodleSocket();view='home';selection='wordchain';room=null;solo=null;eventSource?.close();eventSource=null;sessionStorage.removeItem('moyeo-last-room');history.replaceState(null,'',location.pathname);render();}
function setNav(which){document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('is-current',x.dataset.nav===which));}
function revealNickname(){membership?.open('login');}
async function api(uri,options){
 const res=await fetch(uri,{...options,headers:{'Content-Type':'application/json',...(options?.headers||{})}});
 let data;try{data=await res.json();}catch{throw new Error('서버 응답을 읽을 수 없습니다.');}
 if(!res.ok)throw new Error(data.error||'요청에 실패했습니다.');return data;
}
function handleErr(e){toast(e.message||'요청에 실패했습니다.');console.error(e);}
async function refreshRooms(game=''){
 if(membership&&!membership.hasAccount()){
  roomList=[];
  try{await api('/api/health');apiLive=true;$('serverStatus').textContent='멀티플레이는 로그인 필요';document.querySelector('.online-dot')?.classList.remove('off');}
  catch{apiLive=false;$('serverStatus').textContent='서버 연결 확인 필요';document.querySelector('.online-dot')?.classList.add('off');}
  return;
 }
 try{const result=await api('/api/rooms'+(game?`?game=${encodeURIComponent(game)}`:''));roomList=result.rooms;apiLive=true;$('serverStatus').textContent='실시간 서버 연결됨';document.querySelector('.online-dot').classList.remove('off');}
 catch(e){roomList=[];apiLive=false;$('serverStatus').textContent='고양이 대전 모드';document.querySelector('.online-dot').classList.add('off');}}
async function createRoom(game){if(!(await membership.requireLogin(()=>createRoom(game))))return;if(!apiLive)return toast('실시간 방은 Node.js 서버에서 실행해야 합니다.');try{const data=await api('/api/rooms',{method:'POST',body:JSON.stringify({game,sid:user.sid,nick:user.nick,options:optionsFor(game)})});enterRoom(data.room);}catch(e){handleErr(e);}}
async function joinRoom(code){if(!(await membership.requireLogin(()=>joinRoom(code))))return;if(!apiLive)return toast('실시간 서버 연결이 필요합니다.');try{const data=await api(`/api/rooms/${code.toUpperCase()}/join`,{method:'POST',body:JSON.stringify({sid:user.sid,nick:user.nick})});enterRoom(data.room);$('joinDialog').close();}catch(e){handleErr(e);}}
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
const GENERAL_GAME_ILLUSTRATIONS=new Set(['gamehell','tetris','logic','rummikub','marble','mafia']);
function card(g){
 const hasAnimalArt=GENERAL_GAME_ILLUSTRATIONS.has(g.id);
 const imageClass=hasAnimalArt?' game-illust-animal game-animal-'+g.id:'';
 return `<button class="game-card${hasAnimalArt?' game-card-illustrated':''}" data-game="${g.id}" aria-label="${g.name} 게임 선택"><div class="game-illust${imageClass}" style="--art-bg:${g.color}"><span class="art-sticker">${g.badge}</span>${hasAnimalArt?'':`<span class="game-emoji">${g.emoji}</span>`}</div><div class="game-card-body"><div class="game-title-row"><h3>${g.name}</h3><span class="game-arrow">↗</span></div><p class="game-desc">${g.desc}</p><div class="game-meta"><span>👥 ${g.players}</span><span class="mini-tag">${g.genre.split(' · ')[0]}</span></div></div></button>`;
}
function catHub(){setNav('cat');return renderCatHub(CAT_CHALLENGE_GAMES.map(id=>GAME[id]));}
function catSetup(){setNav('cat');return pregameFor(selection,true);}
function home(){setNav('home');return `<div class="home-wrap"><section class="hero"><div class="hero-content"><span class="hero-kicker">WELCOME TO MOYEO GAMES ✦</span><h1>친구들이랑 모여서<br/><em>오늘도 한 판!</em> 🎉</h1><p class="hero-subtitle">고양이와 혼자 놀기는 자유롭게!<br/>친구와 온라인 대전을 하려면 회원가입이 필요해요.</p><div class="hero-buttons">${btn('openCatHub','🐱 고양이를 이겨라','button-primary')}${btn('scrollGames','친구와 게임하기 →','button-secondary')}</div></div><div class="hero-art"><div class="hero-blob"><span class="hero-bunny">🐰</span><span class="hero-bear">🐻</span><span class="hero-dice">🎲</span><span class="hero-cloud">☁️</span><span class="hero-spark one">✳</span><span class="hero-spark two">✦</span></div></div></section><div class="stat-strip"><div class="stat-item"><span class="stat-icon">🎮</span><div><strong>${GAMES.length}가지 게임</strong><small>골라 하는 즐거움</small></div></div><div class="stat-item"><span class="stat-icon">🫶</span><div><strong>친구와 실시간 대결</strong><small>코드 하나로 만나요</small></div></div><div class="stat-item"><span class="stat-icon">📱</span><div><strong>어디서든 바로</strong><small>PC · 모바일 모두 OK</small></div></div></div><section id="gamesSection"><div class="section-heading"><div><span class="section-eyebrow">PICK YOUR GAME</span><h2>어떤 게임부터 할까요? <span class="pill-count">${GAMES.length} GAMES</span></h2><p>친구들의 취향에 맞춰 골라보세요.</p></div></div><div class="game-grid">${renderCatFeatured()}${GAMES.map(card).join('')}</div></section><section class="intro-panel"><div><span class="section-eyebrow">HOW TO PLAY</span><h3>딱 3단계면 준비 완료!</h3><p>닉네임 정하기 → 게임방 만들기 → 친구에게 코드 보내기</p></div><span class="intro-emoji">💌</span>${btn('guide','이용 방법 보기 →','button')}</section></div>`;}
function detail(){setNav('home');return pregameFor(selection,false);}
function roomsPage(){setNav('rooms');return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span>열린 게임방</div><div class="panel"><div class="rooms-controls"><div><span class="section-eyebrow">PLAY TOGETHER</span><h2 style="margin:7px 0 0">현재 열린 게임방</h2></div><button class="choice-button" data-action="refreshRooms">↻ 새로고침</button></div>${roomList.length?roomList.map(r=>`<button class="room-entry" data-join="${r.id}"><span><strong>${GAME[r.game]?.emoji||'🎮'} ${gname(r.game)} · ${esc(r.id)}</strong><br/><small>방장 ${esc(r.host)}</small></span><span class="game-mode-tag">${r.count}/${r.max}명 참가 →</span></button>`).join(''):'<div class="empty-state"><span class="icon">🌤️</span><strong>대기 중인 공개 게임방이 없어요.</strong><p>홈에서 게임을 선택한 뒤 방을 만들어 보세요.</p></div>'}</div></div>`;}
function guidePage(){setNav('guide');return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span>이용 방법</div><div class="panel" style="max-width:780px;margin:auto"><span class="section-eyebrow">GETTING STARTED</span><h2 style="font-size:29px;margin-top:10px">함께 플레이하는 방법</h2><ul class="rule-list"><li><span class="rule-count">1</span><div><strong>닉네임 정하기</strong><small>오른쪽 상단 닉네임을 눌러 원하는 이름을 입력하세요.</small></div></li><li><span class="rule-count">2</span><div><strong>게임 고르고 방 만들기</strong><small>게임을 골라 방을 생성하면 여섯 자리 초대 코드와 공유 링크가 만들어집니다.</small></div></li><li><span class="rule-count">3</span><div><strong>친구를 초대하고 준비하기</strong><small>친구들이 링크나 코드로 입장해 준비 완료를 누르면 방장이 시작할 수 있습니다.</small></div></li><li><span class="rule-count">4</span><div><strong>즐겁게 플레이하기</strong><small>모든 게임 동작은 서버에서 검증하며 참가자의 화면으로 실시간 전달됩니다.</small></div></li></ul><div class="side-message">게임방 데이터는 서버 메모리에 저장됩니다. 서버가 재시작되면 현재 게임이 종료됩니다. 가입과 영구 전적 저장은 제공하지 않습니다.</div><div class="button-row" style="margin-top:22px">${btn('home','게임 선택으로 돌아가기','button-primary')}</div></div></div>`;}
function personPanel(p,i){const s=room.state;const scores=s?.scores;const alive=s?.alive;const hearts=s?.hearts;const turn=s?.turn===p.id||s?.speaker===p.id;let subtitle=p.id===room.host?'방장':'참가자';if(alive&&!alive.includes(p.id))subtitle='탈락';const value=scores?`${scores[p.id]||0}점`:hearts?`♥ ${hearts[p.id]||0}`:alive?(alive.includes(p.id)?'생존':'탈락'):(p.id===room.host?'HOST':p.ready?'준비 완료':'준비 중');return `<div class="player-card ${turn?'current-player':''}"><div class="player-id"><span class="player-avatar">${chars[i%chars.length]}</span><div><strong>${esc(p.nick)} ${p.id===user.sid?'(나)':''}</strong><small>${subtitle}${turn?' · 차례':''}</small></div></div><span class="player-score">${value}</span></div>`;}
function lobby(){const settings=pregameSettingGroups(room.game).map(g=>({...g,value:room.options?.[g.key]??g.value}));return renderOnlineWaiting({game:GAME[room.game],room,host:amHost(),settings});}
function listSidebar(){return `<aside class="room-sidebar"><section class="panel" style="padding:17px"><div class="sidebar-heading"><h3>👥 플레이어</h3><small>${room.players.length}명 접속</small></div>${room.players.map(personPanel).join('')}</section><section class="panel" style="padding:17px"><div class="sidebar-heading"><h3>📣 게임 알림</h3></div>${room.notices?.length?[...room.notices].reverse().slice(0,5).map(x=>`<div class="notification">${esc(x.text)}</div>`).join(''):'<p class="game-note">여기에 게임 알림이 표시됩니다.</p>'}</section>${room.status==='finished'&&amHost()?`<section class="panel" style="padding:17px">${btn('rematch','↻ 재대결 준비','button-primary full')}</section>`:''}<button data-action="leave" class="button button-danger full">방 나가기</button></aside>`;}
function gameRoom(){setNav('home');const g=GAME[room.game];return `<div class="page-wrap"><div class="breadcrumb"><button data-action="homeConfirm">홈</button><span>›</span><span>${g.name}</span><span>›</span><span>게임방 ${esc(room.id)}</span></div><div class="room-head"><div><span class="subtle">${g.emoji} ${g.genre}</span><h1>${g.name} ${room.status==='lobby'?'· 대기실':'· 대전'}</h1></div><div class="button-row"><span class="code-badge">${esc(room.id)} <button data-action="copyCode" title="초대 코드 복사">⧉</button></span>${btn('share','🔗 초대 링크','button-secondary')}</div></div><div class="room-layout ${room.status==='lobby'?'pg-waiting-layout':''}"><section class="game-panel">${room.status==='lobby'?lobby():gameRenderer()}</section>${room.status==='lobby'?'':listSidebar()}</div></div>`;}
function endBanner(){if(room.status!=='finished')return '';return `<div class="end-banner"><div class="trophy">🏆</div><h2>게임 종료!</h2><p>${esc(room.state?.result||'모든 라운드가 완료되었습니다.')}</p>${amHost()?btn('rematch','↻ 같은 멤버로 다시하기','button-primary'):''}</div>`;}
function gameRenderer(){switch(room.game){case'rummikub':return renderRummikubGame(room,user.sid);case'omok':return omokGame();case'wordchain':return chainGame();case'doodle':return doodleGame();case'liar':return liarGame();case'mafia':return mafiaGame();case'bell':return bellGame();case'yut':return yutGame();default:return'';}}
function omokGame(){const s=room.state;const isTurn=s.turn===user.sid;const myStone=room.players[0]?.id===user.sid?'black':'white';let cells='';for(let y=0;y<15;y++)for(let x=0;x<15;x++){const stone=s.board[y*15+x];const star=([3,7,11].includes(x)&&[3,7,11].includes(y))?'star':'';const edge=`${y===0?'top':''} ${y===14?'bottom':''} ${x===0?'left':''} ${x===14?'right':''}`;cells+=`<button type="button" data-action="place" data-x="${x}" data-y="${y}" class="omok-cell ${star} ${edge} ${s.last?.x===x&&s.last?.y===y&&stone!==myStone?'opponent-last':''}" aria-label="${x+1}열 ${y+1}행 ${stone==='black'?'흑돌':stone==='white'?'백돌':'빈칸'}" ${stone||!isTurn||room.status==='finished'?'disabled':''}>${stone?`<span class="stone ${stone}"></span>`:''}</button>`;}
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
function mafiaGame(){return renderMafiaGame(room,user.sid,{host:amHost(),timeBar,endBanner:endBanner()});}
const cardEmoji={과일:'🍓',달:'🌙',별:'⭐',도깨비:'👹'};
function bellGame(){const s=room.state;return `<div class="game-topline"><span class="stage-badge">🔔 도깨비 밤 장터</span><span class="time-badge">카드 ${s.draws}/${s.maxDraws}</span></div><div class="bell-table"><h2>짝이 나오면 종을 쳐요!</h2><p class="game-note">같은 그림이 2장 이상이거나 도깨비가 등장하면 성공!</p><div class="bell-cards">${room.players.map(p=>`<div class="bell-card ${s.cards[p.id]?'':'face-down'}"><span>${s.cards[p.id]?cardEmoji[s.cards[p.id]]:'❔'}</span><strong>${esc(p.nick)}</strong></div>`).join('')}</div><div style="display:flex;justify-content:center"><button type="button" class="big-bell" data-action="ring" aria-label="종 치기" ${room.status==='finished'?'disabled':''}>🔔</button></div><div class="bell-caption">${esc(s.feedback||'카드가 나오기를 기다리세요.')}</div><div class="roll-pill">쌓인 카드 ${s.pile}장 · 정답시 획득!</div></div>${endBanner()}`;}
const yutCoords={0:[495,495],1:[495,402],2:[495,309],3:[495,216],4:[495,123],5:[495,30],6:[402,30],7:[309,30],8:[216,30],9:[123,30],10:[30,30],11:[30,123],12:[30,216],13:[30,309],14:[30,402],15:[30,495],16:[123,495],17:[216,495],18:[309,495],19:[402,495],20:[495,495],21:[408,117],22:[318,205],23:[263,263],24:[210,318],25:[117,408],26:[117,117],27:[205,205]};
const line=(a,b)=>`<path class="yut-path" d="M${yutCoords[a].join(',')} L${yutCoords[b].join(',')}"/>`;

function yutChoice(mode,s){
 const roomId=mode==='room'?room?.id:null;
 const rolls=s?.rolls||[];
 const old=yutRollSelection;
 const same=old?.scope===mode&&old?.roomId===roomId;
 const indices=same?old.indices.filter(i=>Number.isInteger(i)&&i>=0&&i<rolls.length):(rolls.length===1?[0]:[]);
 try{return {indices,steps:yutSelectedSteps(rolls,indices)};}catch{return {indices,steps:null};}
}
function yutGame(){
 const s=room.state,mineTurn=s.turn===user.sid&&room.status==='playing';
 const canMove=mineTurn&&s.phase==='move';
 const canThrow=mineTurn&&s.phase==='throw';
 const choice=canMove?yutChoice('room',s):{indices:[],steps:null};
 const selected=canMove&&yutRouteChoice?.scope==='room'&&yutRouteChoice.roomId===room.id?yutRouteChoice.index:null;
 const names=Object.fromEntries(room.players.map(p=>[p.id,p.nick]));
 const status=`<div class="game-topline"><span class="stage-badge">🎲 ${esc(nick(s.turn))}님 차례</span>${room.status==='playing'?timeBar(s.deadline,room.options?.turnSeconds):''}<span class="time-badge">${esc(s.rollName||'윷놀이')}</span></div>`;
 const progress=renderYutPieceStats(s.pieces,names,user.sid);
 const guide=`<div class="game-prompt"><strong>${room.status==='finished'?'대국 종료':canThrow?'추가 던지기를 모두 마치세요!':canMove?'윷 결과와 말을 골라 이동 경로를 확인하세요.':esc(nick(s.turn))+'님이 플레이 중입니다.'}</strong></div>`;
 const throwUi=renderYutThrow({roll:s.lastRoll??null,rolling:yutRolling?.scope==='room'&&yutRolling?.roomId===room.id,actor:canThrow?'당신 차례입니다 · 던지기':canMove?'던지기 완료 · 이동 단계':`현재: ${nick(s.turn)}`,showAction:canThrow,action:'roll',power:yutRolling?.scope==='room'?yutRolling.power:0});
 const rolls=renderYutRollTray({rolls:s.rolls||[],phase:s.phase,chosen:choice.indices,action:'yutRollChoice',myTurn:mineTurn});
 const board=renderYutBoard({pieces:s.pieces,me:user.sid,turn:s.turn,steps:canMove?choice.steps:null,active:room.status==='playing',action:'yutPick',routeAction:'yutRoute',selected,lastMove:s.lastMove,labels:names});
 const picker=canMove?renderYutRouteChooser(s.pieces[user.sid],choice.steps,selected,'yutRoute'):'';
 return status+progress+guide+`<div class="yut-play-layout"><div class="yut-board-column">${board}${picker}<p class="game-note">윷/모는 이어서 모두 던진 다음 이동합니다. 여러 윷 결과를 선택해 합쳐 이동할 수 있어요. 말을 누르면 이동 경로를 먼저 보여줍니다. 도에서 빽도로 HOME에 돌아온 말은 빽도를 한 번 더 쓰면 완주합니다.</p></div><aside class="yut-control-column">${throwUi}${rolls}<h4>최근 진행</h4><div class="cat-yut-history">${(s.history||[]).slice(-6).reverse().map(h=>`<div>${esc(h)}</div>`).join('')}</div></aside></div>`+endBanner();
}
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
 else if(view==='catHub')root.innerHTML=catHub();
 else if(view==='catSetup')root.innerHTML=catSetup();
 else if(view==='detail')root.innerHTML=detail();
 else if(view==='rooms')root.innerHTML=roomsPage();
 else if(view==='guide')root.innerHTML=guidePage();
 else if(view==='room'&&room)root.innerHTML=gameRoom();
 else if(view==='solo')root.innerHTML=soloGame();
 const catResultVisible=view==='solo'&&solo?.finished&&!solo.resultDismissed;
 if(catResultVisible&&window.MoyeoCatResult?.overlay){
  root.insertAdjacentHTML('beforeend',window.MoyeoCatResult.overlay(catResultView(solo)));
  root.querySelector('.cat-result-close')?.focus({preventScroll:true});
 }
 document.body.classList.toggle('cat-result-open',Boolean(catResultVisible));
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
 if(game==='rummikub'){
  if(activeGomokuWorker){activeGomokuWorker.terminate();activeGomokuWorker=null;}
  const seconds=optionsFor(game).turnSeconds||60;
  view='solo';selection=game;room=null;solo=createSoloRummikub(seconds,optionsFor(game).aiDifficulty||'beginner');solo.startedAt=Date.now();render();return;
 }
 if(activeGomokuWorker){activeGomokuWorker.terminate();activeGomokuWorker=null;}
 yutRouteChoice=null;yutRollSelection=null;yutRolling=null;
 const opts=optionsFor(game);const seconds=opts.turnSeconds||30;
 const aiDifficulty=['beginner','intermediate','advanced'].includes(opts.aiDifficulty)?opts.aiDifficulty:'beginner';
 view='solo';selection=game;room=null;
 solo=game==='wordchain'
  ?{game,aiDifficulty,startedAt:Date.now(),mode:opts.wordMode||'wordchain',history:[soloOpeningWord(opts.wordMode)],usedEndings:{player:[],ai:[]},playerLives:2,aiLives:2,turn:'player',round:1,deadline:Date.now()+seconds*1000,timeSeconds:seconds,score:0,finished:false,msg:'당신 차례입니다.',helpWords:null,oneShot:false}
  :game==='yut'
  ?{game,aiDifficulty,startedAt:Date.now(),tossCounts:{player:0,ai:0},catches:{player:0,ai:0},pieces:{player:freshYutPieces(),ai:freshYutPieces()},turn:'player',pending:null,rolls:[],phase:'throw',throwsRemaining:1,rollName:null,history:[],timeSeconds:seconds,deadline:Date.now()+seconds*1000,finished:false,msg:'윷을 던져 고양이와 한판 승부하세요!'}
   :{game,aiDifficulty,startedAt:Date.now(),stoneStyle:opts.stoneStyle||'normal',timeSeconds:seconds,deadline:Date.now()+seconds*1000,board:Array(225).fill(null),turn:'player',moves:0,lastOpponentMove:null,finished:false,msg:'흑돌을 먼저 놓으세요.'};
 render();
}
function catResultView(s){
 if(!s?.finished)return '';
 const r=window.MoyeoCatResult;
 if(!r?.render)return '<div class="end-banner"><h2>'+esc(s.msg||'대국 종료')+'</h2></div>';
 let outcome='draw',stats=[],score=null,game='';
 const summary=s.game==='rummikub'?String(soloRoom(s).state?.result||'게임 종료'):String(s.msg||'게임 종료');
 s.finishedAt??=Date.now();
 const seconds=Number(s.startedAt)>0?Math.floor((s.finishedAt-s.startedAt)/1000):null;
 if(s.game==='rummikub'){
  game='루미큐브';outcome=s.engine?.winner==='cat'?'cat':s.engine?.winner==='player'?'player':'draw';
  const a=s.engine?.scores||{};
  if(Number.isFinite(a.player)&&Number.isFinite(a.cat))score={player:a.player,cat:a.cat};
  stats=[{label:'진행 턴',value:Math.max(0,(s.engine?.turnNumber||1)-1)+'턴'},
   {label:'내 남은 타일',value:(s.engine?.hands?.player?.length??0)+'개'},
   {label:'고양이 남은 타일',value:(s.engine?.hands?.cat?.length??0)+'개'}];
 }else if(s.game==='omok'){
  game='오목';outcome=summary.includes('고양이 승리')?'cat':summary.includes('당신 승리')?'player':'draw';
  stats=[{label:'전체 착수',value:s.moves+'수'},
   {label:'내가 둔 수',value:s.board.filter(v=>v==='black').length+'수'},
   {label:'고양이가 둔 수',value:s.board.filter(v=>v==='white').length+'수'}];
 }else if(s.game==='yut'){
  game='윷놀이';outcome=summary.includes('고양이 승리')?'cat':summary.includes('당신 승리')?'player':'draw';
  const done=key=>s.pieces?.[key]?.filter(v=>v.done).length||0;
  score={player:done('player')+'/4',cat:done('ai')+'/4'};
  stats=[{label:'내 윷 던진 횟수',value:(s.tossCounts?.player||0)+'회'},
   {label:'고양이 윷 던진 횟수',value:(s.tossCounts?.ai||0)+'회'},
   {label:'내가 잡은 상대 말',value:(s.catches?.player||0)+'개'},
   {label:'고양이가 잡은 말',value:(s.catches?.ai||0)+'개'}];
 }else if(s.game==='wordchain'){
  game=s.mode==='kungkungtta'?'쿵쿵따':'끝말잇기';outcome=summary.includes('고양이 승리')?'cat':summary.includes('당신 승리')?'player':'draw';
  const turns=s.history?.length||0;
  const catScore=(s.history||[]).reduce((sum,w,i)=>sum+(i>=2&&i%2===0?w.length*10:0),0);
  score={player:s.score||0,cat:catScore};
  stats=[{label:'나의 단어',value:Math.floor(turns/2)+'개'},
   {label:'고양이 단어',value:Math.floor((turns-1)/2)+'개'},
   {label:'전체 사용 단어',value:turns+'개'},
   {label:'종료 후 남은 목숨',value:(s.playerLives||0)+'개'}];
 }
 stats.unshift({label:'고양이 AI 난이도',value:({beginner:'초급',intermediate:'중급',advanced:'고급'})[s.aiDifficulty]||'미설정'});
 if(seconds!==null)stats.push({label:'총 플레이 시간',value:Math.floor(seconds/60)+'분 '+String(seconds%60).padStart(2,'0')+'초'});
 return r.render({game,outcome,summary,score,stats,actions:
  '<button type="button" data-action="soloReset">↻ 다시 하기</button><button type="button" data-action="backCatHub">다른 게임 선택</button>'});
}
function soloGame(){
 if(solo?.game==='rummikub'){
  setNav('cat');return `<div class="page-wrap"><div class="breadcrumb"><button data-action="backCatHub">← 고양이 게임 목록</button><span>›</span>루미큐브<span>›</span>고양이를 이겨라</div><div class="panel">${renderRummikubGame(soloRoom(solo),'player')}</div><div class="button-row" style="margin:16px 0">${btn('soloReset','↻ 고양이와 다시 하기','button-secondary')}</div></div>`;
 }
 const game=solo.game;setNav('cat');let content='';
 if(game==='wordchain'){
  const last=solo.history.at(-1);
  content=`<div class="game-topline"><span class="stage-badge">🐱 ${turnsLabel(solo.mode)} · 고양이를 이겨라</span>${!solo.finished?timeBar(solo.deadline,solo.timeSeconds):''}</div><div class="word-scoreboard"><div class="word-player ${solo.turn==='player'?'active':''}"><strong>🙂 ${esc(user.nick)}</strong>♥ ${solo.playerLives} · ${solo.score}점</div><div class="word-player ${solo.turn==='ai'?'active':''}"><strong>🐱 고양이</strong>♥ ${solo.aiLives}</div></div>${solo.oneShot?'<div class="one-shot-banner">⚡ 한방단어! 즉시 종료</div>':''}<div class="wordchain-word central"><span class="wordchain-caption">마지막으로 나온 단어</span><div class="last-word">${esc(last.slice(0,-1))}<span>${esc(last.at(-1))}</span></div><span class="next-letter">${esc(last.at(-1))}</span></div><p class="game-note">${esc(solo.msg)} · ${dictionaryLabel}</p><form data-form="soloWord" class="action-form"><input class="text-input" name="word" autocomplete="off" placeholder="${solo.mode==='kungkungtta'?'3글자 단어':'단어를 입력하세요'}" ${solo.turn!=='player'||solo.finished?'readonly':''} maxlength="${solo.mode==='kungkungtta'?3:24}" required/><button type="submit" class="button button-primary" ${solo.turn!=='player'||solo.finished?'disabled':''}>내기 →</button></form>${solo.helpWords?responseTips(solo.helpWords):''}<div class="word-tags">${solo.history.map(w=>`<span class="word-tag">${esc(w)}</span>`).join('')}</div>`;
 }else if(game==='yut'){
  const choice=yutChoice('solo',solo);content=renderSoloYut(solo,{timeBar,esc,rolling:yutRolling?.scope==='solo'||yutRolling?.scope==='cat',catThrowing:yutRolling?.scope==='cat',power:yutRolling?.power||0,selected:yutRouteChoice?.scope==='solo'?yutRouteChoice.index:null,chosen:choice.indices,steps:choice.steps});
 }else{
  let cells='';for(let y=0;y<15;y++)for(let x=0;x<15;x++){const v=solo.board[y*15+x];const edge=`${y===0?'top':''} ${y===14?'bottom':''} ${x===0?'left':''} ${x===14?'right':''}`;cells+=`<button class="omok-cell ${edge} ${solo.lastOpponentMove?.x===x&&solo.lastOpponentMove?.y===y&&v==='white'?'opponent-last':''}" data-action="soloPlace" data-x="${x}" data-y="${y}" ${v||solo.turn!=='player'||solo.finished?'disabled':''}>${v?`<span class="stone ${v}"></span>`:''}</button>`;}
  content=`<div class="game-topline"><span class="stage-badge">⚫ 나 vs ⚪ 🐱 고양이 · ${solo.stoneStyle==='crazy'?'미친 버전':'정상 버전'}</span><span class="time-badge">${solo.moves}수</span>${solo.turn==='player'&&!solo.finished?timeBar(solo.deadline,solo.timeSeconds):''}</div><div class="game-prompt"><strong>${esc(solo.msg)}</strong></div><div class="omok-wrapper"><div class="omok-board ${solo.stoneStyle==='crazy'?'crazy-board':''}">${cells}</div></div>`;
 }
 return `<div class="page-wrap"><div class="breadcrumb"><button data-action="home">홈</button><span>›</span><button data-action="backCatHub">고양이 게임 목록</button><span>›</span>고양이를 이겨라</div><div class="room-head"><h1>🐱 고양이를 이겨라</h1><div class="button-row">${btn('soloReset','↻ 처음부터','button-quiet')}${btn('backDetail','게임 선택','button-secondary')}</div></div><div style="max-width:760px;margin:17px auto" class="game-panel">${content}</div></div>`;
}
function chooseCatWord(possible,difficulty='beginner'){
 const rank=[...possible].sort((a,b)=>(startCounts.get(a.at(-1))||0)-(startCounts.get(b.at(-1))||0));
 if(difficulty==='beginner')return chooseBeginnerCatWord(possible,startCounts,(word,limit)=>{
  const history=new Set(solo.history);history.add(word);
  return chainReplies(allWordsByFirst,word,history,solo.mode,new Set(solo.usedEndings.player),limit).length;
 });
 const limit=difficulty==='advanced'?rank.length:Math.min(rank.length,95);
 const candidates=rank.slice(0,limit),played=new Set(solo.history);
 let best=candidates[0],bestScore=-Infinity;
 for(const word of candidates){
  const after=new Set(played);after.add(word);
  const responses=chainReplies(allWordsByFirst,word,after,solo.mode,new Set(solo.usedEndings.player),difficulty==='advanced'?14:6);
  if(!responses.length)return word;
  let dangerous=0;
  if(difficulty==='advanced'){
   for(const reply of responses.slice(0,9)){
    const next=new Set(after);next.add(reply);
    if(!chainReplies(allWordsByFirst,reply,next,solo.mode,null,1).length){dangerous=1;break;}
   }
  }
  const rarity=Math.log1p(startCounts.get(word.at(-1))||0);
  const score=-responses.length*(difficulty==='advanced'?130:55)-rarity*6-dangerous*600;
  if(score>bestScore){bestScore=score;best=word;}
 }
 return best;
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
  // Strength differs in candidate breadth and tactical counter-play rather than dictionary rules.
  const answer=chooseCatWord(possible,solo.aiDifficulty);
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
  solo.board[ch.y*15+ch.x]='white';solo.moves++;solo.lastOpponentMove={x:ch.x,y:ch.y};
  if(countFive(solo.board,ch.x,ch.y,'white')){solo.finished=true;solo.msg='고양이 승리! 오목 완성.';}
  else if(solo.moves>=225){solo.finished=true;solo.msg='무승부';}
  else {solo.turn='player';solo.deadline=Date.now()+solo.timeSeconds*1000;solo.msg=`당신 차례입니다. ${reason?'(AI: '+reason+')':''}`;}
  render();
 }
 if(typeof Worker!=='undefined'){
  try{
   const worker=new Worker('./gomoku-ai.worker.js?v=20261120catlevels1',{type:'module'});
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
   worker.postMessage({id:solo.moves,board:solo.board,difficulty:solo.aiDifficulty||'beginner'});
  }catch(error){console.warn(error);setTimeout(()=>finishAi(chooseOmokMove(solo.board),'보조 AI'),150);}
 }else setTimeout(()=>finishAi(chooseOmokMove(solo.board),'보조 AI'),150);
}


function soloYutNext(turn,message){
 if(!solo||solo.game!=='yut'||solo.finished)return;
 solo.turn=turn;solo.pending=null;solo.rolls=[];solo.phase='throw';solo.throwsRemaining=1;solo.rollName=null;
 solo.deadline=Date.now()+solo.timeSeconds*1000;
 solo.msg=message||(turn==='player'?'당신 차례입니다. 윷을 던지세요.':'고양이가 생각하고 있어요.');
 yutRollSelection=null;yutRouteChoice=null;
 if(yutRolling?.scope==='cat')yutRolling=null;
 render();
 if(turn==='ai')soloYutAiTurn();
}
function soloYutRoll(){
 if(!solo||solo.game!=='yut'||solo.turn!=='player'||solo.finished||solo.phase!=='throw')return;
 const roll=rollYut(Math.random,false);
 solo.rolls.push(roll);solo.tossCounts.player++;solo.lastRoll=roll;solo.rollName=YUT_NAMES[roll];
 solo.throwsRemaining--;if(roll===4||roll===5)solo.throwsRemaining++;
 if(solo.rolls.length>=24)solo.throwsRemaining=0;
 solo.deadline=Date.now()+solo.timeSeconds*1000;
 solo.history.push('나: '+solo.rollName+' 던짐');solo.history=solo.history.slice(-8);
 if(solo.throwsRemaining>0)solo.msg='나: '+solo.rollName+'! 한 번 더 던지세요. 말은 나중에 움직입니다.';
 else{
  solo.rolls=usableYutRolls(solo.pieces.player,solo.rolls);
  if(!solo.rolls.length){soloYutNext('ai','움직일 말이 없어 고양이 차례가 됩니다.');return;}
  solo.phase='move';solo.msg='모두 던졌어요! 결과를 선택하고 말을 눌러 경로를 미리 확인하세요.';
 }
 render();
}
function soloYutApply(side,index,shortcut=true,rollIndices=[0]){
 if(!solo||solo.game!=='yut'||solo.turn!==side||solo.finished||solo.phase!=='move')return;
 const mine=solo.pieces[side];
 let steps;
 try{steps=yutSelectedSteps(solo.rolls,rollIndices);}catch{toast('사용할 윷 결과를 다시 선택하세요.');return;}
 if(!legalYutMoves(mine,steps).some(m=>m.index===index&&m.shortcut===shortcut)){toast('선택한 결과로 움직일 수 없습니다.');return;}
 const usedNames=rollIndices.map(i=>YUT_NAMES[solo.rolls[i]]).join('+');
 let result;
 try{result=applyYutMove(mine,solo.pieces[side==='player'?'ai':'player'],index,steps,shortcut);}
 catch{toast('이동할 수 없는 말입니다.');return;}
 solo.lastMove={sid:side,index,to:result.to,at:Date.now(),shortcut};
 solo.pieces[side]=result.mine;solo.pieces[side==='player'?'ai':'player']=result.enemy;solo.catches[side]+=result.caught;
 const name=side==='player'?'나':'🐱 고양이';
 const message=name+': '+usedNames+' → '+(index+1)+'번 말'+(result.caught?' · 상대 말 '+result.caught+'개 잡기!':'')+(result.done?' · 완주!':'');
 solo.history.push(message);solo.history=solo.history.slice(-8);
 yutRouteChoice=null;yutRollSelection=null;
 if(result.won){
  solo.finished=true;solo.rolls=[];solo.msg=side==='player'?'당신 승리! 윷놀이에서 고양이를 이겼어요!':'고양이 승리! 다음 판에 다시 도전해 보세요.';
  render();return;
 }
 const used=new Set(rollIndices);solo.rolls=solo.rolls.filter((_,i)=>!used.has(i));
 solo.rolls=usableYutRolls(solo.pieces[side],solo.rolls);
 solo.deadline=Date.now()+solo.timeSeconds*1000;
 if(result.caught){
  solo.phase='throw';solo.throwsRemaining=1;
  solo.msg=message+' 상대 말을 잡아서 먼저 한 번 더 던져요!';
  render();if(side==='ai')soloYutAiTurn();
 }else if(solo.rolls.length){
  solo.phase='move';solo.msg=message+' 남은 윷 결과로 더 이동하세요.';
  render();if(side==='ai')soloYutAiTurn();
 }else if(side==='ai'){
  solo.msg=message+' · 잠시 후 당신 차례입니다.';
  render();
  const current=solo;
  setTimeout(()=>{
   if(solo===current&&!current.finished&&current.turn==='ai'&&!current.rolls.length)soloYutNext('player',message);
  },1150);
 }else soloYutNext('ai',message);
}
function soloYutAiTurn(delay=750){
 const current=solo;
 if(!current||current.game!=='yut'||current.turn!=='ai'||current.finished)return;
 setTimeout(()=>{
  if(solo!==current||current.turn!=='ai'||current.finished)return;
  if(current.phase==='throw'){
   // Show wind-up + airborne sticks before revealing each cat result.
   current.msg='🐱 고양이가 윷을 흔들어 던집니다...';
   yutRolling={scope:'cat',power:62};
   render();
   setTimeout(()=>{
    if(solo!==current||current.turn!=='ai'||current.finished||current.phase!=='throw')return;
    yutRolling=null;
    const roll=rollYut(Math.random,true);
    current.rolls.push(roll);current.tossCounts.ai++;current.lastRoll=roll;current.rollName=YUT_NAMES[roll];
    current.throwsRemaining--;if(roll===4||roll===5)current.throwsRemaining++;
    if(current.rolls.length>=24)current.throwsRemaining=0;
    current.history.push('🐱 고양이: '+current.rollName+' 던짐');current.history=current.history.slice(-8);
    current.msg='🐱 고양이의 결과: '+current.rollName+'!'+(current.throwsRemaining>0?' 추가로 한 번 더 던집니다.':' 이제 이동할 말을 고릅니다.');
    if(current.throwsRemaining===0){
     current.rolls=usableYutRolls(current.pieces.ai,current.rolls);
     if(!current.rolls.length){
      current.msg='🐱 고양이: '+current.rollName+'! 움직일 말이 없어 다음 차례로 넘어갑니다.';
      render();
      setTimeout(()=>{if(solo===current&&!current.finished&&current.turn==='ai')soloYutNext('player','고양이가 움직일 수 없어 당신 차례입니다!');},1400);
      return;
     }
     current.phase='move';
    }
    render();
    soloYutAiTurn(1450); // Let players read the actual Yut result.
   },850);
   return;
  }
  if(current.phase!=='move'||!current.rolls.length){soloYutNext('player','당신 차례입니다!');return;}
  const rolls=current.rolls,mine=current.pieces.ai,enemy=current.pieces.player;
  const candidates=rolls.map((_,i)=>[i]);
  const positives=rolls.map((x,i)=>x>0?i:-1).filter(i=>i>=0);
  if(positives.length>1)candidates.push(positives);
  for(let i=0;i<Math.min(positives.length,5);i++)for(let j=i+1;j<Math.min(positives.length,5);j++)candidates.push([positives[i],positives[j]]);
  let best=null,bestScore=-Infinity;
  for(const indices of candidates){
   const steps=yutSelectedSteps(rolls,indices);
   const move=chooseCatYutMove(mine,enemy,steps,Math.random,{difficulty:current.aiDifficulty||'beginner'});
   if(!move)continue;
   const projected=applyYutMove(mine,enemy,move.index,steps,move.shortcut);
   const tier=current.aiDifficulty||'beginner';
   const score=projected.caught*(tier==='advanced'?300:tier==='intermediate'?225:150)+
    (projected.won?10000:0)+(projected.done?(tier==='advanced'?180:80):0)+
    steps*(tier==='advanced'?7:3)+(tier==='advanced'?Math.random()*.2:Math.random()*2);
   if(score>bestScore){bestScore=score;best={indices,move};}
  }
  if(best){
   const label=best.indices.map(i=>YUT_NAMES[rolls[i]]).join('+');
   current.msg='🐱 고양이: '+label+' · '+(best.move.index+1)+'번 말을 움직이겠습니다.';
   render();
   setTimeout(()=>{
    if(solo===current&&current.turn==='ai'&&!current.finished&&current.phase==='move')soloYutApply('ai',best.move.index,best.move.shortcut,best.indices);
   },950);
  }else{
   current.rolls=[];soloYutNext('player','고양이가 이동할 말을 찾지 못했어요. 당신 차례!');
  }
 },delay);
}
function updateTick(){
 if(view==='solo'&&solo?.game==='rummikub'&&solo.engine.turn==='player'&&!solo.finished&&Date.now()>solo.engine.deadline){
  soloTickRummikub(solo);render();rkScheduleCat();
 }
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


function yutSelectRoll(mode,index){
 const isSolo=mode==='solo',s=isSolo?solo:room?.state,id=isSolo?'player':user.sid;
 if(!s||s.phase!=='move'||s.turn!==id||(isSolo?s.finished:room.status!=='playing'))return;
 if(!Number.isInteger(index)||index<0||index>=s.rolls.length)return;
 const roomId=isSolo?null:room.id,old=yutChoice(mode,s).indices;
 let next;
 if(old.includes(index)){next=old.filter(i=>i!==index);}
 else if(s.rolls[index]===-1||old.some(i=>s.rolls[i]===-1))next=[index];
 else next=[...old,index].sort((a,b)=>a-b);
 yutRollSelection={scope:mode,roomId,indices:next};yutRouteChoice=null;render();
}
async function yutMovePick(mode,index){
 const isSolo=mode==='solo',s=isSolo?solo:room?.state,id=isSolo?'player':user.sid;
 const pieces=isSolo?s?.pieces?.player:s?.pieces?.[id];
 if(!s||!pieces||s.phase!=='move'||(isSolo?s.turn!=='player'||s.finished:s.turn!==id||room.status!=='playing'))return;
 const steps=yutChoice(mode,s).steps;
 if(!Number.isInteger(steps)||!legalYutMoves(pieces,steps).some(m=>m.index===index)){toast('선택한 윷 결과로 이 말은 이동할 수 없습니다.');return;}
 // Preview first, never move the piece on the first click.
 yutRouteChoice={scope:mode,roomId:room?.id||null,index};
 render();
}
async function yutMoveRoute(mode,index,shortcut){
 const isSolo=mode==='solo',s=isSolo?solo:room?.state,id=isSolo?'player':user.sid;
 const pieces=isSolo?s?.pieces?.player:s?.pieces?.[id];
 if(!pieces||s.phase!=='move'||(isSolo?s.turn!=='player'||s.finished:s.turn!==id||room.status!=='playing'))return;
 const {steps,indices}=yutChoice(mode,s);
 if(!legalYutMoves(pieces,steps).some(m=>m.index===index&&m.shortcut===shortcut))return toast('이 경로로 이동할 수 없습니다.');
 yutRouteChoice=null;yutRollSelection=null;
 if(isSolo)soloYutApply('player',index,shortcut,indices);
 else await act('move',{index,shortcut,rollIndices:indices});
}
async function startYutThrow(mode,power=55){
 const isSolo=mode==='solo',s=isSolo?solo:room?.state;
 if(yutRolling||!s||s.phase!=='throw'||(isSolo?s.turn!=='player'||s.finished:s.turn!==user.sid||room.status!=='playing'))return;
 const oldSolo=solo,oldRoom=room?.id,safePower=Math.max(5,Math.min(100,Math.round(Number(power)||55)));
 yutRouteChoice=null;yutRollSelection=null;yutRolling={scope:mode,roomId:oldRoom,power:safePower};render();
 try{
  // Holding changes how far/long the sticks fly, not the probability of Do/Gae/Geol/Yut/Mo.
  await new Promise(resolve=>setTimeout(resolve,810+safePower*4));
  const stillHere=isSolo?solo===oldSolo&&view==='solo':room?.id===oldRoom&&room.status==='playing';
  if(stillHere){if(isSolo)soloYutRoll();else await act('roll');}
 }finally{
  if(yutRolling?.scope===mode&&yutRolling?.roomId===oldRoom)yutRolling=null;
  if(isSolo?view==='solo'&&solo===oldSolo:room?.id===oldRoom)render();
 }
}
function scrollGames(){document.getElementById('gamesSection')?.scrollIntoView({behavior:'smooth'});}
function rkScheduleCat(){
 const match=solo;
 if(!match||match.game!=='rummikub'||match.finished||match.pending||match.engine.turn!=='cat')return;
 match.pending=true;
 setTimeout(()=>{if(solo!==match||view!=='solo'||match.finished)return;
  try{catPlayRummikub(match);}catch(e){console.error(e);toast('고양이의 턴 처리에 오류가 발생했습니다.');}
  finally{match.pending=false;render();}
 },360);
}
configureRummikubUI({
 getContext:()=>view==='room'&&room?.game==='rummikub'?{r:room,sid:user.sid}:view==='solo'&&solo?.game==='rummikub'?{r:soloRoom(solo),sid:'player'}:null,
 refresh:()=>render(),toast:message=>toast(message),
 sendAction:async(type,payload)=>{
  if(view==='room')return act(type,payload);
  if(view==='solo'&&solo?.game==='rummikub'){
   try{soloPlayRummikub(solo,type,payload);render();rkScheduleCat();return true;}
   catch(e){toast(e?.message||'타일을 놓을 수 없습니다.');return false;}
  }
  return false;
 }
});
const yutPowerControl=installYutPowerControl({
 canThrow(mode){
  const s=mode==='solo'?solo:room?.state;
  return !yutRolling&&s?.phase==='throw'&&(mode==='solo'?solo?.game==='yut'&&s.turn==='player'&&!s.finished:room?.game==='yut'&&room.status==='playing'&&s.turn===user.sid);
 },
 onThrow(mode,power){void startYutThrow(mode,power);}
});
document.addEventListener('click',async e=>{
 const roomSetting=e.target.closest?.('[data-wr-setting]');
 if(roomSetting){
  if(view!=='room'||room?.status!=='lobby'||!amHost())return;
  const key=roomSetting.dataset.wrSetting,value=roomSetting.dataset.wrValue;
  const group=pregameSettingGroups(room.game).find(g=>g.key===key);
  if(!group||!group.choices.some(opt=>String(opt.value)===value))return;
  await act('settings',{[key]:key==='turnSeconds'?Number(value):value});
  return;
 }
 const modeButton=e.target.closest?.('[data-pg-mode]');
 if(modeButton&&(view==='detail'||view==='catSetup')){
  const modes=pregameModesFor(selection,view==='catSetup'),next=modeButton.dataset.pgMode;
  if(modes.includes(next)){pregameModes[selection]=next;render();}
  return;
 }
 const aiButton=e.target.closest?.('[data-pg-difficulty]');
 if(aiButton&&(view==='detail'||view==='catSetup')&&pregameModesFor(selection,view==='catSetup').includes('cat')&&
    (view==='catSetup'||pregameModes[selection]==='cat')){
  const difficulty=aiButton.dataset.pgDifficulty;
  if(['beginner','intermediate','advanced'].includes(difficulty)&&gamePrefs[selection]){
   gamePrefs[selection].aiDifficulty=difficulty;
   persistPregamePrefs();render();
  }
  return;
 }
 const settingButton=e.target.closest?.('[data-pg-setting]');
 if(settingButton&&(view==='detail'||view==='catSetup')&&gamePrefs[selection]){
  const key=settingButton.dataset.pgSetting,value=settingButton.dataset.pgValue;
  const group=pregameSettingGroups(selection).find(g=>g.key===key);
  if(!group||!group.choices.some(opt=>String(opt.value)===value))return;
  gamePrefs[selection][key]=key==='turnSeconds'?Number(value):value;
  persistPregamePrefs();render();return;
 }
 const g=e.target.closest('[data-game]');if(g){if(g.dataset.game==='escape'){location.href='/escape-access/index.html';return;}if(g.dataset.game==='marble'){location.href='/marble/index.html';return;}if(g.dataset.game==='gamehell'){location.href='/gamehell/index.html';return;}if(g.dataset.game==='tetris'){location.href='/tetris/index.html';return;}if(g.dataset.game==='logic'){location.href='/logic/index.html';return;}selection=g.dataset.game;view='detail';await refreshRooms(selection);render();window.scrollTo(0,0);return;}
 const join=e.target.closest('[data-join]');if(join){await joinRoom(join.dataset.join);return;}
 const b=e.target.closest('[data-action]');if(!b)return;
 const pregameMode=view==='catSetup'?'cat':pregameModesFor(selection).includes(pregameModes[selection])?pregameModes[selection]:pregameModesFor(selection)[0];
 const action=b.dataset.action==='lobbyStart'?(pregameMode==='cat'?'solo':'createRoom'):b.dataset.action;
 if(action==='catResultDismiss'&&view==='solo'&&solo?.finished){solo.resultDismissed=true;render();return;}
 if(action==='home'){routeHome();return;}if(action==='homeConfirm'){if(confirm('현재 게임방을 나가고 홈으로 이동할까요?'))await leave();return;}
 if(action==='nick'){revealNickname();return;}if(action==='openLogin'){membership.open('login');return;}if(action==='openRegister'){membership.open('register');return;}if(action==='guide'){view='guide';render();scrollTo(0,0);return;}
 if(action==='openJoin'){
  if(!(await membership.requireLogin(()=>{$('joinInput').value='';$('joinDialog').showModal();})))return;
  $('joinInput').value='';$('joinDialog').showModal();return;
 }
 if(action==='openCatHub'){solo=null;view='catHub';render();window.scrollTo(0,0);return;}
 if(action==='catTasteEscape'){location.href='/taste/escape/index.html';return;}
 if(action==='catTasteArcade'){location.href='/gamehell/index.html?trial=1';return;}
 if(action==='catChoose'){
  const target=b.dataset.catGame;
  if(!CAT_CHALLENGE_GAMES.includes(target))return;
  if(target==='marble'){location.href='/marble/index.html?cat=1';return;}if(target==='tetris'){location.href='/tetris/index.html?cat=1';return;}
  selection=target;view='catSetup';render();window.scrollTo(0,0);return;
 }
 if(action==='scrollGames'){scrollGames();return;}if(action==='createRoom'){await createRoom(selection);return;}
 if(action==='refreshRooms'){await refreshRooms(view==='detail'?selection:'');render();return;}
 if(action==='clear'&&room?.game==='doodle'){sendDoodle('clear');return;}
 if(action==='skip'&&room?.game==='doodle'){sendDoodle('skip');return;}
 if(action==='start'||action==='ready'||action==='rematch'||action==='ring'||action==='discussionEnd'){await act(action);return;}
 if(action==='leave'){if(confirm('게임방을 나가시겠습니까?'))await leave();return;}
 if(action==='share'||action==='copyCode'){if(!room)return;const text=action==='copyCode'?room.id:`${location.origin}/?room=${room.id}`;try{await navigator.clipboard.writeText(text);toast('초대 정보를 복사했습니다.');}catch{toast(text);}return;}
 if(action==='place'){await act('place',{x:Number(b.dataset.x),y:Number(b.dataset.y)});return;}
 if(action==='mafiaPass'){await act('nightPass');return;}
 if(action==='night'||action==='mafiaVote'||action==='liarVote'){await act(action==='mafiaVote'?'vote':action==='liarVote'?'vote':'night',{target:b.dataset.target});return;}
 if(action==='drawColor'){drawColor=b.dataset.color;document.querySelectorAll('.color-dot').forEach(el=>el.classList.toggle('selected',el.dataset.color===drawColor));return;}
 if(action==='roll'||action==='soloYutRoll'){
  if(yutPowerControl.shouldIgnoreClick())return;
  // Accessible fallback for screen readers and conventional button activation.
  await startYutThrow(action==='roll'?'room':'solo',55);return;
 }
  if(action==='yutRollChoice'){yutSelectRoll('room',Number(b.dataset.rollIndex));return;}
  if(action==='soloYutRollChoice'){yutSelectRoll('solo',Number(b.dataset.rollIndex));return;}
 if(action==='yutPick'){await yutMovePick('room',Number(b.dataset.index));return;}
 if(action==='yutRoute'){await yutMoveRoute('room',Number(b.dataset.index),b.dataset.shortcut==='1');return;}
 if(action==='soloYutPick'){await yutMovePick('solo',Number(b.dataset.index));return;}
 if(action==='soloYutRoute'){await yutMoveRoute('solo',Number(b.dataset.index),b.dataset.shortcut==='1');return;}
 if(action==='move'){await act('move',{index:Number(b.dataset.index),shortcut:b.dataset.shortcut!=='0'});return;}
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
 if(action==='backCatHub'){view='catHub';solo=null;render();window.scrollTo(0,0);return;}
 if(action==='soloPlace'){soloPlace(Number(b.dataset.x),Number(b.dataset.y));return;}
 if(action==='soloYutRoll')return;
 if(action==='soloYutMove'){soloYutApply('player',Number(b.dataset.index),b.dataset.shortcut!=='0');return;}
 if(b.hasAttribute('data-stone-style-choice')){
   const style=b.dataset.stoneStyleChoice;if(style!=='normal'&&style!=='crazy')return;
   if(b.hasAttribute('data-stone-style-room')){
     if(room?.status==='lobby'&&amHost())await act('settings',{stoneStyle:style});
   }else if(gamePrefs[selection]){gamePrefs[selection].stoneStyle=style;persistPregamePrefs();render();}
   return;
 }
});
document.addEventListener('change',async e=>{
 const p=e.target.closest?.('select[data-pref]');
 if(p&&gamePrefs[selection]){gamePrefs[selection][p.dataset.pref]=p.dataset.pref==='turnSeconds'?Number(p.value):p.value;persistPregamePrefs();return;}
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
 const form=e.target;if(form.id==='nickForm'){e.preventDefault();$('nickDialog').close();membership.open('login');return;}
 if(form.id==='joinForm'){e.preventDefault();const code=$('joinInput').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==6){toast('6자리 코드를 입력하세요.');return;}await joinRoom(code);return;}
 if(!form.dataset.form)return;e.preventDefault();if(composingForm)return;const values=Object.fromEntries(new FormData(form).entries());const type=form.dataset.form;
 if(type==='soloWord'){const input=form.querySelector('input[name=word]');if(input)input.value='';const worked=soloPlayWord(values.word);if(worked===false&&input){input.value=values.word;input.focus({preventScroll:true});}return;}
 const mapping={word:'word',chat:'chat',lobbyChat:'lobbyChat',mafiaWhisper:'mafiaWhisper',clue:'clue',guess:'guess'};
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
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',async()=>{if(room&&!(confirm('게임방을 나가고 이동할까요?')))return;if(room)await leave();if(b.dataset.nav==='home'){routeHome();}else if(b.dataset.nav==='cat'){view='catHub';solo=null;render();}else if(b.dataset.nav==='rooms'){view='rooms';await refreshRooms();render();}else{view='guide';render();}scrollTo(0,0);}));
setInterval(updateTick,200);
async function init(){await membership.refresh();await refreshRooms();const url=new URLSearchParams(location.search),catReturn=url.get('cat')==='1'&&!url.get('room'),code=catReturn?null:url.get('room')||sessionStorage.getItem('moyeo-last-room');if(catReturn){view='catHub';}if(code&&/^[A-Za-z0-9]{6}$/.test(code)&&apiLive){try{await joinRoom(code);return;}catch(e){sessionStorage.removeItem('moyeo-last-room');}}render();if(url.get('auth')==='login')membership.open('login');}
membership=createMembershipUI({
 onAccountChanged(account){
  if(account){
   user.sid=account.id;user.nick=account.dripNickname;
   sessionStorage.setItem('moyeo-sid',account.id);localStorage.setItem('moyeo-nick',account.dripNickname);
  }else{
   const guestSid=crypto.randomUUID();user.sid=guestSid;sessionStorage.setItem('moyeo-sid',guestSid);
   user.nick='게스트';
  }
  if(document.getElementById('headerNickname'))$('headerNickname').textContent=account?account.dripNickname:'로그인 / 회원가입';
  if(root?.innerHTML&&!root.querySelector('.loading-area'))render();
 },
 afterLogin(){
  const params=new URLSearchParams(location.search),next=params.get('next');
  if(next&&/^\/(?:marble\/index\.html|gamehell\/index\.html|tetris\/index\.html|logic\/index\.html|escape-access\/index\.html)(?:\?[^#]*)?(?:#.*)?$/.test(next)){location.href=next;return;}
  refreshRooms(view==='detail'?selection:'').then(()=>render());
 }
});
init();
