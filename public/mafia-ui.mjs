/** 가면단 v2.0 presentation: only uses fields sanitized by the server. */
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const phaseTitles={night:['🌙','고요한 밤, 비밀 임무','당신의 능력을 사용한 뒤 아침을 기다리세요.'],discussion:['☀️','낮이 밝았습니다','채팅으로 의심되는 사람과 단서를 공유하세요.'],vote:['🗳️','운명의 투표 시간','가장 의심되는 플레이어에게 투표하세요.']};
export function renderMafiaGame(room,me,{host=false,timeBar=()=>'',endBanner=''}={}){
 const s=room.state||{},role=s.role||'시민',info=s.roleInfo||{},alive=(s.alive||[]).includes(me),isNight=s.phase==='night',isVote=s.phase==='vote';
 const [phaseIcon,phaseTitle,phaseDesc]=phaseTitles[s.phase]||['🏆','결과 발표','게임이 종료되었습니다.'];
 const waiting=(s.nightSubmitted||[]).includes(me),voted=(s.votes||[]).includes(me);
 const label=id=>E(room.players.find(p=>p.id===id)?.nick||'플레이어');
 const canAct=room.status==='playing'&&alive&&isNight&&s.canNightAct;
 const targets=(role==='영매'?room.players.filter(p=>!s.alive.includes(p.id)):room.players.filter(p=>s.alive.includes(p.id))).filter(p=>{
  if(role==='마피아'&&(p.id===me||(s.teammates||[]).includes(p.id)))return false;
  if(['경호원','자경단원','기자','사립탐정','스파이','경찰'].includes(role)&&p.id===me)return false;
  return true;
 });
 const targetBtns=targets.map(p=>'<button type="button" class="mafia2-target" data-action="night" data-target="'+E(p.id)+'"'+(waiting?' disabled':'')+'><span class="mafia2-target-icon">'+(s.alive.includes(p.id)?'🎭':'🕯️')+'</span><strong>'+E(p.nick)+'</strong><small>'+(s.alive.includes(p.id)?'선택하기':'사망자')+'</small></button>').join('');
 const votes=room.players.filter(p=>s.alive.includes(p.id)).map(p=>'<button class="mafia2-target" data-action="mafiaVote" data-target="'+E(p.id)+'"'+(voted?' disabled':'')+'><span class="mafia2-target-icon">🗳️</span><strong>'+E(p.nick)+'</strong><small>투표</small></button>').join('')+'<button class="mafia2-target mafia2-abstain" data-action="mafiaVote" data-target="skip"'+(voted?' disabled':'')+'><span class="mafia2-target-icon">☕</span><strong>기권</strong><small>표를 행사하지 않아요</small></button>';
 const dayChat=(s.chat||[]).slice(-22).map(c=>'<div class="mafia2-chat-line"><b>'+E(c.nick)+'</b><span>'+E(c.text)+'</span></div>').join('')||'<p class="mafia2-empty">아직 의견이 없어요. 첫 단서를 공유해 보세요.</p>';
 const teamTalk=(s.mafiaChat||[]).slice(-12).map(c=>'<div class="mafia2-chat-line"><b>'+E(c.nick)+'</b><span>'+E(c.text)+'</span></div>').join('')||'<p class="mafia2-empty">아직 마피아 팀의 메시지가 없어요.</p>';
 const mates=(s.teammates||[]).length?'<div class="mafia2-teammates">마피아 팀 동료: '+s.teammates.map(label).join(', ')+'</div>':'';
 const results=s.investigation?'<div class="mafia2-private-note"><strong>나만 볼 수 있는 단서</strong><p>'+E(s.investigation)+'</p></div>':'';
 const reports=(s.publicReports||[]).slice(-3).map(x=>'<div class="mafia2-press">📰 '+E(x)+'</div>').join('');
 const finished=room.status==='finished';
 const reveal=finished&&s.allRoles?'<div class="mafia2-roles"><h3>전체 직업 공개</h3><div>'+room.players.map(p=>'<span><b>'+E(p.nick)+'</b> · '+E(s.allRoles[p.id]||'시민')+'</span>').join('')+'</div></div>':'';
 const roleCard='<aside class="mafia2-role-card '+(info.team==='mafia'?'mafia2-evil':'')+'"><div class="mafia2-role-icon">'+E(info.emoji||'🎭')+'</div><div class="mafia2-role-copy"><small>쉿! 나만 보는 비밀 직업</small><h3>'+E(role)+'</h3><span>'+E(info.ability||'비밀 임무')+'</span><p>'+E(info.description||'')+'</p>'+mates+'</div></aside>';
 const pendingNight=isNight&&alive?(!s.canNightAct?'<div class="mafia2-info">이 직업은 이번 밤에 선택할 행동이 없어요. 아침을 기다려 주세요.</div>':waiting?'<div class="mafia2-info is-done">✓ 행동 제출 완료! 다른 플레이어를 기다리고 있어요.</div>':'<div class="mafia2-choice"><h3>'+E(info.ability||'밤 능력')+' · 대상 선택</h3><p>상대방은 당신의 선택을 확인할 수 없어요.</p><div class="mafia2-targets">'+targetBtns+'</div>'+(role!=='마피아'?'<button class="mafia2-pass" type="button" data-action="mafiaPass">이번 밤 능력 사용 안 함</button>':'')+'</div>'):' ';
 const chatPanel=!isNight&&alive&&!finished?'<section class="mafia2-panel"><h3>💬 공개 토론</h3><div class="mafia2-chat">'+dayChat+'</div><form data-form="chat" class="mafia2-chat-form"><input name="text" maxlength="80" placeholder="나의 추리를 말해 보세요" autocomplete="off" required><button type="submit">보내기</button></form></section>':'';
 const secretChat=isNight&&alive&&info.team==='mafia'?'<section class="mafia2-panel mafia2-secret-chat"><h3>🕶️ 마피아 팀 비밀 대화</h3><div class="mafia2-chat">'+teamTalk+'</div><form data-form="mafiaWhisper" class="mafia2-chat-form"><input name="text" maxlength="90" placeholder="팀원만 볼 수 있는 메시지" autocomplete="off" required><button type="submit">전송</button></form></section>':'';
 const progress=isVote?'<div class="mafia2-progress">투표 완료 '+(s.votes||[]).length+' / '+s.alive.length+'명</div>':isNight?'<div class="mafia2-progress">밤 행동 제출 '+Number(s.nightSubmittedCount||0)+'명</div>':'';
 const log='<section class="mafia2-panel mafia2-history"><h3>📜 게임 진행 기록</h3>'+((s.history||[]).slice(-7).reverse().map(h=>'<p>• '+E(h.text)+'</p>').join('')||'<p>기록이 없습니다.</p>')+'</section>';
 return '<div class="mafia2-root"><div class="game-topline"><span class="stage-badge">🎭 '+E(s.day)+'일차 · '+(s.mafiaMode==='classic'?'기본 직업':'특수 직업')+'</span><span class="time-badge">생존 '+s.alive.length+' / '+room.players.length+'명</span></div>'+
 '<section class="mafia2-hero '+(isNight?'is-night':'is-day')+'"><div class="mafia2-hero-icon">'+phaseIcon+'</div><div><span>MASKED NIGHT · 가면단</span><h2>'+phaseTitle+'</h2><p>'+phaseDesc+'</p></div></section>'+
 (finished?'':timeBar(s.deadline,isNight?65:s.phase==='discussion'?120:60))+roleCard+results+reports+
 (!alive?'<div class="mafia2-info">관전 중입니다. 다른 참가자의 비밀 능력은 공개되지 않아요.</div>':pendingNight)+
 (s.phase==='discussion'&&host&&!finished?'<button class="mafia2-main-action" data-action="discussionEnd">☀ 토론 마치고 투표 시작하기</button>':'')+
 (isVote&&alive&&!finished?'<section class="mafia2-choice"><h3>오늘의 추방 대상</h3><p>정치인의 투표는 2표로 계산됩니다. '+(voted?'투표를 완료했어요.':'한 명 또는 기권을 선택하세요.')+'</p><div class="mafia2-targets">'+votes+'</div></section>':'')+
 progress+secretChat+chatPanel+log+reveal+endBanner+'</div>';
}

