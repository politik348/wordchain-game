import test from 'node:test';
import assert from 'node:assert/strict';
import {freshYutPieces,rollYut,legalYutMoves,applyYutMove,chooseCatYutMove,YUT_ROUTES} from '../public/yut-solo-engine.mjs';
import {renderSoloYut} from '../public/yut-solo-ui.mjs';

test('Cat mode has 4 fresh pieces and no legal back-do at start',()=>{
  const pieces=freshYutPieces();
  assert.equal(pieces.length,4);
  assert.deepEqual(legalYutMoves(pieces,-1),[]);
  assert.equal(legalYutMoves(pieces,1).length,4);
});

test('Cat has only a slight throw distribution advantage',()=>{
  const fair=Array.from({length:13},(_,i)=>rollYut(()=>(i+.1)/13,false));
  const cat=Array.from({length:13},(_,i)=>rollYut(()=>(i+.1)/13,true));
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  assert.ok(mean(cat)>mean(fair));
  assert.ok(mean(cat)-mean(fair)<0.25);
  assert.ok(cat.includes(-1));
});

test('Shortcut from corner 5 moves to left branch at 21',()=>{
  const mine=freshYutPieces();
  mine[0]={node:5,route:'outer',index:5,done:false};
  const choices=legalYutMoves(mine,1).filter(m=>m.index===0);
  assert.equal(choices.length,2);
  const faster=applyYutMove(mine,freshYutPieces(),0,1,true);
  const outer=applyYutMove(mine,freshYutPieces(),0,1,false);
  assert.equal(faster.mine[0].node,21);
  assert.equal(outer.mine[0].node,6);
  assert.equal(YUT_ROUTES.left[6],21);
});

test('Yutnori stacked friendly pieces move together and capture opponents',()=>{
  const mine=freshYutPieces(),enemy=freshYutPieces();
  mine[0]={node:3,route:'outer',index:3,done:false};
  mine[1]={node:3,route:'outer',index:3,done:false};
  enemy[0]={node:4,route:'outer',index:4,done:false};
  const result=applyYutMove(mine,enemy,0,1);
  assert.equal(result.moving,2);
  assert.equal(result.mine[0].node,4);
  assert.equal(result.mine[1].node,4);
  assert.equal(result.enemy[0].node,0);
  assert.equal(result.caught,1);
});

test('AI selects an immediate capture instead of an empty forward step',()=>{
  const mine=freshYutPieces(),enemy=freshYutPieces();
  mine[0]={node:3,route:'outer',index:3,done:false};
  mine[1]={node:1,route:'outer',index:1,done:false};
  enemy[0]={node:4,route:'outer',index:4,done:false};
  const choice=chooseCatYutMove(mine,enemy,1,()=>0);
  assert.equal(choice.index,0);
});

test('A piece completes once it crosses the route end; four finishes win',()=>{
  const mine=freshYutPieces();
  mine.forEach((p,i)=>mine[i]={node:19,route:'outer',index:19,done:false});
  const result=applyYutMove(mine,freshYutPieces(),0,2);
  assert.equal(result.mine[0].done,true);
  assert.equal(result.won,false);
});

test('Solo Yut UI renders the board, the throw button and both players',()=>{
  const now=Date.now();
  const s={pieces:{player:freshYutPieces(),ai:freshYutPieces()},turn:'player',pending:null,rollName:null,finished:false,deadline:now+30000,timeSeconds:30,msg:'시작!',history:[]};
  const html=renderSoloYut(s,{coords:{0:[0,0],1:[1,1]},line:()=>'',btn:(action,label)=>'<button data-action="'+action+'">'+label+'</button>',timeBar:()=>'',esc:String});
  assert.match(html,/고양이/);
  assert.match(html,/soloYutRoll/);
  assert.match(html,/svg/);
});
