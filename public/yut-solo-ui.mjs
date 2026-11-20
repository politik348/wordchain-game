import {legalYutMoves} from './yut-solo-engine.mjs';
// Render the local Yutnori game using the existing multiplayer board graphics.
export function renderSoloYut(s,helpers) {
 const {coords,line,btn,timeBar,esc}=helpers;
 const outer=Array.from({length:20},(_,i)=>line(i,i+1)).join('');
 const inside=[[5,21],[21,22],[22,23],[23,24],[24,25],[25,15],[10,26],[26,27],[27,23]].map(pair=>line(pair[0],pair[1])).join('');
 const dots=Object.entries(s.pieces).flatMap(([side,ps])=>ps.filter(p=>!p.done&&p.node!==0).map((p,i)=>{
   const pos=coords[p.node]||[495,495],x=pos[0]+(i%2)*15-7,y=pos[1]+(Math.floor(i/2)%2)*15-7;
   return '<circle class="yut-piece-dot" cx="'+x+'" cy="'+y+'" r="11" fill="'+(side==='player'?'#e26663':'#4e94cb')+'"/>';
 })).join('');
 const nodes=Object.entries(coords).filter(entry=>entry[0]!=='0').map(([i,pos])=>{
   const n=Number(i),large=[5,10,15,20,23].includes(n),klass=[5,10,15,20].includes(n)?'corner':n===23?'center':'';
   return '<circle class="yut-node '+klass+'" cx="'+pos[0]+'" cy="'+pos[1]+'" r="'+(large?19:12)+'"/>';
 }).join('');
 const board='<div class="yut-board"><svg class="yut-svg" viewBox="-15 -15 555 555" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="고양이와 대결하는 윷놀이 판"><rect x="0" y="0" width="525" height="525" rx="17" fill="#fffaf0"/>'+outer+inside+nodes+dots+'<text x="438" y="522" font-size="14" fill="#9a6e56">출발/도착</text></svg></div>';
 const moves=legalYutMoves(s.pieces.player,s.pending);
 const choices=s.pieces.player.map((p,i)=>{
   const available=moves.filter(m=>m.index===i);
   if(!available.length)return '<button type="button" class="choice-button" disabled>'+(i+1)+'번 말 '+(p.done?'🏁':'이동 불가')+'</button>';
   return available.map(m=>{
     const name=m.shortcut&&available.length>1?' · 지름길':!m.shortcut?' · 바깥길':'';
     return '<button type="button" class="choice-button" data-action="soloYutMove" data-index="'+i+'" data-shortcut="'+(m.shortcut?'1':'0')+'">'+(i+1)+'번 말'+name+'</button>';
   }).join('');
 }).join('');
 const status='<div class="game-topline"><span class="stage-badge">🐱 나 vs 고양이 · 윷놀이</span>'+(s.turn==='player'&&!s.finished?timeBar(s.deadline,s.timeSeconds):'')+'<span class="time-badge">'+esc(s.rollName||'윷을 던지세요')+'</span></div>';
 const count='<div class="cat-yut-players"><span>🔴 나: '+s.pieces.player.filter(p=>p.done).length+'/4 완주</span><span>🔵 🐱 고양이: '+s.pieces.ai.filter(p=>p.done).length+'/4 완주</span></div>';
 const message='<div class="game-prompt"><strong>'+esc(s.msg)+'</strong></div>';
 let controls='';
 if(!s.finished&&s.turn==='player'){
   controls=s.pending===null?btn('soloYutRoll','🎲 윷 던지기','button-primary'):'<div class="yut-roll-result">'+esc(s.rollName)+'! 말을 선택하세요.</div><div class="yut-token-list">'+choices+'</div>';
 }else if(!s.finished)controls='<p class="game-note">🐱 고양이가 윷을 던지고 수를 고르고 있어요.</p>';
 const explain='<p class="game-note">지름길·업기·잡기가 적용됩니다. 고양이는 조금 더 전략적으로 두고 윷 운도 약간 좋아요.</p>';
 const history='<div class="cat-yut-history">'+s.history.slice(-5).reverse().map(h=>'<div>'+esc(h)+'</div>').join('')+'</div>';
 return status+count+message+board+'<div class="yut-controls central">'+controls+explain+'</div>'+history;
}
