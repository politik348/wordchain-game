// The Cat Challenge is a mode hub, not a multiplayer game.
export const CAT_CHALLENGE_GAMES = ['omok', 'yut', 'rummikub', 'marble', 'tetris', 'wordchain'];
const catDetails = {
  omok: '흑백돌로 고양이와 오목 한 판',
  yut: '윷 운과 포석으로 겨루는 대결',
  rummikub: '타일을 조합하는 전략 대결',
  marble: '도시를 차지하는 부동산 승부',
  tetris: '강한 고양이와 블록 퍼즐 대결',
  wordchain: '끝말잇기와 쿵쿵따 한 판'
};
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

export function renderCatFeatured() {
  // The full illustration includes the title and CTA; the whole card stays clickable.
  return '<button type="button" class="game-card cat-feature-card cat-feature-image-card" data-action="openCatHub" aria-label="고양이를 이겨라! 고양이와 승부하기">' +
    '<img class="cat-feature-image" src="/assets/cat-feature-banner.png" alt="고양이를 이겨라! SOLO CHALLENGE · 6 GAMES. 고양이와 승부하기" width="775" height="470" loading="eager" decoding="async" />' +
    '</button>';
}

export function renderCatHub(games) {
  return '<div class="page-wrap cat-hub-page">'+
    '<div class="breadcrumb"><button data-action="home">홈</button><span>›</span><span>고양이를 이겨라</span></div>'+
    '<section class="cat-hub-hero cat-hub-hero-refresh" aria-labelledby="cat-hub-title">'+
      '<div class="cat-hub-intro">'+
        '<span class="cat-hub-eyebrow">✦ SOLO CHALLENGE · 6 GAMES</span>'+
        '<h1 id="cat-hub-title">고양이에게<br>도전할 시간!</h1>'+
        '<p>오목부터 끝말잇기까지. 마음에 드는 게임을 고르고 고양이와 한 판 승부해 보세요!</p>'+
        '<a href="#cat-game-choices" class="cat-hub-jump">게임 선택하기 <span aria-hidden="true">↓</span></a>'+
      '</div>'+
      '<a class="cat-hub-art" href="#cat-game-choices" aria-label="고양이를 이겨라 배너 — 대전 게임 선택으로 이동">'+
        '<img src="/assets/cat-feature-banner.png" alt="왕관을 쓴 고양이와 함께하는 고양이를 이겨라! 게임 배너" width="775" height="470" loading="eager" decoding="async">'+
      '</a>'+
    '</section>'+
    '<div class="cat-hub-heading" id="cat-game-choices"><h2>어떤 게임으로 도전할까요?</h2><span>6가지 고양이 대전</span></div>'+
    '<div class="cat-choice-grid">'+games.map((g,index)=>{
      const id=escapeHtml(g.id),name=escapeHtml(g.name),icon=escapeHtml(g.emoji);
      return '<button type="button" class="cat-choice-card cat-choice-'+id+'" data-action="catChoose" data-cat-game="'+id+'">'+
        '<span class="cat-choice-icon" aria-hidden="true">'+icon+'</span>'+
        '<span class="cat-choice-copy"><span class="cat-choice-number">CHALLENGE '+String(index+1).padStart(2,'0')+'</span>'+
        '<strong>'+name+'</strong><small>'+escapeHtml(catDetails[g.id]||g.desc)+'</small></span>'+
        '<span class="cat-choice-arrow" aria-hidden="true">↗</span></button>';
    }).join('')+'</div>'+
    '<p class="cat-hub-note">고양이 AI와의 1인 대전 전용입니다. 친구와 대전하려면 홈에서 일반 게임을 선택하세요.</p>'+
  '</div>';
}

export function renderCatSetup(game, settings) {
  const label=escapeHtml(game.name),icon=escapeHtml(game.emoji);
  const detail=escapeHtml(catDetails[game.id]||game.desc);
  return '<div class="page-wrap cat-setup-page">'+
    '<div class="breadcrumb"><button data-action="home">홈</button><span>›</span><button data-action="openCatHub">고양이를 이겨라</button><span>›</span>'+label+'</div>'+
    '<section class="cat-setup-banner cat-setup-hero" aria-labelledby="cat-setup-title">'+
      '<div class="cat-setup-copy"><span class="cat-setup-eyebrow">✦ SOLO CHALLENGE · VS CAT</span>'+
        '<h1 id="cat-setup-title">'+label+' <span>대전</span></h1>'+
        '<p>'+detail+'<br>규칙을 정하고 고양이와 승부해 보세요!</p>'+
      '</div>'+
      '<div class="cat-setup-illustration" aria-hidden="true"><span class="cat-setup-spark">✦</span>'+
        '<span class="cat-setup-graphic-cat">😼</span><span class="cat-setup-graphic-vs">VS</span>'+
        '<span class="cat-setup-graphic-game">'+icon+'</span></div>'+
    '</section>'+
    '<div class="cat-setup-panel cat-setup-panel-refresh">'+
      '<div class="cat-setup-panel-header"><span aria-hidden="true">⚙️</span>'+
      '<div><strong>게임 시작 전 설정</strong><p>원하는 규칙과 제한시간을 골라주세요.</p></div></div>'+
      settings+
      '<div class="cat-setup-actions"><button type="button" class="button button-primary" data-action="solo">고양이와 대전 시작하기 →</button>'+
      '<button type="button" class="button button-secondary" data-action="openCatHub">다른 게임 선택</button></div>'+
    '</div></div>';
}
