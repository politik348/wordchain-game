import {renderPregame} from '../pregame-lobbies.mjs?v=20261120marbleSetup1';
import {TILES,GROUPS,createGame,applyAction,chooseCatAction,netWorth,toll,buildingCost,upgradeCost,maxBuildLevel,propertyValue,saleValue,countMonopolies,olympicCost,LEVEL_NAMES,BAIL_COST,BANK_LOAN,BANK_REPAY,PASS_BONUS,winnerRanking} from './engine.mjs?v=20261123lapsalary1';
const root=document.querySelector('#mmApp');
const toastZone=document.querySelector('#mmToast');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons=['🐰','🐱','🐻','🦊'];
const avatarFiles=['rabbit.svg','cat.svg','bear.svg','fox.svg'];
const characterArt=(index,extra='')=>`<img class="mm-avatar-art ${extra}" alt="" loading="eager" draggable="false" src="./assets/${avatarFiles[index]||avatarFiles[2]}">`;
const ROUND_OPTIONS=[8,12,16,20];
const paint=['#ff9ca9','#b9adf5','#8cd7c5','#f4c184'];
const dice=['','⚀','⚁','⚂','⚃','⚄','⚅'];
const formatM=n=>Math.round(n).toLocaleString('ko-KR')+'M';
let SID=sessionStorage.getItem('moyeo-sid')||crypto.randomUUID();
sessionStorage.setItem('moyeo-sid',SID);
let nick=localStorage.getItem('moyeo-nick')||'말랑감자';
// The main site isolates the Cat AI challenge from friends' local and online matches.
const catChallenge=new URLSearchParams(location.search).get('cat')==='1';
const backLink=document.getElementById('mmReturnLink');if(backLink)backLink.href=catChallenge?'/?cat=1':'/';
async function ensureMember(){
 try{
  const response=await fetch('/api/auth/me',{credentials:'same-origin'}),data=await response.json();
  if(response.ok&&data.authenticated&&data.account){
   SID=data.account.id;nick=data.account.dripNickname;
   sessionStorage.setItem('moyeo-sid',SID);localStorage.setItem('moyeo-nick',nick);
   return true;
  }
 }catch{}
 const next=location.pathname+location.search+location.hash;
 location.href='/?auth=login&next='+encodeURIComponent(next);
 return false;
}
let mode=catChallenge?'ai':'local',gameMode='normal',rounds=12,people=2,seconds=30;
let aiDifficulty=['beginner','intermediate','advanced'].includes(localStorage.getItem('moyeo-marble-ai-difficulty'))?localStorage.getItem('moyeo-marble-ai-difficulty'):'beginner';
let tutorialOn=localStorage.getItem('moyeo-marble-tutorial')!=='off';
const roundsForGame=()=>gameMode==='endless'?0:rounds;
let localGame=null,onlineRoom=null,stream=null,inFlight=false,aiTimer=null,showResult=false,sellPanelOpen=false,introActive=false,introTimer=null;
let lastDice=null,turnHint='';
let scene=null,sceneTimer=null,sceneQueue=[],seenActionSeq=0,inspectedCity=null;
let effectsOn=localStorage.getItem('moyeo-marble-effects')!=='off';
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
const moveDelay=()=>reducedMotion?20:effectsOn?105:22;
const colorName=i=>GROUPS[i]?.name||'';
const ownerAvatar=(s,id)=>{const i=s.players.findIndex(p=>p.id===id);return characterArt(i);};
const ownerColor=(s,id)=>{const i=s.players.findIndex(p=>p.id===id);return paint[i]||'#92929a';};
const fmtDelta=n=>`${n>0?'+':'−'}${formatM(Math.abs(n))}`;

