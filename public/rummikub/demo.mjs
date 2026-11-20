import {configureRummikubUI,renderRummikubGame} from './ui.mjs';
import {createSoloRummikub,soloRoom,soloPlayRummikub,soloTickRummikub,catPlayRummikub} from './solo.mjs';
const root=document.getElementById('app'),zone=document.getElementById('toast');
let solo=createSoloRummikub(90);
function render(){root.innerHTML=renderRummikubGame(soloRoom(solo),'player');}
function toast(msg){const e=document.createElement('div');e.className='toast';e.textContent=msg;zone.append(e);setTimeout(()=>e.remove(),3000);}
function catTurn(){const game=solo;if(game.pending||game.finished||game.engine.turn!=='cat')return;
 game.pending=true;setTimeout(()=>{if(game!==solo)return;try{catPlayRummikub(game);}catch(e){toast(e.message);console.error(e);}finally{game.pending=false;render();}},480);
}
configureRummikubUI({getContext:()=>({r:soloRoom(solo),sid:'player'}),refresh:render,toast,
 sendAction:async(action,payload)=>{try{soloPlayRummikub(solo,action,payload);render();catTurn();return true;}catch(e){toast(e.message);return false;}}
});
document.getElementById('reset').onclick=()=>{solo=createSoloRummikub(90);render();};
setInterval(()=>{if(!solo.finished && solo.engine.turn==='player'&&Date.now()>solo.engine.deadline){soloTickRummikub(solo);render();catTurn();}
 document.querySelectorAll('[data-deadline]').forEach(e=>{e.textContent=`${Math.max(0,Math.ceil((+e.dataset.deadline-Date.now())/1000))}초`;});
},250);
render();
