import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseBeginnerCatWord} from '../public/wordchain-beginner-ai.mjs';

const words=Array.from({length:100},(_,i)=>'가'+String.fromCharCode(44032+i));
const counts=new Map(words.map((word,i)=>[word.at(-1),i+1]));

test('beginner chooses a less punishing ending than the previous fifth-rarest candidate',()=>{
 const choice=chooseBeginnerCatWord(words,counts,(_,limit)=>limit);
 assert.equal(choice,words[22]);
 assert.notEqual(choice,words[4]);
});

test('beginner avoids immediate one-shot words and leaves multiple legal replies where available',()=>{
 const choice=chooseBeginnerCatWord(words,counts,(word,limit)=>{
  if(word===words[22])return 0;
  if(word===words[23])return Math.min(2,limit);
  return limit;
 });
 assert.equal(choice,words[24]);
});

test('when every word is restrictive, beginner still returns a legal candidate',()=>{
 assert.equal(chooseBeginnerCatWord(words,counts,()=>0),words[99]);
 assert.equal(chooseBeginnerCatWord([],counts,()=>0),null);
});

test('only beginner selection changes; intermediate and advanced selection remain in app',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(difficulty==='beginner'\)return chooseBeginnerCatWord/);
 assert.match(app,/difficulty==='advanced'\?rank.length:Math.min\(rank.length,95\)/);
 assert.match(app,/const answer=chooseCatWord\(possible,solo.aiDifficulty\)/);
});
