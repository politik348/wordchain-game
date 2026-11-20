import {renderYutBoard,renderYutThrow,renderYutRouteChooser} from './yut-board.mjs?v=20261120yut2';
// The solo and online modes use the same clickable SVG board + wooden throw UI.
export function renderSoloYut(s,helpers={}){
 const {timeBar=()=>'',esc=String,rolling=false,selected=null}=helpers;
 const canThrow=s.turn==='player'&&!s.finished&&s.pending===null;
 const canMove=s.turn==='player'&&!s.finished&&s.pending!==null;
 const top=`<div class="game-topline"><span class="stage-badge">🐱 나 vs 고양이 · 윷놀이</span>${s.turn==='player'&&!s.finished?timeBar(s.deadline,s.timeSeconds):''}<span class="time-badge">${esc(s.rollName||'윷놀이')}</span></div>`;
 const score=`<div class="cat-yut-players"><span>🔴 나: ${s.pieces.player.filter(p=>p.done).length}/4 완주</span><span>🔵 고양이: ${s.pieces.ai.filter(p=>p.done).length}/4 완주</span></div>`;
 const message=`<div class="game-prompt"><strong>${esc(s.msg||'윷을 던져보세요.')}</strong></div>`;
 const throwHtml=renderYutThrow({roll:s.pending??s.lastRoll??null,rolling,actor:canThrow?'당신 차례입니다':canMove?'말을 눌러 이동하세요':s.turn==='ai'?'고양이 차례입니다':'대국 종료',showAction:canThrow,action:'soloYutRoll',disabled:rolling});
 const board=renderYutBoard({pieces:s.pieces,me:'player',turn:s.turn,pending:s.pending,active:!s.finished,action:'soloYutPick',routeAction:'soloYutRoute',selected:canMove?selected:null,lastMove:s.lastMove,labels:{player:'나',ai:'고양이'}});
 const routes=canMove?renderYutRouteChooser(s.pieces.player,s.pending,selected,'soloYutRoute'):'';
 const help=`<p class="game-note">① 윷을 던지고 ② 말판의 빨간 말을 누르세요. 대기 중인 말은 아래에서 누릅니다. 갈림길에서는 지름길 또는 바깥길을 선택하세요.</p>`;
 const history=`<div class="cat-yut-history">${(s.history||[]).slice(-5).reverse().map(h=>`<div>${esc(h)}</div>`).join('')}</div>`;
 return top+score+message+throwHtml+board+routes+help+history;
}
