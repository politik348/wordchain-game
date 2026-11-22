import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/tetris/index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Tetris inline engine must be present');
const slice=(from,to)=>{
 const a=script.indexOf(from),b=script.indexOf(to,a);
 assert.ok(a>=0&&b>a,`missing code section: ${from}`);
 return script.slice(a,b);
};
const rot=slice('const rot=','function newPiece(');
const fits=slice('function fits(','function move(');
const planner=slice('function evaluate(','function aiStep(){');
const makePlanner=new Function('catStrength','Math',`const W=10,H=20;${rot}${fits}${planner}return planAI;`);

test('Tetris game script remains parseable',()=>{
 assert.doesNotThrow(()=>new Function(script));
});
test('cat AI has distinct slower response intervals across difficulties',()=>{
 assert.match(script,/catStrength==='beginner'\?190:catStrength==='intermediate'\?145:105/);
 assert.doesNotMatch(script,/catStrength==='beginner'\?145:catStrength==='intermediate'\?110:80/);
});
test('AI still proposes legal moves at all tiers',()=>{
 const board=Array.from({length:20},()=>Array(10).fill(-1));
 const pieces=[[[1,1,1],[0,1,0]],[[1,1],[1,1]],[[1,1,1,1]]];
 for(const strength of ['beginner','intermediate','advanced']){
  for(const shape of pieces){
   let i=0;
   const seeded=Object.create(Math);
   seeded.random=()=>[0,.7,.25,.9][i++%4];
   const g={board,piece:{m:shape,x:3,y:0,id:2}};
   const p=makePlanner(strength,seeded)(g);
   assert.ok(p&&Number.isInteger(p.x)&&Number.isInteger(p.d));
   assert.ok(p.d>=0&&p.d<4);
   assert.ok(p.x>=-2&&p.x<12);
  }
 }
});
test('lower tiers have more imperfect decision-making than advanced',()=>{
 assert.match(planner,/catStrength==='beginner'\?\.25:catStrength==='intermediate'\?\.11:\.025/);
 assert.match(planner,/catStrength==='beginner'\?3\.5:catStrength==='intermediate'\?1\.7:\.8/);
});
