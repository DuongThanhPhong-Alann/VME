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

const CHECKIN_YEAR_RANGE = 3;
const checkinBaseYear = new Date().getFullYear();
const checkinMinYear = checkinBaseYear - CHECKIN_YEAR_RANGE;
const checkinMaxYear = checkinBaseYear + CHECKIN_YEAR_RANGE;
let checkinDate = new Date(checkinBaseYear, new Date().getMonth(), 1);
let checkinPickerBuilt = false;

let games = [];
let activeTab = 'home';

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
  img.src = game.image || '/placeholder.svg';
  img.alt = game.title || 'Game';
  img.addEventListener('error', () => {
    if (img.src.includes('placeholder.svg')) return;
    img.src = '/placeholder.svg';
  });
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
  cta.textContent = game.ctaText || 'Truy cập';
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
  img.src = game.image || '/placeholder.svg';
  img.alt = game.title || 'Game H5';
  img.addEventListener('error', () => {
    if (img.src.includes('placeholder.svg')) return;
    img.src = '/placeholder.svg';
  });
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

  if (game.category) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-h5';
    badge.textContent = game.category;
    titleRow.appendChild(badge);
  }

  info.appendChild(titleRow);

  const meta = document.createElement('div');
  meta.className = 'h5-meta';

  const addMeta = (label, value, options = {}) => {
    if (!value) return;
    const item = document.createElement('div');
    item.className = options.noLabel ? 'h5-item value-only' : 'h5-item';

    const itemValue = document.createElement('div');
    itemValue.className = 'h5-value';
    itemValue.textContent = value;

    if (label && !options.noLabel) {
      const itemLabel = document.createElement('div');
      itemLabel.className = 'h5-label';
      itemLabel.textContent = label;
      item.appendChild(itemLabel);
    }
    item.appendChild(itemValue);
    meta.appendChild(item);
  };

  addMeta('Category', game.category);
  addMeta('', game.capacity, { noLabel: true });
  addMeta('Ngôn ngữ', game.language);
  addMeta('Đồ họa', game.graphics);
  addMeta('Vote', game.vote);

  if (meta.children.length) {
    info.appendChild(meta);
  }

  const cta = document.createElement('a');
  cta.className = 'game-cta';
  cta.textContent = game.ctaText || 'Vào game';
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

  const imageWrap = document.createElement('div');
  imageWrap.className = 'game-image';

  const img = document.createElement('img');
  img.src = game.image || '/placeholder.svg';
  img.alt = game.title || 'Rank Game';
  img.addEventListener('error', () => {
    if (img.src.includes('placeholder.svg')) return;
    img.src = '/placeholder.svg';
  });
  imageWrap.appendChild(img);

  if (game.rank) {
    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge';
    rankBadge.textContent = String(game.rank).trim();
    imageWrap.appendChild(rankBadge);
  }

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

  if (game.category) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-h5';
    badge.textContent = game.category;
    titleRow.appendChild(badge);
  }

  info.appendChild(titleRow);

  const meta = document.createElement('div');
  meta.className = 'h5-meta';

  const addMeta = (label, value, options = {}) => {
    if (!value) return;
    const item = document.createElement('div');
    item.className = options.noLabel ? 'h5-item value-only' : 'h5-item';

    const itemValue = document.createElement('div');
    itemValue.className = 'h5-value';
    itemValue.textContent = value;

    if (label && !options.noLabel) {
      const itemLabel = document.createElement('div');
      itemLabel.className = 'h5-label';
      itemLabel.textContent = label;
      item.appendChild(itemLabel);
    }
    item.appendChild(itemValue);
    meta.appendChild(item);
  };

  addMeta('Category', game.category);
  addMeta('', game.capacity, { noLabel: true });
  addMeta('Ngôn ngữ', game.language);
  addMeta('Đồ họa', game.graphics);
  addMeta('Vote', game.vote);

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
  cta.textContent = game.ctaText || 'Chi tiết';
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

function setActiveTab(tab) {
  activeTab = tab;
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  listEl.classList.toggle('h5-list', tab === 'h5');
  listEl.classList.toggle('rank-list', tab === 'rank');
  renderList();
}

function renderList() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = games.filter((game) => {
    if (activeTab === 'h5') {
      if (game.type !== 'h5') return false;
    } else if (activeTab === 'rank') {
      if (game.type !== 'rank') return false;
    } else if (activeTab === 'home') {
      if (game.type !== 'home') return false;
    } else if (activeTab === 'trade') {
      return false;
    }
    const title = String(game.title || '').toLowerCase();
    return title.includes(term);
  });

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

  const renderer =
    activeTab === 'rank' ? createRankRow : activeTab === 'h5' ? createH5Row : createRow;
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
    navButtons.forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.nav === 'home') {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (btn.dataset.nav === 'rank') {
      setActiveTab('rank');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  }
});
loadGames();
