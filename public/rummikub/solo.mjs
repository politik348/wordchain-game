import {newGame,submitTurn,drawTurn,tick,publicView} from './engine.mjs';
import {chooseCatMove} from './ai.mjs';
export function createSoloRummikub(seconds=60,difficulty='beginner') {
 const ids=['player','cat'];
 const state=newGame(ids,{turnSeconds:seconds});
 state.turnIndex=0;state.turn='player';state.deadline=Date.now()+seconds*1000;
 return {game:'rummikub',ids,engine:state,aiDifficulty:['beginner','intermediate','advanced'].includes(difficulty)?difficulty:'beginner',finished:false,pending:false};
}
export function soloRoom(solo){
 const s=solo.engine;
 const view=publicView(s,'player',solo.ids);
 const label=message=>String(message??'').replace(/player/g,'나').replace(/cat/g,'고양이');
 view.lastMove=label(view.lastMove);if(view.result)view.result=label(view.result);view.history=view.history.map(label);
 return {id:'SOLO',game:'rummikub',status:s.result?'finished':'playing',
   players:[{id:'player',nick:'나'},{id:'cat',nick:'고양이'}],
   options:{turnSeconds:s.turnSeconds},state:view};
}
export function soloPlayRummikub(solo,action,payload={}) {
 const s=solo.engine;
 if(action==='rkSubmit')submitTurn(s,solo.ids,'player',payload.groups);
 else if(action==='rkDraw')drawTurn(s,solo.ids,'player');
 else throw new Error('지원하지 않는 행동입니다.');
 solo.finished=Boolean(s.result);
}
export function soloTickRummikub(solo){
 const s=solo.engine;
 if(s.turn==='player'&&tick(s,solo.ids))solo.finished=Boolean(s.result);
}
export function catPlayRummikub(solo) {
 const s=solo.engine;
 if(s.result||s.turn!=='cat')return false;
 let move=chooseCatMove(s,'cat',{difficulty:solo.aiDifficulty||'beginner'});
 if(move) {
   try {submitTurn(s,solo.ids,'cat',move.groups);}
   catch(e){console.warn('고양이 조합 복구',e);move=null;}
 }
 if(!move)drawTurn(s,solo.ids,'cat');
 solo.finished=Boolean(s.result);
 return true;
}
