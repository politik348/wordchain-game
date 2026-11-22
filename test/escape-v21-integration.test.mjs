import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=file('public/escape/index.html');
const game=file('public/escape/game.js');
const threeD=file('public/escape/room3d.js');
const storybook=file('public/escape/storybook.js');
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

test('foyer has an actual illustrated and clickable cat bed in both renderers',()=>{
 assert.match(game,/id="foyer-catbed-art"/);
 assert.match(game,/<ellipse cx="219" cy="500" rx="110"/);
 assert.match(game,/\{id:'catbed',x:19,y:79,name:'미로의 침대'/);
 assert.match(game,/case 'catbed':return catbedTrack\(\)/);
 assert.match(css,/\.hotspot\[data-object="catbed"\]/);
 assert.match(threeD,/catbed:\[-4\.45,\.33,1\.85\]/);
 assert.match(threeD,/box\(-4\.45,\.14,1\.85,2\.02,\.27,1\.56/);
 assert.match(html,/room3d\.js\?v=20261122minimal8/);
 assert.match(html,/game\.js\?v=[A-Za-z0-9_-]+/);
 new Function(game);
 new Function(threeD);
});

test('foyer lock reveals neither paw graphic nor interpretation rules',()=>{
 const lock=game.slice(game.indexOf('function foot(){'),game.indexOf('function step('));
 assert.ok(lock.length>100);
 assert.doesNotMatch(lock,/foyerPawSvg|foyer-lock-crest|modal-description|puzzle-helper|foyer-foot-progress/);
 assert.doesNotMatch(lock,/발바닥을 본뜬|발끝 쪽에는/);
 assert.match(lock,/Array\.from\(\{length:FOYER_FOOT_SEQUENCE\.length\}/);
 assert.match(lock,/class="direction-pad"/);
 assert.match(lock,/data-action="foot-back"/);
 assert.match(lock,/data-action="foot-reset"/);
 assert.match(game,/function catbedTrack\(\)/);
 assert.match(game,/침대 옆의 낡은 표찰/);
 assert.match(game,/foyerPawSvg\(true,'U',true\)/,'paw illustration belongs to bed inspection');
 assert.match(game,/id="foyer-catbed-art"/,'pet bed has visible 2D art');
 assert.match(threeD,/tall shaped headboard/,'pet bed has visible 3D geometry');
 assert.doesNotMatch(game,/손잡이에 발바닥 모양 문양과 다섯 개의 빈 홈이 있다/);
 new Function(game);
 new Function(threeD);
});


test('integrated foyer image contains Miro bed and retains all game interactions',()=>{
 const img=file('public/escape/foyer-scene-integrated.avif');
 assert.ok(img.length>=20000,'integrated AVIF asset must not be an empty placeholder');
 assert.match(storybook,/foyer:'foyer-scene-integrated\.avif'/);
 assert.match(storybook,/catbed:\[16\.0,79\.2\]/,'bed hotspot is on painted cat bed');
 assert.match(storybook,/foyer:new Set\(\['cat'\]\)/,'only the unpainted Miro body hotspot is hidden');
 assert.doesNotMatch(storybook,/storybook-catbed-art/,'do not paste a second bed over new background');
 assert.doesNotMatch(css,/\.storybook-catbed-art\{/,'no stray old foreground illustration');
 assert.match(storybook,/data-object="catbed"\]\{width:17%!important;height:20%!important/);
 assert.match(html,/storybook\.js\?v=20261122hotspots11/,'asset cache bust');
 assert.match(html,/styles\.css\?v=[A-Za-z0-9_-]+/,'stylesheet has an asset version');
 for(const id of ['invitation','catbed','rug','cabinet','crescent','study','cat','foyer-bell',
    'foyer-main-door','foyer-vase','foyer-chandelier','foyer-sconce','foyer-banner',
    'foyer-window','foyer-wall-plaque','foyer-moon-painting','foyer-cat-banner-emblem',
    'foyer-four-lights','foyer-armillary','foyer-counter-ledger','foyer-counter-pen',
    'foyer-counter-base','foyer-side-table-drawer','foyer-side-table-shelf',
    'foyer-floor-lantern','foyer-right-sconce','foyer-right-portrait',
    'foyer-door-crest','foyer-blue-door-plaque']){
    assert.ok(storybook.includes("'"+id+"':")||storybook.includes(id+":"),'retained target: '+id);
 }
 assert.match(game,/case 'catbed':return catbedTrack\(\)/);
 assert.match(game,/const FOYER_FOOT_SEQUENCE='UULRD'/);
 assert.match(game,/case 'rug':rug\(\)/);
 assert.match(game,/case 'foyer-bell':foyerBell\(\)/);
 assert.match(game,/case 'cabinet':if\(!done\('foot'\)\)foot\(\)/);
 assert.match(game,/function invitation\(\)/);
 assert.match(game,/g\.footInput===FOYER_FOOT_SEQUENCE/);
 assert.match(storybook,/if\(direction==='reset'\)/,'camera reset remains active');
 assert.match(storybook,/if\(direction==='left'\)/);
 assert.match(storybook,/if\(direction==='right'\)/);
 assert.match(storybook,/if\(direction==='in'\)/);
 assert.match(storybook,/if\(direction==='out'\)/);
 assert.match(storybook,/function focusSolvedProp\(id\)/);
 new Function(storybook);
});

test('new integrated foyer image is served through both official and taste routes',()=>{
 const server=file('server.js');
 assert.match(server,/\['\/taste\/escape\/foyer-scene-integrated\.avif','escape\/foyer-scene-integrated\.avif'\]/);
 assert.match(server,/if\(protectedEscape\)await requireEscapeAccess\(req\)/,'official route stays permission protected');
 assert.match(server,/if\(isEscapeTaste&&!tasteFile\)throw err\(404/,'taste preview remains restricted to allowlisted files');
});

test('all 29 foyer hitboxes match the integrated painted scene without bell-book collisions',()=>{
 const start=storybook.indexOf('const foyerArtTargets=Object.freeze({');
 assert.ok(start>=0,'one canonical foyer overlay map must exist');
 const end=storybook.indexOf('});',start);
 assert.ok(end>start);
 const part=storybook.slice(start,end);
 const actual=Object.fromEntries([...part.matchAll(/(?:'([^']+)'|([a-z][\w-]*)):\[([\d.]+),([\d.]+)\]/g)]
   .map(([,quoted,bare,x,y])=>[quoted||bare,[Number(x),Number(y)]]));
 const expected={
   invitation:[18,41],catbed:[16,79.2],rug:[54,87.3],
   cabinet:[81,67],crescent:[34.1,33.1],study:[20.9,54.1],cat:[75.4,22.2],
   'foyer-bell':[83.7,51.8],'foyer-main-door':[55.1,54.2],
   'foyer-vase':[5.4,50.5],'foyer-chandelier':[50.7,8.5],
   'foyer-sconce':[42.1,32.7],'foyer-banner':[76.1,13.7],
   'foyer-window':[8.5,31],'foyer-wall-plaque':[21.6,30.1],
   'foyer-moon-painting':[29.8,44.8],'foyer-cat-banner-emblem':[75.8,23.5],
   'foyer-four-lights':[76,42.5],'foyer-armillary':[94.2,43.8],
   'foyer-counter-ledger':[89.8,50.8],'foyer-counter-pen':[88.3,56],
   'foyer-counter-base':[86.6,70.4],
   'foyer-side-table-drawer':[7.6,64.5],
   'foyer-side-table-shelf':[4.1,77.8],
   'foyer-floor-lantern':[8.9,55.1],
   'foyer-right-sconce':[67.5,32.8],
   'foyer-right-portrait':[97.5,27.7],
   'foyer-door-crest':[54.2,22.7],
   'foyer-blue-door-plaque':[91.7,22.6]
 };
 assert.deepEqual(actual,expected,'all physical inspection anchors should be kept in a single verified map');
 assert.equal(Object.keys(actual).length,29);
 assert.match(storybook,/Object\.assign\(spotPositions\.foyer,foyerArtTargets\)/);
 assert.match(storybook,/foyer:new Set\(\['cat'\]\)/);
 const deskPairs=[['foyer-bell','foyer-counter-ledger'],['foyer-bell','foyer-counter-pen'],
   ['foyer-counter-ledger','foyer-counter-pen']];
 for(const [a,b] of deskPairs){
   const [x,y]=actual[a],[u,v]=actual[b];
   const distancePx=Math.hypot((x-u)*12,(y-v)*6.5);
   assert.ok(distancePx>37,a+' and '+b+' accidentally overlap: '+distancePx);
 }
 assert.match(html,/storybook\.js\?v=20261122hotspots11/);
 assert.match(html,/extra-props\.js\?v=20261122hotspots11/);
 assert.match(html,/game\.js\?v=[A-Za-z0-9_-]+/);
 const props=file('public/escape/extra-props.js');
 for(const absent of ['접수대의 짧은 펜','꽃병 탁자의 작은 서랍','꽃병 탁자의 아래 선반',
  '창가 바닥의 작은 등','오른쪽 벽의 둥근 액자','푸른 문의 황동 명판']){
   assert.ok(!props.includes(absent),'the new scene has no pictured '+absent);
 }
 for(const present of ['접수대 위쪽의 장부','접수대 아래쪽의 책',
   '꽃병 탁자의 금빛 테두리','꽃병 탁자의 조각 다리',
   '꽃병 옆의 작은 등','푸른 문 옆 담쟁이']){
   assert.ok(props.includes(present),'new art hotspot exists '+present);
 }
 assert.match(game,/접수대 위에 황동 종 하나가 놓여 있다/);
 assert.match(game,/액자 속 초대장/);
 assert.match(game,/달빛 그림의 금빛 테두리/);
 assert.match(html,/id="catTalkBtn"/,'Miro dialog remains available despite absent on-picture Miro');
 assert.match(game,/const FOYER_FOOT_SEQUENCE='UULRD'/,'puzzle answer unchanged');
 assert.match(game,/function foyerBell\(\)/,'bell toy preserved');
 assert.match(game,/case 'catbed':return catbedTrack\(\)/,'catbed clue preserved');
 assert.match(storybook,/if\(direction==='left'\)/);
 assert.match(storybook,/if\(direction==='right'\)/);
 assert.match(storybook,/if\(direction==='reset'\)/);
 assert.match(storybook,/if\(direction==='in'\)/);
 assert.match(storybook,/if\(direction==='out'\)/);
 new Function(storybook);
 new Function(props);
 new Function(game);
});

test('puzzle 4 cylinder pegs actually rotate and brass fingers press observed keys',()=>{
 const piano=game.slice(game.indexOf('const rollPegs=[3,0,4,3]'),game.indexOf('// Optional paper-film device'));
 assert.match(piano,/const pianoPegPositions=offset=>rollPegs\.map\(x=>\(x\+offset\)%6\)/);
 assert.match(piano,/const pegPositions=pianoPegPositions\(offset\)/);
 assert.match(piano,/const sequence=pianoPegPositions\(g\.drumOffset\|\|0\)/);
 assert.match(piano,/const candidate=g\.pianoInput\.join\(','\),correct=pianoPegPositions\(4\)\.join\(','\)/);
 const positions=Function('rollPegs','offset','return rollPegs.map(x=>(x+offset)%6)');
 assert.deepEqual(positions([3,0,4,3],4),[1,4,2,1],'original solution stays unchanged');
 assert.deepEqual(positions([3,0,4,3],1),[4,1,5,4],'dial must physically move the teeth');
 assert.match(piano,/roll-frame-marks/,'fixed shaft star stays visible');
 assert.match(piano,/roll-drum-marks/,'engraved cylinder star moves with the dial');
 assert.match(piano,/i===4\?'frame-star'/);
 assert.match(piano,/i===offset\?'drum-star'/);
 assert.match(piano,/data-finger=/);
 assert.match(piano,/data-roll-row=/);
 assert.match(piano,/fingerEls\[key\]\.classList\.add\('is-striking'\)/);
 assert.match(piano,/keys\[key\]\.classList\.add\('mechanically-pressed'\)/);
 assert.match(piano,/rows\[i\]\.classList\.add\('is-striking'\)/);
 assert.match(piano,/stepMs=reduceMotion\?750:560/);
 assert.match(piano,/window\.matchMedia\?\./);
 assert.match(piano,/status\.setAttribute\('aria-label'/);
 assert.match(piano,/g\.drumPlayed=true;save\(\)/);
 assert.match(game,/function hide\(\)\{cancelDrumPlayback\(\)/);
 assert.match(game,/function modal\([^)]*\)\{cancelDrumPlayback\(\)/);
 assert.match(game,/if\(action==='piano-reset'\)\{cancelDrumPlayback\(\)/);
 assert.match(css,/\.piano-keyboard \.piano-keys\{display:grid;grid-template-columns:repeat\(6/);
 assert.match(css,/\.piano-finger\.is-striking \.piano-finger-rod/);
 assert.match(css,/\.piano-keyboard \.piano-key\.mechanically-pressed/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/game\.js\?v=20261122piano12/);
 assert.match(html,/styles\.css\?v=20261122piano12/);
 assert.doesNotMatch(piano,/손잡이를 감으면 황동 손가락이 [^']*건반을 누르세요/);
 new Function(game);
});
