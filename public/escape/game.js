/* 모여 방탈출 EP01 13번째 종소리 · 퍼즐 리뉴얼 v3.0
   독립 실행, 로컬 저장, 기존 3D 룸 모듈 호환. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const isTaste=location.pathname.startsWith('/taste/escape/');
const SAVE=isTaste?'moyeo.escape.ep01.taste.save.v21':'moyeo.escape.ep01.save.v21',HISTORY=isTaste?'moyeo.escape.ep01.taste.endings.v21':'moyeo.escape.ep01.endings.v21';
const store={getItem(k){try{return window.localStorage.getItem(k)}catch(e){return this.memory?.[k]||null}},setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){(this.memory??={})[k]=v}},removeItem(k){try{window.localStorage.removeItem(k)}catch(e){if(this.memory)delete this.memory[k]}}};
const rooms=['foyer','study','greenhouse','tower'];
const meta={foyer:['현관 홀','자정에 멈춘 저택의 첫 번째 공간'],study:['달빛 서재','서로 맞지 않는 기록이 남은 서재'],greenhouse:['유리 온실','누군가의 손길이 남은 정원'],tower:['시계탑','열세 번째 종의 비밀이 잠든 곳']};
// EP.01 chapters: show exploration goal, never puzzle solution.
const roomStories={
  "foyer": {
    "title": "멈춰 버린 시간",
    "intro": "현관문이 등 뒤에서 닫혔다. 오래된 시계는 자정에 멈춰 있다.\n현관 한쪽의 고양이가 고개를 든다.\n미로: “여기가 낯설지는 않은데… 왜 아무것도 기억나지 않지?”",
    "goal": "저택 안쪽으로 들어갈 방법을 찾자."
  },
  "study": {
    "title": "지워진 기록",
    "intro": "오래된 종이 냄새가 난다. 책상 위에는 여러 장의 낡은 서류가 놓여 있고, 벽에는 빛바랜 초상화가 걸려 있다.\n미로: “여기서 누가 내게 책을 읽어 줬던 것 같아.”",
    "goal": "저택에 무슨 일이 있었는지 알아낼 기록을 찾자."
  },
  "greenhouse": {
    "title": "잊어버린 약속",
    "intro": "유리문을 열자 희미한 꽃향기가 퍼진다. 멈춘 저택에서 꽃들은 이상할 만큼 생생하다.\n미로는 작은 찻상 곁에 앉는다.\n미로: “여기서 기다리면… 누가 와야 하는데.”",
    "goal": "온실에 남은 흔적을 조사하고 시계탑으로 향하자."
  },
  "tower": {
    "title": "마지막 종소리",
    "intro": "거대한 톱니바퀴가 멈춰 있고, 탑 위에는 오래된 종이 매달려 있다.\n미로: “저 종… 소리를 기억하는 것 같아. 그런데 무슨 일이 있었지?”",
    "goal": "멈춘 시계를 복구하고 저택에서 일어난 일을 밝혀내자."
  }
};
const items={brassKey:['🗝','황동 열쇠','묵직한 황동 열쇠. 손잡이에 달 모양 흠집이 있다.'],silverDisc:['◐','은면 원판','차갑고 매끈한 은빛 원판. 뒷면에는 가는 분할선이 남아 있다.'],lamp:['✧','작은 등불','옆면에 달 모양 구멍이 있어 빛이 새어 나온다.'],roll:['♫','원통 악보','황동 원통에 네 줄의 돌기가 나 있다. 축 옆에 작은 별이 새겨져 있다.'],film:['▧','별 구멍 필름','네 군데가 뚫려 있는 투명 필름. 모서리에 별 하나가 있다.'],photo:['▧','오래된 사진','어린 미로와 얼굴이 희미한 인물이 함께 있다. 뒷면: 「우린 언제나 함께야」'],diary:['▤','낡은 일기','「미로에게 꼭 돌아갈게」. 마지막 페이지에는 지워진 날짜와 눌린 발자국이 남아 있다.'],collar:['◇','은빛 목걸이','안쪽에는 「미로, 나의 영원한 가족 — 루나」라고 새겨져 있다.']};
const seals={path:['❖','길의 인장'],echo:['♫','소리의 인장'],light:['☼','빛의 인장']};
const clueText={
 invitation:['발신인 없는 편지','달빛 저택에 와 주세요. 멈춘 시계가 다시 움직이기 전에 사라진 기억을 찾아 주세요. 봉투의 금속 인장에는 발신인 이름이 없다.'],
 lock9:['현관 출입 기록','현관문이 닫히는 자동 시각은 매일 밤 9시다. 기록지 마지막 줄에 당일의 날짜가 남아 있다.'],
 track:['양탄자 아래의 발자국','문턱에서 시작된 두 종류의 동물 발자국과 신발 밑창 자국이 종으로 향한다. 몇몇 타일에는 다른 종류의 자국이 함께 남아 있다.'],
 portrait:['서재의 초상화','미로와 한 어린 소녀가 함께 앉아 있다. 금빛 액자 아래쪽에 작은 흠집이 보인다.'],
 dust:['서가의 황동 문양','책등마다 두 개의 문양이 다른 높이에 있다. 서가 양 끝은 높아 손이 쉽게 닿지 않지만 오래된 황동 장식이 남아 있다.'],
 shelfEnds:['높은 서가의 양 끝','사다리로 올려다보니 서가 왼편 끝에는 별(✦), 오른편 끝에는 초승달(☾) 모양이 남아 있다.'],
 waterSketch:['화분 뒤의 찢어진 스케치','오래된 수조 스케치에는 별 수면이 달보다 정확히 한 눈금 높게 그려져 있다.'],
 cloudOutlet:['분수 조각상 아래의 배관','구름 모양 배관은 바닥까지 말라 있다. 다른 수조와 달리 굳은 진흙만 남았다.'],
 roll:['기계식 자동연주 원통','원통 표면에는 네 줄의 돌기 흔적이 있고 각 줄마다 여섯 칸의 위치가 있다. 한쪽 모서리와 기계 축에 같은 별이 새겨져 있다.'],
 water:['정원 관리 기록','네 수조가 측면 배관으로 이어져 있다. 해 그림 수조에는 세 번째 눈금에 마른 물때가 있다. 나머지 수조에 대한 기록은 찢겨 나갔다.'],
 watering:['온실 자동 급수 시계','유리 덮개 아래 마지막 급수 종료 시각 21:10. 시계 바늘은 그 뒤 더 움직이지 않았다.'],
 powder:['달빛꽃 관찰 기록','희게 마른 꽃가루는 밝은 곳에서는 보이지 않지만 창을 가리면 흐릿한 은빛 반점을 남긴다.'],
 clock:['시계 관리인의 메모','현관 자동 잠금과 온실 급수 종료는 밤에 있었다. 급수 장치의 마지막 진동이 멎은 뒤 모래가 완전히 내려가는 데는 다섯 분이 걸렸다.'],
 pin:['시계추 제동 장치','안전용 붉은 고정쇠는 시계추 아래쪽에 있다. 제단에 꽂힌 세 인장에는 길쭉한 홈이 각각 다른 수만큼 파여 있다.'],
 story:['서재에서 발견한 일기','일기에는 미로를 돌본 사람의 손길이 남아 있다. 하지만 옆 기록부에는 「상주 인원 0명」이라고 적혀 있다.'],
 bell:['비상 종 제작 기록','정규 열두 번의 타종과 별도로 시간을 붙드는 종이 있다. 종을 울린 사람은 시계 속에 갇히고 다른 이들의 기억에서 지워진다. 사진, 글, 이름을 품은 물건 등 남겨진 흔적은 봉인을 풀 실마리가 된다.']
};
const hints={
 foot:[
  '문턱부터 종까지 작은 발자국들이 이어집니다. 중간에 서로 다른 모양의 자국이 겹친 곳도 있습니다.',
  '발톱이 남은 자국, 둥근 발바닥, 신발 밑창은 서로 다릅니다. 침대에서 발견한 자국과 비교해 보세요.',
  '세 종류 모두 같은 문턱에서 시작하지만 중간에 서로 다른 길을 택합니다. 침대의 반달 모양 뒤꿈치와 같은 인상을 연결해 보세요.',
  '정답: 고양이의 다섯 걸음은 오른쪽 → 위 → 오른쪽 → 아래 → 아래(RURDD)입니다. 개는 아래 → 오른쪽 → 아래 → 오른쪽 → 위(DRDRU), 사람은 위 → 오른쪽 → 아래 → 아래 → 오른쪽(URDDR)으로 종까지 이동합니다.'
 ],
 mirror:[
  '반쪽 달 장식의 문장과 등불 받침에 남은 흔적을 살펴보세요. 장치 위의 달은 창문과 떨어져 있습니다.',
  '은빛 받침은 둥글게 닳았고 황동 받침 두 곳에는 기다란 마모 자국이 있습니다. 황동의 색이 다른 이유가 있을까요?',
  '빛은 은면에 닿을 때 직각으로 꺾입니다. 일반 은면은 회전하고 황동 B·D는 레일을 따라 움직일 수도 있습니다. 빛의 출발점에서 경로를 차례로 추적해 보세요.',
  '정답: B는 레일 두 번째 자리(x=2), D는 첫 번째 자리(x=5). 은면 A╲ B╲ C╱ D╲ E╲ F╱ G╱ H╲ I╲. 빛은 A→B→C→D→E→F→G→H→I를 거쳐 달에 닿습니다.'
 ],
 books:[
  '서가 양 끝에 새겨진 문양과 책등의 양 끝을 비교해 보세요.',
  '한 책을 뒤집으면 왼쪽과 오른쪽 문양의 순서가 달라집니다. 모든 책에 오래된 먼지가 쌓인 것은 아닙니다.',
  '서가의 한쪽 끝에서 시작해 기호가 끊기지 않는 연결을 찾아보세요. 첫 기호와 마지막 기호도 정해져 있습니다.',
  '정답: 가을 → 여름(뒤집기) → 겨울 → 자정(뒤집기) → 봄. 미로의 책은 제외합니다. 문양은 ✦-◆-✿-◈-❖-☾로 이어집니다.'
 ],
 piano:[
  '책장 뒤에서 나온 원통의 돌기와 피아노 위 황동 축의 흔적을 관찰해 보세요.',
  '여섯 걸림점과 두 개의 작은 별 표식이 남아 있습니다.',
  '원통을 축에 끼우는 방향이 바뀌면 손가락이 건드리는 건반도 달라집니다. 짧은 선율을 듣고 연주해 보세요.',
  '정답: 원통의 다섯 번째 걸림점(별 표식)에 맞춘 뒤 왼쪽부터 2·5·3·2번째 건반을 누릅니다.'
 ],
 film:[
  '서재 초상화의 액자와 책상 유리에는 닮은 크기의 흠집이 있습니다.',
  '필름의 별 문양과 유리 오른쪽 아래의 오래된 별 흠집이 서로 닮았습니다.',
  '필름을 회전하고 유리 위에 놓은 뒤 등불을 비춰 보세요. 밀착된 위치와 방향이 모두 중요합니다.',
  '정답: 필름을 180도 회전하고 유리 중앙에 놓은 뒤 등불을 비춥니다. 서랍 아래의 감광 장치가 반응합니다.'
 ],
 water:[
  '정원 기록에는 네 수조의 물때가 남아 있습니다. 직접 물을 버릴 만한 배수구는 없습니다.',
  '해와 구름 수조의 오래된 흔적, 그리고 별과 달 수면의 높이 차이에 주목해 보세요.',
  '수문은 양옆 수조 사이에서만 움직입니다. 네 수조에 든 물의 총량은 바뀌지 않습니다.',
  '정답: 해 3, 달 1, 별 2, 구름 0. 예: 구름→별 두 번, 별→달 한 번, 달→해 두 번으로 조작합니다.'
 ],
 light:[
  '꽃잎을 자세히 살펴보면 다른 부분보다 빛이 잘 통과하는 곳이 있습니다.',
  '얇은 유리판 A와 B의 구멍은 조금씩 다릅니다. 꽃 위에는 겹쳐진 빛의 무늬가 나타납니다.',
  '회전과 좌우 이동으로 두 유리판의 투명 부분을 겹쳐 보세요. 꽃잎에 남은 다섯 점과 비교해 보세요.',
  '정답: 유리판 A와 B를 모두 회전 0°, 좌우 위치 0(중앙)에 놓으면 다섯 점의 무늬가 일치합니다.'
 ],
 blackout:[
  '꽃이 피어난 뒤에도 꽃가루는 바닥에 남아 있습니다.',
  '밝은 달빛 아래에서는 꽃가루의 흔적이 뚜렷하지 않습니다.',
  '채광창이 어두워진 상태에서 꽃술을 다시 살펴보고, 작은 흔적을 따라가 보세요.',
  '정답: 꽃이 핀 뒤 채광창을 닫고 꽃술의 가루를 조사하면 발자국이 드러납니다. 오래된 유리 화분에서 목걸이를 얻습니다.'
 ],
 clock:[
  '현관 관리 기록과 온실의 자동 급수 기록을 다시 살펴보세요.',
  '시계탑 관리인의 메모에는 마지막 진동과 모래가 떨어진 시간이 함께 적혀 있습니다.',
  '온실의 마지막 자동 급수 이후 경과한 시간을 시계탑 기록과 연결해 보세요. 낮과 밤도 구별해야 합니다.',
  '정답: 밤 9시 15분(21:15). 온실 급수 종료 21:10에서 5분 후이고, 현관은 이미 21시에 잠겼습니다.'
 ],
 pin:[
  '시계 아래의 고정쇠 위에는 세 인장과 맞물린 황동 바퀴가 있습니다.',
  '제단에 놓인 인장을 뒤집어 보면 홈의 개수가 서로 다릅니다.',
  '세 바퀴의 홈이 해당 인장의 실제 홈 수와 일치하도록 돌린 뒤 고정쇠를 살펴보세요.',
  '정답: 길 2칸, 소리 1칸, 빛 3칸으로 바퀴를 맞물린 뒤 붉은 고정쇠를 풀면 됩니다.'
 ]
};
const state=()=>({v:21,room:'foyer',visited:['foyer'],roomIntroSeen:{},showMarkers:true,inspectedObjects:[],inventory:[],clues:[],seals:[],flags:{foot:false,mirror:false,books:false,piano:false,film:false,water:false,light:false,blackout:false,clock:false,pin:false,valves:false,rug:false,curtain:false},selected:null,coreInvestigations:{},coreActionCosts:{},ambientSteps:{},ambientSpent:{},ambientFlags:{},sideGames:{bell:false,wallLights:false},wallLights:[false,false,false,false],bellInput:[],combinedFindings:[],itemSides:{},discMounted:false,catMood:'curious',booksPlaced:[null,null,null,null,null],booksFlipped:{},drumOffset:0,drumPlayed:false,mirrorVersion:2,mirrorTiles:{A:'/',B:'/',C:'/',D:'/',E:'/',F:'/',G:'/',H:'/',I:'/'},mirrorRails:{B:1,D:7},lampOn:false,footInput:'',pianoInput:[],digits:'',mirrorAngle:0,mirrorA:0,mirrorB:0,filmRotate:1,filmShift:-1,waterValues:[1,2,1,2],glassA:{r:1,x:-1},glassB:{r:2,x:1},pinLevels:[0,0,0],pinReady:false,night:false,hour:12,minute:0,activePuzzle:'foot',hintLevels:{},hintsUsed:0,errors:0,startedAt:Date.now(),elapsedCarry:0,sound:true,ending:null});
let g=null,modalOpen=false,audio=null,catTurns=0;
const has=id=>g.inventory.includes(id), done=id=>!!g.flags[id], elapsed=()=>Math.floor((Date.now()-(g?.startedAt||Date.now()))/1000)+(g?.elapsedCarry||0), pretty=s=>{let v=Math.max(0,s);return `${String(Math.floor(v/3600)).padStart(2,'0')}:${String(Math.floor(v%3600/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`};
function save(){if(!g)return;try{store.setItem(SAVE,JSON.stringify({...g,elapsedCarry:elapsed(),startedAt:null}));}catch(e){}}
function notify(s){const t=document.createElement('div');t.className='toast';t.textContent=s;$('toastRegion').appendChild(t);setTimeout(()=>t.remove(),3500)}
function tone(kind='tap'){if(!g?.sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let seq=kind==='gain'?[523,659,784]:kind==='bad'?[250,188]:kind==='bell'?[440,550,659,880]:[550];seq.forEach((hz,i)=>{let o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=hz;v.gain.setValueAtTime(.0001,audio.currentTime+i*.13);v.gain.exponentialRampToValueAtTime(.06,audio.currentTime+i*.13+.025);v.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+i*.13+.33);o.connect(v);v.connect(audio.destination);o.start(audio.currentTime+i*.13);o.stop(audio.currentTime+i*.13+.35)})}catch(e){}}
function item(id){if(has(id))return;g.inventory.push(id);notify('아이템 획득 · '+items[id][1]);tone('gain');render()}
function clue(id){if(!g.clues.includes(id)){g.clues.push(id);save()}}

/* Inspecting and pairing found objects never consumes mandatory puzzle inventory. */
const combinationNotes={
 'lamp+silverDisc':['은면 위의 작은 달','등불을 원판 가장자리에 비추니 얇은 은빛 선이 겹쳐진다. 원판을 살짝 돌리자 벽에 짧은 반사광이 흔들린다.'],
 'film+lamp':['빛을 통과한 작은 구멍','등불을 투명 필름 뒤에 놓자 종이 위에 작은 점 네 개가 맺혔다. 필름의 방향을 바꿀 때마다 점들이 이동한다.'],
 'diary+photo':['겹쳐지는 필체','사진 뒷면의 글씨와 일기의 마지막 줄에 남은 글씨가 닮았다. 종이의 색은 서로 다르지만 같은 사람의 손길이 느껴진다.'],
 'collar+photo':['목걸이를 기억하는 사진','사진 속 미로의 목에 아주 작은 리본 자국이 있다. 은빛 목걸이를 옆에 두니 오래된 장면이 조금 가까워진 듯하다.'],
 'collar+diary':['일기장 속 작은 발자국','일기장 마지막 장의 여백에 고양이 발 모양으로 눌린 자국이 있다. 목걸이 안쪽의 작은 흠집과 비슷하다.']
};
function combineItems(a,b){
 if(!g||!has(a)||!has(b)||a===b)return;
 const ids=[a,b].sort(),key=ids.join('+'),note=combinationNotes[key];
 g.selected=null;
 if(note){
  g.combinedFindings??=[];
  const first=!g.combinedFindings.includes(key);
  if(first)g.combinedFindings.push(key);
  render();
  return modal('가방 · 아이템 조합',note[0],
   '<div class="combined-item-visual"><span>'+items[a][0]+'</span><b>+</b><span>'+items[b][0]+'</span></div>'+
   '<div class="letter">'+note[1]+'</div>'+
   '<p class="puzzle-helper">'+(first?'새로운 관찰이 탐험 수첩에 남았다.':'이미 살펴본 조합이다.')+'</p>',
   [['다른 아이템 보기','close',true],['조합 기록 열기','journal-moments']]);
 }
 render();
 notify('두 물건을 함께 살펴봤지만 특별한 변화는 없었다.');
}
const itemBacks={
 photo:'사진 뒷면은 오래된 잉크가 번져 있다. 「우린 언제나 함께야」라는 글씨 아래에 작은 고양이 발자국이 찍혀 있다.',
 film:'얇은 필름을 뒤집으니 네 개의 뚫린 창이 반대로 놓인다. 한 모서리의 별 흠집이 유난히 깊다.',
 diary:'일기의 마지막 장에는 지워진 날짜와 눌린 발자국 자국이 남아 있다. 페이지 가장자리가 젖었다 말랐다.',
 collar:'목걸이 뒤편에 작은 손길로 긁은 듯한 자국이 보인다. 고리에는 아주 오래된 푸른 실 한 올이 끼어 있다.',
 invitation:'봉투 뒤편에는 작은 구멍 세 개가 비대칭으로 남았다. 우표를 뗀 자리는 이미 말라 있다.'
};
function itemDetail(id){
 if(!has(id)||!Object.hasOwn(items,id))return;
 const entry=items[id],flipped=!!g.itemSides?.[id],back=itemBacks[id];
 return modal('가방 · 아이템 관찰',entry[1],
  '<div class="item-detail-icon '+(flipped?'item-turned':'')+'" aria-hidden="true">'+entry[0]+'</div>'+
  '<div class="letter">'+(flipped&&back?back:entry[2])+'</div>'+
  '<p class="puzzle-helper">가방에서 다른 물건을 차례로 선택하면 함께 살펴볼 수 있다.</p>',
  back?[[(flipped?'앞면':'뒷면')+' 확인하기','item-flip-'+id,true],['닫기','close']]:[['닫기','close',true]]);
}
function itemFlip(id){
 if(!has(id)||!Object.hasOwn(itemBacks,id))return;
 g.itemSides??={};g.itemSides[id]=!g.itemSides[id];save();itemDetail(id);
}
function invitation(){
 clue('invitation');
 return modal('현관 · 발견','발신인 없는 초대장',
  '<div class="letter">달빛 저택으로 와 주세요.\n멈춘 시계가 다시 움직이기 전에 사라진 기억을 찾아주세요.\n\n서명은 비어 있다. 오래된 우편 장치의 금속 자국만 남아 있다.</div>',
  [['종이를 뒤집기','invitation-flip',true],['돌아가기','close']]);
}
function invitationFlip(){
 return modal('현관 · 발견','초대장 뒷면',
  '<div class="letter">봉투 뒷면에는 오래된 우표 자국이 있다. 아래쪽에 작은 구멍 세 개가 비대칭으로 찍혀 있다. 종이 가장자리는 유난히 매끄럽다.</div>',
  [['앞면 다시 읽기','invitation',true],['돌아가기','close']]);
}

