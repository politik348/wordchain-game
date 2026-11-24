import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {once} from 'node:events';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const gamehell=read('public/gamehell/gamehell.js');
const hub=read('public/cat-hub.mjs');
const app=read('public/app.js');
const serverSource=read('server.js');

test('the Cat hub keeps eight actual cat battles and adds two separate taste cards',async()=>{
 const {CAT_CHALLENGE_GAMES,renderCatHub}=await import('../public/cat-hub.mjs');
 assert.deepEqual(CAT_CHALLENGE_GAMES,['omok','yut','rummikub','marble','tetris','wordchain','fortress','fighter']);
 const games=CAT_CHALLENGE_GAMES.map(id=>({id,name:id,emoji:'🐱',desc:'대전'}));
 const markup=renderCatHub(games);
 assert.equal((markup.match(/data-action="catChoose"/g)||[]).length,8);
 assert.equal((markup.match(/data-action="catTasteEscape"/g)||[]).length,1);
 assert.equal((markup.match(/data-action="catTasteArcade"/g)||[]).length,1);
 assert.match(markup,/맛보기 놀이터/);
 assert.match(markup,/13번째 종소리/);
 assert.match(markup,/3종 미니게임/);
 assert.match(app,/if\(action==='catTasteEscape'\)\{location\.href='\/taste\/escape\/index\.html'/);
 assert.match(app,/if\(action==='catTasteArcade'\)\{location\.href='\/gamehell\/index\.html\?trial=1'/);
 assert.match(read('public/index.html'),/app\.js\?v=[A-Za-z0-9_-]+/);
});

test('arcade trial exposes only three modes and isolates all local state',()=>{
 assert.match(gamehell,/new URLSearchParams\(location\.search\)\.get\('trial'\)==='1'/);
 assert.match(gamehell,/TRIAL_MODE_IDS=new Set\(\['drill','hurdle','chain'\]\)/);
 assert.match(gamehell,/\.filter\(m=>!arcadeTrial\|\|TRIAL_MODE_IDS\.has\(m\.id\)\)/);
 assert.match(gamehell,/arcadeTrial\?'moyeo-gamehell-trial-v1':'moyeo-gamehell-v1'/);
 assert.match(gamehell,/if\(Number\(button\.dataset\.duration\)!==45\)/);
 assert.match(gamehell,/\['#shopHeaderBtn','#openShopBtn','\.wardrobe','\.achievements'\]/);
 const section=gamehell.split('const modes=[')[1]?.split('].filter(m=>!arcadeTrial')[0];
 assert.equal((section?.match(/\{id:'[a-z]+',title:/g)||[]).length,13);
 const pg=read('public/standalone-pregame.mjs');
 assert.match(pg,/game==='gamehell'&&new URLSearchParams\(location\.search\)\.get\('trial'\)==='1'/);
 assert.match(read('public/gamehell/index.html'),/gamehell\.js\?v=20261121taste1/);
 new Function(gamehell);
});

test('official escape paths stay protected while demo asset aliases are explicitly allowlisted',async()=>{
 assert.match(serverSource,/const ESCAPE_TASTE_ASSETS=new Map/);
 assert.match(serverSource,/requireEscapeAccess\(req\)/);
 assert.match(serverSource,/isEscapeTaste&&!tasteFile/);
 const original=read('public/escape/index.html');
 assert.match(original,/location\.pathname\.startsWith\('\/taste\/escape\/'\)/);
 assert.match(original,/setInterval\(verifyAccess,15000\)/);
 assert.match(read('public/escape/game.js'),/moyeo\.escape\.ep01\.taste\.save\.v21/);
 assert.match(read('public/escape/game.js'),/moyeo\.escape\.ep01\.taste\.endings\.v21/);
 const prior=process.env.NODE_ENV;process.env.NODE_ENV='test';
 const {server}=await import('../server.js');
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const basename of ['index.html','room3d.js','game.js','styles.css']){
   const r=await fetch(base+'/taste/escape/'+basename);
   assert.equal(r.status,200,basename);
   const data=await r.text();
   assert.ok(data.length>2000);
   assert.equal((await fetch(base+'/escape/'+basename)).status,401,basename);
  }
  assert.equal((await fetch(base+'/taste/escape/secrets.txt')).status,404);
  assert.equal((await fetch(base+'/taste/escape/../admin-escape.html')).status,404);
  assert.equal((await fetch(base+'/api/escape/access')).status,200);
 }finally{
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
  if(prior===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prior;
 }
});
