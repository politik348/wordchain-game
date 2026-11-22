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

test('foyer three distinct species share start and finish, with exactly five moves and visible intersections',()=>{
 assert.match(game,/const FOYER_GRID_SIZE=5/);
 assert.match(game,/function foyerDogSvg\(/);
 assert.match(game,/function foyerPawSvg\(/);
 assert.match(game,/function foyerBootSvg\(/);
 const routes=JSON.parse(game.match(/const FOYER_ROUTES=(\{[^;]+\});/)[1]);
 const starts=JSON.parse(game.match(/const FOYER_STARTS=(\{[^;]+\});/)[1]);
 const destination=Number(game.match(/const FOYER_DESTINATION=(\d+)/)[1]);
 const sequence=game.match(/const FOYER_FOOT_SEQUENCE='([UDLR]+)'/)[1];
 const moveFor=(a,b)=>{
  const dr=Math.floor(b/5)-Math.floor(a/5),dc=b%5-a%5;
  return dr===1&&dc===0?'D':dr===-1&&dc===0?'U':dr===0&&dc===1?'R':dr===0&&dc===-1?'L':null;
 };
 const perKind=Object.entries(routes);
 assert.deepEqual(perKind.map(([kind])=>kind),['cat','dog','human']);
 assert.equal(Object.keys(starts).length,1);
 const startsFound=new Set(),codes=new Set(),tileUsage=new Map();
 for(const [kind,path] of perKind){
  assert.equal(path.length,6,kind);
  assert.equal(new Set(path).size,6,'no revisits for '+kind);
  assert.ok(path.every(i=>Number.isInteger(i)&&i>=0&&i<25),kind);
  assert.equal(path.at(-1),destination,kind);
  startsFound.add(path[0]);
  const moves=path.slice(1).map((v,i)=>moveFor(path[i],v));
  assert.ok(moves.every(Boolean),kind+' has broken adjacency');
  const code=moves.join('');
  assert.equal(code.length,5,kind);
  assert.ok(moves.slice(1).filter((d,i)=>d!==moves[i]).length>=3,kind+' is too straight');
  codes.add(code);
  for(const tile of path.slice(1,-1))tileUsage.set(tile,[...(tileUsage.get(tile)||[]),kind]);
  // There must be one non-repeating route along this kind's own prints.
  const visible=new Set(path.slice(1,-1)),found=[];
  function explore(pos,used,curr){
   if(pos===destination){found.push(curr);return;}
   if(curr.length>=5)return;
   for(const delta of [1,-1,5,-5]){
    const target=pos+delta;
    if(target<0||target>=25||!moveFor(pos,target)||used.has(target))continue;
    if(target!==destination&&!visible.has(target))continue;
    explore(target,new Set([...used,target]),curr+moveFor(pos,target));
   }
  }
  explore(path[0],new Set([path[0]]),'');
  assert.deepEqual(found,[code],kind+' trace must be unique');
 }
 assert.equal(startsFound.size,1);
 assert.equal(Number(Object.keys(starts)[0]),[...startsFound][0]);
 assert.equal(codes.size,3);
 assert.equal(sequence,routes.cat.slice(1).map((v,i)=>moveFor(routes.cat[i],v)).join(''));
 const overlaps=[...tileUsage].filter(([,kinds])=>kinds.length>1);
 assert.ok(overlaps.length>=2,'overlapping prints are intentionally present');
 assert.match(game,/type:'mixed',prints/);
 assert.match(game,/foyer-track-mix/);
 assert.match(game,/g\.foyerRouteVersion!==4/);
 assert.match(game,/FOYER_FOOT_SEQUENCE.length/);
 assert.match(game,/g\.footInput\[i\]/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/foyer-track-mix/);
 new Function(game);
});