function seal(id){if(g.seals.includes(id))return;g.seals.push(id);notify('인장 획득 · '+seals[id][1]);tone('gain');render()}
function clearRoom(id){return ({foyer:()=>done('foot')&&done('mirror')&&has('brassKey'),study:()=>done('books')&&done('piano'),greenhouse:()=>done('water')&&done('light'),tower:()=>done('clock')&&done('pin')})[id]();}
function canEnter(id){let n=rooms.indexOf(id);return n===0||n>0&&rooms.slice(0,n).every(clearRoom)}
function begin(){g=state();save();showGame();modal('PROLOGUE','13번째 종소리',`<div class="letter">달빛 저택으로 와 주세요.\n멈춘 시계가 다시 움직이기 전에, 사라진 기억을 찾아 주셨으면 합니다.\n\n— 발신인 미상</div><p class="modal-description">눈을 떠보니 현관문이 잠겨 있습니다. 고양이 미로가 마치 오래 기다렸다는 듯 말을 겁니다.</p><p class="story-voice">"여긴 익숙한데… 누가 나를 기다렸던 것 같아. 이름이 생각나지 않아."</p>`,[['현관 조사 시작','room-intro-foyer',true]])}
function showRoomIntro(id){
 if(!g||!Object.hasOwn(roomStories,id)||g.ending)return;
 g.roomIntroSeen??={};g.roomIntroSeen[id]=true;save();
 const chapter=roomStories[id],number=String(rooms.indexOf(id)+1).padStart(2,'0');
 modal('ROOM '+number+' / 04 · '+chapter.title,meta[id][0],
   '<div class="letter">'+chapter.intro.split('\n').join('<br>')+'</div>'+
   '<p class="modal-description"><b>현재 목표</b> · '+chapter.goal+'</p>',
   [['탐험 시작하기','close',true],['탐험 수첩','journal-rooms']]);
}
function resume(){try{let s=JSON.parse(store.getItem(SAVE));if(!s||s.v!==21||!s.flags)throw Error('version');g={...state(),...s,roomIntroSeen:{...(s.roomIntroSeen||{})},flags:{...state().flags,...s.flags},mirrorVersion:2,mirrorTiles:s.mirrorVersion===2?Object.fromEntries(Object.entries(state().mirrorTiles).map(([id,initial])=>[id,s.mirrorTiles?.[id]===String.fromCharCode(92)?String.fromCharCode(92):s.mirrorTiles?.[id]==='/'?'/':initial])):state().mirrorTiles,mirrorRails:{B:s.mirrorVersion===2&&[1,2,3].includes(s.mirrorRails?.B)?s.mirrorRails.B:1,D:s.mirrorVersion===2&&[5,6,7].includes(s.mirrorRails?.D)?s.mirrorRails.D:7},booksFlipped:{...s.booksFlipped},coreInvestigations:{...(s.coreInvestigations||{})},coreActionCosts:{...(s.coreActionCosts||{})},ambientSteps:{...(s.ambientSteps||{})},ambientSpent:{...(s.ambientSpent||{})},ambientFlags:{...(s.ambientFlags||{})},sideGames:{bell:false,wallLights:false,...(s.sideGames||{})},wallLights:Array.isArray(s.wallLights)&&s.wallLights.length===4?s.wallLights:[false,false,false,false],bellInput:Array.isArray(s.bellInput)?s.bellInput:[],combinedFindings:Array.isArray(s.combinedFindings)?s.combinedFindings:[],itemSides:{...(s.itemSides||{})},showMarkers:typeof s.showMarkers==='boolean'?s.showMarkers:true,inspectedObjects:Array.isArray(s.inspectedObjects)?s.inspectedObjects:[]};
if(!Object.hasOwn(s,'coreInvestigations')){
 // Previously inspected mechanisms must not acquire a new fee on legacy saves.
 for(const id of s.inspectedObjects||[])if(Object.hasOwn(coreInspections,id))g.coreInvestigations[id]=true;
}
if(!Array.isArray(g.booksPlaced)||g.booksPlaced.length!==5)g.booksPlaced=[null,null,null,null,null];g.elapsedCarry=Number(s.elapsedCarry)||0;g.startedAt=Date.now();if(!canEnter(g.room))g.room='foyer';showGame();if(g.ending)ending(g.ending);else if(!g.roomIntroSeen[g.room])showRoomIntro(g.room)}catch(e){store.removeItem(SAVE);notify('저장 기록을 읽지 못했습니다. 새로 시작해 주세요.') }}
function showGame(){$('homeScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');hide();render();tick()}
function home(){save();hide();$('gameScreen').classList.add('hidden');$('homeScreen').classList.remove('hidden');$('continueBtn').classList.toggle('hidden',!store.getItem(SAVE))}
function hide(){modalOpen=false;$('modalOverlay').classList.add('hidden')}
function modal(eyebrow,title,content,actions=[['돌아가기','close',true]]){modalOpen=true;$('modalContent').innerHTML=`<div class="modal-eyebrow">${eyebrow}</div><h2 id="modalTitle" class="modal-title">${title}</h2>${content}<div class="modal-actions">${actions.map(([name,action,primary,disabled])=>`<button class="modal-btn ${primary?'primary':''}" data-action="${action}" ${disabled?'disabled':''}>${name}</button>`).join('')}</div>`;$('modalOverlay').classList.remove('hidden');}
function article(t,s,eyebrow='조사 기록'){modal(eyebrow,t,`<div class="letter">${s}</div>`)}

let cinematicTimer=null;
function sceneMoment(kind='solved'){
 const scene=$('sceneCanvas'),layer=$('sceneCinematic');
 if(!scene||!layer)return;
 if(cinematicTimer)clearTimeout(cinematicTimer);
 layer.dataset.kind=kind;
 scene.classList.remove('cinematic-active');void scene.offsetWidth;
 scene.classList.add('cinematic-active');
 cinematicTimer=setTimeout(()=>{scene.classList.remove('cinematic-active');cinematicTimer=null},kind==='final-bell'?2200:1100);
}

