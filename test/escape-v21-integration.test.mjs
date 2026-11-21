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
 assert.match(html,/<script src="room3d\.js"><\/script>/);
 assert.match(html,/<script src="game\.js"><\/script>/);
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
 assert.match(home,/app\.js\?v=20261121taste1/);
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
