import {chooseGomokuMove} from './gomoku-engine.mjs';
self.onmessage = event => {
 const {id,board,difficulty}=event.data;
 const profiles={
  beginner:{maxDepth:4,timeMs:1600},
  intermediate:{maxDepth:5,timeMs:3400},
  advanced:{maxDepth:6,timeMs:6500}
 };
 const profile=profiles[difficulty]||profiles.beginner;
 try{self.postMessage({id,...chooseGomokuMove(board,profile)});}
 catch(error){self.postMessage({id,error:String(error?.message||error)});}
};