function solved(key,text){
 g.flags[key]=true;g.activePuzzle=key;
 g.catMood=key==='pin'?'remembering':'happy';
 $('catDialog').textContent=key==='pin'?'이 장치… 내가 여기 있었던 밤과 이어져 있는 것 같아.':'와! 정말 움직였어. 방 안의 공기가 달라졌어!';
 tone('gain');render();save();
 const focusId=({foot:'cabinet',mirror:'crescent',books:'books',piano:'piano',film:'desk',water:'water',light:'flower',clock:'clock',pin:'pin'})[key];
 if(focusId)window.MoyeoEscapeCamera?.focusSolvedProp(focusId);
 sceneMoment(key==='light'?'flower':key==='pin'?'final-bell':'solved');
 const showResult=()=>modal('PUZZLE SOLVED','장치가 움직이기 시작했다','<div class="collect-visual">✦</div><p class="modal-description">'+text+'</p>');
 if(!window.MoyeoEscapeCutscenes?.playPuzzle?.({key,onFinish:showResult}))showResult();
}
function error(text='아직 맞지 않는 것 같습니다.'){g.errors++;tone('bad');notify(text);save()}
function objective(){
 if(g.ending)return '저택의 이야기가 끝났다.';
 const index=rooms.indexOf(g.room);
 if(clearRoom(g.room)&&index<3)return '다음 공간으로 이동할 수 있다. 더 살펴볼 것도 남아 있다.';
 return roomStories[g.room].goal;
}
let uiSceneGame=null,uiSceneRoom=null,uiNavState=null,uiSealsState=null,uiInventoryState=null,uiHotspotState=null;
function syncMarkerDisplay(){
 if(!g)return;
 const on=g.showMarkers!==false,scene=$('sceneCanvas'),button=$('markerToggleBtn');
 scene?.classList.toggle('discovery-markers-on',on);
 if(button){
  button.textContent=on?'점 숨기기':'점 표시';
  button.setAttribute('aria-pressed',String(on));
  button.setAttribute('aria-label',on?'조사 위치 점 표시 끄기':'조사 위치 점 표시 켜기');
 }
}
function rememberInspection(id){
 if(!g||!id)return;
 g.inspectedObjects??=[];
 if(g.inspectedObjects.includes(id))return;
 g.inspectedObjects.push(id);
 const target=$('hotspots')?.querySelector('.hotspot[data-object="'+id+'"]');
 target?.classList.add('inspected');
 // The inspection dialog renders immediately; persist the cosmetic marker after the event.
 setTimeout(save,0);
}
function render(){if(!g)return;
 const sceneChanged=uiSceneGame!==g||uiSceneRoom!==g.room;
 const navState=g.room+'|'+rooms.map(r=>Number(canEnter(r))).join('')+'|'+rooms.map(r=>Number(clearRoom(r))).join('');
 const sealsState=g.seals.join('|');
 const inventoryState=g.inventory.join('|')+'|'+(g.selected||'');
 const hotspotState=hotspots[g.room].map(x=>x.ok?.()?'1':'0').join('');let [name,caption]=meta[g.room],index=rooms.indexOf(g.room);$('roomTitle').textContent=name;$('roomEyebrow').textContent=`ROOM 0${index+1} / 04`;$('sceneCaption').textContent=caption;
 if(uiNavState!==navState){$('sceneNav').innerHTML=rooms.map((r,i)=>`<button data-room="${r}" class="nav-btn ${r===g.room?'current':''} ${!canEnter(r)?'locked':''} ${canEnter(r)&&r!==g.room?'available':''}" ${r===g.room?'disabled aria-current="step"':''} ${!canEnter(r)?'aria-disabled="true"':''}><span class="nav-index">${canEnter(r)?String(i+1).padStart(2,'0'):'♙'}</span><span class="nav-copy"><small>${r===g.room?'현재 탐험 중':!canEnter(r)?'아직 잠긴 공간':'이동 가능한 공간'}</small><b>${meta[r][0]}</b></span><span class="nav-status" aria-hidden="true">${r===g.room?'✦':!canEnter(r)?'⌑':'↗'}</span></button>`).join('');uiNavState=navState;}
 if(uiSealsState!==sealsState){$('sealsBar').innerHTML=Object.entries(seals).map(([id,v])=>`<div title="${v[1]}" class="seal ${g.seals.includes(id)?'found':''}">${v[0]}</div>`).join('');uiSealsState=sealsState;}
 if(sceneChanged){$('sceneArtwork').innerHTML=drawScene(g.room);$('sceneCanvas').dataset.room=g.room;window.Moyeo3D?.setRoom(g.room);
 $('hotspots').innerHTML=hotspots[g.room].map(x=>`<button type="button" class="hotspot ${x.ok?.()?'done':''} ${g.inspectedObjects?.includes(x.id)?'inspected':''} ${x.detail?'detail':''}" data-object="${x.id}" style="left:${x.x}%;top:${x.y}%" aria-label="${x.name}"><span>${x.name}</span></button>`).join('');window.Moyeo3D?.refresh();uiSceneGame=g;uiSceneRoom=g.room;
 }else if(uiHotspotState!==hotspotState){$('hotspots').querySelectorAll('.hotspot').forEach((el,i)=>el.classList.toggle('done',hotspotState[i]==='1'));}
 uiHotspotState=hotspotState;
 if(uiInventoryState!==inventoryState){$('inventoryNum').textContent=g.inventory.length;$('inventory').innerHTML=g.inventory.length?g.inventory.map(id=>`<div class="inventory-slot"><button class="inventory-item ${g.selected===id?'selected':''}" data-item="${id}" aria-pressed="${g.selected===id}" aria-label="${items[id][1]} 선택"><span class="item-icon">${items[id][0]}</span><span class="item-name">${items[id][1]}</span></button><button type="button" class="inventory-inspect" data-item-view="${id}" aria-label="${items[id][1]} 자세히 보기">⌕</button></div>`).join(''):'<div class="inventory-empty"><svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M14 25h36l-3.5 27h-29L14 25Z" fill="#d8c5a8" fill-opacity=".13" stroke="#e4cfac" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 25v-6a8 8 0 0 1 16 0v6" stroke="#e4cfac" stroke-width="2.6" stroke-linecap="round"/><path d="m27 38 4 4 7-8" stroke="#ddc29c" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>아직 획득한 아이템이 없어요.</span><small>저택을 살펴보고 단서를 찾아보세요.</small></div>';uiInventoryState=inventoryState;}
 let val=['foot','mirror','books','piano','film','water','light','blackout','clock','pin'].filter(done).length;$('completionText').textContent=val+'/10';$('completionFill').style.width=(val*10)+'%';$('objectiveText').textContent=objective();$('soundBtn').textContent=g.sound?'♫':'♪̸';
 let next=rooms[index+1];$('nextRoomBtn').classList.toggle('hidden',!next||!clearRoom(g.room));if(next)$('nextRoomBtn').textContent=`${meta[next][0]}으로 이동 →`;
 if(sceneChanged)$('catAvatar').innerHTML=catSvg();const catCard=document.querySelector('.cat-card');if(catCard)catCard.dataset.mood=g.catMood||'curious';const catMood=document.querySelector('.cat-mood');if(catMood)catMood.textContent=({happy:'✧',remembering:'☾',startled:'!',curious:'✦'})[g.catMood]||'✦';$('sceneCanvas').classList.toggle('tower-awake',g.room==='tower'&&done('pin')&&!!g.ending&&g.ending!=='stay');$('sceneCanvas').classList.toggle('flower-awake',g.room==='greenhouse'&&done('light'));syncMarkerDisplay();save()}
function tick(){if(g)$('timerDisplay').textContent=pretty(elapsed())}
let roomTransitionBusy=false;
function move(r){
 if(roomTransitionBusy)return;
 if(!canEnter(r)){article('잠긴 문','이전 방의 필수 퍼즐을 마쳐야 합니다.');return;}
 if(r===g.room)return;
 const prior=g.room,firstVisit=!g.visited.includes(r);
 const enterRoom=()=>{
  g.room=r;g.selected=null;
  const panel=$('sceneCanvas');
  panel.classList.remove('room-entering');void panel.offsetWidth;panel.classList.add('room-entering');
  if(firstVisit){g.visited.push(r);notify('새 공간 · '+meta[r][0]);tone('gain');sceneMoment('room');}
  const lines={foyer:'저 시계가 왜 멈췄을까?',study:'이 방은 왜 낯설지가 않지?',greenhouse:'이 꽃 향기… 기억날 것 같아.',tower:'저 종소리는 어디에서 들었을까?'};
  $('catDialog').textContent=lines[r];g.catMood=r==='tower'?'remembering':'curious';
  render();save();
 };
 const afterTransition=()=>{
  roomTransitionBusy=false;
  if(!g.roomIntroSeen?.[r])showRoomIntro(r);
 };
 roomTransitionBusy=true;
 if(!window.MoyeoEscapeCutscenes?.playRoom?.({from:prior,to:r,firstVisit,onMidpoint:enterRoom,onFinish:afterTransition})){
  enterRoom();afterTransition();
 }
}
const ambientScenes={
 foyer:[
  ['foyer-vase','복도 끝 꽃병',4,62,'유리병 안의 하얀 꽃들이 창문 쪽으로 조금 기울어 있다.',[
   ['화병 들어 보기','유리병을 들어 올리니 받침대 아래에 말라붙은 물자국이 있다. 향기는 생각보다 진하다.',5],
   ['바닥까지 살펴보기','작은 꽃잎 하나가 바닥에 붙었다. 미로가 다가와 냄새를 맡더니 재채기한다.',10]]],
  ['foyer-main-door','커다란 현관문',55.6,58.2,'문고리의 황동 장식이 한쪽만 닳아 있다. 문틈에서는 서늘한 바람이 새어 나온다.',[
   ['손잡이 돌려 보기','묵직한 문고리가 반 바퀴쯤 돌아가다 멈춘다. 아래쪽 걸쇠가 안에서 단단히 걸린 듯하다.',5]]],
  ['foyer-chandelier','낡은 샹들리에',50,13,'천장의 샹들리에에는 유리 방울이 여러 개 매달려 있다.',[
   ['체인 살펴보기','위쪽 체인은 단단하다. 유리 방울 한 개가 공기 흐름에 맞춰 천천히 흔들린다.',5]]],
  ['foyer-sconce','벽의 등잔',9,36,'금빛 벽등의 불꽃은 바람이 없는데도 아주 조금 흔들린다.',[
   ['등잔 덮개 열어 보기','덮개 속에는 식은 밀랍이 한쪽으로 굳어 있다. 오래전 누군가 촛불을 잘못 끈 모양이다.',10]]],
  ['foyer-banner','달무늬 태피스트리',66,31,'짙은 천에는 희미한 금실과 오래된 보풀이 엉켜 있다.',[
   ['천 끝을 들춰 보기','벽에는 먼지가 두껍게 쌓여 있다. 천은 생각보다 무겁고 움직일 때마다 먼지가 떨어진다.',10],
   ['안쪽까지 더듬어 보기','얽힌 실을 하나 풀자 자잘한 보풀이 손가락에 붙었다. 숨겨진 칸은 보이지 않는다.',15]]],
  ['foyer-window','잠긴 창문',94,35,'창틀 가장자리에 찬 이슬이 맺혀 있다. 밖에는 정원 나무가 흔들린다.',[
   ['유리창 닦아 보기','김이 닦인 자리에 달빛이 선명해졌다. 멀리 자그마한 새가 울고 지나간다.',10]]]
 ],
 study:[
  ['study-globe','황동 지구본',65,47,'지구본의 일부 지명이 낡아 읽기 어렵다. 황동 고리가 반들반들하다.',[
   ['지구본 돌려 보기','지구본이 부드럽게 돌아간다. 어느 나라 위에 고양이 털 한 올이 달라붙어 있다.',10],
   ['바닥 받침 확인하기','받침을 뒤집어 보니 오래된 가격표 자국뿐이다. 미로가 공을 가지고 놀듯 눈으로 따라간다.',10]]],
  ['study-ladder','서가의 사다리',45,43,'높은 책장 옆에 가벼운 나무 사다리가 기대어 있다.',[
   ['사다리 옮겨 보기','사다리를 조금 밀자 나무가 삐걱거린다. 위쪽 서가 양 끝에 황동 문양이 붙어 있다.',15],
   ['높은 서가 양끝 살펴보기','왼쪽 황동 끝에는 별(✦), 오른쪽에는 초승달(☾)이 남아 있다. 어떤 책을 그 사이에 놓을지는 책등을 비교해야 한다.',10]]],
  ['study-bouquet','창가 꽃다발',79,39,'작은 흰 꽃다발이 꽃병에 꽂혀 있다. 수분이 거의 남지 않았다.',[
   ['꽃잎 만져 보기','마른 꽃잎이 손바닥에 떨어졌다. 창가의 그림자가 잠깐 꽃잎 위를 스친다.',5]]],
  ['study-candles','은촛대',88,12,'책상 너머 촛대에 여러 개의 짧아진 초가 서 있다.',[
   ['촛농 긁어 보기','굳은 촛농이 쉽게 부서진다. 손끝에서 달콤한 냄새가 난다.',10],
   ['받침까지 뒤져 보기','촛대 아래에는 동그란 눌림 자국만 남아 있다. 위태롭게 서 있던 촛불이 흔들린다.',15]]],
  ['study-rug','서재의 작은 양탄자',60,87,'폭신한 양탄자 끝이 책상 다리 아래로 말려 있다.',[
   ['양탄자 끝 들어 보기','책상 밑에서 가느다란 고양이 털 몇 가닥이 나왔다. 누군가 오래 여기 누워 있었나 보다.',10]]]
 ],
 greenhouse:[
  ['green-fountain','가운데 분수대',50,69,'분수대 가장자리에는 오래된 동전 모양의 물자국이 남아 있다.',[
   ['물속 들여다보기','분수대는 너무 얕아 물밑까지 훤히 보인다. 작은 잎 하나가 둥둥 떠다닌다.',5],
   ['돌 틈 문질러 보기','차갑고 매끄러운 이끼가 손끝에 묻어난다. 멀리서 미로가 물방울을 피해 달아난다.',10]]],
  ['green-teacup','정원 찻잔',27,90,'꽃무늬 찻잔에는 차 대신 맑은 빗물이 조금 고여 있다.',[
   ['찻잔 들어 보기','잔 아래에 오래된 작은 접시가 놓여 있다. 멋대로 마시기에는 너무 오래된 물이다.',5]]],
  ['green-vines','천장의 덩굴',35,15,'덩굴이 유리 천장 위에서 아래로 길게 늘어져 있다.',[
   ['잎 사이 살펴보기','잎 뒤에서 아주 작은 날벌레가 날아간다. 잎맥은 별빛을 받아 투명하게 보인다.',10]]],
  ['green-chair','흰 정원 의자',28,62,'페인트가 벗겨진 의자에 작은 흙자국 두 개가 찍혀 있다.',[
   ['의자 끌어 보기','의자 다리가 바닥을 스치며 낮은 소리를 낸다. 방금 자국이 하나 더 생겼다.',15],
   ['의자 아래 보기','조그만 씨앗 껍질들이 모여 있다. 어딘가에서 새가 날아와 간식을 먹고 간 흔적 같다.',10]]],
  ['green-planter','나무 화분 상자',61,91,'나무 상자에 보라색 꽃과 작은 이끼가 함께 자란다.',[
   ['화분 흙 파보기','촉촉한 흙 사이에서 작은 지렁이가 몸을 움츠린다. 나무 상자에는 오래된 흠집이 있다.',15],
   ['더 깊이 파보기','가느다란 뿌리가 손끝에 닿는다. 미로가 지렁이 쪽으로 다가오자 금세 몸을 숨긴다.',15]]]
 ],
 tower:[
  ['tower-globe','별자리 지구본',17,56,'시계탑 구석의 황동 구체에 오래된 바다와 별무늬가 새겨져 있다.',[
   ['지구본 살짝 돌리기','금속 구체가 느리게 돌아가며 낮은 울림을 낸다. 아래쪽에는 녹이 슬어 있다.',10]]],
  ['tower-scroll','책상 위 두루마리',54,90,'두루마리 종이가 말린 채 탁자 구석에 놓여 있다.',[
   ['종이 펴 보기','비어 있는 악보 오선지다. 누군가 연주를 기록하려다 말았던 듯하다.',10],
   ['뒤집어서 보기','잉크가 번진 자국만 남아 있다. 종이가 손가락 사이에서 바스락거린다.',5]]],
  ['tower-banner','파란 현수막',31,20,'층고 높은 벽에 푸른 깃발이 드리워져 있다.',[
   ['천 끝 잡아 보기','두꺼운 천이 손에 걸리며 오래된 먼지가 떨어진다. 자수는 아주 정교하다.',10]]],
  ['tower-stairs','구부러진 철제 계단',98,57,'소용돌이처럼 구부러진 계단이 위쪽 어둠으로 이어져 있다.',[
   ['난간 짚어 보기','금속 난간이 차갑다. 발밑에서 짧은 삐걱거림이 들린다.',5],
   ['한 계단 올라 보기','계단이 멀리서 보이는 것보다 가파르다. 막힌 철문 앞에서 더는 올라갈 수 없다.',10]]],
  ['tower-lantern','낡은 청동등',64,75,'흐린 유리를 두른 작은 등불이 긴 그림자를 만들고 있다.',[
   ['등불 주위 살펴보기','등불 아래에는 떨어진 심지 조각 하나가 있다. 금속 받침은 조금 뜨겁다.',5]]]
 ]
};
// Artwork-based sub-objects are maintained in a separate source file.
for(const [room,entries] of Object.entries(window.MoyeoExtraProps||{})){
 if(!Object.hasOwn(ambientScenes,room)||!Array.isArray(entries))continue;
 ambientScenes[room].push(...entries);
}
const ambientLookup=Object.fromEntries(Object.values(ambientScenes).flat().map(o=>[o[0],{id:o[0],name:o[1],x:o[2],y:o[3],description:o[4],steps:o[5]}]));
/* One optional search action = one estimated in-game duration, never a real wait.
   Older v21 saves used 10 seconds per completed ambient step. Their historical
   elapsed time stays untouched, while new actions add their own chosen duration. */
