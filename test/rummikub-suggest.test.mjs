import test from 'node:test';
import assert from 'node:assert/strict';
import {findRackMelds, bestRackMelds, easyExtensions, recommendMove} from '../public/rummikub/suggest.mjs';
import {meldInfo} from '../public/rummikub/engine.mjs';
const t=(c,n,i=0)=>`t-${c}-${n}-${i}`;
test('one click recommendation makes a valid 33 point initial run',()=>{
 const hand=[t(0,10),t(0,11),t(0,12),t(1,4)];
 const move=recommendMove(hand,[],false);
 assert.ok(move);assert.deepEqual(move.used,[t(0,10),t(0,11),t(0,12)]);
 assert.equal(move.score,33);assert.ok(move.groups.every(g=>meldInfo(g).valid));
});
test('initial recommendation reaches 30 using more than one meld',()=>{
 const hand=[t(0,3),t(1,3),t(2,3),t(1,6),t(1,7),t(1,8)];
 const move=recommendMove(hand,[],false);
 assert.ok(move);assert.equal(move.used.length,6);assert.ok(move.score>=30);
});
test('cannot recommend an illegal or under-30 first move',()=>{
 assert.equal(recommendMove([t(0,1),t(0,2),t(0,3)],[],false),null);
 assert.equal(recommendMove([t(0,9),t(1,5)],[],false),null);
});
test('recommender preserves existing table when initial registration is pending',()=>{
 const previous=[[t(0,1),t(0,2),t(0,3)]];
 const move=recommendMove([t(1,10),t(1,11),t(1,12)],previous,false);
 assert.deepEqual(move.groups[0],previous[0]);assert.equal(move.groups.length,2);
});
test('only disjoint physically owned tiles are used in recommendations',()=>{
 const hand=[t(0,7),t(1,7),t(2,7),t(0,8),t(0,9),t(0,10), 'j-0'];
 const solution=bestRackMelds(hand,{minScore:30});
 assert.ok(solution);const all=solution.groups.flat();
 assert.equal(all.length,new Set(all).size);
 assert.ok(all.every(id=>hand.includes(id)));
 assert.ok(solution.groups.every(g=>meldInfo(g).valid));
});
test('a joker can fill the middle of a run',()=>{
 const found=findRackMelds([t(1,5),t(1,7),'j-0']);
 assert.ok(found.some(c=>c.tiles.join(',')===[t(1,5),'j-0',t(1,7)].join(',')));
});
test('a tile adds onto existing table after opening',()=>{
 const old=[[t(2,5),t(2,6),t(2,7)]];
 const ext=easyExtensions(old,[t(2,8),t(0,2)]);
 assert.deepEqual(ext.groups[0],[...old[0],t(2,8)]);
 const move=recommendMove([t(2,8),t(0,2)],old,true);
 assert.ok(move);assert.deepEqual(move.used,[t(2,8)]);
});
test('all emitted melds are valid for a joker-heavy rack',()=>{
 const rack=[t(0,9),t(1,9),t(2,9),'j-0','j-1',t(0,10),t(0,11)];
 const melds=findRackMelds(rack);
 assert.ok(melds.length>0);
 assert.ok(melds.every(x=>meldInfo(x.tiles).valid));
});