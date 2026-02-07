const listEl = document.getElementById('rankList');
const searchInput = document.getElementById('rankSearchInput');
const tabButtons = Array.from(document.querySelectorAll('[data-rank-tab]'));
const rankFilters = document.getElementById('rankFilters');
const rankGameSelect = document.getElementById('rankGameSelect');
const rankFilterLabel = document.getElementById('rankFilterLabel');

function isUrlLike(value) {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

function setupProgressiveImage(img, src, { alt, placeholder = '/placeholder.svg' } = {}) {
  if (alt) img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    if (img.src && img.src.includes(placeholder)) return;
    img.src = placeholder;
  });
  img.src = src || placeholder;
  img.classList.add('is-loaded');
}

function setCtaContent(linkEl, label, fallbackLabel) {
  const value = String(label || fallbackLabel || '').trim();
  linkEl.textContent = '';
  linkEl.classList.remove('cta-icon-only');
  linkEl.removeAttribute('aria-label');
  linkEl.removeAttribute('title');

  if (value === '->') {
    linkEl.classList.add('cta-icon-only');
    const a11y = String(fallbackLabel || 'Mở').trim() || 'Mở';
    linkEl.setAttribute('aria-label', a11y);
    linkEl.setAttribute('title', a11y);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lucide');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-chevron-right');
    svg.appendChild(use);
    linkEl.appendChild(svg);
    return;
  }

  linkEl.textContent = value;
}

function formatChipNumber(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/[a-zA-ZÀ-ỹ]/.test(raw)) return raw;
  const numeric = Number(raw.replace(/[^0-9]/g, ''));
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric.toLocaleString('vi-VN');
  }
  return raw;
}

function formatVnd(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/(vnđ|vnd|\\bđ\\b|₫)/i.test(raw)) return raw;
  const normalized = formatChipNumber(raw);
  if (!normalized) return '';
  if (/[a-zA-ZÀ-ỹ]/.test(normalized)) return normalized;
  return `${normalized} vnđ`;
}

function isValidUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function parseInstallations(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  const pieces = raw
    .split(/\\r?\\n|\\|\\||\\s*\\|\\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const items = [];
  pieces.forEach((piece) => {
    const [labelPart, ...rest] = piece.split(/\\s*:\\s*/);
    const label = String(labelPart || '').trim();
    const url = String(rest.join(':') || '').trim();
    if (!label && !url) return;
    items.push({ label: label || 'Tải', url });
  });
  return items;
}

function createRankRow(game, index) {
  const row = document.createElement('article');
  row.className = 'game-row rank-row';
  row.style.setProperty('--delay', `${index * 60}ms`);

  const inferredRank = String(game.rank || '').trim() || String(index + 1);
  const rankNum = Number(String(inferredRank).replace(/[^0-9]/g, '')) || index + 1;
  if (rankNum <= 3) {
    row.classList.add('rank-top', `rank-top-${rankNum}`);
  }

  const rankLeft = document.createElement('div');
  rankLeft.className = 'rank-left';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, game.image, { alt: game.title || 'Rank Game' });
  imageWrap.appendChild(img);

  const rankPill = document.createElement('div');
  rankPill.className = 'rank-pill';
  rankPill.textContent = rankNum <= 3 ? `TOP ${rankNum}` : `#${inferredRank}`;

  rankLeft.appendChild(imageWrap);
  rankLeft.appendChild(rankPill);

  const info = document.createElement('div');
  info.className = 'game-info';

  const titleRow = document.createElement('div');
  titleRow.className = 'game-title';

  const title = document.createElement('h3');
  title.textContent = game.title || 'Rank Game';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';
  titleRow.appendChild(title);

  info.appendChild(titleRow);

  if (game.description) {
    const subtitle = document.createElement('div');
    subtitle.className = 'game-subtitle';
    subtitle.textContent = game.description;
    info.appendChild(subtitle);
  }

  const meta = document.createElement('div');
  meta.className = 'h5-meta h5-chips';

  const addChip = (v) => {
    if (!v) return;
    const chip = document.createElement('span');
    chip.className = 'h5-chip';
    chip.textContent = String(v).trim();
    meta.appendChild(chip);
  };

  addChip(game.category);
  addChip(game.capacity);
  addChip(game.language);
  addChip(game.graphics);
  addChip(game.vote);
  addChip(formatVnd(game.money));

  if (meta.children.length) info.appendChild(meta);

  const installs = parseInstallations(game.installation);
  if (installs.length) {
    const installWrap = document.createElement('div');
    installWrap.className = 'install-list';
    installs.forEach((item) => {
      const btn = document.createElement('a');
      btn.className = 'install-btn';
      btn.textContent = item.label;
      if (isValidUrl(item.url)) {
        btn.href = item.url;
        btn.target = '_blank';
        btn.rel = 'noreferrer';
      } else {
        btn.classList.add('disabled');
        btn.href = '#';
      }
      installWrap.appendChild(btn);
    });
    info.appendChild(installWrap);
  }

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  setCtaContent(cta, game.ctaText, 'Chi tiết');
  cta.href = game.ctaLink || '#';
  cta.target = '_blank';
  cta.rel = 'noreferrer';
  if (!game.ctaLink || game.ctaLink === '#') {
    cta.classList.add('disabled');
  }

  row.appendChild(rankLeft);
  row.appendChild(info);
  row.appendChild(cta);
  return row;
}

