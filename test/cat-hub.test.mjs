import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CAT_CHALLENGE_GAMES,renderCatFeatured,renderCatHub,renderCatSetup} from '../public/cat-hub.mjs';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const marble=readFileSync(new URL('../public/marble/app.mjs',import.meta.url),'utf8');
const marbleHtml=readFileSync(new URL('../public/marble/index.html',import.meta.url),'utf8');

test('Cat Challenge is first in the home game grid and nav',()=>{
 const featured=renderCatFeatured();
 assert.match(featured,/data-action="openCatHub"/);
 assert.match(featured,/고양이를 이겨라/);
 assert.match(app,/renderCatFeatured\(\)\}\$\{GAMES\.map\(card\)/);
 assert.match(html,/class="nav-btn cat-nav-btn" data-nav="cat"/);
 assert.ok(html.indexOf('data-nav="cat"')<html.indexOf('data-nav="home"'));
});

test('Cat Challenge groups the eight currently available AI games',()=>{
 assert.deepEqual(CAT_CHALLENGE_GAMES,['omok','yut','rummikub','marble','tetris','wordchain','fortress','fighter']);
 const games=CAT_CHALLENGE_GAMES.map((id,i)=>({id,name:['오목','윷놀이','루미큐브','모여마블','테트리스','끝말잇기','모여 포트리스','모여 파이터즈'][i],emoji:'🐱',desc:'한 판'}));
 const hub=renderCatHub(games);
 const matches=[...hub.matchAll(/data-action="catChoose"/g)];
 assert.equal(matches.length,8);
 for(const game of games)assert.match(hub,new RegExp('data-cat-game="'+game.id+'"'));
 assert.match(hub,/홈에서 일반 게임을 선택하세요/);
});

test('all eight Cat Challenge cards use matching generated illustrations',()=>{
 const games=CAT_CHALLENGE_GAMES.map((id,i)=>({id,name:['오목','윷놀이','루미큐브','모여마블','모여 테트리스','끝말잇기','모여 포트리스','모여 파이터즈'][i],emoji:'🐱'}));
 const html=renderCatHub(games);
 const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
 const image=readFileSync(new URL('../public/assets/cat-challenge-highres-v2.avif',import.meta.url));
 assert.equal((html.match(/class="cat-choice-illustration/g)||[]).length,8);
 for(const id of CAT_CHALLENGE_GAMES){
   assert.match(html,new RegExp('cat-choice-art-'+id));
   assert.match(css,new RegExp('cat-choice-art-'+id));
 }
 for(const [id,asset] of [['fortress','fortress-cat.webp'],['fighter','fighter-gallery.webp']]){
   assert.ok(css.includes(`.cat-choice-art-${id}{background-image:url('/assets/${asset}')`));
   const art=readFileSync(new URL('../public/assets/'+asset,import.meta.url));
   assert.equal(art.toString('ascii',0,4),'RIFF');
   assert.equal(art.toString('ascii',8,12),'WEBP');
   assert.ok(art.length>10000);
 }
 assert.match(css,/cat-challenge-highres-v2\.avif/);
 assert.ok(image.length>100000,'high-resolution six-scene image must contain actual picture bytes');
 assert.equal(image.toString('ascii',4,12),'ftypavif');
 assert.match(readFileSync(new URL('../server.js',import.meta.url),'utf8'),/'\.avif':'image\/avif'/);
});
test('Cat setup supports existing room-independent game preferences',()=>{
 const markup=renderCatSetup({id:'omok',name:'오목',emoji:'⚫'},'<label>제한시간</label>');
 assert.match(markup,/제한시간/);
 assert.match(markup,/data-action="solo"/);
 assert.match(markup,/data-action="openCatHub"/);
 assert.match(app,/else if\(view==='catSetup'\)root\.innerHTML=catSetup\(\)/);
 assert.match(app,/if\(action==='catChoose'\)/);
 assert.match(app,/if\(action==='backCatHub'\)/);
});

test('Pre-game detail uses shared illustrated UI and exposes only supported play modes',()=>{
 const detailLine=app.split('\n').find(line=>line.startsWith('function detail(){'));
 assert.ok(detailLine);
 assert.match(detailLine,/pregameFor\(selection,false\)/);
 assert.match(app,/catGamesSupported=new Set\(\['omok','yut','wordchain','rummikub'\]\)/);
 assert.match(app,/data-pg-setting/);
 assert.match(app,/persistPregamePrefs/);
 assert.match(app,/b\.dataset\.action==='lobbyStart'/);
});

test('Marble isolates Cat mode from friend modes and returns to the Cat hub',()=>{
 assert.match(app,/\/marble\/index\.html\?cat=1/);
 assert.match(app,/\/tetris\/index\.html\?cat=1/);
 assert.match(marble,/allowedModes:catChallenge\?\['cat'\]:\['online','local'\]/);
 assert.match(marble,/mode=catChallenge\?'ai':'local'/);
 assert.match(marble,/mode=catChallenge\?'ai':'local';location\.hash/);
 assert.match(marbleHtml,/id="mmReturnLink"/);
 assert.match(app,/catReturn\?null:url\.get\('room'\)/);
});
