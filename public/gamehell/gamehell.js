/* MOYEO GAME HELL · Standalone, original arcade collection.
   No dependencies, no imported art, no server-side changes required. */
const W=420,H=600, TAU=Math.PI*2;
const arcadeTrial=new URLSearchParams(location.search).get('trial')==='1';
const TRIAL_MODE_IDS=new Set(['drill','hurdle','chain']);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#arena'),ctx=canvas.getContext('2d',{alpha:false});
const storeKey=arcadeTrial?'moyeo-gamehell-trial-v1':'moyeo-gamehell-v1';
const modes=[
  {id:'drill',title:'낙하대작전',emoji:'💎',cat:'timing',desc:'안전한 바닥을 골라 드릴! 위험한 가시는 피해요.',hint:'세 칸 중 안전한 칸을 터치',tip:'보석 칸은 높은 점수, 가시 칸은 체력 감소!',color:'#ff9f82'},
  {id:'hurdle',title:'폴짝도로',emoji:'🐾',cat:'action',desc:'장애물을 넘고 점프 궤적에 놓인 별을 직접 먹는 달리기 게임!',hint:'터치로 점프 · 공중에서 한 번 더',tip:'장애물 바로 앞에서 점프하면 별이 점프 경로에 들어와요.',color:'#8fe3ff'},
  {id:'cloud',title:'구름사다리',emoji:'☁️',cat:'timing',desc:'움직이는 화살표를 구름에 맞춰 올라가요.',hint:'노란 화살표가 구름 아래일 때 터치',tip:'구름 가운데를 맞추면 퍼펙트 보너스!',color:'#c5abff'},
  {id:'flight',title:'로켓고양이',emoji:'🚀',cat:'timing',desc:'흔들리는 발사각을 맞춰 별 행성을 향해 발사!',hint:'화살표가 과녁을 향할 때 터치',tip:'발사선과 과녁이 겹칠 때 클릭하세요.',color:'#ffadce'},
  {id:'shooter',title:'별뿅대전',emoji:'🎯',cat:'action',desc:'화면 위에서 내려오는 몬스터를 톡톡 맞혀요.',hint:'몬스터를 직접 터치 · SPACE는 자동 조준',tip:'적이 화면 아래까지 오기 전에 터치!',color:'#ffe07d'},
  {id:'swim',title:'바다냥냥',emoji:'🐠',cat:'control',desc:'누르면 떠오르고 떼면 가라앉는 심해 탐험.',hint:'누르고 있으면 상승 · 놓으면 하강',tip:'길게 누르지 말고 짧게 나눠 누르면 편해요.',color:'#77eed4'},
  {id:'ice',title:'얼음지그재그',emoji:'🧊',cat:'control',desc:'빙판 위 고양이의 달리는 방향을 재빨리 바꿔요.',hint:'터치할 때마다 좌우 방향 반전',tip:'얼음벽에 닿기 전에 반대로 전환!',color:'#9de1ff'},
  {id:'orbit',title:'빙빙궤도',emoji:'🪐',cat:'timing',desc:'빙글 도는 고양이가 황금 구역에 닿으면 점프!',hint:'황금 원호에 도달하면 터치',tip:'빠를수록 점수가 늘어나요.',color:'#efb1fc'},
  {id:'dash',title:'번개질주',emoji:'⚡',cat:'action',desc:'세 갈래 길에서 가시를 피하며 별을 수집해요.',hint:'화면 왼쪽/오른쪽 터치로 차선 이동',tip:'방향키 ← →로도 차선을 바꿀 수 있어요.',color:'#ffe28a'},
  {id:'tower',title:'높이솟아',emoji:'🏔️',cat:'timing',desc:'힘을 모았다가 정확하게 점프해서 다음 탑으로!',hint:'길게 누른 다음 타이밍 맞춰 놓기',tip:'게이지 안쪽 황금 영역에서 손을 떼세요.',color:'#92e2d3'},
  {id:'slalom',title:'숲길슬라럼',emoji:'🌲',cat:'control',desc:'스키를 타고 나무 사이 안전한 길로 달려요.',hint:'터치할 때마다 좌우 차선 변경',tip:'나무가 아래에 내려오기 전에 미리 이동!',color:'#b5e6a3'},
  {id:'balloon',title:'풍선탈출',emoji:'🎈',cat:'control',desc:'바람을 피해 공중의 구름 사이를 유영해요.',hint:'누르고 상승 · 놓으면 서서히 하강',tip:'바람을 예측하면서 풍선 고도를 유지하세요.',color:'#ff9cbe'},
  {id:'chain',title:'찰싹친구들',emoji:'🧲',cat:'control',desc:'자동으로 움직이며 친구를 모으고, 꼬리에 부딪히지 않고 오래 버텨요.',hint:'터치 · SPACE = 회전 방향 바꾸기',tip:'친구를 모으면 꼬리가 길어져요. 벽과 자신의 꼬리를 피하세요!',color:'#ffc98f'}
].filter(m=>!arcadeTrial||TRIAL_MODE_IDS.has(m.id));
const labels={timing:'타이밍',action:'액션',control:'컨트롤'};
const skins=(Array.isArray(window.MOYEO_CHARACTERS)?window.MOYEO_CHARACTERS:[]).filter(c=>c&&typeof c.id==='string'&&/^[a-z0-9_-]+$/i.test(c.id)).map(c=>({...c,cost:Math.max(0,Math.floor(Number(c.price)||0)),color:c.color||'#ffbd78',image:c.image||'',rarity:c.rarity||'common',perk:c.perk||null}));
if(!skins.length)skins.push({id:'cheese',name:'치즈냥',cost:0,color:'#ffbd78',image:'./assets/characters/cheese.svg'});
const numbers=n=>Math.floor(n).toLocaleString('ko-KR');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
let save={best:{},plays:0,sound:true,coins:0,skin:'cheese',unlocked:['cheese'],totalEarned:0,stats:{hurdleStars:0,chainFriends:0,modesPlayed:[]},achievements:[]};
try{save={...save,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch{}
if(!save.best||typeof save.best!=='object')save.best={};
if(!Array.isArray(save.unlocked))save.unlocked=[skins[0].id];
save.unlocked=[...new Set([skins[0].id,...save.unlocked.filter(id=>skins.some(s=>s.id===id))])];
if(!skins.some(s=>s.id===save.skin&&save.unlocked.includes(s.id)))save.skin=skins[0].id;
save.coins=Math.max(0,Math.floor(Number(save.coins)||0));
save.totalEarned=Math.max(save.coins,Math.floor(Number(save.totalEarned)||0));
save.stats={hurdleStars:0,chainFriends:0,modesPlayed:[],...(save.stats||{})};
if(!Array.isArray(save.stats.modesPlayed))save.stats.modesPlayed=[];
if(!save.stats.modesPlayed.length)save.stats.modesPlayed=modes.filter(m=>Number(save.best[m.id])>0).map(m=>m.id);
if(!Array.isArray(save.achievements))save.achievements=[];
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(save))}catch{}}

const achievementDefs=[
  {id:'first',title:'첫 출발',desc:'미니게임 1회 플레이',goal:1,reward:10,progress:()=>save.plays},
  {id:'variety',title:'모여 탐험가',desc:'서로 다른 게임 5종 플레이',goal:5,reward:25,progress:()=>save.stats.modesPlayed.length},
  {id:'regular',title:'다시 한 판!',desc:'누적 10회 플레이',goal:10,reward:35,progress:()=>save.plays},
  {id:'stars',title:'점프 수집가',desc:'폴짝도로에서 별 10개 획득',goal:10,reward:25,progress:()=>save.stats.hurdleStars},
  {id:'friends',title:'친구가 좋아',desc:'찰싹친구들에서 친구 10명 합류',goal:10,reward:25,progress:()=>save.stats.chainFriends},
  {id:'collector',title:'캐릭터 컬렉터',desc:'캐릭터 3종 보유',goal:3,reward:30,progress:()=>save.unlocked.length},
];
function awardAchievements(){const won=[];for(const a of achievementDefs){if(!save.achievements.includes(a.id)&&a.progress()>=a.goal){save.achievements.push(a.id);save.coins+=a.reward;save.totalEarned+=a.reward;won.push(`${a.title} +${a.reward}★`)}}
  if(won.length&&typeof phase!=='undefined')toast(`업적 달성! ${won.join(', ')}`);return won;}
