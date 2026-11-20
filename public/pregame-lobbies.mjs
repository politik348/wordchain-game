// Moyeo pre-game experience. Rendering-only module; game logic remains in existing engines.
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette={
 omok:{a:'#ffedf1',b:'#fff8e5',ink:'#6a4051',name:'돌들의 작은 대결',tag:'FIVE IN A ROW'},
 yut:{a:'#e3f5e8',b:'#fff6da',ink:'#346e63',name:'숲속 전통 놀이',tag:'YUTNORI FESTIVAL'},
 wordchain:{a:'#e1efff',b:'#fce8f8',ink:'#4d668b',name:'말랑말랑 글자 여행',tag:'WORD ADVENTURE'},
 rummikub:{a:'#e6f8ed',b:'#fff1ce',ink:'#4a776b',name:'숫자 친구들의 다과회',tag:'TILE PARTY'},
 mafia:{a:'#efe8ff',b:'#ffe6ee',ink:'#605387',name:'달빛 가면 파티',tag:'SECRET NIGHT'},
 doodle:{a:'#ffe4ed',b:'#fff6dc',ink:'#9b507b',name:'무지개 미술 공방',tag:'DRAWING STUDIO'},
 liar:{a:'#e5efff',b:'#e9f3f0',ink:'#4a6089',name:'수상한 탐정 사무소',tag:'SECRET DETECTIVE'},
 bell:{a:'#fff0ce',b:'#ffe4e2',ink:'#906644',name:'도깨비의 종소리',tag:'BELL CARNIVAL'},
 tetris:{a:'#ffe6d8',b:'#e5e6ff',ink:'#7c567d',name:'폭신폭신 블록 마을',tag:'BLOCK PARADE'},
 logic:{a:'#e1f4ff',b:'#e8f9ea',ink:'#467b88',name:'픽셀 그림 연구소',tag:'PIXEL STUDIO'},
 gamehell:{a:'#e9dcff',b:'#ffe6e1',ink:'#665184',name:'별조각 아케이드',tag:'STAR ARCADE'},
 marble:{a:'#ffe7ed',b:'#fff3db',ink:'#8d5574',name:'말랑한 도시 여행',tag:'SWEET MARBLE'}
};
const dot=(x,y,r,fill,opacity='1')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" opacity="'+opacity+'"/>';
const rect=(x,y,w,h,rad,fill,stroke='none',sw=0)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rad+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
const text=(x,y,size,str,color='#4b4665',weight=900)=>'<text x="'+x+'" y="'+y+'" font-family="system-ui,sans-serif" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'" text-anchor="middle">'+E(str)+'</text>';
const smile=(x,y,scale=1)=>'<g transform="translate('+x+' '+y+') scale('+scale+')">'+dot(-17,-4,4,'#56465b')+dot(17,-4,4,'#56465b')+dot(-30,15,8,'#f59fa9','.6')+dot(30,15,8,'#f59fa9','.6')+'<path d="M-9 13 Q0 24 9 13" fill="none" stroke="#6a4b64" stroke-width="4" stroke-linecap="round"/></g>';
const star=(x,y,s=15)=>'<path d="M'+x+' '+(y-s)+' Q'+(x+s*.22)+' '+(y-s*.2)+' '+(x+s)+' '+y+' Q'+(x+s*.2)+' '+(y+s*.22)+' '+x+' '+(y+s)+' Q'+(x-s*.18)+' '+(y+s*.18)+' '+(x-s)+' '+y+' Q'+(x-s*.2)+' '+(y-s*.2)+' '+x+' '+(y-s)+'Z" fill="#fff7a7" stroke="#e9c787" stroke-width="1.5"/>';
function animal(x,y,color='#ffe4a4',size=1,shape='cat',extras=''){
 const ears=shape==='rabbit'?'<ellipse cx="-43" cy="-74" rx="21" ry="59" fill="'+color+'" stroke="#8d7291" stroke-width="4"/><ellipse cx="43" cy="-74" rx="21" ry="59" fill="'+color+'" stroke="#8d7291" stroke-width="4"/><ellipse cx="-43" cy="-77" rx="10" ry="43" fill="#ffc4c3"/><ellipse cx="43" cy="-77" rx="10" ry="43" fill="#ffc4c3"/>':shape==='bear'?dot(-47,-51,23,color)+dot(47,-51,23,color):'<path d="M-69 -34 L-59 -100 L-12 -66 L30 -66 L62 -99 L73 -29" fill="'+color+'" stroke="#8d7291" stroke-width="5" stroke-linejoin="round"/>';
 return '<g class="pg-character" transform="translate('+x+' '+y+') scale('+size+')">'+dot(0,87,78,'#8e7590','.13')+ears+'<ellipse cx="0" cy="3" rx="79" ry="72" fill="'+color+'" stroke="#8d7291" stroke-width="5"/>'+smile(0,5,1.05)+'<ellipse cx="-39" cy="66" rx="27" ry="16" fill="'+color+'" stroke="#8d7291" stroke-width="4"/><ellipse cx="39" cy="66" rx="27" ry="16" fill="'+color+'" stroke="#8d7291" stroke-width="4"/>'+extras+'</g>';
}
const stone=(x,y,fill,stroke)=>'<g class="pg-character">'+dot(x+3,y+13,64,'#756c80','.13')+dot(x,y,60,fill)+'<circle cx="'+x+'" cy="'+y+'" r="59" fill="none" stroke="'+stroke+'" stroke-width="6"/>'+dot(x-21,y-8,4,stroke)+dot(x+19,y-8,4,stroke)+'<path d="M'+(x-13)+' '+(y+12)+' Q'+x+' '+(y+25)+' '+(x+13)+' '+(y+12)+'" fill="none" stroke="'+stroke+'" stroke-width="4" stroke-linecap="round"/>'+dot(x-32,y+18,10,'#ffafbb','.7')+dot(x+30,y+18,10,'#ffafbb','.7')+'</g>';
function scene(id){
 const stars=star(45,35,12)+star(467,57,13)+star(416,231,9)+dot(72,230,7,'#fff','.9')+dot(442,153,5,'#fff','.9');
 let a='';
 switch(id){
 case 'omok':a='<path d="M65 210 L430 210 M65 157 L430 157 M65 105 L430 105 M138 75 L138 250 M249 75 L249 250 M360 75 L360 250" stroke="#d9b69f" stroke-width="5" opacity=".65"/>'+stone(177,151,'#45465c','#292e44')+stone(336,162,'#fffbf2','#a6a0b4')+star(255,60,18);break;
 case 'yut':a=animal(182,164,'#fce6bd',.94,'rabbit','<path d="M-69 57 Q0 22 69 57 L72 89 L-72 89Z" fill="#9ddaca"/><path d="M0 30 V90" stroke="#fff" stroke-width="6"/><path d="M-30 41 L31 90 M30 41 L-31 90" stroke="#fff" stroke-width="4"/>')+'<g transform="translate(354 132) rotate(16)">'+[-35,-12,11,34].map((x,i)=>rect(x,-70,18,138,9,i%2?'#f4c492':'#fce1b4','#b48b79',3)+rect(x+4,-58,10,46,5,'#fff4d8')).join('')+'</g>'+star(345,39,17);break;
 case 'wordchain':a=animal(186,164,'#f9d9a6',.91,'cat','')+rect(265,109,67,78,13,'#ffe1eb','#e5abbc',4)+rect(337,91,67,78,13,'#c9e7ff','#b4c7e9',4)+text(298,165,42,'가','#b74b70')+text(370,149,42,'나','#407cba')+star(387,37,17);break;
 case 'rummikub':a='<ellipse cx="280" cy="255" rx="195" ry="29" fill="#dcb6a6" opacity=".5"/>'+[1,2,3,4].map((v,i)=>{const x=89+i*87,y=80+(i%2)*20;return '<g class="pg-character">'+rect(x,y,75,122,15,['#ffe4ed','#e0f5eb','#dceaff','#fff0cc'][i],'#9d8ca4',4)+text(x+37,y+61,47,v,['#d3618c','#47a893','#588ac8','#d19a46'][i])+smile(x+37,y+83,.45)+'</g>';}).join('');break;
 case 'mafia':a='<circle cx="376" cy="80" r="61" fill="#fff2c9"/>'+animal(190,166,'#e9d9ff',.91,'rabbit','<path d="M-75 -15 Q0 -60 75 -15 L66 10 Q0 -8 -66 10Z" fill="#615887"/>'+dot(-25,-10,9,'#fff')+dot(25,-10,9,'#fff'))+animal(344,186,'#ffdfb9',.73,'cat','<path d="M-69 -17 Q0 -48 69 -17 L61 11 Q0 -10 -61 11Z" fill="#7e719d"/>')+star(97,68,14);break;
 case 'doodle':a=animal(168,169,'#ffd5bb',.92,'bear','<path d="M-62 -56 Q-25 -120 33 -105 Q60 -95 54 -66Z" fill="#ac8edc"/>')+'<rect x="271" y="56" width="166" height="170" rx="13" fill="#fffefb" stroke="#b9a8b9" stroke-width="8"/>'+dot(354,119,34,'#f6b2c3')+dot(328,175,20,'#9edcc8')+dot(380,173,27,'#f6d685')+'<path d="M212 199 L321 110" stroke="#8c5e56" stroke-width="11" stroke-linecap="round"/>'+dot(324,108,12,'#ed8cbd');break;
 case 'liar':a=animal(190,172,'#f7d6b2',.91,'cat','<path d="M-83 -77 Q0 -157 88 -76 L64 -46 L-64 -46Z" fill="#859cba"/>'+rect(-93,-54,184,16,8,'#60799f'))+'<path d="M324 168 L402 251" stroke="#a07863" stroke-width="19" stroke-linecap="round"/><circle cx="312" cy="146" r="56" fill="#d5e7ff" fill-opacity=".54" stroke="#6f8ab0" stroke-width="13"/>'+text(315,156,24,'?','#7892af')+star(423,69,20);break;
 case 'bell':a=animal(172,178,'#fde0c1',.87,'rabbit','')+'<g class="pg-character"><path d="M297 166 Q307 109 355 109 Q405 109 414 166 L433 202 Q355 219 280 202Z" fill="#ffca69" stroke="#cd9455" stroke-width="7"/>'+dot(355,111,9,'#cf9855')+dot(355,211,15,'#ef9f57')+smile(355,174,.7)+'</g>'+star(446,62,15);break;
 case 'tetris':a=[['#9bd9ed',110,151],['#ffb8ba',179,151],['#ffdd86',248,151],['#baaaf2',214,84],['#91dab8',283,84],['#ffbdb1',352,151]].map(([col,x,y],i)=>'<g class="pg-character">'+rect(x,y,66,66,13,col,'#907d9d',4)+smile(x+33,y+36,.36)+'</g>').join('')+'<path d="M90 238 H441" stroke="#c1a6a5" stroke-width="9" stroke-linecap="round"/>'+star(402,76,19);break;
 case 'logic':{let pixels=['001110000','011111000','111111100','111111100','011111000','001110000','000100000'];a='<g transform="translate(130 30)">'+pixels.map((row,y)=>[...row].map((ch,x)=>rect(x*37,y*33,34,30,5,ch==='1'?'#fa9fbc':'#f8fdff',ch==='1'?'#db769f':'#c7ddec',2)).join('')).join('')+'</g>'+animal(398,186,'#ffe4b9',.47,'cat','')+star(66,90,15);break;}
 case 'gamehell':a=animal(176,152,'#f9d0a4',.86,'cat','<path d="M-71 43 Q0 10 70 43 L90 93 H-89Z" fill="#c8a4ee"/>')+'<path d="M296 187 Q338 74 396 185 Q350 160 296 187Z" fill="#f4c0de" stroke="#d69bc6" stroke-width="5"/>'+[ [310,100],[406,96],[374,213] ].map(([x,y])=>star(x,y,21)).join('')+rect(291,199,119,16,8,'#ba9bd5');break;
 default:a=animal(188,166,'#ffe2bc',.9,'rabbit','')+animal(347,174,'#fbd6a7',.8,'cat','');
 }
 return '<svg class="pg-art-svg" viewBox="0 0 520 290" role="img" aria-label="'+E((palette[id]||palette.marble).name)+' 캐릭터 일러스트" xmlns="http://www.w3.org/2000/svg"><ellipse cx="267" cy="258" rx="210" ry="22" fill="#8f6d93" opacity=".1"/><path d="M63 220 Q31 95 138 75 Q246 -1 349 41 Q480 65 471 201 Q437 279 295 266 L114 262Z" fill="#fff" opacity=".4"/>'+stars+a+'</svg>';
}
const modeDescriptions={
 cat:{title:'고양이 AI 대결',description:'귀여운 고양이에게 도전!',tag:'VS CAT',art:'cat'},
 online:{title:'친구와 온라인',description:'초대 코드로 함께 모여요',tag:'MULTIPLAYER',art:'online'},
 solo:{title:'혼자 기록 도전',description:'내 최고 기록을 새로 써봐요',tag:'SOLO',art:'solo'},
 local:{title:'한 화면에서 함께',description:'같은 기기로 번갈아 놀아요',tag:'LOCAL',art:'local'}
};
function modeIcon(kind){
 if(kind==='cat')return '<svg viewBox="0 0 64 62" aria-hidden="true"><path d="M11 25L14 6 29 18 37 18 52 6 55 25" fill="#ffdeb6" stroke="#966e8e" stroke-width="3"/><ellipse cx="33" cy="34" rx="26" ry="23" fill="#ffdeb6" stroke="#966e8e" stroke-width="3"/>'+smile(33,34,.32)+'</svg>';
 if(kind==='online')return '<svg viewBox="0 0 64 62" aria-hidden="true">'+dot(20,26,16,'#ffcdcf')+dot(45,26,16,'#b8e0ff')+smile(20,26,.22)+smile(45,26,.22)+rect(2,42,60,12,7,'#ddd2ff')+'</svg>';
 if(kind==='local')return '<svg viewBox="0 0 64 62" aria-hidden="true">'+rect(10,16,44,34,9,'#ffe5a7','#c7a986',3)+dot(20,28,6,'#ef91ad')+dot(44,28,6,'#8ac5c7')+dot(32,41,6,'#b5a4e8')+'</svg>';
 return '<svg viewBox="0 0 64 62" aria-hidden="true">'+star(32,30,22)+dot(25,27,3,'#866889')+dot(39,27,3,'#866889')+'</svg>';
}
export const PRE_GAME_THEMES=palette;
export const renderPregameArt=scene;
export function renderPregame({game,allowedModes=['online'],mode='online',settings=[],rules=[],rooms=[],startAction='lobbyStart',joinAction='openJoin',intro='',backAction='home',showJoin=true}={}){
 const id=game?.id||'wordchain',theme=palette[id]||palette.wordchain,title=E(game?.name||id);
 const safeModes=allowedModes.filter(m=>modeDescriptions[m]);const chosenMode=safeModes.includes(mode)?mode:safeModes[0];
 const modes=safeModes.map(m=>{
  const d=modeDescriptions[m],on=chosenMode===m;
  return '<button type="button" class="pg-mode-card'+(on?' is-active':'')+'" data-pg-mode="'+m+'" aria-pressed="'+on+'"><span class="pg-mode-art">'+modeIcon(m)+'</span><span class="pg-mode-copy"><strong>'+d.title+'</strong><small>'+d.description+'</small><em>'+d.tag+'</em></span><span class="pg-check">'+(on?'✓':'')+'</span></button>';
 }).join('');
 const controls=settings.length?settings.map(entry=>{
  const curr=String(entry.value??'');
  const choices=entry.choices.map(choice=>{
   const selected=String(choice.value)===curr;
   return '<button type="button" class="pg-option'+(selected?' is-active':'')+(entry.large?' pg-option-large':'')+'" data-pg-setting="'+E(entry.key)+'" data-pg-value="'+E(choice.value)+'" aria-pressed="'+selected+'"><strong>'+E(choice.label)+'</strong>'+(choice.description?'<small>'+E(choice.description)+'</small>':'')+'<i aria-hidden="true">'+(selected?'✓':'')+'</i></button>';
  }).join('');
  return '<div class="pg-setting"><div class="pg-setting-label"><strong>'+E(entry.label)+'</strong>'+(entry.hint?'<small>'+E(entry.hint)+'</small>':'')+'</div><div class="pg-options'+(entry.large?' pg-options-major':'')+'">'+choices+'</div></div>';
 }).join(''):'<div class="pg-no-settings"><b>준비 완료!</b><p>이 게임은 추가 옵션 없이 기본 규칙으로 시작해요.</p></div>';
 const startLabel=chosenMode==='cat'?'고양이와 대결 시작':chosenMode==='online'?'온라인 게임방 만들기':chosenMode==='local'?'친구들과 시작하기':'혼자 도전 시작';
 const guides=(rules||[]).slice(0,3).map(([head,desc],i)=>'<article class="pg-guide"><div class="pg-guide-number">0'+(i+1)+'</div><div><h3>'+E(head)+'</h3><p>'+E(desc)+'</p></div></article>').join('');
 const roomItems=chosenMode==='online'&&rooms.length?'<section class="pg-rooms"><div class="pg-minititle">열려 있는 게임방</div><div class="pg-room-list">'+rooms.slice(0,4).map(r=>'<button type="button" data-join="'+E(r.id)+'" class="pg-room-card"><b>'+E(r.id)+'</b><small>방장 '+E(r.host||'플레이어')+'</small><span>'+E(r.count)+' / '+E(r.max)+'명 ↗</span></button>').join('')+'</div></section>':'';
 return '<div class="pg-page pg-'+id+'" style="--pg-a:'+theme.a+';--pg-b:'+theme.b+';--pg-ink:'+theme.ink+'">'+
 '<nav class="pg-crumb"><button type="button" data-action="'+E(backAction)+'">← 게임 목록</button><span>MOYEO GAMES</span><span>/</span><b>'+title+'</b></nav>'+
 '<section class="pg-hero"><div class="pg-hero-copy"><span class="pg-eyebrow">✦ '+E(theme.tag)+' · MOYEO GAMES</span><h1>'+title+'<span class="pg-hero-spark">✦</span></h1><p>'+E(intro||game?.desc||'나만의 작은 게임 세상에서 신나는 모험을 시작하세요.')+'</p><div class="pg-hero-badges"><span>✧ 전용 캐릭터</span><span>◈ '+E(game?.badge||'게임 시작')+'</span><span>♡ 기분 좋은 한 판</span></div></div><div class="pg-art-wrap">'+scene(id)+'</div></section>'+
 '<section class="pg-config"><header class="pg-config-heading"><span>GAME SETUP</span><h2>어떤 모험을 시작할까?</h2><p>상대와 규칙을 고르면 준비 끝! 설정은 게임별로 기억해 둘게요.</p></header>'+
 '<div class="pg-config-grid"><section class="pg-config-panel"><div class="pg-column-title"><span class="pg-column-number">01</span><div><h3>누구와 플레이할까요?</h3><p>이 게임이 실제로 지원하는 방법만 표시해요.</p></div></div><div class="pg-modes">'+modes+'</div><div class="pg-mascot-tip"><span class="pg-tip-dot">♡</span><p>'+(chosenMode==='online'?'친구와 온라인으로 즐기려면 로그인한 다음 방을 만들어요.':chosenMode==='cat'?'고양이가 준비하고 있어요. 이번에는 이길 수 있을까요?':'천천히 시작해요. 새로운 기록이 기다리고 있어요!')+'</p></div></section>'+
 '<section class="pg-config-panel"><div class="pg-column-title"><span class="pg-column-number">02</span><div><h3>게임 규칙을 정해볼까요?</h3><p>실제로 작동하는 게임 옵션만 선택할 수 있어요.</p></div></div><div class="pg-settings">'+controls+'</div></section></div>'+
 '<div class="pg-launch"><div><strong>✦ '+E(modeDescriptions[chosenMode]?.title||'게임 시작')+'</strong><small>선택한 설정으로 새 게임을 시작합니다.</small></div><button type="button" class="pg-launch-button" data-action="'+E(startAction)+'">'+E(startLabel)+' <span aria-hidden="true">↗</span></button></div>'+
 (showJoin&&chosenMode==='online'?'<div class="pg-join"><span>친구에게 이미 방 코드를 받았나요?</span><button data-action="'+E(joinAction)+'" type="button">초대받은 방 입장하기 ↗</button></div>':'')+
 '</section>'+roomItems+'<section class="pg-guide-section"><div class="pg-section-heading"><span>HOW TO PLAY</span><h2>세 가지만 기억해요</h2></div><div class="pg-guides">'+guides+'</div></section></div>';
}
