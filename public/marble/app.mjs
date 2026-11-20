import {TILES,GROUPS,createGame,applyAction,chooseCatAction,netWorth,toll,buildingCost,propertyValue,countMonopolies,winnerRanking} from './engine.mjs';
const root=document.querySelector('#mmApp');
const toastZone=document.querySelector('#mmToast');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons=['🐰','🐱','🐻','🦊'];
const paint=['#ff9ca9','#b9adf5','#8cd7c5','#f4c184'];
const dice=['','⚀','⚁','⚂','⚃','⚄','⚅'];
const formatM=n=>Math.round(n).toLocaleString('ko-KR')+'M';
const SID=sessionStorage.getItem('moyeo-sid')||crypto.randomUUID();
sessionStorage.setItem('moyeo-sid',SID);
let nick=localStorage.getItem('moyeo-nick')||'말랑감자';
let mode='ai',rounds=12,people=2,seconds=30;
let localGame=null,onlineRoom=null,stream=null,inFlight=false,aiTimer=null,showResult=false;
let lastDice=null,turnHint='';
let clockOffset=0;
const current=s=>s.players[s.turnIndex];
const getState=()=>onlineRoom?.state||localGame;
function toast(message){const n=document.createElement('div');n.className='mm-toast';n.textContent=message;toastZone.append(n);setTimeout(()=>n.remove(),3300);}
function button(action,text,kind='mm-primary',disabled=false){return `<button class="mm-btn ${kind}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;}
function renderLobby(){
 const modes=[
  ['ai','🐱','고양이를 이겨라','생각보다 영리한 고양이와 1:1 두뇌 대결'],
  ['online','🎮','친구와 온라인','다른 기기에서도 링크로 2~4인 접속'],
  ['local','🎲','한 화면에서 함께','한 기기에서 돌아가며 2~4인 플레이']
 ];
 root.innerHTML=`<section class="mm-lobby-hero"><span class="mm-eyebrow">MOYEO GAMES PRESENTS</span><h1>어서 와, <span>모여마블!</span></h1><p>세상을 돌며 도시를 사고, 랜드마크를 세우고,<br>친구의 통행료를 받아 보세요. 한 판은 짧고 전략은 진하게!</p><div class="mm-hero-cards"><span>🗺️ 24칸 압축 맵</span><span>⏱️ 8 · 12 · 16라운드</span><span>🏙️ 랜드마크 & 독점</span></div></section>
 <section class="mm-setup"><h2>어떤 대결을 할까요?</h2><p class="mm-setup-sub">로그인 필요 없이 바로 시작해요. 온라인 대결은 초대 코드로 친구가 들어올 수 있어요.</p>
 <div class="mm-mode-grid">${modes.map(([id,icon,title,description])=>`<button class="mm-mode ${id===mode?'selected':''}" data-mode="${id}" aria-pressed="${id===mode}"><span class="mm-mode-emoji">${icon}</span><strong>${title}</strong><small>${description}</small>${id===mode?'<span class="mm-selected-check">✓</span>':''}</button>`).join('')}</div>
 <div class="mm-form-row"><div class="mm-field"><label for="mmNick">내 닉네임</label><input class="mm-input" id="mmNick" maxlength="14" value="${escapeHTML(nick)}" placeholder="닉네임을 입력하세요"></div><div class="mm-field"><label for="mmRounds">게임 길이</label><select class="mm-select" id="mmRounds"><option value="8" ${rounds===8?'selected':''}>⚡ 번개 모드 · 8라운드</option><option value="12" ${rounds===12?'selected':''}>✨ 기본 모드 · 12라운드</option><option value="16" ${rounds===16?'selected':''}>🏆 치열한 모드 · 16라운드</option></select></div></div>
 ${mode==='online'?`<div class="mm-field" style="margin-bottom:16px"><label for="mmSeconds">한 턴 제한시간</label><select class="mm-select" id="mmSeconds"><option value="15" ${seconds===15?'selected':''}>15초 · 초고속</option><option value="30" ${seconds===30?'selected':''}>30초 · 기본</option><option value="45" ${seconds===45?'selected':''}>45초 · 여유롭게</option></select></div>`:''}
 ${mode==='local'?`<div class="mm-field" style="margin-bottom:16px"><label for="mmPeople">함께 플레이할 인원</label><select class="mm-select" id="mmPeople"><option value="2" ${people===2?'selected':''}>2명</option><option value="3" ${people===3?'selected':''}>3명</option><option value="4" ${people===4?'selected':''}>4명</option></select></div>`:''}
 ${mode==='online'?`${button('createOnline','🎮 온라인 게임방 만들기','mm-primary mm-btn-full')}<div class="mm-online-join"><input class="mm-input" id="mmJoinCode" maxlength="6" placeholder="6자리 초대 코드" autocomplete="off">${button('joinOnline','코드로 입장','mm-neutral')}</div>`:`${button('startLocal',mode==='ai'?'🐱 고양이와 대결 시작!':'🎲 친구들과 대결 시작!','mm-primary mm-btn-full')}`}
 </section><section class="mm-guides"><article class="mm-guide"><span class="num">01 / OWN</span><h3>도시를 먼저 차지하세요</h3><p>빈 도시에 도착하면 바로 구매! 같은 색 두 도시를 모으면 통행료 2배.</p></article><article class="mm-guide"><span class="num">02 / BUILD</span><h3>건설과 인수로 역전</h3><p>내 도시에는 건물 4단계까지. 상대 도시는 통행료를 내고 인수 가능!</p></article><article class="mm-guide"><span class="num">03 / WIN</span><h3>짧고 짜릿한 승부</h3><p>파산, 3개 컬러 독점 또는 한 면 독점 시 즉시 승리. 아니면 총자산으로 결정.</p></article></section>`;
}
function renderWaiting(){
 const r=onlineRoom,isHost=r.host===SID;
 root.innerHTML=`<div class="mm-waiting"><div class="mm-waiting-icon">🎟️</div><span class="mm-eyebrow">FRIENDS ARE COMING</span><h2>친구를 초대해요!</h2><p>아래 코드를 복사해서 친구에게 보내주세요.<br>2~4명이 모이면 방장이 시작할 수 있어요.</p><div class="mm-room-code">${r.code}</div><div class="mm-member-list">${r.players.map(p=>`<span>${p.id===r.host?'👑 ':''}${escapeHTML(p.name)}</span>`).join('')}${r.players.length<4?'<span>＋ 대기 중</span>':''}</div><p>${r.players.length}/4명 · ${r.rounds}라운드 · 턴당 ${r.turnSeconds}초 · 다른 기기에서 접속 가능</p><div class="mm-waiting-actions">${button('copyInvite','🔗 초대 링크 복사','mm-neutral')}${isHost?button('startOnline','🎲 게임 시작','mm-primary',r.players.length<2):''}${button('leave','나가기','mm-secondary')}</div></div>`;
}
function tilePos(i){
 if(i<=6)return [7,i+1];
 if(i<=12)return [7-(i-6),7];
 if(i<=18)return [1,7-(i-12)];
 return [i-17,1];
}
function token(s,p,i){const idx=s.players.indexOf(p);return `<span class="mm-pawn" title="${escapeHTML(p.name)}" style="--pawn-color:${paint[idx]}">${icons[idx]}</span>`;}
function renderTile(s,t,i){
 const [row,col]=tilePos(i),property=s.properties[i],ownerIndex=property?s.players.findIndex(p=>p.id===property.owner):-1;
 const isTravel=s.phase==='travel'&&current(s).id===(onlineRoom?SID:current(s).id)&&i!==18;
 const canSelect=isTravel&&(!current(s).ai);
 const pawns=s.players.filter(p=>!p.bankrupt&&p.position===i);
 const total=property?toll(s,i):null;
 const title=t.kind==='city'?`${t.name} · 구매 ${formatM(t.price)}${property?` · 통행료 ${formatM(total)} · ${property.level}단계`:''}`:t.name;
 return `<div class="mm-tile ${t.kind==='city'?'mm-city':'mm-special'} ${property?'mm-own':''} ${canSelect?'mm-landable':''} ${pawns.some(p=>p.id===current(s).id)?'mm-highlight':''}" data-kind="${t.kind}" ${canSelect?`data-land="${i}" tabindex="0" role="button" aria-label="${escapeHTML(t.name)}(으)로 여행하기"`:''} title="${escapeHTML(title)}" style="grid-row:${row};grid-column:${col};${t.kind==='city'?`--tile-color:${GROUPS[t.group].color};`:''}${property?`--owner-color:${paint[ownerIndex]||'#a3a3a3'};`:''}">
 ${property?`<span class="mm-tile-building">${property.level===4?'🏰':`★${property.level}`}</span>`:''}<span class="mm-tile-emoji">${t.emoji}</span><span class="mm-tile-name">${escapeHTML(t.name)}</span>${t.kind==='city'?`<span class="mm-tile-price">${property?formatM(total):formatM(t.price)}</span>`:''}${pawns.length?`<span class="mm-tile-tokens">${pawns.map(p=>token(s,p,i)).join('')}</span>`:''}</div>`;
}
function actionPanel(s){
 const p=current(s),yourTurn=onlineRoom?p.id===SID:!p.ai;
 if(s.phase==='finished'){
  const rank=winnerRanking(s),winner=s.players.find(x=>x.id===s.winner);
  return `<div class="mm-result"><span class="mm-result-emoji">🏆</span><h2>${escapeHTML(winner?.name||'승자')} 승리!</h2><p>${escapeHTML(s.reason||'게임 종료')}</p><div class="mm-result-rank">${rank.map((x,i)=>`<div><span>${i+1}위 ${escapeHTML(x.name)}</span><span>${formatM(netWorth(s,x.id))}</span></div>`).join('')}</div><div class="mm-center-actions">${onlineRoom?onlineRoom.host===SID?button('startOnline','다시 대결하기','mm-primary'):button('leave','메인으로','mm-secondary'):button('rematch','다시 대결하기','mm-primary')}${button('leave','종료','mm-secondary')}</div></div>`;
 }
 if(s.phase==='roll')return `<div class="mm-status-line">${escapeHTML(p.name)}님의 차례${p.stuck?' · 무인도 휴식':''}</div><p class="mm-status-sub">${p.ai?'고양이가 전략을 생각하고 있어요…':p.stuck?'이번 차례에는 무인도에서 쉬어갑니다.':'두 주사위를 굴려 도시에 도착하세요!'}</p><div class="mm-center-actions">${button('roll',p.stuck?'⏩ 휴식 턴 넘기기':'🎲 주사위 굴리기','mm-primary',!yourTurn||inFlight)}</div>`;
 if(s.phase==='travel')return `<div class="mm-status-line">🌏 세계여행 시간!</div><p class="mm-status-sub">${escapeHTML(p.name)}님, 원하는 칸을 선택하세요.</p><div class="mm-center-actions">${button('travelBest','✈️ 추천 도시로 여행','mm-primary',!yourTurn||inFlight)}</div>`;
 const {kind,index}=s.pending||{},t=TILES[index],v=s.properties[index],cost=kind==='purchase'?t.price:kind==='upgrade'?buildingCost(index,v.level):propertyValue(index,v.level)*2;
 const labels={purchase:['도시 구매','이 도시를 차지할까요?','🏙️ '+formatM(cost)+'에 구매','buy'],upgrade:['건물 건설','내 도시의 통행료를 올려보세요.','🏗️ '+formatM(cost)+'에 건설','upgrade'],takeover:['도시 인수','상대 도시를 비싸게 인수할 수 있어요.','⚔️ '+formatM(cost)+'에 인수','takeover']};
 const [title,desc,cta,action]=labels[kind]||['선택','결정이 필요해요.','확인','pass'];
 return `<div class="mm-status-line">${escapeHTML(t?.name||'도시')} · ${title}</div><p class="mm-status-sub">${desc}${kind==='takeover'?' (랜드마크는 인수 불가)':''}</p><div class="mm-center-actions">${button(action,cta,'mm-primary',!yourTurn||inFlight)}${button('pass','건너뛰기','mm-neutral',!yourTurn||inFlight)}</div>`;
}
function sidePanel(s){
 const p=current(s),turns=s.maxRounds*s.players.length;
 const showTimers=onlineRoom && s.phase!=='finished';
 return `<aside class="mm-sidebar"><section class="mm-card"><h2 class="mm-card-title">참가자 <small>${s.players.length}명</small></h2>${s.players.map((x,i)=>`<div class="mm-player ${p.id===x.id&&s.phase!=='finished'?'current':''} ${x.bankrupt?'bankrupt':''}"><span class="mm-avatar" style="--pcolor:${paint[i]}">${icons[i]}</span><div class="mm-player-info"><strong>${escapeHTML(x.name)}${x.ai?' · AI':''}</strong><small>도시 ${Object.values(s.properties).filter(z=>z.owner===x.id).length}개 · 독점 ${countMonopolies(s,x.id)}세트</small></div><span class="mm-money">${formatM(x.cash)}<small><br>자산 ${formatM(netWorth(s,x.id))}</small></span></div>`).join('')}<div class="mm-progress"><div class="mm-progress-fill" style="width:${Math.min(100,Math.round(s.turnCount/turns*100))}%"></div></div><div class="mm-progress-label"><span>${s.round} / ${s.maxRounds}라운드</span><span>${Math.min(turns,s.turnCount)}/${turns}턴</span></div>${showTimers?`<p style="text-align:center;margin:10px 0 0"><span class="mm-clock" data-clock>⏳ 30초</span></p>`:''}</section>
 <section class="mm-card"><h2 class="mm-card-title">최근 소식 <small>실시간 게임 기록</small></h2><div class="mm-log-list">${s.log.slice(0,12).map(e=>`<div class="mm-log">${escapeHTML(e.text)}</div>`).join('')}</div></section>
 <section class="mm-card"><h2 class="mm-card-title">✨ 승리 팁</h2><div class="mm-helper">같은 색 도시 2개를 모두 사면 해당 통행료가 2배!<br>서로 다른 색 3세트 또는 한 면의 도시를 모두 독점하면 즉시 승리합니다.<br>랜드마크(4단계)는 인수할 수 없어요.</div>${onlineRoom?`<div style="margin-top:12px">${button('copyInvite','🔗 방 링크 복사','mm-neutral')}</div>`:''}</section></aside>`;
}
function renderGame(s){
 const p=current(s);
 const rolls=s.lastRoll||lastDice;
 const [a,b]=rolls?[rolls.a,rolls.b]:[1,6];
 root.innerHTML=`<div class="mm-topgame"><div><span class="mm-eyebrow">MOYEO MARBLE · ${onlineRoom?'ONLINE MATCH':mode==='ai'?'CAT CHALLENGE':'LOCAL MATCH'}</span><h1>모여마블 <span style="font-size:14px;color:#a99dab">${s.round}/${s.maxRounds} 라운드</span></h1><p>${onlineRoom?`방 코드 ${onlineRoom.code} · 모든 주사위는 서버에서 판정`:mode==='ai'?'고양이 AI와 1:1 대결 중':'한 화면에서 돌아가며 플레이 중'}</p></div><div style="display:flex;gap:7px;align-items:center"><span class="mm-indicator">● ${onlineRoom?'온라인 연결':'플레이 중'}</span>${button('leave','↩ 나가기','mm-neutral')}</div></div>
 <div class="mm-gamewrap"><div class="mm-main-panel"><section class="mm-board-frame"><div class="mm-board">${TILES.map((t,i)=>renderTile(s,t,i)).join('')}<section class="mm-board-center"><span class="mm-center-kicker">🎲 DREAM · OWN · WIN</span><h2 class="mm-center-title">모여<span>마블</span></h2><p class="mm-center-sub">도시를 모아 세상을 정복해봐!</p>${s.phase==='finished'?'':`<div class="mm-dice-row"><span class="mm-die ${s.lastRoll?'spun':''}">${dice[a]}</span><span class="mm-die ${s.lastRoll?'spun':''}">${dice[b]}</span></div>`}${actionPanel(s)}<span class="mm-center-tip">🌷 행운은 짧게, 전략은 길게!</span></section></div></section>
 ${s.phase==='travel'&&!p.ai&&(!onlineRoom||p.id===SID)?`<section class="mm-option-panel"><h3 class="mm-option-title">✈️ 여행할 도시를 선택해주세요</h3><div class="mm-travel-grid">${TILES.map((t,i)=>({t,i})).filter(z=>z.t.kind==='city').map(({t,i})=>`<button data-land="${i}">${t.emoji} ${escapeHTML(t.name)}</button>`).join('')}</div></section>`:''}</div>${sidePanel(s)}</div>`;
}
function render(){if(onlineRoom){if(!onlineRoom.state)renderWaiting();else renderGame(onlineRoom.state);}else if(localGame)renderGame(localGame);else renderLobby();updateClock();}
function persistNick(){const input=document.querySelector('#mmNick');if(input){nick=(input.value||'말랑감자').trim().slice(0,14)||'말랑감자';localStorage.setItem('moyeo-nick',nick);}}
function startLocal(){persistNick();const players=[{id:SID,name:nick}];
 if(mode==='ai')players.push({id:'moyeo-cat',name:'고양이',ai:true});
 else for(let i=1;i<people;i++)players.push({id:`local-${i}`,name:`플레이어 ${i+1}`});
 localGame=createGame({players,maxRounds:rounds});onlineRoom=null;lastDice=null;render();queueCat();}
function queueCat(){clearTimeout(aiTimer);if(onlineRoom||!localGame||localGame.phase==='finished')return;
 const p=current(localGame);if(!p.ai)return;
 aiTimer=setTimeout(()=>{if(!localGame||!current(localGame).ai)return;const action=chooseCatAction(localGame);if(action)executeAction(action.type,action.payload||{});},620);
}
function executeAction(type,payload={}){
 if(inFlight)return;
 if(onlineRoom){const s=onlineRoom.state;if(!s||current(s).id!==SID)return;inFlight=true;post(`/api/marble/rooms/${onlineRoom.code}/action`,{sid:SID,type,payload}).then(data=>{updateOnlineRoom(data);}).catch(error=>toast(error.message)).finally(()=>{inFlight=false;render();});return;}
 if(!localGame)return;
 try{const before=localGame;localGame=applyAction(localGame,current(localGame).id,type,payload);lastDice=localGame.lastRoll||lastDice;render();queueCat();}catch(error){toast(error.message);}
}
async function post(url,data){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const json=await res.json();if(!res.ok)throw Error(json.error||'요청 실패');return json;}
async function get(url){const res=await fetch(url);const json=await res.json();if(!res.ok)throw Error(json.error||'요청 실패');return json;}
function updateOnlineRoom(data){onlineRoom=data;clockOffset=data.now-Date.now();lastDice=data.state?.lastRoll||lastDice;render();}
function connectSSE(roomCode){stream?.close();stream=new EventSource(`/api/marble/rooms/${roomCode}/events?sid=${encodeURIComponent(SID)}`);
 stream.addEventListener('state',e=>{try{const data=JSON.parse(e.data);if(data.code!==onlineRoom?.code)return;updateOnlineRoom(data);}catch(error){console.error('온라인 상태 수신 오류',error);}});
 stream.addEventListener('error',()=>{/* EventSource automatically reconnects. */});
}
async function createOnline(){persistNick();inFlight=true;try{const r=await post('/api/marble/rooms',{sid:SID,name:nick,rounds,turnSeconds:seconds});localGame=null;lastDice=null;updateOnlineRoom(r);location.hash=`room=${r.code}`;connectSSE(r.code);}catch(error){toast(`온라인 방 생성 실패: ${error.message} · 서버 통합 설정을 확인해주세요.`);}finally{inFlight=false;}}
async function joinOnline(code){persistNick();const id=(code||'').trim().toUpperCase();if(!/^[0-9A-F]{6}$/.test(id))return toast('6자리 초대 코드를 확인해주세요.');
 inFlight=true;try{let r=await post(`/api/marble/rooms/${id}/join`,{sid:SID,name:nick});localGame=null;lastDice=null;mode='online';updateOnlineRoom(r);location.hash=`room=${r.code}`;connectSSE(r.code);}catch(error){toast(error.message);if(!onlineRoom){location.hash='';render();}}finally{inFlight=false;}}
async function startOnline(){if(!onlineRoom||inFlight)return;inFlight=true;try{const data=await post(`/api/marble/rooms/${onlineRoom.code}/start`,{sid:SID});lastDice=null;updateOnlineRoom(data);}catch(error){toast(error.message);}finally{inFlight=false;}}
async function leave(){
 if(onlineRoom?.state?.phase!=='finished' && onlineRoom?.state && !window.confirm('온라인 게임에서 나가면 기권 처리됩니다. 나갈까요?'))return;
 clearTimeout(aiTimer);stream?.close();stream=null;
 if(onlineRoom){
  try{await post(`/api/marble/rooms/${onlineRoom.code}/leave`,{sid:SID});}catch{}
 }
 localGame=null;onlineRoom=null;lastDice=null;mode='ai';location.hash='';render();}
async function copyInvite(){const url=`${location.origin}${location.pathname}#room=${onlineRoom?.code||''}`;
 try{await navigator.clipboard.writeText(url);toast('초대 링크가 복사되었습니다!');}catch{toast('초대 코드: '+(onlineRoom?.code||''));}}
