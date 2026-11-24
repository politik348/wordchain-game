import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../public/kof97/orochi-combat.js',import.meta.url),'utf8'),context);
const C=context.KOFOrochiCombat;
const fighter=(key,x=300,y=450,face=1)=>({d:{key},x,y,face,hp:900,inv:0,crouch:false});
const attack=(key,intent,t)=>({orochi:C.get({key},intent),t,hitWindows:[]});
test('exactly six characters, three valid independent moves each',()=>{
 for(let key=0;key<36;key++)for(const intent of ['special','alt','super']){
  const m=C.get({key},intent);
  if(key<30){assert.equal(m,null);continue}
  assert.ok(m);
  const [s,e,total,damage,range]=m.frame;
  assert.ok(0<s&&s<=e&&e<total&&damage>0&&range>0);
  for(const [a,b,x,y,w,h] of m.boxes)assert.ok(s<=a&&a<=b&&b<=e&&w>0&&h>0);
  assert.ok(m.projectile||m.boxes.length);
 }
});
test('Iori combo respects per-window hit limits and active range',()=>{
 const f=fighter(30),o=fighter(1,365),a=attack(30,'alt',6);
 assert.equal(C.hit(f,o,a,450),false);a.t=7;assert.equal(C.hit(f,o,a,450),true);a.t=8;assert.equal(C.hit(f,o,a,450),false);a.t=15;assert.equal(C.hit(f,o,a,450),true);
 a.t=23;o.x=600;assert.equal(C.hit(f,o,a,450),false);
});
test('mirror facing and crouch hit regions',()=>{
 const f=fighter(31,400,450,-1),o=fighter(0,340),a=attack(31,'special',5);
 assert.equal(C.hit(f,o,a,450),true);const b=attack(31,'special',5);o.x=520;assert.equal(C.hit(f,o,b,450),false);
});
test('Yashiro grounded grab rejects jumping, invulnerable and repeat targets',()=>{
 const f=fighter(32),o=fighter(0,350,415),a=attack(32,'special',8);
 assert.equal(C.hit(f,o,a,450),false);o.y=450;o.inv=1;assert.equal(C.hit(f,o,a,450),false);o.inv=0;assert.equal(C.hit(f,o,a,450),true);a.t=9;assert.equal(C.hit(f,o,a,450),false);
});
test('Shermie lightning can hit twice and cannot hit outside its area',()=>{
 const f=fighter(33),o=fighter(0,420),a=attack(33,'special',11);
 assert.equal(C.hit(f,o,a,450),true);a.t=12;assert.equal(C.hit(f,o,a,450),false);a.t=20;assert.equal(C.hit(f,o,a,450),true);o.x=750;assert.equal(C.hit(f,o,attack(33,'special',11),450),false);
});
test('Chris projectile uses its own collision bounds; other fighters retain fallback',()=>{
 const o=fighter(0,400),s={x:385,y:370,a:attack(34,'special',9)};
 assert.equal(C.projectileHit(s,o),true);s.y=180;assert.equal(C.projectileHit(s,o),false);assert.equal(C.projectileHit({a:{}},o),null);
});
test('Orochi super hits within two wide windows, not the entire stage',()=>{
 const f=fighter(35,400),o=fighter(0,650),a=attack(35,'super',20);
 assert.equal(C.hit(f,o,a,450),true);a.t=22;assert.equal(C.hit(f,o,a,450),false);a.t=34;assert.equal(C.hit(f,o,a,450),true);o.x=900;assert.equal(C.hit(f,o,attack(35,'super',20),450),false);
});