const AMBIENT_SECONDS=[5,10,15];
function ambientStepSeconds(object,index){
 const value=Number(object?.steps?.[index]?.[2]);
 return AMBIENT_SECONDS.includes(value)?value:10;
}
function ambientTimeSpent(id,level){
 const stored=Number(g.ambientSpent?.[id]);
 if(g.ambientSpent&&Object.hasOwn(g.ambientSpent,id)&&Number.isFinite(stored)&&stored>=0)return stored;
 return level*10; // historical v21 inspection progress: never retroactively recalculate it
}
function ambientInspect(id,chargedSeconds=0){
 const object=ambientLookup[id];if(!object)return;
 const level=Math.max(0,Math.min(object.steps.length,Number(g.ambientSteps?.[id])||0));
 const result=level===0?object.description:object.steps[level-1][1];
 const action=object.steps[level]?.[0];
 const seconds=action?ambientStepSeconds(object,level):0;
 const spent=ambientTimeSpent(id,level);
 const progress=level?'<div class="ambient-time-note">이 사물의 심화 조사 시간: '+spent+'초</div>':'';
 const actions=action?[[action+' · +'+seconds+'초','ambient-next-'+id,true],['그만 살펴보기','close']]:[['돌아가기','close',true]];
 if(id==='foyer-sconce')actions.unshift([g.ambientFlags?.sconceHeat?'등잔에 손을 댔던 기억':'불꽃 가까이 손 넣어보기','sconce-touch',false]);
 modal('저택 · 주변 조사',object.name,
  '<div class="ambient-description">'+result+'</div>'+progress+
  (level>=object.steps.length?'<p class="puzzle-helper">여기서는 더 살펴볼 것이 보이지 않는다.</p>':''),
  actions
 );
 if(chargedSeconds>0){tick();notify('탐험 시간 +'+chargedSeconds+'초');}
}
function ambientNext(id){
 const object=ambientLookup[id];if(!object)return;
 g.ambientSteps??={};
 const level=Math.max(0,Math.min(object.steps.length,Number(g.ambientSteps[id])||0));
 if(level>=object.steps.length){ambientInspect(id);return;}
 const seconds=ambientStepSeconds(object,level);
 g.ambientSpent??={};
 g.ambientSpent[id]=ambientTimeSpent(id,level)+seconds;
 g.ambientSteps[id]=level+1;
 // An optional-looking household prop can contain a genuine fragment. It is
 // recorded only after physical examination, under the same time rules.
 if(id==='study-ladder'&&level===1)clue('shelfEnds');
 if(id==='green-row-of-pots'&&level===1)clue('waterSketch');
 if(id==='green-fountain-statue'&&level===0)clue('cloudOutlet');
 g.elapsedCarry=(Number(g.elapsedCarry)||0)+seconds;
 save();ambientInspect(id,seconds);
}

/* Optional foyer bell toy: a real, replayable four-note interaction, not a required seal. */
const bellScore=['◆','☾','❖','✦'];
const bellVoices={'☾':440,'✦':523.25,'◆':659.25,'❖':783.99};
function bellTone(symbol){
 if(!g.sound)return;
 try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume();
  const t=audio.currentTime,o=audio.createOscillator(),v=audio.createGain();
  o.type='sine';o.frequency.value=bellVoices[symbol];
  v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(.075,t+.012);
  v.gain.exponentialRampToValueAtTime(.0001,t+.55);
  o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+.58);
 }catch(e){}
}
function foyerBell(){
 g.sideGames??={bell:false};g.bellInput??=[];
 if(g.sideGames.bell){
  modal('현관 · 작은 발견','달빛 종의 짧은 연주',
   '<div class="bell-toy-complete">잘했어요! 종의 맑은 소리가 현관을 채웠다.<small>미로가 귀를 쫑긋 세운다. 아무 잠금쇠도 움직이지 않는다.</small></div>'+
   '<div class="bell-sheet">낡은 악보 <strong>'+bellScore.join(' · ')+'</strong></div>',
   [['다시 연주해 보기','bell-reset',true],['돌아가기','close']]);
  return;
 }
 const buttons=Object.entries(bellVoices).map(([glyph],i)=>
  '<button type="button" class="bell-key" data-action="bell-note-'+i+'" aria-label="황동 종 '+glyph+'">' +
  '<span>♪</span><b>'+glyph+'</b></button>').join('');
 modal('현관 · 선택형 놀이','작은 황동 종',
  '<p class="modal-description">탁자 위에 크기가 다른 종 네 개가 달려 있다. 옆에 구겨진 작은 악보가 펼쳐져 있다.</p>'+
  '<div class="bell-sheet"><small>낡은 악보 · 연주 기록</small><div class="bell-score">'+bellScore.map(n=>'<span>'+n+'</span>').join('')+'</div></div>'+
  '<div class="bell-keys" role="group" aria-label="네 개의 종을 눌러 연주할 수 있습니다">'+buttons+'</div>'+
  '<div class="bell-progress" aria-live="polite">'+(g.bellInput.map(n=>'<span>'+n+'</span>').join('')||'<span class="bell-idle">종의 맑은 울림을 들어 볼 수 있다.</span>')+'</div>',
  [['연주를 처음부터','bell-reset'],['돌아가기','close',true]]);
}
function bellNote(index){
 const symbols=Object.keys(bellVoices);
 if(!Number.isInteger(index)||index<0||index>=symbols.length||g.sideGames?.bell)return;
 const symbol=symbols[index];bellTone(symbol);
 g.bellInput??=[];g.bellInput.push(symbol);
 if(g.bellInput.length>=4){
  if(g.bellInput.join('|')===bellScore.join('|')){
   g.sideGames??={};g.sideGames.bell=true;
   g.ambientFlags??={};g.ambientFlags.bellPlayed=true;
   $('catDialog').textContent='이 소리… 나도 따라 부를 수 있을 것 같아. 야옹!';
   g.catMood='happy';render();
   return foyerBell();
  }
  g.bellInput=[];notify('종소리가 짧게 흩어졌다. 다시 연주할 수 있다.');
 }
 save();
 const progress=$('modalContent').querySelector('.bell-progress');
 if(progress)progress.innerHTML=g.bellInput.map(n=>'<span>'+n+'</span>').join('')||'<span class="bell-idle">종의 맑은 울림을 들어 볼 수 있다.</span>';
 else foyerBell();
}
function bellReset(){
 g.bellInput=[];if(g.sideGames)g.sideGames.bell=false;save();foyerBell();
}
function sconceTouch(){
 g.ambientFlags??={};
 const first=!g.ambientFlags.sconceHeat;
 if(first){g.ambientFlags.sconceHeat=true;g.elapsedCarry=(Number(g.elapsedCarry)||0)+5;tick();}
 tone('bad');
 $('catDialog').textContent='아이쿠! 불꽃에 손을 너무 가까이 댔잖아. 조심해!';
 g.catMood='startled';render();
 modal('저택 · 작은 사고','아이쿠, 너무 뜨거워요!',
  '<div class="ambient-warmth"><span aria-hidden="true">♨</span><p>깜짝 놀라 손을 뺐다. 다친 곳은 없지만 손끝이 잠깐 화끈거린다.</p>'+
  '<small>미로가 눈을 동그랗게 뜨고 쳐다본다.</small></div>'+
  (first?'<div class="ambient-time-note">탐험 시간 +5초</div>':'<p class="puzzle-helper">전에 만져 봤던 등잔이다.</p>'),
  [['등잔 다시 보기','ambient-open-foyer-sconce',true],['돌아가기','close']]);
}


/* Optional wall light toy, independent of all required locks and ending paths. */
function wallLightsToy(){
 g.wallLights??=[false,false,false,false];
 const colors=['#f5cf84','#9bacf7','#7acac4','#eaa5c5'];
 const bulbs=g.wallLights.map((on,i)=>'<button type="button" class="wall-light-switch '+(on?'lit':'')+
  '" data-action="wall-light-'+i+'" aria-label="'+(i+1)+'번째 둥근 유리 누르기" aria-pressed="'+on+
  '" style="--light-color:'+colors[i]+'">'+(on?'✦':'○')+'</button>').join('');
 const done=g.wallLights.every(Boolean);
 const feedback=done
  ?'<div class="wall-light-feedback">네 개의 불빛이 모두 반짝인다!<small>그런데 문은 꿈쩍도 하지 않는다. 미로가 박수 대신 앞발로 책상을 톡 친다.</small></div>'
  :'<p class="puzzle-helper">색유리 네 장은 누를 때마다 작은 소리를 낸다. 꼭 무언가를 해내야 하는 장치는 아닌 듯하다.</p>';
 modal('현관 · 작은 장난','네 개의 둥근 벽 장식',
  '<p class="modal-description">얇은 색유리 아래에 아주 작은 스위치들이 있다. 네 개를 각각 눌러 볼 수 있다.</p>'+
  '<div class="wall-light-board" role="group" aria-label="누를 수 있는 둥근 유리 네 개">'+bulbs+'</div>'+feedback,
  [['장식 다시 끄기','wall-reset'],['돌아가기','close',true]]);
}
function wallLightPress(index){
 if(!Number.isInteger(index)||index<0||index>3)return;
 g.wallLights??=[false,false,false,false];
 g.wallLights[index]=!g.wallLights[index];
 tone('tap');
 if(g.wallLights.every(Boolean)){
  const newDiscovery=!g.sideGames?.wallLights;
  g.sideGames??={};
  g.sideGames.wallLights=true;
  if(newDiscovery)notify('작은 발견 · 모두 켜진 둥근 장식');
 }
 save();
 wallLightsToy();
}
function wallLightReset(){
 g.wallLights=[false,false,false,false];save();wallLightsToy();
}

const hotspots={
 foyer:[{id:'invitation',x:27,y:40,name:'현관의 초대장',icon:'✉'},{id:'catbed',x:20,y:70,name:'고양이 침대',icon:'♧'},{id:'rug',x:47,y:83,name:'오래된 양탄자',icon:'⌕',ok:()=>done('rug')},{id:'cabinet',x:76,y:72,name:'황동 수납장',icon:'▣',ok:()=>done('foot')},{id:'crescent',x:54,y:35,name:'반쪽 달 장식',icon:'☾',ok:()=>done('mirror')},{id:'foyer-bell',x:80,y:55,name:'탁자 위 작은 종',icon:'♫'},{id:'study',x:14,y:54,name:'서재 문',icon:'⌑'},{id:'cat',x:84,y:76,name:'미로',icon:'♣'}],
 study:[{id:'books',x:24,y:42,name:'계절 책장',icon:'▤',ok:()=>done('books')},{id:'portrait',x:47,y:30,name:'빛바랜 초상화',icon:'▧',ok:()=>has('film')},{id:'piano',x:74,y:77,name:'자동연주 피아노',icon:'♫',ok:()=>done('piano')},{id:'desk',x:38,y:78,name:'잠긴 서랍과 유리판',icon:'⌗',ok:()=>done('film')},{id:'greenhouse',x:91,y:56,name:'온실 문',icon:'⌑'},{id:'cat',x:79,y:57,name:'미로',icon:'♣'}],
 greenhouse:[{id:'record',x:21,y:30,name:'정원 재배 기록',icon:'▤'},{id:'water',x:25,y:73,name:'네 개의 급수관',icon:'◉',ok:()=>done('water')},{id:'beam',x:64,y:38,name:'채광과 반사 장치',icon:'◐',ok:()=>done('light')},{id:'flower',x:53,y:64,name:'달빛꽃',icon:'❀',ok:()=>done('light')},{id:'shutter',x:86,y:25,name:'채광창 손잡이',icon:'☾'},{id:'pot',x:76,y:75,name:'오래된 유리 화분',icon:'⌕',ok:()=>has('collar')},{id:'tower',x:91,y:56,name:'시계탑 입구',icon:'⌑'}],
 tower:[{id:'pedestal',x:23,y:75,name:'세 인장의 제단',icon:'❖'},{id:'clock',x:50,y:36,name:'거대한 시계',icon:'◷',ok:()=>done('clock')},{id:'keeper',x:19,y:33,name:'시계 관리 기록',icon:'▤'},{id:'pin',x:78,y:81,name:'붉은 고정쇠',icon:'⌁',ok:()=>done('pin')},{id:'portal',x:84,y:54,name:'마지막 문으로 올라가는 계단',icon:'✦',ok:()=>done('pin')},{id:'hall',x:94,y:87,name:'돌아가는 계단',icon:'⌑'}]
};
// Neutral examination targets are interwoven with puzzle elements, never appended as a separate hint tier.
for(const [room,objects] of Object.entries(ambientScenes)){
 const core=hotspots[room],ordinary=objects.map(p=>({id:p[0],name:p[1],x:p[2],y:p[3],detail:!!p[6]})),mixed=[];
 for(let i=0;i<Math.max(core.length,ordinary.length);i++){
  if(core[i])mixed.push(core[i]);
  if(ordinary[i])mixed.push(ordinary[i]);
 }
 hotspots[room]=mixed;
}
/* Uniform exploration: mandatory puzzle parts and ordinary props both require
   paid physical examination; looking at any object remains free.
   Re-entering a previously examined mechanism never costs another fee. */
const coreInspections={"invitation":[5,"초대장과 봉투","오래된 편지와 봉투가 놓여 있다. 종이는 여러 번 펼친 흔적이 있다.","봉투를 집어 펼쳐 보기"],"rug":[10,"바닥에 놓인 양탄자","큰 양탄자 끝이 약간 들려 있다. 그림자 아래 바닥이 궁금하다.","양탄자 모서리 들추기"],"cabinet":[5,"황동 수납장","손잡이에 작은 홈 네 개가 있다. 단단한 잠금쇠가 걸려 있다.","손잡이를 돌려 장치 확인하기"],"crescent":[10,"반쪽 달 장식","금빛 장식의 표면에 얇은 홈이 있다. 먼지가 적은 부분도 보인다.","황동 장치 가까이 조사하기"],"books":[10,"달빛 서가","계절 이름이 붙은 책등마다 다른 문양이 보인다.","책을 꺼내 양쪽 문양 확인하기"],"portrait":[10,"빛바랜 초상화","초상화 아래 금빛 테두리가 약간 벌어져 있다.","액자 틈과 뒷면 확인하기"],"piano":[10,"기계식 피아노","원통 축과 낡은 건반이 보인다.","건반 덮개 열어 장치 확인하기"],"desk":[10,"잠긴 서랍과 유리판","유리 아래에 작은 표식이 있고 서랍은 열리지 않는다.","책상 유리판과 서랍 조사하기"],"record":[10,"온실 관리 기록","오래된 관리 기록이 벽에 붙어 있다. 먼지 때문에 글씨가 흐리다.","관리 기록 펼쳐 읽기"],"water":[10,"수조의 황동 밸브","네 수조가 금속관과 이어져 있다. 밸브에는 손자국이 있다.","밸브 덮개 열어 눈금 살펴보기"],"beam":[10,"유리 채광 장치","색유리 두 장이 채광창의 둥근 홈에 끼워져 있다.","유리 틀 고정쇠 풀어 보기"],"flower":[5,"달빛꽃","푸른 꽃잎 표면에 작은 점들이 있고 바깥쪽은 오므라들었다.","꽃잎 자세히 들여다보기"],"shutter":[5,"채광창 손잡이","창틀에 손잡이와 걸쇠가 있다.","걸쇠를 당겨 보기"],"pot":[10,"오래된 유리 화분","꽃줄기 뒤쪽에 두꺼운 먼지가 쌓인 유리 화분이 있다.","유리 가장자리 들어 살펴보기"],"pedestal":[10,"세 인장의 제단","서로 모양이 다른 세 개의 홈이 파여 있다.","제단의 홈과 인장 뒷면 조사하기"],"keeper":[10,"시계 관리인의 기록","관리 장부 가장자리가 접혀 있고 일부는 낡은 끈으로 묶여 있다.","장부 펼쳐 내용 읽기"],"clock":[10,"거대한 시계","시계의 바늘은 멈춰 있고 수동 손잡이에 먼지가 묻었다.","태엽과 바늘 조작 장치 조사하기"],"pin":[10,"붉은 고정쇠","시계추 아래에 굵은 붉은 걸쇠가 걸려 있다. 세 바퀴는 움직이지 않는다.","고정쇠와 황동 바퀴 조사하기"]};
function coreInspect(id){
 const spec=coreInspections[id];
 if(!spec||g.coreInvestigations?.[id])return false;
 const [seconds,title,description,action]=spec;
 modal('저택 · 주변 조사',title,
  '<div class="ambient-description">'+description+'</div>'+
  '<p class="puzzle-helper">겉으로 보는 것만으로는 내부 상태를 알기 어렵다.</p>',
  [[action+' · +'+seconds+'초','core-deep-'+id,true],['다른 곳 살펴보기','close']]);
 return true;
}
function coreDeep(id){
 const spec=coreInspections[id];if(!spec)return;
 g.coreInvestigations??={};
 if(!g.coreInvestigations[id]){
  g.coreInvestigations[id]=true;
  g.elapsedCarry=(Number(g.elapsedCarry)||0)+spec[0];
  save();tick();notify('탐험 시간 +'+spec[0]+'초');
 }
 inspect(id);
}
function coreOneOff(id,seconds){
 g.coreActionCosts??={};
 if(g.coreActionCosts[id])return false;
 g.coreActionCosts[id]=true;g.elapsedCarry=(Number(g.elapsedCarry)||0)+seconds;
 save();tick();notify('탐험 시간 +'+seconds+'초');return true;
}

