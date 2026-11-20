import {renderPregameArt,PRE_GAME_THEMES} from './pregame-lobbies.mjs?v=20261120pg2';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatars=['rabbit.svg','cat.svg','bear.svg','fox.svg'];
const maxPlayers={mafia:12,omok:2,yut:4,doodle:8,bell:4,liar:8,wordchain:10,rummikub:4};
const minPlayers={mafia:4,omok:2,yut:2,doodle:2,bell:2,liar:3,wordchain:2,rummikub:2};
function settingCard(group,canEdit){
 const options=group.choices.map(opt=>{
  const selected=String(opt.value)===String(group.value);
  return '<button type="button" class="pg-wait-setting'+(selected?' is-active':'')+'" data-wr-setting="'+esc(group.key)+'" data-wr-value="'+esc(opt.value)+'" aria-pressed="'+selected+'"'+(canEdit?'':' disabled')+'>'+esc(opt.label)+(selected?' <span>✓</span>':'')+'</button>';
 }).join('');
 return '<div class="pg-wait-setting-group"><strong>'+esc(group.label)+'</strong><div class="pg-wait-setting-options">'+options+'</div></div>';
}
export function renderOnlineWaiting({game,room,host=false,settings=[]}={}){
 const id=game?.id||room?.game||'wordchain',theme=PRE_GAME_THEMES[id]||PRE_GAME_THEMES.wordchain,players=room?.players||[];
 const min=minPlayers[id]||2,max=maxPlayers[id]||4;
 const ready=players.filter(p=>p.id===room.host||p.ready).length;
 const allReady=players.length>=min&&players.every(p=>p.id===room.host||p.ready);
 const cells=Array.from({length:max},(_,i)=>{
  const p=players[i];
  if(!p)return '<div class="pg-wait-person pg-wait-empty"><div class="pg-wait-empty-symbol">＋</div><span>친구 기다리는 중</span><small>비어 있는 자리</small></div>';
  const leader=p.id===room.host;
  const status=leader?'방장':p.ready?'준비 완료':'준비 중';
  const statusClass=leader?'is-host':p.ready?'is-ready':'is-pending';
  return '<div class="pg-wait-person '+statusClass+'"><span class="pg-wait-person-label">'+(leader?'👑 HOST':p.ready?'✓ READY':'WAITING')+'</span><img src="/marble/assets/'+avatars[i%avatars.length]+'" alt="" width="100" height="100" loading="eager"><strong>'+esc(p.nick)+'</strong><small>'+status+'</small></div>';
 }).join('');
 const messages=(room.lobbyChat||[]).slice(-30).map(m=>'<div class="pg-wait-chat-msg'+(m.sid===room.me?' mine':'')+'"><b>'+esc(m.nick)+'</b><span>'+esc(m.text)+'</span></div>').join('');
 const settingsHtml=settings.length?settings.map(g=>settingCard(g,host)).join(''):'<p class="pg-wait-no-settings">이 게임은 기본 규칙으로 진행해요. 별도 설정이 없어요.</p>';
 const themeStyle='--pg-a:'+theme.a+';--pg-b:'+theme.b+';--pg-ink:'+theme.ink;
 return '<div class="pg-waiting" style="'+themeStyle+'">'+
 '<section class="pg-waiting-hero"><div><span class="pg-waiting-kicker">MOYEO GAMES · FRIENDS LOBBY</span><h1>'+esc(game?.name||id)+' <span>대기실</span></h1><p>친구들이 모두 모이면 한 판 시작! 초대 코드를 공유하고 잠깐 이야기 나눠요.</p><div class="pg-waiting-status"><b>'+players.length+' / '+max+'명 참가</b><b>'+ready+'명 준비</b><b>최소 '+min+'명부터 시작</b></div></div><div class="pg-waiting-art">'+renderPregameArt(id)+'</div></section>'+
 '<div class="pg-waiting-codebar"><div><small>초대 코드</small><strong>'+esc(room.id)+'</strong></div><div><button type="button" data-action="copyCode">코드 복사 ⧉</button><button type="button" data-action="share">초대 링크 공유 ↗</button></div></div>'+
 '<section class="pg-waiting-members"><div class="pg-waiting-section-heading"><div><span>MEET THE PLAYERS</span><h2>함께할 친구들</h2></div><span>'+ready+' / '+max+' 준비됨</span></div><div class="pg-waiting-members-grid">'+cells+'</div></section>'+
 '<div class="pg-waiting-bottom"><section class="pg-waiting-settings"><div class="pg-waiting-section-heading"><div><span>ROOM RULES</span><h2>이번 게임 설정</h2></div><small>'+(host?'방장이 변경할 수 있어요':'방장만 변경할 수 있어요')+'</small></div>'+settingsHtml+'</section>'+
 '<section class="pg-waiting-chat"><div class="pg-waiting-section-heading"><div><span>HELLO FRIENDS</span><h2>대기실 채팅</h2></div><small>멤버 전용</small></div><div class="pg-waiting-chat-messages" id="pgWaitingChatMessages" aria-live="polite">'+(messages||'<div class="pg-wait-chat-empty">친구들이 오기 전에 첫 인사를 남겨보세요!</div>')+'</div><form class="pg-wait-chat-form" data-form="lobbyChat"><input type="text" name="text" maxlength="120" placeholder="친구들에게 인사하기" autocomplete="off" required><button type="submit">보내기 ↗</button></form></section></div>'+
 '<div class="pg-waiting-actions"><div><strong>'+esc(host?'방장으로 참가 중':'준비 완료를 눌러주세요!')+'</strong><small>'+esc(host?allReady?'모두 준비됐어요. 시작할 수 있어요!':'친구들이 준비하기를 기다리는 중이에요.':'준비를 누르면 방장이 게임을 시작할 수 있어요.')+'</small></div><div class="pg-waiting-buttons">'+(host?'<button type="button" class="pg-wait-primary" data-action="start"'+(allReady?'':' disabled')+'>모두 준비됐어요! 게임 시작 ↗</button>':'<button type="button" class="pg-wait-primary" data-action="ready">'+(players.find(p=>p.id===room.me)?.ready?'✓ 준비 취소':'✓ 준비 완료')+'</button>')+'<button type="button" class="pg-wait-leave" data-action="leave">나가기</button></div></div></div>';
}
