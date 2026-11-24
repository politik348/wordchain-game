import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../public/kof97/'+p,import.meta.url),'utf8');
const html=read('index.html'),w={};
const context=vm.createContext({window:w});
vm.runInContext(read('orochi-combat.js'),context);
vm.runInContext(read('orochi-group.js'),context);
const C=w.KOFOrochiCombat,A=w.KOFOrochiGroup;
const roster=JSON.parse(html.match(/window\.MOYEO_FIGHTERS=(\[[\s\S]*?\]);/)[1]);
const code=html.slice(html.indexOf('const attacks='),html.indexOf('function endRound()'));
const env=new Function('window','D',`const FLOOR=451,W=960,systems=['advanced','advanced'],mode='local';let shots=[],sparks=[],shake=0;const audio=()=>{};${code};return {begin,updateF,damage,shots};`)(w,roster);
const fighter=(key,i,x)=>({d:roster[key],i,x,y:451,face:i?-1:1,hp:roster[key].hp,meter:200,vx:0,vy:0,attack:null,stun:0,inv:0,guard:false,crouch:false,moving:false,charge:0,combo:0,comboTime:0,evade:0,maxTime:0});
for(const k of [30,31,32,33,34,35])for(const intent of ['special','alt','super'])test(k+' '+intent+' engine',()=>{
 const m=C.get({key:k},intent),f=fighter(k,0,300),o=fighter(0,1,360);if(k===33&&intent==='special')o.x=400;
 env.shots.length=0;env.begin(f,m.key,intent);assert.equal(f.attack?.orochi,m);
 const initial=o.hp;
 for(let i=0;i<m.frame[2]+1;i++){env.updateF(f,o,{});env.updateF(o,f,{});for(const s of env.shots){if(!s.life)continue;s.x+=s.v;s.life--;if(C.projectileHit(s,o)){env.damage(o,f,s.a,true);s.life=0}}}
 assert.equal(f.attack,null);assert.ok(o.hp<initial);
});
test('projectile invulnerability and vertical clash',()=>{const f=fighter(34,0,300),o=fighter(0,1,350),s={x:350,y:350,a:{orochi:C.get(f.d,'special')}};o.inv=5;assert.equal(C.projectileHit(s,o),false);o.inv=0;assert.equal(C.projectileHit(s,o),true);assert.equal(C.projectileClash(s,{x:350,y:60,a:{}}),false);assert.equal(C.projectileClash(s,{x:350,y:350,a:{}}),true)});
test('attack phase monotonic',()=>{for(let k=30;k<=35;k++)for(const intent of ['special','alt','super']){const m=C.get({key:k},intent);const [start,end,total]=m.frame;let last=-1;for(let t=0;t<=total;t++){const v=A.attackProgress({t,start,end,total,orochi:m});assert.ok(v>=last&&v>=0&&v<=1);last=v}assert.equal(last,1)}});
test('held guard against custom multihit',()=>{const f=fighter(30,0,300),o=fighter(0,1,350);env.begin(f,'dash','alt');const init=o.hp;for(let i=0;i<41;i++){env.updateF(o,f,{guard:true});env.updateF(f,o,{})}assert.equal(o.hp,init)});
