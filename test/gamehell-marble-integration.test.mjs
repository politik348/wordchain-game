import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {server} from '../server.js';
import {once} from 'node:events';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const marble=readFileSync(new URL('../public/marble/app.mjs',import.meta.url),'utf8');
const arcade=readFileSync(new URL('../public/gamehell/index.html',import.meta.url),'utf8');
test('Game Hell remains a standalone home game and Cat Challenge stays first',()=>{
 assert.match(app,/id:'gamehell'/);
 assert.ok(app.includes('${GAMES.length} GAMES'));
 assert.ok(app.includes('${GAMES.length}가지 게임'));
 assert.ok(app.includes('/gamehell/index.html'));
 assert.ok(app.indexOf('renderCatFeatured()}')<app.indexOf('GAMES.map(card)'));
 assert.match(home,/모여게임즈/);
 assert.match(arcade,/gamehell/);
});
test('Marble v3 preserves isolated Cat Challenge entrypoint and multiplayer mode',()=>{
 assert.match(marble,/const catChallenge=new URLSearchParams/);
 assert.ok(marble.includes("mode=catChallenge?'ai':'local'"));
 assert.match(marble,/allowedModes:catChallenge\?\['cat'\]:\['online','local'\]/);
 assert.match(marble,/modeBtn.dataset.mode/);
 assert.match(marble,/mmReturnLink/);
 assert.match(readFileSync(new URL('../public/marble/index.html',import.meta.url),'utf8'),/id="mmReturnLink"/);
});
test('Game Hell requires membership even for direct URL and taste mode, while public games remain accessible',async()=>{
 if(server.listening)return;
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const [path,next] of [
   ['/gamehell','/gamehell/index.html'],
   ['/gamehell/','/gamehell/index.html'],
   ['/gamehell/index.html','/gamehell/index.html'],
   ['/gamehell/index.html?trial=1','/gamehell/index.html?trial=1']]){
   const response=await fetch(base+path,{redirect:'manual'});
   assert.equal(response.status,302,path);
   const redirect=new URL(response.headers.get('location'),base);
   assert.equal(redirect.pathname,'/');
   assert.equal(redirect.searchParams.get('auth'),'login');
   assert.equal(redirect.searchParams.get('next'),next);
   assert.match(response.headers.get('cache-control')||'',/no-store/);
  }
  for(const path of ['/gamehell/gamehell.css','/gamehell/gamehell.js','/gamehell/characters.js','/gamehell/assets/characters/cheese.svg']){
   const response=await fetch(base+path);
   assert.equal(response.status,401,path);
   assert.match((await response.json()).error,/회원가입·로그인/);
  }
  for(const path of ['/marble/index.html','/tetris/index.html','/logic/index.html']){
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.ok((await response.text()).length>300,path);
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('Main site returns registered players to Game Hell after login',()=>{
 assert.match(app,/gamehell\\/index\\.html\|escape-access/);
 assert.match(app,/if\(next&&/);
});