function miroLookAt(id){
 if(!['portrait','flower','piano','clock','foyer-bell','foyer-vase','green-planter'].includes(id))return;
 const avatar=$('catAvatar');if(!avatar)return;
 avatar.classList.remove('miro-looking');void avatar.offsetWidth;avatar.classList.add('miro-looking');
 setTimeout(()=>avatar.classList.remove('miro-looking'),650);
}
function inspect(id){if(g.ending){ending(g.ending);return}rememberInspection(id);miroLookAt(id);if(coreInspect(id))return;if(id==='foyer-four-lights')return wallLightsToy();if(Object.hasOwn(ambientLookup,id))return ambientInspect(id);switch(id){
 case 'cat':talk();break;
 case 'foyer-bell':foyerBell();break;
 case 'invitation':invitation();break;
 case 'catbed':return catbedTrack();
 case 'rug':rug();break;
 case 'cabinet':if(!done('foot'))foot();else if(!has('silverDisc')){modal('현관 · 수납장 안쪽','열린 황동 수납장','<p class="modal-description">걸쇠가 풀리자 서랍이 조금 열린다. 안쪽에는 접힌 종이와 금빛 물건들이 희미하게 보인다.</p>',[['수납장 안쪽 뒤져 보기 · +10초','cabinet-search',true],['뒤로 가기','close']])}else article('빈 수납장','안쪽 기록에는 현관이 밤 9시에 잠긴다고 쓰여 있다.');break;
 case 'crescent':mirror();break;
 case 'study':move('study');break;
 case 'books':books();break;
 case 'portrait':portrait();break;
 case 'piano':piano();break;
 case 'desk':desk();break;
 case 'greenhouse':move('greenhouse');break;
 case 'record':clue('water');clue('watering');article('달빛 온실 관리판','종이 위에는 네 개의 수조를 잇는 배관도가 그려져 있다.\n해 그림 수조의 세 번째 눈금에 오래된 물때가 표시되어 있다.\n\n자동 급수 시계: 「종료 21:10」.\n\n종이 오른쪽 아래가 찢어져 다른 수조의 수위 기록은 읽을 수 없다.');break;
 case 'water':water();break;
 case 'beam':beam();break;
 case 'flower':
  if(done('light')&&g.flags.curtain&&!done('blackout')){
   modal('유리 온실 · 관찰','꽃술에 남은 은빛 흔적',
    '<p class="modal-description">어둠 속에서 꽃술을 살펴보니 꽃가루가 작게 모여 있다. 바닥에도 비슷한 점들이 희미하게 이어져 있다.</p>'+
    '<div class="pollen-tracks" aria-hidden="true"><span>✧ · ✧ · ✧</span><span>· ✧ ✧ ·</span><span>✧ · · ✧</span></div>',
    [['꽃가루를 가까이 살핀다 · +10초','pollen-rub',true],['그대로 두기','close']]
   );
  }else if(!done('light')){
   if(g.flags.flowerObserved)return flowerPattern();
   modal('유리 온실 · 관찰','시든 달빛꽃',
    '<p class="modal-description">얇고 반투명한 꽃잎 다섯 곳에 작은 흔적이 있다. 유리돔 너머로는 정확한 위치가 잘 보이지 않는다.</p>',
    [['꽃잎의 흔적 가까이 보기 · +10초','flower-pattern',true],['다른 곳 살펴보기','close']]
   );
  }else article('달빛꽃','달빛을 받은 꽃잎이 펼쳐졌다. 미로가 잠시 움직임을 멈추고 꽃향기를 맡는다.');
  break;
 case 'shutter':
  if(!done('light')){article('채광창','달빛이 스며드는 창틀을 움직이려 하자 아래쪽의 황동 걸쇠가 걸린다.');break;}
  g.flags.curtain=!g.flags.curtain;
  notify(g.flags.curtain?'유리창 덮개가 닫히고 꽃술 근처의 먼지가 빛나기 시작한다.':'채광창이 열리고 꽃잎이 다시 달빛을 받는다.');
  save();render();
  article('채광창',g.flags.curtain?'실내가 어두워지자 흰 꽃가루가 바닥에 작은 점들을 남긴다.':'창이 열리자 흰 가루가 다시 평범한 먼지처럼 보인다.');
  break;
 case 'pot':
  if(!done('blackout')){
   article('오래된 유리 화분',g.flags.curtain?'유리 표면에는 안쪽을 긁은 듯한 가는 선이 있다.':'먼지가 두껍게 쌓여 안쪽을 볼 수 없다.');
   break;
  }
  if(!has('collar')){item('collar');modal('FOUND','은빛 목걸이',`<div class="collect-visual">◇</div><div class="letter">「미로, 나의 영원한 가족 — 루나」</div><p class="modal-description">목걸이 안쪽에는 작게 긁힌 고양이 발톱 자국이 남아 있다.</p>`);}
  else article('빈 화분','목걸이가 놓여 있던 흔적만 남았다.');
  break;
 case 'tower':move('tower');break;
 case 'pedestal':article('인장의 제단',g.seals.length===3?'세 인장이 제단 안의 원형 홈에 단단히 들어가 있다. 뒷면에는 서로 다른 자국이 남았다.\n\n길의 인장 ❖  ◇◇\n소리의 인장 ♫  ◇\n빛의 인장 ☼  ◇◇◇\n\n제단 아래에서 느릿하게 톱니가 맞물리는 소리가 난다.':`황동 제단의 세 홈 중 ${g.seals.length}곳에서만 미세한 진동이 느껴진다.`);break;
 case 'keeper':clue('clock');clue('pin');clue('bell');article('시계 관리인의 낡은 장부','첫 번째 줄: 「문이 닫히는 소리를 들었다. 잠시 뒤 온실 쪽 자동 급수관이 멈췄다.」\n\n두 번째 줄: 「급수관의 마지막 떨림이 멎자 모래시계를 뒤집었다. 모래가 완전히 떨어지는 데는 꼭 오 분.」\n\n마지막 줄: 「열두 번은 자정을 알리는 종. 열세 번째는 멈춘 시간을 붙드는 비상 종이다. 이를 울린 이는 시계 안에 갇히고 사람들의 기억에서도 잊힌다.」\n\n책장 아래 덧붙임: 「한 사람의 모습과 남긴 말, 이름을 품은 물건이 같은 이를 가리킬 때 봉인은 풀릴 수 있다.」');break;
 case 'clock':clock();break;
 case 'pin':pin();break;
 case 'portal':if(done('pin'))finalChoices();else article('위층으로 향하는 계단','계단 위쪽에 닫힌 문이 희미하게 보인다. 아래층 시계추에는 아직 금속 고리가 걸려 있다.');break;
 case 'hall':move('foyer');break;
 }}
function flowerPattern(){
 if(!g.flags.flowerObserved){coreOneOff('flower-pattern',10);g.flags.flowerObserved=true;save();}
 modal('유리 온실 · 관찰','꽃잎에 남은 밝은 자국',
  '<p class="modal-description">유리 돔의 반사를 피해 꽃잎을 비스듬히 들여다봤다. 다섯 개의 작은 반투명 자국이 서로 다른 위치에 있다.</p>'+
  glassGrid(glassPatterns.target,'flower-imprint'),
  [['다른 곳 둘러보기','close',true]]);
}

/* Three different five-move tracks share one doorway origin and one bell.
   Some tiles hold two different species' overlapping impressions. Show BOTH.
   Correct route is identified by the chipped cat paw observed at the bed. */
const FOYER_GRID_SIZE=5;
const FOYER_DESTINATION=12;
const FOYER_ROUTES={"cat":[5,6,1,2,7,12],"dog":[5,10,11,16,17,12],"human":[5,0,1,6,11,12]};
const FOYER_STARTS={"5":"문턱"};
const FOYER_FOOT_SEQUENCE='RURDD';
function foyerRouteDir(route,i){
 const here=route[i],next=route[i+1];
 if(next===here+FOYER_GRID_SIZE)return 'D';
 if(next===here-FOYER_GRID_SIZE)return 'U';
 if(Math.floor(next/FOYER_GRID_SIZE)===Math.floor(here/FOYER_GRID_SIZE)){
  if(next===here+1)return 'R';
  if(next===here-1)return 'L';
 }
 throw Error('Disconnected foyer trail');
}
function foyerRouteMarks(route){
 return Object.fromEntries(route.slice(1,-1).map((cell,i)=>[cell,foyerRouteDir(route,i+1)]));
}
const FOYER_CAT_PRINTS=foyerRouteMarks(FOYER_ROUTES.cat);
const FOYER_DOG_PRINTS=foyerRouteMarks(FOYER_ROUTES.dog);
const FOYER_BOOT_PRINTS=foyerRouteMarks(FOYER_ROUTES.human);
function foyerPawSvg(chipped,dir='U',large=false){
 const rotation={U:0,R:90,D:180,L:270}[dir]||0;
 const pad=chipped?
  'M12 39 C9 34 15 25 21 24 C24 24 26 26 29 24 C35 24 38 29 33 33 L28 35 L35 38 Q34 45 25 43 Q18 46 12 39 Z':
  'M12 39 C9 34 15 25 21 24 C24 24 26 26 29 24 C35 25 38 33 35 39 Q34 45 25 43 Q18 46 12 39 Z';
 return '<svg class="foyer-paw-print'+(large?' large':'')+'" viewBox="0 0 48 52" aria-hidden="true" style="transform:rotate('+rotation+'deg)">'+
  '<ellipse cx="9" cy="18" rx="4.5" ry="6.6"/><ellipse cx="18" cy="11" rx="4.5" ry="6.3"/>'+
  '<ellipse cx="28" cy="11" rx="4.5" ry="6.3"/><ellipse cx="38" cy="18" rx="4.5" ry="6.6"/>'+
  '<path d="'+pad+'"/></svg>';
}
function foyerDogSvg(dir='U',large=false){
 const rotation={U:0,R:90,D:180,L:270}[dir]||0;
 return '<svg class="foyer-dog-print'+(large?' large':'')+'" viewBox="0 -5 48 57" aria-hidden="true" style="transform:rotate('+rotation+'deg)">'+
  '<path class="foyer-dog-claws" d="M7 10 L4 2 M17 3 L16 -3 M29 3 L31 -3 M39 10 L43 2"/>'+
  '<ellipse cx="9" cy="18" rx="4.8" ry="6.8"/><ellipse cx="18" cy="11" rx="4.8" ry="6.5"/>'+
  '<ellipse cx="29" cy="11" rx="4.8" ry="6.5"/><ellipse cx="39" cy="18" rx="4.8" ry="6.8"/>'+
  '<path d="M11 39 Q10 30 19 25 Q25 22 30 25 Q39 30 36 39 Q34 46 24 44 Q15 46 11 39 Z"/></svg>';
}
function foyerBootSvg(angle=0,large=false){
 return '<svg class="foyer-boot-print'+(large?' large':'')+'" viewBox="0 0 40 64" aria-hidden="true" style="transform:rotate('+angle+'deg)">'+
  '<path class="foyer-boot-sole" d="M14 2 Q4 7 5 24 L9 53 Q11 62 21 62 Q32 60 32 51 L35 24 Q36 6 25 2 Z"/>'+
  '<path class="foyer-boot-tread" d="M7 18 L34 16 M8 26 L33 25 M11 36 L31 35 M12 45 L30 44 M14 53 L28 52"/>'+
  '</svg>';
}
function catbedTrack(){
 return modal('현관 홀 · 관찰','미로의 작은 침대',
  '<p class="modal-description">방석 끝에 작게 찍힌 발바닥 흔적이 있다. 뒤꿈치 오른쪽 가장자리가 반달처럼 깨져 있다. 방석 밖에는 먼지가 묻은 발자국이 하나 더 남아 있다.</p>'+
  '<div class="foyer-track-sample">'+foyerPawSvg(true,'U',true)+'</div>'+
  '<p class="puzzle-helper">작은 발자국이 양탄자 쪽으로 이어진다.</p>');
}
function foyerTrailTile(i){
 if(Object.hasOwn(FOYER_STARTS,i))return {type:'anchor',text:FOYER_STARTS[i]};
 if(i===FOYER_DESTINATION)return {type:'anchor',text:'종'};
 const prints=[];
 if(Object.hasOwn(FOYER_CAT_PRINTS,i))prints.push({type:'cat',chipped:true,dir:FOYER_CAT_PRINTS[i]});
 if(Object.hasOwn(FOYER_DOG_PRINTS,i))prints.push({type:'dog',dir:FOYER_DOG_PRINTS[i]});
 if(Object.hasOwn(FOYER_BOOT_PRINTS,i))prints.push({type:'boot',dir:FOYER_BOOT_PRINTS[i]});
 return prints.length>1?{type:'mixed',prints}:prints[0]||{type:'dust'};
}
function foyerTrailGraphic(t,large=false){
 if(t.type==='mixed')return '<span class="foyer-track-mix" aria-hidden="true">'+
  t.prints.map(p=>'<span class="foyer-mix-print">'+foyerTrailGraphic(p,large)+'</span>').join('')+'</span>';
 if(t.type==='anchor')return '<span class="trail-landmark">'+t.text+'</span>';
 if(t.type==='cat')return foyerPawSvg(t.chipped,t.dir,large);
 if(t.type==='dog')return foyerDogSvg(t.dir,large);
 if(t.type==='boot')return foyerBootSvg({U:0,R:90,D:180,L:270}[t.dir],large);
 return '<span class="foyer-dust-mark" aria-hidden="true">·</span>';
}
function foyerTrailDetail(i){
 const t=foyerTrailTile(i);
 const description=p=>p.type==='cat'?'둥근 발가락 네 개와 반달처럼 패인 뒤꿈치 가장자리.':
  p.type==='dog'?'네 개의 발가락 끝에 가늘고 뾰족한 발톱 자국이 있다.':
  p.type==='boot'?'넓은 밑창과 반복되는 가로 홈이 있다.':'';
 const desc=t.type==='anchor'?'바닥 가장자리의 오래된 표식이다.':
  t.type==='mixed'?'이 타일에는 서로 다른 흔적이 겹쳐 있다. '+t.prints.map(description).join(' '):
  t.type==='dust'?'먼지가 엷게 쌓여 있지만 뚜렷한 발자국은 없다.':description(t);
 return '<div class="foyer-track-detail"><div class="foyer-track-magnify'+(t.type==='mixed'?' mixed':'')+'" aria-hidden="true">'+
  foyerTrailGraphic(t,true)+'</div><p>'+desc+'</p></div>';
}
function rug(selected=-1){
 g.flags.rug=true;clue('track');
 const tiles=Array.from({length:FOYER_GRID_SIZE*FOYER_GRID_SIZE},(_,i)=>{
  const t=foyerTrailTile(i);
  const shown=t.type==='anchor'?t.text:t.type==='cat'?'작은 동물 발자국':
   t.type==='dog'?'발톱이 보이는 동물 발자국':t.type==='boot'?'신발 자국':
   t.type==='mixed'?'서로 다른 발자국이 겹친 타일':'빈 타일';
  return '<button type="button" class="trail-cell'+(t.type==='anchor'?' trail-anchor':'')+
   (selected===i?' selected':'')+'" data-action="rug-tile-'+i+'" aria-label="'+(Math.floor(i/FOYER_GRID_SIZE)+1)+'행 '+(i%FOYER_GRID_SIZE+1)+'열, '+shown+
   '" aria-pressed="'+(selected===i)+'">'+foyerTrailGraphic(t)+'</button>';
 }).join('');
 modal('현관 홀 · 조사','들춰진 양탄자',
  '<p class="modal-description">문턱에서 종으로 향하는 서로 다른 발자국이 보인다. 일부는 같은 타일에 겹쳐 있다.</p>'+
  '<div class="foyer-board-scroll" role="region" aria-label="발자국 5행 5열 조사판"><div class="trail-grid" role="group" aria-label="다섯 행 다섯 열 타일. 누르면 자국을 확대한다">'+tiles+'</div></div>'+
  (selected>=0&&selected<FOYER_GRID_SIZE*FOYER_GRID_SIZE?foyerTrailDetail(selected):
   '<p class="foyer-track-instruction">타일을 눌러 겹친 자국을 확대해 볼 수 있다.</p>')+
  '<div class="investigation-actions"><button data-action="rug-pocket">'+(has('photo')?'살펴본 안감 다시 보기':'접힌 안감도 조사한다 · +10초')+'</button></div>'+
  '<p class="puzzle-helper">타일마다 자국의 크기와 방향이 다르다.</p>');
 save();
}
function foot(){
 g.activePuzzle='foot';
 if(!done('foot')&&g.foyerRouteVersion!==4){
  g.footInput='';g.foyerRouteVersion=4;save();
 }
 if(done('foot')){article('열린 수납장','방향 자물쇠는 이미 풀려 있다.');return;}
 modal('ROOM 01 · 퍼즐 1','지워진 발걸음',
  '<p class="modal-description">수납장 손잡이에 발바닥 모양의 낡은 문양이 남아 있다. 다섯 개의 표시등은 꺼져 있고 그 아래로 방향 버튼 네 개가 있다.</p>'+
  '<div class="direction-pad">'+[['↑','up'],['←','left'],['↓','down'],['→','right']].map(([t,v])=>'<button data-action="step-'+v+'" aria-label="'+v+'">'+t+'</button>').join('')+'</div>'+
  '<div class="foyer-foot-counter" role="status" aria-label="이동 방향 '+g.footInput.length+'/'+FOYER_FOOT_SEQUENCE.length+'개 입력">'+
    Array.from({length:FOYER_FOOT_SEQUENCE.length},(_,i)=>
      '<span class="foyer-foot-dot'+(i<g.footInput.length?' filled':'')+'" aria-hidden="true">'+
      ({U:'↑',D:'↓',L:'←',R:'→'}[g.footInput[i]]||'·')+'</span>').join('')+
    '<span class="foyer-foot-progress">'+g.footInput.length+' / '+FOYER_FOOT_SEQUENCE.length+'</span></div>'+
  '<div class="foyer-foot-actions"><button data-action="foot-back" '+(!g.footInput.length?'disabled':'')+'>한 걸음 취소</button><button data-action="foot-reset">전체 지우기</button></div>'+
  '<p class="puzzle-helper">현관에서 발견한 흔적을 다시 확인할 수 있다.</p>');
}
function step(v){
 if(done('foot'))return;
 const code={right:'R',left:'L',up:'U',down:'D'}[v];
 if(!code)return;
 g.footInput=(g.footInput||'').slice(0,FOYER_FOOT_SEQUENCE.length-1)+code;
 tone();
 if(g.footInput.length===FOYER_FOOT_SEQUENCE.length){
  if(g.footInput===FOYER_FOOT_SEQUENCE){
   g.flags.foot=true;g.activePuzzle='mirror';
   notify('수납장의 방향 자물쇠가 풀렸다!');tone('gain');render();
   modal('PUZZLE SOLVED','열리는 수납장','<div class="collect-visual">⌑</div><p class="modal-description">철컥, 수납장의 걸쇠가 풀렸다. 수납장 안을 직접 조사해 보세요.</p>');save();return;
  }
  g.footInput='';error('금속 표시등 다섯 개가 다시 꺼졌다.');
 }
 foot();save();
}

