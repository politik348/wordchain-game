import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../public/fortress/index.html',import.meta.url),'utf8');
test('three original tanks use new illustrated cards without changing battle sprites',()=>{
  assert.ok(page.includes("['catapult','missile','laser'].includes(k)"));
  assert.ok(page.includes("premiumSprites=new Set([...premiumCards,'super'])"));
  for(const k of ['catapult','missile','laser']){
    const b=readFileSync(new URL('../public/fortress/art/v5/'+k+'-card.webp',import.meta.url));
    assert.equal(b.toString('ascii',0,4),'RIFF');
    assert.equal(b.toString('ascii',8,12),'WEBP');
    assert.ok(b.length>15000);
    assert.equal(b.toString('ascii',12,16),'VP8 ');
    assert.ok((b.readUInt16LE(26)&0x3fff)>=330);
  }
});
