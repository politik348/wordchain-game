import {randomInt} from 'node:crypto';
import {newGame,publicView,submitTurn,drawTurn,tick} from '../public/rummikub/engine.mjs';
const secureRandom=()=>randomInt(0x1000000)/0x1000000;
export function startRummikub(room){
  room.state=newGame(room.players.map(p=>p.id),{turnSeconds:room.options.turnSeconds,rng:secureRandom});
}
export function labelRummikub(room,message=''){
 let text=String(message);
 for(const p of room.players)text=text.split(p.id).join(p.nick);
 return text;
}
export function sanitizeRummikub(room,sid){
 const view=publicView(room.state,sid,room.players.map(p=>p.id));
 view.lastMove=labelRummikub(room,view.lastMove);
 if(view.result)view.result=labelRummikub(room,view.result);
 view.history=view.history.map(message=>labelRummikub(room,message));
 return view;
}
export function actRummikub(room,sid,type,payload={}){
  const ids=room.players.map(p=>p.id);
  if(type==='rkSubmit')submitTurn(room.state,ids,sid,payload.groups);
  else if(type==='rkDraw')drawTurn(room.state,ids,sid);
  else {const e=new Error('루미큐브에서는 지원하지 않는 행동입니다.');e.status=400;throw e;}
}
export function tickRummikub(room){return tick(room.state,room.players.map(p=>p.id));}