function createRankPodiumCard(entry, variant) {
  const card = document.createElement('article');
  card.className = `podium-card podium-${variant}`;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'podium-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, entry.game.image, { alt: entry.game.title || 'Top' });
  imageWrap.appendChild(img);

  const badge = document.createElement('div');
  badge.className = 'podium-badge';
  badge.textContent = entry.rankNum ? `TOP ${entry.rankNum}` : 'TOP';

  const name = document.createElement('div');
  name.className = 'podium-name';
  name.textContent = entry.game.title || '---';

  const money = document.createElement('div');
  money.className = 'podium-money';
  money.textContent = formatVnd(entry.game.money) || '';

  card.appendChild(badge);
  card.appendChild(imageWrap);
  card.appendChild(name);
  if (money.textContent) card.appendChild(money);
  return card;
}

function createRankPodiumSection(entries) {
  const frame = document.createElement('section');
  frame.className = 'rank-top-frame';

  const title = document.createElement('div');
  title.className = 'rank-top-title';
  title.textContent = 'Top 3';

  const podium = document.createElement('div');
  podium.className = 'rank-podium';

  const slots = [null, null, null]; // left, center, right
  const fallback = [];
  entries.forEach((entry) => {
    if (entry.rankNum === 1 && !slots[1]) slots[1] = entry;
    else if (entry.rankNum === 2 && !slots[0]) slots[0] = entry;
    else if (entry.rankNum === 3 && !slots[2]) slots[2] = entry;
    else fallback.push(entry);
  });
  for (const idx of [1, 0, 2]) {
    if (slots[idx]) continue;
    slots[idx] = fallback.shift() || null;
  }

  if (slots[0]) podium.appendChild(createRankPodiumCard(slots[0], 'left'));
  if (slots[1]) podium.appendChild(createRankPodiumCard(slots[1], 'center'));
  if (slots[2]) podium.appendChild(createRankPodiumCard(slots[2], 'right'));

  frame.appendChild(title);
  frame.appendChild(podium);
  return frame;
}

function clearList() {
  listEl.innerHTML = '';
}

function renderEmpty(message) {
  const empty = document.createElement('div');
  empty.className = 'empty';
  empty.textContent = message;
  listEl.appendChild(empty);
}

