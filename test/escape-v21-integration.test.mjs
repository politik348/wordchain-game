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

test('foyer B reads five paw facing directions, not cat travel directions',()=>{
 assert.match(game,/const FOYER_GRID_SIZE=5/);
 assert.match(game,/function foyerDogSvg\(/);
 assert.match(game,/function foyerPawSvg\(/);
 assert.match(game,/function foyerBootSvg\(/);
 const routes=JSON.parse(game.match(/const FOYER_ROUTES=(\{[^;]+\});/)[1]);
 const starts=JSON.parse(game.match(/const FOYER_STARTS=(\{[^;]+\});/)[1]);
 const facing=JSON.parse(game.match(/const FOYER_CAT_FACING=(\[[^;]+\]);/)[1].replace(/'/g,'"'));
 const dest=Number(game.match(/const FOYER_DESTINATION=(\d+)/)[1]);
 const answer=game.match(/const FOYER_FOOT_SEQUENCE='([UDLR]+)'/)[1];
 const step=(a,b)=>{
  const dr=Math.floor(b/5)-Math.floor(a/5),dc=b%5-a%5;
  return dr===1&&dc===0?'D':dr===-1&&dc===0?'U':dr===0&&dc===1?'R':dr===0&&dc===-1?'L':null;
 };
 assert.equal(routes.cat[0],routes.dog[0]);
 assert.equal(starts[routes.cat[0]],'침대');
 assert.notEqual(routes.human[0],routes.cat[0]);
 assert.equal(starts[routes.human[0]],'문간');
 assert.equal(Object.keys(starts).length,2);
 assert.equal(dest,12);
 const allPaths=[];
 for(const [kind,path] of Object.entries(routes)){
  assert.equal(path.length,6,kind);
  assert.equal(new Set(path).size,6,kind+' repeats a tile');
  assert.equal(path.at(-1),dest,kind);
  const moves=path.slice(1).map((cell,i)=>step(path[i],cell));
  assert.ok(moves.every(Boolean),kind+' has a broken step');
  assert.equal(moves.length,5);
  allPaths.push(moves.join(''));
  // A route of exactly five steps must be unique to that kind's footprint tiles.
  const validTiles=new Set(path.slice(0,-1)),solutions=[];
  function explore(at,visited,code){
   if(at===dest){if(code.length===5)solutions.push(code);return;}
   if(code.length>=5)return;
   for(const diff of [-5,5,-1,1]){
    const next=at+diff;if(next<0||next>=25||!step(at,next)||visited.has(next))continue;
    if(next!==dest&&!validTiles.has(next))continue;
    explore(next,new Set([...visited,next]),code+step(at,next));
   }
  }
  explore(path[0],new Set([path[0]]),'');
  assert.deepEqual(solutions,[moves.join('')],kind+' exact five-step track is not unique');
 }
 assert.equal(new Set(allPaths).size,3);
 assert.equal(facing.length,5);
 assert.ok(facing.every(dir=>'UDLR'.includes(dir)));
 assert.equal(answer,facing.join(''));
 assert.notEqual(answer,allPaths[0],'B must differ from real cat travel');
 assert.ok([...answer].filter((dir,i)=>dir!==allPaths[0][i]).length>=2);
 assert.match(game,/FOYER_ROUTES\.cat\.slice\(0,-1\)/);
 assert.match(game,/foyerRouteMarks\(FOYER_ROUTES\.dog\)/);
 assert.match(game,/if\(Object\.hasOwn\(FOYER_STARTS,i\)\)return \{type:'anchor',text:FOYER_STARTS\[i\],prints\}/);
 assert.match(game,/foyer-anchor-prints/);
 assert.match(game,/미로의 발자국을 따라 종까지/);
 assert.match(game,/FOYER_FOOT_SEQUENCE.length/);
 assert.match(game,/g\.foyerRouteVersion!==5/);
 assert.match(game,/g\.footInput===FOYER_FOOT_SEQUENCE/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/foyer-lock-crest/);
 new Function(game);
});

test('foyer clue discovery does not narrate footprint route solution',()=>{
 assert.doesNotMatch(game,/침대에서 종까지 이어지는 동물 발자국 두 종류가 보인다/);
 assert.doesNotMatch(game,/고양이와 개 발자국은 침대 부근에서 시작해 각각 종까지 이어진다/);
 assert.doesNotMatch(game,/타일을 눌러 겹친 자국을 확대해 볼 수 있다/);
 assert.match(game,/미로의 발자국을 따라 종까지 와 줘/);
 assert.match(game,/function invitation\(\)/);
 assert.match(game,/발신인 없는 초대장/);
 assert.match(game,/타일을 눌러 자세히 관찰할 수 있다/);
 new Function(game);
});
