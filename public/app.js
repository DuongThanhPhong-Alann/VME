const listEl = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const tabButtons = Array.from(document.querySelectorAll('.tab'));
const navButtons = Array.from(document.querySelectorAll('.bottom-nav .nav-item'));
const menuBtn = document.querySelector('.menu-btn');
const menuPanel = document.getElementById('menuPanel');
const menuItems = Array.from(
  document.querySelectorAll('.menu-item:not(.menu-toggle), .menu-sub-item')
);
const menuGroup = document.querySelector('.menu-group');
const menuToggle = document.querySelector('.menu-toggle');
const checkinTrigger = document.querySelector('[data-action="checkin"]');
const checkinView = document.getElementById('checkinView');
const checkinGrid = document.getElementById('checkinGrid');
const checkinMonth = document.getElementById('checkinMonth');
const checkinClose = document.querySelector('.checkin-close');
const checkinMonthBtn = document.querySelector('.checkin-month-btn');
const checkinPicker = document.getElementById('checkinPicker');
const checkinPickerGrid = document.getElementById('checkinPickerGrid');
const checkinNavButtons = Array.from(document.querySelectorAll('[data-checkin-nav]'));
const checkinHomeButton = document.querySelector('[data-checkin-home]');
const agentView = document.getElementById('agentView');
const agentListEl = document.getElementById('agentList');
const agentHomeButton = document.querySelector('[data-agent-home]');
const storeView = document.getElementById('storeView');
const storeGridEl = document.getElementById('storeGrid');
const storeHomeButton = document.querySelector('[data-store-home]');

const LAZY_DATA_URL_THRESHOLD = 20_000;
let lazyImageObserver = null;

function getLazyImageObserver() {
  if (lazyImageObserver) return lazyImageObserver;
  if (!('IntersectionObserver' in window)) return null;
  lazyImageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        observer.unobserve(img);
        const src = img.dataset.src;
        if (!src) return;
        img.classList.remove('is-loaded');
        img.classList.add('is-loading');
        img.src = src;
        img.removeAttribute('data-src');
      });
    },
    { rootMargin: '250px 0px' }
  );
  return lazyImageObserver;
}

