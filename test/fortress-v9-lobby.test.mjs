import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const page=readFileSync(new URL('../public/fortress/index.html',import.meta.url),'utf8');
const server=readFileSync(new URL('../fortress-server.mjs',import.meta.url),'utf8');
test('normal fortress defaults to online; cat entry remains AI-only',()=>{assert.ok(page.includes("mode=catOnly?'ai':'online'"));assert.ok(!page.includes('data-v="local"'));assert.ok(page.includes("$('modes').hidden=true"));for(const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
test('team lobby has slots, invite code and server-synchronized selection',()=>{for(const key of ['ft-team-grid','ft-slot','copyRoomCode','roomStatus',"netAct('selectTank'",'p.host','p.tank'])assert.ok(page.includes(key),key);assert.ok(server.includes("b.action==='selectTank'"));assert.ok(server.includes('p.tank=next;p.ready=false;bump(r)'));assert.ok(server.includes('host:p.id===r.host'));});