let clockOffset=0;
const current=s=>s.players[s.turnIndex];
const getState=()=>onlineRoom?.state||localGame;
function toast(message){const n=document.createElement('div');n.className='mm-toast';n.textContent=message;toastZone.append(n);setTimeout(()=>n.remove(),3300);}
function button(action,text,kind='mm-primary',disabled=false,attrs=''){return `<button class="mm-btn ${kind}" data-action="${action}" ${disabled?'disabled':''} ${attrs}>${text}</button>`;}
function renderLobby(){
  const selectedMode=mode==='ai'?'cat':mode;
  const settings=[
    {
      key:'gameMode',label:'게임 모드',hint:'일반·무한 모드를 선택하세요',
      value:gameMode,large:true,choices:[
        {value:'normal',label:'✨ 일반 모드',description:'8~20라운드 중 선택해 승부'},
        {value:'endless',label:'♾️ 무한 모드',description:'마지막 생존자까지 계속'}
      ]
    }
  ];
  if(gameMode==='normal')settings.push({
    key:'rounds',label:'라운드 설정',hint:'일반 모드에서만 적용됩니다',
    value:String(rounds),choices:ROUND_OPTIONS.map(n=>({
      value:String(n),label:`${n}라운드`,description:n===12?'추천':''
    }))
  });
  if(mode==='online')settings.push({
    key:'seconds',label:'턴 제한시간',hint:'온라인 대전에서 적용됩니다',
    value:String(seconds),choices:[15,30,45].map(n=>({
      value:String(n),label:`${n}초`,description:n===30?'기본':''
    }))
  });
  if(mode==='local')settings.push({
    key:'people',label:'참가 인원',hint:'같은 화면에서 번갈아 진행',
    value:String(people),choices:[2,3,4].map(n=>({
      value:String(n),label:`${n}명`
    }))
  });
  const nicknameHtml=`<div class="pg-marble-extras">
    <label class="pg-marble-nicklabel" for="mmNick">내 닉네임 <small>${mode==='ai'?'자유롭게 설정할 수 있어요':'가입할 때 등록한 닉네임을 사용해요'}</small></label>
    <input class="mm-input pg-marble-nickname" id="mmNick" maxlength="14" value="${escapeHTML(nick)}" placeholder="닉네임을 입력하세요" autocomplete="nickname" ${mode!=='ai'?'readonly aria-readonly="true" title="회원가입 때 등록한 닉네임을 사용합니다"':''}>
    <div class="pg-marble-toggles">
      <button type="button" data-action="toggleLobbyEffects" class="mm-setting-toggle" aria-pressed="${effectsOn}"><span>✨ 생동감 있는 연출</span><span class="mm-toggle-track ${effectsOn?'on':''}"><i></i></span></button>
      <button type="button" data-action="toggleTutorial" class="mm-setting-toggle" aria-pressed="${tutorialOn}"><span>💡 초보자 도움말</span><span class="mm-toggle-track ${tutorialOn?'on':''}"><i></i></span></button>
    </div>
  </div>`;
  const joinHtml=mode==='online'?`<div class="pg-marble-join">
    <div><strong>이미 초대를 받았나요?</strong><small>6자리 초대 코드로 친구의 게임방에 입장하세요</small></div>
    <input class="mm-input" id="mmJoinCode" maxlength="6" placeholder="6자리 초대 코드" autocomplete="off" aria-label="초대 코드">
    <button type="button" data-action="joinOnline">코드로 입장 ↗</button>
  </div>`:'';
  root.innerHTML=renderPregame({
    game:{
      id:'marble',name:'모여마블',
      desc:'도시를 사고 건물을 세우며 역전하는 24칸 부동산 게임! 일반 모드와 무한 모드를 선택해 즐겨요.',
      badge:'24칸 부동산 대전',
      rules:[
        ['도시를 차지해요','주사위를 굴려 도시를 구매하고 같은 색의 도시를 모아보세요.'],
        ['첫 턴부터 건설','첫 방문부터 별장·빌딩·호텔을 지을 수 있어요. 랜드마크는 호텔 이후!'],
        ['출발지 통과 보너스',`한 바퀴를 돌면 ${PASS_BONUS}M 지급! 은행 대출이 남았다면 보너스로 먼저 상환해요.`],
        ['승리 조건','일반 모드는 컬러·라인 독점 또는 라운드 종료 자산으로, 무한 모드는 마지막 생존자로 승리합니다. 관광지 2곳 소유로는 즉시 승리하지 않아요.']
      ]
    },
    allowedModes:catChallenge?['cat']:['online','local'],
    mode:selectedMode,aiDifficulty,
    settings,startAction:mode==='online'?'createOnline':'startLocal',
    backAction:'marbleBack',showJoin:false,
    extraSettingsHtml:nicknameHtml,extraAfterLaunchHtml:joinHtml,
    launchSummary:gameMode==='endless'
      ?'♾️ 무한 모드 · 마지막 한 사람이 남을 때까지'
      :`✨ 일반 모드 · ${rounds}라운드`
  });
}
function renderWaiting(){
 const r=onlineRoom,isHost=r.host===SID;
 root.innerHTML=`<div class="mm-waiting"><div class="mm-waiting-icon">🎟️</div><span class="mm-eyebrow">FRIENDS ARE COMING</span><h2>친구를 초대해요!</h2><p>아래 코드를 복사해서 친구에게 보내주세요.<br>2~4명이 모이면 방장이 시작할 수 있어요.</p><div class="mm-room-code">${r.code}</div><div class="mm-member-list">${r.players.map(p=>`<span>${p.id===r.host?'👑 ':''}${escapeHTML(p.name)}</span>`).join('')}${r.players.length<4?'<span>＋ 대기 중</span>':''}</div><p>${r.players.length}/4명 · ${r.rounds===0?'♾️ 무한모드':r.rounds+'라운드'} · 턴당 ${r.turnSeconds}초 · 다른 기기에서 접속 가능</p><div class="mm-waiting-actions">${button('copyInvite','🔗 초대 링크 복사','mm-neutral')}${isHost?button('startOnline','🎲 게임 시작','mm-primary',r.players.length<2):''}${button('leave','나가기','mm-secondary')}</div></div>`;
}
function tilePos(i){
 if(i<=6)return [7,i+1];
 if(i<=12)return [7-(i-6),7];
 if(i<=18)return [1,7-(i-12)];
 return [i-17,1];
}
function token(s,p,i){const idx=s.players.indexOf(p);return `<span class="mm-pawn" title="${escapeHTML(p.name)}" style="--pawn-color:${paint[idx]}">${characterArt(idx)}</span>`;}
function renderTile(s,t,i){
 const [row,col]=tilePos(i),held=s.properties[i],ownerIndex=held?s.players.findIndex(p=>p.id===held.owner):-1;
 const owner=ownerIndex<0?null:s.players[ownerIndex],buyable=['city','tourist'].includes(t.kind);
 const canTravel=s.phase==='travel'&&current(s).id===(onlineRoom?SID:current(s).id)&&!current(s).ai&&i!==18;
 const canInspect=buyable&&!canTravel;
 const pawns=s.players.filter(p=>!p.bankrupt&&p.position===i&&!(scene?.event.dice&&scene.event.actor===p.id));
 const fee=held?toll(s,i):0;
 const label=t.kind==='tourist'?'관광지':t.kind==='city'?GROUPS[t.group].name+' 지역':'';
 const title=buyable?`${t.name} · ${held?`${owner?.name||'플레이어'} 소유 · ${LEVEL_NAMES[held.level]} · 통행료 ${formatM(fee)}`:`구매가 ${formatM(t.price)}`}`:t.name;
 const building=held&&t.kind==='city'?`<div class="mm-building-row" aria-label="${LEVEL_NAMES[held.level]}">${held.level===4?'<span class="mm-building-landmark">🏰</span>':held.level===0?'<span class="mm-empty-lot">🏳</span>':Array.from({length:held.level},(_,n)=>`<i class="mm-building-block" style="--height:${12+n*4}px"></i>`).join('')}</div>`:held&&t.kind==='tourist'?'<span class="mm-tourist-badge">🛟 관광지</span>':'';
 const ownerBadge=held?`<span class="mm-owner-badge" title="${escapeHTML(owner?.name)} 소유"><span class="mm-owner-icon">${characterArt(ownerIndex)}</span><b>${escapeHTML(owner?.name||'플레이어')}</b></span>`:'';
 const monopoly=held&&t.kind==='city'&&TILES.every((v,j)=>v.kind!=='city'||v.group!==t.group||s.properties[j]?.owner===held.owner);
 return `<div class="mm-tile ${buyable?'mm-city':'mm-special'} ${t.kind==='tourist'?'mm-tourist':''} ${held?'mm-own':''} ${canTravel?'mm-landable':''} ${pawns.some(p=>p.id===current(s).id)?'mm-highlight':''} ${scene?.event.tileIndex===i?'mm-scene-target':''} ${inspectedCity===i?'mm-inspected':''}" data-kind="${t.kind}" data-tile-index="${i}" ${canTravel?`data-land="${i}" tabindex="0" role="button" aria-label="${escapeHTML(t.name)}(으)로 여행하기"`:canInspect?`data-inspect="${i}" tabindex="0" role="button" aria-label="${escapeHTML(t.name)} 정보 보기"`:''} title="${escapeHTML(title)}" style="grid-row:${row};grid-column:${col};${buyable?`--tile-color:${t.kind==='tourist'?'#70b9df':GROUPS[t.group].color};`:''}${held?`--owner-color:${paint[ownerIndex]||'#a3a3a3'};`:''}">
 ${building}<span class="mm-tile-emoji">${t.emoji}</span><span class="mm-tile-name">${escapeHTML(t.name)}</span>${i===0?`<span class="mm-start-salary">+${formatM(PASS_BONUS)}</span>`:''}${buyable?`<span class="mm-tile-price">${held?`통행 ${formatM(fee)}`:formatM(t.price)}</span>`:''}${monopoly?'<span class="mm-monopoly-flag">2× 독점</span>':''}${s.olympics?.[i]?`<span class="mm-olympic-flag">🏅 ${s.olympics[i]}×</span>`:''}${ownerBadge}${pawns.length?`<span class="mm-tile-tokens">${pawns.map(p=>token(s,p,i)).join('')}</span>`:''}</div>`;
}
function sceneMarkup(s){
 if(!scene)return '';
 const ev=scene.event;
 const emoji=['roll','islandRoll'].includes(ev.type)?'🎲':ev.type==='buy'?'🏙️':['upgrade','startBuild'].includes(ev.type)?'🏗️':ev.type==='takeover'?'⚔️':ev.type==='travel'?'✈️':ev.type==='olympic'?'🏅':ev.type==='payBail'?'🏝️':ev.type==='pickCard'?(ev.card?.emoji||'💌'):ev.type==='takeLoan'?'🏦':'💬';
 const stageTitle=scene.stage==='dice'&&ev.dice?`주사위 ${ev.dice.a} + ${ev.dice.b} = ${ev.dice.total}`:scene.stage==='move'?'캐릭터 이동 중!':ev.message;
 const salary=ev.salary;
 const salaryReward=scene.stage==='outcome'&&salary?`<div class="mm-salary-reward"><strong>🚩 출발지 보너스 +${formatM(salary.gross)}</strong><span>${salary.repayment?`대출 상환 ${formatM(salary.repayment)} · 실제 지급 +${formatM(salary.received)}`:`현금 +${formatM(salary.received)} 지급`}</span></div>`:'';
 return `<div class="mm-scene-card ${ev.type==='pickCard'?'mm-fortune-reveal':''} ${ev.type==='takeLoan'?'mm-loan-reveal':''} ${ev.ai?'mm-scene-cat':''} ${scene.stage==='outcome'?'is-outcome':''}" role="status" aria-live="polite"><span class="mm-scene-label">${ev.ai?'🐱 고양이의 행동':'✨ '+escapeHTML(ev.actorName)+'님의 행동'}</span><div class="mm-scene-icon">${emoji}</div><strong>${escapeHTML(stageTitle)}</strong><small>${escapeHTML(ev.message)}</small>${salaryReward}${scene.stage==='outcome'&&ev.moneyChanges.length?`<div class="mm-scene-deltas">${ev.moneyChanges.map(m=>`<span class="${m.delta>0?'plus':'minus'}">${escapeHTML(m.name)} ${fmtDelta(m.delta)}</span>`).join('')}</div>`:''}<button class="mm-scene-skip" type="button" data-action="skipScene">연출 넘기기 »</button></div>`;
}
function scenePawnMarkup(s){
 if(!scene||scene.event.travel||scene.event.from===scene.event.to||!scene.event.dice)return '';
 const actor=s.players.find(p=>p.id===scene.event.actor);
 if(!actor)return '';
 const [row,col]=tilePos(scene.position);
 return `<span class="mm-replay-pawn" data-replay-pawn style="--pawn-color:${ownerColor(s,actor.id)};top:${((row-.5)/7)*100}%;left:${((col-.5)/7)*100}%">${ownerAvatar(s,actor.id)}</span>`;
}
function catThought(s,action){
 const kind=s.pending?.kind,i=s.pending?.index;
 if(action.type==='roll')return '어느 지역에 갈지 보면서 현금과 소유 도시를 계산 중이야.';
 if(action.type==='islandRoll')return '보석금을 아끼고 더블 탈출을 노려 보겠어.';
 if(action.type==='payBail')return '계속 쉬는 것보다 보석금을 내고 다시 투자하는 게 낫겠어.';
 if(action.type==='travel')return `${TILES[action.payload?.index]?.name||'도시'}의 투자 기회를 노리고 있어.`;
 if(action.type==='pickCard')return '어떤 편지가 좋은지 열어 볼까?';
 if(action.type==='takeLoan')return '대출은 한 번만 쓸 수 있어. 출발지 보너스로 상환할 생각이야.';
 if(action.type==='pass')return '지금은 현금을 아껴 다음 투자를 준비할게.';
 if(action.type==='buy'){
  const mate=TILES.findIndex((t,j)=>j!==i&&t.kind==='city'&&t.group===TILES[i]?.group);
  return TILES[i]?.kind==='tourist'?'관광지는 인수가 안 되니까 먼저 차지할게.':s.properties[mate]?.owner===current(s).id?'같은 색 두 도시를 모아 통행료를 두 배로 올릴래.':action.payload?.targetLevel?'도시를 사면서 별장도 같이 지을래.':'먼저 토지를 확보하고 다음 건설을 준비할래.';
 }
 if(action.type==='upgrade'||action.type==='startBuild')return '건물을 올려 통행료를 높이고 랜드마크를 준비할래.';
 if(action.type==='olympic')return '올림픽을 개최해 내 도시 통행료를 높여야지.';
 if(action.type==='takeover')return '상대 도시를 가져와 독점을 노릴 거야. 인수비는 건물 포함 가치의 2배야.';
 return '';
}
function recentAction(s){
 const ev=s.lastEvent;
 if(!ev)return '<span class="mm-action-empty">🎲 아직 첫 주사위를 기다리고 있어요.</span>';
 const changes=ev.moneyChanges.map(m=>`<span class="mm-action-delta ${m.delta>0?'positive':'negative'}">${escapeHTML(m.name)} ${fmtDelta(m.delta)}</span>`).join('');
 const salarySummary=ev.salary?`<span class="mm-action-salary">🚩 통과 보너스 +${formatM(ev.salary.gross)}${ev.salary.repayment?` · 대출 상환 ${formatM(ev.salary.repayment)}`:''}</span>`:'';
 return `<div class="mm-action-who" style="--action-color:${ownerColor(s,ev.actor)}"><span class="mm-action-face">${ownerAvatar(s,ev.actor)}</span><div><small>${ev.ai?'고양이 AI의 최근 행동':'방금 일어난 행동'}</small><strong>${escapeHTML(ev.message)}</strong>${ev.thought?`<span class="mm-action-thought">💭 ${escapeHTML(ev.thought)}</span>`:''}</div></div><div class="mm-action-foot">${salarySummary}${changes||'<span>자산 변동 없음</span>'}</div>`;
}
function cityInspector(s){
 const i=inspectedCity;
 if(i===null||!['city','tourist'].includes(TILES[i]?.kind))return '';
 const t=TILES[i],v=s.properties[i],owner=s.players.find(p=>p.id===v?.owner);
 const level=t.kind==='tourist'?'관광지 · 건설 불가':LEVEL_NAMES[v?.level??0];
 return `<section class="mm-card mm-city-inspector"><div class="mm-inspector-head"><h2 class="mm-card-title">${t.emoji} ${escapeHTML(t.name)} 정보</h2><button data-action="closeInspector" type="button" aria-label="지역 정보 닫기">×</button></div><div class="mm-inspector-owner" style="--inspector-color:${owner?ownerColor(s,owner.id):'#e6e6ea'}">${owner?`${ownerAvatar(s,owner.id)} ${escapeHTML(owner.name)} 소유 · ${level}`:'아직 주인이 없어요'}</div><div class="mm-inspector-numbers"><span>구매가 <b>${formatM(t.price)}</b></span><span>통행료 <b>${v?formatM(toll(s,i)):'—'}</b></span><span>인수 <b>${t.kind==='tourist'||v?.level===4?'불가능':v?formatM(propertyValue(i,v.level)*2):'—'}</b></span><span>분류 <b>${t.kind==='tourist'?'관광지':escapeHTML(colorName(t.group))}</b></span></div>${t.kind==='city'?'<small>별장 → 빌딩 → 호텔 → 랜드마크. 랜드마크는 인수할 수 없어요.</small>':'<small>관광지는 건물을 지을 수 없고, 인수할 수도 없어요. 두 관광지를 모두 소유하면 관광지 독점 승리!</small>'}</section>`;
}
function buildButtons(s,index,from,p,label='건설',action='upgrade'){
 const max=maxBuildLevel(s,p.id,index),options=[];
 for(let level=from+1;level<=max;level++){
  const cost=upgradeCost(index,from,level),allowed=p.cash>=cost;
  options.push(button(action,`${level===4?'🏰':'🏗️'} ${LEVEL_NAMES[level]}${level>from+1?`까지`:''} · ${formatM(cost)}`,'mm-primary',!allowed||inFlight||!!scene||p.ai||(!!onlineRoom&&p.id!==SID),`data-index="${index}" data-level="${level}"`));
 }
 return options.join('');
}
function marbleCatResult(s){
 const me=s.players.find(x=>!x.ai)||s.players[0];
 const cat=s.players.find(x=>x.ai)||s.players.find(x=>x.id==='moyeo-cat');
 const stats=[
  {label:'고양이 AI 난이도',value:({beginner:'초급',intermediate:'중급',advanced:'고급'})[aiDifficulty]||'미설정'},
  {label:'진행 라운드',value:s.round+'라운드'},
  {label:'내 소유 도시',value:Object.values(s.properties||{}).filter(p=>p.owner===me?.id).length+'개'},
  {label:'고양이 소유 도시',value:Object.values(s.properties||{}).filter(p=>p.owner===cat?.id).length+'개'}];
 return window.MoyeoCatResult.render({game:'모여마블',
  outcome:s.winner===cat?.id?'cat':s.winner===me?.id?'player':'draw',
  summary:s.reason||'경기가 종료되었습니다.',
  score:{player:formatM(netWorth(s,me.id)),cat:formatM(netWorth(s,cat.id))},
  stats,
  actions:button('rematch','↻ 다시 대결하기','mm-primary')+button('leave','다른 게임 선택','mm-secondary')
 });
}
function saleChoices(s,p){
 const owned=Object.entries(s.properties).filter(([idx,v])=>v.owner===p.id).map(([idx,v])=>({i:Number(idx),v}));
 if(!owned.length)return '<p class="mm-helper">매각할 부동산이 없습니다.</p>';
 return '<div class="mm-sale-grid">'+owned.map(({i,v})=>{
  const t=TILES[i],cash=saleValue(s,i);
  return '<button type="button" class="mm-sale-option" data-action="sellProperty" data-index="'+i+'" '+(inFlight||!!scene?'disabled':'')+'>'+
   '<span class="mm-sale-name">'+t.emoji+' '+escapeHTML(t.name)+' <small>'+escapeHTML(LEVEL_NAMES[v.level]||'토지')+'</small></span>'+
   '<span class="mm-sale-price">매각 +'+formatM(cash)+'</span></button>';
 }).join('')+'</div>';
}
function liquidationPopup(s){
 const p=current(s),debt=s.pending||{},difference=Math.max(0,(debt.amount||0)-p.cash);
 const total=Object.entries(s.properties).filter(([i,v])=>v.owner===p.id).reduce((sum,[i])=>sum+saleValue(s,Number(i)),0);
 return '<div class="mm-liquidation-overlay" role="dialog" aria-modal="true" aria-label="매각할 부동산 선택"><section class="mm-liquidation-dialog">'+
  '<span class="mm-eyebrow">EMERGENCY · 자산 매각</span><h2>결제 자금이 부족해요!</h2>'+
  '<div class="mm-liquidation-amounts"><span>납부액 <b>'+formatM(debt.amount||0)+'</b></span><span>현재 현금 <b>'+formatM(p.cash)+'</b></span><span>부족 <b>'+formatM(difference)+'</b></span></div>'+
  '<p>어떤 부동산을 매각할지 선택하세요. 매각가는 현재 가치의 70%이며, 납부액이 모이면 자동 결제됩니다.'+
  (total<difference?' 모든 부동산을 팔아도 부족하면 파산할 수 있습니다.':'')+'</p>'+
  saleChoices(s,p)+(!p.loanUsed?'<div class="mm-liquidation-loan">'+button('takeLoan','🏦 은행 대출 +'+formatM(BANK_LOAN)+' (상환 '+formatM(BANK_REPAY)+')','mm-neutral',inFlight||!!scene)+'</div>':'')+'</section></div>';
}
function marbleIntroMarkup(){
 return '<div class="mm-intro-overlay" role="dialog" aria-modal="true" aria-label="모여마블 게임 시작 연출">'+
  '<div class="mm-intro-card"><div class="mm-intro-sparkles" aria-hidden="true">✦ ✧ ✦</div>'+
  '<span class="mm-intro-kicker">MOYEO MARBLE · LET THE GAME BEGIN</span>'+
  '<div class="mm-intro-city" aria-hidden="true"><span>🏠</span><span>🏙️</span><span>🏰</span></div>'+
  '<h2>도시의 주인이 되어 볼까요?</h2><p>주사위를 굴리고 도시를 모으세요!</p>'+
  '<div class="mm-intro-pawns" aria-hidden="true"><span>🐰</span><span>🐱</span><span>🐻</span><span>🦊</span></div>'+
  '<div class="mm-intro-progress" aria-hidden="true"><span></span></div>'+
  '<button type="button" data-action="skipIntro" class="mm-intro-skip">바로 시작하기 →</button></div></div>';
}
function finishMarbleIntro(){
 clearTimeout(introTimer);introTimer=null;
 if(!introActive)return;
 introActive=false;render();queueCat();
}
function beginMarbleIntro(){
 clearTimeout(introTimer);introActive=true;sellPanelOpen=false;
 introTimer=setTimeout(finishMarbleIntro,reducedMotion||!effectsOn?700:2700);
}
// Shared choice actions are presented in a viewport dialog; gameplay remains owned by the engine.
function hasHumanDecision(s){
 const p=current(s),kind=s.pending?.kind;
 return !introActive&&!scene&&s.phase!=='finished'&&!p.ai&&(!onlineRoom||p.id===SID)&&
   (s.phase==='chance'||(s.phase==='choice'&&['purchase','upgrade','takeover','olympic','startBuild'].includes(kind)));
}
function decisionModal(s){
 if(!hasHumanDecision(s))return '';
 const p=current(s),kind=s.pending?.kind||'chance',index=s.pending?.index,t=TILES[index],held=s.properties[index];
 const isCity=Boolean(t&&['city','tourist'].includes(t.kind));
 const emoji=kind==='purchase'?t?.emoji:kind==='upgrade'?'🏗️':kind==='takeover'?'⚔️':kind==='olympic'?'🏅':kind==='startBuild'?'🏠':'💌';
 const title=isCity?escapeHTML(t.name):kind==='olympic'?'올림픽 개최':kind==='startBuild'?'출발지 특별 건설':'행운 편지';
 const category=kind==='purchase'?'NEW PROPERTY':kind==='upgrade'?'BUILD YOUR CITY':kind==='takeover'?'TAKEOVER':kind==='olympic'?'CITY BONUS':kind==='startBuild'?'FREE BUILD CHANCE':'LUCKY CARD';
 const stats=isCity?'<div class="mm-decision-details">'+
  '<span>토지 가격<strong>'+formatM(t.price)+'</strong></span>'+
  '<span>현재 통행료<strong>'+(held?formatM(toll(s,index)):'미소유')+'</strong></span>'+
  '<span>내 현금<strong>'+formatM(p.cash)+'</strong></span></div>':
  '<div class="mm-decision-details"><span>현재 플레이어<strong>'+escapeHTML(p.name)+'</strong></span><span>보유 현금<strong>'+formatM(p.cash)+'</strong></span></div>';
 return '<div class="mm-decision-overlay" role="dialog" aria-modal="true" aria-label="게임 행동 선택">'+
  '<section class="mm-decision-dialog" aria-labelledby="mmDecisionTitle"><div class="mm-decision-hero">'+
  '<span class="mm-decision-kicker">'+category+' · 선택할 차례</span><div class="mm-decision-art" aria-hidden="true"><span class="mm-decision-spark mm-spark-a">✦</span><span class="mm-decision-art-inner">'+(emoji||'🏡')+'</span><span class="mm-decision-spark mm-spark-b">✧</span></div>'+
  '<h2 id="mmDecisionTitle">'+title+'</h2><span class="mm-decision-subtitle">'+(kind==='purchase'?'이 지역을 소유할까요?':kind==='chance'?'카드 한 장을 선택하세요.':'다음 행동을 결정하세요.')+'</span></div>'+
  stats+'<div class="mm-decision-actions">'+actionPanel(s)+'</div>'+
  (!p.loanUsed?'<div class="mm-decision-loan">'+button('takeLoan','🏦 은행 대출 '+formatM(BANK_LOAN)+' (상환 '+formatM(BANK_REPAY)+')','mm-neutral',inFlight||!!scene)+'</div>':'')+
  '</section></div>';
}
function actionPanel(s){
 const p=current(s),yourTurn=(onlineRoom?p.id===SID:!p.ai)&&!scene;
 if(s.phase==='liquidation')return '<div class="mm-status-line">💵 결제 자금 부족</div><p class="mm-status-sub">화면 중앙에서 매각할 부동산을 선택하세요.</p>';
 if(s.phase==='finished'){
  const ranking=winnerRanking(s),winner=s.players.find(x=>x.id===s.winner);
  if(catChallenge&&window.MoyeoCatResult?.render){
   return '<div class="mm-result"><h2>경기 종료</h2><p>경기 결과를 확인하거나 결과창을 닫고 게임판을 살펴보세요.</p></div>';
  }
  return `<div class="mm-result"><span class="mm-result-emoji">🏆</span><h2>${escapeHTML(winner?.name||'승자')} 승리!</h2><p>${escapeHTML(s.reason||'게임 종료')}</p><div class="mm-result-rank">${ranking.map((x,i)=>`<div><span>${i+1}위 ${escapeHTML(x.name)}</span><span>${formatM(netWorth(s,x.id))}</span></div>`).join('')}</div><div class="mm-center-actions">${onlineRoom?onlineRoom.host===SID?button('startOnline','다시 대결하기','mm-primary'):button('leave','메인으로','mm-secondary'):button('rematch','다시 대결하기','mm-primary')}${button('leave','종료','mm-secondary')}</div></div>`;
 }
 if(s.phase==='chance')return `<div class="mm-status-line">💌 행운 편지 도착!</div><p class="mm-status-sub">카드 뒷면 3장 중 하나를 선택하세요. 이득일 수도, 손해일 수도 있어요!</p><div class="mm-fortune-picks">${[0,1,2].map(i=>`<button class="mm-fortune-card" type="button" data-action="pickCard" data-index="${i}" ${!yourTurn||inFlight?'disabled':''}><span>✦</span><strong>행운 ${i+1}</strong><small>뒤집기</small></button>`).join('')}</div>`;
 if(s.phase==='roll'){
  const can=yourTurn&&!inFlight,remaining=p.parityUses??0;
  return `<div class="mm-status-line">${escapeHTML(p.name)}님의 차례</div><p class="mm-status-sub">🎲 주사위 두 개를 굴려 도시에 도착하세요!${s.doubles?' 더블 '+s.doubles+'연속':''}</p><div class="mm-center-actions">${button('roll','🎲 주사위 굴리기','mm-primary',!can)}${remaining?button('rollOdd',`홀수 · ${remaining}회 남음`,'mm-neutral',!can)+button('rollEven',`짝수 · ${remaining}회 남음`,'mm-neutral',!can):''}</div>`;
 }
 if(s.phase==='island'){
  return `<div class="mm-status-line">🏝️ 무인도 탈출 도전!</div><p class="mm-status-sub">${escapeHTML(p.name)}님 · 남은 최대 ${p.stuck}차례. 더블을 굴리거나 보석금을 내면 탈출할 수 있어요.</p><div class="mm-center-actions">${button('islandRoll','🎲 더블 도전 · 무료','mm-primary',!yourTurn||inFlight)}${button('payBail',`💎 보석금 ${BAIL_COST}M`,'mm-neutral',!yourTurn||inFlight||p.cash<BAIL_COST)}${button('pass','⏩ 한 차례 쉬기','mm-neutral',!yourTurn||inFlight)}</div>`;
 }
 if(s.phase==='travel')return `<div class="mm-status-line">✈️ 세계여행 출발!</div><p class="mm-status-sub">${escapeHTML(p.name)}님, 다음 차례가 되었어요. 원하는 지역을 선택해 바로 이동합니다.</p><div class="mm-center-actions">${button('travelBest','🎯 투자 추천 지역으로 이동','mm-primary',!yourTurn||inFlight)}</div>`;
 const {kind,index}=s.pending||{},t=TILES[index],v=s.properties[index];
 if(kind==='purchase'){
  const buildOptions=t.kind==='city'?[0,1,2,3]:[0];
  const purchaseButtons=buildOptions.map(level=>{
   const total=t.price+(level?upgradeCost(index,0,level):0);
   const caption=level===0?'🏳 토지만 구매':'🏗️ '+LEVEL_NAMES[level]+'까지 건설';
   return button('buy',caption+' · '+formatM(total),level===1?'mm-primary':'mm-neutral',!yourTurn||inFlight||p.cash<total,`data-level="${level}"`);
  }).join('');
  return `<div class="mm-status-line">${t.kind==='tourist'?'🏖️ 관광지':'🏘️ 도시'} 구매 · ${escapeHTML(t.name)}</div><p class="mm-status-sub">${t.kind==='tourist'?'관광지는 건설·인수가 불가능하며, 두 곳을 모두 소유해도 즉시 승리하지 않습니다.':'첫 턴부터 별장·빌딩·호텔까지 비용을 내고 건설할 수 있어요. 랜드마크는 호텔을 지은 후 가능해요.'}</p><div class="mm-center-actions">${purchaseButtons}${button('pass','건너뛰기','mm-neutral',!yourTurn||inFlight)}</div>`;
 }
 if(kind==='upgrade'){
  const max=maxBuildLevel(s,p.id,index);
  return `<div class="mm-status-line">🏗️ ${escapeHTML(t.name)} 건설</div><p class="mm-status-sub">현재 ${LEVEL_NAMES[v.level]} · 첫 턴부터 건설 가능 · 최고 단계 ${LEVEL_NAMES[max]}. 건설 단계를 선택하세요.</p><div class="mm-center-actions">${buildButtons(s,index,v.level,p)}${button('pass','건설하지 않기','mm-neutral',!yourTurn||inFlight)}</div>`;
 }
 if(kind==='takeover'){
  const price=propertyValue(index,v.level)*2,owner=s.players.find(x=>x.id===v.owner);
  const max=maxBuildLevel(s,p.id,index);const plus=v.level<max?upgradeCost(index,v.level,v.level+1):0;
  return `<div class="mm-status-line">⚔️ ${escapeHTML(t.name)} 인수 기회!</div><p class="mm-status-sub">${escapeHTML(owner?.name||'상대')}님 도시의 통행료는 이미 지불했어요. 토지와 건물의 현재 가치 ${formatM(propertyValue(index,v.level))} × 2 = 인수가 ${formatM(price)}. 상대방은 인수비를 받습니다.</p><div class="mm-center-actions">${button('takeover',`⚔️ 인수하기 · ${formatM(price)}`,'mm-primary',!yourTurn||inFlight||p.cash<price,`data-level="${v.level}"`)}${plus?button('takeover',`🏗️ 인수 + 건설 · ${formatM(price+plus)}`,'mm-neutral',!yourTurn||inFlight||p.cash<price+plus,`data-level="${v.level+1}"`):''}${button('pass','인수 포기','mm-neutral',!yourTurn||inFlight)}</div>`;
 }
 if(kind==='olympic'||kind==='startBuild'){
  const list=Object.entries(s.properties).map(([idx,held])=>({i:+idx,held,t:TILES[+idx]})).filter(({i,held,t})=>held.owner===p.id&&(kind==='olympic'?(s.olympics[i]||1)<5:t.kind==='city'&&held.level<maxBuildLevel(s,p.id,i)));
  const choices=list.map(({i,held,t})=>{const level=held.level+1,cost=kind==='olympic'?olympicCost(s,i):upgradeCost(i,held.level,level);
   const text=kind==='olympic'?`🏅 ${escapeHTML(t.name)} ${s.olympics[i]||1}×→${(s.olympics[i]||1)+1}× · ${formatM(cost)}`:`🏗️ ${escapeHTML(t.name)} ${LEVEL_NAMES[level]} · ${formatM(cost)}`;
   return button(kind==='olympic'?'olympic':'startBuild',text,'mm-neutral',!yourTurn||inFlight||p.cash<cost,`data-index="${i}" data-level="${level}"`);
  }).join('');
  return `<div class="mm-status-line">${kind==='olympic'?'🏅 올림픽 개최!':'🚩 출발지 특별 건설!'}</div><p class="mm-status-sub">${kind==='olympic'?'내 도시 한 곳의 통행료를 최대 5배로 높일 수 있어요.':'출발지에 정확히 도착했으니 내 도시 한 곳에 건설할 수 있어요.'}</p><div class="mm-center-actions mm-choice-scroll">${choices}${button('pass','건너뛰기','mm-neutral',!yourTurn||inFlight)}</div>`;
 }
 return `<div class="mm-status-line">선택을 진행해주세요.</div>${button('pass','다음으로','mm-primary',!yourTurn||inFlight)}`;
}
function sidePanel(s){
 const p=current(s),endless=s.maxRounds===0,turns=endless?0:s.maxRounds*s.players.length;
 const canSell=s.phase!=='finished'&&s.phase!=='liquidation'&&(!onlineRoom||p.id===SID)&&!p.ai&&Object.values(s.properties).some(v=>v.owner===p.id);
 const salePanel=canSell?'<section class="mm-card mm-sell-panel"><h2 class="mm-card-title">💵 내 부동산</h2>'+
  '<p class="mm-helper">현금이 필요할 때 원하는 도시를 직접 매각할 수 있어요. 매각가: 부동산 가치의 70%</p>'+
  button('toggleSellPanel',sellPanelOpen?'매각 목록 접기':'매각할 도시 선택','mm-neutral',inFlight||!!scene)+
  (sellPanelOpen?saleChoices(s,p):'')+'</section>':'';

 const showTimers=onlineRoom && s.phase!=='finished';
 return `<aside class="mm-sidebar"><section class="mm-card"><h2 class="mm-card-title">👑 플레이어 현황 <small>${s.players.length}명</small></h2>${s.players.map((x,i)=>`<div class="mm-player ${p.id===x.id&&s.phase!=='finished'?'current':''} ${x.bankrupt?'bankrupt':''}"><span class="mm-avatar" style="--pcolor:${paint[i]}">${characterArt(i)}</span><div class="mm-player-info"><strong>${escapeHTML(x.name)}${x.ai?' · AI':''}${p.id===x.id&&s.phase!=='finished'?'<em class="mm-player-turn">현재 턴</em>':''}</strong><small>부동산 ${Object.values(s.properties).filter(z=>z.owner===x.id).length}개 · 컬러 ${countMonopolies(s,x.id)}세트 · 🪽${x.angel||0} 🎟️${x.discountCards||0}${x.bankDebt?` · 빚 ${formatM(x.bankDebt)}`:''}</small></div><span class="mm-money">${formatM(x.cash)}<small><br>자산 ${formatM(netWorth(s,x.id))}</small></span></div>`).join('')}${endless?`<div class="mm-endless-progress">♾️ 파산까지 계속 · ${s.round}라운드 진행 · 생존 ${s.players.filter(x=>!x.bankrupt).length}명</div>`:`<div class="mm-progress"><div class="mm-progress-fill" style="width:${Math.min(100,Math.round(s.turnCount/turns*100))}%"></div></div><div class="mm-progress-label"><span>${s.round} / ${s.maxRounds}라운드</span><span>${Math.min(turns,s.turnCount)}/${turns}턴</span></div>`}${showTimers?`<p style="text-align:center;margin:10px 0 0"><span class="mm-clock" data-clock>⏳ 30초</span></p>`:''}</section>
 ${salePanel}${cityInspector(s)}<section class="mm-card mm-events-card"><h2 class="mm-card-title">📣 최근 행동 <small>상세 기록 펼치기</small></h2><div class="mm-action-ribbon">${recentAction(s)}</div><div class="mm-event-list">${(s.events||[]).slice(0,4).map((ev,j)=>`<div class="mm-event ${ev.ai?'is-cat':''} ${j===0?'new':''}" style="--event-color:${ownerColor(s,ev.actor)}"><span class="mm-event-icon">${ownerAvatar(s,ev.actor)}</span><div><strong>${escapeHTML(ev.message)}</strong>${ev.moneyChanges.length?`<small>${ev.moneyChanges.map(m=>`${escapeHTML(m.name)} ${fmtDelta(m.delta)}`).join(' · ')}</small>`:''}${ev.thought?`<small class="mm-event-thought">💭 ${escapeHTML(ev.thought)}</small>`:''}</div></div>`).join('')||'<p class="mm-helper">첫 행동을 기다리고 있어요.</p>'}</div><details class="mm-raw-history"><summary>전체 세부 기록 보기</summary><div class="mm-log-list">${s.log.slice(0,24).map(e=>`<div class="mm-log">${escapeHTML(e.text)}</div>`).join('')}</div></details></section>
 ${tutorialOn?`<section class="mm-card mm-tutorial-game"><h2 class="mm-card-title">💡 초보자 도움말</h2><p>① 주사위를 굴려 도시를 찾아가요.</p><p>② 도시는 현금이 부족해지지 않게 구매·건설하세요.</p><p>③ 다른 플레이어의 도시에 도착하면 통행료를 지불해요.</p><p>④ 시작 화면에서 도움말을 끌 수 있어요.</p></section>`:''}<section class="mm-card"><h2 class="mm-card-title">✨ 승리 팁</h2><div class="mm-helper">${s.maxRounds===0?'♾️ 무한모드는 독점해도 승리하지 않아요. 마지막 한 명만 남으면 끝!':'컬러 독점은 통행료 2배! 관광지 2곳 소유는 즉시 승리하지 않습니다.<br>컬러 3세트 또는 한 면의 도시를 모두 소유하면 승리합니다.'}<br>랜드마크와 관광지는 인수 불가. 무인도는 더블/보석금으로 탈출!</div>${onlineRoom?`<div style="margin-top:12px">${button('copyInvite','🔗 방 링크 복사','mm-neutral')}</div>`:''}</section></aside>`;
}
function renderGame(s){
 const p=current(s);
 const rolls=s.lastRoll||lastDice;
 const [a,b]=rolls?[rolls.a,rolls.b]:[1,6];
 const decision=hasHumanDecision(s);
 const waiting=(!onlineRoom&&p.ai)||(onlineRoom&&p.id!==SID);
 const actionContent=decision?'<div class="mm-stage-waiting"><strong>✨ 선택할 시간이야!</strong><small>화면에 뜬 행동 카드에서 매입·건설 여부를 골라 주세요.</small></div>':
  waiting&&['choice','chance'].includes(s.phase)?'<div class="mm-stage-waiting"><strong>⏳ '+escapeHTML(p.name)+'님의 선택을 기다리는 중</strong><small>다음 행동이 정해지면 게임이 계속됩니다.</small></div>':
  actionPanel(s);
 const loan=!p.loanUsed&&s.phase!=='finished'&&s.phase!=='liquidation'&&!decision&&!p.ai&&(!onlineRoom||p.id===SID)?
  '<div class="mm-bank-loan">'+button('takeLoan','🏦 은행 대출 +'+formatM(BANK_LOAN)+' (향후 '+formatM(BANK_REPAY)+' 상환)','mm-neutral',inFlight||!!scene)+'</div>':'';
 root.innerHTML=`<div class="mm-topgame"><div><span class="mm-eyebrow">MOYEO MARBLE · ${onlineRoom?'ONLINE MATCH':mode==='ai'?'CAT CHALLENGE':'LOCAL MATCH'}</span><h1>모여마블 <span style="font-size:14px;color:#a99dab">${s.maxRounds===0?`♾️ 무한 · ${s.round}라운드`:`${s.round}/${s.maxRounds} 라운드`}</span></h1><p>${onlineRoom?`방 코드 ${onlineRoom.code} · 모든 주사위는 서버에서 판정`:mode==='ai'?'고양이 AI와 1:1 대결 중':'한 화면에서 돌아가며 플레이 중'}</p></div><div style="display:flex;gap:7px;align-items:center"><span class="mm-salary-chip" title="출발지를 한 바퀴 통과할 때마다 보너스 지급. 대출이 있으면 우선 상환합니다.">🚩 한 바퀴 <strong>+${formatM(PASS_BONUS)}</strong></span><span class="mm-indicator">● ${onlineRoom?'온라인 연결':'플레이 중'}</span>${button('toggleEffects',effectsOn?'✨ 연출 켜짐':'✨ 연출 꺼짐','mm-neutral')}${button('leave','↩ 나가기','mm-neutral')}</div></div>
 <div class="mm-owner-legend" aria-label="플레이어별 소유 건물 색상">${s.players.map((x,i)=>`<div class="mm-owner-key" style="--key-color:${paint[i]}"><span>${characterArt(i)}</span><strong>${escapeHTML(x.name)}</strong><small>소유 도시 ${Object.values(s.properties).filter(z=>z.owner===x.id).length}개</small></div>`).join('')}</div>
 <div class="mm-gamewrap"><div class="mm-main-panel"><section class="mm-board-frame"><div class="mm-board">${TILES.map((t,i)=>renderTile(s,t,i)).join('')}${scenePawnMarkup(s)}
 <section class="mm-board-center mm-play-stage"><div class="mm-stage-skyline" aria-hidden="true"><span class="mm-sky-b mm-sky-a"></span><span class="mm-sky-b mm-sky-b2"></span><span class="mm-sky-b mm-sky-c"></span><span class="mm-sky-b mm-sky-d"></span><span class="mm-sky-b mm-sky-e"></span><span class="mm-sky-b mm-sky-f"></span></div><div class="mm-stage-heading"><span class="mm-center-kicker">✦ DREAM · OWN · WIN ✦</span><h2 class="mm-center-title">모여<span>마블</span></h2><p class="mm-center-sub">${s.phase==='roll'?'주사위를 굴려 보세요':s.phase==='finished'?'경기가 끝났어요':'다음 행동을 선택하세요'}</p><div class="mm-turn-badge" style="--turn-color:${ownerColor(s,p.id)}"><span class="mm-turn-avatar">${ownerAvatar(s,p.id)}</span><strong>${escapeHTML(p.name)}</strong><span class="mm-turn-badge-note">${s.phase==='finished'?'경기 종료':'현재 차례'}</span></div></div>
 ${s.phase==='finished'?'<div class="mm-stage-finished">'+actionContent+'</div>':`<div class="mm-dice-console"><div class="mm-dice-tower"><span class="mm-dice-flourish" aria-hidden="true">✦</span><small>${rolls?'최근 주사위':'주사위 준비'}</small><div class="mm-dice-row"><span class="mm-die ${scene?.stage==='dice'?'mm-die-rolling':''}">${dice[scene?.event.dice?.a||a]}</span><span class="mm-die ${scene?.stage==='dice'?'mm-die-rolling':''}">${dice[scene?.event.dice?.b||b]}</span></div>${rolls?'<strong>합계 '+rolls.total+'</strong>':'<strong>행운을 빌어요!</strong>'}</div><div class="mm-stage-actions">${actionContent}</div></div>`}
 ${sceneMarkup(s)}${loan}<span class="mm-center-tip">🌷 행운은 짧게, 전략은 길게!</span></section></div></section>
 ${s.phase==='travel'&&!p.ai&&(!onlineRoom||p.id===SID)?`<section class="mm-option-panel"><h3 class="mm-option-title">✈️ 여행할 도시를 선택해주세요</h3><div class="mm-travel-grid">${TILES.map((t,i)=>({t,i})).filter(z=>['city','tourist','start','olympic'].includes(z.t.kind)).map(({t,i})=>`<button data-land="${i}">${t.emoji} ${escapeHTML(t.name)}</button>`).join('')}</div></section>`:''}</div>${sidePanel(s)}</div>`;
}
function render(){
 root.dataset.effects=effectsOn?'on':'off';
 const s=getState();if(s)consumeEvents(s);
 if(onlineRoom){if(!onlineRoom.state)renderWaiting();else renderGame(onlineRoom.state);}else if(localGame)renderGame(localGame);else renderLobby();
 if(introActive&&s&&s.phase!=='finished')root.insertAdjacentHTML('beforeend',marbleIntroMarkup());
 if(s?.phase==='liquidation'&&(!onlineRoom||current(s).id===SID)&&!introActive)
  root.insertAdjacentHTML('beforeend',liquidationPopup(s));
 const showDecision=Boolean(s&&hasHumanDecision(s));
 if(showDecision){
  root.insertAdjacentHTML('beforeend',decisionModal(s));
  root.querySelector('.mm-decision-actions .mm-btn:not(:disabled),.mm-decision-actions .mm-fortune-card:not(:disabled)')?.focus({preventScroll:true});
 }
 document.body.classList.toggle('mm-decision-open',showDecision);
 updateClock();
 const showCatResult=catChallenge&&mode==='ai'&&s?.phase==='finished'&&!s.catResultDismissed&&window.MoyeoCatResult?.overlay;
 if(showCatResult){
  root.insertAdjacentHTML('beforeend',window.MoyeoCatResult.overlay(marbleCatResult(s)));
  root.querySelector('.cat-result-close')?.focus({preventScroll:true});
 }
 document.body.classList.toggle('cat-result-open',Boolean(showCatResult));
}
function consumeEvents(s){
 if((s.actionSeq||0)<seenActionSeq){seenActionSeq=0;sceneQueue=[];clearTimeout(sceneTimer);scene=null;}
 const events=(s.events||[]).filter(ev=>ev.seq>seenActionSeq).sort((a,b)=>a.seq-b.seq);
 if(events.length){seenActionSeq=events.at(-1).seq;sceneQueue.push(...events);if(!scene)beginScene();}
}
function beginScene(){
 if(scene||!sceneQueue.length)return;
 const ev=sceneQueue.shift();scene={event:ev,stage:ev.dice?'dice':'outcome',position:ev.from};
 clearTimeout(sceneTimer);
 if(ev.dice && ev.from!==ev.to && !ev.travel && ev.to===(ev.from+ev.dice.total)%24){
  sceneTimer=setTimeout(()=>{if(!scene||scene.event.seq!==ev.seq)return;scene.stage='move';scene.position=ev.from;paintScene();stepScene(0);},effectsOn&&!reducedMotion?380:30);
 }else sceneTimer=setTimeout(()=>{if(scene?.event.seq===ev.seq)finishScene();},effectsOn&&!reducedMotion?1100:90);
}
function stepScene(step){
 if(!scene)return;
 const ev=scene.event;
 const count=Math.min(24,ev.dice?.total||0);
 if(step>=count){scene.position=ev.to;scene.stage='outcome';render();paintScene();sceneTimer=setTimeout(finishScene,effectsOn&&!reducedMotion?1050:60);return;}
 scene.position=(ev.from+step+1)%24;paintScene();
 sceneTimer=setTimeout(()=>stepScene(step+1),moveDelay());
}
function paintScene(){
 const ev=scene?.event;if(!ev)return;
 const face=document.querySelector('[data-replay-pawn]');
 if(face){const [r,c]=tilePos(scene.position);face.style.top=`${((r-.5)/7)*100}%`;face.style.left=`${((c-.5)/7)*100}%`;}
 document.querySelectorAll('.mm-tile').forEach(el=>{el.classList.toggle('mm-path-active',Number(el.dataset.tileIndex)===scene.position);});
 const card=document.querySelector('.mm-scene-card');
 if(card){card.classList.toggle('is-outcome',scene.stage==='outcome');const title=card.querySelector('strong');if(title)title.textContent=scene.stage==='dice'&&ev.dice?`주사위 ${ev.dice.a} + ${ev.dice.b} = ${ev.dice.total}`:scene.stage==='move'?`${TILES[scene.position]?.name||'도시'}로 달려가는 중!`:ev.message;}
}
function finishScene(){
 if(!scene)return;
 clearTimeout(sceneTimer);scene=null;
 if(sceneQueue.length){beginScene();render();return;}
 render();queueCat();
}
function resetScenes(){clearTimeout(sceneTimer);scene=null;sceneQueue=[];seenActionSeq=0;}