function setupProgressiveImage(img, src, { alt, placeholder = '/placeholder.svg' } = {}) {
  if (alt) img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';

  img.classList.add('is-loading');
  const markLoaded = () => {
    img.classList.remove('is-loading');
    img.classList.add('is-loaded');
  };

  img.addEventListener('load', markLoaded);
  img.addEventListener('error', () => {
    if (img.src && img.src.includes(placeholder)) {
      markLoaded();
      return;
    }
    img.src = placeholder;
  });

  const actualSrc = src || placeholder;
  const shouldDefer =
    typeof actualSrc === 'string' &&
    actualSrc.startsWith('data:image') &&
    actualSrc.length > LAZY_DATA_URL_THRESHOLD;

  if (shouldDefer) {
    img.dataset.src = actualSrc;
    img.src = placeholder;
    const observer = getLazyImageObserver();
    if (observer) observer.observe(img);
    return;
  }

  img.src = actualSrc;
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

const CHECKIN_YEAR_RANGE = 3;
const checkinBaseYear = new Date().getFullYear();
const checkinMinYear = checkinBaseYear - CHECKIN_YEAR_RANGE;
const checkinMaxYear = checkinBaseYear + CHECKIN_YEAR_RANGE;
let checkinDate = new Date(checkinBaseYear, new Date().getMonth(), 1);
let checkinPickerBuilt = false;

let games = [];
let activeTab = 'home';
let agents = [];
let agentsLoaded = false;
let storeItems = [];
let storeLoaded = false;

const modalBackdrop = document.createElement('div');
modalBackdrop.className = 'modal-backdrop';
modalBackdrop.innerHTML = `
  <div class="modal-card" role="dialog" aria-modal="true">
    <div class="modal-header">
      <div class="modal-title">Mô tả</div>
      <button type="button" class="modal-close">Đóng</button>
    </div>
    <div class="modal-body"></div>
  </div>
`;
document.body.appendChild(modalBackdrop);

const modalTitle = modalBackdrop.querySelector('.modal-title');
const modalBody = modalBackdrop.querySelector('.modal-body');
const modalClose = modalBackdrop.querySelector('.modal-close');

function openMenu() {
  if (!menuPanel || !menuBtn) return;
  menuPanel.classList.add('open');
  menuPanel.setAttribute('aria-hidden', 'false');
  menuBtn.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  if (!menuPanel || !menuBtn) return;
  menuPanel.classList.remove('open');
  menuPanel.setAttribute('aria-hidden', 'true');
  menuBtn.setAttribute('aria-expanded', 'false');
}

function toggleMenu() {
  if (!menuPanel) return;
  if (menuPanel.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
}

function buildCheckinCalendar(baseDate = new Date()) {
  if (!checkinGrid || !checkinMonth) return;
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const today = new Date();

  checkinMonth.textContent = `${String(month + 1).padStart(2, '0')}/${year}`;
  checkinGrid.innerHTML = '';

  for (let i = 0; i < startOffset; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'checkin-empty';
    checkinGrid.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const cell = document.createElement('div');
    cell.className = 'checkin-day';
    cell.textContent = day;
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add('is-today');
    }
    checkinGrid.appendChild(cell);
  }
}

function updateCheckinNav() {
  const year = checkinDate.getFullYear();
  const month = checkinDate.getMonth();
  const canPrev = year > checkinMinYear || (year === checkinMinYear && month > 0);
  const canNext = year < checkinMaxYear || (year === checkinMaxYear && month < 11);
  checkinNavButtons.forEach((btn) => {
    const dir = Number(btn.dataset.checkinNav || 0);
    if (dir < 0) {
      btn.disabled = !canPrev;
    } else if (dir > 0) {
      btn.disabled = !canNext;
    }
  });
}

function buildCheckinPicker() {
  if (!checkinPickerGrid) return;
  checkinPickerGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let year = checkinMinYear; year <= checkinMaxYear; year += 1) {
    const yearLabel = document.createElement('div');
    yearLabel.className = 'checkin-year';
    yearLabel.textContent = String(year);
    fragment.appendChild(yearLabel);

    const monthWrap = document.createElement('div');
    monthWrap.className = 'checkin-months';
    for (let month = 0; month < 12; month += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'checkin-month';
      btn.dataset.year = String(year);
      btn.dataset.month = String(month);
      btn.textContent = `T${month + 1}`;
      monthWrap.appendChild(btn);
    }
    fragment.appendChild(monthWrap);
  }
  checkinPickerGrid.appendChild(fragment);
  updateCheckinPickerActive();
}

function updateCheckinPickerActive() {
  if (!checkinPickerGrid) return;
  const activeYear = checkinDate.getFullYear();
  const activeMonth = checkinDate.getMonth();
  const buttons = checkinPickerGrid.querySelectorAll('.checkin-month');
  buttons.forEach((btn) => {
    const year = Number(btn.dataset.year);
    const month = Number(btn.dataset.month);
    btn.classList.toggle('is-active', year === activeYear && month === activeMonth);
  });
}

function setCheckinMonth(year, month) {
  const normalized = new Date(year, month, 1);
  const normalizedYear = normalized.getFullYear();
  if (normalizedYear < checkinMinYear || normalizedYear > checkinMaxYear) return;
  checkinDate = normalized;
  buildCheckinCalendar(checkinDate);
  updateCheckinNav();
  updateCheckinPickerActive();
}

