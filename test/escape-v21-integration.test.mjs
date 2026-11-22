import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=file('public/escape/index.html');
const game=file('public/escape/game.js');
const threeD=file('public/escape/room3d.js');
const css=file('public/escape/styles.css');

test('EP01 v2.1 has its own save keys, ten puzzle hint trees and three endings',()=>{
 assert.match(game,/moyeo\.escape\.ep01\.save\.v21/);
 assert.match(game,/moyeo\.escape\.ep01\.endings\.v21/);
 for(const room of ['foyer','study','greenhouse','tower'])assert.ok(game.includes(room));
 for(const puzzle of ['foot','mirror','books','piano','film','water','light','blackout','clock','pin']){
  assert.match(game,new RegExp('\\b'+puzzle+':\\['));
 }
 assert.ok(game.includes('window.Moyeo3D'));
 assert.match(html,/13번째 종소리/);
 assert.match(html,/<script src="room3d\.js(?:\?[^\"]*)?"><\/script>/);
 assert.match(html,/<script src="game\.js(?:\?[^\"]*)?"><\/script>/);
 new Function(game);
});

test('3D renderer provides WebGL, canvas fallback and camera controls',()=>{
 assert.match(threeD,/getContext\('webgl'/);
 assert.match(threeD,/getContext\('2d'/);
 assert.match(threeD,/window\.Moyeo3D=/);
 assert.match(threeD,/pointermove/);
 assert.match(threeD,/fallback-2d/);
 assert.match(css,/scene-3d/);
 new Function(threeD);
});

test('owner revalidation remains in v2.1 game page; unprotected standalone is absent',()=>{
 assert.match(html,/api\/escape\/access/);
 assert.match(html,/setInterval\(verifyAccess,15000\)/);
 assert.match(html,/escape-access\/index\.html/);
 assert.ok(!existsSync(new URL('../public/escape/moyeo-escape-room-3d-v2.1-standalone.html',import.meta.url)));
 assert.ok(!existsSync(new URL('../public/moyeo-escape-room-3d-v2.1-standalone.html',import.meta.url)));
 assert.ok(!existsSync(new URL('../public/escape/PUZZLE_GUIDE.md',import.meta.url)));
});

test('home gallery advertises the upgraded puzzle count and owner gate',()=>{
 const app=file('public/app.js'),home=file('public/index.html');
 assert.match(app,/id:'escape',name:'모여 방탈출'/);
 assert.match(app,/퍼즐 10종/);
 assert.match(app,/escape-access\/index\.html/);
 assert.match(home,/app\.js\?v=[a-zA-Z0-9_-]+/);
});

test('unauthenticated HTTP cannot request 3D renderer directly',async()=>{
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='test';
 const {server}=await import('../server.js');
 const {once}=await import('node:events');
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const url='http://127.0.0.1:'+server.address().port;
  const blocked=await fetch(url+'/escape/room3d.js');
  assert.equal(blocked.status,401);
  const response=await blocked.json();
  assert.match(response.error,/로그인/);
  assert.equal((await fetch(url+'/moyeo-escape-room-3d-v2.1-standalone.html')).status,404);
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;
 }
});

test('EP01 story chapters reveal broad goals without giving away mechanics',()=>{
 for(const title of ['멈춰 버린 시간','지워진 기록','잊어버린 약속','마지막 종소리'])assert.ok(game.includes(title),title);
 for(const goal of ['저택 안쪽으로 들어갈 방법을 찾자.','저택에 무슨 일이 있었는지 알아낼 기록을 찾자.','온실에 남은 흔적을 조사하고 시계탑으로 향하자.','멈춘 시계를 복구하고 저택에서 일어난 일을 밝혀내자.'])assert.ok(game.includes(goal),goal);
 assert.match(game,/roomIntroSeen/);
 assert.match(game,/function showRoomIntro\(id\)/);
 assert.match(game,/journal-rooms/);
 assert.match(game,/기억을 모아 루나의 봉인을 푼다/);
 assert.match(game,/const endings=\{/);
 assert.ok(!game.includes('루나의 무릎 위에서 듣던 자장가'));
 new Function(game);
});

test('foyer has two distinct six-step footprint routes converging on the bell',()=>{
 assert.match(game,/const FOYER_FOOT_SEQUENCE='RDDRRD'/);
 const cat=JSON.parse(game.match(/const FOYER_CAT_PRINTS=(\{[^;]+\});/)[1]);
 const boots=JSON.parse(game.match(/const FOYER_BOOT_PRINTS=(\{[^;]+\});/)[1]);
 function routes(tiles){
  const result=[];
  function visit(i,steps){
   if(steps.length===6){if(i===18)result.push(steps);return;}
   for(const [dr,dc,step] of [[0,1,'R'],[1,0,'D'],[0,-1,'L'],[-1,0,'U']]){
    const row=Math.floor(i/5)+dr,col=(i%5)+dc;
    if(row<0||row>4||col<0||col>4)continue;
    const next=row*5+col;
    if(next===18||tiles.has(next))visit(next,steps+step);
   }
  }
  visit(0,'');return result;
 }
 assert.deepEqual(routes(new Set(Object.keys(cat).map(Number))),['RDDRRD']);
 assert.deepEqual(routes(new Set(Object.keys(boots).map(Number))),['DDDRRR']);
 assert.equal(Object.keys(cat).length,5);
 assert.equal(Object.keys(boots).length,5);
 assert.deepEqual(Object.keys(cat).filter(i=>Object.hasOwn(boots,i)),[]);
 assert.doesNotMatch(game,/FOYER_OTHER_PRINTS/);
 assert.match(game,/function foyerTrailDetail\(i\)/);
 assert.match(game,/data-action="rug-tile-/);
 assert.match(game,/function catbedTrack\(\)/);
 assert.match(game,/g\.footInput\.length===6/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 new Function(game);
});