// Nine distinct mirrors: two brass bases slide horizontally on visible rails.
// No star checkpoint, no preview beam, and no hidden "inspected clue" gate.
const moonMirrors={A:[2,6],B:[1,7],C:[5,7],D:[7,5],E:[4,5],F:[4,2],G:[7,2],H:[7,1],I:[6,1]};
const moonMirrorRails={B:[1,3],D:[5,7]};
function moonMirrorPosition(id){
 const pos=moonMirrors[id];
 return [Object.hasOwn(moonMirrorRails,id)?g.mirrorRails[id]:pos[0],pos[1]];
}
const moonBooks={
 '가을':['✦','◆'],'여름':['✿','◆'],'겨울':['✿','◈'],'자정':['❖','◈'],
 '봄':['❖','☾'],'미로':['♣','◇']
};
const moonBookNames=['봄','여름','가을','겨울','자정','미로'];
function traceMoonbeam(){
 const positions=Object.fromEntries(Object.keys(moonMirrors).map(id=>[moonMirrorPosition(id).join(','),id]));
 let x=-1,y=6,dx=1,dy=0;
 const visited=new Set(),reflections=[];
 for(let n=0;n<100;n++){
  x+=dx;y+=dy;
  if(x<0||y<0||x>=9||y>=9)return {solved:x===6&&y===-1,reflections};
  const id=positions[x+','+y];
  if(id){
   reflections.push(id);
   const slash=g.mirrorTiles[id]==='/';
   [dx,dy]=slash?[-dy,-dx]:[dy,dx];
  }
  const key=x+','+y+','+dx+','+dy;
  if(visited.has(key))break;
  visited.add(key);
 }
 return {solved:false,reflections};
}
function mirror(){
 g.activePuzzle='mirror';
 if(done('mirror')){article('완성된 달','갈라진 달 문양이 다시 밝게 빛난다. 길의 인장을 떼어낸 홈만 남았다.');return;}
 if(!has('silverDisc')||!has('lamp')){
  article('깨진 달 장식','문양 아래에는 은면을 고정하는 아홉 개의 작은 받침이 있다. 한쪽에는 등불을 끼우는 홈, 다른 쪽에는 반쪽 달이 남아 있다.');return;
 }
 if(!g.discMounted){
  modal('현관 · 조사','반쪽 달 장식','<p class="modal-description">황동 장식 옆에 은빛 원판과 크기가 비슷한 빈 홈이 있다. 가장자리에는 마모된 금속 가루가 남아 있다.</p>',[['원판을 홈에 대 보기 · +5초','mirror-mount',true],['돌아가기','close']]);
  return;
 }
 const mirrors=Object.keys(moonMirrors).map(id=>{
  const pos=moonMirrorPosition(id),brass=Object.hasOwn(moonMirrorRails,id);
  return '<button type="button" class="moonbeam-mirror '+(brass?'moonbeam-mirror--brass':'')+'" data-action="mirror-turn-'+id+'" style="grid-column:'+(pos[0]+1)+';grid-row:'+(pos[1]+1)+'" title="'+id+' 은면 회전" aria-label="'+id+' 은면 회전, 현재 '+(g.mirrorTiles[id]==='/'?'오른쪽으로 기운':'왼쪽으로 기운')+' 방향"><small>'+id+'</small><b>'+(g.mirrorTiles[id]==='/'?'╱':'╲')+'</b></button>';
 }).join('');
 const rails=Object.entries(moonMirrorRails).map(([id,range])=>{
  const pos=g.mirrorRails[id];
  return '<div class="moonbeam-rail-row"><b>황동 '+id+'</b><button type="button" data-action="mirror-slide-'+id+'-left" aria-label="'+id+' 황동 은면 왼쪽으로 밀기" '+(pos===range[0]?'disabled':'')+'>←</button><span aria-live="polite">레일 '+(pos-range[0]+1)+' / 3</span><button type="button" data-action="mirror-slide-'+id+'-right" aria-label="'+id+' 황동 은면 오른쪽으로 밀기" '+(pos===range[1]?'disabled':'')+'>→</button></div>';
 }).join('');
 modal('ROOM 01 · 퍼즐 2','빛이 잊은 길',
  '<p class="moonbeam-inscription">“창을 닫은 밤에도, 이곳의 달은 늘 온전했다.”</p>'+
  '<p class="modal-description">은면 원판을 끼우자 아홉 개의 작은 반사면이 펼쳐진다. 왼쪽의 등불 받침에는 그을음이, 윗부분의 달에는 오래된 빛 자국이 있다. 은빛 받침에는 둥근 마모 자국, 황동 받침 아래에는 길게 닳은 자국이 보인다.</p>'+
  '<div class="moonbeam-board moonbeam-board--nine" role="group" aria-label="은면 아홉 개와 황동 이동 레일이 있는 빛의 장치">'+
  '<div class="moonbeam-squares">'+Array.from({length:81},()=>'<span></span>').join('')+'</div>'+
  '<div class="moonbeam-track moonbeam-track--b" aria-hidden="true"></div>'+
  '<div class="moonbeam-track moonbeam-track--d" aria-hidden="true"></div>'+
  '<div class="moonbeam-source" title="등불" aria-hidden="true">✧</div><div class="moonbeam-destination" title="반쪽 달" aria-hidden="true">☾</div>'+
  mirrors+'</div>'+
  '<div class="moonbeam-rotation-grid" role="group" aria-label="은면 회전 보조 버튼">'+Object.keys(moonMirrors).map(id=>'<button type="button" data-action="mirror-turn-'+id+'" aria-label="'+id+' 은면 회전">'+id+' '+(g.mirrorTiles[id]==='/'?'╱':'╲')+'</button>').join('')+'</div>'+
  '<div class="moonbeam-inspect-actions"><button type="button" data-action="mirror-inspect-silver">은빛 받침 살펴보기</button><button type="button" data-action="mirror-inspect-brass">황동 받침 살펴보기</button></div>'+
  '<div class="moonbeam-rail-controls" aria-label="황동 은면 위치 조정">'+rails+'</div>'+
  '<p class="puzzle-helper">은면을 눌러 회전시킬 수 있다. 나머지 움직임은 장치에 남은 흔적을 살펴보자. 실험할 때마다 빛의 길이 드러나지는 않는다.</p>',
  [['장치 작동 시험','mirror-test',true],['돌아가기','close']]
 );
}
function mirrorInspect(kind){
 if(kind==='silver')return modal('현관 · 받침 관찰','둥근 마모 자국','<div class="ambient-description">은빛 받침의 가장자리가 원형으로 닳았다. 손끝으로 살짝 건드리자 반사면이 제자리에서 돌아간다.</div>',[['장치로 돌아가기','mirror-open',true]]);
 if(kind==='brass')return modal('현관 · 받침 관찰','길게 닳은 황동','<div class="ambient-description">황동 받침 아래에는 좌우로 긁힌 두 줄의 홈이 있다. 양쪽 끝에는 먼지가 쌓였지만 홈 가운데는 유난히 매끄럽다. 손끝으로 살짝 밀면 받침이 홈을 따라 움직일 듯하다.</div>',[['장치로 돌아가기','mirror-open',true]]);
}
function mirrorTurn(id){
 if(done('mirror')||!Object.hasOwn(moonMirrors,id))return;
 g.mirrorTiles[id]=g.mirrorTiles[id]==='/'?String.fromCharCode(92):'/';
 tone('tap');save();mirror();
}
function mirrorSlide(id,direction){
 if(done('mirror')||!Object.hasOwn(moonMirrorRails,id)||!['left','right'].includes(direction))return;
 const [min,max]=moonMirrorRails[id],pos=g.mirrorRails[id],next=Math.max(min,Math.min(max,pos+(direction==='left'?-1:1)));
 if(next===pos)return;
 g.mirrorRails[id]=next;tone('tap');save();mirror();
}
function mirrorTest(){
 if(done('mirror'))return;
 if(traceMoonbeam().solved)return mirrorSolve();
 tone('bad');
 modal('현관 · 장치 시험','빛이 닿지 않았다','<p class="modal-description">등불이 잠깐 밝아지고 금속판 안에서 짧은 마찰음이 들린다. 달의 빈 곳은 그대로다.</p>',[['은면 다시 조정하기','mirror-open',true]]);
}
function mirrorSolve(){
 if(done('mirror'))return;
 g.flags.mirror=true;seal('path');
 solved('mirror','등불에서 나온 빛이 아홉 은면 사이를 꺾여 지나가자, 벽의 반쪽 달에 나머지 반쪽이 드러났습니다. 황동 벽장식 안쪽에서 길의 인장을 획득했습니다.');
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
   '<div class="rune-book-ends"><span>·</span><small>양끝의 황동 장식이 높은 곳에 있다</small><span>·</span></div>'+
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

function portrait(){clue('portrait');modal('달빛 서재 · 초상화','희미한 얼굴',`<p class="modal-description">미로와 함께 앉은 어린 소녀가 그려져 있다. 아래 이름을 새긴 명판은 그 부분만 유난히 흐리다. 금빛 액자 틈이 다른 곳보다 조금 벌어져 있다.</p>${has('film')?'<div class="letter">액자 안쪽은 비어 있다.</div>':'<div class="investigation-actions"><button data-action="portrait-back">액자 뒷면을 살핀다 · +10초</button></div>'}`)}

const rollPegs=[3,0,4,3]; // Maker: the engraved calibration notch corresponds to offset 4.
const noteFrequencies=[261.63,293.66,329.63,349.23,392,440];
function piano(){
 g.activePuzzle='piano';
 if(done('piano')){article('다시 연주하는 피아노','작은 피아노는 이제 이름 모를 자장가를 연주한다. 미로가 자리를 잡고 웅크린다.');return;}
 if(!has('roll')){article('기계식 피아노','반쯤 열린 황동 원통 장치는 비어 있다. 여섯 개의 건반 위에는 고정된 연주 손가락들이 매달려 있다.');return;}
 const offset=g.drumOffset||0;
 const dial=Array.from({length:6},(_,i)=>'<button class="roll-dial-stop '+(offset===i?'selected':'')+'" data-action="drum-'+i+'" aria-label="원통 눈금 '+(i+1)+'" title="원통 눈금 '+(i+1)+'">'+(i===4?'✦':'·')+'</button>').join('');
 const roll=rollPegs.map((pos,i)=>'<div class="roll-row">'+Array.from({length:6},(_,j)=>'<span class="'+(pos===j?'peg':'')+'">'+(pos===j?'●':'·')+'</span>').join('')+'</div>').join('');
 modal('ROOM 02 · 퍼즐 4','멈춘 자장가',
  '<p class="modal-description">나무 건반 위에는 원통을 붙잡는 황동 손가락이 달려 있다. 표면이 닳은 축에는 여섯 개의 걸림점이 있다. 원통의 작은 별과 장치 테두리의 별 모양 흠집이 눈에 띈다.</p>'+
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
   g.flags.piano=true;seal('echo');solved('piano','황동 손가락이 네 번 움직이고 피아노에서 작은 선율이 흘러나옵니다. 미로는 선율이 익숙한 듯 조용히 귀를 기울입니다. 소리의 인장을 획득했습니다.');return;
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
 if(done('film')){article('숨겨진 일기','열린 서랍 안에는 「미로에게 꼭 돌아갈게」라는 일기와 「상주 인원 0명」이라고 적힌 기록부가 함께 남아 있다.');return;}
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
  solved('film','필름의 창을 통과한 빛이 책상 아래 숨은 감광 장치를 건드립니다. 서랍이 열리고 미로를 돌보던 사람의 일기와 「상주 인원 0명」이라고 쓰인 기록부가 함께 드러났습니다.');return;
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
  '<p class="puzzle-helper">각 수조에 물때가 다른 높이로 남아 있다. 일부 배관은 먼지에 가려 수위 흔적을 바로 확인하기 어렵다.</p>',
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


function clock(){
 g.activePuzzle='clock';
 if(done('clock')){article('복원된 시각','세 인장을 통과한 동력이 돌아온다. 바늘은 마지막 기록이 남겨진 시각에 고정되어 있지만 시계추만 움직이지 않는다.');return;}
 const minuteRot=g.minute*6,hourRot=g.hour*30+g.minute*.5;
 modal('ROOM 04 · 퍼즐 9','멈춘 밤의 분침',
  '<p class="modal-description">제단 안쪽의 동력이 시침과 분침으로 연결되어 있다. 수동 손잡이에는 오래된 기름때가 남아 있다. 황동판에는 작은 화분과 닫힌 문의 그림, 반쯤 지워진 경보 기록이 함께 새겨져 있다.</p>'+
  '<div class="clock-visual"><span class="clock-numeral n12">12</span><span class="clock-numeral n3">3</span><span class="clock-numeral n6">6</span><span class="clock-numeral n9">9</span>'+
  '<div class="clock-hand hour" style="transform:rotate('+hourRot+'deg)"></div>'+
  '<div class="clock-hand minute" style="transform:rotate('+minuteRot+'deg)"></div><div class="clock-pin"></div></div>'+
  '<div class="clock-controls"><div><label>시침</label><button class="small-adjust" data-action="clock-hour-minus">−</button><strong>'+g.hour+'</strong><button class="small-adjust" data-action="clock-hour-plus">＋</button></div>'+
  '<div><label>분침</label><button class="small-adjust" data-action="clock-minute-minus">−</button><strong>'+String(g.minute).padStart(2,'0')+'</strong><button class="small-adjust" data-action="clock-minute-plus">＋</button></div></div>'+
  '<div class="night-switch"><button class="'+(g.night?'active':'')+'" data-action="clock-night">'+(g.night?'☾':'☀')+'</button></div>',
  [['시계 장치 걸어 보기','clock-check',true]]
 );
}
function clockCheck(){
 if(g.hour!==9||g.minute!==15||!g.night){error('시계의 경보 바퀴가 잠깐 흔들리고 멈춘다.');clock();return;}
 g.flags.clock=true;solved('clock','시곗바늘이 황동 기록과 같은 위치에서 멈추자 열두 개의 작은 경보등이 켜집니다. 그런데 추의 아래쪽은 여전히 무언가에 단단히 고정되어 있습니다.');
}
const pendulumSeals=[['path','❖'],['echo','♫'],['light','☼']];
function pin(){
 g.activePuzzle='pin';
 if(done('pin')){article('해제된 시계추','붉은 고정쇠가 풀렸다. 시계추는 다시 움직일 준비를 마쳤지만, 저택의 시간은 아직 선택을 기다리고 있다.');return;}
 if(!done('clock')){article('붉은 고정쇠','붉은 금속 고리가 시계추 아래를 잡고 있다. 위쪽에는 아직 멈춘 세 개의 황동 바퀴가 있다.');return;}
 if(g.seals.length<3){article('세 개의 빈 바퀴','황동 바퀴에는 작은 홈이 비어 있다.');return;}
 if(!Array.isArray(g.pinLevels)||g.pinLevels.length!==3)g.pinLevels=[0,0,0];
 const wheels=pendulumSeals.map(([id,glyph],i)=>'<div class="pin-wheel"><div class="pin-wheel-title">'+glyph+' <small>'+seals[id][1]+'</small></div>'+
  '<div class="pin-wheel-glyphs">'+Array.from({length:3},(_,k)=>'<span class="'+(k<g.pinLevels[i]?'active':'')+'">▮</span>').join('')+'</div>'+
  '<button data-action="pin-turn-'+i+'">황동 바퀴 회전 ↻</button></div>').join('');
 modal('ROOM 04 · 퍼즐 10','마지막 고정쇠',
  '<p class="modal-description">진자 아래에 안전용 붉은 고정쇠가 끼워져 있다. 그 위의 세 바퀴는 각 인장과 맞물린 상태다. 바퀴의 톱니에는 서로 다른 수의 홈이 있고, 시계추는 한쪽으로 기울어져 있다.</p>'+
  '<div class="pin-wheel-row">'+wheels+'</div>'+
  '<div class="pendulum '+(g.pinReady?'pendulum-released':'')+'"><div class="pendulum-rod"></div><div class="pendulum-weight"></div><div class="pendulum-lock">붉은 고정쇠</div></div>'+
  '<p class="puzzle-helper">'+(g.pinReady?'고정쇠를 붙잡은 금속 장력이 사라졌다.':'시계추 옆의 먼지가 아주 조금씩 떨어진다.')+'</p>',
  g.pinReady?[['붉은 고정쇠 풀어 보기','pin-pull',true]]:[['맞물림 시험','pin-check',true]]
 );
}
function pinTurn(index){
 if(done('pin')||!Number.isInteger(index)||index<0||index>2)return;
 g.pinLevels[index]=(g.pinLevels[index]+1)%4;g.pinReady=false;tone('tap');save();pin();
}
function pinCheck(){
 if(g.pinLevels.join(',')!=='2,1,3'){
  error('황동 바퀴들이 서로 밀려나고 붉은 고리가 더 단단해진다.');pin();return;
 }
 g.pinReady=true;tone('gain');notify('세 바퀴의 맞물림 소리가 고르게 바뀌었다.');save();pin();
}
function pinPull(){
 if(!g.pinReady||!done('clock')||g.seals.length<3){error('고정쇠가 아직 팽팽하게 당겨져 있다.');return;}
 g.flags.pin=true;clue('bell');tone('gain');
 solved('pin','붉은 고정쇠를 풀자 시계가 잠시 떨리다가 멎습니다. 덮개 뒤로 오래된 사고 흔적이 드러납니다. 추락한 부품 아래에는 고양이 털이, 비상 타종 레버에는 「루나」라는 이름이 남아 있습니다. 마지막 종이 울리기 직전 멈춰 선 순간—누군가 미로를 살리려 손잡이를 당겼던 흔적입니다.');
}

function finalChoices(){
 if(!done('pin'))return;
 let n=['photo','diary','collar'].filter(has).length;
 modal('THE FINAL BELL','마지막 종소리',
   '<p class="modal-description">열세 번째 종은 그날 루나가 미로를 구하기 위해 울린 비상 종이었다. 루나의 존재는 시계 속에 봉인되었고, 미로는 그녀를 잊었다. 지금 시계의 마지막 선택이 남아 있다.</p>'+
   '<p class="story-voice">미로: “그 사람이… 날 구한 거야?”</p>'+
   '<div class="ending-choices">'+
   '<button class="ending-choice" data-action="ending-normal"><div><strong>저택의 시간을 되돌린다</strong><span>시계는 움직이지만 루나의 기억은 돌아오지 않는다.</span></div>→</button>'+
   '<button class="ending-choice" data-action="ending-true" '+(n<3?'disabled':'')+'><div><strong>기억을 모아 루나의 봉인을 푼다</strong><span>'+(n===3?'사진·일기·목걸이가 서로 같은 사람을 가리킨다.':'기억의 물건 '+n+'/3 · 사진, 일기, 목걸이')+'</span></div>✦</button>'+
   '<button class="ending-choice" data-action="ending-stay"><div><strong>열세 번째 종의 봉인을 유지한다</strong><span>시간은 자정에 멈춘 채 남고, 당신은 미로와 저택에 머문다.</span></div>☾</button></div>',
   [['아직 조사하기','close']]);
}
const endings={
 normal:['다시 흐르는 시간','당신은 복구한 시계를 움직이게 합니다. 열두 번의 평범한 종이 울리고 저택의 아침이 찾아옵니다. 문은 열리지만 루나는 돌아오지 않습니다. 미로는 비어 있는 의자 곁에 앉아 누군가를 기다립니다.'],
 true:['잊히지 않은 이름','당신은 사진과 일기, 은빛 목걸이를 시계의 기억 장치에 함께 놓습니다. 서로 다른 세 흔적이 같은 이름, 루나를 가리킵니다. 열세 번째 종의 봉인이 풀리고 멈춘 시간이 흐르기 시작합니다. 미로는 루나를 기억해 냅니다. 종 아래에서 돌아온 루나가 미로를 안아 줍니다.'],
 stay:['멈춰 있는 약속','당신은 봉인을 해제하지 않기로 선택합니다. 거대한 시계는 다시 멈추고 저택은 자정에 머뭅니다. 루나의 마지막 흔적도 사라지지 않습니다. 당신은 미로 곁에 남아, 아직 끝나지 않은 약속을 지키기로 합니다.']
};
function finish(id){if(id==='true'&&!['photo','diary','collar'].every(has)){error('기억의 물건이 부족합니다.');return}g.ending=id;try{let o=JSON.parse(store.getItem(HISTORY)||'[]');if(!o.includes(id))o.push(id);store.setItem(HISTORY,JSON.stringify(o))}catch(e){}tone(id==='stay'?'tap':'bell');save();ending(id,true)}
function ending(id,withCinematic=false){
 const [title,copy]=endings[id];
 const showSummary=()=>modal('EPISODE 01 · COMPLETE',title,
  '<div class="ending-crown">'+(id==='normal'?'☀':id==='true'?'✦':'☾')+'</div>'+
  '<p class="ending-copy">'+copy+'</p>'+
  '<div class="result-stats"><div><small>탐험 시간</small><b>'+pretty(elapsed())+'</b></div>'+
  '<div><small>힌트</small><b>'+g.hintsUsed+'회</b></div>'+
  '<div><small>기억의 물건</small><b>'+['photo','diary','collar'].filter(has).length+'/3</b></div></div>',
  [['시작 화면','home'],['새로 시작','really-new',true]]);
 // Reloading an already completed save shows the result immediately, not a repeated film.
 if(withCinematic&&window.MoyeoEscapeCutscenes?.playEnding?.({id,onFinish:showSummary}))return;
 showSummary();
}

const scrapbookIcons={bell:'◷',invitation:'✉',lock9:'◷',track:'♣',portrait:'▧',dust:'▤',shelfEnds:'✦',roll:'♫',water:'♧',watering:'◷',waterSketch:'▤',cloudOutlet:'♧',powder:'✿',clock:'◷',pin:'❖',story:'☾'};
function journal(tab='clues',page=0){
 if(!g)return;
 const supported=['clues','items','moments','progress','rooms'];
 if(!supported.includes(tab))tab='clues';
 let records=[];
 if(tab==='clues')records=g.clues.map((id,i)=>({icon:scrapbookIcons[id]||'✦',title:clueText[id]?.[0]||'기록',text:clueText[id]?.[1]||'',stamp:'단서 '+String(i+1).padStart(2,'0')}));
 if(tab==='items')records=g.inventory.map((id,i)=>({icon:items[id]?.[0]||'◇',title:items[id]?.[1]||'아이템',text:items[id]?.[2]||'',stamp:'소지품 '+String(i+1).padStart(2,'0')}));
 if(tab==='moments'){
  const names={...combinationNotes};
  records=(g.combinedFindings||[]).filter(id=>names[id]).map((id,i)=>({icon:'✧',title:names[id][0],text:names[id][1],stamp:'관찰 '+String(i+1).padStart(2,'0')}));
  if(g.sideGames?.bell)records.unshift({icon:'♫',title:'현관의 작은 음악회',text:'종 네 개의 짧은 연주를 마쳤다. 미로는 한참 동안 귀를 쫑긋 세웠다.',stamp:'작은 발견'});
  if(g.sideGames?.wallLights)records.unshift({icon:'◉',title:'네 빛의 실없는 장난',text:'색유리 네 개를 모두 켰지만 문은 그대로였다. 미로가 대신 앞발로 작은 박수를 쳤다.',stamp:'선택형 낚시'});
 }
 if(tab==='rooms')records=rooms.filter(id=>g.visited.includes(id)).map((id,i)=>({icon:'◷',title:meta[id][0]+' · '+roomStories[id].title,text:roomStories[id].intro+'\n\n목표: '+roomStories[id].goal,stamp:'방 이야기 '+String(i+1).padStart(2,'0')}));
  if(tab==='progress'){
  const entries=[['foot','현관'],['mirror','달'],['books','서재'],['piano','소리'],['film','일기'],['water','온실'],['light','꽃'],['blackout','흔적'],['clock','시간'],['pin','종']];
  records=entries.filter(([id])=>done(id)).map(([id,title],i)=>({icon:'❖',title:title+'의 기록',text:'저택의 장치가 반응하고 주변 풍경이 조금 달라졌다.',stamp:'진행 '+String(i+1).padStart(2,'0')}));
 }
 const size=2,totalPages=Math.max(1,Math.ceil(records.length/size)),current=Math.max(0,Math.min(totalPages-1,Number(page)||0));
 const title={clues:'발견한 단서',items:'모아 둔 소지품',moments:'작은 발견',progress:'저택의 변화',rooms:'방 이야기'}[tab];
 const articles=records.slice(current*size,(current+1)*size).map((entry,i)=>
  '<article class="scrapbook-paper" style="--page-index:'+i+'"><div class="scrapbook-paper-icon" aria-hidden="true">'+entry.icon+'</div>'+
  '<small>'+entry.stamp+'</small><h3>'+entry.title+'</h3><p>'+entry.text+'</p></article>'
 ).join('');
 modal('EXPLORER’S SCRAPBOOK','달빛 저택 탐험 수첩',
  '<p class="scrapbook-intro">직접 발견한 흔적을 모아 놓았다. 필요한 기록은 언제든 다시 읽을 수 있다.</p>'+
  '<div class="journal-tabs">'+[['clues','단서'],['items','소지품'],['moments','작은 발견'],['progress','여정'],['rooms','방 이야기']].map(([id,n])=>
  '<button class="journal-tab '+(id===tab?'selected':'')+'" data-action="journal-'+id+'" aria-pressed="'+(id===tab)+'">'+n+'</button>').join('')+'</div>'+
  '<div class="scrapbook-folio"><div class="scrapbook-folio-header"><span>MOYEO · '+title+'</span><span>PAGE '+(current+1)+' / '+totalPages+'</span></div>'+
  (articles||'<div class="scrapbook-blank"><span aria-hidden="true">✦</span><p>아직 이 페이지에 적을 기록이 없다.</p></div>')+
  '</div>'+
  '<nav class="scrapbook-pagination" aria-label="수첩 페이지 넘기기">'+
  '<button data-action="journal-page-'+tab+'-'+(current-1)+'" '+(current===0?'disabled':'')+'>← 이전 페이지</button>'+
  '<span>'+(current+1)+' / '+totalPages+'</span>'+
  '<button data-action="journal-page-'+tab+'-'+(current+1)+'" '+(current>=totalPages-1?'disabled':'')+'>다음 페이지 →</button>'+
  '</nav>',
  [['저택으로 돌아가기','close',true]]);
}

const hintNames={foot:'네 번의 걸음',mirror:'빛이 잊은 길',books:'서가에 남은 문장',piano:'멈춘 자장가',film:'서랍 위의 낡은 판',water:'녹슨 수문',light:'꽃에 내려앉은 그림자',blackout:'흔적을 남기는 꽃가루',clock:'멈춘 밤의 분침',pin:'마지막 고정쇠'};
function currentHintId(){
 let id=g.activePuzzle||'foot';
 if(done(id))id=({
  foyer:!done('foot')?'foot':'mirror',
  study:!done('books')?'books':!done('piano')?'piano':'film',
  greenhouse:!done('water')?'water':!done('light')?'light':'blackout',
  tower:!done('clock')?'clock':'pin'
 })[g.room]||'foot';
 return id;
}
function hint(){
 const id=currentHintId(),used=Math.min(4,g.hintLevels[id]||0);
 modal('MIRO’S HELP','미로의 힌트',
  '<p class="modal-description">'+hintNames[id]+' · '+used+'/4단계 열람</p>'+
  (used?'<div class="hint-card">'+hints[id][used-1]+'</div>':'<p class="modal-description">찾아보지 못한 것이 있나요? 원할 때만 단서를 조금씩 알려드립니다.</p>'),
  used>=4?[['돌아가기','close',true]]:
  [['돌아가기','close'],[used===3?'정답과 해설 보기':used===0?'관찰 힌트 보기':'다음 힌트 보기','hint-'+id,true]]
 );
}
function hintMore(id){
 if(!Object.hasOwn(hints,id))return;
 const level=Math.min(4,(g.hintLevels[id]||0)+1);
 if(level>(g.hintLevels[id]||0)){g.hintLevels[id]=level;g.hintsUsed++;save();}
 modal('HINT '+level+'/4',level===4?'정답과 해설':'미로의 조언',
  '<div class="hint-card">'+hints[id][level-1]+'</div>',
  level===4?[['닫기','close',true]]:[['닫기','close'],[level===3?'정답과 해설 보기':'다음 단계','hint-'+id,true]]
 );
}
function talk(){
 const lines={
  foyer:['이 집은 처음 보는 것 같다가도 익숙해.','여기 발자국은 언제 생겼을까?'],
  study:['여기서 누가 책을 읽어 줬던 것 같아.','저 책을 내가 혼자 꽂아 둔 적이 있었나?'],
  greenhouse:['꽃향기가 옛날이랑 똑같아.','누군가 늘 내 털을 말려 줬는데… 얼굴이 떠오르지 않아.'],
  tower:['정오가 아닌데 왜 시계가 잠들었을까?','열두 번 다음에 들었던 소리는 뭐였지?']
 };
 const a=lines[g.room];$('catDialog').textContent=a[(catTurns++)%a.length];g.catMood='curious';tone();render();
}
function menu(){modal('PAUSE','탐험 메뉴',`<p class="modal-description">진행 내용은 자동 저장됩니다. 탐험 시간(추가 조사 시간 포함): ${pretty(elapsed())}</p>`,[['계속 탐험','close',true],['시작 화면','home']])}
function handle(action){if(action==='flower-pattern')return flowerPattern();if(action==='cabinet-search'){if(!done('foot')||has('silverDisc'))return;coreOneOff('cabinet-search',10);item('silverDisc');item('lamp');item('brassKey');clue('lock9');return modal('OPEN','열린 황동 수납장',`<div class="collect-visual">◐</div><div class="letter">은면 원판, 작은 등불, 황동 열쇠를 꺼냈다.\n안쪽 접힌 기록에 「현관문 자동 잠금 · 매일 밤 9:00」가 적혀 있다.</div>`);}if(action.startsWith('core-deep-'))return coreDeep(action.slice(10));if(action==='wall-reset')return wallLightReset();if(action.startsWith('wall-light-'))return wallLightPress(Number(action.slice(11)));if(action==='invitation')return invitation();if(action==='invitation-flip')return invitationFlip();if(action.startsWith('item-flip-'))return itemFlip(action.slice(10));if(action==='mirror-mount'){if(has('silverDisc')&&has('lamp')){if(!g.discMounted)coreOneOff('mirror-mount',5);g.discMounted=true;save();return mirror()}return;}if(action==='sconce-touch')return sconceTouch();if(action.startsWith('ambient-open-'))return ambientInspect(action.slice(13));if(action==='bell-reset')return bellReset();if(action.startsWith('bell-note-'))return bellNote(Number(action.slice(10)));if(action.startsWith('ambient-next-'))return ambientNext(action.slice(13));if(action==='close')return hide();if(action.startsWith('room-intro-'))return showRoomIntro(action.slice(11));if(action==='home')return home();if(action==='really-new')return begin();if(action==='new-confirm')return modal('NEW GAME','처음부터 시작할까요?',`<p class="modal-description">이번 버전의 진행 데이터가 초기화됩니다.</p>`,[['취소','close'],['새로 시작','really-new',true]]);
if(action==='pollen-rub'){if(done('light')&&g.flags.curtain){coreOneOff('pollen-rub',10);g.flags.blackout=true;clue('powder');save();return modal('GREENHOUSE · 관찰','희미한 발자국',`<p class="modal-description">은빛 가루를 쓸어내자 작고 둥근 발자국들이 선명해진다. 발자국은 꽃줄기 뒤편의 오래된 유리 용기 부근에서 끊겨 있다.</p>`,[['돌아가기','close',true]])}return}if(action.startsWith('rug-tile-')){const i=Number(action.slice(9));if(Number.isInteger(i)&&i>=0&&i<FOYER_GRID_SIZE*FOYER_GRID_SIZE)return rug(i);return;}if(action==='foot-back'){g.footInput=(g.footInput||'').slice(0,-1);save();return foot();}if(action==='foot-reset'){g.footInput='';save();return foot();}if(action.startsWith('step-'))return step(action.slice(5));if(action==='rug-pocket'){if(!g.flags.rug)return;if(!has('photo'))coreOneOff('rug-pocket',10);if(!has('photo'))item('photo');return modal('FOUND','오래된 사진',`<div class="collect-visual">▧</div><div class="letter">어린 미로 곁에 얼굴이 희미한 사람이 서 있다.\n\n「우린 언제나 함께야」</div>`)}
if(action==='mirror-open')return mirror();if(action==='mirror-test')return mirrorTest();if(action.startsWith('mirror-inspect-'))return mirrorInspect(action.slice(15));if(action.startsWith('mirror-slide-')){const parts=action.split('-');return mirrorSlide(parts[2],parts[3]);}if(action.startsWith('mirror-turn-'))return mirrorTurn(action.slice(12));if(action==='mirror-switch')return; // Ignore stale buttons from earlier cached puzzle versions.
if(action.startsWith('flip-')){let name=action.slice(5);if(Object.hasOwn(moonBooks,name)){g.booksFlipped??={};g.booksFlipped[name]=!g.booksFlipped[name];save();return books()}}
if(action.startsWith('book-')){let name=action.slice(5);if(name==='reset'){g.booksPlaced=[null,null,null,null,null];save();return books()}if(name==='check')return bookCheck();if(Object.hasOwn(moonBooks,name)&&!g.booksPlaced.includes(name)){let slot=g.booksPlaced.indexOf(null);if(slot>=0){g.booksPlaced[slot]=name;save();}}return books()}
if(action.startsWith('unbook-')){let slot=Number(action.slice(7));if(Number.isInteger(slot)&&slot>=0&&slot<5){g.booksPlaced[slot]=null;save()}return books()}
if(action==='portrait-back'){if(!has('film'))coreOneOff('portrait-back',10);item('film');return modal('FOUND','별 구멍이 난 투명 필름',`<div class="collect-visual">▧</div><p class="modal-description">액자 뒷면에서 투명한 얇은 판이 나옵니다. 네 곳에 작은 구멍이 뚫려 있고 한쪽 모서리에 별이 있습니다.</p>`)}
if(action.startsWith('drum-')&&action!=='drum-play')return drumSet(Number(action.slice(5)));if(action==='drum-play')return drumPlay();if(action.startsWith('key-'))return keyPress(Number(action.slice(4)));if(action==='piano-reset'){g.pianoInput=[];save();return piano()}
if(action==='film-turn'){g.filmRotate=(g.filmRotate+1)%4;save();return desk()}if(action==='film-slide'){g.filmShift=g.filmShift===-1?0:g.filmShift===0?1:-1;save();return desk()}if(action==='film-check')return filmCheck();
if(action==='water-check')return waterCheck();if(action.startsWith('sluice-')){const p=action.split('-');return sluiceMove(Number(p[1]),p[2])}
if(action.startsWith('glass-')){const p=action.split('-');return glassMove(p[1],p[2])}if(action==='beam-check')return beamCheck();
if(action.startsWith('clock-')){let p=action.split('-');if(p[1]==='night')g.night=!g.night;else if(p[1]==='hour')g.hour=((g.hour-1+(p[2]==='plus'?1:11))%12)+1;else if(p[1]==='minute')g.minute=(g.minute+(p[2]==='plus'?5:55))%60;else if(p[1]==='check')return clockCheck();return clock()}
if(action.startsWith('pin-turn-'))return pinTurn(Number(action.slice(9)));if(action==='pin-check')return pinCheck();if(action==='pin-pull')return pinPull();if(action.startsWith('ending-'))return finish(action.slice(7));if(action.startsWith('journal-page-')){const parts=action.slice(13).split('-');return journal(parts[0],Number(parts[1]));}if(action.startsWith('journal-'))return journal(action.slice(8));if(action.startsWith('hint-'))return hintMore(action.slice(5));}
function catSvg(){return '<img class="miro-portrait" src="miro-avatar.webp?v=20261122" alt="미로" loading="eager" decoding="async" draggable="false">';}

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
 // A discovery pulse must not prioritize unsolved puzzle pieces over ordinary props.
 const list=hotspots[g.room];
 if(!list.length)return;
 const pick=list[explorationIndex++%list.length];
 const el=[...$('hotspots').querySelectorAll('.hotspot')].find(x=>x.dataset.object===pick.id);
 if(!el)return;
 el.classList.remove('revealed');void el.offsetWidth;el.classList.add('revealed');
 setTimeout(()=>{if(el.isConnected)el.classList.remove('revealed')},1600);
}
const scene=$('sceneCanvas');
// Batch continuous pointer movement into at most one visual update per animation frame.
// No hover hitbox lookup or hidden-clue highlighting occurs.
let ambientMoveFrame=0,ambientPointer=null;
scene.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'||!g||modalOpen)return;
 ambientPointer={x:e.clientX,y:e.clientY};
 if(ambientMoveFrame)return;
 ambientMoveFrame=requestAnimationFrame(()=>{
  ambientMoveFrame=0;
  const pointer=ambientPointer;if(!pointer)return;
  const area=scene.getBoundingClientRect();
  if(!area.width||!area.height)return;
  scene.style.setProperty('--ambient-x',((pointer.x-area.left)/area.width-.5)*9+'px');
  scene.style.setProperty('--ambient-y',((pointer.y-area.top)/area.height-.5)*6+'px');
 });
});
scene.addEventListener('pointerleave',()=>{
 ambientPointer=null;
 if(ambientMoveFrame){cancelAnimationFrame(ambientMoveFrame);ambientMoveFrame=0;}
 scene.style.setProperty('--ambient-x','0px');
 scene.style.setProperty('--ambient-y','0px');
});
document.querySelector('[data-camera="discover"]')?.addEventListener('click',exploreSuggestion);

