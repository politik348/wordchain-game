// The Cat Challenge is a mode hub, not a tenth multiplayer game.
export const CAT_CHALLENGE_GAMES = ['omok', 'yut', 'rummikub', 'marble', 'wordchain'];
const catDetails = {
  omok: '흑백돌로 고양이와 오목 한 판',
  yut: '윷 운과 포석으로 겨루는 대결',
  rummikub: '타일을 조합하는 전략 대결',
  marble: '도시를 차지하는 부동산 승부',
  wordchain: '끝말잇기와 쿵쿵따 한 판'
};
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

export function renderCatFeatured() {
  return '<button type="button" class="game-card cat-feature-card" data-action="openCatHub" aria-label="고양이를 이겨라 모드로 이동">'+
    '<span class="cat-feature-graphic" aria-hidden="true">🐱</span>'+
    '<span class="cat-feature-text"><span class="cat-feature-kicker">SOLO CHALLENGE · 5 GAMES</span>'+
    '<strong>고양이를 이겨라!</strong>'+
    '<span>오목 · 윷놀이 · 루미큐브 · 모여마블 · 끝말잇기</span>'+
    '<span class="cat-feature-go">고양이와 승부하기 →</span></span></button>';
}

export function renderCatHub(games) {
  return '<div class="page-wrap cat-hub-page">'+
    '<div class="breadcrumb"><button data-action="home">홈</button><span>›</span><span>고양이를 이겨라</span></div>'+
    '<section class="cat-hub-hero"><span class="cat-hub-mascot" aria-hidden="true">🐱</span>'+
    '<div><span class="cat-feature-kicker">BEAT THE CAT</span>'+
    '<h1>고양이를 이겨라!</h1>'+
    '<p>이번엔 고양이가 상대입니다. 마음에 드는 게임을 골라 한 판 승부해 보세요.</p></div></section>'+
    '<div class="cat-hub-heading"><h2>어떤 게임으로 도전할까요?</h2><span>5가지 고양이 대전</span></div>'+
    '<div class="cat-choice-grid">'+games.map(g=>{
      const id=escapeHtml(g.id),name=escapeHtml(g.name),icon=escapeHtml(g.emoji);
      return '<button type="button" class="cat-choice-card" data-action="catChoose" data-cat-game="'+id+'">'+
      '<span class="cat-choice-icon" aria-hidden="true">'+icon+'</span>'+
      '<span class="cat-choice-copy"><strong>'+name+'</strong><small>'+escapeHtml(catDetails[g.id]||g.desc)+'</small></span>'+
      '<span class="cat-choice-arrow" aria-hidden="true">→</span></button>';
    }).join('')+'</div>'+
    '<p class="cat-hub-note">여기는 고양이 AI와의 1인 대전 전용입니다. 친구와 하려면 홈의 일반 게임 목록을 이용하세요.</p>'+
    '</div>';
}

export function renderCatSetup(game, settings) {
  const label=escapeHtml(game.name);
  return '<div class="page-wrap cat-setup-page">'+
    '<div class="breadcrumb"><button data-action="home">홈</button><span>›</span><button data-action="openCatHub">고양이를 이겨라</button><span>›</span>'+label+'</div>'+
    '<section class="cat-setup-banner"><span class="cat-setup-icon" aria-hidden="true">'+escapeHtml(game.emoji)+'</span>'+
    '<div><span class="cat-feature-kicker">🐱 CAT CHALLENGE</span><h1>'+label+' · 고양이를 이겨라</h1>'+
    '<p>고양이와 1:1로 대결합니다. 설정을 선택하고 시작하세요.</p></div></section>'+
    '<div class="cat-setup-panel">'+settings+
    '<div class="cat-setup-actions"><button type="button" class="button button-primary" data-action="solo">🐱 고양이를 이겨라 시작하기</button>'+
    '<button type="button" class="button button-secondary" data-action="openCatHub">다른 게임 선택</button></div></div></div>';
}
