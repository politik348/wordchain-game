import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chooseGomokuMove,threatAt} from '../public/gomoku-engine.mjs';
const fresh=()=>Array(225).fill(null);
const stone=(b,x,y,v)=>{b[y*15+x]=v;};
function move(b,timeMs=500){return chooseGomokuMove(b,{timeMs,maxDepth:4});}
test('AI wins immediately instead of playing defensive moves',()=>{
 const b=fresh();for(let x=4;x<=7;x++)stone(b,x,7,'white');
 for(let x=5;x<=7;x++)stone(b,x,9,'black');
 const m=move(b);assert.equal(m.y,7);assert.ok(m.x===3||m.x===8,m);
});
test('AI blocks immediate fifth when it cannot win',()=>{
 const b=fresh();for(let x=4;x<=7;x++)stone(b,x,7,'black');stone(b,8,7,'white');stone(b,5,9,'white');
 const m=move(b);assert.equal(m.x,3);assert.equal(m.y,7);
});
test('AI creates unstoppable two-sided four rather than blocking an irrelevant two',()=>{
 const b=fresh();for(let x=5;x<=7;x++)stone(b,x,7,'white');stone(b,9,8,'black');stone(b,10,8,'black');
 const m=move(b);assert.equal(m.y,7);assert.ok(m.x===4||m.x===8,m);
});
test('AI prioritizes a double-three fork, making two threats simultaneously',()=>{
 const b=fresh();stone(b,6,7,'white');stone(b,8,7,'white');stone(b,7,6,'white');stone(b,7,8,'white');
 stone(b,5,5,'black');stone(b,5,6,'black');
 const m=move(b);assert.equal(m.x,7);assert.equal(m.y,7);
});
test('AI returns a legal move on a crowded board within bounded time',()=>{
 const b=fresh();for(let i=0;i<32;i++){const x=4+i%8,y=4+Math.floor(i/8);stone(b,x,y,i%2?'white':'black');}
 const before=Date.now(),m=move(b,600);
 assert.ok(m.index>=0&&m.index<225);assert.equal(b[m.index],null);assert.ok(Date.now()-before<1600);
});