function persistNick(){const input=document.querySelector('#mmNick');if(input){nick=(input.value||'말랑감자').trim().slice(0,14)||'말랑감자';localStorage.setItem('moyeo-nick',nick);}}
async function startLocal(){if(mode==='local'&&!(await ensureMember()))return;if(mode==='ai')persistNick();const players=[{id:SID,name:nick}];
 if(mode==='ai')players.push({id:'moyeo-cat',name:'고양이',ai:true});
 else for(let i=1;i<people;i++)players.push({id:`local-${i}`,name:`플레이어 ${i+1}`});
 resetScenes();inspectedCity=null;localGame=createGame({players,maxRounds:roundsForGame()});onlineRoom=null;lastDice=null;beginMarbleIntro();render();queueCat();}
function queueCat(){clearTimeout(aiTimer);if(introActive||onlineRoom||!localGame||localGame.phase==='finished')return;
 const p=current(localGame);if(!p.ai||scene||sceneQueue.length)return;
 aiTimer=setTimeout(()=>{if(!localGame||!current(localGame).ai)return;const action=chooseCatAction(localGame,aiDifficulty);if(action)executeAction(action.type,action.payload||{},catThought(localGame,action));},effectsOn&&!reducedMotion?520:120);
}
function executeAction(type,payload={},thought=''){
 if(inFlight||scene)return;
 if(onlineRoom){const s=onlineRoom.state;if(!s||current(s).id!==SID)return;inFlight=true;post(`/api/marble/rooms/${onlineRoom.code}/action`,{sid:SID,type,payload}).then(data=>{updateOnlineRoom(data);}).catch(error=>toast(error.message)).finally(()=>{inFlight=false;render();});return;}
 if(!localGame)return;
 try{const before=localGame;localGame=applyAction(localGame,current(localGame).id,type,payload);lastDice=localGame.lastRoll||lastDice;
  if(thought&&localGame.lastEvent){localGame.lastEvent.thought=thought;localGame.events[0].thought=thought;}
  render();queueCat();}catch(error){toast(error.message);}
}
async function post(url,data){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const json=await res.json();if(!res.ok)throw Error(json.error||'요청 실패');return json;}
async function get(url){const res=await fetch(url);const json=await res.json();if(!res.ok)throw Error(json.error||'요청 실패');return json;}
function updateOnlineRoom(data){
 const previouslyStarted=Boolean(onlineRoom?.state),nowStarted=Boolean(data.state);
 if(previouslyStarted&&!nowStarted)resetScenes();
 onlineRoom=data;clockOffset=data.now-Date.now();lastDice=data.state?.lastRoll||lastDice;
 if(!previouslyStarted&&nowStarted)beginMarbleIntro();
 render();
}
function connectSSE(roomCode){stream?.close();stream=new EventSource(`/api/marble/rooms/${roomCode}/events?sid=${encodeURIComponent(SID)}`);
 stream.addEventListener('state',e=>{try{const data=JSON.parse(e.data);if(data.code!==onlineRoom?.code)return;updateOnlineRoom(data);}catch(error){console.error('온라인 상태 수신 오류',error);}});
 stream.addEventListener('error',()=>{/* EventSource automatically reconnects. */});
}
async function createOnline(){if(!(await ensureMember()))return;inFlight=true;try{const r=await post('/api/marble/rooms',{sid:SID,name:nick,rounds:roundsForGame(),turnSeconds:seconds});resetScenes();localGame=null;lastDice=null;updateOnlineRoom(r);location.hash=`room=${r.code}`;connectSSE(r.code);}catch(error){toast(`온라인 방 생성 실패: ${error.message} · 서버 통합 설정을 확인해주세요.`);}finally{inFlight=false;}}
async function joinOnline(code){if(!(await ensureMember()))return;const id=(code||'').trim().toUpperCase();if(!/^[0-9A-F]{6}$/.test(id))return toast('6자리 초대 코드를 확인해주세요.');
 inFlight=true;try{let r=await post(`/api/marble/rooms/${id}/join`,{sid:SID,name:nick});resetScenes();localGame=null;lastDice=null;mode='online';updateOnlineRoom(r);location.hash=`room=${r.code}`;connectSSE(r.code);}catch(error){toast(error.message);if(!onlineRoom){location.hash='';render();}}finally{inFlight=false;}}