function createAgentRankRow(agent, index) {
  const row = document.createElement('article');
  row.className = 'game-row rank-row';
  row.style.setProperty('--delay', `${index * 60}ms`);

  const rankNum = index + 1;
  if (rankNum <= 3) {
    row.classList.add('rank-top', `rank-top-${rankNum}`);
  }

  const rankLeft = document.createElement('div');
  rankLeft.className = 'rank-left';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, agent.image, { alt: agent.name || 'Đại lý' });
  imageWrap.appendChild(img);

  const rankPill = document.createElement('div');
  rankPill.className = 'rank-pill';
  rankPill.textContent = rankNum <= 3 ? `TOP ${rankNum}` : `#${rankNum}`;

  rankLeft.appendChild(imageWrap);
  rankLeft.appendChild(rankPill);

  const info = document.createElement('div');
  info.className = 'game-info';

  const titleRow = document.createElement('div');
  titleRow.className = 'game-title';

  const title = document.createElement('h3');
  title.textContent = agent.name || 'Đại lý';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';
  titleRow.appendChild(title);
  info.appendChild(titleRow);

  if (agent.info) {
    const subtitle = document.createElement('div');
    subtitle.className = 'game-subtitle';
    subtitle.textContent = agent.info;
    info.appendChild(subtitle);
  }

  const meta = document.createElement('div');
  meta.className = 'h5-meta h5-chips';
  const ratingValue = Math.max(0, Math.min(5, Number(agent.rating) || 0));
  const chip = document.createElement('span');
  chip.className = 'h5-chip';
  const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  star.setAttribute('class', 'rank-star');
  star.setAttribute('viewBox', '0 0 24 24');
  star.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#icon-star');
  star.appendChild(use);
  chip.appendChild(star);
  const txt = document.createElement('span');
  txt.textContent = `${ratingValue.toFixed(1)}/5`;
  chip.appendChild(txt);
  meta.appendChild(chip);
  info.appendChild(meta);

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  setCtaContent(cta, 'Chi tiết', 'Chi tiết');
  cta.href = '#';
  cta.classList.add('disabled');

  row.appendChild(rankLeft);
  row.appendChild(info);
  row.appendChild(cta);
  return row;
}

function createAgentPodiumCard(entry, variant) {
  const card = document.createElement('article');
  card.className = `podium-card podium-${variant}`;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'podium-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, entry.agent.image, { alt: entry.agent.name || 'Top' });
  imageWrap.appendChild(img);

  const badge = document.createElement('div');
  badge.className = 'podium-badge';
  badge.textContent = entry.rankNum ? `TOP ${entry.rankNum}` : 'TOP';

  const name = document.createElement('div');
  name.className = 'podium-name';
  name.textContent = entry.agent.name || '---';

  const score = document.createElement('div');
  score.className = 'podium-money';
  const ratingValue = Math.max(0, Math.min(5, Number(entry.agent.rating) || 0));
  const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  star.setAttribute('class', 'rank-star');
  star.setAttribute('viewBox', '0 0 24 24');
  star.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#icon-star');
  star.appendChild(use);
  score.appendChild(star);
  const txt = document.createElement('span');
  txt.textContent = ` ${ratingValue.toFixed(1)}/5`;
  score.appendChild(txt);

  card.appendChild(badge);
  card.appendChild(imageWrap);
  card.appendChild(name);
  card.appendChild(score);
  return card;
}

function createAgentPodiumSection(entries) {
  const frame = document.createElement('section');
  frame.className = 'rank-top-frame';

  const title = document.createElement('div');
  title.className = 'rank-top-title';
  title.textContent = 'Top 3';

  const podium = document.createElement('div');
  podium.className = 'rank-podium';

  const slots = [null, null, null]; // left, center, right
  const fallback = [];
  entries.forEach((entry) => {
    if (entry.rankNum === 1 && !slots[1]) slots[1] = entry;
    else if (entry.rankNum === 2 && !slots[0]) slots[0] = entry;
    else if (entry.rankNum === 3 && !slots[2]) slots[2] = entry;
    else fallback.push(entry);
  });
  for (const idx of [1, 0, 2]) {
    if (slots[idx]) continue;
    slots[idx] = fallback.shift() || null;
  }

  if (slots[0]) podium.appendChild(createAgentPodiumCard(slots[0], 'left'));
  if (slots[1]) podium.appendChild(createAgentPodiumCard(slots[1], 'center'));
  if (slots[2]) podium.appendChild(createAgentPodiumCard(slots[2], 'right'));

  frame.appendChild(title);
  frame.appendChild(podium);
  return frame;
}

let activeTab = 'month';
let monthRankGames = [];
let gameRankGames = [];
let agentRankAgents = [];
let monthGameTitles = [];
let gameTitles = [];
let gameSelectedTitle = '__all__';
let monthSelectedTitle = '__all__';

function setSearchPlaceholder() {
  if (!searchInput) return;
  if (activeTab === 'agent') {
    searchInput.placeholder = 'Tìm bảng xếp hạng đại lý...';
    return;
  }
  if (activeTab === 'game') {
    searchInput.placeholder = 'Tìm bảng xếp hạng game...';
    return;
  }
  searchInput.placeholder = 'Tìm bảng xếp hạng tháng...';
}

