// Standalone pre-game pages for Tetris, Nonogram and the 13 Arcade minigames.
// The overlay is a separate pre-game route phase; it calls the original game engines on Start.
import {renderPregame} from './pregame-lobbies.mjs?v=20261120catlevels1';
const arcadeModes=[
 ['drill','낙하대작전'],['hurdle','폴짝도로'],['cloud','구름사다리'],
 ['flight','로켓고양이'],['shooter','별뿅대전'],['swim','바다냥냥'],
 ['ice','얼음지그재그'],['orbit','빙빙궤도'],['dash','번개질주'],
 ['tower','높이솟아'],['slalom','숲길슬라럼'],['balloon','풍선탈출'],['chain','찰싹친구들']
];
const defs={
 tetris:{id:'tetris',name:'모여 테트리스',desc:'알록달록 블록 친구들을 쌓으며 새로운 기록을 세워요!',badge:'클래식 퍼즐',rules:[
  ['블록을 이동해요','방향키로 이동하고 위쪽 방향키 또는 X로 회전해요.'],
  ['줄을 지워요','빈칸 없이 가로 한 줄을 완성하면 점수가 올라가요.'],
  ['떨어뜨려요','스페이스바로 블록을 즉시 떨어뜨릴 수 있어요.']
 ]},
 logic:{id:'logic',name:'모여로직',desc:'숫자 힌트를 하나씩 풀어 숨겨진 픽셀 그림을 찾아요!',badge:'그림 도감',rules:[
  ['숫자를 읽어요','가로·세로 힌트는 이어서 색칠할 칸의 개수를 알려줘요.'],
  ['빈칸도 표시해요','칸을 색칠하거나 X를 표시해 그림을 완성하세요.'],
  ['그림을 모아요','완성한 그림은 이 브라우저의 도감에 기록돼요.']
 ]},
 gamehell:{id:'gamehell',name:'모여게임지옥',desc:'귀여운 캐릭터와 13가지 미니게임! 별조각을 모아 최고의 기록에 도전하세요.',badge:'13종 아케이드',rules:[
  ['13가지 놀이','좋아하는 미니게임을 고르고 시작해요.'],
  ['기록 도전','순발력과 집중력으로 개인 최고 점수를 높여요.'],
  ['캐릭터 수집','별조각을 모으면 상점에서 새 친구를 만날 수 있어요.']
 ]}
};
function restore(key,defaults,valid){
 let value={...defaults};
 try{const loaded=JSON.parse(localStorage.getItem('moyeo-pregame-'+key)||'{}');
  for(const [k,options] of Object.entries(valid))if(options.includes(String(loaded?.[k])))value[k]=String(loaded[k]);
 }catch{}
 return value;
}
function main(){
 const game=location.pathname.startsWith('/tetris/')?'tetris':location.pathname.startsWith('/logic/')?'logic':location.pathname.startsWith('/gamehell/')?'gamehell':null;
 if(!game)return;
 if(game==='gamehell'&&new URLSearchParams(location.search).get('trial')==='1')return; // The Cat taste route has a compact in-game starter.
 const cat=game==='tetris'&&new URLSearchParams(location.search).get('cat')==='1';
 const defaults=game==='tetris'?{difficulty:'normal',aiDifficulty:'beginner'}:game==='logic'?{size:'5'}:{minigame:'drill',duration:'45'};
 const valid=game==='tetris'?{difficulty:['easy','normal','hard'],aiDifficulty:['beginner','intermediate','advanced']}:game==='logic'?{size:['5','10','15']}:{minigame:arcadeModes.map(x=>x[0]),duration:['45','90','0']};
 const values=restore(game,defaults,valid);
 const allowedModes=game==='tetris'?[cat?'cat':'solo']:['solo'];
 const config=defs[game];
 const mode=allowedModes[0];
 const shell=document.createElement('div');
 shell.className='pg-standalone-shell';shell.id='pgStandaloneShell';
 document.body.append(shell);
 document.body.classList.add('pg-standalone-open');
 let started=false;
 function groups(){
  if(game==='tetris')return [{key:'difficulty',label:'블록 낙하 속도',hint:'실제 떨어지는 속도에 반영돼요',value:values.difficulty,large:true,choices:[
    {value:'easy',label:'느긋하게',description:'여유롭게 연습하고 싶을 때'},
    {value:'normal',label:'기본 속도',description:'처음 시작할 때 추천'},
    {value:'hard',label:'빠른 도전',description:'더 빠르게 떨어지는 블록'}
   ]}];
  if(game==='logic')return [{key:'size',label:'퍼즐 크기 · 난이도',hint:'실제 퍼즐 크기로 시작해요',value:values.size,large:true,choices:[
    {value:'5',label:'5 × 5 · 입문',description:'가장 쉬운 그림'},
    {value:'10',label:'10 × 10 · 보통',description:'한 단계 더 생각해요'},
    {value:'15',label:'15 × 15 · 도전',description:'큰 그림을 완성해요'}
   ]}];
  return [{key:'minigame',label:'미니게임 선택',hint:'13개 중 하나를 고르세요',value:values.minigame,choices:arcadeModes.map(([value,label])=>({value,label}))},
    {key:'duration',label:'플레이 시간',hint:'실제 게임의 제한시간을 설정해요',value:values.duration,large:true,choices:[
     {value:'45',label:'45초',description:'짧고 짜릿한 한 판'},
     {value:'90',label:'90초',description:'차분하게 기록 도전'},
     {value:'0',label:'서바이벌',description:'시간제한 없이 도전'}
    ]}];
 }
 function render(){
  shell.innerHTML='<div class="pg-standalone-topbar"><a href="'+(cat?'/?cat=1':'/')+'">✳ 모여게임즈로 돌아가기</a><span>YOUR NEXT ADVENTURE · GAME SETUP</span></div>'+
    renderPregame({game:config,allowedModes,mode,aiDifficulty:values.aiDifficulty||'beginner',settings:groups(),rules:config.rules,startAction:'pgStart',showJoin:false,backAction:'home'});
 }
 function activate(){
  if(started)return;
  if(game==='tetris'){
   if(typeof window.MOYEO_TETRIS_START!=='function')return;
   window.MOYEO_TETRIS_START({mode:cat?'versus':'solo',difficulty:values.difficulty,aiDifficulty:values.aiDifficulty||'beginner'});
  }else if(game==='logic'){
   const size=document.getElementById('size');
   if(!size)return;
   size.value=values.size;
   size.dispatchEvent(new Event('change',{bubbles:true}));
  }else{
   const choice=document.querySelector('#gameGrid [data-game="'+values.minigame+'"]');
   const duration=document.querySelector('.duration[data-duration="'+values.duration+'"]');
   if(!choice||!duration)return;
   choice.click();duration.click();
   const button=document.getElementById('startButton');
   if(!button)return;
   button.click();
  }
  started=true;
  shell.hidden=true;
  document.body.classList.remove('pg-standalone-open');
  if(game==='gamehell')document.querySelector('.play-column')?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 shell.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.pgDifficulty&&cat&&valid.aiDifficulty?.includes(b.dataset.pgDifficulty)){
   values.aiDifficulty=b.dataset.pgDifficulty;
   try{localStorage.setItem('moyeo-pregame-'+game,JSON.stringify(values));}catch{}
   render();
  }else if(b.dataset.pgSetting){
   const key=b.dataset.pgSetting,value=b.dataset.pgValue;
   if(!valid[key]?.includes(value))return;
   values[key]=value;
   try{localStorage.setItem('moyeo-pregame-'+game,JSON.stringify(values));}catch{}
   render();
  }else if(b.dataset.action==='pgStart')activate();
 });
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',main,{once:true});
else main();