async function startOnline(){if(!onlineRoom||inFlight)return;if(!(await ensureMember()))return;inFlight=true;try{const data=await post(`/api/marble/rooms/${onlineRoom.code}/start`,{sid:SID});resetScenes();lastDice=null;updateOnlineRoom(data);}catch(error){toast(error.message);}finally{inFlight=false;}}
async function leave(){
 if(onlineRoom?.state?.phase!=='finished' && onlineRoom?.state && !window.confirm('온라인 게임에서 나가면 기권 처리됩니다. 나갈까요?'))return;
 clearTimeout(aiTimer);clearTimeout(introTimer);introActive=false;sellPanelOpen=false;resetScenes();stream?.close();stream=null;
 if(onlineRoom){
  try{await post(`/api/marble/rooms/${onlineRoom.code}/leave`,{sid:SID});}catch{}
 }
 localGame=null;onlineRoom=null;lastDice=null;inspectedCity=null;mode=catChallenge?'ai':'local';location.hash='';render();}
async function copyInvite(){const url=`${location.origin}${location.pathname}#room=${onlineRoom?.code||''}`;
 try{await navigator.clipboard.writeText(url);toast('초대 링크가 복사되었습니다!');}catch{toast('초대 코드: '+(onlineRoom?.code||''));}}