function setSelectOptions(titles, selected) {
  if (!rankGameSelect) return;
  rankGameSelect.innerHTML = '';

  const allOpt = document.createElement('option');
  allOpt.value = '__all__';
  allOpt.textContent = 'Tất cả game';
  rankGameSelect.appendChild(allOpt);

  titles.forEach((title) => {
    const opt = document.createElement('option');
    opt.value = title;
    opt.textContent = title;
    rankGameSelect.appendChild(opt);
  });

  rankGameSelect.value = selected && selected !== '' ? selected : '__all__';
}

function refreshFilterForActiveTab() {
  if (!rankFilters) return;
  // Chỉ hiển thị bộ lọc game ở tab "BXH game".
  // Tab "Tháng" không dùng filter-select theo yêu cầu.
  const show = activeTab === 'game';
  rankFilters.hidden = !show;
  if (!show) return;

  if (rankFilterLabel) rankFilterLabel.textContent = 'Chọn game';
  setSelectOptions(gameTitles, gameSelectedTitle);
}

function setActiveTab(tab) {
  activeTab = tab === 'agent' ? 'agent' : tab === 'game' ? 'game' : 'month';
  if (activeTab === 'month') monthSelectedTitle = '__all__';
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.rankTab === activeTab));
  refreshFilterForActiveTab();
  setSearchPlaceholder();
  render();
}

function assignMonthGameTitle(rankEntryTitle) {
  if (!monthGameTitles.length) return '';
  const idx = hashScore(rankEntryTitle) % monthGameTitles.length;
  return monthGameTitles[idx] || '';
}

function renderMonth() {
  const term = String(searchInput?.value || '').trim().toLowerCase();
  const filteredByGame =
    monthSelectedTitle && monthSelectedTitle !== '__all__'
      ? monthRankGames.filter((g) => assignMonthGameTitle(g.title) === monthSelectedTitle)
      : monthRankGames;
  const filtered = term
    ? filteredByGame.filter((g) => String(g.title || '').toLowerCase().includes(term))
    : filteredByGame;

  clearList();
  if (!filtered.length) {
    renderEmpty(term ? 'Không tìm thấy.' : 'Chưa có dữ liệu bảng xếp hạng.');
    return;
  }

  const ranked = filtered
    .map((game, idx) => {
      const inferredRank = String(game.rank || '').trim() || String(idx + 1);
      const rankNum = Number(String(inferredRank).replace(/[^0-9]/g, '')) || idx + 1;
      return { game, rankNum };
    })
    .sort((a, b) => a.rankNum - b.rankNum);

  if (!term) {
    const top = ranked.slice(0, 3);
    const rest = ranked.slice(3);
    if (top.length) listEl.appendChild(createRankPodiumSection(top));
    rest.forEach((entry) => listEl.appendChild(createRankRow(entry.game, entry.rankNum - 1)));
    return;
  }

  ranked.forEach((entry) => listEl.appendChild(createRankRow(entry.game, entry.rankNum - 1)));
}

