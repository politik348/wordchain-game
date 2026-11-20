/**
 * Small self-contained freestyle Gomoku search engine.
 * Empty = 0, human/black = -1, AI/white = 1.
 * No opening book, no downloaded weights, no third party code.
 */
const N=15, SIZE=N*N;
const DIRS=[[1,0],[0,1],[1,1],[1,-1]];
const WIN=1000000000;
const xy=idx=>[idx%N,Math.floor(idx/N)];
const inside=(x,y)=>x>=0&&x<N&&y>=0&&y<N;
const toIdx=(x,y)=>y*N+x;

export function isFive(board,index,side){
 const [x,y]=xy(index);
 for(const [dx,dy] of DIRS){
  let n=1;
  for(const s of [-1,1])for(let d=1;d<5;d++){
   const xx=x+dx*d*s,yy=y+dy*d*s;
   if(!inside(xx,yy)||board[toIdx(xx,yy)]!==side)break;
   n++;
  }
  if(n>=5)return true;
 }
 return false;
}

/** Score the tactical threat created by playing side at a currently empty point. */
export function threatAt(board,index,side){
 if(board[index]!==0)return -WIN;
 board[index]=side;
 if(isFive(board,index,side)){
  board[index]=0;
  return WIN;
 }
 const [x,y]=xy(index);
 const wins=new Set();let openThrees=0,splitThrees=0,twos=0;
 for(const [dx,dy] of DIRS){
  const cells=[];
  let line='';
  for(let k=-5;k<=5;k++){
   const xx=x+dx*k,yy=y+dy*k;
   if(!inside(xx,yy)){line+='2';cells.push(-1);continue;}
   const at=toIdx(xx,yy);cells.push(at);
   line+=board[at]===side?'1':board[at]===0?'0':'2';
  }
  // Every length-5 window through the newly placed stone contains a
  // unique winning completion when it has exactly four stones and one gap.
  for(let start=1;start<=5;start++){
   let count=0,blank=-1,blocked=false;
   for(let j=start;j<start+5;j++){
    const cell=cells[j];
    if(cell<0||board[cell]===-side){blocked=true;break;}
    if(board[cell]===side)count++;else blank=cell;
   }
   if(!blocked&&count===4&&blank>=0)wins.add(blank);
  }
  // Open three and jump three are distinct productive attacking shapes.
  if(/0011100|001110|011100|00110100|00101100/.test(line))openThrees++;
  else if(/011010|010110|0011010|0101100|0010110|0110100/.test(line))splitThrees++;
  if(/001100|0010100|0011000|0001100|00100100/.test(line))twos++;
 }
 board[index]=0;
 const four=wins.size;
 // Multiple distinct five-making points cannot be parried in one turn.
 if(four>=2)return 48000000+four*100000;
 if(four===1&&openThrees>0)return 19000000+openThrees*50000;
 if(four===1)return 1450000+splitThrees*45000;
 if(openThrees>=2)return 14500000+openThrees*110000;
 if(openThrees===1&&splitThrees>=1)return 350000+splitThrees*4000;
 if(openThrees===1)return 115000+twos*1800;
 if(splitThrees>=2)return 220000;
 if(splitThrees===1)return 34000+twos*1000;
 if(twos>=2)return 12000;
 if(twos===1)return 4800;
 return 180;
}

function movesNear(board){
 const flags=new Uint8Array(SIZE);let occupied=0;
 for(let i=0;i<SIZE;i++){
  if(!board[i])continue;
  occupied++;
  const [x,y]=xy(i);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=x+dx, yy=y+dy;
   if(inside(xx,yy))flags[toIdx(xx,yy)]=1;
  }
 }
 if(!occupied)return [112];
 const output=[];
 for(let i=0;i<SIZE;i++)if(!board[i]&&flags[i])output.push(i);
 return output;
}

function sortedMoves(board,side,limit=12){
 const nearby=movesNear(board);
 const out=[];
 let ownWin=false,opponentWin=false;
 for(const i of nearby){
  const attack=threatAt(board,i,side);
  const defend=threatAt(board,i,-side);
  if(attack>=WIN)ownWin=true;
  if(defend>=WIN)opponentWin=true;
  const [x,y]=xy(i);
  const central=14-(Math.abs(x-7)+Math.abs(y-7));
  out.push({index:i,attack,defend,rank:attack*1.12+defend*.96+central});
 }
 // A win now outranks all defense. Otherwise, prevent an immediate loss.
 if(ownWin)return out.filter(m=>m.attack>=WIN).sort((a,b)=>b.rank-a.rank);
 if(opponentWin)return out.filter(m=>m.defend>=WIN).sort((a,b)=>b.attack-a.attack);
 out.sort((a,b)=>b.rank-a.rank);
 return out.slice(0,limit);
}