function renderAchievements(){const root=$('#achievementList');if(!root)return;$('#achievementCount').textContent=`${save.achievements.length} / ${achievementDefs.length}`;
  root.replaceChildren(...achievementDefs.map(a=>{const done=save.achievements.includes(a.id),progress=Math.min(a.goal,Number(a.progress())||0),el=document.createElement('div');el.className=`achievement-entry${done?' completed':''}`;
   const line=document.createElement('div');line.className='achievement-line';const title=document.createElement('strong');title.textContent=(done?'✓ ':'')+a.title;const reward=document.createElement('span');reward.textContent=done?'완료':`+${a.reward} ★`;line.append(title,reward);
   const subtitle=document.createElement('small');subtitle.textContent=`${a.desc} · ${progress}/${a.goal}`;
   const track=document.createElement('div');track.className='achievement-track';const bar=document.createElement('span');bar.style.width=`${Math.round(progress/a.goal*100)}%`;track.append(bar);el.append(line,subtitle,track);return el}));}

function currentCharacter(){return skins.find(s=>s.id===save.skin)||skins[0]}
function skinColor(){return currentCharacter().color}
const charImages=new Map();
function loadCharacterImage(character){if(!character.image)return null;if(charImages.has(character.id))return charImages.get(character.id);
  const img=new Image();const state={img,ready:false};charImages.set(character.id,state);
  img.onload=()=>{state.ready=true;renderSkins()};img.onerror=()=>{state.ready=false};img.src=character.image;return state;
}
function avatar(char,extraClass=''){
  const wrap=document.createElement('div');wrap.className=`character-avatar ${extraClass}`;
  wrap.style.setProperty('--avatar-color',char.color);
  const img=document.createElement('img');img.src=char.image||'./assets/characters/cheese.svg';img.alt='';img.loading='lazy';
  img.onerror=()=>{if(!img.src.includes('cheese.svg'))img.src='./assets/characters/cheese.svg'};
  wrap.append(img);return wrap;
}
let shopFilter='all';
function shopMessage(msg){$('#shopNotice').textContent=msg;$('#skinMessage').textContent=msg}
function buyOrEquip(id){const s=skins.find(s=>s.id===id);if(!s)return;
  if(save.unlocked.includes(id)){save.skin=id;persist();renderSkins();shopMessage(`${s.name} 장착 완료!`);beep(650,.12,'triangle');return}
  if(save.coins<s.cost){shopMessage(`별조각이 ${numbers(s.cost-save.coins)}개 부족해요!`);beep(190,.13,'triangle');return}
  // 한 번만 결제하고 영구 보유, 장착은 별도 행동
  save.coins-=s.cost;save.unlocked.push(id);awardAchievements();persist();renderSkins();shopMessage(`${s.name} 구매 완료! 이제 '장착하기'를 눌러주세요.`);beep(850,.2,'triangle');
}
function renderShop(){const el=$('#characterGrid');if(!el)return;$('#shopBalance').textContent=numbers(save.coins);
  const owned=skins.filter(s=>save.unlocked.includes(s.id)).length;$('#ownedCount').textContent=`${owned} / ${skins.length} 수집`;
  $('#ownedProgress').style.width=`${100*owned/skins.length}%`;
  const choices=skins.filter(s=>shopFilter==='all'||(shopFilter==='owned'?save.unlocked.includes(s.id):!save.unlocked.includes(s.id)));
  el.replaceChildren(...choices.map(s=>{const own=save.unlocked.includes(s.id),selected=save.skin===s.id;
    const card=document.createElement('article');card.className=`character-card${selected?' equipped':''}`;
    const mark=document.createElement('span');mark.className='character-status';mark.textContent=selected?'장착 중':own?'보유':'미보유';card.append(mark,avatar(s));const rarity=document.createElement('span');rarity.className='character-rarity '+s.rarity;rarity.textContent=({common:'일반',rare:'희귀',epic:'에픽'})[s.rarity]||'일반';card.append(rarity);
    const title=document.createElement('h3');title.textContent=s.name;const desc=document.createElement('p');desc.textContent=s.detail||'새로운 모여 친구';
    const perk=document.createElement('div');perk.className='character-perk';perk.textContent=perkLabel(s);const price=document.createElement('div');price.className='character-price';price.textContent=own?'✓ 영구 보유':`★ ${numbers(s.cost)}`;
    const btn=document.createElement('button');btn.type='button';btn.className='character-action';btn.disabled=selected;btn.textContent=selected?'장착 완료':own?'장착하기':`★ ${numbers(s.cost)} 구매`;
    btn.addEventListener('click',()=>buyOrEquip(s.id));card.append(title,desc,perk,price,btn);return card}));
  $$('.shop-tab').forEach(b=>b.classList.toggle('active',b.dataset.shopFilter===shopFilter));
}
function perkLabel(s){if(!s.perk||!s.perk.extra)return '기본 성능 · 외형 전용';const mode=s.perk.mode?modes.find(m=>m.id===s.perk.mode)?.title+'에서 ':'';return `${mode||''}종료 시 별조각 +${s.perk.extra}`}
function renderSkins(msg){$('#coinBalance').textContent=`${numbers(save.coins)} 별조각`;$('#headerStars').textContent=numbers(save.coins);$('#totalStarText').textContent=numbers(save.coins);$('#totalPlayText').textContent=numbers(save.plays);$('#totalGameText').textContent=`${modes.filter(m=>Number(save.best[m.id])>0).length} / ${modes.length}`;
  document.documentElement.style.setProperty('--cat-skin',skinColor());
  $('#equippedName').textContent=currentCharacter().name;
  const display=avatar(currentCharacter(),'mini-avatar');display.id='equippedAvatar';$('#equippedAvatar').replaceWith(display);
  if(msg)$('#skinMessage').textContent=msg;
  renderShop();renderAchievements();
}
function openShop(){if(phase==='playing')pauseGame();$('#shopModal').hidden=false;document.body.classList.add('shop-visible');renderShop();$('#closeShopBtn').focus()}
function closeShop(){$('#shopModal').hidden=true;document.body.classList.remove('shop-visible');$('#openShopBtn').focus()}
$('#openShopBtn').addEventListener('click',openShop);
$('#shopHeaderBtn').addEventListener('click',openShop);
$('#closeShopBtn').addEventListener('click',closeShop);
$('#shopBackdrop').addEventListener('click',closeShop);
$$('.shop-tab').forEach(b=>b.addEventListener('click',()=>{shopFilter=b.dataset.shopFilter;renderShop()}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#shopModal').hidden){e.preventDefault();closeShop()}},true);
let chosen=modes[0],duration=45,phase='ready',g=null,keysDown=new Set(),pointerDown=false,mouseX=W/2,mouseY=H/2,activeFilter='all',lastFrame=0,toastTimer=0;
let audioCtx=null;
function beep(freq=550,len=.085,type='sine',vol=.05){if(!save.sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.67),now+len);v.gain.setValueAtTime(vol,now);v.gain.exponentialRampToValueAtTime(.0001,now+len);o.connect(v);v.connect(audioCtx.destination);o.start(now);o.stop(now+len)}catch{}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),650)}
function add(pts,x=W/2,y=H/2){if(phase!=='playing')return;g.combo++;const mult=1+Math.min(1.5,Math.floor(g.combo/5)*.25);const value=Math.round(pts*mult);g.score+=value;g.fx.push({type:'text',x,y,vy:-42,text:`+${value}`,age:0,life:.85,color:g.combo%5===0?'#ffe580':'#ffffff'});if(g.combo%5===0){beep(900,.17,'triangle');toast(`${g.combo} COMBO!`)}else beep(520+Math.min(g.combo,15)*22,.075,'sine');if(g.score>Number(save.best[g.mode.id]||0)){save.best[g.mode.id]=g.score;g.newBest=true}updateNumbers()}
function hit(x=W/2,y=H/2){if(phase!=='playing'||g.invuln>0)return;g.lives--;g.combo=0;g.invuln=.95;shake(7);burst(x,y,14,'#ff8093');beep(170,.24,'sawtooth',.055);toast('앗! 조심!');if(g.lives<=0)endGame('OUT OF HEARTS')}
function shake(power){g.shake=Math.max(g.shake,power)}
function burst(x,y,n=10,c='#ffe37d'){for(let i=0;i<n;i++)g.fx.push({type:'particle',x,y,vx:rand(-140,140),vy:rand(-150,45),age:0,life:rand(.3,.85),r:rand(2,5),color:c})}
function rect(x,y,w,h,c,r=0){ctx.fillStyle=c;if(r){ctx.beginPath();ctx.roundRect(x,y,Math.max(0,w),Math.max(0,h),Math.min(r,w/2,h/2));ctx.fill()}else ctx.fillRect(x,y,w,h)}
function circ(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fill()}
function line(x1,y1,x2,y2,color,w=3){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function txt(text,x,y,size=18,color='#fff',align='center',weight=900){ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font=`${weight} ${size}px 'Noto Sans KR',sans-serif`;ctx.fillText(text,x,y)}
function path(points,color,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
function star(x,y,r=11,color='#ffe37b',rot=-Math.PI/2){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5;const rr=i%2?r*.46:r;const xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.closePath();ctx.fill()}
function cat(x,y,r=23,{color=null,eyes=true,rotate=0}={}){ctx.save();ctx.translate(x,y);ctx.rotate(rotate);if(!color){const sprite=loadCharacterImage(currentCharacter());if(sprite?.ready){ctx.drawImage(sprite.img,-r*1.33,-r*1.69,r*2.66,r*2.83);ctx.restore();return}}ctx.lineJoin='round';ctx.lineWidth=Math.max(2,r*.12);ctx.strokeStyle='#6b4059';ctx.fillStyle=color||skinColor();ctx.beginPath();ctx.moveTo(-r*.85,-r*.45);ctx.lineTo(-r*.73,-r*1.15);ctx.lineTo(-r*.2,-r*.75);ctx.arc(0,0,r,Math.PI*1.25,Math.PI*1.75);ctx.lineTo(r*.25,-r*.75);ctx.lineTo(r*.73,-r*1.15);ctx.lineTo(r*.85,-r*.45);ctx.quadraticCurveTo(r*1.02,r*.9,0,r);ctx.quadraticCurveTo(-r*1.1,r*.87,-r*.85,-r*.45);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#f98da0';ctx.lineWidth=r*.1;line(-r*.55,-r*.68,-r*.57,-r*.82,'#ef88a3',r*.08);line(r*.55,-r*.68,r*.57,-r*.82,'#ef88a3',r*.08);if(eyes){circ(-r*.38,-r*.08,r*.09,'#3d3446');circ(r*.38,-r*.08,r*.09,'#3d3446');circ(-r*.59,r*.35,r*.16,'#ff8b98');circ(r*.59,r*.35,r*.16,'#ff8b98');ctx.strokeStyle='#583b52';ctx.lineWidth=Math.max(1.4,r*.07);ctx.beginPath();ctx.arc(0,r*.24,r*.19,.1,Math.PI-.1);ctx.stroke();}ctx.restore()}
function heart(x,y,s=11){ctx.save();ctx.translate(x,y);ctx.scale(s/12,s/12);ctx.fillStyle='#ff718e';ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-22,-4,-7,-15,0,-7);ctx.bezierCurveTo(7,-15,22,-4,0,8);ctx.fill();ctx.restore()}
function scenery(theme='#2b396f',t=0){const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,theme);grad.addColorStop(1,'#111d42');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);for(let i=0;i<42;i++){const x=(i*91+37)%W,y=((i*139+23+Math.floor(t*(i%3+1)*7))%H);circ(x,y,i%5?1.5:2.5,'#ffffff35')}for(let i=0;i<7;i++){const x=((i*87+23)%510)-42,y=(i*110+Math.sin(t*.4+i)*14)%H;circ(x,y,25+i%3*12,'#ffffff0d');circ(x+22,y+8,20,'#ffffff0d')}}
function ground(y=500,c='#71528c'){rect(0,y,W,H-y,c);rect(0,y,W,8,'#f3c5f1')}
function medal(x,y,r=13){circ(x,y,r+3,'#fff6cb');circ(x,y,r,'#facd5c');star(x,y,r*.7,'#fff9bd')}
function drawFx(dt){for(const e of g.fx){e.age+=dt;e.x+=(e.vx||0)*dt;e.y+=(e.vy||0)*dt;ctx.save();ctx.globalAlpha=Math.max(0,1-e.age/e.life);if(e.type==='text')txt(e.text,e.x,e.y,22,e.color);else circ(e.x,e.y,e.r,e.color);ctx.restore()}g.fx=g.fx.filter(e=>e.age<e.life)}
function hud(){for(let i=0;i<g.lives;i++)heart(26+i*28,91,13);if(g.combo>=2){rect(W-126,81,103,27,'#1e163e66',13);txt(`${g.combo} COMBO`,W-74,95,13,'#fff4a1')}rect(15,H-50,W-30,35,'#14122d8f',12);txt(g.mode.hint,W/2,H-32,11,'#fff3ec', 'center',800)}
function updateNumbers(){if(!g)return;$('#scoreText').textContent=numbers(g.score);$('#bestText').textContent=numbers(Math.max(g.score,Number(save.best[g.mode.id]||0)));$('#timeText').textContent=g.duration?`${Math.max(0,Math.ceil(g.duration-g.elapsed))}s`:'∞';const prior=g.previousBest;const pct=prior>0?Math.round(100*g.score/prior):0;const isRecord=g.score>prior&&g.score>0;$('#catProgress').textContent=isRecord?(prior?'신기록 달성!':'첫 기록을 만들었어요!'):prior?`${pct}% 도달`:'첫 기록 세우기';$('#catMeter').style.width=`${prior?Math.min(100,pct):g.score>0?100:0}%`;$('#catTarget').textContent=prior?`${numbers(prior)}점`:'첫 플레이';$('#liveSessionBest').textContent=numbers(Math.max(g.score,prior));} 
function updateRecords(){const results=modes.filter(m=>save.best[m.id]>0).sort((a,b)=>Number(save.best[b.id])-Number(save.best[a.id])).slice(0,5);$('#recordList').innerHTML=results.length?results.map((m,i)=>`<div class="record-entry"><span class="record-label"><span>${m.emoji}</span>${m.title}</span><b>${numbers(save.best[m.id])}</b></div>`).join(''):'<div class="record-entry" style="color:#b5a8c4">아직 기록이 없어요. 첫 판을 시작해요!</div>'}
function gameTile(m){const el=document.createElement('button');el.type='button';el.className='game-tile'+(chosen.id===m.id?' selected':'');el.style.setProperty('--tileColor',m.color);el.dataset.game=m.id;el.innerHTML=`<span class="game-emoji">${m.emoji}</span><span class="game-name">${m.title}</span><span class="game-tag">${labels[m.cat]}</span>${save.best[m.id]?`<span class="game-best">★ ${numbers(save.best[m.id])}</span>`:''}${chosen.id===m.id?'<span class="selected-dot">PLAY</span>':''}`;el.addEventListener('click',()=>{selectGame(m.id);if(window.innerWidth<=720)document.querySelector('.play-column').scrollIntoView({behavior:'smooth',block:'start'})});return el}
function buildGrid(){const root=$('#gameGrid');root.replaceChildren(...modes.filter(m=>activeFilter==='all'||m.cat===activeFilter).map(gameTile))}
function selectGame(id){chosen=modes.find(m=>m.id===id)||modes[0];phase='ready';g=makeGame(chosen);$('#currentTitle').textContent=chosen.title;$('#currentDesc').textContent=chosen.desc;$('#currentTag').textContent=labels[chosen.cat];$('#tipText').textContent=chosen.tip;$('#controlHint').textContent=chosen.hint;$('#pauseBtn').disabled=true;$$('.duration').forEach(b=>b.disabled=false);buildGrid();updateNumbers();showOverlay('ready')}
function showOverlay(which){const el=$('#gameOverlay'),content=$('#overlayContent');el.classList.remove('hidden');let html='';if(which==='ready'){html=`<div class="overlay-hero">${chosen.emoji}</div><span class="overlay-brow">READY TO PLAY?</span><h3>${chosen.title}</h3><p>${chosen.desc}<br><strong style="color:#ffe27a">${chosen.hint}</strong></p><button class="start-btn" id="startButton" type="button">▶ 게임 시작</button><small class="overlay-tip">스페이스바 · 방향키 · 화면 터치 지원</small>`}else if(which==='paused'){html=`<div class="overlay-hero">⏸</div><span class="overlay-brow">TAKE A BREAK</span><h3>잠깐 정지!</h3><p>다시 시작하면 바로 이어서 플레이해요.</p><button class="start-btn" id="resumeButton" type="button">▶ 이어하기</button><button class="start-btn secondary-btn" id="restartButton" type="button">↻ 처음부터</button>`}else{const record=g.newBest&&g.score>g.previousBest;html=`<div class="overlay-hero">${record?'🏆':'⭐'}</div><span class="overlay-brow">${record?'NEW PERSONAL BEST!':'ROUND COMPLETE'}</span><h3>${record?'최고 기록 경신!':'이번 판 기록 완료!'}</h3><div class="overlay-score"><div><small>이번 점수</small><strong>${numbers(g.score)}</strong></div><div><small>내 최고 점수</small><strong>${numbers(save.best[g.mode.id]||0)}</strong></div></div><div class="reward-detail"><strong>★ 별조각 +${numbers(g.earned||0)} 획득!</strong><small>${g.bonusText||'점수에 비례해 별조각이 적립돼요.'}</small>${g.achievementWins?.length?`<small>업적 보상: ${g.achievementWins.join(' · ')}</small>`:''}</div><button class="start-btn" id="startButton" type="button">↻ 바로 재도전</button><button class="start-btn secondary-btn" id="nextButton" type="button">다른 게임 해보기 →</button><small class="overlay-tip">기록 · 별조각 · 구매 내역은 이 브라우저에 저장돼요.</small>`}content.innerHTML=html;$('#startButton')?.addEventListener('click',startGame);$('#resumeButton')?.addEventListener('click',resumeGame);$('#restartButton')?.addEventListener('click',startGame);$('#nextButton')?.addEventListener('click',()=>selectGame(modes[(modes.findIndex(m=>m.id===chosen.id)+1)%modes.length].id))}
function makeGame(mode){const game={mode,duration,previousBest:Number(save.best[mode.id]||0),score:0,lives:3,combo:0,elapsed:0,startedAt:Date.now(),pausedAt:null,level:1,invuln:0,shake:0,fx:[],newBest:false,data:{},down:false};impl[mode.id].init(game);return game}
function startGame(){phase='playing';g=makeGame(chosen);pointerDown=false;keysDown.clear();g.down=false;$('#gameOverlay').classList.add('hidden');$('#pauseBtn').disabled=false;$('#pauseBtn').textContent='Ⅱ 일시정지';$$('.duration').forEach(b=>b.disabled=true);updateNumbers();beep(720,.11,'triangle');canvas.focus({preventScroll:true})}
function pauseGame(){if(phase!=='playing')return;g.pausedAt=Date.now();phase='paused';g.down=false;pointerDown=false;keysDown.clear();showOverlay('paused');$('#pauseBtn').textContent='▶ 이어하기'}
function resumeGame(){if(phase!=='paused')return;g.startedAt+=Date.now()-(g.pausedAt||Date.now());g.pausedAt=null;phase='playing';$('#gameOverlay').classList.add('hidden');$('#pauseBtn').textContent='Ⅱ 일시정지';lastFrame=performance.now();canvas.focus({preventScroll:true})}
function endGame(){if(phase!=='playing')return;phase='over';g.down=false;pointerDown=false;
  const base=Math.max(1,Math.floor(g.score/140)),recordBonus=g.score>g.previousBest?3:0;
  const p=currentCharacter().perk,perkBonus=p?.type==='star_bonus'&&(!p.mode||p.mode===g.mode.id)?Math.max(0,Number(p.extra)||0):0;
  g.earned=base+recordBonus+perkBonus;g.bonusText=`기본 ${base}★${recordBonus?` · 신기록 +${recordBonus}★`:''}${perkBonus?` · 캐릭터 보너스 +${perkBonus}★`:''}`;
  save.coins+=g.earned;save.totalEarned+=g.earned;save.plays++;
  if(!save.stats.modesPlayed.includes(g.mode.id))save.stats.modesPlayed.push(g.mode.id);
  save.stats.hurdleStars+=g.mode.id==='hurdle'?g.data.collected:0;
  save.stats.chainFriends+=g.mode.id==='chain'?g.data.joined:0;
  g.achievementWins=awardAchievements();persist();renderSkins();$('#pauseBtn').disabled=true;$$('.duration').forEach(b=>b.disabled=false);updateRecords();buildGrid();showOverlay('over');beep(g.newBest?920:480,.26,'triangle');}

