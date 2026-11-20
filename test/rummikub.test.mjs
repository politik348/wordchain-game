import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDeck,tileFromId,meldInfo,newGame,submitTurn,drawTurn,tick,publicView,rackPoints} from '../public/rummikub/engine.mjs';
import {chooseCatMove} from '../public/rummikub/ai.mjs';
const t=(c,n,x=0)=>`t-${c}-${n}-${x}`;
const players=['a','b'];
const rng=()=>0.25;
function mk(){return newGame(players,{turnSeconds:60,rng,now:10000});}
function stateWith(hA,hB,table=[],opened={a:false,b:false}){const s=mk();s.hands.a=[...hA];s.hands.b=[...hB];s.table=table.map(g=>[...g]);s.opened=opened;s.turn='a';s.turnIndex=0;s.deadline=90000;return s;}

test('106 physical tiles, two duplicates each, two jokers',()=>{
 const deck=makeDeck();assert.equal(deck.length,106);assert.equal(new Set(deck).size,106);
 assert.equal(deck.filter(id=>tileFromId(id).joker).length,2);
});
test('sets: groups, runs, ordered runs, joker values, no wraparound',()=>{
 assert.equal(meldInfo([t(0,7),t(1,7),t(2,7)]).score,21);
 assert.equal(meldInfo([t(0,7),t(1,7),t(0,7,1)]).valid,false);
 assert.equal(meldInfo([t(1,11),t(1,12),t(1,13)]).score,36);
 assert.equal(meldInfo([t(1,12),t(1,13),t(1,1)]).valid,false);
 assert.equal(meldInfo([t(2,5),'j-0',t(2,7)]).valid,true);
 assert.equal(meldInfo([t(2,5),'j-0',t(2,7)]).score,18);
 assert.equal(meldInfo([t(2,5),t(2,7),'j-0']).valid,false);
 assert.equal(meldInfo([t(0,9),t(1,9),'j-0']).score,27);
 assert.equal(meldInfo([t(0,11),t(0,12),t(0,13),'j-0']).valid,false);
 assert.equal(meldInfo([t(0,1),t(0,2),t(0,3),'j-0']).valid,true);
});
test('new game deals 14 each; private hand not leaked',()=>{
 const s=mk();assert.equal(s.hands.a.length,14);assert.equal(s.hands.b.length,14);assert.equal(s.bag.length,78);
 const a=publicView(s,'a',players);assert.equal(a.hand.length,14);assert.ok(!Object.hasOwn(a,'bag'));assert.ok(!Object.hasOwn(a,'hands'));
 assert.ok(!JSON.stringify(a).includes('"b":['));
});
test('opening must use only own tile melds totaling 30 or more',()=>{
 const h=[t(0,9),t(0,10),t(0,11),t(2,1),t(1,1),t(3,1)];const s=stateWith(h,[]);
 assert.throws(()=>submitTurn(s,players,'a',[[t(2,1),t(1,1),t(3,1)]],{now:20000}),/30점/);
 assert.equal(s.hands.a.length,6);
 submitTurn(s,players,'a',[[t(0,9),t(0,10),t(0,11)]],{now:20000});
 assert.equal(s.opened.a,true);assert.equal(s.hands.a.length,3);assert.equal(s.turn,'b');
});
test('initial meld cannot use previous table, even if score >30',()=>{
 const base=[t(0,9),t(1,9),t(2,9)];const extra=[t(3,9),t(0,10),t(0,11),t(0,12)];
 const s=stateWith(extra,[],[base]);
 assert.throws(()=>submitTurn(s,players,'a',[[...base,t(3,9)],[t(0,10),t(0,11),t(0,12)]],{now:20000}),/기존 테이블/);
});
test('atomic table manipulation: all original tiles must remain, no foreign tiles, no duplicates',()=>{
 const old=[t(0,5),t(0,6),t(0,7),t(0,8)];
 const hand=[t(0,9),t(1,5),t(2,5)];
 const s=stateWith(hand,[],[old],{a:true,b:false});
 assert.throws(()=>submitTurn(s,players,'a',[[t(0,5),t(0,6),t(0,7)]],{now:20000}),/기존 타일/);
 assert.throws(()=>submitTurn(s,players,'a',[[...old],[t(1,5),t(2,5),t(3,5)]],{now:20000}),/갖고 있지 않은/);
 assert.throws(()=>submitTurn(s,players,'a',[[...old],[t(0,9),t(0,9),t(0,9)]],{now:20000}),/조합/);
 submitTurn(s,players,'a',[[t(0,6),t(0,7),t(0,8),t(0,9)],[t(0,5),t(1,5),t(2,5)]],{now:20000});
 assert.equal(s.hands.a.length,0);assert.equal(s.winner,'a');assert.equal(Math.abs(s.scores.b),0);
});
test('draw ends turn and cannot immediately play tile',()=>{
 const s=mk();const count=s.hands.a.length;drawTurn(s,players,'a',{now:20000});
 assert.equal(s.hands.a.length,count+1);assert.equal(s.turn,'b');
});
test('expired move is rejected; timeout draws one',()=>{
 const s=mk();assert.throws(()=>submitTurn(s,players,s.turn,[],{now:90000}),/시간/);
 assert.equal(tick(s,players,{now:90000}),true);assert.equal(s.turnNumber,2);
});
test('cat AI finds valid opening from its own hand',()=>{
 const s=stateWith([], [t(0,9),t(0,10),t(0,11),t(1,7),t(2,7),t(3,7)]);
 const choice=chooseCatMove(s,'b');assert.ok(choice);assert.ok(choice.used>=3);
 const clone=structuredClone(s);clone.turn='b';clone.turnIndex=1;
 submitTurn(clone,players,'b',choice.groups,{now:20000});assert.equal(clone.opened.b,true);
});
test('cat AI can extend an existing run after opening',()=>{
 const original=[t(0,3),t(0,4),t(0,5)];
 const s=stateWith([], [t(0,6),t(2,9)], [original],{a:true,b:true});
 const move=chooseCatMove(s,'b');assert.ok(move);assert.ok(move.groups.some(g=>g.includes(t(0,6))));
});
test('jokers left in hand cost 30 points',()=>assert.equal(rackPoints(['j-0',t(0,4)]),34));
