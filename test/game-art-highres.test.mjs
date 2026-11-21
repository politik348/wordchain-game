import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catIds=['omok','yut','rummikub','marble','tetris','wordchain'];
const publicIds=['gamehell','tetris','logic','rummikub','marble','mafia'];
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
test('new game gallery CSS and JS are cache-busted together',()=>{
 const html=read('public/index.html');
 assert.match(html,/styles\.css\?v=20261121highresAnimals2/);
 assert.match(html,/app\.js\?v=20261121escape1/);
});
