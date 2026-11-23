import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=file('public/marble/app.mjs');
const html=file('public/marble/index.html');
const css=file('public/marble/marble.css');
const api=file('marble-server.mjs');

test('Marble v5 has separate normal/endless cards and normal-only round options',()=>{
 assert.ok(app.includes("let mode=catChallenge?'ai':'local',gameMode='normal',rounds=12"));
 assert.ok(app.includes("const ROUND_OPTIONS=[8,12,16,20]"));
 assert.ok(app.includes("const roundsForGame=()=>gameMode==='endless'?0:rounds"));
 assert.ok(app.includes("key:'gameMode'"));
 assert.ok(app.includes("value:'normal'"));
 assert.ok(app.includes("value:'endless'"));
 assert.ok(app.includes("if(gameMode==='normal')settings.push("));
 assert.ok(app.includes("key:'rounds'"));
 assert.ok(app.includes("ROUND_OPTIONS.map(n=>"));
 assert.ok(app.includes("rounds:roundsForGame()"));
 assert.match(api,/\[0,8,12,16,20\]/);
});

test('Marble v5 opponent card UI preserves isolated cat route and account-gated friend modes',()=>{
 assert.match(app,/const catChallenge=new URLSearchParams/);
 assert.ok(app.includes("mode=catChallenge?'ai':'local'"));
 assert.ok(app.includes("allowedModes:catChallenge?['cat']:['online','local']"));
 assert.ok(app.includes("mode=catChallenge?'ai':'local';location.hash=''"));
 assert.ok(app.includes("if(mode==='local'&&!(await ensureMember()))return"));
 assert.ok(app.includes("async function createOnline(){if(!(await ensureMember()))return"));
 assert.ok(app.includes("async function joinOnline(code){if(!(await ensureMember()))return"));
 assert.ok(app.includes("async function startOnline(){if(!onlineRoom||inFlight)return;if(!(await ensureMember()))return"));
 assert.ok(app.includes("if(invite&&!catChallenge)"));
 assert.ok(app.includes("backLink.href=catChallenge?'/?cat=1':'/'"));
 assert.match(html,/id="mmReturnLink"/);
 assert.match(api,/import \{multiplayerAccount\} from '.\/auth\.mjs'/);
 assert.match(api,/await multiplayerAccount\(req/);
});

test('Marble v5 uses four original mascot SVGs consistently',()=>{
 assert.ok(app.includes('const avatarFiles='));
 for(const mascot of ['cat','rabbit','bear','fox']){
  assert.ok(app.includes(mascot+'.svg'));
  const svg=file('public/marble/assets/'+mascot+'.svg');
  assert.match(svg,/<svg\b/);
  assert.ok(svg.length>500);
 }
 assert.ok(app.includes('characterArt('));
 assert.ok(html.includes('20261120sharedSetup1'));
 assert.ok(css.includes('mm-opponent-card'));
 assert.ok(css.includes('mm-start-layout'));
 assert.ok(css.includes('@media'));
 new Script(app.replace(/^import .*?;\s*$/gm,''));
});

test('Timed online toll decisions remain fair: allowed choices and no automatic forfeiture',()=>{
 assert.ok(api.includes("state.phase==='tollDefense'"));
 assert.match(api,/type='payToll'/);
 for(const action of ['payToll','useAngel','useDiscount'])
  assert.ok(api.includes("'"+action+"'"),action+' must be allowed by the server');
 assert.match(api,/r\.state=surrender\(r\.state,sid\)/);
 assert.match(app,/mm-toll-defense-actions/);
 assert.match(app,/case 'payToll':case 'useAngel':case 'useDiscount'/);
});
