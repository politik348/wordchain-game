/* Shared Cat Challenge results, also used by standalone game pages. */
(function(global){
 'use strict';
 const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function render({game='고양이 대전',outcome='draw',summary='',stats=[],score=null,actions=''}={}){
  const state=['cat','player','draw'].includes(outcome)?outcome:'draw';
  const headline=state==='cat'?'고양이 승리!':state==='player'?'고양이 패배!':'무승부!';
  const reaction=state==='cat'?'흥, 나한테 이기려면 더 연습해봐!':state==='player'?'으으… 다음에는 꼭 이길 거야!':'이번엔 비겼네. 다음 판은 승부를 내자!';
  const photo=state==='cat'?'웃으며 비웃는 고양이':state==='player'?'풀이 죽은 고양이':'고양이 캐릭터';
  const statCards=(stats||[]).filter(row=>row&&row.label!==undefined&&row.value!==undefined&&row.value!==null).slice(0,8)
   .map(row=>'<div class="cat-final-stat"><small>'+escapeHtml(row.label)+'</small><strong>'+escapeHtml(row.value)+'</strong></div>').join('');
  const scoreHtml=score?'<div class="cat-final-score" aria-label="경기 점수"><span>나 <b>'+escapeHtml(score.player)+'</b></span><strong>:</strong><span><b>'+escapeHtml(score.cat)+'</b> 고양이</span></div>':'';
  return '<section class="cat-final cat-final--'+state+'" role="status" aria-label="고양이 대전 종료">'+
   '<div class="cat-final-photo cat-final-photo--'+state+'" role="img" aria-label="'+photo+'"></div>'+
   '<div class="cat-final-content"><span class="cat-final-kicker">MATCH RESULT · '+escapeHtml(game)+'</span>'+
   '<h2>'+headline+'</h2><p class="cat-final-taunt">'+escapeHtml(reaction)+'</p>'+
   (summary?'<p class="cat-final-summary">'+escapeHtml(summary)+'</p>':'')+
   scoreHtml+(statCards?'<div class="cat-final-statgrid">'+statCards+'</div>':'')+
   (actions?'<div class="cat-final-actions">'+actions+'</div>':'')+
   '</div></section>';
 }
 function overlay(content,{closeAction='catResultDismiss'}={}){
  return '<div class="cat-result-overlay" role="dialog" aria-modal="true" aria-label="경기 종료 결과">'+
   '<div class="cat-result-dialog"><button type="button" class="cat-result-close" data-action="'+escapeHtml(closeAction)+'" aria-label="결과창 닫고 게임판 보기">×</button>'+
    content+'</div></div>';
 }
 global.MoyeoCatResult={render,overlay};
})(window);
