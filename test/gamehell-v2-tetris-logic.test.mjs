import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext, Script} from 'node:vm';

const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const app=read('app.js'),hub=read('cat-hub.mjs');
const tetris=read('tetris/index.html'),logic=read('logic/index.html');
const hell=read('gamehell/index.html'),hellJs=read('gamehell/gamehell.js');
const chars=read('gamehell/characters.js');
const inline=html=>{
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'Missing standalone inline script');
 return match[1];
};

test('Tetris and Logic are separate standalone games and home shows twelve',()=>{
 assert.match(app,/id:'tetris'/);
 assert.match(app,/id:'logic'/);
 assert.match(app,/id:'gamehell'/);
 assert.equal([...app.matchAll(/\{id:'[^']+',name:/g)].length,12);
 assert.match(app,/\$\{GAMES\.length\} GAMES/);
 assert.match(app,/\$\{GAMES\.length\}가지 게임/);
 assert.match(app,/\/tetris\/index\.html/);
 assert.match(app,/\/logic\/index\.html/);
 assert.ok(app.includes('${renderCatFeatured()}${GAMES.map(card)'));
});

test('Cat hub contains Tetris AI entry and regular Tetris stays solo',()=>{
 assert.match(hub,/tetris/);
 assert.match(hub,/6 GAMES/);
 assert.match(hub,/6가지 고양이 대전/);
 assert.match(app,/\/tetris\/index\.html\?cat=1/);
 assert.match(tetris,/id="solo"/);
 assert.match(tetris,/id="versus"/);
 assert.match(tetris,/const catChallenge=new URLSearchParams\(location\.search\)\.get\('cat'\)==='1'/);
 assert.match(tetris,/\$\('versus'\)\.hidden=!catChallenge/);
 assert.match(tetris,/\$\('solo'\)\.hidden=catChallenge/);
 assert.match(tetris,/window\.MOYEO_TETRIS_START=options=>/);
 assert.match(tetris,/standalone-pregame\.mjs/);
 assert.match(tetris,/tetrisBackLink/);
 new Script(inline(tetris));
});

test('Logic preserves puzzle controls, stages and local progress',()=>{
 for(const id of ['board','fill','cross','erase','undo','hint','levels','reset'])
   assert.match(logic,new RegExp('id="'+id+'"'));
 assert.match(logic,/moyeo-logic-v1/);
 assert.match(logic,/name:'왕관',size:15/);
 assert.match(logic,/15×15 도전/);
 assert.match(logic,/모여로직/);
 assert.match(logic,/logic-home-link/);
 new Script(inline(logic));
});

test('Game Hell v2.1 includes 8 collectible character sprites and preserves v1 records',()=>{
 assert.match(hell,/shopHeaderBtn/);
 assert.match(hell,/shopModal/);
 assert.match(hell,/shopBalance/);
 assert.match(hell,/characters\.js\?v=20261120hell21/);
 assert.match(hell,/gamehell\.js\?v=20261120hell21/);
 assert.match(hellJs,/moyeo-gamehell-v1/);
 assert.match(hellJs,/buyOrEquip/);
 assert.match(hellJs,/renderShop/);
 const sandbox={window:{}};
 runInNewContext(chars,sandbox);
 const list=sandbox.window.MOYEO_CHARACTERS;
 assert.equal(list.length,8);
 assert.equal(new Set(list.map(c=>c.id)).size,8);
 assert.equal(list[0].price,0);
 assert.ok(list.every(c=>Number.isInteger(c.price)&&c.price>=0));
 new Script(hellJs);
});
