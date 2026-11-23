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
test('Game Hell full version, Tetris and Logic require membership while the 3-game arcade trial stays public',async()=>{
 if(server.listening)return;
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const [path,next] of [
   ['/gamehell','/gamehell/index.html'],
   ['/gamehell/','/gamehell/index.html'],
   ['/gamehell/index.html','/gamehell/index.html'],
   ['/tetris','/tetris/index.html'],
   ['/tetris/','/tetris/index.html'],
   ['/tetris/index.html','/tetris/index.html'],
   ['/tetris/index.html?cat=1','/tetris/index.html?cat=1'],
   ['/logic','/logic/index.html'],
   ['/logic/','/logic/index.html'],
   ['/logic/index.html','/logic/index.html']]){
   const response=await fetch(base+path,{redirect:'manual'});
   assert.equal(response.status,302,path);
   const redirect=new URL(response.headers.get('location'),base);
   assert.equal(redirect.pathname,'/');
   assert.equal(redirect.searchParams.get('auth'),'login');
   assert.equal(redirect.searchParams.get('next'),next);
   assert.match(response.headers.get('cache-control')||'',/no-store/);
  }
  // Anonymous visitors are allowed to play only the 3-game arcade taste mode.
  for(const path of ['/gamehell/index.html?trial=1','/gamehell/?trial=1','/gamehell?trial=1']){
   const response=await fetch(base+path,{redirect:'manual'});
   assert.equal(response.status,200,path);
   assert.match(await response.text(),/모여게임지옥/);
   assert.match(response.headers.get('cache-control')||'',/no-store/);
  }
  // These resources must be public or the anonymous trial page cannot render.
  for(const path of ['/gamehell/gamehell.css','/gamehell/gamehell.js','/gamehell/characters.js','/gamehell/assets/characters/cheese.svg']){
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.ok((await response.text()).length>300,path);
  }
  for(const path of ['/gamehell/index.html?trial=0','/gamehell/index.html?trial=true']){
   const response=await fetch(base+path,{redirect:'manual'});
   assert.equal(response.status,302,path);
   assert.equal(new URL(response.headers.get('location'),base).searchParams.get('auth'),'login');
  }
  for(const path of ['/gamehell/not-a-trial-file.js','/tetris/missing.js','/logic/missing.js']){
   const response=await fetch(base+path);
   assert.equal(response.status,401,path);
   assert.match((await response.json()).error,/회원가입·로그인/);
  }
  for(const path of ['/marble/index.html']){
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.ok((await response.text()).length>300,path);
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('Main site returns newly logged-in users to Game Hell, Tetris or Logic',()=>{
 for(const segment of ['gamehell','tetris','logic']){
  assert.ok(app.includes(segment+'\\/index\\.html'),segment+' login redirect must be allowlisted');
 }
 assert.match(app,/if\(next&&/);
});
