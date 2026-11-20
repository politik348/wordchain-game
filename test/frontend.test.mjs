import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {loadDictionary} from '../data/load-lexicon.mjs';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const helpers=readFileSync(new URL('../public/chain-utils.mjs',import.meta.url),'utf8').replace(/^export /gm,'');
const cleanSource=source.replace(/^import .*\n/,'');
const pureSource=helpers+'\n'+cleanSource.slice(0,cleanSource.indexOf("document.addEventListener('click'"));
const CSS=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
function sandbox(){
 const fakeInput={isContentEditable:false,matches:s=>s.includes('input')};
 const fakeRoot={contains:el=>el===fakeInput,querySelector:()=>null};
 const document={getElementById:()=>fakeRoot,activeElement:fakeInput};
 const context=vm.createContext({document,localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null,setItem:()=>{}},crypto:{randomUUID:()=> 'fake-uuid'},console,setTimeout});
 vm.runInContext(pureSource,context);
 const evaluate=js=>vm.runInContext(js,context);
 return {evaluate,document};
}
test('incoming same-phase updates do not destroy a focused answer field',()=>{
 const {evaluate}=sandbox();
 evaluate(`view='room';let count=0;render=()=>{count++};room={id:'ABCDEF',game:'mafia',status:'playing',version:1,state:{phase:'discussion',chat:[]},players:[]};
   updateRoom({id:'ABCDEF',game:'mafia',status:'playing',version:2,state:{phase:'discussion',chat:[{text:'hello'}]},players:[]});
   globalThis.out={rendered:count,pending:deferredRoomRender,chat:room.state.chat.length};`);
 assert.equal(evaluate('globalThis.out.rendered'),0);
 assert.equal(evaluate('globalThis.out.pending'),true);
 assert.equal(evaluate('globalThis.out.chat'),1);
});
test('phase changes still trigger the necessary refresh',()=>{
 const {evaluate}=sandbox();
 evaluate(`view='room';let count=0;render=()=>{count++};room={id:'ABCDEF',game:'mafia',status:'playing',version:1,state:{phase:'discussion'},players:[]};
   updateRoom({id:'ABCDEF',game:'mafia',status:'playing',version:2,state:{phase:'vote'},players:[]});globalThis.out=count;`);
 assert.equal(evaluate('globalThis.out'),1);
});
test('live doodle strokes use in-place patching, not a full rerender',()=>{
 const {evaluate}=sandbox();
 evaluate(`view='room';let renders=0,patches=0;render=()=>{renders++};patchDoodle=()=>{patches++;return true;};
 room={id:'ABCDEF',game:'doodle',status:'playing',version:1,state:{artist:user.sid,round:1,strokes:[]},players:[]};
 updateRoom({id:'ABCDEF',game:'doodle',status:'playing',version:2,state:{artist:user.sid,round:1,strokes:[{points:[[.1,.1]]}]},players:[]});
 globalThis.out={renders,patches};`);
 assert.equal(evaluate('globalThis.out.renders'),0);
 assert.equal(evaluate('globalThis.out.patches'),1);
});
test('artist sees answer prominently; guessing participant never sees the word',()=>{
 const {evaluate}=sandbox();
 evaluate(`view='room';room={id:'ABCDEF',game:'doodle',host:user.sid,status:'playing',players:[{id:user.sid,nick:'화가'},{id:'second',nick:'맞히는사람'}],state:{artist:user.sid,round:1,maxRounds:6,word:'코끼리',wordLength:3,deadline:Date.now()+80000,chat:[],strokes:[],scores:{},}};globalThis.artistHtml=doodleGame();`);
 const artist=evaluate('globalThis.artistHtml');
 assert.match(artist,/artist-card/);
 assert.match(artist,/코끼리/);
 assert.match(artist,/나만 볼 수 있는 제시어/);
 evaluate(`room.state.artist='second';globalThis.guesserHtml=doodleGame();`);
 const guesser=evaluate('globalThis.guesserHtml');
 assert.match(guesser,/guesser-card/);
 assert.match(guesser,/●●●/);
 assert.doesNotMatch(guesser,/코끼리/);
});
test('disabled omok cells override generic button opacity',()=>{
 assert.match(CSS,/button:disabled\s*\{\s*opacity:\s*\.48/);
 assert.match(CSS,/\.omok-cell:disabled\s*\{\s*opacity:\s*1/);
});
test('new Gomoku AI plays a forced winning fifth stone',()=>{
 const {evaluate}=sandbox();
 evaluate(`let b=Array(225).fill(null);for(let x=4;x<8;x++)b[6*15+x]='white';b[8*15+7]='black';globalThis.move=chooseOmokMove(b);`);
 const m=evaluate('globalThis.move');
 assert.equal(m.y,6);assert.ok(m.x===3||m.x===8);
});
test('new Gomoku AI blocks the opponent’s immediate fifth stone',()=>{
 const {evaluate}=sandbox();
 evaluate(`let b=Array(225).fill(null);for(let x=4;x<8;x++)b[6*15+x]='black';b[8*15+7]='white';globalThis.move=chooseOmokMove(b);`);
 const m=evaluate('globalThis.move');
 assert.equal(m.y,6);assert.ok(m.x===3||m.x===8);
});
test('wordchain input remains focusable outside player turn',()=>{
 const {evaluate}=sandbox();
 evaluate(`setNav=()=>{};view='solo';solo={game:'wordchain',turn:'ai',history:['사과'],playerLives:2,aiLives:2,deadline:Date.now()+30000,msg:'AI turn',score:0,finished:false};globalThis.html=soloGame();`);
 const markup=evaluate('globalThis.html');
 assert.match(markup,/data-form="soloWord"/);
 assert.match(markup,/readonly/);
 assert.doesNotMatch(markup,/<input[^>]*disabled[^>]*>/);
});
test('imported dictionary has over 200,000 words and includes ordinary nouns',()=>{
 const dict=loadDictionary();
 const client=JSON.parse(readFileSync(new URL('../public/words.json',import.meta.url),'utf8'));
 assert.equal(dict.length,437875);
 assert.equal(client.count,dict.length);
 assert.equal(client.parts.length,18);
 for(const w of ['사과','과자','자동차','학교','나무'])assert.ok(dict.includes(w),w);
});
