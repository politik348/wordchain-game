/** 모여마블 v4: original 24-tile, short-form property board game.
 * Rules inspired by the publicly documented classic Modoo Marble features.
 * No copyrighted art, names, card text or code from the commercial game.
 * Pure deterministic engine: same actions run locally or on the multiplayer server.
 */
export const GROUPS=[
 {name:'벚꽃',color:'#f694a8'},{name:'햇살',color:'#f4b868'},
 {name:'숲길',color:'#79cda5'},{name:'바다',color:'#5cb9d0'},
 {name:'라벤더',color:'#a99be2'},{name:'별빛',color:'#8299e1'},
 {name:'노을',color:'#e69c78'},{name:'보석',color:'#c58dca'}
];
const city=(name,price,group,emoji)=>({kind:'city',name,price,group,emoji});
const special=(kind,name,emoji,price)=>({kind,name,emoji,...(price?{price}:{})});
export const TILES=[
 special('start','출발','🚩'),
 city('서울',110,0,'🌸'),city('부산',125,0,'🌊'),special('chance','행운 편지','💌'),
 city('인천',135,1,'✈️'),city('대전',145,1,'🌳'),special('island','무인도','🏝️'),
 city('광주',150,2,'🍃'),city('대구',160,2,'🎡'),special('tax','국세청','🧾'),
 city('울산',165,3,'🐳'),city('제주',185,3,'🍊'),special('olympic','올림픽','🏅'),
 city('도쿄',185,4,'🗼'),city('오사카',200,4,'🏯'),special('tourist','산호 해변','🏖️',220),
 city('타이베이',205,5,'🧋'),city('홍콩',220,5,'🌃'),special('travel','세계여행','🌍'),
 city('파리',225,6,'🥐'),city('런던',240,6,'🎡'),special('tourist','별빛 섬','🏝️',265),
 city('로마',250,7,'🏛️'),city('뉴욕',270,7,'🗽')
];
export const MAX_PLAYERS=4, START_CASH=1900, PASS_BONUS=220;
export const ALLOWED_ROUNDS=[8,12,16,20], DEFAULT_ROUNDS=12;
export const ENDLESS_ROUNDS=0, BANK_LOAN=450, BANK_REPAY=540;
export const FORTUNE_CARDS=[
 {title:'대박 굿즈 출시!',effect:'cash',amount:240,emoji:'🎁'},
 {title:'세계 축제 흥행!',effect:'cash',amount:170,emoji:'🎉'},
 {title:'깜짝 세금 환급!',effect:'cash',amount:115,emoji:'💰'},
 {title:'고양이 복권 당첨!',effect:'cash',amount:300,emoji:'🐱'},
 {title:'특별 수리 비용!',effect:'cash',amount:-135,emoji:'🧰'},
 {title:'비행기 연착료!',effect:'cash',amount:-95,emoji:'✈️'},
 {title:'지역 바자회 후원!',effect:'cash',amount:-80,emoji:'🤝'},
 {title:'통행료 면제 천사카드!',effect:'angel',emoji:'🪽'},
 {title:'통행료 50% 할인권!',effect:'discount',emoji:'🎟️'},
 {title:'무료 세계여행!',effect:'travel',emoji:'🌎'},
 {title:'출발지로 순간 이동!',effect:'start',emoji:'🚩'},
 {title:'한 건물 무료 업그레이드!',effect:'freeBuild',emoji:'🏗️'},
 {title:'고양이의 특별 선물!',effect:'cash',amount:200,emoji:'🎀'},
 {title:'긴급 보수비!',effect:'cash',amount:-180,emoji:'🧾'},
 {title:'통행료 면제 천사카드!',effect:'angel',emoji:'🪽'}
];
export const TOLL_MULTIPLIERS=[.25,1,2.5,5,9];
export const LEVEL_NAMES=['토지','별장','빌딩','호텔','랜드마크'];
export const ISLAND_TURNS=3, BAIL_COST=110, PARITY_USES=3;
const isProperty=i=>TILES[i]?.kind==='city'||TILES[i]?.kind==='tourist';
const roundMoney=n=>Math.max(0,Math.round(n/5)*5);
const property=(s,i)=>s.properties[i]||null;
const active=s=>s.players.filter(p=>!p.bankrupt);
const current=s=>s.players[s.turnIndex];
const ownTiles=(s,id)=>Object.keys(s.properties).map(Number).filter(i=>s.properties[i].owner===id);
const ownCities=(s,id)=>ownTiles(s,id).filter(i=>TILES[i].kind==='city');
const validIndex=i=>Number.isInteger(i)&&i>=0&&i<TILES.length;
export function buildingCost(i,level){
 if(!validIndex(i)||TILES[i].kind!=='city'||!Number.isInteger(level)||level<0||level>3)throw Error('건설할 수 없는 단계입니다.');
 return roundMoney(TILES[i].price*(0.45+level*.17));
}
export function upgradeCost(i,from,to){
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>4||to<=from)throw Error('올바른 건설 단계를 선택하세요.');
 let value=0;for(let n=from;n<to;n++)value+=buildingCost(i,n);return value;
}
export function propertyValue(i,level){
 if(!isProperty(i))return 0;
 let value=TILES[i].price;
 if(TILES[i].kind==='city')for(let n=0;n<Math.min(4,level||0);n++)value+=buildingCost(i,n);
 return value;
}
export function maxBuildLevel(s,id,index){
 const p=s.players.find(p=>p.id===id);if(!p||TILES[index]?.kind!=='city')return 0;
 const existing=property(s,index)?.level||0;
 return existing>=3?4:Math.min(3,1+p.laps);
}
export const colorComplete=(s,id,group)=>TILES.every((t,i)=>t.kind!=='city'||t.group!==group||property(s,i)?.owner===id);
export const countMonopolies=(s,id)=>GROUPS.filter((_,g)=>colorComplete(s,id,g)).length;
export const tourismComplete=(s,id)=>TILES.every((t,i)=>t.kind!=='tourist'||property(s,i)?.owner===id);
export function toll(s,i){
 if(!isProperty(i))return 0;
 const t=TILES[i],v=property(s,i);if(!v)return 0;
 let n=t.kind==='tourist'?roundMoney(t.price*.44):roundMoney(t.price*.26*TOLL_MULTIPLIERS[v.level]);
 if(t.kind==='city'&&colorComplete(s,v.owner,t.group))n*=2;
 if(t.kind==='tourist'&&tourismComplete(s,v.owner))n*=2;
 if(s.olympics?.[i])n*=s.olympics[i];
 if(s.festival?.index===i&&s.turnCount<s.festival.expires)n*=2;
 if(s.maxRounds===ENDLESS_ROUNDS){
  // A gradual late-game multiplier keeps bankruptcy-only games from stagnating.
  if(s.round>8)n*=Math.min(4.5,1+Math.floor((s.round-8)/3)*.12);
 }else if(s.round>s.maxRounds/2)n*=1+0.12*(s.round-Math.floor(s.maxRounds/2));
 return roundMoney(n);
}
export function netWorth(s,id){const p=s.players.find(p=>p.id===id);if(!p||p.bankrupt)return 0;return p.cash+ownTiles(s,id).reduce((sum,i)=>sum+propertyValue(i,property(s,i).level),0)-(p.bankDebt||0);}
const log=(s,message)=>{s.log=[{at:s.turnCount,text:String(message)},...(s.log||[])].slice(0,40);};
const randomIndex=(rng,n)=>Math.min(n-1,Math.max(0,Math.floor(rng()*n)));
const nextAliveIndex=(s,i)=>{for(let d=1;d<=s.players.length;d++){const next=(i+d)%s.players.length;if(!s.players[next].bankrupt)return next;}return i;};
const name=s=>current(s).name;
function checkVictory(s){
 const survivors=active(s);
 if(survivors.length===1){s.winner=survivors[0].id;s.reason='파산 승리';s.phase='finished';return true;}
 if(s.maxRounds===ENDLESS_ROUNDS)return false;
 for(const p of survivors){
  if(countMonopolies(s,p.id)>=3){s.winner=p.id;s.reason='트리플 컬러 독점';s.phase='finished';return true;}
  const edges=[[1,2,4,5],[7,8,10,11],[13,14,16,17],[19,20,22,23]];
  if(edges.some(edge=>edge.every(i=>property(s,i)?.owner===p.id))){s.winner=p.id;s.reason='라인 독점';s.phase='finished';return true;}
  if(tourismComplete(s,p.id)){s.winner=p.id;s.reason='관광지 독점';s.phase='finished';return true;}
 }
 return false;
}
function limitVictory(s){
 const ranking=active(s).slice().sort((a,b)=>netWorth(s,b.id)-netWorth(s,a.id));
 s.winner=ranking[0]?.id||null;s.reason='라운드 종료 · 총자산 승리';s.phase='finished';
 log(s,`${ranking[0]?.name||'플레이어'}님이 총자산 1위로 승리했어요!`);
}
function nextTurn(s){
 s.pending=null;s.lastRoll=null;
 if(checkVictory(s))return;
 if(current(s).bankrupt)s.extraRoll=false;
 if(s.extraRoll){s.extraRoll=false;s.phase='roll';log(s,`${name(s)}님, 더블 보너스로 주사위 한 번 더!`);return;}
 s.doubles=0;s.turnCount++;
 if(s.maxRounds!==ENDLESS_ROUNDS&&s.turnCount>=s.maxRounds*s.players.length){limitVictory(s);return;}
 s.turnIndex=nextAliveIndex(s,s.turnIndex);
 s.round=Math.floor(s.turnCount/s.players.length)+1;
 const p=current(s);
 if(p.travelTicket){s.phase='travel';s.pending={kind:'travel'};log(s,`${p.name}님이 세계여행 티켓으로 원하는 목적지를 선택해요.`);}
 else if(p.stuck>0){s.phase='island';s.pending={kind:'island'};log(s,`${p.name}님은 무인도에 있어요. 더블 탈출 또는 보석금을 선택하세요.`);}
 else{s.phase='roll';}
}
function sellToCover(s,p,amount){
 const assets=ownTiles(s,p.id).sort((a,b)=>propertyValue(a,property(s,a).level)-propertyValue(b,property(s,b).level));
 for(const i of assets){if(p.cash>=amount)break;const proceeds=roundMoney(propertyValue(i,property(s,i).level)*.7);
  p.cash+=proceeds;delete s.properties[i];delete s.olympics[i];log(s,`${p.name}님이 ${TILES[i].name} 매각 · +${proceeds}M`);}
}
function spend(s,p,amount,receiver){
 if(!Number.isFinite(amount)||amount<0)throw Error('잘못된 결제 금액입니다.');
 sellToCover(s,p,amount);const paid=Math.min(p.cash,amount);p.cash-=paid;
 if(receiver)receiver.cash+=paid;
 if(paid<amount){p.cash=0;p.bankrupt=true;for(const i of ownTiles(s,p.id)){delete s.properties[i];delete s.olympics[i];}
  p.travelTicket=false;p.stuck=0;log(s,`${p.name}님이 자금 부족으로 파산했어요.`);}
 return paid;
}
function credit(s,p,amount,source){
 let net=amount;
 if((p.bankDebt||0)>0&&source.includes('출발지')){const repay=Math.min(p.bankDebt,net);p.bankDebt-=repay;net-=repay;log(s,`${p.name}님 ${source}에서 은행 대출 ${repay}M 상환 · 잔액 ${p.bankDebt}M`);}
 p.cash+=net;log(s,`${p.name}님 ${source} +${net}M`);
}
function drawFortune(s,p,choiceIndex,rng){
 const card=FORTUNE_CARDS[(randomIndex(rng,FORTUNE_CARDS.length)+choiceIndex*4)%FORTUNE_CARDS.length];
 s.lastCard=card.title;s.cardReveal={...card,owner:p.id};
 log(s,`행운 편지 ${choiceIndex+1}번 공개: ${card.title}`);
 switch(card.effect){
  case 'cash':if(card.amount>=0)credit(s,p,card.amount,'행운 편지');else log(s,`${p.name}님 행운 편지 비용 ${spend(s,p,-card.amount)}M`);break;
  case 'angel':p.angel++;log(s,`${p.name}님이 천사카드 1장을 받았어요!`);break;
  case 'discount':p.discountCards++;log(s,`${p.name}님이 통행료 50% 할인권을 받았어요!`);break;
  case 'travel':p.travelTicket=true;log(s,`${p.name}님이 다음 차례 세계여행권을 받았어요!`);break;
  case 'start':p.position=0;p.laps++;credit(s,p,PASS_BONUS,'출발지 순간이동 보너스');break;
  case 'freeBuild':{
   const owned=ownCities(s,p.id).filter(i=>property(s,i).level<maxBuildLevel(s,p.id,i));
   owned.sort((a,b)=>toll(s,b)-toll(s,a));
   if(owned.length){const i=owned[0];property(s,i).level++;log(s,`${p.name}님의 ${TILES[i].name}을 무료로 ${LEVEL_NAMES[property(s,i).level]}까지 건설!`);}
   else credit(s,p,140,'건설할 곳이 없어 현금 보너스');break;
  }
 }
}
function arrive(s,index,rng){
 const p=current(s),tile=TILES[index],held=property(s,index);
 if(isProperty(index)){
  if(!held){if(p.cash>=tile.price){s.phase='choice';s.pending={kind:'purchase',index};log(s,`${p.name}님이 ${tile.name}에 도착! 구매할까요?`);}
   else{log(s,`${p.name}님은 ${tile.name} 구매 자금이 부족해요.`);nextTurn(s);}return;}
  if(held.owner===p.id){
   if(tile.kind==='city'&&held.level<4&&maxBuildLevel(s,p.id,index)>held.level&&p.cash>=buildingCost(index,held.level)){
    s.phase='choice';s.pending={kind:'upgrade',index};log(s,`${p.name}님이 자신의 ${tile.name}에서 건설할 수 있어요.`);
   }else{log(s,`${p.name}님의 안전한 ${tile.name}!`);nextTurn(s);}return;
  }
  const owner=s.players.find(x=>x.id===held.owner),charge=toll(s,index);
  let paid=0,defense='';
  if(p.angel>0){p.angel--;defense='천사카드 면제';}
  else if(p.discountCards>0){p.discountCards--;paid=spend(s,p,roundMoney(charge*.5),owner);defense='50% 할인권';}
  else paid=spend(s,p,charge,owner);
  log(s,defense==='천사카드 면제'?`${p.name}님이 천사카드로 ${tile.name} 통행료 ${charge}M 면제!`:`${p.name}님이 ${owner?.name||'상대'}님에게 ${tile.name} 통행료 ${paid}M 지불${defense?' · '+defense:''}!`);
  if(checkVictory(s))return;
  if(tile.kind==='city'&&held.level<4&&p.cash>=propertyValue(index,held.level)*2){
   s.pending={kind:'takeover',index};s.phase='choice';log(s,`${p.name}님은 ${tile.name}을(를) 인수할 수 있어요.`);
  }else nextTurn(s);
  return;
 }
 switch(tile.kind){
  case 'start':{
   const available=ownCities(s,p.id).filter(i=>property(s,i).level<maxBuildLevel(s,p.id,i)&&p.cash>=buildingCost(i,property(s,i).level));
   if(available.length){s.phase='choice';s.pending={kind:'startBuild'};log(s,`${p.name}님이 출발지에 정확히 도착! 내 도시 추가 건설 기회!`);return;}
   log(s,`${p.name}님이 출발지에 도착했어요.`);break;
  }
  case 'island':p.stuck=ISLAND_TURNS;p.travelTicket=false;s.extraRoll=false;log(s,`${p.name}님이 무인도에 갇혔어요! 최대 ${ISLAND_TURNS}차례 체류.`);break;
  case 'tax':{
   const assessed=ownTiles(s,p.id).reduce((sum,i)=>sum+propertyValue(i,property(s,i).level),0);
   const amount=roundMoney(Math.max(40,Math.min(260,assessed*.1)));
   const paid=spend(s,p,amount);log(s,`${p.name}님 국세청 세금 ${paid}M`);break;
  }
  case 'olympic':{
   const available=ownTiles(s,p.id).filter(i=>(s.olympics[i]||1)<5);
   if(available.length){s.phase='choice';s.pending={kind:'olympic'};log(s,`${p.name}님, 올림픽 개최지를 선택해 통행료를 높이세요!`);return;}
   credit(s,p,100,'올림픽 참가 보너스');break;
  }
  case 'chance':s.phase='chance';s.pending={kind:'fortune'};log(s,`${p.name}님, 행운 편지 3장 중 하나를 고르세요!`);return;
  case 'travel':p.travelTicket=true;log(s,`${p.name}님 세계여행 티켓 획득! 다음 자기 차례에 목적지를 선택해요.`);break;
 }
 if(checkVictory(s))return;nextTurn(s);
}
function move(s,target,rng,teleport=false){
 const p=current(s);
 if(!teleport&&target>=TILES.length){p.laps+=Math.floor(target/TILES.length);
  credit(s,p,PASS_BONUS*Math.floor(target/TILES.length),'출발지 통과 보너스');}
 p.position=((target%TILES.length)+TILES.length)%TILES.length;
 log(s,`${p.name}님이 ${TILES[p.position].name}에 도착했어요.`);
 arrive(s,p.position,rng);
}
export function createGame({players,maxRounds=DEFAULT_ROUNDS}={}){
 if(!Array.isArray(players)||players.length<2||players.length>MAX_PLAYERS)throw Error('2~4명이 필요합니다.');
 if(new Set(players.map(p=>p.id)).size!==players.length)throw Error('플레이어 ID가 중복되었습니다.');
 const rounds=(maxRounds===ENDLESS_ROUNDS||String(maxRounds)==='0')?ENDLESS_ROUNDS:ALLOWED_ROUNDS.includes(Number(maxRounds))?Number(maxRounds):DEFAULT_ROUNDS;
 const s={version:4,players:players.map((p,i)=>({id:String(p.id),name:String(p.name||`플레이어 ${i+1}`).slice(0,16),ai:!!p.ai,cash:START_CASH,position:0,stuck:0,bankrupt:false,laps:0,angel:0,discountCards:0,bankDebt:0,loanUsed:false,travelTicket:false,parityUses:PARITY_USES})),properties:{},olympics:{},turnIndex:0,turnCount:0,round:1,maxRounds:rounds,phase:'roll',pending:null,lastRoll:null,extraRoll:false,doubles:0,winner:null,reason:null,log:[],actionSeq:0,lastEvent:null,events:[],lastCard:null};
 log(s,rounds===ENDLESS_ROUNDS?'모여마블 무한모드 개막! 독점 승리는 없고 마지막 한 명이 남을 때 끝납니다.':`모여마블 개막! ${rounds}라운드 빠른 대결입니다.`);return s;
}
function summarizeAction(before,after,id,type,pending,origin,diceResult){
 const actor=after.players.find(x=>x.id===id),previous=before.players.find(x=>x.id===id);
 const prevMessages=new Set((before.log||[]).map(e=>`${e.text}/${e.at}`));
 const messages=(after.log||[]).filter(e=>!prevMessages.has(`${e.text}/${e.at}`)).map(e=>e.text).reverse().slice(0,10);
 const propertyChanges=[];
 for(const key of new Set([...Object.keys(before.properties),...Object.keys(after.properties)])){
  const old=before.properties[key]||null,now=after.properties[key]||null;
  if(old?.owner!==now?.owner||old?.level!==now?.level)propertyChanges.push({index:+key,previous:old,now,kind:!old&&now?'purchase':old&&now&&old.owner!==now.owner?'takeover':old&&now?'build':'sale'});
 }
 const moneyChanges=after.players.map(p=>({id:p.id,name:p.name,delta:p.cash-(before.players.find(x=>x.id===p.id)?.cash||0)})).filter(x=>x.delta!==0);
 const to=actor.position;
 let message='';
 if(type==='pickCard')message=`${actor.name} · 행운 편지 ${after.cardReveal?.emoji||'💌'} ${after.lastCard||'공개'}!`;
 else if(type==='takeLoan')message=`${actor.name} · 은행에서 ${BANK_LOAN}M 대출! 상환액 ${BANK_REPAY}M`;
 else if(type==='roll'||type==='islandRoll')message=diceResult?`${actor.name} · ${diceResult.a} + ${diceResult.b} = ${diceResult.total}칸! ${TILES[to].name}${diceResult.double?' · 더블!':''}`:`${actor.name} · 무인도에서 쉬었어요`;
 else if(type==='travel')message=`${actor.name} · 세계여행으로 ${TILES[to].name} 도착!`;
 else if(type==='buy')message=`${actor.name} · ${TILES[pending.index].name} 구매${propertyChanges[0]?.now?.level?' + 별장 건설':''}!`;
 else if(type==='upgrade'||type==='startBuild')message=`${actor.name} · ${TILES[pending.kind==='startBuild'?pending.index??-1:pending.index]?.name||TILES[after.lastBuilt]?.name||'도시'} ${LEVEL_NAMES[after.properties[after.lastBuilt]?.level||0]} 건설!`;
 else if(type==='takeover')message=`${actor.name} · ${TILES[pending.index].name} 인수 성공!`;
 else if(type==='olympic')message=`${actor.name} · ${TILES[after.olympicTarget]?.name||'도시'} 올림픽 개최! 통행료 ${after.olympics[after.olympicTarget]||2}배`;
 else if(type==='payBail')message=`${actor.name} · 보석금을 내고 무인도 탈출!`;
 else message=`${actor.name} · 이번 행동을 넘겼어요`;
 const special=messages.find(x=>x.includes('통행료')||x.includes('무인도')||x.includes('행운 편지')||x.includes('세금')||x.includes('세계여행'));
 if(special&&(type==='roll'||type==='islandRoll'))message+=` · ${special.replace(/^.*?님 /,'').slice(0,45)}`;
 return {seq:(before.actionSeq||0)+1,type,actor:id,actorName:actor.name,ai:!!previous?.ai,card:type==='pickCard'?after.cardReveal:null,from:origin,to,travel:type==='travel'||messages.some(x=>x.includes('3연속 더블')),dice:diceResult||null,tileIndex:['roll','islandRoll','travel'].includes(type)?to:pending?.index??to,propertyChanges,moneyChanges,message:message.trim(),messages,phase:after.phase,turnIndexBefore:before.turnIndex,turnIndexAfter:after.turnIndex,winner:after.winner||null};
}
function rollDice(rng,parity){
 const a=randomIndex(rng,6)+1;
 const b=parity==='odd'||parity==='even'?2*randomIndex(rng,3)+((a%2===0)===(parity==='even')?2:1):randomIndex(rng,6)+1;
 return {a,b,total:a+b,double:a===b};
}
export function applyAction(input,id,type,payload={},rng=Math.random){
 const s=structuredClone(input);
 if(s.phase==='finished')throw Error('이미 종료된 게임입니다.');
 if(current(s).id!==id)throw Error('지금은 다른 플레이어 차례입니다.');
 const p=current(s),origin=p.position,pending=s.pending?{...s.pending}:null;
 let rolled=null;
 const commit=()=>{const event=summarizeAction(input,s,id,type,pending,origin,rolled);s.actionSeq=event.seq;s.lastEvent=event;s.events=[event,...(input.events||[])].slice(0,28);return s;};
 if(type==='takeLoan'){
  if(p.loanUsed)throw Error('은행 대출은 한 판에 한 번만 가능합니다.');
  if(!['roll','choice','island','travel','chance'].includes(s.phase))throw Error('현재는 대출을 이용할 수 없습니다.');
  p.cash+=BANK_LOAN;p.bankDebt=BANK_REPAY;p.loanUsed=true;
  log(s,`${p.name}님 은행 대출 +${BANK_LOAN}M · 상환 예정 ${BANK_REPAY}M (출발지 보너스부터 자동 상환)`);
  return commit();
 }
 if(type==='pickCard'){
  if(s.phase!=='chance'||pending?.kind!=='fortune')throw Error('행운 편지를 뽑을 차례가 아닙니다.');
  const index=Number(payload.index);
  if(!Number.isInteger(index)||index<0||index>2)throw Error('편지는 1~3번에서 선택해주세요.');
  s.pending=null;s.phase='roll';drawFortune(s,p,index,rng);
  if(!checkVictory(s))nextTurn(s);
  return commit();
 }
 if(type==='roll'){
  if(s.phase!=='roll')throw Error('현재 주사위를 던질 차례가 아닙니다.');
  const parity=payload.parity;
  if(parity!==undefined){if(!['odd','even'].includes(parity))throw Error('홀짝은 홀 또는 짝 중 하나여야 합니다.');if(p.parityUses<=0)throw Error('홀짝 기회를 모두 사용했습니다.');p.parityUses--;}
  const result=rollDice(rng,parity);rolled=result;s.lastRoll=result;
  if(result.double){s.doubles++;s.extraRoll=true;}else{s.doubles=0;s.extraRoll=false;}
  log(s,`${p.name}님 주사위 ${result.a} + ${result.b} = ${result.total}${result.double?' · 더블!':''}${parity?' (홀짝 아이템)':''}`);
  if(s.doubles>=3){p.position=6;p.stuck=ISLAND_TURNS;s.extraRoll=false;s.doubles=0;log(s,`${p.name}님, 3연속 더블로 무인도 강제 이동!`);nextTurn(s);return commit();}
  move(s,p.position+result.total,rng);return commit();
 }
 if(s.phase==='island'){
  if(type==='payBail'){if(p.cash<BAIL_COST)throw Error('무인도 탈출 비용이 부족합니다.');p.cash-=BAIL_COST;p.stuck=0;s.phase='roll';s.pending=null;log(s,`${p.name}님이 보석금 ${BAIL_COST}M을 지불하고 탈출! 주사위를 던지세요.`);return commit();}
  if(type==='pass'){p.stuck=Math.max(0,p.stuck-1);log(s,`${p.name}님 무인도 휴식 · 남은 ${p.stuck}차례`);nextTurn(s);return commit();}
  if(type==='islandRoll'){
   const result=rollDice(rng);rolled=result;s.lastRoll=result;
   if(result.double){p.stuck=0;s.doubles=0;s.extraRoll=false;log(s,`${p.name}님 더블! 무인도 탈출 성공!`);move(s,p.position+result.total,rng);}
   else{p.stuck=Math.max(0,p.stuck-1);log(s,`${p.name}님 탈출 실패 (${result.a}+${result.b}) · 남은 ${p.stuck}차례`);nextTurn(s);}
   return commit();
  }
  throw Error('무인도에서는 탈출 방법을 선택하세요.');
 }
 if(type==='travel'){
  if(s.phase!=='travel')throw Error('세계여행 차례가 아닙니다.');
  const target=Number(payload.index);if(!validIndex(target)||target===18)throw Error('다른 목적지를 선택해주세요.');
  p.travelTicket=false;s.pending=null;s.phase='roll';move(s,target,rng,true);return commit();
 }
 if(s.phase!=='choice')throw Error('먼저 진행 중인 선택을 끝내주세요.');
 if(type==='pass'){log(s,`${p.name}님이 구매/건설 기회를 건너뛰었어요.`);nextTurn(s);return commit();}
 if(pending.kind==='purchase'&&type==='buy'){
  const t=TILES[pending.index],target=payload.targetLevel===undefined?0:Number(payload.targetLevel);
  if(property(s,pending.index))throw Error('이미 소유자가 있는 곳입니다.');
  if(!Number.isInteger(target)||(t.kind==='tourist'?target!==0:target<0||target>Math.min(3,1+p.laps)))throw Error('현재 바퀴 수에서 지을 수 없는 건물입니다.');
  const cost=t.price+(target>0?upgradeCost(pending.index,0,target):0);
  if(p.cash<cost)throw Error('구매와 건설 비용이 부족합니다.');
  p.cash-=cost;s.properties[pending.index]={owner:id,level:target};
  log(s,`${p.name}님이 ${t.name} 구매 ${t.price}M${target?` · ${LEVEL_NAMES[target]} 건설 ${cost-t.price}M`:''}!`);
 }else if(pending.kind==='upgrade'&&type==='upgrade'){
  const index=pending.index,held=property(s,index),target=payload.targetLevel===undefined?held.level+1:Number(payload.targetLevel);
  if(held?.owner!==id||!Number.isInteger(target)||target<=held.level||target>maxBuildLevel(s,id,index))throw Error('현재 건설할 수 없는 단계입니다.');
  const cost=upgradeCost(index,held.level,target);if(p.cash<cost)throw Error('건설 자금이 부족합니다.');
  p.cash-=cost;held.level=target;s.lastBuilt=index;log(s,`${p.name}님이 ${TILES[index].name}에 ${LEVEL_NAMES[target]} 건설! (-${cost}M)`);
 }else if(pending.kind==='startBuild'&&type==='startBuild'){
  const index=Number(payload.index),held=property(s,index),target=Number(payload.targetLevel);
  if(!validIndex(index)||TILES[index].kind!=='city'||held?.owner!==id||!Number.isInteger(target)||target<=held.level||target>maxBuildLevel(s,id,index))throw Error('출발지 건설 대상/단계를 확인해주세요.');
  const cost=upgradeCost(index,held.level,target);if(p.cash<cost)throw Error('건설 자금이 부족합니다.');
  p.cash-=cost;held.level=target;s.lastBuilt=index;log(s,`${p.name}님이 출발지 보너스로 ${TILES[index].name} ${LEVEL_NAMES[target]} 건설! (-${cost}M)`);
 }else if(pending.kind==='olympic'&&type==='olympic'){
  const index=Number(payload.index),held=property(s,index),now=s.olympics[index]||1;
  if(!validIndex(index)||held?.owner!==id||now>=5)throw Error('올림픽을 개최할 수 없는 장소입니다.');
  const cost=olympicCost(s,index);if(p.cash<cost)throw Error('올림픽 개최 비용이 부족합니다.');
  p.cash-=cost;s.olympics[index]=now+1;s.olympicTarget=index;
  log(s,`${p.name}님이 ${TILES[index].name}에서 올림픽 개최! 통행료 ${now+1}배 (-${cost}M)`);
 }else if(pending.kind==='takeover'&&type==='takeover'){
  const index=pending.index,held=property(s,index);
  if(!held||TILES[index].kind!=='city'||held.owner===id||held.level===4)throw Error('랜드마크와 관광지는 인수할 수 없습니다.');
  const cost=propertyValue(index,held.level)*2, target=payload.targetLevel===undefined?held.level:Number(payload.targetLevel);
  const max=maxBuildLevel(s,id,index);
  if(!Number.isInteger(target)||target<held.level||target>max)throw Error('현재 건설할 수 없는 단계입니다.');
  const extra=target>held.level?upgradeCost(index,held.level,target):0;
  if(p.cash<cost+extra)throw Error('인수/건설 비용이 부족합니다.');
  const seller=s.players.find(x=>x.id===held.owner);
  p.cash-=cost+extra;seller.cash+=cost;held.owner=id;held.level=target;
  if(target>0)s.lastBuilt=index;
  log(s,`${p.name}님이 ${TILES[index].name}을 ${cost}M에 인수${extra?` + 건설 ${extra}M`:''}!`);
 }else throw Error('현재 사용할 수 없는 행동입니다.');
 if(!checkVictory(s))nextTurn(s);return commit();
}
export function olympicCost(s,index){return 75+25*((s.olympics?.[index]||1)-1);}
export function chooseCatAction(s){
 const p=current(s);if(!p?.ai||p.bankrupt||s.phase==='finished')return null;
 if(!p.loanUsed&&p.cash<140)return {type:'takeLoan'};
 if(s.phase==='chance')return {type:'pickCard',payload:{index:Math.floor(Math.random()*3)}};
 if(s.phase==='roll'){
  // Prefer an unbiased throw. Parity tokens are reserved for optional human strategy.
  return {type:'roll'};
 }
 if(s.phase==='island')return p.cash>BAIL_COST+420?{type:'payBail'}:{type:'islandRoll'};
 if(s.phase==='travel'){
  const candidates=TILES.map((t,i)=>({t,i})).filter(({t,i})=>isProperty(i)&&property(s,i)?.owner!==p.id);
  const scored=candidates.map(({t,i})=>{
   const held=property(s,i),cost=held?propertyValue(i,held.level)*2:t.price;
   let value=!held?240-t.price/5:held.level===4||t.kind==='tourist'?-1000:100-toll(s,i)*.4;
   if(t.kind==='tourist'&&TILES.some((x,j)=>x.kind==='tourist'&&j!==i&&property(s,j)?.owner===p.id))value+=550;
   if(t.kind==='city'&&TILES.some((x,j)=>x.kind==='city'&&x.group===t.group&&j!==i&&property(s,j)?.owner===p.id))value+=430;
   if(p.cash<cost+70)value-=800;
   return {i,value};
  }).sort((a,b)=>b.value-a.value);
  return {type:'travel',payload:{index:scored[0]?.i??0}};
 }
 if(s.phase!=='choice')return {type:'pass'};
 const {kind,index}=s.pending;
 if(kind==='startBuild'||kind==='olympic'){
  const candidates=ownTiles(s,p.id).filter(i=>kind==='olympic'? (s.olympics[i]||1)<5 : TILES[i].kind==='city'&&property(s,i).level<maxBuildLevel(s,p.id,i));
  const preferred=candidates.map(i=>({i,score:toll(s,i)+propertyValue(i,property(s,i).level)*.2})).sort((a,b)=>b.score-a.score);
  for(const {i} of preferred){if(kind==='olympic'){if(p.cash>=olympicCost(s,i)+200)return {type:'olympic',payload:{index:i}};}
   else{const level=property(s,i).level+1;if(p.cash>=upgradeCost(i,property(s,i).level,level)+160)return {type:'startBuild',payload:{index:i,targetLevel:level}};}}
  return {type:'pass'};
 }
 const tile=TILES[index],held=property(s,index);
 if(kind==='purchase'){
  const partner=TILES.findIndex((t,i)=>t.kind==='city'&&tile.kind==='city'&&i!==index&&t.group===tile.group);
  const premium=partner>=0&&property(s,partner)?.owner===p.id||tile.kind==='tourist'&&TILES.some((x,i)=>x.kind==='tourist'&&i!==index&&property(s,i)?.owner===p.id);
  if(p.cash<tile.price+(premium?70:145))return {type:'pass'};
  const villa=tile.kind==='city'&&p.cash>=tile.price+buildingCost(index,0)+(premium?110:250);
  return {type:'buy',payload:{targetLevel:villa?1:0}};
 }
 if(kind==='upgrade'){
  const next=held.level+1,cost=upgradeCost(index,held.level,next);
  const reserve=next===4?90:210;
  return {type:p.cash>=cost+reserve?'upgrade':'pass',payload:{targetLevel:next}};
 }
 if(kind==='takeover'){
  const cost=propertyValue(index,held.level)*2;
  const partner=TILES.some((t,i)=>t.kind==='city'&&i!==index&&t.group===tile.group&&property(s,i)?.owner===p.id);
  return {type:p.cash>=cost+(partner?130:490)?'takeover':'pass'};
 }
 return {type:'pass'};
}
export function winnerRanking(s){return s.players.slice().sort((a,b)=>Number(a.bankrupt)-Number(b.bankrupt)||netWorth(s,b.id)-netWorth(s,a.id));}
export function surrender(input,id){
 const s=structuredClone(input);if(s.phase==='finished')return s;
 const p=s.players.find(x=>x.id===id);if(!p||p.bankrupt)throw Error('기권할 수 없는 참가자입니다.');
 p.bankrupt=true;p.cash=0;p.travelTicket=false;p.stuck=0;
 for(const i of ownTiles(s,id)){delete s.properties[i];delete s.olympics[i];}log(s,`${p.name}님 기권`);
 if(!checkVictory(s)&&current(s).id===id){s.extraRoll=false;nextTurn(s);}
 return s;
}