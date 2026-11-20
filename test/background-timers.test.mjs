import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
test('Game Hell background tab uses wall clock and does not auto-pause',()=>{
 const js=read('gamehell/gamehell.js');
 assert.match(js,/startedAt:Date\.now\(\)/);
 assert.match(js,/function syncWallClock\(\)/);
 assert.match(js,/Date\.now\(\)-g\.startedAt/);
 assert.match(js,/g\.startedAt\+=Date\.now\(\)-/);
 assert.doesNotMatch(js,/visibilitychange[^\n]{0,160}pauseGame\(\)/);
 assert.doesNotMatch(js,/blur[^\n]{0,160}pauseGame\(\)/);
 new Script(js);
});
test('Tetris background gravity and cat decisions use real elapsed wall time',()=>{
 const html=read('tetris/index.html');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 assert.match(script,/const now=Date\.now\(\),dt=last\?Math\.max\(0,now-last\):0/);
 assert.match(script,/while\(g\.fall>=speed/);
 assert.match(script,/while\(catClock>=125/);
 assert.match(script,/if\(!paused\)last=Date\.now\(\)/);
 new Script(script);
});
