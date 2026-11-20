import test from 'node:test';
import assert from 'node:assert/strict';
import {YUT_ROUTES, freshYutPieces, legalYutMoves, applyYutMove, moveOwnYutPieces, yutDestination, chooseCatYutMove} from '../public/yut-solo-engine.mjs';
import {YUT_COORDS,renderYutBoard,renderYutThrow,renderYutRouteChooser,throwFaces} from '../public/yut-board.mjs';
import {renderSoloYut} from '../public/yut-solo-ui.mjs';
const placed=(node,route,index)=>({node,route,index,done:false});

test('all routes include a sensible home gateway',()=>{
 assert.deepEqual(YUT_ROUTES.right.slice(-4),[23,28,29,20]);
 assert.deepEqual(YUT_ROUTES.home,[23,28,29,20]);
 assert.deepEqual(YUT_COORDS[28],[318,318]);assert.deepEqual(YUT_COORDS[29],[408,408]);
});
test('top left shortcut reaches center then home instead of bottom left',()=>{
 const mine=freshYutPieces();mine[0]=placed(10,'outer',10);
 let result=applyYutMove(mine,[],0,3,true);
 assert.equal(result.mine[0].node,23);
 assert.equal(result.mine[0].route,'right');
 result=applyYutMove(result.mine,[],0,1,true);
 assert.equal(result.mine[0].node,28);
 result=applyYutMove(result.mine,[],0,2,true);
 assert.equal(result.mine[0].node,20);
 result=applyYutMove(result.mine,[],0,1,true);
 assert.equal(result.mine[0].done,true);
});
test('top right route can switch from center directly to home',()=>{
 const mine=freshYutPieces();mine[0]=placed(23,'left',8);
 assert.deepEqual(legalYutMoves(mine,1).filter(m=>m.index===0).map(x=>x.shortcut),[true,false]);
 const home=applyYutMove(mine,[],0,1,true),bottomLeft=applyYutMove(mine,[],0,1,false);
 assert.equal(home.mine[0].node,28);assert.equal(home.mine[0].route,'home');
 assert.equal(bottomLeft.mine[0].node,24);assert.equal(bottomLeft.mine[0].route,'left');
});
test('passing through the center does not silently turn into the home branch',()=>{
 const mine=freshYutPieces();mine[0]=placed(22,'left',7);
 const result=applyYutMove(mine,[],0,2,true);
 assert.equal(result.mine[0].node,24);assert.equal(result.mine[0].route,'left');
});
test('a piece may choose outer side instead of shortcut at each corner',()=>{
 const p=freshYutPieces();p[0]=placed(5,'outer',5);
 assert.equal(applyYutMove(p,[],0,1,true).to,21);
 assert.equal(applyYutMove(p,[],0,1,false).to,6);
 p[0]=placed(10,'outer',10);
 assert.equal(applyYutMove(p,[],0,1,true).to,26);
 assert.equal(applyYutMove(p,[],0,1,false).to,11);
});
test('unstarted pieces cannot move backward',()=>assert.deepEqual(legalYutMoves(freshYutPieces(),-1),[]));
test('stacking and capturing applies when taking the new center-home road',()=>{
 const mine=freshYutPieces(),enemy=freshYutPieces();
 mine[0]=mine[1]=placed(23,'left',8);enemy[0]=placed(28,'home',1);
 const result=applyYutMove(mine,enemy,0,1,true);
 assert.equal(result.mine[0].node,28);assert.equal(result.mine[1].node,28);
 assert.equal(result.moving,2);assert.equal(result.caught,1);assert.equal(result.enemy[0].node,0);
});
test('last step from home gateway completes each piece without early win',()=>{
 const mine=freshYutPieces();mine[0]=placed(20,'home',3);
 const result=moveOwnYutPieces(mine,0,1);
 assert.equal(result.done,true);assert.equal(result.won,false);
});
test('AI values the short exit from the center',()=>{
 const mine=freshYutPieces(),enemy=freshYutPieces();mine[0]=placed(23,'left',8);
 const choice=chooseCatYutMove(mine,enemy,1,()=>0);
 assert.deepEqual(choice,{index:0,shortcut:true});
});
test('board HTML contains missing diagonal and clickable reserve + occupied pieces',()=>{
 const p=freshYutPieces();p[0]=placed(23,'left',8);
 const html=renderYutBoard({pieces:{player:p,ai:freshYutPieces()},me:'player',turn:'player',pending:1,action:'soloYutPick',selected:0});
 assert.match(html,/L318 318/);assert.match(html,/L408 408/);
 assert.match(html,/data-action="soloYutPick" data-index="0"/);
 assert.match(html,/yut-target/);assert.match(html,/내 말 4개/);
 assert.match(html,/data-action="soloYutPick" data-index="1"/);
});
test('four-stick throw visual gives correct roll badge and backdo',()=>{
 const html=renderYutThrow({roll:-1,showAction:true,action:'roll'});
 assert.match(html,/빽도/);assert.match(html,/yut-wood flat backdo/);
 assert.equal((html.match(/class="yut-wood/g)||[]).length,4);
 assert.deepEqual(throwFaces(5),[0,0,0,0]);
 assert.deepEqual(throwFaces(4),[1,1,1,1]);
});
test('solo mode still renders throw button and both teams',()=>{
 const s={pieces:{player:freshYutPieces(),ai:freshYutPieces()},turn:'player',pending:null,finished:false,history:[],msg:'준비!'};
 const html=renderSoloYut(s);
 assert.match(html,/soloYutRoll/);assert.match(html,/고양이/);assert.match(html,/yut-liveboard/);
});
test('selected branch has two explicit route choices',()=>{
 const mine=freshYutPieces();mine[0]=placed(23,'left',8);
 const html=renderYutRouteChooser(mine,1,0,'yutRoute');
 assert.match(html,/지름길로 가기/);assert.match(html,/바깥길로 가기/);
 assert.match(html,/data-shortcut="0"/);assert.match(html,/data-shortcut="1"/);
});
