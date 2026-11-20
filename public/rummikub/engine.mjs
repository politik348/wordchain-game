/** Rummikub Classic rules core. Server is authoritative; no external dependencies. */
export const COLORS = ['red','blue','black','orange'];
export const MIN_OPEN = 30;
export const TILE_COUNT = 106;
const fail = (message) => { const e = new Error(message); e.status = 400; throw e; };

export function tileFromId(id) {
  if (typeof id !== 'string') return null;
  if (/^j-[01]$/.test(id)) return {id, joker:true, value:0, color:'joker'};
  const m = /^t-([0-3])-(1[0-3]|[1-9])-([01])$/.exec(id);
  if (!m) return null;
  return {id, color:COLORS[Number(m[1])], value:Number(m[2]), copy:Number(m[3]), joker:false};
}
export function makeDeck() {
  const deck = [];
  for (let c=0;c<4;c++) for (let n=1;n<=13;n++) for (let copy=0;copy<2;copy++) deck.push(`t-${c}-${n}-${copy}`);
  deck.push('j-0','j-1');
  return deck;
}
function shuffle(array,rng=Math.random) {
  for(let i=array.length-1;i>0;i--) { const j=Math.floor(rng()*(i+1)); [array[i],array[j]]=[array[j],array[i]]; }
  return array;
}
/** Meld verification returns a canonical minimum score when a joker admits multiple possible values. */
export function meldInfo(ids) {
  if(!Array.isArray(ids) || ids.length<3 || ids.length>13 || new Set(ids).size!==ids.length) return {valid:false};
  const tiles=ids.map(tileFromId);
  if(tiles.some(t=>!t)) return {valid:false};
  const known=tiles.filter(t=>!t.joker);
  const jokers=tiles.length-known.length;
  if(jokers>2 || !known.length) return {valid:false};
  const group = tiles.length<=4 && known.every(t=>t.value===known[0].value)
    && new Set(known.map(t=>t.color)).size===known.length;
  if(group) return {valid:true,type:'group',score:tiles.length*known[0].value,
    description:`${known[0].value} 묶음`};
  if(tiles.length>13 || known.some(t=>t.color!==known[0].color)) return {valid:false};
  for(let start=1;start<=14-tiles.length;start++){
    if(known.every(t=>t.value===start+ids.indexOf(t.id))) {
      const sum=tiles.length*(2*start+tiles.length-1)/2;
      return {valid:true,type:'run',score:sum,description:`${known[0].color} 연속 ${start}~${start+tiles.length-1}`};
    }
  }
  return {valid:false};
}
export function rackPoints(hand) {return hand.reduce((n,id)=>n+(tileFromId(id)?.joker?30:(tileFromId(id)?.value||0)),0);}
export function newGame(playerIds,{turnSeconds=60,rng=Math.random,now=Date.now()}={}) {
  if(!Array.isArray(playerIds) || playerIds.length<2 || playerIds.length>4 || new Set(playerIds).size!==playerIds.length) fail('루미큐브는 2~4명이 플레이합니다.');
  const bag=shuffle(makeDeck(),rng);
  const hands=Object.fromEntries(playerIds.map(pid=>[pid,bag.splice(0,14)]));
  const turnIndex=Math.min(playerIds.length-1,Math.floor(rng()*playerIds.length));
  const seconds=Number(turnSeconds);
  if(![15,30,45,60,90].includes(seconds)) fail('제한시간 설정이 올바르지 않습니다.');
  const matchId=`${Math.floor(rng()*0x100000000).toString(36)}-${Number(now).toString(36)}`;
  return {matchId,bag,hands,table:[],opened:Object.fromEntries(playerIds.map(id=>[id,false])),
    turnIndex,turn:playerIds[turnIndex],turnNumber:1,deadline:now+seconds*1000,turnSeconds:seconds,
    lastMove:'게임이 시작되었습니다.',passCount:0,winner:null,result:null,scores:null,history:[]};
}
export function publicView(s,sid,playerIds){
  return {matchId:s.matchId,table:s.table.map(g=>[...g]),hand:[...(s.hands[sid]||[])],counts:Object.fromEntries(playerIds.map(pid=>[pid,s.hands[pid].length])),
    opened:{...s.opened},remaining:s.bag.length,turn:s.turn,turnNumber:s.turnNumber,deadline:s.deadline,
    turnSeconds:s.turnSeconds,lastMove:s.lastMove,winner:s.winner,result:s.result,scores:s.scores,
    history:s.history.slice(-8)};
}
function note(s,text) {s.lastMove=text;s.history.push(text);s.history=s.history.slice(-12);}
function finish(s,ids,winner,reason){
  s.winner=winner;
  s.scores=Object.fromEntries(ids.map(id=>[id, -rackPoints(s.hands[id])]));
  if(winner) s.scores[winner]=ids.filter(id=>id!==winner).reduce((sum,id)=>sum+rackPoints(s.hands[id]),0);
  s.result=reason;
}
function next(s,ids,now){s.turnIndex=(s.turnIndex+1)%ids.length;s.turn=ids[s.turnIndex];s.turnNumber++;s.deadline=now+s.turnSeconds*1000;}
/** Atomic commit: existing table tiles cannot disappear; new tile(s) must come from current player's rack. */
export function submitTurn(s,ids,sid,groups,{now=Date.now()}={}) {
  if(s.winner||s.result) fail('종료된 게임입니다.');
  if(s.turn!==sid) fail('상대방 차례입니다.');
  if(now>s.deadline) fail('턴 제한시간을 초과했습니다.');
  if(!Array.isArray(groups) || groups.length>40) fail('테이블 조합 형식이 올바르지 않습니다.');
  const original=s.table.flat(); const originalSet=new Set(original);
  const hand=s.hands[sid]; const handSet=new Set(hand);
  let used=[]; let total=0;
  const sanitized=[];
  for(const g of groups) {
    if(!Array.isArray(g) || g.length<3 || g.length>13) fail('각 조합은 3~13개의 타일로 구성해야 합니다.');
    const m=meldInfo(g); if(!m.valid) fail('잘못된 조합이 있습니다. 숫자 순서와 색상을 확인하세요.');
    sanitized.push([...g]);total+=m.score;used.push(...g);
  }
  if(used.length>106 || new Set(used).size!==used.length) fail('같은 타일을 여러 번 사용할 수 없습니다.');
  if(!original.every(id=>used.includes(id))) fail('테이블의 기존 타일을 모두 유효한 조합에 배치해야 합니다.');
  if(used.some(id=>!originalSet.has(id)&&!handSet.has(id))) fail('내가 갖고 있지 않은 타일입니다.');
  const put=used.filter(id=>!originalSet.has(id));
  if(!put.length) fail('내 패에서 최소 1개의 타일을 내려놓아야 합니다.');
  if(!s.opened[sid]) {
    if(original.length && sanitized.length !== s.table.length) {
      // New combinations can be added, but old melds must remain untouched.
    }
    // The first move may not manipulate the previous table or rely on its points.
    const pristine = s.table.every((g,i)=>sanitized[i]?.length===g.length && g.every((id,j)=>sanitized[i][j]===id));
    if(!pristine) fail('최초 등록에서는 기존 테이블의 조합을 사용할 수 없습니다.');
    const fresh=sanitized.slice(s.table.length);
    if(fresh.length===0 || fresh.flat().length!==put.length) fail('최초 등록은 자신의 패로 만든 별도 조합만 제출해야 합니다.');
    const openingScore=fresh.reduce((acc,g)=>acc+meldInfo(g).score,0);
    if(openingScore<MIN_OPEN) fail(`최초 등록에는 최소 ${MIN_OPEN}점이 필요합니다. 현재 ${openingScore}점입니다.`);
    s.opened[sid]=true;
  }
  s.table=sanitized;
  s.hands[sid]=hand.filter(id=>!new Set(put).has(id));
  s.passCount=0;
  note(s,`${sid}님이 타일 ${put.length}개를 등록했습니다.`);
  if(!s.hands[sid].length){finish(s,ids,sid,`${sid}님이 루미큐브에서 승리했습니다!`);return;}
  next(s,ids,now);
}
export function drawTurn(s,ids,sid,{now=Date.now(),penalty=false}={}){
  if(s.winner||s.result) fail('종료된 게임입니다.');
  if(s.turn!==sid) fail('상대방 차례입니다.');
  const count=penalty?3:1;
  let taken=0;
  for(let i=0;i<count&&s.bag.length;i++){s.hands[sid].push(s.bag.pop());taken++;}
  if(s.bag.length===0) s.passCount++; else s.passCount=0;
  note(s,`${sid}님이 타일 ${taken}개를 받고 턴을 마쳤습니다.`);
  if(!s.bag.length && s.passCount>=ids.length) {
    const ranking=ids.map(id=>({id,points:rackPoints(s.hands[id])})).sort((a,b)=>a.points-b.points);
    const tie=ranking.length>1 && ranking[0].points===ranking[1].points;
    finish(s,ids,tie?null:ranking[0].id,tie?'더 이상 낼 타일이 없어 공동 종료되었습니다.':`${ranking[0].id}님이 남은 타일 최소점으로 승리했습니다.`);
    return;
  }
  next(s,ids,now);
}
export function tick(s,ids,{now=Date.now()}={}) {
  if(s.result||now<=s.deadline)return false;
  const timedOut=s.turn;
  drawTurn(s,ids,timedOut,{now});
  note(s,`${timedOut}님 시간 초과 · 자동으로 타일을 받았습니다.`);
  return true;
}