function updateClock(){const el=document.querySelector('[data-clock]');if(!el||!onlineRoom?.deadline)return;
 // Use the offset captured at the latest server sync, not a continuously recalculated offset.
 const second=Math.max(0,Math.ceil((onlineRoom.deadline-(Date.now()+clockOffset))/1000));
 el.textContent=`⏳ ${second}초`;el.classList.toggle('warn',second<=8);
}
setInterval(updateClock,1000);
root.addEventListener('click',async e=>{
 const pgModeBtn=e.target.closest('[data-pg-mode]');
 if(pgModeBtn){
  const value=pgModeBtn.dataset.pgMode;
  if(catChallenge?value!=='cat':!['online','local'].includes(value))return;
  if(mode==='ai')persistNick();
  mode=value==='cat'?'ai':value;render();return;
 }
 const pgDifficultyBtn=e.target.closest('[data-pg-difficulty]');
 if(pgDifficultyBtn){
  const value=pgDifficultyBtn.dataset.pgDifficulty;
  if(!catChallenge||mode!=='ai'||!['beginner','intermediate','advanced'].includes(value))return;
  persistNick();aiDifficulty=value;
  localStorage.setItem('moyeo-marble-ai-difficulty',value);render();return;
 }
 const pgSettingBtn=e.target.closest('[data-pg-setting]');
 if(pgSettingBtn){
  if(mode==='ai')persistNick();
  const key=pgSettingBtn.dataset.pgSetting,value=pgSettingBtn.dataset.pgValue;
  if(key==='gameMode'&&['normal','endless'].includes(value))gameMode=value;
  else if(key==='rounds'&&gameMode==='normal'&&ROUND_OPTIONS.includes(Number(value)))rounds=Number(value);
  else if(key==='seconds'&&mode==='online'&&[15,30,45].includes(Number(value)))seconds=Number(value);
  else if(key==='people'&&mode==='local'&&[2,3,4].includes(Number(value)))people=Number(value);
  else return;
  render();return;
 }
 const modeBtn=e.target.closest('[data-mode]');if(modeBtn){if((catChallenge&&modeBtn.dataset.mode!=='ai')||(!catChallenge&&modeBtn.dataset.mode==='ai'))return;if(mode==='ai')persistNick();mode=modeBtn.dataset.mode;render();return;}
 const gameModeBtn=e.target.closest('[data-game-mode]');if(gameModeBtn){if(mode==='ai')persistNick();gameMode=gameModeBtn.dataset.gameMode==='endless'?'endless':'normal';render();return;}
 const roundBtn=e.target.closest('[data-rounds]');if(roundBtn){if(mode==='ai')persistNick();const choice=Number(roundBtn.dataset.rounds);if(ROUND_OPTIONS.includes(choice)){rounds=choice;render();}return;}
 const land=e.target.closest('[data-land]');if(land){executeAction('travel',{index:Number(land.dataset.land)});return;}
 const inspect=e.target.closest('[data-inspect]');if(inspect){inspectedCity=Number(inspect.dataset.inspect);render();return;}
 const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
 if(action==='skipIntro'){finishMarbleIntro();return;}
 if(introActive)return;
 switch(action){
 case 'catResultDismiss':{const state=getState();if(state){state.catResultDismissed=true;render();}break;}
 case 'toggleSellPanel':sellPanelOpen=!sellPanelOpen;render();break;
 case 'sellProperty':executeAction('sellProperty',{index:Number(e.target.closest('[data-action]').dataset.index)});break;
 case 'marbleBack':location.href=catChallenge?'/?cat=1':'/';break;
 case 'startLocal':startLocal();break;
 case 'createOnline':await createOnline();break;
 case 'joinOnline':await joinOnline(document.querySelector('#mmJoinCode')?.value);break;
 case 'startOnline':await startOnline();break;
 case 'roll':case 'pass':case 'islandRoll':case 'payBail':case 'takeLoan':executeAction(action);break;
 case 'pickCard':executeAction('pickCard',{index:Number(e.target.closest('[data-action]').dataset.index)});break;
 case 'rollOdd':executeAction('roll',{parity:'odd'});break;
 case 'rollEven':executeAction('roll',{parity:'even'});break;
 case 'buy':case 'upgrade':case 'takeover':executeAction(action,{targetLevel:Number(e.target.closest('[data-action]').dataset.level)});break;
 case 'startBuild':executeAction('startBuild',{index:Number(e.target.closest('[data-action]').dataset.index),targetLevel:Number(e.target.closest('[data-action]').dataset.level)});break;
 case 'olympic':executeAction('olympic',{index:Number(e.target.closest('[data-action]').dataset.index)});break;
 case 'travelBest':{const s=getState();if(!s||s.phase!=='travel')break;const available=TILES.map((t,i)=>({t,i})).filter(({t,i})=>t.kind==='city'&&!s.properties[i]);const tourism=TILES.map((t,i)=>({t,i})).find(({t,i})=>t.kind==='tourist'&&!s.properties[i]&&TILES.some((x,j)=>x.kind==='tourist'&&j!==i&&s.properties[j]?.owner===current(s).id));const best=tourism?.i??available.sort((a,b)=>a.t.price-b.t.price)[0]?.i??0;executeAction('travel',{index:best});break;}
 case 'copyInvite':await copyInvite();break;
 case 'leave':await leave();break;
 case 'rematch':startLocal();break;
 case 'skipScene':finishScene();break;
 case 'toggleEffects':effectsOn=!effectsOn;localStorage.setItem('moyeo-marble-effects',effectsOn?'on':'off');if(scene)finishScene();else render();break;
 case 'toggleLobbyEffects':if(mode==='ai')persistNick();effectsOn=!effectsOn;localStorage.setItem('moyeo-marble-effects',effectsOn?'on':'off');render();break;
 case 'toggleTutorial':if(mode==='ai')persistNick();tutorialOn=!tutorialOn;localStorage.setItem('moyeo-marble-tutorial',tutorialOn?'on':'off');render();break;
 case 'closeInspector':inspectedCity=null;render();break;
 }
});
root.addEventListener('change',e=>{
 if(e.target.id==='mmSeconds')seconds=Number(e.target.value)||30;
 if(e.target.id==='mmPeople')people=Math.min(4,Math.max(2,Number(e.target.value)||2));
 if(e.target.id==='mmNick'&&mode==='ai')persistNick();
});
root.addEventListener('keydown',e=>{if(e.key==='Enter' && e.target.matches('[data-inspect]')){inspectedCity=Number(e.target.dataset.inspect);render();}if(e.key==='Enter' && e.target.matches('[data-land]')){e.preventDefault();executeAction('travel',{index:Number(e.target.dataset.land)});}if(e.key==='Enter' && e.target.id==='mmJoinCode'){e.preventDefault();joinOnline(e.target.value);}});
render();
const invite=location.hash.match(/room=([0-9a-f]{6})/i);if(invite&&!catChallenge){mode='online';joinOnline(invite[1]);}