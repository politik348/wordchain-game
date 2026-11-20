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

test('Cat Challenge groups the six currently available AI games',()=>{
 assert.deepEqual(CAT_CHALLENGE_GAMES,['omok','yut','rummikub','marble','tetris','wordchain']);
 const games=CAT_CHALLENGE_GAMES.map((id,i)=>({id,name:['오목','윷놀이','루미큐브','모여마블','테트리스','끝말잇기'][i],emoji:'🐱',desc:'한 판'}));
 const hub=renderCatHub(games);
 const matches=[...hub.matchAll(/data-action="catChoose"/g)];
 assert.equal(matches.length,6);
 for(const game of games)assert.match(hub,new RegExp('data-cat-game="'+game.id+'"'));
 assert.match(hub,/친구와 하려면 홈의 일반 게임 목록/);
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

test('Multiplayer details do not include a Cat Challenge button',()=>{
 const detailLine=app.split('\n').find(line=>line.startsWith('function detail(){'));
 assert.ok(detailLine);
 assert.doesNotMatch(detailLine,/btn\('solo'/);
 assert.match(detailLine,/createRoom/);
 assert.match(detailLine,/openJoin/);
});

test('Marble isolates Cat mode from friend modes and returns to the Cat hub',()=>{
 assert.match(app,/\/marble\/index\.html\?cat=1/);
 assert.match(app,/\/tetris\/index\.html\?cat=1/);
 assert.match(marble,/catChallenge\s*\?\s*\[\['ai'/);
 assert.match(marble,/mode=catChallenge\?'ai':'local'/);
 assert.match(marble,/mode=catChallenge\?'ai':'local';location\.hash/);
 assert.match(marbleHtml,/id="mmReturnLink"/);
 assert.match(app,/catReturn\?null:url\.get\('room'\)/);
});