// Dynamic UI events, touch and mouse support.
// In small illustrated rooms two 48px hitboxes may touch at their edges.
// Resolve the tap to the object whose visible-location center is closest.
$('hotspots').addEventListener('click',e=>{
 const tapped=e.target.closest('[data-object]');
 if(!tapped)return;
 if(e.detail===0||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY)){
  inspect(tapped.dataset.object);return; // keyboard/screen reader clicks
 }
 // Use the browser's hit-test stack instead of measuring every room object.
 // Most clicks need no geometry reads; only genuinely overlapping hitboxes do.
 const candidates=typeof document.elementsFromPoint==='function'
  ?document.elementsFromPoint(e.clientX,e.clientY).filter(el=>el.classList?.contains('hotspot'))
  :[tapped];
 if(candidates.length<2){inspect(tapped.dataset.object);return;}
 let choice=tapped,shortest=Infinity;
 for(const candidate of candidates){
  const rect=candidate.getBoundingClientRect();
  if(!rect.width||!rect.height)continue;
  const dist=(e.clientX-(rect.left+rect.right)/2)**2+(e.clientY-(rect.top+rect.bottom)/2)**2;
  if(dist<shortest){shortest=dist;choice=candidate;}
 }
 inspect(choice.dataset.object);
});
$('sceneNav').addEventListener('click',e=>{let b=e.target.closest('[data-room]');if(b)move(b.dataset.room)});
$('inventory').addEventListener('click',e=>{const detail=e.target.closest('[data-item-view]');if(detail)return itemDetail(detail.dataset.itemView);let b=e.target.closest('[data-item]');if(!b)return;const id=b.dataset.item;if(g.selected&&g.selected!==id)return combineItems(g.selected,id);g.selected=g.selected===id?null:id;$('catDialog').textContent=g.selected?items[g.selected][2]:'아이템 선택이 해제되었어.';render()});
$('modalContent').addEventListener('click',e=>{let b=e.target.closest('[data-action]');if(b)handle(b.dataset.action)});
let dragged=null;
$('modalContent').addEventListener('dragstart',e=>{const b=e.target.closest('[data-book]');if(b){dragged=b.dataset.book;e.dataTransfer?.setData('text/plain',dragged)}});
$('modalContent').addEventListener('dragover',e=>{if(e.target.closest('[data-slot]'))e.preventDefault()});
$('modalContent').addEventListener('drop',e=>{let b=e.target.closest('[data-slot]');if(!b)return;e.preventDefault();let name=e.dataTransfer?.getData('text/plain')||dragged;if(!name||!Object.hasOwn(moonBooks,name)||g.booksPlaced.includes(name))return;let index=Number(b.dataset.slot);if(g.booksPlaced[index])return;g.booksPlaced[index]=name;save();books()});
$('startBtn').addEventListener('click',()=>store.getItem(SAVE)?handle('new-confirm'):begin());
$('continueBtn').addEventListener('click',resume);
$('homeBtn').addEventListener('click',home);
$('markerToggleBtn')?.addEventListener('click',()=>{if(!g)return;g.showMarkers=!g.showMarkers;syncMarkerDisplay();save();});
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