function inputTap(x=mouseX,y=mouseY,dir=0){if(phase!=='playing')return;impl[g.mode.id].tap?.(g,x,y,dir)}
function inputRelease(x=mouseX,y=mouseY){if(phase!=='playing')return;impl[g.mode.id].release?.(g,x,y)}
function point(ev){const r=canvas.getBoundingClientRect();return {x:clamp((ev.clientX-r.left)*W/r.width,0,W),y:clamp((ev.clientY-r.top)*H/r.height,0,H)}}
canvas.addEventListener('pointerdown',ev=>{if(phase!=='playing')return;ev.preventDefault();canvas.setPointerCapture?.(ev.pointerId);const p=point(ev);mouseX=p.x;mouseY=p.y;pointerDown=true;g.down=true;inputTap(p.x,p.y,p.x<W/2?-1:1)});
canvas.addEventListener('pointermove',ev=>{if(phase==='playing'){const p=point(ev);mouseX=p.x;mouseY=p.y}});
function pointerUp(ev){if(!pointerDown)return;const p=point(ev);mouseX=p.x;mouseY=p.y;pointerDown=false;g.down=keysDown.has('Space');inputRelease(p.x,p.y)}
canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',()=>{pointerDown=false;if(g)g.down=keysDown.has('Space')});
window.addEventListener('keydown',ev=>{if(document.body.classList.contains('pg-standalone-open'))return;if(!['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape','KeyA','KeyD'].includes(ev.code))return;if(ev.target instanceof HTMLButtonElement&&ev.code==='Enter')return;if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.code))ev.preventDefault();if(ev.code==='Escape'){if(phase==='playing')pauseGame();else if(phase==='paused')resumeGame();return}if(phase==='ready'||phase==='over'){if(ev.code==='Space'||ev.code==='Enter')startGame();return}if(phase==='paused'){if(ev.code==='Space'||ev.code==='Enter')resumeGame();return}if(phase!=='playing'||keysDown.has(ev.code))return;keysDown.add(ev.code);g.down=pointerDown||keysDown.has('Space')||keysDown.has('ArrowUp');let dir=ev.code==='ArrowLeft'||ev.code==='KeyA'?-1:ev.code==='ArrowRight'||ev.code==='KeyD'?1:0;inputTap(dir===-1?100:dir===1?320:mouseX,mouseY,dir)});
window.addEventListener('keyup',ev=>{if(!keysDown.has(ev.code))return;keysDown.delete(ev.code);if(!g)return;g.down=pointerDown||keysDown.has('Space')||keysDown.has('ArrowUp');if(['Space','ArrowUp'].includes(ev.code))inputRelease(mouseX,mouseY)});
window.addEventListener('blur',()=>{pointerDown=false;keysDown.clear();if(g)g.down=false;});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&phase==='playing')syncWallClock();});
$('#pauseBtn').addEventListener('click',()=>phase==='paused'?resumeGame():pauseGame());
$('#soundBtn').addEventListener('click',()=>{save.sound=!save.sound;persist();$('#soundBtn').textContent=save.sound?'♫':'♪̸';$('#soundBtn').setAttribute('aria-label',save.sound?'효과음 끄기':'효과음 켜기')});
$('#soundBtn').textContent=save.sound?'♫':'♪̸';
$$('.duration').forEach(b=>b.addEventListener('click',()=>{if(phase==='playing'||phase==='paused')return;duration=Number(b.dataset.duration);$$('.duration').forEach(x=>x.classList.toggle('active',x===b));g.duration=duration;updateNumbers()}));
$$('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('is-selected',x===b));buildGrid()}));
function syncWallClock(){if(!g||phase!=='playing')return;g.elapsed=Math.max(0,(Date.now()-g.startedAt)/1000);if(g.duration&&g.elapsed>=g.duration){endGame();}updateNumbers();}
function loop(ms){const dt=clamp((ms-lastFrame)/1000,0,.04)||.016;lastFrame=ms;if(g){if(phase==='playing'){syncWallClock();if(phase!=='playing'){requestAnimationFrame(loop);return;}g.invuln=Math.max(0,g.invuln-dt);g.level=1+Math.floor(g.elapsed/11);impl[g.mode.id].update(g,dt);if(g.duration&&g.elapsed>=g.duration&&phase==='playing')endGame();updateNumbers()}ctx.save();ctx.clearRect(0,0,W,H);if(g.shake>0&&phase==='playing'){ctx.translate(rand(-g.shake,g.shake),rand(-g.shake,g.shake));g.shake=Math.max(0,g.shake-dt*35)}impl[g.mode.id].draw(g);if(phase==='playing'||phase==='paused'){hud();drawFx(phase==='playing'?dt:0)}ctx.restore()}requestAnimationFrame(loop)}
// The 13 games below have separate rules/state, using a shared scoring and input engine.
const impl={
  drill:{
    init(g){g.data={depth:0,row:drillRow(),lane:1,shift:0}},
    tap(g,x){const d=g.data,lane=clamp(Math.floor(x/(W/3)),0,2),tile=d.row[lane];d.lane=lane;d.depth++;d.shift=1;if(tile==='spike'){hit(70+lane*140,392)}else{add(tile==='gem'?105:45,70+lane*140,371);burst(70+lane*140,370,tile==='gem'?12:6,tile==='gem'?'#ffe687':'#d7f6e8')}d.row=drillRow()},
    update(g,dt){g.data.shift=Math.max(0,g.data.shift-dt*3.5)},
    draw(g){const d=g.data;scenery('#503457',g.elapsed);for(let i=0;i<8;i++){rect(0,170+i*63,W,2,'#ffc6d233')}txt('⬇ 아래로 내려가자!',W/2,153,17,'#fff8d7');for(let j=0;j<3;j++){const x=j*140;rect(x+7,245,126,170,'#382a4f',15);rect(x+16,274,108,104,d.row[j]==='spike'?'#813851':d.row[j]==='gem'?'#446e77':'#7c687f',12);if(d.row[j]==='spike'){for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(x+32+k*30,364);ctx.lineTo(x+47+k*30,300);ctx.lineTo(x+61+k*30,364);ctx.fillStyle='#ff7a91';ctx.fill()}}else if(d.row[j]==='gem'){star(x+70,326,31,'#ffe37c');circ(x+70,326,11,'#fff6bc')}else{rect(x+30,307,81,46,'#b7a1b0',10);line(x+49,316,x+61,337,'#7f6784',3)}rect(x+10,394,120,12,'#f7bbcb',5);txt(`${j+1}`,x+70,438,13,'#ffcfdf')}
      ctx.save();ctx.globalAlpha=g.invuln?0.5+Math.sin(g.elapsed*28)*.35:1;cat(70+d.lane*140,208+d.shift*60,27);ctx.restore();txt(`지하 ${d.depth}층`,W/2,490,23,'#ffe28b');line(20,528,400,528,'#ffffff33',2)}
  },
  hurdle:{
    init(g){g.data={y:478,vy:0,jumps:0,obstacles:[],pickups:[],spawn:1.05,run:0,collected:0}},
    tap(g){const d=g.data;if(d.jumps<2){d.vy=d.jumps?-500:-620;d.jumps++;beep(490,.09,'triangle');burst(104,d.y+22,5,'#eaf9ff')}},
    update(g,dt){const d=g.data;d.run+=dt;d.vy+=1450*dt;d.y+=d.vy*dt;if(d.y>=478){d.y=478;d.vy=0;d.jumps=0}
      d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(1.45,1.85)/Math.min(1.45,1+(g.level-1)*.055);
        const obstacle={x:460,w:rand(30,37),h:rand(37,47),scored:false,hit:false};d.obstacles.push(obstacle);
        // Star precedes obstacle by ~60 px. Jumping from about x=200 makes it intersect the ascent arc.
        d.pickups.push({x:obstacle.x-61,y:410,r:15,taken:false,pattern:'jump'});
        // An optional ground-level star after the obstacle is separately reachable without a second jump.
        if(Math.random()>.40)d.pickups.push({x:obstacle.x+127,y:474,r:13,taken:false,pattern:'ground'});
      }
      const speed=205+g.level*18;
      for(const a of d.obstacles){a.x-=speed*dt;
        if(!a.hit&&a.x<127&&a.x+a.w>84&&d.y>506-a.h-22){a.hit=true;hit(105,d.y)}
        if(!a.scored&&a.x+a.w<80){a.scored=true;if(!a.hit)add(48,120,418)}
      }
      d.obstacles=d.obstacles.filter(a=>a.x>-70);
      for(const s of d.pickups){s.x-=speed*dt;
        if(!s.taken&&Math.abs(s.x-106)<31&&Math.abs(s.y-d.y)<(s.pattern==='jump'?41:34)){
          s.taken=true;d.collected++;add(s.pattern==='jump'?125:75,s.x,s.y);burst(s.x,s.y,14,'#ffe383');toast(`별 획득! ${d.collected}개`);
        }
      }
      d.pickups=d.pickups.filter(s=>!s.taken&&s.x>-35);
    },
    draw(g){const d=g.data;scenery('#3d7699',g.elapsed);
      for(let i=0;i<9;i++){const xx=((i*104-g.elapsed*77)%650+650)%650-70;circ(xx,218+i%3*29,24,'#effaff44');circ(xx+19,218+i%3*29,20,'#effaff33')}
      ground(506,'#765b93');rect(0,507,W,10,'#e9d1a9');for(let i=0;i<10;i++)rect((i*60-g.elapsed*180%60+60)%600-60,536,34,5,'#ffe7bb99',2);
      for(const a of d.obstacles){rect(a.x,506-a.h,a.w,a.h,'#ff7790',8);rect(a.x+5,512-a.h,a.w-10,8,'#ffd2df',3)}
      for(const s of d.pickups){circ(s.x,s.y,20,'#ffe28a33');star(s.x,s.y,s.r,'#ffe182');circ(s.x-4,s.y-5,3,'#fffefa')}
      ctx.save();ctx.globalAlpha=g.invuln?.55+Math.sin(g.elapsed*26)*.4:1;cat(106,d.y,24,{rotate:d.jumps?-.13:Math.sin(d.run*14)*.05});ctx.restore();
      txt(`먹은 별 ${d.collected}개`,W/2,138,16,'#ffedac');txt('점프하며 별을 직접 모으세요!',W/2,166,11,'#effaff');
    }
  },
  cloud:{
    init(g){g.data={needle:210,v:185,target:rand(113,307),steps:0,bounce:0,old:210}},
    tap(g){const d=g.data,delta=Math.abs(d.needle-d.target);if(delta<57){add(delta<21?145:90,d.target,285);burst(d.target,286,14,'#ffec9b');d.steps++;d.old=d.target;d.target=rand(95,325);d.v*=1.045;d.bounce=1}else hit(d.needle,401)},
    update(g,dt){const d=g.data;d.needle+=d.v*dt;if(d.needle>370){d.needle=370;d.v=-Math.abs(d.v)}if(d.needle<50){d.needle=50;d.v=Math.abs(d.v)}d.bounce=Math.max(0,d.bounce-dt*3)},
    draw(g){const d=g.data;scenery('#6784bb',g.elapsed);for(let i=0;i<8;i++){const x=i*77-20,y=525-i%2*52;circ(x,y,30,'#fff3f466');circ(x+18,y+5,30,'#fff3f466')}rect(37,310,346,24,'#e9d9fb33',12);circ(d.target-29,307,29,'#fafaff');circ(d.target+2,295,36,'#fafaff');circ(d.target+32,308,29,'#fafaff');star(d.target,277,14,'#ffe182');line(d.target,337,d.target,409,'#ffdb7c77',3);rect(d.target-50,409,100,10,'#ffe98b88',5);line(d.needle,408,d.needle,463,'#fff2e8',4);ctx.beginPath();ctx.moveTo(d.needle,395);ctx.lineTo(d.needle-13,411);ctx.lineTo(d.needle+13,411);ctx.closePath();ctx.fillStyle='#ffe17d';ctx.fill();cat(d.needle,476-d.bounce*85,25);txt(`${d.steps}번째 구름`,W/2,189,23,'#f5e8ff');txt('정확한 위치에 터치!',W/2,225,12,'#fff9e0')}
  },
  flight:{
    init(g){g.data={angle:-.55,targetY:rand(260,450),shots:0,trace:0,shotAngle:0}},
    tap(g){const d=g.data,ideal=Math.atan2(d.targetY-451,232),err=Math.abs(d.angle-ideal);d.trace=.35;d.shotAngle=d.angle;d.shots++;if(err<.29){add(err<.12?155:95,331,d.targetY);burst(332,d.targetY,14,'#ffe17d');d.targetY=rand(260,449)}else hit(326,d.targetY)},
    update(g,dt){const d=g.data;d.angle=-.38+Math.sin(g.elapsed*(2.25+g.level*.12))*.84;d.trace=Math.max(0,d.trace-dt)},
    draw(g){const d=g.data;scenery('#57428d',g.elapsed);circ(350,163,71,'#eab9ff13');for(let i=0;i<9;i++)star((i*91+42)%420,(i*127+109)%530+20,i%3+2,'#e9daff');const ideal=Math.atan2(d.targetY-451,232);line(92,451,92+Math.cos(d.angle)*280,451+Math.sin(d.angle)*280,'#ffe5a988',4);if(d.trace>0)line(92,451,92+Math.cos(d.shotAngle)*320,451+Math.sin(d.shotAngle)*320,'#fdffff',7*d.trace/.35);circ(326,d.targetY,36,'#ffffff22');circ(326,d.targetY,27,'#fcacd7');circ(326,d.targetY,18,'#ffe8af');star(326,d.targetY,10,'#fff');rect(36,440,107,35,'#71578e',14);cat(91,421,23,{rotate:d.angle*.2});rect(38,468,110,29,'#bf9ad0',12);txt(`발사 ${d.shots}회`,W/2,170,19,'#fff2bd');txt('화살표를 별에 맞춰!',W/2,204,12,'#e7d6fc')}
  },
  shooter:{
    init(g){g.data={enemies:[],spawn:.2,shot:0,wave:1}},
    tap(g,x,y,dir){const d=g.data;let best=null,dist=Infinity;for(const a of d.enemies){const dd=Math.hypot(a.x-x,a.y-y);if(dd<dist){dist=dd;best=a}}if(dir===0&&Math.abs(x-W/2)<5&&best&&best.y>50)dist=0;if(best&&dist<(dir===0?150:75)){best.dead=true;add(90,best.x,best.y);burst(best.x,best.y,17,'#ffe687');d.shot=.23;d.aimX=best.x;d.aimY=best.y}else{d.shot=.15;d.aimX=x;d.aimY=y;beep(250,.05,'square',.03)}},
    update(g,dt){const d=g.data;d.spawn-=dt;d.shot=Math.max(0,d.shot-dt);if(d.spawn<=0){d.spawn=Math.max(.39,.92-g.level*.06);d.enemies.push({x:rand(36,384),y:-32,speed:rand(63,105)+g.level*8,wig:rand(0,5),dead:false})}for(const a of d.enemies){a.y+=a.speed*dt;a.x+=Math.sin(g.elapsed*2+a.wig)*9*dt;if(a.y>500&&!a.dead){a.dead=true;hit(a.x,490)}}d.enemies=d.enemies.filter(a=>a.y<530&&!a.dead)},
    draw(g){const d=g.data;scenery('#37356f',g.elapsed);for(let i=0;i<10;i++){const xx=i*47+19;line(xx,80,xx,490,'#ffffff09',1)}for(const a of d.enemies){circ(a.x,a.y,26,'#ff9c9a');circ(a.x,a.y,18,'#ffdae2');circ(a.x-7,a.y-2,3,'#533f67');circ(a.x+7,a.y-2,3,'#533f67');line(a.x-5,a.y+9,a.x+5,a.y+9,'#9f4d69',2)}rect(0,522,W,78,'#4e4380');cat(210,488,25);if(d.shot>0)line(210,467,d.aimX,d.aimY,'#fffcd2',4+d.shot*11);txt('몬스터를 톡톡!',W/2,142,19,'#fff4cb');star(47,470,13,'#ffe088');star(374,466,12,'#ffe088')}
  },
  swim:{
    init(g){g.data={y:285,vy:0,rocks:[],spawn:1,dist:0}},
    tap(){},
    update(g,dt){const d=g.data;d.dist+=dt*95;d.vy+=(g.down?-880:580)*dt;d.vy=clamp(d.vy,-240,220);d.y=clamp(d.y+d.vy*dt,126,493);d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(.96,1.45)/Math.min(1.45,1+(g.level-1)*.05);d.rocks.push({x:460,y:rand(164,475),r:rand(20,32),hit:false,passed:false})}for(const a of d.rocks){a.x-=(155+g.level*12)*dt;if(!a.hit&&Math.hypot(a.x-154,a.y-d.y)<a.r+19){a.hit=true;hit(154,d.y)}if(!a.passed&&a.x<116){a.passed=true;add(48,155,d.y-47)}}d.rocks=d.rocks.filter(a=>a.x>-50)},
    draw(g){const d=g.data;scenery('#14677f',g.elapsed);for(let i=0;i<23;i++){const x=(i*71+23)%420,y=((i*103-g.elapsed*(18+i%4*6))%600+600)%600;circ(x,y,3+i%3*3,'#d3f8ff22')}for(let i=0;i<5;i++){const x=(i*125-g.elapsed*40%125+520)%520-50;line(x,533,x+15,474,'#8becb099',6);line(x+8,504,x+29,486,'#8becb099',4)}rect(0,544,W,56,'#0a374f');for(const a of d.rocks){circ(a.x,a.y,a.r+3,'#a2ded7');circ(a.x,a.y,a.r,'#677ca0');circ(a.x-7,a.y-7,6,'#b9cfcc')}cat(154,d.y,23,{rotate:clamp(d.vy/1200,-.2,.2)});for(let i=0;i<3;i++)circ(110-i*20,d.y+10+i*9,3+i*2,'#d8fbff66');txt('길게 누르면 올라가요!',W/2,148,15,'#b9fff9')}
  },
  ice:{
    init(g){g.data={x:210,dir:1,rocks:[],spawn:.7,dist:0}},
    tap(g){g.data.dir*=-1;beep(340,.08,'triangle')},
    update(g,dt){const d=g.data;d.dist+=dt;d.x+=(145+g.level*15)*d.dir*dt;if(d.x>388||d.x<32){d.x=clamp(d.x,32,388);d.dir*=-1;hit(d.x,470)}d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(.83,1.25);d.rocks.push({x:rand(51,369),y:-40,spike:Math.random()>.3,scored:false,hit:false})}for(const a of d.rocks){a.y+=(185+g.level*17)*dt;if(!a.hit&&Math.hypot(a.x-d.x,a.y-470)<32){a.hit=true;if(a.spike)hit(d.x,470);else{add(105,d.x,470);burst(d.x,470,10,'#ffe38a')}}if(a.y>505&&!a.scored){a.scored=true;if(a.spike&&!a.hit)add(35,a.x,505)}}d.rocks=d.rocks.filter(a=>a.y<570)},
    draw(g){const d=g.data;scenery('#438ca7',g.elapsed);rect(14,76,392,450,'#d6edff44',22);for(let i=0;i<6;i++){const x=40+i*70;line(x,92,x,520,'#ffffff35',2)}for(let i=0;i<9;i++){const y=(i*90+g.elapsed*160)%520+65;line(22,y,400,y-20,'#f5ffff22',2)}for(const a of d.rocks){if(a.spike){ctx.beginPath();ctx.moveTo(a.x,a.y-24);ctx.lineTo(a.x+23,a.y+19);ctx.lineTo(a.x-23,a.y+19);ctx.closePath();ctx.fillStyle='#e75c8a';ctx.fill()}else medal(a.x,a.y,16)}ctx.save();ctx.globalAlpha=g.invuln?.45+Math.sin(g.elapsed*30)*.5:1;cat(d.x,467,23,{rotate:d.dir*.2});ctx.restore();txt(d.dir>0?'→ 오른쪽 미끄러지는 중':'← 왼쪽 미끄러지는 중',W/2,154,15,'#edfcff');txt('터치 = 방향 반전!',W/2,186,12,'#e6fbff')}
  },
  orbit:{
    init(g){g.data={a:-Math.PI/2,goal:rand(-Math.PI,Math.PI),steps:0,radius:124}},
    tap(g){const d=g.data,diff=Math.atan2(Math.sin(d.a-d.goal),Math.cos(d.a-d.goal));if(Math.abs(diff)<.36){add(Math.abs(diff)<.14?155:100,210+Math.cos(d.goal)*d.radius,335+Math.sin(d.goal)*d.radius);burst(210+Math.cos(d.goal)*d.radius,335+Math.sin(d.goal)*d.radius,12,'#fff1a3');d.steps++;d.goal=rand(-Math.PI,Math.PI);d.radius=rand(110,146)}else hit(210+Math.cos(d.a)*d.radius,335+Math.sin(d.a)*d.radius)},
    update(g,dt){g.data.a+=(1.9+g.level*.17)*dt},
    draw(g){const d=g.data;scenery('#583c76',g.elapsed);circ(210,335,154,'#fff9ff13');circ(210,335,88,'#241b55');ctx.strokeStyle='#cdbaff55';ctx.lineWidth=16;ctx.beginPath();ctx.arc(210,335,d.radius,0,TAU);ctx.stroke();ctx.strokeStyle='#ffe280';ctx.lineWidth=22;ctx.lineCap='round';ctx.beginPath();ctx.arc(210,335,d.radius,d.goal-.35,d.goal+.35);ctx.stroke();circ(210,335,52,'#a897d0');circ(210,335,43,'#e7c8f2');star(210,335,19,'#fff1af');cat(210+Math.cos(d.a)*d.radius,335+Math.sin(d.a)*d.radius,22,{rotate:d.a+Math.PI/2});txt(`궤도 점프 ${d.steps}회`,210,145,20,'#fff1da');txt('노란 구간에서 터치!',210,175,12,'#ffe9fa')}
  },
  dash:{
    init(g){g.data={lane:1,items:[],spawn:.5,run:0}},
    tap(g,x,y,dir){const d=g.data;d.lane=clamp(d.lane+(dir===-1?-1:1),0,2);beep(400,.06,'triangle')},
    update(g,dt){const d=g.data;d.run+=dt;d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(.71,1.08)/Math.min(1.4,1+g.level*.05);const lane=Math.floor(rand(0,3));d.items.push({lane,y:-40,type:Math.random()>.29?'hazard':'star',seen:false})}for(const a of d.items){a.y+=(244+g.level*19)*dt;if(!a.seen&&a.y>=467){a.seen=true;if(a.lane===d.lane){if(a.type==='hazard')hit(70+140*a.lane,469);else{add(130,70+140*a.lane,469);burst(70+140*a.lane,469,12,'#ffe482')}}else if(a.type==='hazard')add(43,70+140*d.lane,460)}}d.items=d.items.filter(a=>a.y<560)},
    draw(g){const d=g.data;scenery('#494468',g.elapsed);rect(18,90,384,470,'#665e88');for(let k=1;k<=2;k++){for(let y=100;y<535;y+=80){rect(18+128*k-3,(y+g.elapsed*260)%540+90<550?(y+g.elapsed*260)%440+96:y,6,33,'#ffe8d666',4)}}for(const a of d.items){const xx=82+a.lane*128;if(a.type==='star')medal(xx,a.y,15);else{rect(xx-23,a.y-24,46,48,'#ff7890',8);txt('!',xx,a.y,25,'white')}}cat(82+d.lane*128,464,24,{rotate:Math.sin(d.run*16)*.09});txt('왼쪽 / 오른쪽으로 이동!',W/2,138,17,'#fff4d3')}
  },
  tower:{
    init(g){g.data={charge:0,holdTime:0,target:rand(.36,.78),floors:0,leap:0}},
    tap(g){g.data.holdTime=0;g.data.charge=0},
    release(g){const d=g.data;if(d.holdTime<.08)return;const error=Math.abs(d.charge-d.target);d.leap=.52;if(error<.24){add(error<.09?150:95,210,320);d.floors++;burst(210,342,13,'#ffe38b');d.target=rand(.35,.82)}else hit(210,353);d.holdTime=0;d.charge=0},
    update(g,dt){const d=g.data;if(g.down){d.holdTime+=dt;d.charge=(Math.sin(d.holdTime*2.45-Math.PI/2)+1)/2}d.leap=Math.max(0,d.leap-dt)},
    draw(g){const d=g.data;scenery('#447b8a',g.elapsed);for(let i=0;i<10;i++){const x=(i*99+13)%500-15,y=220+(i%3)*85;circ(x,y,25,'#ffffff2b')}rect(30,460,150,40,'#9be0bf',8);rect(238,310,155,38,'#fee08a',8);rect(248,350,10,110,'#d1bf96');rect(364,350,10,110,'#d1bf96');ctx.save();ctx.globalAlpha=g.invuln?.5:1;cat(103,434-d.leap*185,25,{rotate:-d.leap*.5});ctx.restore();txt(`완등 ${d.floors}층`,W/2,154,24,'#fff3c3');txt('길게 눌렀다가 떼세요!',W/2,188,13,'#f4fff1');rect(55,523,310,20,'#263952',10);rect(55+d.target*310-37,520,74,26,'#ffe8a9',11);rect(55,525,310*d.charge,16,'#f87fa9',8);rect(55+d.target*310-2,518,4,30,'#ffffff');txt('POWER',210,565,11,'#f5ecf9')}
  },
  slalom:{
    init(g){g.data={side:0,gates:[],spawn:1,dist:0}},
    tap(g){g.data.side=1-g.data.side;beep(380,.08,'triangle')},
    update(g,dt){const d=g.data;d.dist+=dt;d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(1.0,1.45)/Math.min(1.4,1+g.level*.065);d.gates.push({safe:Math.floor(rand(0,2)),y:-65,seen:false})}for(const a of d.gates){a.y+=(192+g.level*13)*dt;if(!a.seen&&a.y>465){a.seen=true;if(a.safe===d.side)add(90,a.safe?286:134,466);else hit(d.side?286:134,466)}}d.gates=d.gates.filter(a=>a.y<580)},
    draw(g){const d=g.data;scenery('#5d9e97',g.elapsed);rect(40,90,340,470,'#e7ffed');line(210,90,210,545,'#a9ddbf',3);for(const a of d.gates){const x=a.safe?134:286;for(let col=0;col<2;col++){const xx=col?286:134;if(xx===x){star(xx,a.y,18,'#ffe180')}else{ctx.beginPath();ctx.moveTo(xx,a.y-38);ctx.lineTo(xx-23,a.y+27);ctx.lineTo(xx+23,a.y+27);ctx.closePath();ctx.fillStyle='#24735a';ctx.fill();rect(xx-5,a.y+22,10,23,'#8a6e61',3)}}}cat(d.side?286:134,470,25,{rotate:d.side?.12:-.12});line((d.side?286:134)-15,496,(d.side?286:134)-21,514,'#8062af',3);line((d.side?286:134)+15,496,(d.side?286:134)+21,514,'#8062af',3);txt('나무가 없는 쪽으로!',W/2,143,16,'#34595b')}
  },
  balloon:{
    init(g){g.data={y:310,vy:0,obstacles:[],spawn:.55,drift:0}},
    tap(){},
    update(g,dt){const d=g.data;d.drift+=dt;d.vy+=(g.down?-780:480)*dt;d.vy=clamp(d.vy,-230,205);d.y=clamp(d.y+d.vy*dt,158,492);d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(.98,1.5)/Math.min(1.4,1+g.level*.055);d.obstacles.push({x:455,y:rand(185,472),r:rand(18,31),seen:false,hit:false})}const bx=158+Math.sin(d.drift*1.4)*20;for(const a of d.obstacles){a.x-=(175+g.level*14)*dt;if(!a.hit&&Math.hypot(a.x-bx,a.y-d.y)<a.r+23){a.hit=true;hit(bx,d.y)}if(!a.seen&&a.x<bx-40){a.seen=true;add(57,bx,d.y-55)}}d.obstacles=d.obstacles.filter(a=>a.x>-50)},
    draw(g){const d=g.data,bx=158+Math.sin(d.drift*1.4)*20;scenery('#775e9b',g.elapsed);for(let i=0;i<7;i++){const x=(i*139-g.elapsed*23%700+700)%700-100,y=213+i%4*82;circ(x,y,26,'#fff4f988');circ(x+27,y+5,26,'#fff4f988')}for(const a of d.obstacles){circ(a.x,a.y,a.r+4,'#ffffff55');circ(a.x,a.y,a.r,'#ef7299');star(a.x,a.y,a.r*.48,'#ffe0df')}line(bx,d.y-11,bx,d.y-64,'#f2e5fc',3);circ(bx,d.y-82,35,'#f77da3');circ(bx-10,d.y-91,12,'#ffa5be');ctx.save();ctx.globalAlpha=g.invuln?.5:1;cat(bx,d.y+14,19);ctx.restore();txt('누르면 위로, 놓으면 아래로!',W/2,146,14,'#fff4e1')}
  },
  chain:{
    init(g){g.data={x:210,y:366,a:-Math.PI/2,turn:1,joined:0,friends:[],tail:[],history:[],star:{x:323,y:294},spawn:1.0,survive:0,wallSafe:1.3};
      for(let i=0;i<3;i++)spawnFriend(g.data);
    },
    tap(g){g.data.turn*=-1;beep(g.data.turn>0?540:400,.07,'triangle');},
    update(g,dt){const d=g.data;d.survive+=dt;d.wallSafe=Math.max(0,d.wallSafe-dt);
      const speed=98+Math.min(42,g.level*4),angular=1.75+Math.min(.35,g.level*.035);
      d.a+=d.turn*angular*dt;d.x+=Math.cos(d.a)*speed*dt;d.y+=Math.sin(d.a)*speed*dt;
      d.history.unshift({x:d.x,y:d.y});d.history.length=Math.min(d.history.length,Math.max(40,18*(d.tail.length+2)));
      for(let i=0;i<d.friends.length;i++){const f=d.friends[i];f.wobble+=dt;f.x+=Math.cos(f.wobble*1.2+i)*5*dt;f.y+=Math.sin(f.wobble*1.4+i)*5*dt;
        if(Math.hypot(f.x-d.x,f.y-d.y)<24){d.tail.push({color:f.color});d.joined++;add(125,d.x,d.y);burst(d.x,d.y,16,'#ffe6a0');d.friends.splice(i,1);i--;}
      }
      d.spawn-=dt;if(d.spawn<=0){d.spawn=rand(1.5,2.4);if(d.friends.length<5)spawnFriend(d);}
      if(Math.hypot(d.x-d.star.x,d.y-d.star.y)<23){add(65,d.star.x,d.star.y);burst(d.star.x,d.star.y,12,'#ffe17a');d.star=chainOpenSpace(d)}
      if(Math.floor((d.survive-dt)/4)!==Math.floor(d.survive/4))add(28,d.x,d.y-25);
      if(d.wallSafe<=0&&(d.x<46||d.x>374||d.y<190||d.y>527)){chainCrash(g,d.x,d.y);return;}
      if(d.wallSafe<=0&&d.tail.length>=6){for(let i=5;i<d.tail.length;i++){const p=d.history[Math.min(d.history.length-1,(i+1)*18)];if(p&&Math.hypot(d.x-p.x,d.y-p.y)<22){chainCrash(g,d.x,d.y);return}}}
    },
    draw(g){const d=g.data;scenery('#514577',g.elapsed);
      rect(38,181,344,359,'#a6b9b51a',24);ctx.strokeStyle='#d9d0ed83';ctx.lineWidth=5;ctx.strokeRect(43,185,334,350);
      for(let i=0;i<15;i++){const xx=60+i*21,yy=200+i%4*93;circ(xx,yy,2,'#fff5e842')}
      for(const f of d.friends)drawFriend(f.x,f.y,15,f.color);
      circ(d.star.x,d.star.y,22,'#ffe38c25');star(d.star.x,d.star.y,13,'#ffe18b');
      for(let i=d.tail.length-1;i>=0;i--){const p=d.history[Math.min(d.history.length-1,(i+1)*18)];if(p)drawFriend(p.x,p.y,Math.max(9,13-i*.13),d.tail[i].color)}
      ctx.save();ctx.globalAlpha=g.invuln?.55+Math.sin(g.elapsed*26)*.4:1;cat(d.x,d.y,23,{rotate:d.a+Math.PI/2});ctx.restore();
      txt(`친구 ${d.tail.length}명 · 생존 ${Math.floor(d.survive)}초`,W/2,137,18,'#fff3d0');
      txt(`터치로 ${d.turn>0?'시계':'반시계'} 방향 전환`,W/2,165,12,'#f2e1ff');
      if(d.wallSafe>0){txt('친구를 모으며 빙글빙글!',W/2,267,14,'#fff4d3')}
    }
  }};
