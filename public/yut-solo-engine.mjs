// One rule engine shared by the cat opponent and multiplayer Yutnori.
// 0 is the off-board starting point, 20 is the finish gateway.
// The previously missing diagonal from the center (23) to home goes via 28, 29.
export const YUT_ROUTES = {
  outer: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
  left: [0,1,2,3,4,5,21,22,23,24,25,15,16,17,18,19,20],
  right: [0,1,2,3,4,5,6,7,8,9,10,26,27,23,28,29,20],
  home: [23,28,29,20]
};
export const YUT_NAMES={1:'도',2:'개',3:'걸',4:'윷',5:'모','-1':'빽도'};
const FAIR_ROLLS=[1,1,1,2,2,2,3,3,3,4,4,5,-1];
// Small cat advantage from the previous implementation, unchanged.
const CAT_ROLLS=[1,1,2,2,2,3,3,3,3,4,4,5,-1];
export const freshYutPieces=()=>Array.from({length:4},()=>({node:0,route:'outer',index:0,done:false}));
export function rollYut(random=Math.random,cat=false){
 const pool=cat?CAT_ROLLS:FAIR_ROLLS;
 return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
}
function pickRoute(piece,shortcut){
 if(shortcut && piece.route==='outer' && piece.node===5)return {route:'left',at:5};
 if(shortcut && piece.route==='outer' && piece.node===10)return {route:'right',at:10};
 // Only a piece that STOPS at the center can choose the short path to home.
 if(shortcut && piece.route==='left' && piece.node===23)return {route:'home',at:0};
 return {route:piece.route,at:piece.index};
}
export function legalYutMoves(mine,steps){
 if(!Number.isInteger(steps)||(steps!==-1&&(steps<1||steps>100)))return [];
 const moves=[];
 mine.forEach((p,index)=>{
  if(p.done||(steps===-1&&p.node===0))return;
  const fork=(p.route==='outer'&&(p.node===5||p.node===10))||(p.route==='left'&&p.node===23);
  for(const shortcut of (fork?[true,false]:[true])) {
   const {route,at}=pickRoute(p,shortcut);
   if(at+steps>=0)moves.push({index,shortcut});
  }
 });
 return moves;
}
export function yutDestination(piece,steps,shortcut=true){
 const {route,at}=pickRoute(piece,shortcut);
 const nextIndex=at+steps;
 if(nextIndex<0)throw new Error('Invalid backward move');
 const complete=nextIndex>=YUT_ROUTES[route].length;
 return {node:complete?20:YUT_ROUTES[route][nextIndex],route,index:nextIndex,done:complete};
}
// Turns a selection of stored tosses into a single legal displacement.
// Positive tosses may be combined; back-do is always played separately.
export function yutSelectedSteps(rolls,indices){
 if(!Array.isArray(rolls)||!Array.isArray(indices)||!indices.length)throw new Error('Select a Yut toss');
 const seen=new Set();
 let total=0,hasBackdo=false;
 for(const index of indices){
  if(!Number.isInteger(index)||index<0||index>=rolls.length||seen.has(index))throw new Error('Invalid Yut toss selection');
  seen.add(index);
  const value=rolls[index];
  if(![-1,1,2,3,4,5].includes(value))throw new Error('Invalid Yut toss');
  if(value===-1)hasBackdo=true;
  total+=value;
 }
 if(hasBackdo&&indices.length!==1)throw new Error('Back-do must be used alone');
 return total;
}
export function yutTravelNodes(piece,steps,shortcut=true){
 const {route,at}=pickRoute(piece,shortcut);
 const track=YUT_ROUTES[route];
 if(steps===-1){
  if(at<1)throw new Error('Invalid backward move');
  return [piece.node,track[at-1]];
 }
 if(steps<1||!Number.isInteger(steps))throw new Error('Invalid move');
 const reached=Math.min(track.length,at+steps+1);
 const nodes=track.slice(at,reached);
 if(nodes[0]!==piece.node)nodes.unshift(piece.node);
 if(at+steps>=track.length)nodes.push(20);
 return nodes;
}
export function usableYutRolls(mine,rolls){
 // Preserve back-do if another unused toss can bring a piece onto the board first.
 const canEnter=rolls.some(value=>value>0&&legalYutMoves(mine,value).length>0);
 return rolls.filter(value=>legalYutMoves(mine,value).length>0||(value===-1&&canEnter));
}
export function moveOwnYutPieces(ours,index,steps,shortcut=true){
 if(!legalYutMoves(ours,steps).some(m=>m.index===index&&m.shortcut===shortcut))
  throw new Error('Invalid Yutnori move');
 const mine=ours.map(p=>({...p})),before=mine[index];
 const moved=mine.flatMap((p,j)=>(j===index||(!p.done&&before.node!==0&&p.node===before.node))?[j]:[]);
 const to=yutDestination(before,steps,shortcut);
 for(const j of moved)mine[j]={...to};
 return {mine,moved,to:to.node,done:to.done,won:mine.every(p=>p.done)};
}
export function applyYutMove(ours,theirs,index,steps,shortcut=true){
 const result=moveOwnYutPieces(ours,index,steps,shortcut);
 const enemy=theirs.map(p=>({...p}));let caught=0;
 if(!result.done&&result.to!==0)for(let j=0;j<enemy.length;j++){
  if(!enemy[j].done&&enemy[j].node===result.to){enemy[j]={node:0,route:'outer',index:0,done:false};caught++;}
 }
 return {...result,enemy,caught,moving:result.moved.length};
}
function stepsRemaining(piece){
 if(piece.done)return 0;
 return YUT_ROUTES[piece.route].length-1-piece.index;
}
function threatened(enemy,node){
 if(node===0||node===20)return false;
 for(const p of enemy){
  if(p.done)continue;
  for(const step of [1,2,3,4,5])for(const m of legalYutMoves([p],step)){
   if(yutDestination(p,step,m.shortcut).node===node)return true;
  }
 }
 return false;
}
export function chooseCatYutMove(mine,enemy,steps,random=Math.random){
 let best=null,top=-Infinity;
 for(const move of legalYutMoves(mine,steps)){
  const result=applyYutMove(mine,enemy,move.index,steps,move.shortcut);
  const p=mine[move.index];
  const progress=stepsRemaining(p)-stepsRemaining(result.mine[move.index]);
  const stack=result.mine.some((q,i)=>i!==move.index&&!q.done&&q.node!==0&&q.node===result.to);
  let score=progress*5+result.caught*70+(result.done?68*result.moving:0)+(stack?10:0)+(result.won?10000:0);
  if(!result.done&&threatened(result.enemy,result.to))score-=15*result.moving;
  score+=random()*1.5;
  if(score>top){top=score;best=move;}
 }
 return best;
}
