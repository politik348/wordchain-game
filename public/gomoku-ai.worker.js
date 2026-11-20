import {chooseGomokuMove} from './gomoku-engine.mjs';
self.onmessage = event => {
 const {id,board,timeMs}=event.data;
 try{self.postMessage({id,...chooseGomokuMove(board,{timeMs,maxDepth:4})});}
 catch(error){self.postMessage({id,error:String(error?.message||error)});}
};