function toggleCheckinPicker() {
  if (!checkinPicker || !checkinMonthBtn) return;
  const isOpen = checkinPicker.classList.toggle('open');
  checkinPicker.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  checkinMonthBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeCheckinPicker() {
  if (!checkinPicker || !checkinMonthBtn) return;
  checkinPicker.classList.remove('open');
  checkinPicker.setAttribute('aria-hidden', 'true');
  checkinMonthBtn.setAttribute('aria-expanded', 'false');
}

function openCheckin() {
  if (!checkinView) return;
  if (!checkinPickerBuilt) {
    buildCheckinPicker();
    checkinPickerBuilt = true;
  }
  setCheckinMonth(checkinDate.getFullYear(), checkinDate.getMonth());
  document.body.classList.add('checkin-open');
  checkinView.setAttribute('aria-hidden', 'false');
}

function closeCheckin() {
  if (!checkinView) return;
  document.body.classList.remove('checkin-open');
  checkinView.setAttribute('aria-hidden', 'true');
  closeCheckinPicker();
}

function openAgents() {
  if (!agentView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  document.body.classList.add('agent-open');
  agentView.setAttribute('aria-hidden', 'false');
}

function closeAgents() {
  if (!agentView) return;
  document.body.classList.remove('agent-open');
  agentView.setAttribute('aria-hidden', 'true');
}

function openStore() {
  if (!storeView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  document.body.classList.add('store-open');
  storeView.setAttribute('aria-hidden', 'false');
}

function closeStore() {
  if (!storeView) return;
  document.body.classList.remove('store-open');
  storeView.setAttribute('aria-hidden', 'true');
}

function renderStore() {
  if (!storeGridEl) return;
  storeGridEl.innerHTML = '';

  if (!storeItems.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Chưa có dữ liệu cửa hàng.';
    storeGridEl.appendChild(empty);
    return;
  }

  storeItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'store-item';

	    const thumb = document.createElement('div');
	    thumb.className = 'store-thumb';
	    const img = document.createElement('img');
	    setupProgressiveImage(img, item.image, { alt: item.name || 'Vật phẩm' });
	    thumb.appendChild(img);

    const name = document.createElement('div');
    name.className = 'store-name';
    name.textContent = item.name || 'Vật phẩm';

    const price = document.createElement('div');
    price.className = 'store-price';
    price.textContent = item.price || '';

    card.appendChild(thumb);
    card.appendChild(name);
    if (item.price) card.appendChild(price);
    storeGridEl.appendChild(card);
  });
}

async function loadStore() {
  if (storeLoaded) return;
  storeLoaded = true;
  if (!storeGridEl) return;
  storeGridEl.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

  try {
    const response = await fetch('/api/store');
    const data = await response.json();
    storeItems = Array.isArray(data.items) ? data.items : [];
    renderStore();
  } catch (error) {
    storeGridEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Không tải được dữ liệu cửa hàng.';
    storeGridEl.appendChild(empty);
  }
}

function renderAgents() {
  if (!agentListEl) return;
  agentListEl.innerHTML = '';

  if (!agents.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Chưa có đại lý.';
    agentListEl.appendChild(empty);
    return;
  }

  agents.forEach((agent, index) => {
    const row = document.createElement('article');
    row.className = 'game-row agent-row';
    row.style.setProperty('--delay', `${index * 40}ms`);

    const imageWrap = document.createElement('div');
    imageWrap.className = 'game-image';

	    const img = document.createElement('img');
	    setupProgressiveImage(img, agent.image, { alt: agent.name || 'Đại lý' });
	    imageWrap.appendChild(img);

    const info = document.createElement('div');
    info.className = 'game-info';

    const titleRow = document.createElement('div');
    titleRow.className = 'game-title';

    const title = document.createElement('h3');
    title.textContent = agent.name || 'Đại lý';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = '700';
    titleRow.appendChild(title);
    info.appendChild(titleRow);

    if (agent.info) {
      const desc = document.createElement('div');
      desc.className = 'agent-info';
      desc.textContent = agent.info;
      info.appendChild(desc);
    }

    row.appendChild(imageWrap);
    row.appendChild(info);
    agentListEl.appendChild(row);
  });
}

async function loadAgents() {
  if (agentsLoaded) return;
  agentsLoaded = true;
  if (!agentListEl) return;
  agentListEl.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

  try {
    const response = await fetch('/api/agents');
    const data = await response.json();
    agents = Array.isArray(data.agents) ? data.agents : [];
    renderAgents();
  } catch (error) {
    agentListEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Không tải được dữ liệu đại lý.';
    agentListEl.appendChild(empty);
  }
}

function openModal(title, description) {
  modalTitle.textContent = title || 'Mô tả';
  modalBody.textContent = description || '';
  modalBackdrop.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function formatViews(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  if (/[a-zA-ZÀ-ỹ]/.test(raw)) return raw;
  const numeric = Number(raw.replace(/[^0-9]/g, ''));
  if (!Number.isNaN(numeric) && numeric > 0) {
    return `${numeric.toLocaleString('vi-VN')} lượt xem`;
  }
  return raw;
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
  if (/(vnđ|vnd|\bđ\b|₫)/i.test(raw)) return raw;
  const normalized = formatChipNumber(raw);
  if (!normalized) return '';
  if (/[a-zA-ZÀ-ỹ]/.test(normalized)) return normalized;
  return `${normalized} vnđ`;
}

function parseInstallations(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        return { label: match[1].trim(), url: match[2].trim() };
      }
      return { label: 'Link', url: line };
    });
}