function evaluate(board,side){
 const candidates=movesNear(board);
 let bestUs=0,secondUs=0,bestThem=0,secondThem=0;
 for(const i of candidates){
  const a=threatAt(board,i,side),b=threatAt(board,i,-side);
  if(a>bestUs){secondUs=bestUs;bestUs=a;}else if(a>secondUs)secondUs=a;
  if(b>bestThem){secondThem=bestThem;bestThem=b;}else if(b>secondThem)secondThem=b;
 }
 if(bestUs>=WIN)return WIN-10;
 if(bestThem>=WIN)return -WIN+10;
 // Give the side to move initiative for realistic continuous attacks.
 return bestUs*1.09+secondUs*.23-bestThem*1.05-secondThem*.22;
}

class SearchTimeout extends Error{}
/** Choose best move in a worker. All evaluations are synchronous within worker. */
export function chooseGomokuMove(rawBoard,{timeMs=1750,maxDepth=4}={}){
 const board=Int8Array.from(rawBoard,cell=>cell==='white'||cell===1?1:cell==='black'||cell===-1?-1:0);
 if(board.length!==SIZE)throw new Error('Expected 15x15 Gomoku board');
 const started=Date.now(), deadline=started+timeMs;
 let nodes=0,depthReached=0;
 const rootMoves=sortedMoves(board,1,18);
 if(!rootMoves.length)return {index:-1,x:-1,y:-1,nodes,depth:0,elapsedMs:0,reason:'full'};
 if(rootMoves[0].attack>=WIN)return result(rootMoves[0].index,'즉시 승리',0);
 if(rootMoves.some(m=>m.defend>=WIN))return result(rootMoves[0].index,'상대의 5목 차단',0);
 if(rootMoves[0].attack>=48000000)return result(rootMoves[0].index,'열린 4목·양방향 위협',0);

 function result(index,reason,depth=depthReached){const [x,y]=xy(index);return {index,x,y,depth,nodes,reason,elapsedMs:Date.now()-started};}
 function negamax(side,depth,alpha,beta,last,ply){
  nodes++;
  if((nodes&63)===0&&Date.now()>deadline)throw new SearchTimeout();
  if(last>=0&&isFive(board,last,-side))return -WIN+ply*1000;
  if(depth===0)return evaluate(board,side);
  const list=sortedMoves(board,side,depth>2?9:7);
  if(!list.length)return 0;
  if(list[0].attack>=WIN)return WIN-ply*1000;
  let best=-Infinity;
  for(const move of list){
   board[move.index]=side;
   const v=-negamax(-side,depth-1,-beta,-alpha,move.index,ply+1);
   board[move.index]=0;
   if(v>best)best=v;
   if(best>alpha)alpha=best;
   if(alpha>=beta)break;
  }
  return best;
 }
 let bestMove=rootMoves[0].index;
 for(let depth=1;depth<=maxDepth;depth++){
  if(Date.now()>deadline)break;
  let top=-Infinity,current=bestMove,completed=false;
  // Prefer the best principal variation from the previous iteration.
  const ordered=[...rootMoves].sort((a,b)=>(a.index===bestMove?-1:0)-(b.index===bestMove?-1:0));
  try{
   let alpha=-WIN*2;
   for(const m of ordered){
    if(Date.now()>deadline)throw new SearchTimeout();
    board[m.index]=1;
    const score=isFive(board,m.index,1)?WIN:-negamax(-1,depth-1,-WIN*2,-alpha,m.index,1);
    board[m.index]=0;
    if(score>top){top=score;current=m.index;}
    if(top>alpha)alpha=top;
   }
   completed=true;
  }catch(e){
   board.fill(0); // On timeout: board is no longer read, prior best remains valid.
   if(!(e instanceof SearchTimeout))throw e;
  }
  if(!completed)break;
  bestMove=current;depthReached=depth;
  if(top>=WIN-100000)break;
 }
 return result(bestMove,depthReached>=3?'알파–베타 탐색':'위협·공격 패턴 평가');
}