function chainOpenSpace(d){for(let k=0;k<80;k++){const x=rand(75,346),y=rand(225,493);
    if(Math.hypot(x-d.x,y-d.y)>100&&d.friends.every(f=>Math.hypot(x-f.x,y-f.y)>50))return{x,y};}
  return {x:210,y:285};}
function spawnFriend(d){const p=chainOpenSpace(d);d.friends.push({...p,color:pick(['#a2e7d2','#f7baad','#c7b3f4','#fbe08b']),wobble:rand(0,TAU)});}
function chainCrash(g,x,y){const d=g.data;hit(x,y);if(phase!=='playing')return;
  d.x=210;d.y=360;d.a=-Math.PI/2;d.wallSafe=1.5;d.history=[];
  if(d.tail.length>=3){d.tail.splice(Math.max(1,Math.floor(d.tail.length*.65)));toast('충돌! 꼬리가 짧아졌어요');}}
function drawFriend(x,y,r,c){circ(x,y+2,r+2,'#211e48');circ(x,y,r,c);
  circ(x-r*.34,y-r*.12,r*.12,'#33304c');circ(x+r*.34,y-r*.12,r*.12,'#33304c');
  circ(x-r*.44,y+r*.28,r*.15,'#f68fa644');circ(x+r*.44,y+r*.28,r*.15,'#f68fa644');
  line(x-r*.18,y+r*.32,x+r*.18,y+r*.32,'#755b75',Math.max(1,r*.12));}
