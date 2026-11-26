import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../public/fortress/index.html',import.meta.url),'utf8');
test('all four original tanks have separate revised landscape WebP cards',()=>{for(const k of ['cannon','catapult','missile','laser']){let b=readFileSync(new URL('../public/fortress/art/v5/'+k+'-card.webp',import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.toString('ascii',12,16),'VP8 ');assert.ok((b.readUInt16LE(26)&0x3fff)>=460);assert.ok((b.readUInt16LE(28)&0x3fff)>=280);assert.ok(b.length>30000);}assert.ok(page.includes("k==='cannon'?'/fortress/art/v5/cannon-card.webp'"));assert.ok(page.includes("['catapult','missile','laser'].includes(k)"));});
