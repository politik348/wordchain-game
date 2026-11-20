// Shared, deterministic rules for the local "Beat the Cat" Yutnori mode.
// The route and stack/capture rules mirror the multiplayer implementation.
export const YUT_ROUTES = {
  outer: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
  left: [0,1,2,3,4,5,21,22,23,24,25,15,16,17,18,19,20],
  right: [0,1,2,3,4,5,6,7,8,9,10,26,27,23,24,25,15,16,17,18,19,20]
};
export const YUT_NAMES = {1:'도',2:'개',3:'걸',4:'윷',5:'모','-1':'빽도'};
const FAIR_ROLLS = [1,1,1,2,2,2,3,3,3,4,4,5,-1];
// Small edge (~0.15 more squares per throw on average); never a guaranteed win.
const CAT_ROLLS = [1,1,2,2,2,3,3,3,3,4,4,5,-1];

export function freshYutPieces() {
  return Array.from({length:4},()=>({node:0,route:'outer',index:0,done:false}));
}
export function rollYut(random=Math.random,cat=false) {
  const pool=cat?CAT_ROLLS:FAIR_ROLLS;
  return pool[Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)))];
}
export function legalYutMoves(mine,steps) {
  if(!Number.isInteger(steps)||![-1,1,2,3,4,5].includes(steps))return [];
  const moves=[];
  mine.forEach((p,index)=>{
    if(p.done||(steps===-1&&p.node===0))return;
    for(const shortcut of (p.route==='outer'&&(p.node===5||p.node===10)?[true,false]:[true])) {
      const route=shortcut&&p.route==='outer'&&p.node===5?'left'
        :shortcut&&p.route==='outer'&&p.node===10?'right':p.route;
      const at=(route!==p.route)?YUT_ROUTES[route].indexOf(p.node):p.index;
      if(at+steps>=0)moves.push({index,shortcut});
    }
  });
  return moves;
}
export function applyYutMove(ours,theirs,index,steps,shortcut=true) {
  const legal=legalYutMoves(ours,steps).some(m=>m.index===index&&m.shortcut===shortcut);
  if(!legal)throw new Error('Invalid Yutnori move');
  const mine=ours.map(p=>({...p})),enemy=theirs.map(p=>({...p}));
  const p=mine[index];
  let route=p.route,at=p.index;
  if(shortcut&&route==='outer'&&p.node===5){route='left';at=5;}
  if(shortcut&&route==='outer'&&p.node===10){route='right';at=10;}
  const destination=at+steps;
  const done=destination>=YUT_ROUTES[route].length;
  const to=done?20:YUT_ROUTES[route][destination];
  const moving=mine.map((q,j)=>j).filter(j=>j===index||(!q.done&&p.node!==0&&q.node===p.node));
  for(const j of moving)mine[j]={node:to,route,index:destination,done};
  let caught=0;
  if(!done&&to!==0)for(let j=0;j<enemy.length;j++){
    if(!enemy[j].done&&enemy[j].node===to){
      enemy[j]={node:0,route:'outer',index:0,done:false};caught++;
    }
  }
  return {mine,enemy,to,done,caught,moving:moving.length,won:mine.every(q=>q.done)};
}
function distanceLeft(p){
  if(p.done)return 0;
  return YUT_ROUTES[p.route].length-1-p.index;
}
function enemyCanCatch(enemy,node){
  if(node===0||node===20)return false;
  for(const p of enemy){
    if(p.done)continue;
    const choices=legalYutMoves([p],1);
    if(!choices.length)continue;
    for(const step of [1,2,3,4,5]){
      for(const choice of legalYutMoves([p],step)){
        const route=choice.shortcut&&p.route==='outer'&&p.node===5?'left'
          :choice.shortcut&&p.route==='outer'&&p.node===10?'right':p.route;
        const at=route!==p.route?YUT_ROUTES[route].indexOf(p.node):p.index;
        if(YUT_ROUTES[route][at+step]===node)return true;
      }
    }
  }
  return false;
}
export function chooseCatYutMove(mine,enemy,steps,random=Math.random) {
  const moves=legalYutMoves(mine,steps);
  let best=null,top=-Infinity;
  for(const move of moves){
    const result=applyYutMove(mine,enemy,move.index,steps,move.shortcut);
    const movingFrom=mine[move.index];
    const progress=distanceLeft(movingFrom)-distanceLeft(result.mine[move.index]);
    const stack=result.mine.some((p,i)=>i!==move.index&&!p.done&&p.node!==0&&p.node===result.to);
    let score=progress*5+result.caught*70+(result.done?68*result.moving:0)
      +(stack?10:0)+(result.won?10000:0);
    // Avoid leaving valuable stacked pieces exposed to a probable capture.
    if(!result.done&&enemyCanCatch(result.enemy,result.to))score-=15*result.moving;
    // Very small nondeterminism prevents the AI from playing the same opening.
    score+=random()*1.5;
    if(score>top){top=score;best=move;}
  }
  return best;
}
