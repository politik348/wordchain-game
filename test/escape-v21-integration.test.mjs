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

test('foyer provides three different winding cat dog and human routes to the same bell',()=>{
 assert.match(game,/const FOYER_GRID_SIZE=9/);
 assert.match(game,/function foyerDogSvg\(/);
 assert.match(game,/function foyerPawSvg\(/);
 assert.match(game,/function foyerBootSvg\(/);
 const routes=JSON.parse(game.match(/const FOYER_ROUTES=(\{[^;]+\});/)[1]);
 const starts=JSON.parse(game.match(/const FOYER_STARTS=(\{[^;]+\});/)[1]);
 const sequence=game.match(/const FOYER_FOOT_SEQUENCE='([UDLR]+)'/)[1];
 const destination=40;
 const toMoves=(path)=>path.slice(1).map((cell,i)=>{
  const before=path[i],dr=Math.floor(cell/9)-Math.floor(before/9),dc=cell%9-before%9;
  if(dr===1&&dc===0)return 'D';
  if(dr===-1&&dc===0)return 'U';
  if(dr===0&&dc===1)return 'R';
  if(dr===0&&dc===-1)return 'L';
  throw Error('Not an orthogonal path');
 }).join('');
 const allTiles=new Set();
 const values=Object.values(routes);
 assert.equal(values.length,3);
 const originIds=new Set(values.map(path=>path[0]));
 assert.equal(originIds.size,3);
 assert.deepEqual(Object.keys(starts).map(Number).sort((a,b)=>a-b),[...originIds].sort((a,b)=>a-b));
 for(const [species,path] of Object.entries(routes)){
  assert.equal(path.length,14,species);
  assert.equal(path.at(-1),destination,species);
  assert.equal(new Set(path).size,path.length,'no revisits '+species);
  const moves=toMoves(path);
  assert.equal(moves.length,13,species);
  const turns=[...moves].slice(1).filter((d,i)=>d!==moves[i]).length;
  assert.ok(turns>=7,species+' has fewer than seven turns');
  for(const tile of path.slice(0,-1)){
   assert.ok(!allTiles.has(tile),'overlap before destination '+tile);
   allTiles.add(tile);
  }
  const trail=new Set(path.slice(1,-1)), seenRoutes=[];
  function search(pos,visited,moves){
   if(moves.length>13)return;
   if(pos===destination){
    seenRoutes.push(moves);return;
   }
   for(const [dr,dc,dir] of [[0,1,'R'],[0,-1,'L'],[1,0,'D'],[-1,0,'U']]){
    const r=Math.floor(pos/9)+dr,c=pos%9+dc;
    if(r<0||r>=9||c<0||c>=9)continue;
    const next=9*r+c;
    if(next!==destination&&!trail.has(next))continue;
    if(visited.has(next))continue;
    search(next,new Set([...visited,next]),moves+dir);
   }
  }
  search(path[0],new Set([path[0]]),'');
  assert.deepEqual(seenRoutes,[moves],'species-specific route uniqueness '+species);
 }
 assert.equal(sequence,toMoves(routes.cat));
 assert.ok(toMoves(routes.cat)!==toMoves(routes.dog));
 assert.ok(toMoves(routes.dog)!==toMoves(routes.human));
 assert.match(game,/FOYER_FOOT_SEQUENCE.length/);
 assert.match(game,/data-action="foot-back"/);
 assert.match(game,/data-action="rug-tile-/);
 assert.match(css,/grid-template-columns:repeat\(9,minmax\(0,1fr\)\)/);
 assert.match(css,/foyer-dog-claws/);
 new Function(game);
});
