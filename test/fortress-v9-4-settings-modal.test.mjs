import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const page=readFileSync(new URL('../public/fortress/index.html',import.meta.url),'utf8');
test('room settings button opens modal only after joining',()=>{assert.match(page,/class="ft-lobby-heading".*id="openRoomSettings"/);assert.ok(page.includes("$('openRoomSettings').hidden=!inLobby"));assert.ok(page.includes('<dialog id="roomSettingsDialog"'));assert.ok(page.includes("#setup.online-only.in-room>.settings>#roomSettingsPanel{display:none!important}"));assert.ok(page.includes("roomSettingsDialog').showModal()"));for(const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
test('modal restores original settings panel and discards unsubmitted draft on closing',()=>{assert.ok(page.includes("roomSettingsPlaceholder.replaceWith($('roomSettingsPanel'))"));assert.ok(page.includes("roomSettingsKey=null;syncRoomSettings();setupUI()"));assert.ok(page.includes("if(ok){closeRoomSettings(true)"));assert.ok(page.includes("if(room.phase==='lobby'){lobbyUI();return;}closeRoomSettings(true)"));assert.equal((page.match(/id="teamSize"/g)||[]).length,1);});
