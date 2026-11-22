import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshYutPieces, applyYutMove, legalYutMoves, yutDestination, yutTravelNodes, yutSelectedSteps} from '../public/yut-solo-engine.mjs';

test('도 → 빽도 → 빽도: HOME 경유 후 말 완주', () => {
 const reserve=freshYutPieces();
 assert.equal(legalYutMoves(reserve,-1).length,0,'대기 중인 말에는 빽도를 쓸 수 없다');
 const doMove=applyYutMove(reserve,freshYutPieces(),0,1);
 assert.equal(doMove.mine[0].node,1);
 assert.deepEqual(yutTravelNodes(doMove.mine[0],-1),[1,20]);
 const first=applyYutMove(doMove.mine,doMove.enemy,0,-1);
 assert.equal(first.mine[0].node,20);
 assert.equal(first.mine[0].backdoHome,true);
 assert.equal(first.mine[0].done,false,'첫 번째 빽도는 완주가 아니라 HOME 도착이다');
 assert.equal(legalYutMoves(first.mine,-1).some(m=>m.index===0),true);
 assert.deepEqual(yutTravelNodes(first.mine[0],-1),[20,20]);
 const second=applyYutMove(first.mine,first.enemy,0,-1);
 assert.equal(second.mine[0].done,true,'두 번째 빽도로 완주해야 한다');
 assert.equal(second.mine[1].done,false,'다른 말은 영향을 받지 않는다');
});

test('도 → 빽도 후 HOME에서 전진해도 완주', () => {
 const entered=applyYutMove(freshYutPieces(),[],0,1);
 const returned=applyYutMove(entered.mine,[],0,-1);
 assert.equal(yutDestination(returned.mine[0],1).done,true);
 assert.equal(applyYutMove(returned.mine,[],0,1).mine[0].done,true);
});

test('정상적인 한 바퀴 후 HOME은 빽도에 의해 19번으로 돌아간다', () => {
 const normalGateway={node:20,route:'outer',index:20,done:false};
 const backward=yutDestination(normalGateway,-1);
 assert.equal(backward.done,false);
 assert.equal(backward.node,19);
 assert.equal(backward.index,19);
 assert.equal(backward.backdoHome,undefined);
});

test('도 자리에서 업힌 말 모두 HOME에 도착하고 두 번째 빽도로 완주', () => {
 const mine=freshYutPieces();
 mine[0]={node:1,route:'outer',index:1,done:false};
 mine[1]={node:1,route:'outer',index:1,done:false};
 const first=applyYutMove(mine,[],0,-1);
 assert.equal(first.mine[0].backdoHome,true);
 assert.equal(first.mine[1].backdoHome,true);
 const second=applyYutMove(first.mine,[],1,-1);
 assert.equal(second.mine[0].done,true);
 assert.equal(second.mine[1].done,true);
});

test('빽도 결과는 합산할 수 없고 한 번씩 별도로 써야 한다', () => {
 assert.equal(yutSelectedSteps([-1,-1],[0]),-1);
 assert.throws(()=>yutSelectedSteps([-1,-1],[0,1]),/Back-do must be used alone/);
});

test('지름길에서 도 자리까지 되돌아온 말도 HOME으로 이동', () => {
 const piece={node:1,route:'left',index:1,done:false};
 const target=yutDestination(piece,-1);
 assert.equal(target.node,20);
 assert.equal(target.backdoHome,true);
});