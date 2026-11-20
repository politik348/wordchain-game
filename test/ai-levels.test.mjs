import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {renderPregame} from '../public/pregame-lobbies.mjs';
import {freshYutPieces,legalYutMoves,chooseCatYutMove} from '../public/yut-solo-engine.mjs';
import {createSoloRummikub} from '../public/rummikub/solo.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('three selectable Cat AI levels appear under opponent card, not in online rooms',()=>{
 const game={id:'omok',name:'오목',rules:[['규칙','설명']]};
 for(const level of ['beginner','intermediate','advanced']){
  const html=renderPregame({game,allowedModes:['cat','online'],mode:'cat',aiDifficulty:level});
  assert.match(html,/<div class="pg-modes">[\s\S]*?<\/div>\+?/); // opponent selection present
  assert.match(html,/pg-ai-difficulty/);
  assert.equal((html.match(/data-pg-difficulty=/g)||[]).length,3);
  assert.match(html,new RegExp('data-pg-difficulty="'+level+'" aria-pressed="true"'));
  assert.match(html,/초급/);assert.match(html,/중급/);assert.match(html,/고급/);
 }
 const online=renderPregame({game,allowedModes:['cat','online'],mode:'online'});
 assert.doesNotMatch(online,/data-pg-difficulty/);
});

test('Gomoku worker profiles request increasing actual search depth and thinking budgets',()=>{
 const source=read('public/gomoku-ai.worker.js').replace(/^import .*\n/gm,'');
 let onmessage=null;
 const profiles=[];
 const self={postMessage:message=>profiles.push(message)};
 const chooseGomokuMove=(board,opts)=>({...opts,x:7,y:7});
 runInNewContext(source,{self,chooseGomokuMove});
 for(const difficulty of ['beginner','intermediate','advanced'])self.onmessage({data:{id:difficulty,board:[],difficulty}});
 assert.deepEqual(profiles.map(x=>x.maxDepth),[4,5,6]);
 assert.deepEqual(profiles.map(x=>x.timeMs),[1600,3400,6500]);
});

test('Yut difficulty uses stronger position evaluation without changing available legal moves',()=>{
 const mine=freshYutPieces(),enemy=freshYutPieces();
 for(const difficulty of ['beginner','intermediate','advanced']){
  const move=chooseCatYutMove(mine,enemy,3,()=>0.5,{difficulty});
  assert.ok(move);
  assert.ok(legalYutMoves(mine,3).some(v=>v.index===move.index&&v.shortcut===move.shortcut));
 }
 const source=read('public/yut-solo-engine.mjs');
 assert.match(source,/result\.caught\*125/);
 assert.match(source,/if\(inDanger\)score-=75\*result\.moving/);
});

test('Rummikub solo tracks selected tier for use in Cat beam search',()=>{
 for(const difficulty of ['beginner','intermediate','advanced']){
  const solo=createSoloRummikub(60,difficulty);
  assert.equal(solo.aiDifficulty,difficulty);
 }
 const ai=read('public/rummikub/ai.mjs'),solo=read('public/rummikub/solo.mjs');
 assert.match(ai,/advanced:\{ownLimit:760,beamWidth:240,maxGroups:8,extensions:240,pairLimit:60\}/);
 assert.match(solo,/chooseCatMove\(s,'cat',\{difficulty:solo\.aiDifficulty/);
});

test('Word Chain and Tetris use selected AI tier in actual computer decisions',()=>{
 const app=read('public/app.js'),tetris=read('public/tetris/index.html'),standalone=read('public/standalone-pregame.mjs');
 assert.match(app,/function chooseCatWord\(possible,difficulty/);
 assert.match(app,/chooseCatWord\(possible,solo\.aiDifficulty\)/);
 assert.match(app,/worker\.postMessage\(\{id:solo\.moves,board:solo\.board,difficulty:solo\.aiDifficulty/);
 assert.match(tetris,/catStrength==='advanced'/);
 assert.match(tetris,/catStrength==='intermediate'/);
 assert.match(standalone,/data\.pgDifficulty/);
 assert.match(standalone,/aiDifficulty:values\.aiDifficulty/);
});

test('difficulty choice persists per Cat game and cannot be used in online-only modes',()=>{
 const app=read('public/app.js');
 assert.match(app,/moyeo-pregame-settings-v1/);
 assert.match(app,/catGamesSupported=new Set/);
 assert.match(app,/gamePrefs\[selection\]\.aiDifficulty=difficulty/);
 assert.match(app,/persistPregamePrefs\(\);render\(\)/);
 assert.match(app,/view==='catSetup'\|\|pregameModes\[selection\]==='cat'/);
});
