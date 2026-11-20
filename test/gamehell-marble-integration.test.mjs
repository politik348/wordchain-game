import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {server} from '../server.js';
import {once} from 'node:events';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const marble=readFileSync(new URL('../public/marble/app.mjs',import.meta.url),'utf8');
const arcade=readFileSync(new URL('../public/gamehell/index.html',import.meta.url),'utf8');
test('Game Hell is a standalone tenth home game and Cat Challenge stays first',()=>{
 assert.match(app,/id:'gamehell'/);
 assert.match(app,/10 GAMES/);
 assert.match(app,/10가지 게임/);
 assert.match(app,/gamehell\\/index.html/);
 assert.ok(app.indexOf('renderCatFeatured()}')<app.indexOf('GAMES.map(card)'));
 assert.match(home,/모여게임즈/);
 assert.match(arcade,/gamehell/);
});
test('Marble v3 preserves isolated Cat Challenge entrypoint and multiplayer mode',()=>{
 assert.match(marble,/const catChallenge=new URLSearchParams/);
 assert.match(marble,/mode=catChallenge\\?'ai':'local'/);
 assert.match(marble,/const modes=catChallenge/);
 assert.match(marble,/modeBtn.dataset.mode/);
 assert.match(marble,/mmReturnLink/);
 assert.match(readFileSync(new URL('../public/marble/index.html',import.meta.url),'utf8'),/id="mmReturnLink"/);
});
test('New independent arcade assets are served by existing static handler',async()=>{
 if(server.listening)return;
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const path of ['/gamehell/index.html','/gamehell/gamehell.css','/gamehell/gamehell.js','/marble/index.html']){
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.ok((await response.text()).length>300,path);
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
