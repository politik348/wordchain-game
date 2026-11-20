/** Moyeo Marble: deterministic, server-authoritative board-game rule engine.
 * Original board, values, game rules and visual identity. No third-party dependencies.
 */
export const GROUPS = [
  {name:'벚꽃',color:'#f694a8'}, {name:'햇살',color:'#f4b868'},
  {name:'숲길',color:'#79cda5'}, {name:'바다',color:'#5cb9d0'},
  {name:'라벤더',color:'#a99be2'}, {name:'별빛',color:'#8299e1'},
  {name:'노을',color:'#e69c78'}, {name:'보석',color:'#c58dca'}
];
const city=(name,price,group,emoji)=>({kind:'city',name,price,group,emoji});
const special=(kind,name,emoji)=>({kind,name,emoji});
export const TILES = [
  special('start','출발','🚩'),
  city('서울',110,0,'🌸'),city('부산',125,0,'🌊'),special('chance','행운 편지','💌'),
  city('인천',135,1,'✈️'),city('대전',145,1,'🌳'),special('bonus','보너스','🎁'),
  city('광주',150,2,'🍃'),city('대구',160,2,'🎡'),special('tax','세금','🧾'),
  city('울산',165,3,'🐳'),city('제주',185,3,'🍊'),special('island','무인도','🏝️'),
  city('도쿄',185,4,'🗼'),city('오사카',200,4,'🏯'),special('festival','축제','🎊'),
  city('타이베이',205,5,'🧋'),city('홍콩',220,5,'🌃'),special('travel','세계여행','🌍'),
  city('파리',225,6,'🥐'),city('런던',240,6,'🎡'),special('chance','행운 편지','✨'),
  city('로마',250,7,'🏛️'),city('뉴욕',270,7,'🗽')
];
export const MAX_PLAYERS=4;
export const START_CASH=1600;
export const PASS_BONUS=180;
export const ALLOWED_ROUNDS=[8,12,16];
export const DEFAULT_ROUNDS=12;
export const TOLL_MULTIPLIERS=[0,1,2.5,5,9];
const roundMoney=n=>Math.max(0,Math.round(n/5)*5);
const isCity=index=>TILES[index]?.kind==='city';
const prop=(s,index)=>s.properties[index]||null;
const active=s=>s.players.filter(p=>!p.bankrupt);
const current=s=>s.players[s.turnIndex];
const ownCities=(s,id)=>Object.entries(s.properties).filter(([,v])=>v.owner===id).map(([i])=>+i);
const card=(s,index)=>prop(s,index);
export const buildingCost=(index,level)=>roundMoney(TILES[index].price * (0.45+level*0.17));
export const propertyValue=(index,level)=>TILES[index].price+Array.from({length:Math.max(0,level-1)},(_,k)=>buildingCost(index,k+1)).reduce((a,b)=>a+b,0);
export const colorComplete=(s,id,group)=>TILES.every((t,i)=>t.kind!=='city'||t.group!==group||prop(s,i)?.owner===id);
export function countMonopolies(s,id){return GROUPS.filter((_,g)=>colorComplete(s,id,g)).length;}
export function toll(s,index){
 const tile=TILES[index],property=prop(s,index); if(!tile||!property)return 0;
 let amount=roundMoney(tile.price*0.26*TOLL_MULTIPLIERS[property.level]);
 if(colorComplete(s,property.owner,tile.group))amount*=2;
 if(s.festival?.index===index && s.turnCount < s.festival.expires)amount*=2;
 return roundMoney(amount);
}
export function netWorth(s,id){
 const p=s.players.find(x=>x.id===id);if(!p)return 0;
 return p.cash+ownCities(s,id).reduce((a,i)=>a+propertyValue(i,prop(s,i).level),0);
}
const log=(s,message)=>{s.log=[{at:s.turnCount,text:message},...(s.log||[])].slice(0,24);};
const randInt=(rng,n)=>Math.min(n-1,Math.floor(rng()*n));
const nextAliveIndex=(s,index)=>{
 for(let step=1;step<=s.players.length;step++){
  const i=(index+step)%s.players.length;
  if(!s.players[i].bankrupt)return i;
 }
 return index;
};
function evaluateWinner(s){
 const survivors=active(s);
 if(survivors.length===1){s.winner=survivors[0].id;s.reason='파산 승리';s.phase='finished';return true;}
 // Any three 2-city color groups yields an immediate strategic victory.
 for(const p of survivors){
  if(countMonopolies(s,p.id)>=3){s.winner=p.id;s.reason='트리플 컬러 독점';s.phase='finished';return true;}
 }
 // A board edge comprises 4 cities and 2 non-city spaces.
 for(const p of survivors){
  const edges=[[1,2,4,5],[7,8,10,11],[13,14,16,17],[19,20,22,23]];
  if(edges.some(edge=>edge.every(i=>prop(s,i)?.owner===p.id))){s.winner=p.id;s.reason='라인 독점';s.phase='finished';return true;}
 }
 return false;
}
function finishAtLimit(s){
 const ranking=active(s).slice().sort((a,b)=>netWorth(s,b.id)-netWorth(s,a.id));
 s.winner=ranking[0]?.id||null;s.reason='라운드 종료 · 총자산 승리';s.phase='finished';
 log(s,`${ranking[0]?.name||'플레이어'}님이 총자산 1위로 우승했어요!`);
}
function nextTurn(s){
 s.pending=null;s.lastRoll=null;
 if(evaluateWinner(s))return;
 const index=s.turnIndex;
 if(s.extraRoll){s.extraRoll=false;s.phase='roll';log(s,`${current(s).name}님, 더블 보너스로 한 번 더!`);return;}
 s.doubles=0;s.turnCount++;
 if(s.turnCount>=s.maxRounds*s.players.length){finishAtLimit(s);return;}
 s.turnIndex=nextAliveIndex(s,index);
 s.phase='roll';
 if(s.turnIndex===0)s.round=Math.floor(s.turnCount/s.players.length)+1;
}
function sellToCover(s,p,owed){
 // Auto-liquidation prevents deadlocks and eliminates a long manual bankruptcy dialog.
 const assets=ownCities(s,p.id).sort((a,b)=>propertyValue(a,prop(s,a).level)-propertyValue(b,prop(s,b).level));
 for(const index of assets){
  if(p.cash>=owed)break;
  const amount=roundMoney(propertyValue(index,prop(s,index).level)*0.7);
  p.cash+=amount;delete s.properties[index];
  log(s,`${p.name}님이 ${TILES[index].name}을(를) 매각해 ${amount}M을 확보했어요.`);
 }
}
function spend(s,p,amount,creditor=null){
 sellToCover(s,p,amount);
 const paid=Math.min(p.cash,amount);p.cash-=paid;
 if(creditor)creditor.cash+=paid;
 if(paid<amount){
  p.bankrupt=true;p.cash=0;
  for(const i of ownCities(s,p.id))delete s.properties[i];
  log(s,`${p.name}님이 파산했습니다!`);
 }
 return paid;
}
function resolveArrival(s,index,rng){
 const p=current(s),tile=TILES[index];
 if(tile.kind==='city'){
  const owned=card(s,index);
  if(!owned){
   if(p.cash>=tile.price){s.phase='choice';s.pending={kind:'purchase',index};log(s,`${p.name}님이 ${tile.name}에 도착! 도시를 구매할까요?`);}
   else{log(s,`${p.name}님은 ${tile.name} 구매 자금이 부족해요.`);nextTurn(s);}
   return;
  }
  if(owned.owner===p.id){
   if(owned.level<4 && p.cash>=buildingCost(index,owned.level)){
    s.phase='choice';s.pending={kind:'upgrade',index};log(s,`${tile.name}에서 건물을 업그레이드할 수 있어요.`);
   } else {log(s,`${tile.name}은 내 도시!`);nextTurn(s);}return;
  }
  const owner=s.players.find(x=>x.id===owned.owner);
  const charge=toll(s,index),paid=spend(s,p,charge,owner);
  log(s,`${p.name}님이 ${owner?.name||'상대'}님에게 통행료 ${paid}M 지불!`);
  if(evaluateWinner(s))return;
  if(!p.bankrupt && owned.level<4 && p.cash>=propertyValue(index,owned.level)*2){
   s.pending={kind:'takeover',index};s.phase='choice';
  }else nextTurn(s);
  return;
 }
 switch(tile.kind){
 case 'start':log(s,`${p.name}님, 출발지에서 쉬어갑니다.`);break;
 case 'bonus':p.cash+=170;log(s,`보너스! ${p.name}님 +170M`);break;
 case 'tax':{const amount=Math.min(160,roundMoney(Math.max(70,netWorth(s,p.id)*0.07)));spend(s,p,amount);log(s,`세금 납부 ${amount}M`);break;}
 case 'island':p.stuck=1;log(s,`${p.name}님이 무인도에 갇혔어요. 다음 차례를 쉬어요.`);break;
 case 'festival':{
  const own=ownCities(s,p.id);
  if(own.length){const target=own[randInt(rng,own.length)];s.festival={index:target,expires:s.turnCount+s.players.length*2};log(s,`축제 개최! ${TILES[target].name} 통행료 2배 · 약 2라운드`);}
  else {p.cash+=120;log(s,`축제 참가 보너스 +120M`);}break;
 }
 case 'chance':{
  const cards=[
   ['주식 대박! +210M',210],['길거리 공연 수익! +140M',140],['세금 환급! +100M',100],
   ['장학금! +180M',180],['수리비 지출 -110M',-110],['교통 과태료 -90M',-90],
   ['경품 당첨! +240M',240],['기부 참여 -65M',-65]
  ];
  const [message,delta]=cards[randInt(rng,cards.length)];
  if(delta>0)p.cash+=delta;else spend(s,p,-delta);
  log(s,`${p.name}님 · ${message}`);break;
 }
 case 'travel':s.phase='travel';s.pending={kind:'travel'};log(s,`${p.name}님이 세계여행에 도착! 이동할 도시를 선택하세요.`);return;
 }
 if(evaluateWinner(s))return;
 nextTurn(s);
}
function movePlayer(s,target,rng,teleport=false){
 const p=current(s),from=p.position;
 if(!teleport && target>=24){p.cash+=PASS_BONUS;log(s,`출발지 통과! ${p.name}님 +${PASS_BONUS}M`);p.laps++;}
 p.position=((target%24)+24)%24;
 log(s,`${p.name}님이 ${TILES[p.position].name}에 도착했어요.`);
 resolveArrival(s,p.position,rng);
}
export function createGame({players,maxRounds=DEFAULT_ROUNDS}={}){
 if(!Array.isArray(players)||players.length<2||players.length>MAX_PLAYERS)throw Error('2~4명이 필요합니다.');
 if(new Set(players.map(p=>p.id)).size!==players.length)throw Error('플레이어 ID가 중복되었습니다.');
 const rounds=ALLOWED_ROUNDS.includes(Number(maxRounds))?Number(maxRounds):DEFAULT_ROUNDS;
 const s={version:1,players:players.map((p,i)=>({id:String(p.id),name:String(p.name||`플레이어 ${i+1}`).slice(0,16),ai:!!p.ai,cash:START_CASH,position:0,stuck:0,bankrupt:false,laps:0})),properties:{},turnIndex:0,turnCount:0,round:1,maxRounds:rounds,phase:'roll',pending:null,lastRoll:null,extraRoll:false,doubles:0,festival:null,winner:null,reason:null,log:[],actionSeq:0,lastEvent:null,events:[]};
 log(s,`모여마블 개막! ${rounds}라운드 초고속 대결을 시작합니다.`);
 return s;
}
/** Public presentation data, computed from the authoritative state transition.
 * Used by local, AI, and online play; no game rules depend on these effects.
 */
