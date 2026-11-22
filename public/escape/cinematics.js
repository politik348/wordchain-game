/* Episode 01 cinematic director. No dependencies; safe fallback when unavailable. */
(function(){
 'use strict';
 const stage=document.getElementById('escapeCinematic');
 if(!stage)return;
 const portrait='miro-avatar.webp?v=20261122';
 const rooms={
  foyer:{title:'현관 홀',eyebrow:'멈춰 버린 시간',subtitle:'문이 닫힌 자리에서 새로운 이야기가 시작된다.',accent:'gold',miro:false},
  study:{title:'달빛 서재',eyebrow:'지워진 기록',subtitle:'책장 사이에서 오래된 기억이 흔들린다.',accent:'violet',miro:true},
  greenhouse:{title:'유리 온실',eyebrow:'잊어버린 약속',subtitle:'유리문 너머에서 꽃향기가 흘러온다.',accent:'green',miro:false},
  tower:{title:'시계탑',eyebrow:'마지막 종소리',subtitle:'멈춰 있던 톱니가 다시 움직일 준비를 한다.',accent:'amber',miro:true}
 };
 const puzzles={
  books:{title:'서가가 움직인다',subtitle:'오래된 책장이 길을 열었다.',symbol:'▤',kind:'pages',miro:false},
  mirror:{title:'달이 온전해진다',subtitle:'아홉 번 꺾인 빛이 마지막 홈에 닿는다.',symbol:'☾',kind:'beam',miro:false},
  piano:{title:'기억 속의 자장가',subtitle:'멈춰 있던 선율이 다시 울린다.',symbol:'♫',kind:'notes',miro:true},
  water:{title:'온실에 물이 흐른다',subtitle:'말라 있던 수로에서 물소리가 들린다.',symbol:'◉',kind:'water',miro:false},
  light:{title:'달빛꽃이 피어난다',subtitle:'작은 빛들이 한 송이의 꽃이 된다.',symbol:'✿',kind:'bloom',miro:false},
  clock:{title:'시계바늘이 움직인다',subtitle:'먼지 쌓인 톱니가 맞물리기 시작한다.',symbol:'◷',kind:'gears',miro:false},
  pin:{title:'열세 번째 종',subtitle:'끝나지 않았던 종소리가 저택을 깨운다.',symbol:'♧',kind:'bell',miro:true}
 };
 const endings={
  normal:{title:'다시 흐르는 시간',kind:'dawn',symbol:'☀',lines:['시계의 바늘이 다시 움직인다.','달빛은 서서히 아침 햇살로 바뀐다.','미로는 빈 의자 곁에서 누군가를 기다린다.']},
  true:{title:'잊히지 않은 이름',kind:'reunion',symbol:'✦',lines:['사진과 일기, 목걸이의 기억이 포개진다.','열세 번째 종의 봉인이 풀린다.','미로는 마침내 루나의 이름을 기억한다.']},
  stay:{title:'멈춰 있는 약속',kind:'midnight',symbol:'☾',lines:['당신은 마지막 봉인을 그대로 두기로 한다.','저택에는 다시 고요한 자정이 찾아온다.','미로는 곁에 남아 준 당신을 바라본다.']}
 };
 let current=null;
 let timeouts=[];
 let priorFocus=null;
 const reduced=()=>{
  try{return !!window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}
 };
 function timer(fn,ms){timeouts.push(setTimeout(fn,ms))}
 function clearTimers(){for(const t of timeouts)clearTimeout(t);timeouts=[]}
 function miroMarkup(){return '<div class="escape-cinema-miro" aria-hidden="true"><img src="'+portrait+'" alt="" decoding="async"></div>'}
 function stars(){return '<div class="escape-cinema-stars" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i></div>'}
 function start(options){
  if(current)finish();
  const task={...options,midDone:false};
  if(reduced()){
   if(task.onMidpoint)task.onMidpoint();
   if(task.onFinish)task.onFinish();
   return true;
  }
  priorFocus=document.activeElement;
  current=task;
  stage.hidden=false;
  stage.className='escape-cinema escape-cinema--'+options.type+' escape-cinema--'+options.variant+(options.fast?' escape-cinema--fast':'');
  stage.setAttribute('aria-label',options.label||'장면 연출');
  stage.innerHTML=options.markup+'<button type="button" class="escape-cinema-skip" data-cinema-skip>건너뛰기 <span aria-hidden="true">»</span></button>';
  const skip=stage.querySelector('[data-cinema-skip]');
  if(skip)skip.focus();
  if(task.onMidpoint)timer(()=>{if(current!==task||task.midDone)return;task.midDone=true;task.onMidpoint()},options.midpoint||Math.round(options.duration/2));
  timer(()=>{if(current===task)finish()},options.duration);
  return true;
 }
 function finish(){
  const task=current;
  if(!task)return;
  current=null;
  clearTimers();
  stage.hidden=true;
  stage.className='escape-cinema';
  stage.innerHTML='';
  stage.removeAttribute('aria-label');
  if(!task.midDone&&task.onMidpoint){task.midDone=true;task.onMidpoint()}
  if(task.onFinish)task.onFinish();
  if(priorFocus&&document.contains(priorFocus)&&typeof priorFocus.focus==='function'&&!document.querySelector('#modalOverlay:not(.hidden)')){
   try{priorFocus.focus({preventScroll:true})}catch(_){}
  }
  priorFocus=null;
 }
 function roomMarkup(chapter,firstVisit){
  return '<div class="escape-cinema-space" aria-hidden="true">'+stars()+
   '<div class="escape-cinema-moon"></div><div class="escape-cinema-door escape-cinema-door--left"></div><div class="escape-cinema-door escape-cinema-door--right"></div>'+
   '<div class="escape-cinema-doorbeam"></div></div>'+
   (firstVisit&&chapter.miro?miroMarkup():'')+
   '<div class="escape-cinema-copy"><small>MOYEO · ROOM TRANSITION</small><h2>'+chapter.title+'</h2>'+
   (firstVisit?'<p>'+chapter.subtitle+'</p>':'<p>다시 '+chapter.title+'(으)로</p>')+'</div>';
 }
 function playRoom({from,to,firstVisit,onMidpoint,onFinish}){
  if(!Object.hasOwn(rooms,to))return false;
  const chapter=rooms[to];
  return start({type:'room',variant:chapter.accent,fast:!firstVisit,label:chapter.title+'로 이동 중',
   duration:firstVisit?2750:720,midpoint:firstVisit?1150:310,
   markup:roomMarkup(chapter,firstVisit),onMidpoint,onFinish});
 }
 function playPuzzle({key,onFinish}){
  const item=puzzles[key];
  if(!item)return false;
  const markup='<div class="escape-cinema-space" aria-hidden="true">'+stars()+
   '<div class="escape-cinema-puzzle-symbol escape-cinema-puzzle-symbol--'+item.kind+'">'+item.symbol+'</div>'+
   '<div class="escape-cinema-pulse"></div></div>'+
   (item.miro?miroMarkup():'')+
   '<div class="escape-cinema-copy"><small>장치가 깨어났다</small><h2>'+item.title+'</h2><p>'+item.subtitle+'</p></div>';
  return start({type:'puzzle',variant:item.kind,label:item.title,duration:key==='pin'?2600:1750,markup,onFinish});
 }
 function endingMarkup(item){
  const lines=item.lines.map((line,i)=>'<p class="escape-cinema-ending-line escape-cinema-ending-line--'+i+'">'+line+'</p>').join('');
  return '<div class="escape-cinema-space" aria-hidden="true">'+stars()+
   '<div class="escape-cinema-ending-moon">'+item.symbol+'</div>'+
   '<div class="escape-cinema-ending-arc"></div><div class="escape-cinema-ending-ring"></div>'+
   '<div class="escape-cinema-ending-figure"></div></div>'+
   miroMarkup()+
   '<div class="escape-cinema-copy escape-cinema-ending-copy"><small>EPISODE 01 · THE THIRTEENTH BELL</small><h2>'+item.title+'</h2>'+
   '<div class="escape-cinema-ending-lines">'+lines+'</div></div>';
 }
 function playEnding({id,onFinish}){
  if(!Object.hasOwn(endings,id))return false;
  const item=endings[id];
  return start({type:'ending',variant:item.kind,label:item.title+' 엔딩 컷신',
   duration:8700,markup:endingMarkup(item),onFinish});
 }
 stage.addEventListener('click',e=>{if(e.target.closest('[data-cinema-skip]'))finish()});
 document.addEventListener('keydown',e=>{
  if(!current)return;
  if(e.key==='Escape'){e.preventDefault();finish()}
  else if(e.key==='Tab'){e.preventDefault();stage.querySelector('[data-cinema-skip]')?.focus()}
 });
 window.MoyeoEscapeCutscenes={playRoom,playPuzzle,playEnding,skip:finish,isPlaying:()=>!!current};
})();