function isValidUrl(url) {
  if (!url) return false;
  if (/^javascript:/i.test(url)) return false;
  return /^https?:\/\//i.test(url) || url.startsWith('/');
}

function createRow(game, index) {
  const row = document.createElement('article');
  row.className = 'game-row';
  row.style.setProperty('--delay', `${index * 60}ms`);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, game.image, { alt: game.title || 'Game' });
  imageWrap.appendChild(img);

  const info = document.createElement('div');
  info.className = 'game-info';

  const titleRow = document.createElement('div');
  titleRow.className = 'game-title';

  const title = document.createElement('h3');
  title.textContent = game.title || 'Game';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '600';

  titleRow.appendChild(title);

  if (game.tag) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = game.tag;
    titleRow.appendChild(badge);
  }

  info.appendChild(titleRow);

  const sloganText = game.slogan || game.subtitle;
  if (sloganText) {
    const slogan = document.createElement('div');
    slogan.className = 'game-slogan';
    slogan.textContent = sloganText;
    info.appendChild(slogan);
  }

  const descriptionText = String(game.description || '').trim();
  if (descriptionText) {
    const descWrap = document.createElement('div');
    descWrap.className = 'desc-wrap';

    const descBtn = document.createElement('button');
    descBtn.type = 'button';
    descBtn.className = 'desc-btn';
    descBtn.textContent = 'Xem thêm';
    descBtn.addEventListener('click', () => {
      openModal(game.title || 'Mô tả', descriptionText);
    });

    descWrap.appendChild(descBtn);
    info.appendChild(descWrap);
  }

  const metaParts = [];
  const views = formatViews(game.views);
  if (views) metaParts.push(views);
  if (game.platform) metaParts.push(game.platform);

  if (metaParts.length) {
    const meta = document.createElement('div');
    meta.className = 'game-meta';
    meta.textContent = metaParts.join(' - ');
    info.appendChild(meta);
  }

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  setCtaContent(cta, game.ctaText, 'Truy cập');
  cta.href = game.ctaLink || '#';
  cta.target = '_blank';
  cta.rel = 'noreferrer';

  if (!game.ctaLink || game.ctaLink === '#') {
    cta.classList.add('disabled');
  }

  row.appendChild(imageWrap);
  row.appendChild(info);
  row.appendChild(cta);

  return row;
}