function summarizeAction(before,after,actor,type,from,positionBefore,diceResult){
 const beforePlayer=before.players.find(p=>p.id===actor);
 const afterPlayer=after.players.find(p=>p.id===actor);
 const prevLog=new Set((before.log||[]).map(e=>e.text+':'+e.at));
 const newMessages=(after.log||[]).filter(e=>!prevLog.has(e.text+':'+e.at)).map(e=>e.text).reverse().slice(0,7);
 const changedProperties=[];
 for(const key of new Set([...Object.keys(before.properties),...Object.keys(after.properties)])){
  const old=before.properties[key]||null,now=after.properties[key]||null;
  if(old?.owner!==now?.owner || old?.level!==now?.level){
   changedProperties.push({index:Number(key),previous:old,now,kind:!old&&now?'purchase':old&&now&&old.owner!==now.owner?'takeover':old&&now?'build':'sale'});
  }
 }
 const moneyChanges=after.players.map(p=>({id:p.id,name:p.name,delta:p.cash-(before.players.find(b=>b.id===p.id)?.cash||0)})).filter(x=>x.delta!==0);
 const at=afterPlayer?.position??positionBefore;
 let message='';
 if(type==='roll'){
  if(beforePlayer.stuck)message=`${afterPlayer.name} · 무인도 휴식`;
  else if(diceResult){
   const forcedIsland=newMessages.some(x=>x.includes('3연속 더블'));
   if(forcedIsland){message=`${afterPlayer.name} · 3연속 더블! 무인도로 강제 이동`;}
   const tollLine=newMessages.find(x=>x.includes('통행료')&&x.includes('지불'));
   const specialLine=newMessages.find(x=>x.includes('보너스!')||x.includes('세금 납부')||x.includes('무인도에 갇')||x.includes('축제 개최')||x.includes('세계여행')||x.includes('대박!'));
   if(!forcedIsland)message=`${afterPlayer.name} · ${diceResult.a} + ${diceResult.b} = ${diceResult.total}칸! ${TILES[at].name} 도착${tollLine?' · 통행료 지불!':specialLine?' · 특별 이벤트!':''}`;
  }
  else message=`${afterPlayer.name} · 무인도로 이동`;
 }else if(type==='travel')message=`${afterPlayer.name} · 세계여행으로 ${TILES[at].name} 도착!`;
 else if(type==='buy')message=`${afterPlayer.name} · ${TILES[from.index].name} 매입 성공!`;
 else if(type==='upgrade')message=`${afterPlayer.name} · ${TILES[from.index].name} ${after.properties[from.index]?.level===4?'랜드마크 완성!':'건물 건설!'} `;
 else if(type==='takeover')message=`${afterPlayer.name} · ${TILES[from.index].name} 인수 성공!`;
 else message=`${afterPlayer.name} · 투자하지 않고 통과`;
 const event={
  seq:(before.actionSeq||0)+1,type,actor,actorName:afterPlayer?.name||'플레이어',ai:!!beforePlayer?.ai,
  from:positionBefore,to:at,travel:type==='travel'||newMessages.some(x=>x.includes('3연속 더블')),dice:diceResult||null,
  tileIndex:type==='roll'||type==='travel'?at:from?.index??at,
  propertyChanges:changedProperties,moneyChanges,message:message.trim(),messages:newMessages,
  phase:after.phase,turnIndexBefore:before.turnIndex,turnIndexAfter:after.turnIndex,
  winner:after.winner||null
 };
 return event;
}

