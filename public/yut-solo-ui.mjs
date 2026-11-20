import {renderYutBoard,renderYutThrow,renderYutRouteChooser,renderYutRollTray,renderYutPieceStats} from './yut-board.mjs?v=20261120yut3';
// Solo cat mode uses the same Yut board, toss queue and path confirmation as multiplayer.
export function renderSoloYut(s,helpers={}){
 const {timeBar=()=>' ',esc=String,rolling=false,selected=null,chosen=[0],steps=null}=helpers;
 const canThrow=s.turn==='player'&&!s.finished&&s.phase==='throw';
 const canMove=s.turn==='player'&&!s.finished&&s.phase==='move'&&Number.isInteger(steps);
 const top=`<div class="game-topline"><span class="stage-badge">🐱 나 vs 고양이 · 윷놀이</span>${s.turn==='player'&&!s.finished?timeBar(s.deadline,s.timeSeconds):''}<span class="time-badge">${esc(s.rollName||'윷놀이')}</span></div>`;
 const score=renderYutPieceStats(s.pieces,{player:'나',ai:'고양이'},'player');
 const message=`<div class="game-prompt"><strong>${esc(s.msg||'윷을 던져보세요.')}</strong></div>`;
 const throwHtml=renderYutThrow({roll:s.lastRoll??null,rolling,actor:canThrow?'🎲 윷을 던질 차례예요':canMove?'말을 선택해 이동하세요':s.turn==='ai'?'고양이가 플레이 중':'대국 종료',showAction:canThrow,action:'soloYutRoll',disabled:rolling});
 const tray=renderYutRollTray({rolls:s.rolls||[],phase:s.phase,chosen,action:'soloYutRollChoice',myTurn:s.turn==='player'&&!s.finished});
 const board=renderYutBoard({pieces:s.pieces,me:'player',turn:s.turn,steps:canMove?steps:null,active:!s.finished,action:'soloYutPick',routeAction:'soloYutRoute',selected:canMove?selected:null,lastMove:s.lastMove,labels:{player:'나',ai:'고양이'}});
 const routes=canMove?renderYutRouteChooser(s.pieces.player,steps,selected,'soloYutRoute'):'';
 const history=`<div class="cat-yut-history">${(s.history||[]).slice(-6).reverse().map(h=>`<div>${esc(h)}</div>`).join('')}</div>`;
 const help='<p class="game-note">윷/모는 추가로 모두 던진 다음 이동합니다. 나온 결과를 여러 개 선택하면 합쳐서 움직일 수도 있어요. 말을 누르면 경로가 먼저 보이고, 확정 버튼을 누를 때 이동합니다.</p>';
 return top+score+message+`<div class="yut-play-layout"><div class="yut-board-column">${board}${routes}${help}</div><aside class="yut-control-column">${throwHtml}${tray}<h4>최근 진행</h4>${history}</aside></div>`;
}