function updateClock(){const el=document.querySelector('[data-clock]');if(!el||!onlineRoom?.deadline)return;
 // Use the offset captured at the latest server sync, not a continuously recalculated offset.
 const second=Math.max(0,Math.ceil((onlineRoom.deadline-(Date.now()+clockOffset))/1000));
 el.textContent=`⏳ ${second}초`;el.classList.toggle('warn',second<=8);
}
setInterval(updateClock,1000);
root.addEventListener('click',async e=>{
 const modeBtn=e.target.closest('[data-mode]');if(modeBtn){persistNick();mode=modeBtn.dataset.mode;render();return;}
 const land=e.target.closest('[data-land]');if(land){executeAction('travel',{index:Number(land.dataset.land)});return;}
 const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
 switch(action){
 case 'startLocal':startLocal();break;
 case 'createOnline':await createOnline();break;
 case 'joinOnline':await joinOnline(document.querySelector('#mmJoinCode')?.value);break;
 case 'startOnline':await startOnline();break;
 case 'roll':case 'buy':case 'upgrade':case 'takeover':case 'pass':executeAction(action);break;
 case 'travelBest':{const s=getState();if(!s||s.phase!=='travel')break;const available=TILES.map((t,i)=>({t,i})).filter(({t,i})=>t.kind==='city'&&!s.properties[i]);const best=available.sort((a,b)=>a.t.price-b.t.price)[0]?.i??0;executeAction('travel',{index:best});break;}
 case 'copyInvite':await copyInvite();break;
 case 'leave':await leave();break;
 case 'rematch':startLocal();break;
 }
});
root.addEventListener('change',e=>{
 if(e.target.id==='mmRounds')rounds=Number(e.target.value)||12;
 if(e.target.id==='mmSeconds')seconds=Number(e.target.value)||30;
 if(e.target.id==='mmPeople')people=Math.min(4,Math.max(2,Number(e.target.value)||2));
 if(e.target.id==='mmNick')persistNick();
});
root.addEventListener('keydown',e=>{if(e.key==='Enter' && e.target.matches('[data-land]')){e.preventDefault();executeAction('travel',{index:Number(e.target.dataset.land)});}if(e.key==='Enter' && e.target.id==='mmJoinCode'){e.preventDefault();joinOnline(e.target.value);}});
render();
const invite=location.hash.match(/room=([0-9a-f]{6})/i);if(invite){mode='online';joinOnline(invite[1]);}