function createH5Row(game, index) {
  const row = document.createElement('article');
  row.className = 'game-row h5-row';
  row.style.setProperty('--delay', `${index * 60}ms`);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  setupProgressiveImage(img, game.image, { alt: game.title || 'Game H5' });
  imageWrap.appendChild(img);

  const info = document.createElement('div');
  info.className = 'game-info';

  const titleRow = document.createElement('div');
  titleRow.className = 'game-title';

  const title = document.createElement('h3');
  title.textContent = game.title || 'Game H5';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';

  titleRow.appendChild(title);

  info.appendChild(titleRow);

  const meta = document.createElement('div');
  meta.className = 'h5-meta h5-chips';

  const addChip = (value) => {
    if (!value) return;
    const chip = document.createElement('span');
    chip.className = 'h5-chip';
    chip.textContent = String(value).trim();
    meta.appendChild(chip);
  };

  addChip(game.capacity);
  addChip(game.language);
  addChip(game.graphics);
  addChip(game.vote);

  if (meta.children.length) {
    info.appendChild(meta);
  }

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  setCtaContent(cta, game.ctaText, 'Vào game');
  cta.href = game.ctaLink || '#';
  cta.target = '_blank';
  cta.rel = 'noreferrer';

  if (!game.ctaLink || game.ctaLink === '#') {
    cta.classList.add('disabled');
  }

  row.appendChild(imageWrap);
  row.appendChild(info);
  row.appendChild(cta);

  return row;
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

  const addChip = (value) => {
    if (!value) return;
    const chip = document.createElement('span');
    chip.className = 'h5-chip';
    chip.textContent = String(value).trim();
    meta.appendChild(chip);
  };

  addChip(game.category);
  addChip(game.capacity);
  addChip(game.language);
  addChip(game.graphics);
  addChip(game.vote);
  addChip(formatVnd(game.money));

  if (meta.children.length) {
    info.appendChild(meta);
  }

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
  for (const index of [1, 0, 2]) {
    if (slots[index]) continue;
    slots[index] = fallback.shift() || null;
  }

  if (slots[0]) podium.appendChild(createRankPodiumCard(slots[0], 'left'));
  if (slots[1]) podium.appendChild(createRankPodiumCard(slots[1], 'center'));
  if (slots[2]) podium.appendChild(createRankPodiumCard(slots[2], 'right'));

  frame.appendChild(title);
  frame.appendChild(podium);
  return frame;
}

function setActiveTab(tab) {
  activeTab = tab;
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  listEl.classList.toggle('h5-list', tab === 'h5');
  listEl.classList.toggle('rank-list', tab === 'rank');
  renderList();
}

function setActiveNav(nav) {
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === nav);
  });
}

function goHome() {
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  closeStore();
  setActiveNav('home');
  setActiveTab('home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goRank() {
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  closeStore();
  setActiveNav('rank');
  setActiveTab('rank');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderList() {
  const term = searchInput.value.trim().toLowerCase();
  const base = games.filter((game) => {
    if (activeTab === 'h5') return game.type === 'h5';
    if (activeTab === 'rank') return game.type === 'rank';
    if (activeTab === 'home') return game.type === 'home';
    if (activeTab === 'trade') return false;
    return true;
  });
  const filtered = term
    ? base.filter((game) => String(game.title || '').toLowerCase().includes(term))
    : base;

  listEl.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    if (activeTab === 'rank') {
      empty.textContent = 'Chưa có dữ liệu bảng xếp hạng.';
    } else if (activeTab === 'h5') {
      empty.textContent = 'Chưa có game H5.';
    } else if (activeTab === 'trade') {
      empty.textContent = 'Chưa có dữ liệu thương mại.';
    } else {
      empty.textContent = 'Không có game phù hợp.';
    }
    listEl.appendChild(empty);
    return;
  }

  if (activeTab === 'rank') {
    const ranked = filtered
      .map((game, idx) => {
        const inferredRank = String(game.rank || '').trim() || String(idx + 1);
        const rankNum = Number(String(inferredRank).replace(/[^0-9]/g, '')) || idx + 1;
        return { game, inferredRank, rankNum };
      })
      .sort((a, b) => a.rankNum - b.rankNum);

    if (!term) {
      const top = ranked.slice(0, 3);
      const rest = ranked.slice(3);

      if (top.length) {
        listEl.appendChild(createRankPodiumSection(top));
      }

      rest.forEach((entry) => {
        listEl.appendChild(createRankRow(entry.game, entry.rankNum - 1));
      });
      return;
    }

    ranked.forEach((entry) => {
      listEl.appendChild(createRankRow(entry.game, entry.rankNum - 1));
    });
    return;
  }

  const renderer = activeTab === 'h5' ? createH5Row : createRow;
  filtered.forEach((game, index) => {
    listEl.appendChild(renderer(game, index));
  });
}

async function loadGames() {
  try {
    const response = await fetch('/api/games');
    const data = await response.json();
    games = Array.isArray(data.games) ? data.games : [];
    if (games.length) {
      if (games.every((game) => game.type === 'rank')) {
        activeTab = 'rank';
      } else if (games.every((game) => game.type === 'h5')) {
        activeTab = 'h5';
      } else {
        activeTab = 'home';
      }
      tabButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === activeTab);
      });
      listEl.classList.toggle('h5-list', activeTab === 'h5');
      listEl.classList.toggle('rank-list', activeTab === 'rank');
    }
    renderList();
  } catch (error) {
    listEl.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Không tải được dữ liệu.';
    listEl.appendChild(empty);
  }
}

