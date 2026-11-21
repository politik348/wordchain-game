// Deliberately forgiving Cat AI selector for beginner Korean word-chain games.
// Medium and advanced AI selection remain unchanged in app.js.
export function chooseBeginnerCatWord(possible,startCounts,availableReplies){
 if(!Array.isArray(possible)||!possible.length)return null;
 const ranked=[...possible].sort((a,b)=>(startCounts.get(a.at(-1))||0)-(startCounts.get(b.at(-1))||0));
 // Previously the Cat picked the 5th hardest ending. Start around the 22nd percentile
 // instead and avoid leaving the human without a realistic legal response.
 const start=Math.min(ranked.length-1,Math.floor(ranked.length*0.22));
 for(let i=start;i<ranked.length;i++){
  if(availableReplies(ranked[i],4)>=4)return ranked[i];
 }
 for(let i=start;i<ranked.length;i++){
  if(availableReplies(ranked[i],1)>=1)return ranked[i];
 }
 // Only when every response is a one-shot does the beginner use an unavoidable win.
 return ranked[ranked.length-1];
}