function drillRow(){const types=['rock','rock','gem'];types[Math.floor(rand(0,3))]='spike';if(!types.includes('gem'))types[(types.findIndex(a=>a==='spike')+1)%3]='gem';return types.sort(()=>Math.random()-.5)}
if(arcadeTrial){
  document.body.classList.add('gamehell-trial');
  document.title='모여게임지옥 · 맛보기 3종';
  const headline=document.querySelector('.intro h1');
  if(headline)headline.innerHTML='세 게임 먼저 <em>맛보기!</em>';
  const intro=document.querySelector('.intro p');
  if(intro)intro.textContent='낙하대작전 · 폴짝도로 · 찰싹친구들. 각 45초씩 체험하고 기록을 세워보세요! 맛보기의 별조각과 기록은 정식판과 별도로 저장됩니다.';
  const topPill=document.querySelector('.top-pill');if(topPill)topPill.textContent='TRIAL · 3 GAMES';
  const gameCount=document.querySelector('#libraryTitle .count');if(gameCount)gameCount.textContent='3';
  const introChips=document.querySelector('.intro-chips');if(introChips)introChips.innerHTML='<span>★ 무료 체험 3종</span><span>⏱ 각 45초</span><span>☑ 정식 기록과 분리</span>';
  const back=document.createElement('a');back.href='/?cat=1';back.className='gamehell-trial-back';back.textContent='← 고양이를 이겨라 · 맛보기 목록';document.querySelector('.intro')?.prepend(back);
  for(const selector of ['#shopHeaderBtn','#openShopBtn','.wardrobe','.achievements']){const el=document.querySelector(selector);if(el)el.style.display='none';}
  for(const button of document.querySelectorAll('.duration'))if(Number(button.dataset.duration)!==45){button.style.display='none';button.disabled=true;}
  const durationLabel=document.querySelector('.mode-select>span');if(durationLabel)durationLabel.textContent='맛보기 제한시간 · 45초';
  const note=document.querySelector('.library-foot small');if(note)note.textContent='맛보기는 3종만 제공되며, 정식 게임에는 13종과 캐릭터 상점이 있습니다.';
}
renderSkins();updateRecords();selectGame(modes[0].id);requestAnimationFrame(loop);