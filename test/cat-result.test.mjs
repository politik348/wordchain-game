import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const context={window:{}};
runInNewContext(read('cat-result.js'),context);
const render=context.window.MoyeoCatResult.render;

test('고양이 승리: 비웃는 이미지와 실제 경기 기록 표시',()=>{
 const html=render({game:'오목',outcome:'cat',summary:'고양이 승리!',
  stats:[{label:'전체 착수',value:'43수'}],actions:'<button type="button">다시 하기</button>'});
 assert.match(html,/cat-final-photo--cat/);
 assert.match(html,/고양이 승리!/);
 assert.match(html,/43수/);
 assert.match(html,/다시 하기/);
});
test('고양이 패배: 진 표정 및 선수 승리 결과',()=>{
 const html=render({game:'윷놀이',outcome:'player',
  score:{player:'4\/4',cat:'2\/4'},stats:[{label:'내 윷 던진 횟수',value:'15회'}]});
 assert.match(html,/cat-final-photo--player/);
 assert.match(html,/고양이 패배!/);
 assert.match(html,/4\/4/);
 assert.match(html,/15회/);
});
test('무승부에서는 고양이 패배를 잘못 표시하지 않는다',()=>{
 const html=render({game:'루미큐브',outcome:'draw'});
 assert.match(html,/cat-final-photo--draw/);
 assert.match(html,/무승부!/);
 assert.doesNotMatch(html,/고양이 승리!/);
});
test('결과 텍스트는 안전하게 이스케이프한다',()=>{
 const html=render({game:'<script>alert(1)</script>',outcome:'cat',
 stats:[{label:'테스트',value:'<img src=x onerror=alert(1)>'}]});
 assert.doesNotMatch(html,/<script>/);
 assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/&lt;script&gt;/);
});
test('두 반응 사진은 유효한 WEBP 파일 헤더를 갖는다',()=>{
 const css=read('cat-result.css');
 for(const key of ['cat','player']){
  const match=css.match(new RegExp('\\.cat-final-photo--'+key+'\\{background-image:url\\("data:image/webp;base64,([A-Za-z0-9+/=]+)"\\)\\}'));
  assert.ok(match,key+' result photo missing');
  const bin=Buffer.from(match[1],'base64');
  assert.equal(bin.toString('ascii',0,4),'RIFF');
  assert.equal(bin.toString('ascii',8,12),'WEBP');
  assert.equal(bin.readUInt32LE(4)+8,bin.length);
 }
});
test('여섯 고양이 대전 모드가 공통 결과 시스템을 연결한다',()=>{
 const app=read('app.js'),marble=read('marble/app.mjs'),tetris=read('tetris/index.html');
 assert.match(app,/function catResultView/);
 assert.match(app,/catResultView\\(solo\\)/);
 assert.match(marble,/MoyeoCatResult\\.render/);
 assert.match(tetris,/MoyeoCatResult\\.render/);
});
