import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderPregame,renderPregameArt,PRE_GAME_THEMES} from '../public/pregame-lobbies.mjs';
import {renderOnlineWaiting} from '../public/waiting-room.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const games=['omok','yut','wordchain','rummikub','mafia','doodle','liar','bell','tetris','logic','gamehell'];

test('each non-Marble game gets dedicated inline SVG art and 3 guide cards',()=>{
 const arts=games.map(id=>renderPregameArt(id));
 for(let i=0;i<games.length;i++){
  const id=games[i];
  assert.ok(PRE_GAME_THEMES[id],id);
  assert.match(arts[i],/<svg\b/,id);
  assert.match(arts[i],/<\/svg>/,id);
  assert.ok(arts[i].length>350,id);
  const markup=renderPregame({game:{id,name:id,desc:'hello',badge:'match'},allowedModes:['online'],mode:'online',
   rules:[['첫 규칙','설명'],['둘째 규칙','설명'],['세 번째','설명']]});
  assert.match(markup,/pg-hero/);assert.match(markup,/pg-config-grid/);
  assert.equal((markup.match(/class="pg-guide"/g)||[]).length,3,id);
  assert.match(markup,/data-action="lobbyStart"/);
 }
 assert.equal(new Set(arts).size,games.length,'artwork must differ by game');
});

test('unsupported play types never appear in a given lobby',()=>{
 const markup=renderPregame({game:{id:'mafia',name:'가면단'},allowedModes:['online'],mode:'cat',showJoin:true});
 assert.match(markup,/친구와 온라인/);
 assert.doesNotMatch(markup,/data-pg-mode="cat"/);
 assert.doesNotMatch(markup,/data-pg-mode="solo"/);
 assert.equal((markup.match(/data-pg-mode=/g)||[]).length,1);
});

test('word and picture setup cards keep selectable and escaped values',()=>{
 const html=renderPregame({game:{id:'wordchain',name:'<script>bad</script>',rules:[['&','<']]},
  allowedModes:['cat','online'],mode:'cat',
  settings:[{key:'wordMode',label:'규칙',large:true,value:'kungkungtta',choices:[
   {value:'wordchain',label:'끝말잇기'}, {value:'kungkungtta',label:'쿵쿵따'}]}]});
 assert.match(html,/data-pg-setting="wordMode"/);
 assert.match(html,/data-pg-mode="cat" aria-pressed="true"/);
 assert.match(html,/data-pg-value="kungkungtta" aria-pressed="true"/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});

test('multiplayer waiting screen uses actual host/ready info and member-only lobby chat',()=>{
 const room={id:'ABC123',game:'yut',host:'host',me:'guest',players:[
  {id:'host',nick:'방장',ready:false},{id:'guest',nick:'참가자',ready:true}
 ],lobbyChat:[{sid:'host',nick:'방장',text:'잘 왔어요!'}]};
 const game={id:'yut',name:'윷놀이'};
 const options=[{key:'turnSeconds',label:'제한 시간',value:45,choices:[{value:15,label:'15초'},{value:45,label:'45초'}]}];
 const visitor=renderOnlineWaiting({game,room,host:false,settings:options});
 assert.match(visitor,/ABC123/);assert.match(visitor,/방장/);assert.match(visitor,/참가자/);
 assert.match(visitor,/잘 왔어요!/);assert.match(visitor,/data-form="lobbyChat"/);
 assert.match(visitor,/data-action="ready"/);
 assert.match(visitor,/data-wr-setting="turnSeconds" data-wr-value="45"[^>]*disabled/);
 const host=renderOnlineWaiting({game,room,host:true,settings:options});
 assert.match(host,/data-action="start"/);
 assert.doesNotMatch(host,/data-action="start" disabled/);
 assert.doesNotMatch(host,/data-wr-setting="turnSeconds" data-wr-value="45"[^>]*disabled/);
});

test('no secret-bearing data from chat becomes HTML in the waiting room',()=>{
 const room={id:'ABC123',host:'1',me:'1',players:[{id:'1',nick:'<img src=x onerror=alert(1)>',ready:false}],
  lobbyChat:[{sid:'1',nick:'<hi>',text:'<script>alert(1)</script>'}]};
 const html=renderOnlineWaiting({game:{id:'omok',name:'오목'},room,host:true});
 assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(html,/<img src=x onerror=/);
});

test('main game modes, option saving, start dispatch and lobby chat all use real wiring',()=>{
 const app=read('public/app.js'),server=read('server.js'),index=read('public/index.html');
 assert.match(app,/catGamesSupported=new Set\(\['omok','yut','wordchain','rummikub'\]\)/);
 assert.match(app,/return catOnly\?\['cat'\]:catGames\.has\(game\)\?\['online','cat'\]:\['online'\]/);
 assert.match(app,/persistPregamePrefs/);
 assert.match(app,/b\.dataset\.action==='lobbyStart'/);
 assert.match(app,/await act\('settings'/);
 assert.match(app,/lobbyChat:'lobbyChat'/);
 assert.match(server,/if\(type==='lobbyChat'\)/);
 assert.match(server,/st!=='lobby'/);
 assert.match(index,/pregame\.css\?v=[^"']+/);
 assert.match(index,/app\.js\?v=[^"']+/);
});

test('standalone pregame starts real engines with selections, and retains Marble v5 screen',()=>{
 const standalone=read('public/standalone-pregame.mjs');
 const tetris=read('public/tetris/index.html');
 const logic=read('public/logic/index.html');
 const gamehell=read('public/gamehell/index.html');
 const marble=read('public/marble/app.mjs');
 assert.match(standalone,/MOYEO_TETRIS_START\(\{mode:cat\?'versus':'solo',difficulty:values\.difficulty,aiDifficulty:values\.aiDifficulty/);
 assert.match(standalone,/size\.dispatchEvent\(new Event\('change'/);
 assert.match(standalone,/choice\.click\(\);duration\.click\(\)/);
 assert.match(standalone,/arcadeModes=\[/);
 assert.match(tetris,/difficulty==='hard'/);
 assert.match(logic,/standalone-pregame\.mjs/);
 assert.match(gamehell,/standalone-pregame\.mjs/);
 assert.match(marble,/renderPregame\(/);assert.match(marble,/allowedModes:catChallenge\?\['cat'\]:\['online','local'\]/);
});
