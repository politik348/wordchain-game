import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Rummikub v3 uses persistent drafts, sort settings, bundles and no table reset on draw',()=>{
 const ui=read('public/rummikub/ui.mjs'),draft=read('public/rummikub/draft.mjs');
 assert.match(ui,/\.\/draft\.mjs/);
 assert.match(ui,/changedTable/);
 assert.match(ui,/bundleFor/);
 assert.match(draft,/sessionStorage/);
 assert.match(draft,/setSort/);
 assert.match(draft,/restore/);
});

test('Game Hell v2.1 uses original records, 8 SVG characters and wall-clock timer',()=>{
 const js=read('public/gamehell/gamehell.js'),page=read('public/gamehell/index.html'),characters=read('public/gamehell/characters.js');
 assert.match(js,/moyeo-gamehell-v1/);
 assert.match(js,/function syncWallClock\(\)/);
 assert.doesNotMatch(js,/visibilitychange[^\n]*pauseGame\(\)/);
 assert.match(page,/gamehell\.js\?v=20261120pg3/);
 const win={};runInNewContext(characters,{window:win});
 assert.equal(win.MOYEO_CHARACTERS.length,8);
 for(const item of win.MOYEO_CHARACTERS){
  assert.match(item.image,/\.svg$/);
  const svg=read('public/gamehell/'+item.image.replace(/^\.\//,''));
  assert.match(svg,/<svg\b/);
 }
});

test('Marble v4 maintains account gating and separate Cat Challenge entrypoint',()=>{
 const client=read('public/marble/app.mjs'),api=read('marble-server.mjs'),engine=read('public/marble/engine.mjs');
 assert.match(client,/const catChallenge=/);
 assert.match(client,/async function ensureMember\(\)/);
 assert.match(client,/mode=catChallenge\?'ai':'local'/);
 assert.match(client,/async function startLocal\(\)\{if\(mode==='local'&&!\(await ensureMember\(\)\)\)return/);
 assert.match(client,/async function createOnline\(\)\{if\(!\(await ensureMember\(\)\)\)return/);
 assert.match(api,/import \{multiplayerAccount\} from '.\/auth\.mjs'/);
 assert.match(api,/await multiplayerAccount\(req/);
 assert.match(api,/takeLoan/);
 assert.match(api,/pickCard/);
 assert.match(engine,/takeLoan/);
 assert.match(engine,/pickCard/);
});

test('Main home uses v3 UI cache and names each upgraded game correctly',()=>{
 const app=read('public/app.js'),index=read('public/index.html');
 assert.match(app,/rummikub\/ui\.mjs\?v=20261120rk3/);
 assert.match(index,/rummikub\/rummikub\.css\?v=20261120rk3/);
 assert.match(app,/개인 최고기록에 도전하고/);
 assert.match(app,/무한 파산전/);
 assert.match(index,/auth\.css/);
});