export function applyAction(input,actor,type,payload={},rng=Math.random){
 const s=structuredClone(input);
 if(s.phase==='finished')throw Error('이미 종료된 게임입니다.');
 if(current(s).id!==actor)throw Error('지금은 다른 플레이어 차례입니다.');
 const p=current(s);
 const positionBefore=p.position, pendingBefore=s.pending?{...s.pending}:null;
 let diceResult=null;
 const commit=()=>{
  const event=summarizeAction(input,s,actor,type,pendingBefore,positionBefore,diceResult);
  s.actionSeq=event.seq;s.lastEvent=event;s.events=[event,...(input.events||[])].slice(0,24);
  return s;
 };
 if(type==='roll'){
  if(s.phase!=='roll')throw Error('아직 결정을 끝내지 않았습니다.');
  if(p.stuck){p.stuck--;log(s,`${p.name}님은 무인도에서 휴식! 다음 차례로 넘어갑니다.`);s.extraRoll=false;nextTurn(s);return commit();}
  const a=randInt(rng,6)+1,b=randInt(rng,6)+1;
  s.lastRoll={a,b,total:a+b,double:a===b};diceResult={...s.lastRoll};
  if(a===b){s.doubles++;s.extraRoll=true;}else{s.doubles=0;s.extraRoll=false;}
  if(s.doubles>=3){p.position=12;p.stuck=1;s.extraRoll=false;s.doubles=0;log(s,`${p.name}님, 3연속 더블! 무인도로 이동합니다.`);nextTurn(s);return commit();}
  log(s,`${p.name}님 주사위 ${a} + ${b} = ${a+b}${a===b?' · 더블!':''}`);
  movePlayer(s,p.position+a+b,rng);return commit();
 }
 if(type==='travel'){
  if(s.phase!=='travel')throw Error('세계여행 중이 아닙니다.');
  const idx=Number(payload.index);
  if(!Number.isInteger(idx)||idx<0||idx>=24||idx===18)throw Error('이동할 칸을 다시 선택해주세요.');
  s.phase='roll';s.pending=null;movePlayer(s,idx,rng,true);return commit();
 }
 if(s.phase!=='choice')throw Error('선택할 구매 또는 건설 행동이 없습니다.');
 const {kind,index}=s.pending;
 if(type==='pass'){log(s,`${p.name}님은 이번 투자를 건너뜁니다.`);nextTurn(s);return commit();}
 if(kind==='purchase' && type==='buy'){
  if(s.properties[index])throw Error('이미 소유한 도시입니다.');
  if(p.cash<TILES[index].price)throw Error('구매 자금이 부족합니다.');
  p.cash-=TILES[index].price;
  s.properties[index]={owner:p.id,level:1};
  log(s,`${p.name}님이 ${TILES[index].name}을(를) ${TILES[index].price}M에 구매!`);
 }else if(kind==='upgrade' && type==='upgrade'){
  const property=prop(s,index),cost=buildingCost(index,property.level);
  if(property.owner!==p.id||property.level>=4||p.cash<cost)throw Error('건설할 수 없습니다.');
  p.cash-=cost;property.level++;
  log(s,`${p.name}님이 ${TILES[index].name}에 ${property.level===4?'랜드마크':`${property.level}단계 건물`} 건설!`);
 }else if(kind==='takeover' && type==='takeover'){
  const property=prop(s,index),price=propertyValue(index,property.level)*2;
  if(property.owner===p.id||property.level>=4||p.cash<price)throw Error('인수할 수 없습니다.');
  const seller=s.players.find(x=>x.id===property.owner);
  p.cash-=price;seller.cash+=price;property.owner=p.id;
  log(s,`${p.name}님이 ${TILES[index].name}을(를) ${price}M에 인수했어요!`);
 }else throw Error('이 상황에서 사용할 수 없는 행동입니다.');
 if(!evaluateWinner(s))nextTurn(s);
 return commit();
}
export function chooseCatAction(s){
 const p=current(s);
 if(!p?.ai||p.bankrupt||s.phase==='finished')return null;
 if(s.phase==='roll')return {type:'roll'};
 if(s.phase==='travel'){
  const choices=TILES.map((t,i)=>({t,i})).filter(({t,i})=>t.kind==='city'&&prop(s,i)?.owner!==p.id);
  const scored=choices.map(({t,i})=>{
   const existing=prop(s,i);let score=existing? (existing.level>=4?-1e6:80) : 250-t.price/3;
   const mate=TILES.findIndex((x,k)=>k!==i&&x.kind==='city'&&x.group===t.group);
   if(prop(s,mate)?.owner===p.id)score+=350;
   if(existing && existing.owner!==p.id)score-=(toll(s,i)||0);
   return {i,score};
  }).sort((a,b)=>b.score-a.score);
  return {type:'travel',payload:{index:scored[0]?.i??0}};
 }
 if(s.phase!=='choice')return null;
 const {kind,index}=s.pending,price=TILES[index].price,property=prop(s,index);
 const mate=TILES.findIndex((t,i)=>i!==index&&t.kind==='city'&&t.group===TILES[index].group);
 const partner=prop(s,mate);
 if(kind==='purchase'){
  const reserve=partner?.owner===p.id?95:180;
  return {type:p.cash>=price+reserve?'buy':'pass'};
 }
 if(kind==='upgrade'){
  const cost=buildingCost(index,property.level);
  return {type:p.cash>=cost+(property.level===3?140:230)|| (partner?.owner===p.id && p.cash>cost+90)?'upgrade':'pass'};
 }
 if(kind==='takeover'){
  const cost=propertyValue(index,property.level)*2;
  return {type:property.level<4 && p.cash>cost+(partner?.owner===p.id?90:400)?'takeover':'pass'};
 }
 return {type:'pass'};
}
export function winnerRanking(s){return s.players.slice().sort((a,b)=>Number(a.bankrupt)-Number(b.bankrupt)||netWorth(s,b.id)-netWorth(s,a.id));}

/** A disconnected online player can concede without blocking every remaining turn. */
export function surrender(input,id){
 const s=structuredClone(input);
 if(s.phase==='finished')return s;
 const p=s.players.find(x=>x.id===id);
 if(!p||p.bankrupt)throw Error('기권할 수 없는 참가자입니다.');
 p.bankrupt=true;p.cash=0;
 for(const i of ownCities(s,id))delete s.properties[i];
 log(s,`${p.name}님이 기권했습니다.`);
 if(!evaluateWinner(s) && current(s).id===id){
  s.extraRoll=false;
  nextTurn(s);
 }
 return s;
}
