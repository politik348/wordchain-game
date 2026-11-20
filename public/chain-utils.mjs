// Shared, deterministic word-chain rules for server and AI practice.
// The official dictionary is the authority for valid words in either mode.
export const TURN_SECONDS=[15,30,45,60,90];
export const modes=['wordchain','kungkungtta'];
export function initialLetters(last){
 const c=last.at(-1),set=new Set([c]);if(!c)return set;
 const code=c.charCodeAt(0)-44032;if(code<0||code>=11172)return set;
 const cho=Math.floor(code/588),jung=Math.floor((code%588)/28);
 if(cho===5){const to=[2,6,12,17,20].includes(jung)?11:2;set.add(String.fromCharCode(44032+to*588+code%588));}
 if(cho===2&&[2,6,12,17,20].includes(jung))set.add(String.fromCharCode(44032+11*588+code%588));
 return set;
}
export function dictionaryIndex(words){
 const index=new Map();for(const w of words){const ch=w[0];if(!index.has(ch))index.set(ch,[]);index.get(ch).push(w);}return index;
}
export function validReply(word,last,used,mode,spentEndings){
 if(!/^[가-힣]{2,24}$/.test(word))return false;
 if(mode==='kungkungtta'&&word.length!==3)return false;
 if(used.has(word)||!initialLetters(last).has(word[0]))return false;
 if(spentEndings?.has(word.at(-1)))return false;
 return true;
}
// Search is indexed by start syllable. The optional player's ending history
// enforces the mandatory anti-repeated-ending rule.
export function replies(index,last,used,mode='wordchain',spentEndings=null,limit=3){
 const out=[];
 for(const letter of initialLetters(last))for(const word of index.get(letter)||[]){
  if(validReply(word,last,used,mode,spentEndings)){
   out.push(word);if(out.length>=limit)return out;
  }
 }
 return out;
}
export function openingCandidates(words,index,mode='wordchain'){
 const good=[];
 for(const w of words){
  if(w.length<2||w.length>5||(mode==='kungkungtta'&&w.length!==3))continue;
  const possible=replies(index,w,new Set([w]),mode,null,1);
  if(possible.length)good.push(w);
 }
 return good;
}
export function turnsLabel(mode){return mode==='kungkungtta'?'쿵쿵따 (3글자)':'끝말잇기';}
