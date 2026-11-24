import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catIds=['omok','yut','rummikub','marble','tetris','wordchain'];
const publicIds=['gamehell','tetris','logic','rummikub','marble','mafia'];
const newCardIds=['omok','yut','doodle','bell','liar','wordchain'];
test('high-resolution illustration sprites are real AVIF assets, not placeholders',()=>{
 for(const file of ['cat-challenge-highres-v2.avif','general-games-highres-v2.avif']){
  const full=new URL('../public/assets/'+file,import.meta.url);
  assert.ok(statSync(full).size>100_000,'compressed image is unexpectedly tiny: '+file);
  const bytes=readFileSync(full);
  assert.equal(bytes.toString('ascii',4,12),'ftypavif','not a valid AVIF file: '+file);
 }
});
test('all six cat challenge illustrations use the new sprite and keep clickable cards',()=>{
 const css=read('public/styles.css');
 const module=read('public/cat-hub.mjs');
 assert.match(css,/\/assets\/cat-challenge-highres-v2\.avif/);
 assert.match(module,/data-cat-game=/);
 for(const id of catIds)assert.match(css,new RegExp('cat-choice-art-'+id));
});
test('six public-game cards use corresponding diverse-animal scenes, not enlarged emoji',()=>{
 const css=read('public/styles.css'),app=read('public/app.js');
 assert.match(css,/\/assets\/general-games-highres-v2\.avif/);
 assert.match(app,/GENERAL_GAME_ILLUSTRATIONS/);
 for(const id of publicIds)assert.match(css,new RegExp('game-animal-'+id));
 assert.match(app,/hasAnimalArt\?'':/);
});
test('all six formerly emoji-only game cards use the new high-resolution animal scenes',()=>{
 const css=read('public/styles.css'),app=read('public/app.js');
 const sprite=readFileSync(new URL('../public/assets/general-games-extra-v1.webp',import.meta.url));
 assert.ok(sprite.length>150_000,'six-panel WebP sprite should preserve visual quality');
 assert.equal(sprite.toString('ascii',0,4),'RIFF');
 assert.equal(sprite.toString('ascii',8,12),'WEBP');
 assert.match(css,/\/assets\/general-games-extra-v1\.webp\?v=20261123galleryart1/);
 for(const id of newCardIds){
  assert.match(css,new RegExp('\\.game-animal-'+id+'\\{background-position:'));
  assert.ok(app.includes("'"+id+"'"),'missing illustrated game ID '+id);
 }
 assert.match(app,/GENERAL_GAME_ILLUSTRATIONS=new Set/);
});
test('new game gallery CSS and JS are cache-busted together',()=>{
 const html=read('public/index.html');
 const cssVersion=html.match(/styles\.css\?v=([A-Za-z0-9_-]+)/)?.[1];
 const jsVersion=html.match(/app\.js\?v=([A-Za-z0-9_-]+)/)?.[1];
 assert.ok(cssVersion,'CSS must have a cache version');
 assert.ok(jsVersion,'JS must have a cache version');
 assert.equal(cssVersion,jsVersion,'CSS and JS cache versions must match');
});