searchInput.addEventListener('input', renderList);
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab || 'home';
    setActiveTab(tab);
  });
});
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const nav = btn.dataset.nav || 'home';
    if (nav === 'home') {
      goHome();
      return;
    }
    if (nav === 'rank') {
      goRank();
      return;
    }
    if (nav === 'agent') {
      setActiveNav('agent');
      openAgents();
      loadAgents();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (nav === 'store') {
      setActiveNav('store');
      openStore();
      loadStore();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    closeModal();
    closeMenu();
    closeCheckin();
    closeAgents();
    closeStore();
    setActiveNav(nav);
  });
});
if (menuBtn && menuPanel) {
  menuBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMenu();
  });
  if (menuGroup && menuToggle) {
    menuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = menuGroup.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }
  document.addEventListener('click', (event) => {
    if (!menuPanel.contains(event.target) && !menuBtn.contains(event.target)) {
      closeMenu();
    }
  });
  menuItems.forEach((item) => {
    item.addEventListener('click', () => {
      closeMenu();
    });
  });
}
if (checkinTrigger) {
  checkinTrigger.addEventListener('click', () => {
    openCheckin();
  });
}
if (checkinClose) {
  checkinClose.addEventListener('click', () => {
    closeCheckin();
  });
}
if (checkinHomeButton) {
  checkinHomeButton.addEventListener('click', () => {
    goHome();
  });
}
if (agentHomeButton) {
  agentHomeButton.addEventListener('click', () => {
    goHome();
  });
}
if (storeHomeButton) {
  storeHomeButton.addEventListener('click', () => {
    goHome();
  });
}
if (checkinMonthBtn && checkinPicker) {
  checkinMonthBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleCheckinPicker();
  });
}
if (checkinPickerGrid) {
  checkinPickerGrid.addEventListener('click', (event) => {
    const target = event.target.closest('.checkin-month');
    if (!target) return;
    const year = Number(target.dataset.year);
    const month = Number(target.dataset.month);
    if (Number.isNaN(year) || Number.isNaN(month)) return;
    setCheckinMonth(year, month);
    closeCheckinPicker();
  });
}
checkinNavButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = Number(btn.dataset.checkinNav || 0);
    if (!dir) return;
    const year = checkinDate.getFullYear();
    const month = checkinDate.getMonth() + dir;
    setCheckinMonth(year, month);
  });
});
document.addEventListener('click', (event) => {
  if (!checkinPicker || !checkinMonthBtn) return;
  if (!checkinPicker.classList.contains('open')) return;
  if (checkinPicker.contains(event.target) || checkinMonthBtn.contains(event.target)) return;
  closeCheckinPicker();
});
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
    closeMenu();
    closeCheckin();
    closeAgents();
    closeStore();
  }
});
loadGames();