function numberFromText(value) {
  const raw = String(value || '').trim();
  if (!raw) return 0;
  const numeric = Number(raw.replace(/[^0-9]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function hashScore(text) {
  const str = String(text || '');
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 100000);
}

function computeGameScore(game) {
  const views = numberFromText(game.views);
  if (views) return views;
  const money = numberFromText(game.money);
  if (money) return money;
  return hashScore(game.title);
}

function createGameRankRow(game, index, score) {
  const row = document.createElement('article');
  row.className = 'game-row rank-row';
  row.style.setProperty('--delay', `${index * 60}ms`);
  const gameTitle = String(game.title || '').trim();
  row.dataset.gameTitle = gameTitle;
  if (gameSelectedTitle && gameSelectedTitle !== '__all__' && gameTitle === gameSelectedTitle) {
    row.classList.add('rank-selected');
  }

  const rankNum = index + 1;
  if (rankNum <= 3) {
    row.classList.add('rank-top', `rank-top-${rankNum}`);
  }

  const rankLeft = document.createElement('div');
  rankLeft.className = 'rank-left';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, game.image, { alt: game.title || 'Game' });
  imageWrap.appendChild(img);

  const rankPill = document.createElement('div');
  rankPill.className = 'rank-pill';
  rankPill.textContent = rankNum <= 3 ? `TOP ${rankNum}` : `#${rankNum}`;

  rankLeft.appendChild(imageWrap);
  rankLeft.appendChild(rankPill);

  const info = document.createElement('div');
  info.className = 'game-info';

  const titleRow = document.createElement('div');
  titleRow.className = 'game-title';

  const title = document.createElement('h3');
  title.textContent = game.title || 'Game';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';
  titleRow.appendChild(title);
  info.appendChild(titleRow);

  if (game.slogan) {
    const subtitle = document.createElement('div');
    subtitle.className = 'game-subtitle';
    subtitle.textContent = game.slogan;
    info.appendChild(subtitle);
  }

  const meta = document.createElement('div');
  meta.className = 'h5-meta h5-chips';

  const addChip = (v) => {
    if (!v) return;
    const chip = document.createElement('span');
    chip.className = 'h5-chip';
    chip.textContent = String(v).trim();
    meta.appendChild(chip);
  };

  addChip(game.type === 'h5' ? 'H5' : 'Hot');
  addChip(game.category);
  addChip(game.platform);
  addChip(game.tag);
  addChip(game.views ? `${formatChipNumber(game.views)} lượt` : `Điểm ${formatChipNumber(score)}`);
  if (meta.children.length) info.appendChild(meta);

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  setCtaContent(cta, game.ctaText, game.type === 'h5' ? 'Vào game' : 'Truy cập');
  cta.href = game.ctaLink || '#';
  cta.target = '_blank';
  cta.rel = 'noreferrer';
  if (!game.ctaLink || game.ctaLink === '#') cta.classList.add('disabled');

  row.appendChild(rankLeft);
  row.appendChild(info);
  row.appendChild(cta);
  return row;
}

function createGamePodiumCard(entry, variant) {
  const card = document.createElement('article');
  card.className = `podium-card podium-${variant}`;
  const gameTitle = String(entry.game?.title || '').trim();
  card.dataset.gameTitle = gameTitle;
  if (gameSelectedTitle && gameSelectedTitle !== '__all__' && gameTitle === gameSelectedTitle) {
    card.classList.add('rank-selected');
  }

  const imageWrap = document.createElement('div');
  imageWrap.className = 'podium-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, entry.game.image, { alt: entry.game.title || 'Top' });
  imageWrap.appendChild(img);

  const badge = document.createElement('div');
  badge.className = 'podium-badge';
  badge.textContent = entry.rankNum ? `TOP ${entry.rankNum}` : 'TOP';

  const name = document.createElement('div');
  name.className = 'podium-name';
  name.textContent = entry.game.title || '---';

  const score = document.createElement('div');
  score.className = 'podium-money';
  score.textContent = entry.game.views
    ? `${formatChipNumber(entry.game.views)} lượt`
    : `Điểm ${formatChipNumber(entry.score)}`;

  card.appendChild(badge);
  card.appendChild(imageWrap);
  card.appendChild(name);
  if (score.textContent) card.appendChild(score);
  return card;
}

function createGamePodiumSection(entries) {
  const frame = document.createElement('section');
  frame.className = 'rank-top-frame';

  const title = document.createElement('div');
  title.className = 'rank-top-title';
  title.textContent = 'Top 3';

  const podium = document.createElement('div');
  podium.className = 'rank-podium';

  const slots = [null, null, null]; // left, center, right
  const fallback = [];
  entries.forEach((entry) => {
    if (entry.rankNum === 1 && !slots[1]) slots[1] = entry;
    else if (entry.rankNum === 2 && !slots[0]) slots[0] = entry;
    else if (entry.rankNum === 3 && !slots[2]) slots[2] = entry;
    else fallback.push(entry);
  });
  for (const idx of [1, 0, 2]) {
    if (slots[idx]) continue;
    slots[idx] = fallback.shift() || null;
  }

  if (slots[0]) podium.appendChild(createGamePodiumCard(slots[0], 'left'));
  if (slots[1]) podium.appendChild(createGamePodiumCard(slots[1], 'center'));
  if (slots[2]) podium.appendChild(createGamePodiumCard(slots[2], 'right'));

  frame.appendChild(title);
  frame.appendChild(podium);
  return frame;
}

function renderGame() {
  const term = String(searchInput?.value || '').trim().toLowerCase();
  const filtered = term
    ? gameRankGames.filter((g) => String(g.title || '').toLowerCase().includes(term))
    : gameRankGames;

  clearList();
  if (!filtered.length) {
    renderEmpty(term ? 'Không tìm thấy.' : 'Chưa có dữ liệu BXH game.');
    return;
  }

  const ranked = filtered
    .map((game) => ({ game, score: computeGameScore(game) }))
    .sort((a, b) => b.score - a.score);

  if (!term) {
    const top = ranked.slice(0, 3).map((entry, idx) => ({ ...entry, rankNum: idx + 1 }));
    const rest = ranked.slice(3);
    if (top.length) listEl.appendChild(createGamePodiumSection(top));
    rest.forEach((entry, idx) => listEl.appendChild(createGameRankRow(entry.game, idx + 3, entry.score)));
  } else {
    ranked.forEach((entry, idx) => listEl.appendChild(createGameRankRow(entry.game, idx, entry.score)));
  }

  if (gameSelectedTitle && gameSelectedTitle !== '__all__') {
    const target =
      listEl.querySelector(`[data-game-title="${CSS.escape(gameSelectedTitle)}"]`) ||
      document.querySelector(`.rank-selected[data-game-title="${CSS.escape(gameSelectedTitle)}"]`);
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function renderAgent() {
  const term = String(searchInput?.value || '').trim().toLowerCase();
  const filtered = term
    ? agentRankAgents.filter((a) => String(a.name || '').toLowerCase().includes(term))
    : agentRankAgents;

  clearList();
  if (!filtered.length) {
    renderEmpty(term ? 'Không tìm thấy.' : 'Chưa có dữ liệu bảng xếp hạng.');
    return;
  }

  if (!term) {
    const topAgents = filtered.slice(0, 3).map((agent, idx) => ({ agent, rankNum: idx + 1 }));
    const rest = filtered.slice(3);
    if (topAgents.length) listEl.appendChild(createAgentPodiumSection(topAgents));
    rest.forEach((agent, idx) => listEl.appendChild(createAgentRankRow(agent, idx + 3)));
    return;
  }

  filtered.forEach((agent, idx) => listEl.appendChild(createAgentRankRow(agent, idx)));
}

function render() {
  if (activeTab === 'agent') {
    renderAgent();
  } else if (activeTab === 'game') {
    renderGame();
  } else {
    renderMonth();
  }
}

async function loadData() {
  try {
    const [gamesRes, agentsRes] = await Promise.all([fetch('/api/games'), fetch('/api/agents')]);
    const gamesData = await gamesRes.json();
    const agentsData = await agentsRes.json();

    const games = Array.isArray(gamesData.games) ? gamesData.games : [];
    monthRankGames = games.filter((g) => String(g.type || '').toLowerCase() === 'rank');

    gameRankGames = games.filter((g) => String(g.type || '').toLowerCase() !== 'rank');
    gameTitles = Array.from(new Set(gameRankGames.map((g) => String(g.title || '').trim()).filter(Boolean)));

    // Tab tháng: chỉ lấy game Hot từ file dlmau - Trang tính1 (1).csv (type = home)
    monthGameTitles = Array.from(
      new Set(
        games
          .filter((g) => String(g.type || '').toLowerCase() === 'home')
          .map((g) => String(g.title || '').trim())
          .filter(Boolean)
      )
    );

    monthSelectedTitle = '__all__';
    gameSelectedTitle = '__all__';
    refreshFilterForActiveTab();

    const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];
    agentRankAgents = agents
      .map((a) => ({
        ...a,
        rating: Math.max(0, Math.min(5, Number(a.rating) || 0)),
      }))
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

    render();
  } catch (err) {
    clearList();
    renderEmpty('Không tải được dữ liệu.');
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.rankTab));
});

if (rankGameSelect) {
  rankGameSelect.addEventListener('change', () => {
    if (activeTab !== 'game') return;
    const value = String(rankGameSelect.value || '__all__');
    gameSelectedTitle = value;
    render();
  });
}

searchInput?.addEventListener('input', render);
setSearchPlaceholder();
refreshFilterForActiveTab();
loadData();