const ROLE_CATALOG=[
 ['🗡️','마피아','밤마다 대상을 제거','마피아'],['🕶️','스파이','직업 확인 및 팀 지원','마피아'],
 ['🔎','경찰','마피아 팀 여부 조사','시민'],['🩺','의사','밤 공격 치료','시민'],
 ['🛡️','군인','첫 야간 공격 방어','시민'],['🗳️','정치인','낮 투표 2표','시민'],
 ['📰','기자','2일차부터 한 번 공개 특종','시민'],['💂','경호원','동료 대신 희생하며 방어','시민'],
 ['🕵️','사립탐정','야간 방문 대상 추적','시민'],['🎯','자경단원','한 번 야간 사격','시민'],
 ['🔮','영매','사망자의 직업 확인','시민'],['🏡','시민','낮 토론 및 추방 투표','시민']
];
export function renderMafiaRoleCatalog(){
 return '<section class="mafia2-catalog"><header><span>SECRET JOBS</span><h2>가면 뒤에는 누가 숨어 있을까?</h2><p>특수 직업 모드는 인원수에 따라 일부 직업을 무작위 배정해요. 모든 직업이 한 판에 등장하는 것은 아니에요.</p></header><div class="mafia2-catalog-grid">'+
 ROLE_CATALOG.map(([icon,name,desc,faction])=>'<article><div>'+icon+'</div><strong>'+E(name)+'</strong><small>'+E(desc)+'</small><span class="'+(faction==='마피아'?'evil':'')+'">'+E(faction)+' 팀</span></article>').join('')+'</div></section>';
}