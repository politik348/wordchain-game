/* 모여 방탈출 EP01 13번째 종소리 · 퍼즐 리뉴얼 v2.1
   독립 실행, 로컬 저장, 기존 3D 룸 모듈 호환. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const isTaste=location.pathname.startsWith('/taste/escape/');
const SAVE=isTaste?'moyeo.escape.ep01.taste.save.v21':'moyeo.escape.ep01.save.v21',HISTORY=isTaste?'moyeo.escape.ep01.taste.endings.v21':'moyeo.escape.ep01.endings.v21';
const store={getItem(k){try{return window.localStorage.getItem(k)}catch(e){return this.memory?.[k]||null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){(this.memory??={})[k]=v}},removeItem(k){try{window.localStorage.removeItem(k)}catch(e){if(this.memory)delete this.memory[k]}}};
const rooms=['foyer','study','greenhouse','tower'];
const meta={foyer:['현관 홀','발자국과 낡은 거울이 숨긴 첫 번째 길'],study:['달빛 서재','먼지 낀 책과 오래된 피아노가 남긴 선율'],greenhouse:['유리 온실','빛을 기다리는 꽃과 네 개의 급수관'],tower:['시계탑','마지막 종을 기다리는 멈춘 시계']};
const items={brassKey:['🗝','황동 열쇠','서재 문을 여는 열쇠. 달 문양이 새겨져 있다.'],silverDisc:['◐','은면 원판','빛을 반사하는 은빛 원판. 현관의 받침대에 맞을 것 같다.'],lamp:['✧','작은 등불','옆면에 달 모양 구멍이 있어 빛이 새어 나온다.'],roll:['♫','원통 악보','돌기들이 일정한 간격으로 나 있다. 피아노에 맞는 규격이다.'],film:['▧','별 구멍 필름','네 군데가 뚫려 있는 투명 필름. 모서리에 별 하나가 있다.'],photo:['▧','오래된 사진','어린 미로와 루나. 뒷면: 「우린 언제나 함께야」'],diary:['▤','루나의 일기','「미로를 꼭 데리러 올게」. 마지막 페이지에는 사고 시각이 기록되어 있다.'],collar:['◇','은빛 목걸이','안쪽에는 「미로, 나의 영원한 가족 — 루나」라고 새겨져 있다.']};
const seals={path:['❖','길의 인장'],echo:['♫','소리의 인장'],light:['☼','빛의 인장']};
const clueText={invitation:['익명의 편지','달빛 저택으로 와 주세요. 사라진 기억을 찾아주세요. 발신인은 표시되어 있지 않다.'],lock9:['현관 관리 기록','출입문은 매일 밤 9시에 자동으로 잠긴다. 날짜는 사건 당일로 기록되어 있다.'],track:['양탄자 아래의 발자국','작은 침대에서 종이 놓인 타일까지, 작은 고양이 발자국이 끊기지 않고 이어진다.'],portrait:['서재 초상화','옛 사진과 같은 소녀가 서 있다. 액자 뒷면은 분리할 수 있다.'],dust:['서재 책장의 오래된 문양','서가 왼쪽 끝에는 별, 오른쪽 끝에는 초승달이 새겨져 있다. 책등의 두 끝에도 서로 다른 문양이 있으며 책 한 권에는 먼지가 거의 없다.'],roll:['기계식 자동연주 장치','원통의 돌기 자국은 여섯 건반의 위치와 대응한다. 어느 쪽이 시작인지 작은 별 표시가 알려 준다.'],water:['정원 관리 기록','네 화분의 수위는 서로 다르다. 해의 흔적은 세 번째 눈금, 구름의 급수관은 막혔다. 옛 사진에서 별은 달보다 한 눈금 높다.'],powder:['달빛꽃 관찰 노트','달빛꽃 꽃가루는 밝을 때 빛을 머금고, 어두워지면 은은하게 빛난다.'],clock:['시계 관리인의 기록','밤에 현관이 잠긴 뒤 분침이 사분원 움직일 무렵 시계가 멈췄다. 열두 번의 종은 고장 경보다.'],pin:['고정쇠의 표식','빨간 쇠고리는 비상 제동용이다. 안전 인장과 시각 복원 후에만 해제할 수 있다.'],story:['루나가 남긴 약속','루나는 고장 이전에 저택 밖 관리실로 나갔으며, 안팎의 시간은 다르게 흘렀다.']};
const hints={
 foot:['고양이가 자주 눕던 곳과 양탄자를 조사해 보세요.','작은 발자국은 침대에서 시작해 종이 놓인 타일에서 끝납니다.','작은 발자국의 이동 방향은 오른쪽 → 아래 → 오른쪽 → 아래입니다.'],
 mirror:['벽 장식의 황동 선로에는 빛이 지나갈 만한 다섯 개의 은색 받침이 있다.','빛은 은빛 면에 닿으면 꺾인다. 빛이 어디에서 끊기는지 보고 다음 받침을 만져 보세요.','은면의 방향은 A / · B / · C \\ · D \\ · E / 입니다. 등불을 켠 채 맞춰 보세요.'],
 books:['책장 양 끝에 새겨진 기호와 책등 양쪽의 문양을 비교해 보세요.','한쪽 방향으로 읽히지 않는 책은 뒤집어서 살펴보세요. 닮은 책이 모두 원래 이 서재의 책인 것은 아닙니다.','왼쪽부터 가을 → 여름(뒤집기) → 겨울 → 자정(뒤집기) → 봄 순서입니다. 미로의 책은 남겨둡니다.'],
 piano:['책장에서 나온 원통과 피아노 위의 기계를 살펴보세요.','원통의 돌기 자국을 건반의 위치와 겹쳐 생각해 보세요.','왼쪽부터 2, 5, 3, 2번 건반을 연주하세요.'],
 film:['서재 초상화 뒷면과 책상 위 숫자 표를 조사해 보세요.','투명 필름과 숫자 표에는 같은 별 표식이 있습니다.','필름의 별을 표의 왼쪽 위 별에 맞춘 후 위에서 아래로 6786을 읽으세요.'],
 water:['네 화분과 오래된 정원 관리 기록을 대조해 보세요.','구름과 해의 수위가 확정되면 남은 두 눈금의 순서를 결정할 수 있습니다.','해 3 · 달 1 · 별 2 · 구름 0입니다.'],
 light:['현관에서 사용했던 물건을 온실에서 다시 쓸 수 있습니다.','달빛의 경로를 두 번 꺾어야 꽃까지 닿습니다.','은면 원판을 끼우고 첫 번째 거울은 \\, 두 번째는 / 방향으로 돌리세요.'],
 blackout:['달빛꽃 주변의 바닥과 정원 관찰 노트를 조사해 보세요.','희미한 꽃가루가 밝은 곳에서는 잘 보이지 않습니다.','채광창을 닫아 온실을 어둡게 만들고 화분을 살펴보세요.'],
 clock:['현관 홀의 기록과 시계 관리인의 기록을 다시 비교해 보세요.','밤 9시에 현관이 잠긴 뒤 분침이 원의 1/4만큼 움직였습니다.','밤 9시 15분으로 시계 바늘을 맞추세요.'],
 pin:['종은 이미 열두 번 울렸습니다. 다음 종을 울리는 버튼을 찾을 필요가 있을까요?','시계의 기어는 움직이려 하지만 아래쪽 추가 움직이지 못합니다.','시계 아래 붉은 고정쇠를 잡아당기세요.']
};
const state=()=>({v:21,room:'foyer',visited:['foyer'],inventory:[],clues:[],seals:[],flags:{foot:false,mirror:false,books:false,piano:false,film:false,water:false,light:false,blackout:false,clock:false,pin:false,valves:false,rug:false,curtain:false},selected:null,booksPlaced:[null,null,null,null,null],booksFlipped:{},drumOffset:0,drumPlayed:false,mirrorTiles:{A:'\\',B:'/',C:'/',D:'/',E:'\\'},lampOn:false,footInput:'',pianoInput:[],digits:'',mirrorAngle:0,mirrorA:0,mirrorB:0,filmRotate:1,filmShift:-1,waterValues:[1,2,1,2],glassA:{r:1,x:-1},glassB:{r:2,x:1},night:false,hour:12,minute:0,activePuzzle:'foot',hintLevels:{},hintsUsed:0,errors:0,startedAt:Date.now(),elapsedCarry:0,sound:true,ending:null});
let g=null,modalOpen=false,audio=null,catTurns=0;
const has=id=>g.inventory.includes(id), done=id=>!!g.flags[id], elapsed=()=>Math.floor((Date.now()-(g?.startedAt||Date.now()))/1000)+(g?.elapsedCarry||0), pretty=s=>{let v=Math.max(0,s);return `${String(Math.floor(v/3600)).padStart(2,'0')}:${String(Math.floor(v%3600/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`};
function save(){if(!g)return;try{store.setItem(SAVE,JSON.stringify({...g,elapsedCarry:elapsed(),startedAt:null}));}catch(e){}}
function notify(s){const t=document.createElement('div');t.className='toast';t.textContent=s;$('toastRegion').appendChild(t);setTimeout(()=>t.remove(),3500)}
function tone(kind='tap'){if(!g?.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let seq=kind==='gain'?[523,659,784]:kind==='bad'?[250,188]:kind==='bell'?[440,550,659,880]:[550];seq.forEach((hz,i)=>{let o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=hz;v.gain.setValueAtTime(.0001,audio.currentTime+i*.13);v.gain.exponentialRampToValueAtTime(.06,audio.currentTime+i*.13+.025);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+i*.13+.33);o.connect(v);v.connect(audio.destination);o.start(audio.currentTime+i*.13);o.stop(audio.currentTime+i*.13+.35)})}catch(e){}}
function item(id){if(has(id))return;g.inventory.push(id);notify('아이템 획득 · '+items[id][1]);tone('gain');save();render()}
function clue(id){if(!g.clues.includes(id)){g.clues.push(id);save()}}
function seal(id){if(g.seals.includes(id))return;g.seals.push(id);notify('인장 획득 · '+seals[id][1]);tone('gain');save();render()}
function clearRoom(id){return ({foyer:()=>done('foot')&&done('mirror')&&has('brassKey'),study:()=>done('books')&&done('piano'),greenhouse:()=>done('water')&&done('light'),tower:()=>done('clock')&&done('pin')})[id]();}
function canEnter(id){let n=rooms.indexOf(id);return n===0||n>0&&rooms.slice(0,n).every(clearRoom)}
function begin(){g=state();save();showGame();modal('PROLOGUE','13번째 종소리',`<div class="letter">달빛 저택으로 와 주세요.\n멈춘 시계가 다시 움직이기 전에, 사라진 기억을 찾아 주셨으면 합니다.\n\n— 발신인 미상</div><p class="modal-description">눈을 떠보니 현관문이 잠겨 있습니다. 고양이 미로가 마치 오래 기다렸다는 듯 말을 겁니다.</p><p class="story-voice">"여기 나가려면 인장 세 개를 찾아야 해. 근데… 내가 기다리던 사람이 누구였더라?"</p>`,[['현관 조사 시작','close',true]])}
function resume(){try{let s=JSON.parse(store.getItem(SAVE));if(!s||s.v!==21||!s.flags)throw Error('version');g={...state(),...s,flags:{...state().flags,...s.flags},mirrorTiles:{...state().mirrorTiles,...s.mirrorTiles},booksFlipped:{...s.booksFlipped}};if(!Array.isArray(g.booksPlaced)||g.booksPlaced.length!==5)g.booksPlaced=[null,null,null,null,null];g.elapsedCarry=Number(s.elapsedCarry)||0;g.startedAt=Date.now();if(!canEnter(g.room))g.room='foyer';showGame();if(g.ending)ending(g.ending)}catch(e){store.removeItem(SAVE);notify('저장 기록을 읽지 못했습니다. 새로 시작해 주세요.') }}
function showGame(){$('homeScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');hide();render();window.Moyeo3D?.refresh();tick()}
function home(){save();hide();$('gameScreen').classList.add('hidden');$('homeScreen').classList.remove('hidden');$('continueBtn').classList.toggle('hidden',!store.getItem(SAVE))}
function hide(){modalOpen=false;$('modalOverlay').classList.add('hidden')}
function modal(eyebrow,title,content,actions=[['돌아가기','close',true]]){modalOpen=true;$('modalOverlay').classList.remove('hidden');$('modalContent').innerHTML=`<div class="modal-eyebrow">${eyebrow}</div><h2 id="modalTitle" class="modal-title">${title}</h2>${content}<div class="modal-actions">${actions.map(([name,action,primary,disabled])=>`<button class="modal-btn ${primary?'primary':''}" data-action="${action}" ${disabled?'disabled':''}>${name}</button>`).join('')}</div>`;}
function article(t,s,eyebrow='조사 기록'){modal(eyebrow,t,`<div class="letter">${s}</div>`)}
function solved(key,text){g.flags[key]=true;g.activePuzzle=key;tone('gain');save();render();modal('PUZZLE SOLVED','장치가 움직이기 시작했다',`<div class="collect-visual">✦</div><p class="modal-description">${text}</p>`)}
function error(text='아직 맞지 않는 것 같습니다.'){g.errors++;tone('bad');notify(text);save()}
function objective(){const n=rooms.indexOf(g.room);if(g.ending)return '이야기가 완결되었습니다.';if(clearRoom(g.room)&&n<3)return '다음 공간으로 가는 문이 열렸습니다. 선택 수집품은 놓치지 않았나요?';if(g.room==='foyer')return !done('foot')?'양탄자와 수납장을 자세히 살펴보세요.':'반쪽짜리 달 장식이 아직 반응하지 않습니다.';if(g.room==='study')return !done('books')?'서재의 책장을 조사해 보세요.':!done('piano')?'피아노 위 기계에 원통이 빠져 있습니다.':'온실로 향하는 문이 열렸습니다.';if(g.room==='greenhouse')return !done('water')?'화분의 물 높이와 기록을 비교해 보세요.':!done('light')?'빛이 달빛꽃에 닿도록 해 보세요.':'온실의 빛이 돌아왔습니다.';return !done('clock')?'관리 기록과 시계를 비교해 보세요.':!done('pin')?'종소리는 열두 번 울렸지만 시간은 아직 멈춰 있습니다.':'마지막 문이 열렸습니다.'}
function render(){if(!g)return;let [name,caption]=meta[g.room],index=rooms.indexOf(g.room);$('roomTitle').textContent=name;$('roomEyebrow').textContent=`ROOM 0${index+1} / 04`;$('sceneCaption').textContent=caption;
 $('sceneNav').innerHTML=rooms.map((r,i)=>`<button data-room="${r}" class="nav-btn ${r===g.room?'current':''} ${!canEnter(r)?'locked':''} ${canEnter(r)&&r!==g.room?'available':''}" ${r===g.room?'disabled aria-current="step"':''} ${!canEnter(r)?'aria-disabled="true"':''}><span class="nav-index">${canEnter(r)?String(i+1).padStart(2,'0'):'♙'}</span><span class="nav-copy"><small>${r===g.room?'현재 탐험 중':!canEnter(r)?'아직 잠긴 공간':'이동 가능한 공간'}</small><b>${meta[r][0]}</b></span><span class="nav-status" aria-hidden="true">${r===g.room?'✦':!canEnter(r)?'⌑':'↗'}</span></button>`).join('');
 $('sealsBar').innerHTML=Object.entries(seals).map(([id,v])=>`<div title="${v[1]}" class="seal ${g.seals.includes(id)?'found':''}">${v[0]}</div>`).join('');
 $('sceneArtwork').innerHTML=drawScene(g.room);$('sceneCanvas').dataset.room=g.room;window.Moyeo3D?.setRoom(g.room);
 $('hotspots').innerHTML=hotspots[g.room].map(x=>`<button type="button" class="hotspot ${x.ok?.()?'done':''}" data-object="${x.id}" style="left:${x.x}%;top:${x.y}%" aria-label="${x.name}" title="${x.name}"><span>${x.name}</span></button>`).join('');window.Moyeo3D?.refresh();
 $('inventoryNum').textContent=g.inventory.length;$('inventory').innerHTML=g.inventory.length?g.inventory.map(id=>`<button class="inventory-item ${g.selected===id?'selected':''}" data-item="${id}" title="${items[id][2]}"><span class="item-icon">${items[id][0]}</span><span class="item-name">${items[id][1]}</span></button>`).join(''):'<div class="inventory-empty"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 25h36l-3.5 27h-29L14 25Z" fill="#d8c5a8" fill-opacity=".13" stroke="#e4cfac" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 25v-6a8 8 0 0 1 16 0v6" stroke="#e4cfac" stroke-width="2.6" stroke-linecap="round"/><path d="m27 38 4 4 7-8" stroke="#ddc29c" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>아직 획득한 아이템이 없어요.</span><small>저택을 살펴보고 단서를 찾아보세요.</small></div>';
 let val=['foot','mirror','books','piano','film','water','light','blackout','clock','pin'].filter(done).length;$('completionText').textContent=val+'/10';$('completionFill').style.width=(val*10)+'%';$('objectiveText').textContent=objective();$('soundBtn').textContent=g.sound?'♫':'♪̸';
 let next=rooms[index+1];$('nextRoomBtn').classList.toggle('hidden',!next||!clearRoom(g.room));if(next)$('nextRoomBtn').textContent=`${meta[next][0]}으로 이동 →`;
 $('catAvatar').innerHTML=catSvg();save()}
function tick(){if(g)$('timerDisplay').textContent=pretty(elapsed())}
function move(r){if(!canEnter(r)){article('잠긴 문','이전 방의 필수 퍼즐을 마쳐야 합니다.');return}const prior=g.room;g.room=r;g.selected=null;if(prior!==r){const panel=$('sceneCanvas');panel.classList.remove('room-entering');void panel.offsetWidth;panel.classList.add('room-entering');}if(!g.visited.includes(r)){g.visited.push(r);notify('새 공간 · '+meta[r][0]);tone('gain')}let lines={foyer:'사진 속 인물은 누구였지?',study:'이 멜로디는 왜 이렇게 그리울까…',greenhouse:'꽃 향기가 익숙해. 누가 여기서 날 안고 있었어.',tower:'열두 번 울렸어… 열세 번째는 누가 울릴까?'};$('catDialog').textContent=lines[r];render()}
const hotspots={
 foyer:[{id:'invitation',x:27,y:40,name:'현관의 초대장',icon:'✉'},{id:'catbed',x:20,y:70,name:'고양이 침대',icon:'♧'},{id:'rug',x:47,y:83,name:'오래된 양탄자',icon:'⌕',ok:()=>done('rug')},{id:'cabinet',x:76,y:72,name:'황동 수납장',icon:'▣',ok:()=>done('foot')},{id:'crescent',x:54,y:35,name:'반쪽 달 장식',icon:'☾',ok:()=>done('mirror')},{id:'study',x:14,y:54,name:'서재 문',icon:'⌑'},{id:'cat',x:84,y:76,name:'미로',icon:'♣'}],
 study:[{id:'books',x:24,y:42,name:'계절 책장',icon:'▤',ok:()=>done('books')},{id:'portrait',x:47,y:30,name:'루나의 초상화',icon:'▧',ok:()=>has('film')},{id:'piano',x:74,y:77,name:'자동연주 피아노',icon:'♫',ok:()=>done('piano')},{id:'desk',x:38,y:78,name:'잠긴 서랍과 숫자 표',icon:'⌗',ok:()=>done('film')},{id:'greenhouse',x:91,y:56,name:'온실 문',icon:'⌑'},{id:'cat',x:79,y:57,name:'미로',icon:'♣'}],
 greenhouse:[{id:'record',x:21,y:30,name:'정원 재배 기록',icon:'▤'},{id:'water',x:25,y:73,name:'네 개의 급수관',icon:'◉',ok:()=>done('water')},{id:'beam',x:64,y:38,name:'채광과 반사 장치',icon:'◐',ok:()=>done('light')},{id:'flower',x:53,y:64,name:'달빛꽃',icon:'❀',ok:()=>done('light')},{id:'shutter',x:86,y:25,name:'채광창 손잡이',icon:'☾'},{id:'pot',x:76,y:75,name:'오래된 유리 화분',icon:'⌕',ok:()=>has('collar')},{id:'tower',x:91,y:56,name:'시계탑 입구',icon:'⌑'}],
 tower:[{id:'pedestal',x:23,y:75,name:'세 인장의 제단',icon:'❖'},{id:'clock',x:50,y:36,name:'거대한 시계',icon:'◷',ok:()=>done('clock')},{id:'keeper',x:19,y:33,name:'시계 관리 기록',icon:'▤'},{id:'pin',x:78,y:81,name:'붉은 고정쇠',icon:'⌁',ok:()=>done('pin')},{id:'portal',x:84,y:54,name:'마지막 문',icon:'✦',ok:()=>done('pin')},{id:'hall',x:94,y:87,name:'돌아가는 계단',icon:'⌑'}]
};
function inspect(id){if(g.ending){ending(g.ending);return}switch(id){
 case 'cat':talk();break;
 case 'invitation':clue('invitation');article('발신인 없는 초대장','달빛 저택으로 와 주세요.\n멈춘 시계가 다시 움직이기 전에 사라진 기억을 찾아주세요.\n\n서명은 비어 있다. 오래된 우편 장치의 금속 자국만 남아 있다.');break;
 case 'catbed':article('미로의 작은 침대','침대 아래에는 작은 고양이 발자국이 새겨져 있다. 옆 바닥에서 희미한 발자국이 양탄자 속으로 이어지는 것 같다.');break;
 case 'rug':rug();break;
 case 'cabinet':if(!done('foot'))foot();else if(!has('silverDisc')){item('silverDisc');item('lamp');item('brassKey');clue('lock9');modal('OPEN','열린 황동 수납장',`<div class="collect-visual">◐</div><div class="letter">은면 원판, 작은 등불, 황동 열쇠가 있다.\n수납장 안쪽 관리 기록: 「현관문 자동 잠금 · 매일 밤 9:00」</div>`)}else article('빈 수납장','안쪽 기록에는 현관이 밤 9시에 잠긴다고 쓰여 있다.');break;
 case 'crescent':mirror();break;
 case 'study':move('study');break;
 case 'books':books();break;
 case 'portrait':portrait();break;
 case 'piano':piano();break;
 case 'desk':desk();break;
 case 'greenhouse':move('greenhouse');break;
 case 'record':clue('water');clue('powder');article('달빛 온실 재배 기록','네 화분은 수위가 모두 달랐다.\n해의 관에는 세 번째 눈금까지 물때가 남아 있다.\n구름의 관은 막힌 채로 발견되었다.\n오래된 사진 속 별의 수위는 달보다 정확히 한 눈금 높다.\n\n달빛꽃은 낮에 빛을 머금고 어둠에서 가루가 빛난다.');break;
 case 'water':water();break;
 case 'beam':beam();break;
 case 'flower':article('달빛꽃',done('light')?'꽃잎이 빛나고 있다. 미로가 조용히 얼굴을 비빈다.\n「이 꽃도… 그 사람이 키웠던 걸까?」':'꽃은 물과 빛을 기다리는 듯 고개를 숙이고 있다.');break;
 case 'shutter':if(!done('light')){article('채광창','지금 채광창을 닫으면 달빛꽃에 빛을 보낼 수 없다. 먼저 빛을 돌려놓아야 할 것 같다.');break}g.flags.curtain=!g.flags.curtain;if(g.flags.curtain){g.flags.blackout=true;notify('온실이 어두워졌다. 바닥의 희미한 발자국이 반짝인다.')}else notify('채광창을 다시 열었다.');save();render();article('채광창',g.flags.curtain?'온실을 어둡게 하자 꽃가루가 고양이 발자국 모양으로 희미하게 빛난다. 발자국은 오래된 유리 화분으로 이어진다.':'창을 열자 달빛이 다시 방 안으로 들어온다.');break;
 case 'pot':if(!done('blackout')&&!g.flags.curtain){article('오래된 유리 화분','먼지가 두껍게 내려앉아 안쪽이 잘 보이지 않는다.');break}if(!has('collar')){g.flags.blackout=true;item('collar');modal('FOUND','은빛 목걸이',`<div class="collect-visual">◇</div><div class="letter">「미로, 나의 영원한 가족 — 루나」</div><p class="modal-description">이 물건은 미로가 버림받은 것이 아니라는 중요한 증거일지도 모른다.</p>`)}else article('빈 화분','목걸이가 놓여 있던 흔적만 남았다.');break;
 case 'tower':move('tower');break;
 case 'pedestal':article('인장의 제단',g.seals.length===3?'길·소리·빛의 세 인장이 홈에 들어간다. 시계의 동력이 돌아온 듯하다.':`인장은 ${g.seals.length}/3개 모였다. 모두 모아야 시계가 반응한다.`);break;
 case 'keeper':clue('clock');clue('pin');article('관리인의 기록','「현관이 잠긴 뒤, 분침이 사분원만큼 돌아간 밤. 시계는 갑자기 멈췄다.」\n\n「열두 번의 종은 고장 경보다. 진정한 재가동은 시계추가 움직일 때 자동으로 알린다.」\n\n「비상 제동용 붉은 고정쇠는 인장을 복구하고 시간을 맞춘 뒤 풀 것.」');break;
 case 'clock':clock();break;
 case 'pin':pin();break;
 case 'portal':if(done('pin'))finalChoices();else article('움직이지 않는 문','세 인장과 바늘만으로는 부족한 것 같다. 아직 추에 무언가 걸려 있다.');break;
 case 'hall':move('foyer');break;
 }}
function rug(){g.flags.rug=true;clue('track');modal('현관 홀 · 조사','들춰진 양탄자',`<p class="modal-description">먼지 속 작은 발자국이 이어진다. 타일 중간에는 방향이 다른 커다란 신발 자국도 섞여 있다.</p><div class="trail-grid">${Array.from({length:16},(_,i)=>{let p={0:'침대',1:'🐾',5:'🐾',6:'🐾',10:'종'};return `<div class="trail-cell ${[0,1,5,6,10].includes(i)?'pawmark':''}">${p[i]||([2,9,14].includes(i)?'⌑':'·')}</div>`}).join('')}</div><div class="investigation-actions"><button data-action="rug-pocket">접힌 안감도 조사한다</button></div><p class="puzzle-helper">발자국의 시작과 끝에 작은 상징이 있다. 큰 신발 자국은 오래된 흙자국처럼 보인다.</p>`);save()}
function foot(){g.activePuzzle='foot';if(done('foot')){article('열린 수납장','방향 자물쇠는 이미 풀려 있다.');return}modal('ROOM 01 · 퍼즐 1','네 번의 걸음',`<p class="modal-description">수납장 손잡이에 고양이 발자국과 네 방향의 작은 홈이 있다. 네 칸의 표시등은 아직 꺼져 있다.</p><div class="direction-pad">${[['↑','up'],['←','left'],['↓','down'],['→','right']].map(([t,v])=>`<button data-action="step-${v}" aria-label="${v}">${t}</button>`).join('')}</div><div class="puzzle-counter">${'●'.repeat(g.footInput.length)}${'○'.repeat(4-g.footInput.length)}</div><p class="puzzle-helper">현관의 다른 부분도 살펴볼 수 있다.</p>`)}
function step(v){if(done('foot'))return;let code={right:'R',left:'L',up:'U',down:'D'}[v];g.footInput+=code;tone();if(g.footInput.length===4){if(g.footInput==='RDRD'){g.flags.foot=true;g.activePuzzle='mirror';notify('수납장의 방향 자물쇠가 풀렸다!');tone('gain');render();modal('PUZZLE SOLVED','열리는 수납장',`<div class="collect-visual">⌑</div><p class="modal-description">철컥, 수납장의 걸쇠가 풀렸다. 수납장 안을 직접 조사해 보세요.</p>`);return}g.footInput='';error('걸쇠가 원래 위치로 돌아갔다.')}foot();save()}

const moonMirrors={A:[1,3],B:[1,1],C:[3,1],D:[3,4],E:[4,4]};
const moonBooks={
 '가을':['✦','◆'],'여름':['✿','◆'],'겨울':['✿','◈'],'자정':['❖','◈'],
 '봄':['❖','☾'],'미로':['♣','◇']
};
const moonBookNames=['봄','여름','가을','겨울','자정','미로'];
function traceMoonbeam(){
 const positions=Object.fromEntries(Object.entries(moonMirrors).map(([id,pos])=>[pos.join(','),id]));
 let x=-1,y=3,dx=1,dy=0,points=[[0,350]],visited=new Set();
 for(let n=0;n<35;n++){
  x+=dx;y+=dy;
  if(x<0||x>=5||y<0||y>=5){
   points.push([Math.max(0,Math.min(500,(x+.5)*100)),Math.max(0,Math.min(500,(y+.5)*100))]);
   return {points,solved:x===4&&y===-1};
  }
  points.push([(x+.5)*100,(y+.5)*100]);
  const id=positions[x+','+y];
  if(id){
   const slash=g.mirrorTiles[id]==='/';
   [dx,dy]=slash?[-dy,-dx]:[dy,dx];
  }
  const key=x+','+y+','+dx+','+dy;
  if(visited.has(key))break;
  visited.add(key);
 }
 return {points,solved:false};
}
function mirror(){
 g.activePuzzle='mirror';
 if(done('mirror')){article('완성된 달','갈라진 달 문양이 다시 밝게 빛난다. 길의 인장을 떼어낸 홈만 남았다.');return;}
 if(!has('silverDisc')||!has('lamp')){
  article('깨진 달 장식','문양 아래에는 은면이 결합되는 다섯 개의 받침이 있다. 한쪽 끝에는 등불을 끼울 홈이 보인다.');return;
 }
 g.mirrorTiles??={A:'\\',B:'/',C:'/',D:'/',E:'\\'};
 const result=traceMoonbeam(),coordinates=result.points.map(([x,y])=>x+','+y).join(' ');
 const tileEntries=Object.entries(moonMirrors).map(([id,[x,y]])=>
   '<button type="button" class="moonbeam-mirror" data-action="mirror-turn-'+id+'" style="grid-column:'+(x+1)+';grid-row:'+(y+1)+'" title="은면 '+id+' 돌리기" aria-label="은면 '+id+' 돌리기"><small>'+id+'</small><b>'+(g.mirrorTiles[id]==='/'?'╱':'╲')+'</b></button>'
 ).join('');
 modal('ROOM 01 · 퍼즐 2','빛이 잊은 길',
  '<p class="modal-description">수납장의 은면 원판을 분리하니 얇은 반사 조각 다섯 개가 나타났다. 오래된 벽 장식 아래에 누군가 작은 등불을 놓아두었다. 은면은 손가락으로 돌릴 수 있다.</p>'+
  '<div class="moonbeam-board" role="group" aria-label="은면 다섯 개가 놓인 빛의 장치">'+
  '<div class="moonbeam-squares">'+Array.from({length:25},(_,i)=>'<span></span>').join('')+'</div>'+
  '<div class="moonbeam-source" title="등불">✧</div><div class="moonbeam-destination" title="반쪽 달">☾</div>'+
  (g.lampOn?'<svg viewBox="0 0 500 500" preserveAspectRatio="none" aria-hidden="true"><polyline class="moonbeam-light-glow" points="'+coordinates+'"/><polyline class="moonbeam-light" points="'+coordinates+'"/></svg>':'')+
  tileEntries+'</div>'+
  '<div class="puzzle-buttons"><button data-action="mirror-switch">'+(g.lampOn?'등불 덮기':'등불 밝히기')+'</button></div>'+
  '<p class="puzzle-helper">장치의 가장자리에는 작은 그을음이 남아 있다. 은면마다 한쪽은 검게 변색되어 있다.</p>'
 );
}
function mirrorTurn(id){
 if(done('mirror')||!Object.hasOwn(moonMirrors,id))return;
 g.mirrorTiles[id]=g.mirrorTiles[id]==='/'?'\\':'/';
 tone('tap');save();if(g.lampOn&&traceMoonbeam().solved)return mirrorSolve();mirror();
}
function mirrorSwitch(){
 if(done('mirror'))return;
 g.lampOn=!g.lampOn;tone('tap');save();
 if(g.lampOn&&traceMoonbeam().solved)return mirrorSolve();
 mirror();
}
function mirrorSolve(){
 if(done('mirror'))return;
 g.flags.mirror=true;seal('path');
 solved('mirror','빛이 은면 사이를 몇 차례 꺾여 지나가자, 벽의 반쪽 달에 나머지 반쪽이 드러났습니다. 황동 벽장식 안쪽에서 길의 인장을 획득했습니다.');
}
function bookSides(name){
 const pair=moonBooks[name];
 return g.booksFlipped?.[name]?[pair[1],pair[0]]:pair;
}
function books(){
 g.activePuzzle='books';
 if(done('books')){article('움직인 서가','책등의 문양은 한 줄로 연결되어 있다. 안쪽 숨겨진 선반은 이미 열려 있다.');return;}
 g.booksFlipped??={};
 if(!Array.isArray(g.booksPlaced)||g.booksPlaced.length!==5)g.booksPlaced=[null,null,null,null,null];
 clue('dust');
 const slots=g.booksPlaced.map((name,i)=>'<div class="rune-book-slot '+(name?'filled':'')+'" data-slot="'+i+'">'+
   (name?'<button data-action="unbook-'+i+'" aria-label="'+name+' 책 꺼내기"><span class="rune-book-title">'+name+'</span><span class="rune-book-glyphs">'+bookSides(name).join(' — ')+'</span><small>꺼내기 ×</small></button>':
    '<div class="rune-book-placeholder"><small>0'+(i+1)+'</small>·</div>')+
  '</div>').join('');
 const options=moonBookNames.map(name=>'<div class="rune-book-card '+(g.booksPlaced.includes(name)?'book-in-shelf':'')+'">'+
   '<button draggable="true" data-book="'+name+'" data-action="book-'+name+'" '+(g.booksPlaced.includes(name)?'disabled':'')+'><b>'+name+'</b><span>'+bookSides(name).join(' → ')+'</span></button>'+
   '<button class="rune-flip" data-action="flip-'+name+'" aria-label="'+name+' 책 방향 바꾸기">↻ 뒤집기</button></div>').join('');
 modal('ROOM 02 · 퍼즐 3','서가에 남은 문장',
   '<p class="modal-description">오래된 서가가 텅 비어 있다. 책등에는 제목보다 작은 기호들이 눈에 띈다. 서가 양옆의 황동 장식은 서로 다른 모양으로 닳아 있다.</p>'+
   '<div class="rune-book-ends"><span>✦</span><small>서가의 낡은 홈</small><span>☾</span></div>'+
   '<div class="rune-book-shelf">'+slots+'</div>'+
   '<div class="rune-book-choices">'+options+'</div>'+
   '<p class="puzzle-helper">책을 고르거나 비어 있는 칸에 끌어다 놓을 수 있다. 책은 앞뒤로 돌려 볼 수 있다.</p>',
   [['배치 지우기','book-reset'],['서가의 걸쇠 확인','book-check',true,g.booksPlaced.some(x=>!x)]]
 );
}
function bookCheck(){
 if(done('books'))return;
 const solution=['가을','여름','겨울','자정','봄'];
 const valid=g.booksPlaced.join('/')===solution.join('/')&&
   solution.every((name,i)=>bookSides(name)[0]===(i===0?'✦':bookSides(solution[i-1])[1]))&&
   bookSides(solution.at(-1))[1]==='☾';
 if(!valid){error('서가 안쪽에서 둔탁한 소리가 들렸지만, 걸쇠는 움직이지 않았다.');books();return;}
 g.flags.books=true;item('roll');clue('roll');
 solved('books','책등의 문양이 하나의 길처럼 이어지자 서가가 천천히 뒤로 밀려났습니다. 숨겨진 칸에서 기계식 자동연주 원통을 발견했습니다.');
}

function portrait(){clue('portrait');modal('달빛 서재 · 초상화','희미한 얼굴',`<p class="modal-description">미로와 함께 앉은 어린 소녀가 그려져 있다. 아래 이름은 <b>루나</b>. 금빛 액자 틈이 다른 곳보다 조금 벌어져 있다.</p>${has('film')?'<div class="letter">액자 안쪽은 비어 있다.</div>':'<div class="investigation-actions"><button data-action="portrait-back">액자 뒷면을 살핀다</button></div>'}`)}

const rollPegs=[3,0,4,3]; // Maker: the engraved calibration notch corresponds to offset 4.
const noteFrequencies=[261.63,293.66,329.63,349.23,392,440];
function piano(){
 g.activePuzzle='piano';
 if(done('piano')){article('다시 연주하는 피아노','작은 피아노는 이제 루나의 자장가를 연주한다. 미로가 자리를 잡고 웅크린다.');return;}
 if(!has('roll')){article('기계식 피아노','반쯤 열린 황동 원통 장치는 비어 있다. 여섯 개의 건반 위에는 고정된 연주 손가락들이 매달려 있다.');return;}
 const offset=g.drumOffset||0;
 const dial=Array.from({length:6},(_,i)=>'<button class="roll-dial-stop '+(offset===i?'selected':'')+'" data-action="drum-'+i+'" aria-label="원통 눈금 '+(i+1)+'" title="원통 눈금 '+(i+1)+'">'+(i===4?'◇':i===0?'✦':'·')+'</button>').join('');
 const roll=rollPegs.map((pos,i)=>'<div class="roll-row">'+Array.from({length:6},(_,j)=>'<span class="'+(pos===j?'peg':'')+'">'+(pos===j?'●':'·')+'</span>').join('')+'</div>').join('');
 modal('ROOM 02 · 퍼즐 4','멈춘 자장가',
  '<p class="modal-description">나무 건반 위에는 원통을 붙잡는 황동 손가락이 달려 있다. 표면이 닳은 축에는 여섯 개의 걸림점이 있다. 원통의 작은 별과 장치 테두리의 다이아몬드 모양 흠집이 눈에 띈다.</p>'+
  '<div class="roll-sheet"><span class="roll-star">✦</span>'+roll+'</div>'+
  '<div class="roll-dial">'+dial+'</div>'+
  '<div class="puzzle-buttons"><button data-action="drum-play">원통 손잡이 감기 ♪</button></div>'+
  '<div class="piano-keys">'+Array.from({length:6},(_,i)=>'<button class="piano-key" data-action="key-'+i+'" aria-label="건반 '+(i+1)+'" title="건반 '+(i+1)+'"></button>').join('')+'</div>'+
  '<div class="puzzle-counter">'+('♪'.repeat(g.pianoInput.length))+('○'.repeat(4-g.pianoInput.length))+'</div>'+
  '<p class="puzzle-helper">손잡이를 돌리면 황동 손가락들이 네 번 움직인다. 건반 일부에는 오래된 손톱 자국이 남아 있다.</p>',
  [['건반에서 손 떼기','piano-reset']]
 );
}
function drumSet(i){if(!has('roll')||done('piano'))return;g.drumOffset=i;g.pianoInput=[];tone('tap');save();piano();}
function drumPlay(){
 if(!has('roll'))return;
 const sequence=rollPegs.map(x=>(x+(g.drumOffset||0))%6);
 // Sound is optional; the roll's teeth and the keys remain visually distinguishable.
 if(g.sound)try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  sequence.forEach((note,i)=>{
   const o=audio.createOscillator(),v=audio.createGain(),start=audio.currentTime+.05+i*.25;
   o.type='sine';o.frequency.value=noteFrequencies[note];
   v.gain.setValueAtTime(.0001,start);v.gain.exponentialRampToValueAtTime(.045,start+.015);v.gain.exponentialRampToValueAtTime(.0001,start+.22);
   o.connect(v);v.connect(audio.destination);o.start(start);o.stop(start+.24);
  });
 }catch(e){}
 notify('네 개의 황동 손가락이 순서대로 움직인다.');g.drumPlayed=true;save();
}
function keyPress(index){
 if(done('piano')||!has('roll')||!Number.isInteger(index)||index<0||index>5)return;
 g.pianoInput.push(index);tone('tap');
 if(g.pianoInput.length===4){
  const candidate=g.pianoInput.join(','),correct=rollPegs.map(x=>(x+4)%6).join(',');
  if(g.drumOffset===4&&candidate===correct){
   g.flags.piano=true;seal('echo');solved('piano','황동 손가락이 네 번 움직이고 피아노에서 작은 선율이 흘러나옵니다. 미로는 루나의 무릎 위에서 듣던 자장가를 떠올립니다. 소리의 인장을 획득했습니다.');return;
  }
  g.pianoInput=[];error('연주 장치가 흔들리다 멎는다. 원통의 맞물림 소리가 고르지 않다.');
 }
 save();piano();
}
// Optional paper-film device: a physical overlay, not an exposed four-digit PIN.
const filmMarks=['◇','⌑','○','☽','✦','◈','✧','▽','☼','♧','♢','✴','◉','△','◐','☆'];
const filmHoles=[1,6,12,15];
function filmWindows(){
 let indices=filmHoles.map(ix=>{
  let r=Math.floor(ix/4),c=ix%4;
  for(let t=0;t<g.filmRotate;t++){const nr=c,nc=3-r;r=nr;c=nc;}
  return r*4+c;
 });
 if(g.filmShift===1)indices=indices.map(ix=>(Math.floor(ix/4)*4+((ix%4+1)%4)));
 return indices;
}
function desk(){
 g.activePuzzle='film';
 if(done('film')){article('숨겨진 일기','열린 서랍 안에는 「미로에게 꼭 돌아갈게」라는 글과 사고 당시의 자동 기록이 남아 있다.');return;}
 const hasSheet=has('film'),windows=hasSheet&&g.filmShift!==-1?filmWindows():[];
 const starCorner=[0,3,15,12][g.filmRotate||0];
 const cells=filmMarks.map((mark,i)=>'<div class="film-number '+(windows.includes(i)?'window-number':windows.length?'covered-number':'')+'">'+mark+'</div>').join('');
 modal('ROOM 02 · 선택 퍼즐','서랍 위의 낡은 판',
  '<p class="modal-description">책상 유리 아래에 서로 다른 작은 무늬들이 새겨져 있다. 오른쪽 아래에는 별 모양이 희미하게 긁혀 있고, 유리 위에는 투명한 판의 가장자리와 비슷한 눌린 자국이 있다.</p>'+
  '<div class="film-workspace"><div class="film-board">'+cells+
  (hasSheet&&g.filmShift!==-1?'<span class="film-mark" style="left:'+((starCorner%4)*25+4)+'%;top:'+(Math.floor(starCorner/4)*25+2)+'%">✦</span>':'')+
  '</div>'+
  (hasSheet?'<div class="film-controls"><div class="film-state">얇은 투명 필름 · '+(g.filmShift===-1?'책상 옆':g.filmShift===0?'유리 위 중앙':'오른쪽으로 어긋난 위치')+'</div>'+
  '<button data-action="film-slide">필름 위치 바꾸기</button><button data-action="film-turn">필름 돌리기</button><button data-action="film-check">등불을 비춰 본다</button></div>':
  '<p class="puzzle-helper">유리 표면의 네 곳에는 유난히 먼지가 적다.</p>')+'</div>',
  [['돌아가기','close']]
 );
}
function filmCheck(){
 if(!has('film')||!has('lamp')){article('빛이 닿지 않는 유리','다른 빛이 필요할 것 같다.');return;}
 if(g.filmRotate===2&&g.filmShift===0){
  g.flags.film=true;item('diary');clue('story');
  solved('film','필름의 창을 통과한 빛이 책상 아래 숨은 감광 장치를 건드립니다. 서랍이 열리고 루나의 일기와 사고 기록이 드러났습니다.');return;
 }
 error('필름 아래로 엷은 그림자가 생겼지만 서랍에서는 아무 소리도 들리지 않는다.');desk();
}


const greenhouseGlyphs=['☀','☾','✦','☁'];
function water(){
 g.activePuzzle='water';
 if(done('water')){article('흐르는 급수관','물을 채운 뒤 낡은 제어부가 열렸고, 바닥을 따라 작은 물길이 흐른다.');return;}
 if(!Array.isArray(g.waterValues)||g.waterValues.length!==4||g.waterValues.reduce((a,b)=>a+b,0)!==6)g.waterValues=[1,2,1,2];
 const tanks=greenhouseGlyphs.map((icon,i)=>
  '<div class="water-plant"><div class="plant-icon">'+icon+'</div><div class="water-meter">'+Array.from({length:3},(_,j)=>'<span class="'+(3-j<=g.waterValues[i]?'on':'')+'"></span>').join('')+'</div><div class="water-value">'+g.waterValues[i]+'</div></div>'
 ).join('');
 const gates=[0,1,2].map(i=>'<div class="water-gate"><button data-action="sluice-'+i+'-right" aria-label="'+(i+1)+'번째 관에서 다음 관으로 물 넘기기">→</button><button data-action="sluice-'+i+'-left" aria-label="'+(i+2)+'번째 관에서 이전 관으로 물 넘기기">←</button></div>').join('');
 modal('ROOM 03 · 퍼즐 6','녹슨 수문',
  '<p class="modal-description">유리 수조 네 개는 옆 수조와 가느다란 황동 관으로 이어져 있다. 물은 수조 밖으로 버릴 수 없고, 한쪽 밸브가 열리면 이웃 수조 쪽으로만 흐른다. 수조마다 눈금은 세 개뿐이다.</p>'+
  '<div class="hydro-puzzle"><div class="water-row">'+tanks+'</div><div class="water-gates">'+gates+'</div></div>'+
  '<p class="puzzle-helper">각 수조의 안쪽에는 서로 다른 오래된 물때가 남아 있다. 구름 그림 아래 관 끝에는 물기가 없다.</p>',
  [['잠금쇠 만져 보기','water-check',true]]
 );
}
function sluiceMove(index,dir){
 if(done('water'))return;
 if(!Number.isInteger(index)||index<0||index>2)return;
 if(!Array.isArray(g.waterValues)||g.waterValues.reduce((a,b)=>a+b,0)!==6)g.waterValues=[1,2,1,2];
 const from=dir==='right'?index:index+1,to=dir==='right'?index+1:index;
 if(g.waterValues[from]===0){notify('빈 수조에서 물은 흐르지 않는다.');return;}
 if(g.waterValues[to]===3){notify('그쪽 수조는 이미 가득 차 있다.');return;}
 g.waterValues[from]--;g.waterValues[to]++;tone('tap');save();water();
}
function waterCheck(){
 if(g.waterValues.join(',')!=='3,1,2,0'){
  error('수문 아래의 황동 잠금쇠가 조금 움직이다 멈춘다.');water();return;
 }
 g.flags.valves=true;solved('water','물이 네 수조를 거쳐 흐르자 온실의 물줄기가 다시 살아납니다. 채광 장치에 걸려 있던 황동 걸쇠가 풀렸습니다.');
}
// Two stained-glass masks overlap to make a five-point light pattern.
// Unlike the foyer puzzle, the aim is a projected silhouette, not ray routing.
const glassPatterns={
 A:[0,2,6,7,8,12,13,16,17,21,23],
 B:[2,3,4,6,8,11,12,15,17,19,20],
 target:[2,6,8,12,17]
};
function projectGlass(cells,setting){
 let points=cells.map(i=>[i%5,Math.floor(i/5)]);
 for(let turn=0;turn<setting.r;turn++)points=points.map(([x,y])=>[4-y,x]);
 return points.map(([x,y])=>[x+setting.x,y]).filter(([x,y])=>x>=0&&x<5&&y>=0&&y<5).map(([x,y])=>y*5+x);
}
function glassOutput(){
 const aa=new Set(projectGlass(glassPatterns.A,g.glassA)),bb=new Set(projectGlass(glassPatterns.B,g.glassB));
 return [...aa].filter(x=>bb.has(x)).sort((a,b)=>a-b);
}
function glassGrid(cells,mode){
 const set=new Set(cells);
 return '<div class="glass-tiles '+mode+'">'+Array.from({length:25},(_,i)=>'<span class="'+(set.has(i)?'lit':'')+'">'+(set.has(i)?'✧':'')+'</span>').join('')+'</div>';
}
function beam(){
 g.activePuzzle='light';
 if(done('light')){article('꽃에 닿은 달빛','채광 장치 안쪽에 얇은 색유리 두 장이 나란히 끼워져 있다. 겹쳐진 빛이 달빛꽃 위에 머문다.');return;}
 if(!done('water')){article('움직이지 않는 채광창','수문 장치와 맞물린 황동 걸쇠가 창틀을 붙잡고 있다.');return;}
 if(!has('silverDisc')){article('비어 있는 원판 받침대','온실의 채광창 한쪽에 둥근 반사판을 놓았던 먼지 자국이 있다.');return;}
 if(!g.glassA||!g.glassB){g.glassA={r:1,x:-1};g.glassB={r:2,x:1};}
 const out=glassOutput();
 const renderControls=(which,conf)=>'<div class="glass-filter"><div class="glass-filter-heading"><b>유리판 '+which+'</b><small>가운데 홈에 손가락 자국이 있다.</small></div>'+
   glassGrid(projectGlass(glassPatterns[which],conf),'filter-'+which.toLowerCase())+
   '<div class="glass-controls"><button data-action="glass-'+which+'-left" aria-label="'+which+' 유리판 왼쪽">←</button><button data-action="glass-'+which+'-turn" aria-label="'+which+' 유리판 회전">↻</button><button data-action="glass-'+which+'-right" aria-label="'+which+' 유리판 오른쪽">→</button></div></div>';
 modal('ROOM 03 · 퍼즐 7','꽃에 내려앉은 그림자',
  '<p class="modal-description">얇은 유리판 두 장에는 작은 투명한 틈들이 나 있다. 창틀 뒤의 달빛이 틈을 통과하면 꽃잎 위로 밝은 점들이 생긴다. 먼지 때문에 유리판을 천천히 움직일 수 있다.</p>'+
  '<div class="glass-machine"><div class="glass-panes">'+renderControls('A',g.glassA)+renderControls('B',g.glassB)+'</div>'+
  '<div class="glass-projection"><div class="glass-projection-caption">꽃 위의 달빛</div>'+glassGrid(out,'projection')+'</div></div>'+
  '<p class="puzzle-helper">꽃잎의 각 부분에는 색이 다른 작은 자국들이 남아 있다.</p>',
  [['채광 장치 고정하기','beam-check',true]]
 );
}
function glassMove(which,act){
 if(done('light')||!['A','B'].includes(which))return;
 const target=which==='A'?g.glassA:g.glassB;
 if(!target)return;
 if(act==='turn')target.r=(target.r+1)%4;
 else if(act==='left')target.x=Math.max(-1,target.x-1);
 else if(act==='right')target.x=Math.min(1,target.x+1);
 tone('tap');save();beam();
}
function beamCheck(){
 const actual=glassOutput().join(',');
 if(actual!==glassPatterns.target.join(',')){
  error('꽃잎의 한쪽에는 빛이 닿지만, 다른 곳은 여전히 어둡다.');beam();return;
 }
 g.flags.light=true;seal('light');
 solved('light','겹쳐진 두 유리판 사이로 다섯 갈래의 달빛이 꽃잎에 내려앉습니다. 꽃이 피어나고 빛의 인장을 획득했습니다. 흔들린 꽃술에서 작은 은빛 가루가 떨어집니다.');
}

function clock(){g.activePuzzle='clock';if(done('clock')){article('시계가 맞춰졌다','바늘은 9시 15분을 가리킨다. 제어부의 열두 표시등이 모두 켜졌지만 추는 여전히 멈춰 있다.');return}let minuteRot=g.minute*6,hourRot=g.hour*30+g.minute*.5;modal('ROOM 04 · 퍼즐 9','시계를 되돌릴 시각',`<p class="modal-description">세 인장을 제단에 끼우자 큰 시계의 바늘을 움직일 수 있게 되었다. 시계 바늘은 5분 간격으로 조정된다.</p><div class="clock-visual"><span class="clock-numeral n12">12</span><span class="clock-numeral n3">3</span><span class="clock-numeral n6">6</span><span class="clock-numeral n9">9</span><div class="clock-hand hour" style="transform:rotate(${hourRot}deg)"></div><div class="clock-hand minute" style="transform:rotate(${minuteRot}deg)"></div><div class="clock-pin"></div></div><div class="clock-controls"><div><label>시침</label><button class="small-adjust" data-action="clock-hour-minus">−</button><strong>${g.hour}</strong><button class="small-adjust" data-action="clock-hour-plus">＋</button></div><div><label>분침</label><button class="small-adjust" data-action="clock-minute-minus">−</button><strong>${String(g.minute).padStart(2,'0')}</strong><button class="small-adjust" data-action="clock-minute-plus">＋</button></div></div><div class="night-switch"><button class="${g.night?'active':''}" data-action="clock-night">${g.night?'☾ 밤':'☀ 낮'}</button></div>`,[['시계 고정하기','clock-check',true]])}
function clockCheck(){if(g.hour!==9||g.minute!==15||!g.night){error('시계 내부에서 톱니가 걸리는 소리가 난다.');clock();return}g.flags.clock=true;solved('clock','바늘이 밤 9시 15분에서 멈춥니다. 열두 개의 경보등이 켜지지만 시계추는 아직 움직이지 않습니다.')}
function pin(){g.activePuzzle='pin';if(done('pin')){article('해제된 비상 고정쇠','이제 시계 추가 일정한 속도로 흔들린다. 열세 번째 종소리가 이미 울렸다.');return}if(!done('clock')){article('붉은 고정쇠','고정쇠는 잠겨 있다. 제단에는 세 인장을 끼울 수 있지만 시계 바늘이 아직 정확한 곳에 놓이지 않았다.');return}modal('ROOM 04 · 퍼즐 10','마지막으로 남은 장애물',`<p class="modal-description">열두 개의 표시등이 차례로 켜졌지만 종소리는 멈췄다. 제어반의 버튼을 눌러도 반응이 없다.</p><div class="pendulum"><div class="pendulum-rod"></div><div class="pendulum-weight"></div><div class="pendulum-lock">붉은 비상 고정쇠</div></div><div class="puzzle-buttons"><button data-action="pin-push">종 울리기 버튼 누르기</button><button data-action="pin-pull">붉은 고정쇠 잡아당기기</button></div>`)}
function pinPull(){g.flags.pin=true;clue('story');tone('bell');solved('pin','붉은 고정쇠를 뺀 순간 시계추가 움직입니다. 열세 번째 종이 울리고 저택의 창문이 환하게 빛납니다. 이것은 고장 경보가 아니라 시간을 다시 흐르게 한 첫 번째 정상 종소리였습니다. 탑 아래의 비상 우편 장치가 자동으로 보낸 초대장이 발신인 없는 편지였다는 사실도 밝혀집니다.')}
function finalChoices(){if(!done('pin'))return;let n=['photo','diary','collar'].filter(has).length;modal('THE FINAL DOOR','마지막 선택',`<p class="modal-description">새벽의 빛이 문틈 사이로 들어옵니다. 미로는 문을 바라보다 조심스럽게 묻습니다.</p><p class="story-voice">“나, 정말 이 문 밖으로 나가도 되는 걸까?”</p><div class="ending-choices"><button class="ending-choice" data-action="ending-normal"><div><strong>혼자 새벽을 맞는다</strong><span>저택을 혼자 떠난다.</span></div>→</button><button class="ending-choice" data-action="ending-true" ${n<3?'disabled':''}><div><strong>미로에게 잊힌 약속을 알려준다</strong><span>${n===3?'사진·일기·목걸이가 모두 모였다.':'기억의 물건 '+n+'/3 · 사진, 일기, 목걸이'}</span></div>✦</button><button class="ending-choice" data-action="ending-stay"><div><strong>미로와 저택에 남는다</strong><span>열린 문을 닫고 이곳에서 함께 지낸다.</span></div>☾</button></div>`,[['아직 조사하기','close']])}
const endings={normal:['혼자 맞는 새벽','당신은 문을 열고 혼자 밖으로 나옵니다. 뒤를 돌아보면 저택의 창가에 작은 미로의 실루엣이 보입니다. 새벽은 왔지만 그 약속은 완성되지 못했습니다.'],true:['함께 맞는 새벽','당신은 사진과 일기, 은빛 목걸이를 미로에게 보여줍니다. "루나는 널 버리지 않았어." 미로는 루나와 함께 지내던 날들을 기억해 냅니다. 밖에서 오랜 시간이 흘러 어른이 된 루나가 문 앞에 서 있습니다. 둘은 마침내 다시 만납니다.'],stay:['영원한 밤의 친구','당신은 열린 문을 조용히 닫습니다. 시간은 다시 흘러가지만 저택에서 밤을 보내기로 합니다. 미로가 곁에 웅크립니다. 두 사람은 더 이상 혼자가 아닙니다.']};
function finish(id){if(id==='true'&&!['photo','diary','collar'].every(has)){error('기억의 물건이 부족합니다.');return}g.ending=id;try{let o=JSON.parse(store.getItem(HISTORY)||'[]');if(!o.includes(id))o.push(id);store.setItem(HISTORY,JSON.stringify(o))}catch(e){}tone('bell');save();ending(id)}
function ending(id){let [title,copy]=endings[id];modal('EPISODE 01 · COMPLETE',title,`<div class="ending-crown">${id==='normal'?'☀':id==='true'?'✦':'☾'}</div><p class="ending-copy">${copy}</p><div class="result-stats"><div><small>플레이 시간</small><b>${pretty(elapsed())}</b></div><div><small>힌트</small><b>${g.hintsUsed}회</b></div><div><small>기억의 물건</small><b>${['photo','diary','collar'].filter(has).length}/3</b></div></div>`,[['시작 화면','home'],['새로 시작','really-new',true]])}
function journal(tab='clues'){let html=tab==='clues'?g.clues.map(id=>`<div class="journal-row"><div><b>${clueText[id][0]}</b><p>${clueText[id][1]}</p></div></div>`).join(''):tab==='items'?g.inventory.map(id=>`<div class="journal-row"><div><b>${items[id][1]}</b><p>${items[id][2]}</p></div></div>`).join(''):Object.keys(hints).map(id=>`<div class="journal-row"><div><b>${id} — ${done(id)?'해결':'미해결'}</b></div></div>`).join('');modal('EXPLORER’S JOURNAL','탐험 수첩',`<div class="journal-tabs">${[['clues','기록'],['items','아이템'],['progress','진행']].map(([id,n])=>`<button class="journal-tab ${id===tab?'selected':''}" data-action="journal-${id}">${n}</button>`).join('')}</div><div class="journal-list">${html||'아직 발견하지 못했다.'}</div>`)}
function hint(){let id=g.activePuzzle;if(done(id))id=({foyer:!done('foot')?'foot':'mirror',study:!done('books')?'books':!done('piano')?'piano':'film',greenhouse:!done('water')?'water':!done('light')?'light':'blackout',tower:!done('clock')?'clock':'pin'})[g.room];let used=g.hintLevels[id]||0;modal('MIRO’S HELP','미로의 힌트',`<p class="modal-description">${id} 퍼즐의 힌트 · ${used}/3단계 열람</p>${used?`<div class="hint-card">${hints[id][used-1]}</div>`:''}`,used>=3?[['닫기','close',true]]:[['돌아가기','close'],['다음 힌트 보기','hint-'+id,true]])}
function hintMore(id){g.hintLevels[id]=Math.min(3,(g.hintLevels[id]||0)+1);g.hintsUsed++;save();modal('HINT '+g.hintLevels[id]+'/3','미로의 조언',`<div class="hint-card">${hints[id][g.hintLevels[id]-1]}</div>`,g.hintLevels[id]===3?[['닫기','close',true]]:[['닫기','close'],['다음 단계','hint-'+id,true]])}
function talk(){let lines={foyer:['이 집에는 출입문이 너무 많아. 하지만 난 양탄자가 좋아.','수납장에서는 뭔가 반짝이는 냄새가 나.'],study:['루나는 책등의 무늬로 비밀 이야기를 만들었지.','저 책 중 하나는 내가 혼자 꽂아 둔 거야. 어디더라?'],greenhouse:['꽃이 피면 아주 예쁜 일이 생길 거야.','어두우면 더 잘 보이는 것도 있대.'],tower:['열두 번의 종소리는 늘 무서웠어.','나는 왜 자꾸 누군가를 기다리는 것 같지?']};let a=lines[g.room];$('catDialog').textContent=a[(catTurns++)%a.length];tone()}
function menu(){modal('PAUSE','탐험 메뉴',`<p class="modal-description">진행 내용은 자동 저장됩니다. 실시간 플레이 기록: ${pretty(elapsed())}</p>`,[['계속 탐험','close',true],['시작 화면','home']])}
function handle(action){if(action==='close')return hide();if(action==='home')return home();if(action==='really-new')return begin();if(action==='new-confirm')return modal('NEW GAME','처음부터 시작할까요?',`<p class="modal-description">이번 버전의 진행 데이터가 초기화됩니다.</p>`,[['취소','close'],['새로 시작','really-new',true]]);
if(action.startsWith('step-'))return step(action.slice(5));if(action==='rug-pocket'){if(!has('photo'))item('photo');return modal('FOUND','오래된 사진',`<div class="collect-visual">▧</div><div class="letter">어린 미로와 루나가 함께 찍혀 있다.\n\n「우린 언제나 함께야」</div>`)}
if(action.startsWith('mirror-turn-'))return mirrorTurn(action.slice(12));if(action==='mirror-switch')return mirrorSwitch();
if(action.startsWith('flip-')){let name=action.slice(5);if(Object.hasOwn(moonBooks,name)){g.booksFlipped??={};g.booksFlipped[name]=!g.booksFlipped[name];save();return books()}}
if(action.startsWith('book-')){let name=action.slice(5);if(name==='reset'){g.booksPlaced=[null,null,null,null,null];save();return books()}if(name==='check')return bookCheck();if(Object.hasOwn(moonBooks,name)&&!g.booksPlaced.includes(name)){let slot=g.booksPlaced.indexOf(null);if(slot>=0){g.booksPlaced[slot]=name;save();}}return books()}
if(action.startsWith('unbook-')){let slot=Number(action.slice(7));if(Number.isInteger(slot)&&slot>=0&&slot<5){g.booksPlaced[slot]=null;save()}return books()}
if(action==='portrait-back'){item('film');return modal('FOUND','별 구멍이 난 투명 필름',`<div class="collect-visual">▧</div><p class="modal-description">액자 뒷면에서 투명한 얇은 판이 나옵니다. 네 곳에 작은 구멍이 뚫려 있고 한쪽 모서리에 별이 있습니다.</p>`)}
if(action.startsWith('drum-')&&action!=='drum-play')return drumSet(Number(action.slice(5)));if(action==='drum-play')return drumPlay();if(action.startsWith('key-'))return keyPress(Number(action.slice(4)));if(action==='piano-reset'){g.pianoInput=[];save();return piano()}
if(action==='film-turn'){g.filmRotate=(g.filmRotate+1)%4;save();return desk()}if(action==='film-slide'){g.filmShift=g.filmShift===-1?0:g.filmShift===0?1:-1;save();return desk()}if(action==='film-check')return filmCheck();
if(action==='water-check')return waterCheck();if(action.startsWith('sluice-')){const p=action.split('-');return sluiceMove(Number(p[1]),p[2])}
if(action.startsWith('glass-')){const p=action.split('-');return glassMove(p[1],p[2])}if(action==='beam-check')return beamCheck();
if(action.startsWith('clock-')){let p=action.split('-');if(p[1]==='night')g.night=!g.night;else if(p[1]==='hour')g.hour=((g.hour-1+(p[2]==='plus'?1:11))%12)+1;else if(p[1]==='minute')g.minute=(g.minute+(p[2]==='plus'?5:55))%60;else if(p[1]==='check')return clockCheck();return clock()}
if(action==='pin-push'){error('버튼을 눌러도 시계추는 움직이지 않는다.');return pin()}if(action==='pin-pull')return pinPull();if(action.startsWith('ending-'))return finish(action.slice(7));if(action.startsWith('journal-'))return journal(action.slice(8));if(action.startsWith('hint-'))return hintMore(action.slice(5));}
function catSvg(){return `<svg class="miro-portrait" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="미로"><defs><radialGradient id="miro-halo"><stop stop-color="#8c81b4" stop-opacity=".8"/><stop offset="1" stop-color="#303653" stop-opacity=".25"/></radialGradient><linearGradient id="miro-fur" x1="0" x2=".8" y2="1"><stop stop-color="#fff2df"/><stop offset=".65" stop-color="#e9ddd0"/><stop offset="1" stop-color="#c7c9d0"/></linearGradient></defs><circle cx="60" cy="60" r="56" fill="url(#miro-halo)"/><circle cx="92" cy="25" r="3" fill="#e8ca95"/><path d="m26 21 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#e9c895" opacity=".8"/><g class="miro-tail"><path d="M90 88c21-3 25-23 15-26-9-3-15 5-14 10" fill="none" stroke="#cacbd2" stroke-width="13" stroke-linecap="round"/><path d="M103 63c-4-1-8 1-10 4" fill="none" stroke="#a6aaba" stroke-width="3" stroke-linecap="round"/></g><path d="M27 110c-3-18 11-29 33-29s37 12 34 29" fill="#f3e6d6" stroke="#807a8e" stroke-width="2"/><path d="m20 55-2-35c0-7 6-9 11-5l18 17a45 45 0 0 1 25 0l18-17c5-4 11-2 11 5l-2 35c3 29-15 45-40 45S17 84 20 55Z" fill="url(#miro-fur)" stroke="#7e7a8a" stroke-width="2.8" stroke-linejoin="round"/><path d="m24 26 2 24 19-12Z" fill="#dba9aa" opacity=".75"/><path d="m96 26-2 24-19-12Z" fill="#dba9aa" opacity=".75"/><path d="M30 45c10-7 19-9 30-8 11-1 20 1 30 8" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/><g class="miro-eyes"><ellipse cx="42" cy="67" rx="10" ry="12" fill="#fff9ee"/><ellipse cx="77" cy="67" rx="10" ry="12" fill="#fff9ee"/><ellipse cx="43" cy="67" rx="5.5" ry="8.5" fill="#4b4b62"/><ellipse cx="77" cy="67" rx="5.5" ry="8.5" fill="#4b4b62"/><circle cx="45" cy="64" r="2.1" fill="#fff"/></g><ellipse cx="29" cy="79" rx="8" ry="4" fill="#e8a6aa" opacity=".5"/><ellipse cx="91" cy="79" rx="8" ry="4" fill="#e8a6aa" opacity=".5"/><path d="m55 78 5 4 5-4Z" fill="#ca9299"/><path d="M60 82c-2 6-5 7-9 4m9-4c2 6 5 7 9 4" fill="none" stroke="#99777e" stroke-width="2.3" stroke-linecap="round"/><path d="m33 82-16-2m17 6-14 3m67-7 16-2m-17 6 14 3" stroke="#b0a4a5" stroke-width="1.5" stroke-linecap="round"/><path d="M42 94c11 8 26 8 36 0l-6 14H49Z" fill="#bca3bc"/><path d="m51 98 9 7 9-7" stroke="#e5cc92" stroke-width="2" fill="none"/><circle cx="60" cy="105" r="3.5" fill="#f0d393"/></svg>`}

// Room artwork from the existing v2.0 3D/2D edition.
  const sharedSvg = `<defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4c5278"/><stop offset="1" stop-color="#303a61"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#5c4968"/><stop offset="1" stop-color="#2c2a4a"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#87b9c5" stop-opacity=".35"/><stop offset="1" stop-color="#acc5d2" stop-opacity=".06"/></linearGradient><radialGradient id="moon"><stop stop-color="#fff5db"/><stop offset="1" stop-color="#efd2a0"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="12"/></filter></defs>`;
  function artFrame(content,wall='#354063',floor='#443955'){return `<svg viewBox="0 0 1200 650" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sharedSvg}<rect width="1200" height="650" fill="${wall}"/><rect x="0" y="0" width="1200" height="395" fill="url(#wall)" opacity=".55"/><path d="M0 393H1200V650H0Z" fill="${floor}"/><path d="M0 395H1200" stroke="#ad8f8b" stroke-width="13"/><path d="M0 432H1200" stroke="#262b4c" stroke-width="4"/>${content}<rect x="18" y="16" width="1164" height="618" fill="none" stroke="#f2d0a5" stroke-opacity=".2" stroke-width="3" rx="16"/></svg>`;}
  const doorSvg=(x,y,w,h,type='brown')=>{const color=type==='gold'?'#d1a57b':type==='teal'?'#467885':'#716078';return `<g><path d="M${x} ${y+h}V${y+32}Q${x+w/2} ${y-35} ${x+w} ${y+32}V${y+h}Z" fill="#22263f" stroke="#bfa386" stroke-width="10"/><path d="M${x+13} ${y+h-7}V${y+37}Q${x+w/2} ${y-9} ${x+w-13} ${y+37}V${y+h-7}Z" fill="${color}"/><path d="M${x+32} ${y+86}H${x+w-32}V${y+h-46}H${x+32}Z" fill="none" stroke="#dac19a" stroke-opacity=".4" stroke-width="5"/><circle cx="${x+w-36}" cy="${y+h*.61}" r="7" fill="#ffdaa0"/></g>`;};
  const sceneArt={
    foyer:()=>artFrame(`
      <path d="M0 58H1200M0 95H1200M0 380H1200" stroke="#ad9a9e" stroke-opacity=".33" stroke-width="10"/><g opacity=".42"><path d="M80 100V380M300 100V380M600 100V380M900 100V380M1110 100V380" stroke="#ded0cc" stroke-width="9"/></g>
      <g><path d="M30 0H1170L1110 49H90Z" fill="#303553"/><path d="M370 0v48m450-48v48" stroke="#d4b998" stroke-width="10"/><g transform="translate(600 65)"><path d="M0-18V-54" stroke="#edcf95" stroke-width="5"/><path d="M-50 0H50L28 47H-28Z" fill="#f1c782" opacity=".7"/><circle r="14" fill="#f3e0af"/></g></g>
      ${doorSvg(64,174,210,225)}${doorSvg(947,165,192,232,'teal')}${doorSvg(492,126,240,329,'gold')}
      <path d="M510 154Q614 72 714 154" stroke="#e5c394" fill="none" stroke-width="8"/><circle cx="614" cy="231" r="31" fill="#3b3555" stroke="#d7b47e" stroke-width="7"/><path d="M614 205v25l16 10" stroke="#e6d3b2" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M325 201h150v135H325z" fill="#c19a80" stroke="#efd3aa" stroke-width="8"/><path d="M343 217h114v103H343z" fill="#6c6080"/><path d="M375 242q25-18 48 0m-46 36q22-14 44 0" stroke="#f4d6a6" fill="none" stroke-width="4"/><path d="M347 358h108v18H347z" fill="#b18d77"/>
      <g><path d="M788 392h147v167H788z" fill="#67516b" stroke="#aa8c81" stroke-width="7"/><path d="M808 414h107v52H808zM808 477h107v59H808z" fill="#4a486b" stroke="#aa918b" stroke-width="5"/><circle cx="858" cy="441" r="6" fill="#f3cf94"/><circle cx="858" cy="500" r="6" fill="#f3cf94"/><path d="M773 383h176v17H773z" fill="#b29083"/></g>
      <path d="M290 564Q600 496 816 567L778 628H340Z" fill="#95707c" stroke="#d2af9a" stroke-width="5"/><path d="M335 571Q600 521 782 577L754 609H365Z" stroke="#ead0af" stroke-width="3" stroke-dasharray="10 9" fill="none"/>
      <g transform="translate(1080 505)"><ellipse cx="0" cy="81" rx="65" ry="19" fill="#161d35" opacity=".3"/><path d="M-48 71q-29-30-8-60l12 11 20-10 20 10L9 10q27 28 3 61z" fill="#f0dfc5"/><path d="M-22 15-8-9 3 22M-57 16-50-8-36 21" fill="#f0dfc5"/><ellipse cx="-36" cy="43" rx="4" ry="6" fill="#4e4865"/><ellipse cx="-10" cy="43" rx="4" ry="6" fill="#4e4865"/><path d="M-26 53l4 3 4-3" fill="none" stroke="#d79496" stroke-width="3"/><path d="M10 66q42-22 25-61" fill="none" stroke="#f0dfc5" stroke-width="13" stroke-linecap="round"/></g>
      <g opacity=".7"><path d="M102 120h88m826 0h100" stroke="#eacb99" stroke-width="5"/><circle cx="145" cy="147" r="12" fill="#f8dc9d"/><circle cx="1062" cy="147" r="12" fill="#f8dc9d"/></g>`),
    study:()=>artFrame(`
      <path d="M0 90H1200" stroke="#d1b49c" stroke-opacity=".35" stroke-width="16"/><path d="M60 125H482V550H60Z" fill="#5a455d" stroke="#bfa084" stroke-width="13"/><g>${[170,280,388,492].map(y=>`<rect x="78" y="${y}" width="382" height="11" fill="#ad866e"/>`).join('')}${Array.from({length:4},(_,row)=>Array.from({length:16},(_,i)=>{let x=83+i*23,y=178+row*106,c=['#bd7886','#7c8ca0','#d9af7e','#8175a6','#9bb5a4'][(i*7+row)%5];return `<rect x="${x}" y="${y}" width="${18+(i%3)}" height="${78-(i*3%24)}" fill="${c}" rx="3" stroke="#493e60" stroke-width="2"/>`;}).join('')).join('')}</g>
      <path d="M555 152h145v165H555z" fill="#c49c83" stroke="#e1c3a7" stroke-width="9"/><path d="M571 166h113v133H571z" fill="#5f5b7c"/><circle cx="626" cy="224" r="27" fill="#e3c59c"/><path d="M611 222l5-14 11 10 11-9 8 14v28h-36z" fill="#f8ead1"/>
      <path d="M784 128h174v193H784z" fill="#a89caf" stroke="#e1c5a5" stroke-width="10"/><path d="M804 145h135v158H804z" fill="#f0dfc7"/><path d="M827 172h89M827 191h89M827 213h89M827 234h89M827 257h71" stroke="#bd9b93" stroke-width="3"/><path d="M828 197l15-12 15 19 15-9 15 10" fill="none" stroke="#826a86" stroke-width="3"/>
      <g><path d="M610 425Q794 371 1012 440L1012 536Q796 508 601 547Z" fill="#272941" stroke="#c19b83" stroke-width="9"/><path d="M637 449Q794 408 975 452V492Q799 464 637 500Z" fill="#f1dfc0"/><path d="M645 449V498M666 447V495M686 442V492M708 438V486M731 433V481M756 429V476M782 427V472M807 425V473M832 427V473M857 431V475M881 434V478M906 439V483M930 442V486M954 449V489" stroke="#3b3552" stroke-width="4"/><path d="M684 524v75m278-75v75" stroke="#ad8c77" stroke-width="13"/></g>
      <path d="M333 468h242v89H333z" fill="#765870" stroke="#be9b85" stroke-width="8"/><path d="M365 493h176v39H365z" fill="#4b4567" stroke="#a78a80" stroke-width="5"/><circle cx="455" cy="514" r="8" fill="#f2c98e"/><path d="M346 552v73m206-73v73" stroke="#b49081" stroke-width="14"/>
      ${doorSvg(1080,161,100,325)}
      <g><path d="M38 560h1018" stroke="#292943" stroke-width="7"/><ellipse cx="760" cy="614" rx="360" ry="20" fill="#11192d" opacity=".18"/></g>`),
    greenhouse:()=>artFrame(`
      <path d="M0 0H1200V394H0z" fill="#294e60"/><path d="M0 0L600 320 1200 0M0 80L600 320 1200 80" fill="none" stroke="#a3b7b7" stroke-width="18" opacity=".45"/><path d="M40 15h1120v376H40z" fill="url(#glass)" stroke="#9caeb7" stroke-width="12"/><path d="M240 15v375M460 15v375M680 15v375M900 15v375" stroke="#b2bbc0" stroke-width="12" opacity=".55"/>
      <circle cx="812" cy="96" r="52" fill="url(#moon)"/><circle cx="812" cy="96" r="73" fill="#fff1c1" opacity=".14" filter="url(#glow)"/>
      <path d="M140 155h214v184H140z" fill="#f0e1c4" stroke="#987e80" stroke-width="11"/><path d="M160 181h172M160 214h172M160 247h172M160 280h129" stroke="#97798d" stroke-width="5"/><path d="M181 165h138" stroke="#876889" stroke-width="4"/>
      <g><path d="M94 473h303v32H94z" fill="#a37e74"/><path d="M110 505h23v86m241-86h-23v86" stroke="#8c766c" stroke-width="11"/><rect x="122" y="397" width="92" height="82" rx="14" fill="#6b6682"/><rect x="234" y="397" width="92" height="82" rx="14" fill="#6b6682"/><path d="M168 398v-55m108 55v-55" stroke="#7eaeab" stroke-width="10"/><circle cx="168" cy="337" r="26" fill="#e5a99b" stroke="#d7d1c9" stroke-width="8"/><circle cx="276" cy="337" r="26" fill="#86b9d0" stroke="#d7d1c9" stroke-width="8"/><circle cx="350" cy="375" r="28" fill="#e8c785" stroke="#d7d1c9" stroke-width="7"/><path d="M350 406v-30" stroke="#ad9b8f" stroke-width="8"/></g>
      <g><ellipse cx="653" cy="555" rx="166" ry="32" fill="#283944" opacity=".35"/><path d="M574 537h153l-20 71H596Z" fill="#ae8b87" stroke="#e3ba9e" stroke-width="9"/><path d="M650 534V327" stroke="#689d81" stroke-width="14"/><path d="M649 450q-100-81-123-24 50 44 123 40M653 390q111-92 152-32-35 52-152 44" fill="#6baf89"/><g transform="translate(650 288)"><path d="M0 0Q-79-99-53-118 0-111 0-30 0-105 51-119 81-96 0 0Q100-48 112-7 83 40 13 17Q42 95 1 97-43 79-14 15Q-100 60-111 4-79-36 0 0Z" fill="${g.flags.valves?'#f2dbb3':'#9a9ba7'}" stroke="#ead3ad" stroke-width="5"/><circle r="22" fill="${g.flags.valves?'#fff1b7':'#67728a'}"/><circle r="40" fill="#f0e2ab" opacity="${g.flags.valves?'.18':'.02'}" filter="url(#glow)"/></g></g>
      <g><path d="M818 473h168v98H818z" fill="#685575" stroke="#cfb3a4" stroke-width="7"/><path d="M831 464h145v15H831z" fill="#e6c79a"/><path d="M898 460V365" stroke="#6c9b84" stroke-width="10"/><path d="M895 400q-52-25-60-9 25 32 66 25M901 420q50-32 70-15-23 34-70 30" fill="#78af8b"/><circle cx="904" cy="366" r="27" fill="#e7c5cf"/></g>
      ${doorSvg(1054,198,123,272,'teal')}<g opacity=".62"><circle cx="105" cy="107" r="4" fill="#f9e7bc"/><circle cx="701" cy="125" r="3" fill="#f9e7bc"/><circle cx="965" cy="65" r="4" fill="#f9e7bc"/></g>`,'#285361','#344f52'),
    tower:()=>artFrame(`
      <path d="M0 0H1200V395H0z" fill="#282d50"/><path d="M130 0v395M360 0v395M800 0v395M1040 0v395" stroke="#68718d" stroke-width="18" opacity=".45"/><path d="M0 98H1200M0 274H1200" stroke="#a59aad" stroke-width="7" opacity=".37"/>
      <path d="M407 112Q602-30 794 112V453H407Z" fill="#232841" stroke="#a88a83" stroke-width="18"/><circle cx="602" cy="258" r="150" fill="#d2af83" stroke="#e7cba1" stroke-width="21"/><circle cx="602" cy="258" r="130" fill="#edd8aa"/><circle cx="602" cy="258" r="112" fill="none" stroke="#bca27c" stroke-width="6"/>
      ${Array.from({length:12},(_,i)=>{let a=i*Math.PI/6,x=602+101*Math.sin(a),y=258-101*Math.cos(a);return `<circle cx="${x}" cy="${y}" r="4" fill="#604c51"/>`;}).join('')}
      <path d="M602 258v-87" stroke="#674650" stroke-width="12" stroke-linecap="round"/><path d="M602 258l62 33" stroke="#674650" stroke-width="9" stroke-linecap="round"/><circle cx="602" cy="258" r="13" fill="#b98c73"/>
      <path d="M96 405h264v155H96z" fill="#716078" stroke="#d2b199" stroke-width="13"/><path d="M115 421h227v105H115z" fill="#343553"/><circle cx="172" cy="474" r="21" fill="#e7b780"/><circle cx="225" cy="474" r="21" fill="#e7b780"/><circle cx="278" cy="474" r="21" fill="#e7b780"/><path d="M135 567h188" stroke="#e4c49f" stroke-width="9"/><path d="M88 243h193v113H88z" fill="#ddc29c" stroke="#ae8995" stroke-width="9"/><path d="M109 278h140M109 297h140M109 318h104" stroke="#997c89" stroke-width="4"/>
      <path d="M855 151Q965 20 1072 151V544H855Z" fill="#1d2038" stroke="#d4ae7d" stroke-width="14"/><path d="M875 170Q965 50 1052 170V523H875Z" fill="${g.flags.clock?'#b5b1a3':'#374461'}"/><path d="M892 190L1040 456M1040 190L892 456" stroke="#decba8" stroke-opacity=".22" stroke-width="8"/><circle cx="964" cy="290" r="49" fill="#f3d7a6" opacity="${g.flags.clock?'.44':'.07'}" filter="url(#glow)"/>
      ${doorSvg(1104,277,82,217)}<g><path d="M0 566H1200" stroke="#161f36" stroke-width="8"/><path d="M353 600H843" stroke="#caa78a" stroke-width="7" opacity=".45"/></g>`,'#2b304e','#3c3852')
  };
  function drawScene(room){return sceneArt[room]();}


let explorationIndex=0;
function exploreSuggestion(){
 if(!g)return;
 const candidates=hotspots[g.room].filter(x=>!x.ok?.());
 const list=candidates.length?candidates:hotspots[g.room];
 if(!list.length)return;
 const pick=list[explorationIndex++%list.length];
 const el=[...$('hotspots').querySelectorAll('.hotspot')].find(x=>x.dataset.object===pick.id);
 if(!el)return;
 el.classList.remove('revealed');void el.offsetWidth;el.classList.add('revealed');
 setTimeout(()=>{if(el.isConnected)el.classList.remove('revealed')},1600);
}
const scene=$('sceneCanvas');
scene.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'||!g)return;
 const area=scene.getBoundingClientRect();
 scene.style.setProperty('--ambient-x',((e.clientX-area.left)/area.width-.5)*9+'px');
 scene.style.setProperty('--ambient-y',((e.clientY-area.top)/area.height-.5)*6+'px');
 const all=[...$('hotspots').querySelectorAll('.hotspot')].filter(el=>getComputedStyle(el).display!=='none');
 let nearest=null,dist=72;
 for(const el of all){const rect=el.getBoundingClientRect();const d=Math.hypot(e.clientX-(rect.left+rect.width/2),e.clientY-(rect.top+rect.height/2));if(d<dist){dist=d;nearest=el;}}
 all.forEach(el=>el.classList.toggle('near',el===nearest));
});
scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--ambient-x','0px');scene.style.setProperty('--ambient-y','0px');$('hotspots').querySelectorAll('.near').forEach(el=>el.classList.remove('near'))});
document.querySelector('[data-camera="discover"]')?.addEventListener('click',exploreSuggestion);

// Dynamic UI events, touch and mouse support.
$('hotspots').addEventListener('click',e=>{let b=e.target.closest('[data-object]');if(b)inspect(b.dataset.object)});
$('sceneNav').addEventListener('click',e=>{let b=e.target.closest('[data-room]');if(b)move(b.dataset.room)});
$('inventory').addEventListener('click',e=>{let b=e.target.closest('[data-item]');if(!b)return;g.selected=g.selected===b.dataset.item?null:b.dataset.item;$('catDialog').textContent=g.selected?items[g.selected][2]:'아이템 선택이 해제되었어.';render()});
$('modalContent').addEventListener('click',e=>{let b=e.target.closest('[data-action]');if(b)handle(b.dataset.action)});
let dragged=null;
$('modalContent').addEventListener('dragstart',e=>{const b=e.target.closest('[data-book]');if(b){dragged=b.dataset.book;e.dataTransfer?.setData('text/plain',dragged)}});
$('modalContent').addEventListener('dragover',e=>{if(e.target.closest('[data-slot]'))e.preventDefault()});
$('modalContent').addEventListener('drop',e=>{let b=e.target.closest('[data-slot]');if(!b)return;e.preventDefault();let name=e.dataTransfer?.getData('text/plain')||dragged;if(!name||!Object.hasOwn(moonBooks,name)||g.booksPlaced.includes(name))return;let index=Number(b.dataset.slot);if(g.booksPlaced[index])return;g.booksPlaced[index]=name;save();books()});
$('startBtn').addEventListener('click',()=>store.getItem(SAVE)?handle('new-confirm'):begin());
$('continueBtn').addEventListener('click',resume);
$('homeBtn').addEventListener('click',home);
$('hintBtn').addEventListener('click',hint);
$('menuBtn').addEventListener('click',menu);
$('journalBtn').addEventListener('click',()=>journal());
$('cluesBtn').addEventListener('click',()=>journal());
$('catTalkBtn').addEventListener('click',talk);
$('soundBtn').addEventListener('click',()=>{g.sound=!g.sound;render()});
$('nextRoomBtn').addEventListener('click',()=>{let i=rooms.indexOf(g.room);if(i<3&&clearRoom(g.room))move(rooms[i+1])});
$('modalClose').addEventListener('click',hide);
$('modalOverlay').addEventListener('click',e=>{if(e.target.id==='modalOverlay')hide()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)hide()});
$('continueBtn').classList.toggle('hidden',!store.getItem(SAVE));
setInterval(tick,1000);
})();