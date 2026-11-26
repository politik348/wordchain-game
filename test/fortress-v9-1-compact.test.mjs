import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const page=readFileSync(new URL('../public/fortress/index.html',import.meta.url),'utf8');
test('compact tank selector has seven desktop columns and no nested scroll',()=>{assert.match(page,/#setup #tanks\{grid-template-columns:repeat\(7,minmax\(0,1fr\)\);gap:7px;max-height:none;overflow:visible/);assert.ok(page.includes("height:clamp(68px,7vw,100px)"));assert.ok(page.includes("repeat(5,minmax(0,1fr))"));assert.ok(page.includes("repeat(3,minmax(0,1fr))"));for(const m of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
test('cannon uses an existing full-resolution artwork',()=>{assert.ok(page.includes("k==='cannon'?'/assets/fortress-gallery.webp'"));assert.ok(existsSync(new URL('../public/assets/fortress-gallery.webp',import.meta.url)));});
