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
const taskInviteTrigger = document.querySelector('[data-action="task-invite"]');
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
const agentUploadButton = document.querySelector('[data-agent-upload]');
const agentSortButton = document.querySelector('[data-agent-sort]');
const agentPolicyButton = document.querySelector('[data-agent-policy]');
const agentContactButton = document.querySelector('[data-agent-contact]');
const agentUploadInput = document.getElementById('agentUploadInput');
const storeView = document.getElementById('storeView');
const storeGridEl = document.getElementById('storeGrid');
const storeHomeButton = document.querySelector('[data-store-home]');
const pro5Btn = document.getElementById('pro5Btn');
const pro5NameEl = document.getElementById('pro5Name');
const balanceValueEl = document.getElementById('balanceValue');
const profileView = document.getElementById('profileView');
const profileFrame = document.getElementById('profileFrame');
const profileGamesGrid = document.getElementById('profileGamesGrid');
const profileHomeButton = document.querySelector('[data-profile-home]');
const profileCloseButton = document.querySelector('.profile-close');
const khoButton = document.querySelector('[data-kho]');
const inventoryView = document.getElementById('inventoryView');
const inventoryTitleEl = document.querySelector('.inventory-title');
const inventoryGrid = document.getElementById('inventoryGrid');
const inventoryTabsWrap = document.querySelector('.inventory-tabs');
const inventoryTabs = Array.from(document.querySelectorAll('.inventory-tab'));
const inventoryCloseButton = document.querySelector('.inventory-close');
const inventoryHomeButton = document.querySelector('[data-inventory-home]');
const chatbotBtn = document.getElementById('chatbotBtn');

const LAZY_DATA_URL_THRESHOLD = 20_000;
let lazyImageObserver = null;

const SEARCH_PLACEHOLDERS = {
  home: 'Tìm game...',
  rank: 'Tìm bảng xếp hạng...',
  agent: 'Tìm đại lý...',
  store: 'Tìm vật phẩm...',
  profile: 'Tìm game đã chơi...',
  inventory: 'Tìm trong kho...',
  checkin: 'Nhập để tìm kiếm',
};

function getSearchTerm() {
  return String(searchInput?.value || '').trim().toLowerCase();
}

function setSearchPlaceholder(context) {
  if (!searchInput) return;
  searchInput.placeholder = SEARCH_PLACEHOLDERS[context] || 'Nhập để tìm kiếm';
}

function clearSearch() {
  if (!searchInput) return;
  searchInput.value = '';
}

function getActiveContext() {
  const body = document.body;
  if (body.classList.contains('inventory-open')) return 'inventory';
  if (body.classList.contains('profile-open')) return 'profile';
  if (body.classList.contains('store-open')) return 'store';
  if (body.classList.contains('agent-open')) return 'agent';
  if (body.classList.contains('checkin-open')) return 'checkin';
  return activeTab === 'rank' ? 'rank' : 'home';
}

function refreshActiveSearch() {
  const context = getActiveContext();
  if (context === 'inventory') {
    renderInventory();
    return;
  }
  if (context === 'profile') {
    renderPlayedGames(profilePlayedGames);
    return;
  }
  if (context === 'store') {
    renderStore();
    return;
  }
  if (context === 'agent') {
    renderAgents();
    return;
  }
  renderList();
}

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
let agentsOriginal = [];
let agentsLoaded = false;
let storeItems = [];
let storeLoaded = false;
let profilePlayedGames = [];
let agentSortMode = 'default'; // default | rating | name

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
  setSearchPlaceholder('checkin');
  clearSearch();
}

function closeCheckin() {
  if (!checkinView) return;
  document.body.classList.remove('checkin-open');
  checkinView.setAttribute('aria-hidden', 'true');
  closeCheckinPicker();
  setSearchPlaceholder(getActiveContext());
  clearSearch();
}

function openAgents() {
  if (!agentView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  document.body.classList.add('agent-open');
  agentView.setAttribute('aria-hidden', 'false');
  setSearchPlaceholder('agent');
  clearSearch();
}

function closeAgents() {
  if (!agentView) return;
  document.body.classList.remove('agent-open');
  agentView.setAttribute('aria-hidden', 'true');
  setSearchPlaceholder(getActiveContext());
  clearSearch();
}

function openStore() {
  if (!storeView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  document.body.classList.add('store-open');
  storeView.setAttribute('aria-hidden', 'false');
  setSearchPlaceholder('store');
  clearSearch();
}

function closeStore() {
  if (!storeView) return;
  document.body.classList.remove('store-open');
  storeView.setAttribute('aria-hidden', 'true');
  setSearchPlaceholder(getActiveContext());
  clearSearch();
}

function openProfile() {
  if (!profileView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  closeStore();
  document.body.classList.add('profile-open');
  profileView.setAttribute('aria-hidden', 'false');
  profileView.classList.remove('is-entering');
  requestAnimationFrame(() => {
    profileView.classList.add('is-entering');
    window.setTimeout(() => profileView.classList.remove('is-entering'), 260);
  });
  setSearchPlaceholder('profile');
  clearSearch();
  loadProfileView();
}

function closeProfile() {
  if (!profileView) return;
  document.body.classList.remove('profile-open');
  profileView.setAttribute('aria-hidden', 'true');
  setSearchPlaceholder(getActiveContext());
  clearSearch();
}

let inventoryTab = 'avatar';
let inventoryStoreItems = [];
let inventoryAvatarItems = [];
let inventoryLoaded = false;

function openInventory() {
  if (!inventoryView) return;
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  closeStore();
  closeProfile();
  document.body.classList.add('inventory-open');
  inventoryView.setAttribute('aria-hidden', 'false');
  setInventoryTab(inventoryTab || 'avatar');
  setSearchPlaceholder('inventory');
  clearSearch();
  loadInventory();
}

function closeInventory() {
  if (!inventoryView) return;
  document.body.classList.remove('inventory-open');
  inventoryView.setAttribute('aria-hidden', 'true');
  setSearchPlaceholder(getActiveContext());
  clearSearch();
}

function setInventoryTab(tab) {
  inventoryTab = tab || 'avatar';
  inventoryTabs.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.invTab === inventoryTab);
  });
  if (inventoryTitleEl) {
    const label = inventoryTab === 'avatar' ? 'Avatar' : inventoryTab === 'title' ? 'Danh hiệu' : 'Icon';
    inventoryTitleEl.textContent = `Kho • ${label}`;
  }
  renderInventory();
}

function normalizeInventoryItem(input, fallbackName = 'Vật phẩm') {
  if (!input) return null;
  return {
    name: input.name || input.title || fallbackName,
    image: input.image || '/placeholder.svg',
    price: input.price || '',
  };
}

function createInventoryCell(item, { interactive = true, showInfo = true } = {}) {
  const isButton = interactive;
  const cell = document.createElement(isButton ? 'button' : 'div');
  if (isButton) cell.type = 'button';
  cell.className = interactive ? 'inv-cell' : 'inv-cell inv-cell-static';
  if (!item) {
    if (isButton) cell.disabled = true;
    cell.setAttribute('aria-hidden', 'true');
    return cell;
  }
  if (showInfo) {
    cell.title = item.name || 'Vật phẩm';
    cell.setAttribute('aria-label', item.name || 'Vật phẩm');
  }

  const img = document.createElement('img');
  setupProgressiveImage(img, item.image, { alt: showInfo ? item.name || 'Vật phẩm' : '' });
  cell.appendChild(img);

  if (interactive) {
    cell.addEventListener('click', () => {
      openModal(item.name || 'Vật phẩm', item.price ? `Giá: ${item.price}` : 'Vật phẩm trong kho.');
    });
  }
  return cell;
}

function renderInventory() {
  if (!inventoryGrid) return;
  inventoryGrid.innerHTML = '';

  const hasAny =
    (Array.isArray(inventoryAvatarItems) && inventoryAvatarItems.length) ||
    (Array.isArray(inventoryStoreItems) && inventoryStoreItems.length);
  if (!hasAny) {
    inventoryGrid.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
    return;
  }

  if (inventoryTab === 'title') {
    inventoryGrid.classList.add('inventory-grid--labels');
    const titles = ['Cửu Tiêu Đế Tôn', 'Vạn Bảo Thiên Quân', 'Thái Cổ Thần Hoàng'];
    const filled = titles.slice(0, 100);
    while (filled.length < 100) filled.push('');
    filled.forEach((label) => {
      const cell = document.createElement('div');
      cell.className = 'inv-cell inv-cell-label';
      cell.textContent = label || '';
      if (!label) cell.setAttribute('aria-hidden', 'true');
      inventoryGrid.appendChild(cell);
    });
    return;
  }

  inventoryGrid.classList.remove('inventory-grid--labels');
  const term = getSearchTerm();
  const source =
    inventoryTab === 'avatar'
      ? inventoryAvatarItems
      : inventoryTab === 'icon'
        ? inventoryStoreItems
        : inventoryStoreItems;

  const base = Array.isArray(source) ? source : [];
  const filtered = term
    ? base.filter((item) => String(item.name || item.title || '').toLowerCase().includes(term))
    : base;

  const list = filtered.map((item) =>
    inventoryTab === 'avatar'
      ? { image: item.image || '/placeholder.svg', name: '', price: '' }
      : normalizeInventoryItem(item, 'Vật phẩm')
  );
  const filled = list.slice(0, 100);
  while (filled.length < 100) filled.push(null);

  filled.forEach((item) => {
    inventoryGrid.appendChild(
      createInventoryCell(item, {
        interactive: inventoryTab !== 'avatar',
        showInfo: inventoryTab !== 'avatar',
      })
    );
  });
}

async function loadInventory() {
  if (inventoryLoaded) {
    renderInventory();
    return;
  }
  inventoryLoaded = true;
  try {
    const [storeRes, gamesRes] = await Promise.all([fetch('/api/store'), fetch('/api/games')]);
    const storeData = await storeRes.json();
    const gamesData = await gamesRes.json();

    inventoryStoreItems = Array.isArray(storeData.items) ? storeData.items : [];
    const games = Array.isArray(gamesData.games) ? gamesData.games : [];
    inventoryAvatarItems = games.filter((g) => g && g.type === 'rank' && g.image);
  } catch (err) {
    inventoryStoreItems = [];
    inventoryAvatarItems = [];
  }
  if (!inventoryStoreItems.length && !inventoryAvatarItems.length) {
    if (inventoryGrid) {
      inventoryGrid.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Không tải được dữ liệu kho.';
      inventoryGrid.appendChild(empty);
    }
    return;
  }
  renderInventory();
}

function parseNumberLike(value) {
  if (value === undefined || value === null) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const numeric = Number(raw.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatGems(value) {
  const numeric = parseNumberLike(value);
  if (!numeric) return '0';
  return numeric.toLocaleString('vi-VN');
}

function getProfileOverride() {
  try {
    const raw = localStorage.getItem('vme_profile_override');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function setProfileOverride(profile) {
  try {
    localStorage.setItem('vme_profile_override', JSON.stringify(profile));
  } catch (err) {
    // ignore storage errors
  }
}

function applyProfileToHeader(profile) {
  if (!profile) return;
  if (pro5NameEl && profile.name) pro5NameEl.textContent = String(profile.name);
  if (balanceValueEl) {
    const balance = profile.balance ?? 10000;
    balanceValueEl.textContent = formatGems(balance);
  }
}

function createProfileField(labelText, name, value = '') {
  const wrap = document.createElement('div');
  wrap.className = 'profile-field';

  const label = document.createElement('label');
  label.textContent = labelText;

  const input = document.createElement('input');
  input.name = name;
  input.value = String(value ?? '');
  input.autocomplete = 'off';

  wrap.appendChild(label);
  wrap.appendChild(input);
  return wrap;
}

async function copyToClipboard(text) {
  const value = String(text || '');
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (err) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const ok = document.execCommand('copy');
      textarea.remove();
      return ok;
    } catch (err2) {
      return false;
    }
  }
}

function openManualCopyModal(title, value) {
  const wrap = document.createElement('div');
  wrap.className = 'copy-fallback';

  const hint = document.createElement('div');
  hint.className = 'copy-fallback-hint';
  hint.textContent = 'Trình duyệt chặn quyền copy. Hãy bôi đen và copy thủ công:';

  const input = document.createElement('input');
  input.className = 'copy-fallback-input';
  input.type = 'text';
  input.value = String(value || '');
  input.readOnly = true;

  wrap.appendChild(hint);
  wrap.appendChild(input);

  openModal(title, wrap);

  setTimeout(() => {
    try {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
    } catch (err) {
      // ignore
    }
  }, 0);
}

function openEditProfileModal(profile) {
  const form = document.createElement('form');
  form.className = 'pro5-edit-form';

  const grid = document.createElement('div');
  grid.className = 'pro5-edit-grid';

  const fields = [
    ['Tên', 'name', profile.name],
    ['Username', 'username', profile.username],
    ['ID', 'uid', profile.uid],
    ['Trạng thái', 'status', profile.status],
    ['Danh hiệu', 'title', profile.title],
    ['Level', 'level', profile.level],
    ['Mã mời', 'inviteCode', profile.inviteCode],
    ['Avatar (link ảnh)', 'avatar', profile.avatar],
    ['Số dư (tiên ngọc)', 'balance', profile.balance],
    ['Email', 'email', profile.email],
    ['SĐT', 'phone', profile.phone],
    ['Địa chỉ', 'address', profile.address],
  ];

  fields.forEach(([label, name, value]) => {
    grid.appendChild(createProfileField(label, name, value));
  });

  const actions = document.createElement('div');
  actions.className = 'pro5-edit-actions';
  const save = document.createElement('button');
  save.type = 'submit';
  save.className = 'profile-save';
  save.textContent = 'Lưu';
  actions.appendChild(save);

  form.appendChild(grid);
  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const override = {
      ...profile,
      name: String(formData.get('name') || '').trim() || profile.name,
      username: String(formData.get('username') || '').trim(),
      uid: String(formData.get('uid') || '').trim(),
      status: String(formData.get('status') || '').trim(),
      title: String(formData.get('title') || '').trim() || profile.title,
      level: String(formData.get('level') || '').trim() || profile.level,
      inviteCode: String(formData.get('inviteCode') || '').trim() || profile.inviteCode,
      avatar: String(formData.get('avatar') || '').trim() || profile.avatar,
      balance: String(formData.get('balance') || '').trim() || profile.balance,
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      address: String(formData.get('address') || '').trim(),
    };
    setProfileOverride(override);
    applyProfileToHeader(override);
    renderProfileFrame(override);
    closeModal();
  });

  openModal('Chỉnh sửa thông tin', form);
}

function renderProfileFrame(profile) {
  if (!profileFrame) return;
  profileFrame.innerHTML = '';

  const displayName = String(profile.username || profile.name || 'Anh Quân').trim();
  const uidText = String(profile.uid || '').trim();
  const statusText = String(profile.status || 'Chưa xác thực').trim();
  const inviteCode = String(profile.inviteCode || '').trim();
  const levelText = String(profile.level || '').trim();
  const titleText = String(profile.title || '').trim();
  const vipText = String(profile.vip || '').trim();

  const hero = document.createElement('section');
  hero.className = 'pro5-hero';

  const heroRow = document.createElement('div');
  heroRow.className = 'pro5-hero-row';

  const avatar = document.createElement('div');
  avatar.className = 'pro5-hero-avatar';
  const img = document.createElement('img');
  setupProgressiveImage(img, profile.avatar, { alt: displayName || 'Avatar' });
  avatar.appendChild(img);

  const info = document.createElement('div');
  info.className = 'pro5-hero-info';

  const nameRow = document.createElement('div');
  nameRow.className = 'pro5-hero-name-row';

  const name = document.createElement('div');
  name.className = 'pro5-hero-name';
  name.textContent = displayName;

  const actions = document.createElement('div');
  actions.className = 'pro5-hero-actions';

  if (vipText) {
    const vip = document.createElement('span');
    vip.className = 'pro5-vip';
    vip.innerHTML = `
      <span class="pro5-vip-icon" aria-hidden="true">
        <svg class="lucide" viewBox="0 0 24 24">
          <use href="#icon-crown" />
        </svg>
      </span>
      <span class="pro5-vip-text">VIP ${vipText}</span>
    `;
    actions.appendChild(vip);
  }

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'pro5-hero-edit';
  editBtn.textContent = 'Chỉnh sửa';
  editBtn.addEventListener('click', () => openEditProfileModal(profile));
  actions.appendChild(editBtn);

  nameRow.appendChild(name);
  nameRow.appendChild(actions);

  const metaLine = document.createElement('div');
  metaLine.className = 'pro5-hero-meta';
  const parts = [];
  if (titleText) parts.push(titleText);
  if (levelText) parts.push(`Lv. ${levelText}`);
  metaLine.textContent = parts.join(' • ');

  const uidLine = document.createElement('div');
  uidLine.className = 'pro5-hero-sub';
  uidLine.textContent = uidText ? `ID: ${uidText}` : '';

  const statusLine = document.createElement('div');
  statusLine.className = 'pro5-hero-status';
  statusLine.textContent = statusText;

  info.appendChild(nameRow);
  if (metaLine.textContent) info.appendChild(metaLine);
  if (uidLine.textContent) info.appendChild(uidLine);
  info.appendChild(statusLine);

  heroRow.appendChild(avatar);
  heroRow.appendChild(info);
  hero.appendChild(heroRow);

  if (inviteCode) {
    const inviteRow = document.createElement('div');
    inviteRow.className = 'pro5-invite-row';

    const code = document.createElement('div');
    code.className = 'pro5-invite-code';
    code.textContent = inviteCode;

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'pro5-invite-copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', async () => {
      const ok = await copyToClipboard(code.textContent);
      if (ok) {
        const prev = copy.textContent;
        copy.textContent = 'Đã copy';
        window.setTimeout(() => {
          copy.textContent = prev;
        }, 900);
        return;
      }
      openManualCopyModal('Mã giới thiệu', code.textContent);
    });

    inviteRow.appendChild(code);
    inviteRow.appendChild(copy);
    hero.appendChild(inviteRow);
  }

  profileFrame.appendChild(hero);
}

function renderPlayedGames(gamesList) {
  if (!profileGamesGrid) return;
  profileGamesGrid.innerHTML = '';

  const term = getSearchTerm();
  const base = Array.isArray(gamesList) ? gamesList : [];
  const filtered = term
    ? base.filter((game) => String(game.title || '').toLowerCase().includes(term))
    : base;

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = term ? 'Không tìm thấy game.' : 'Chưa có game đã chơi.';
    profileGamesGrid.appendChild(empty);
    return;
  }

  filtered.forEach((game) => {
    const card = document.createElement('article');
    card.className = 'played-card';

    const thumb = document.createElement('div');
    thumb.className = 'played-thumb';
    const img = document.createElement('img');
    setupProgressiveImage(img, game.image, { alt: game.title || 'Game' });
    thumb.appendChild(img);

    const info = document.createElement('div');
    info.className = 'played-info';

    const title = document.createElement('div');
    title.className = 'played-title';
    title.textContent = game.title || 'Game';

    const meta = document.createElement('div');
    meta.className = 'played-meta';
    const lastPlayed = String(game.lastPlayed || '').trim();
    const hours = String(game.hours || '').trim();
    const level = String(game.level || '').trim();
    if (lastPlayed) {
      const item = document.createElement('span');
      item.textContent = `Lần cuối: ${lastPlayed}`;
      meta.appendChild(item);
    }
    if (hours) {
      const item = document.createElement('span');
      item.textContent = `Giờ chơi: ${hours}`;
      meta.appendChild(item);
    }
    if (level) {
      const item = document.createElement('span');
      item.textContent = `Lv. ${level}`;
      meta.appendChild(item);
    }

    info.appendChild(title);
    if (meta.childNodes.length) info.appendChild(meta);

    card.appendChild(thumb);
    card.appendChild(info);
    profileGamesGrid.appendChild(card);
  });
}

async function loadProfileView() {
  if (!profileFrame || !profileGamesGrid) return;
  profileFrame.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
  profileGamesGrid.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

  try {
    const [profileRes, gamesRes] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/profile/games'),
    ]);
    const profileData = await profileRes.json();
    const gamesData = await gamesRes.json();

    const baseProfile = profileData.profile || profileData || {};
    const override = getProfileOverride();
    const merged = { ...baseProfile, ...(override || {}) };

    applyProfileToHeader(merged);
    renderProfileFrame(merged);
    profilePlayedGames = Array.isArray(gamesData.games) ? gamesData.games : [];
    renderPlayedGames(profilePlayedGames);
  } catch (error) {
    profileFrame.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Không tải được dữ liệu Pro5.';
    profileFrame.appendChild(empty);

    profileGamesGrid.innerHTML = '';
    const empty2 = document.createElement('div');
    empty2.className = 'empty';
    empty2.textContent = 'Không tải được danh sách game đã chơi.';
    profileGamesGrid.appendChild(empty2);
  }
}

async function loadProfileSummary() {
  try {
    const response = await fetch('/api/profile');
    const data = await response.json();
    const baseProfile = data.profile || data || {};
    const override = getProfileOverride();
    const merged = { ...baseProfile, ...(override || {}) };
    applyProfileToHeader(merged);
  } catch (err) {
    applyProfileToHeader({ name: 'Anh Quân', balance: 10000 });
  }
}

function renderStore() {
  if (!storeGridEl) return;
  storeGridEl.innerHTML = '';

  const term = getSearchTerm();
  const base = storeItems;
  const filtered = term
    ? base.filter((item) => String(item.name || '').toLowerCase().includes(term))
    : base;

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = term ? 'Không tìm thấy vật phẩm.' : 'Chưa có dữ liệu cửa hàng.';
    storeGridEl.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
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

  const term = getSearchTerm();
  let base = agents;
  if (agentSortMode === 'rating') {
    base = [...agents].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (agentSortMode === 'name') {
    base = [...agents].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
  }
  const filtered = term
    ? base.filter((agent) => String(agent.name || '').toLowerCase().includes(term))
    : base;

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = term ? 'Không tìm thấy đại lý.' : 'Chưa có đại lý.';
    agentListEl.appendChild(empty);
    return;
  }

  filtered.forEach((agent, index) => {
    const row = document.createElement('article');
    row.className = 'game-row agent-row';
    row.style.setProperty('--delay', `${index * 40}ms`);
    row.dataset.agentIndex = String(index);

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

    const meta = document.createElement('div');
    meta.className = 'agent-meta';

    const ratingWrap = document.createElement('div');
    ratingWrap.className = 'agent-rating';

    const stars = document.createElement('div');
    stars.className = 'agent-stars';

    const ratingValue = Math.max(0, Math.min(5, Number(agent.rating) || 0));
    const filledStars = Math.round(ratingValue);
    for (let i = 1; i <= 5; i += 1) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', `agent-star${i <= filledStars ? ' filled' : ''}`);
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#icon-star');
      svg.appendChild(use);
      stars.appendChild(svg);
    }

    const ratingText = document.createElement('div');
    ratingText.className = 'agent-rating-text';
    ratingText.textContent = `${ratingValue.toFixed(1)}/5`;

    ratingWrap.appendChild(stars);
    ratingWrap.appendChild(ratingText);

    const rowActions = document.createElement('div');
    rowActions.className = 'agent-row-actions';

    const policyBtn = document.createElement('button');
    policyBtn.className = 'agent-row-btn';
    policyBtn.type = 'button';
    policyBtn.setAttribute('aria-label', 'Chính sách');
    policyBtn.setAttribute('title', 'Chính sách');
    policyBtn.dataset.agentAction = 'policy';
    policyBtn.dataset.agentName = agent.name || '';
    policyBtn.innerHTML = `
      <svg class="lucide" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#icon-book"></use>
      </svg>
    `;

    const contactBtn = document.createElement('button');
    contactBtn.className = 'agent-row-btn';
    contactBtn.type = 'button';
    contactBtn.setAttribute('aria-label', 'Liên hệ đại lý');
    contactBtn.setAttribute('title', 'Liên hệ đại lý');
    contactBtn.dataset.agentAction = 'contact';
    contactBtn.dataset.agentPhone = String(agent.phone || '').trim();
    contactBtn.dataset.agentName = agent.name || '';
    contactBtn.innerHTML = `
      <svg class="lucide" viewBox="0 0 24 24" aria-hidden="true">
        <use href="#icon-phone"></use>
      </svg>
    `;

    rowActions.appendChild(policyBtn);
    rowActions.appendChild(contactBtn);

    meta.appendChild(ratingWrap);
    meta.appendChild(rowActions);
    info.appendChild(meta);

    row.appendChild(imageWrap);
    row.appendChild(info);
    agentListEl.appendChild(row);
  });
}

function parseDelimitedText(rawText, fileName = '') {
  const raw = String(rawText || '').replace(/^\uFEFF/, '');
  const firstLine = raw.split(/\r?\n/).find((line) => line.trim().length) || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter =
    fileName.toLowerCase().endsWith('.esv') ? ';' : tabCount >= commaCount && tabCount >= semiCount ? '\t' : semiCount > commaCount ? ';' : ',';

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const headers = lines[0].split(delimiter).map((h) => String(h || '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(delimiter);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = String(cells[idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

function mapImportedAgent(row, index) {
  const norm = {};
  Object.entries(row || {}).forEach(([k, v]) => {
    norm[String(k || '').toLowerCase().trim()] = v;
  });
  const name = norm.ten || norm.name || norm['tên'] || `Đại lý ${index + 1}`;
  const image = norm.anh || norm['ảnh'] || norm.avatar || norm.image || norm.img || '';
  const info = norm['thông tin'] || norm['thong tin'] || norm.mota || norm['mô tả'] || norm.description || '';
  const ratingRaw = norm.rating || norm['danh gia'] || norm['đánh giá'] || norm.sao || '';
  const ratingParsed = Number(String(ratingRaw).replace(/[^0-9.]/g, ''));
  const rating = !Number.isNaN(ratingParsed) && ratingParsed > 0 ? Math.max(0, Math.min(5, ratingParsed)) : 4.0 + ((index * 3) % 10) / 10;
  const phone = norm.phone || norm.sdt || norm['sđt'] || norm['số điện thoại'] || norm['so dien thoai'] || '';
  return {
    name: String(name || '').trim(),
    image: String(image || '').trim() || '/placeholder.svg',
    info: String(info || '').trim(),
    rating,
    phone: String(phone || '').trim(),
  };
}

function loadCustomAgentsFromStorage() {
  try {
    const raw = localStorage.getItem('vme_agents_custom');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return false;
    agents = parsed;
    agentsOriginal = [...agents];
    agentsLoaded = true;
    return true;
  } catch (err) {
    return false;
  }
}

async function loadAgents() {
  if (agentsLoaded) return;
  if (loadCustomAgentsFromStorage()) {
    renderAgents();
    return;
  }
  agentsLoaded = true;
  if (!agentListEl) return;
  agentListEl.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

  try {
    const response = await fetch('/api/agents');
    const data = await response.json();
    agents = Array.isArray(data.agents) ? data.agents : [];
    agentsOriginal = [...agents];
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
  modalBody.textContent = '';
  if (description instanceof Node) {
    modalBody.style.whiteSpace = 'normal';
    modalBody.appendChild(description);
  } else {
    modalBody.style.whiteSpace = 'pre-line';
    modalBody.textContent = description || '';
  }
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
  setSearchPlaceholder(getActiveContext());
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
  closeProfile();
  closeInventory();
  setActiveNav('home');
  setActiveTab('home');
  setSearchPlaceholder('home');
  clearSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goRank() {
  closeModal();
  closeMenu();
  closeCheckin();
  closeAgents();
  closeStore();
  closeProfile();
  closeInventory();
  setActiveNav('rank');
  setActiveTab('rank');
  setSearchPlaceholder('rank');
  clearSearch();
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

searchInput.addEventListener('input', () => {
  refreshActiveSearch();
});
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab || 'home';
    setActiveTab(tab);
    clearSearch();
  });
});
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const nav = btn.dataset.nav || 'home';
    if (
      (document.body.classList.contains('profile-open') || document.body.classList.contains('inventory-open')) &&
      nav !== 'home' &&
      nav !== 'task'
    ) {
      return;
    }
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
    if (nav === 'task') {
      window.location.href = '/tasks.html';
      return;
    }
    closeModal();
    closeMenu();
    closeCheckin();
    closeAgents();
    closeStore();
    closeProfile();
    closeInventory();
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
if (taskInviteTrigger) {
  taskInviteTrigger.addEventListener('click', () => {
    window.location.href = '/tasks.html#invite';
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
if (agentSortButton) {
  agentSortButton.addEventListener('click', () => {
    agentSortMode = agentSortMode === 'default' ? 'rating' : agentSortMode === 'rating' ? 'name' : 'default';
    renderAgents();
  });
}
if (agentPolicyButton) {
  agentPolicyButton.addEventListener('click', () => {
    openModal(
      'Chính sách đại lý',
      [
        '- Giao dịch minh bạch, đúng mô tả.',
        '- Không chia sẻ thông tin đăng nhập cho người khác.',
        '- Khi có lỗi/hoàn tiền: liên hệ đại lý trong 24h.',
      ].join('\n')
    );
  });
}
if (agentContactButton) {
  agentContactButton.addEventListener('click', () => {
    openModal('Liên hệ đại lý', 'Chọn 1 đại lý trong danh sách và bấm icon Liên hệ (☎) để xem SĐT.');
  });
}
if (agentUploadButton && agentUploadInput) {
  agentUploadButton.addEventListener('click', () => {
    agentUploadInput.value = '';
    agentUploadInput.click();
  });
  agentUploadInput.addEventListener('change', async () => {
    const file = agentUploadInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseDelimitedText(text, file.name);
      const imported = rows.map((row, idx) => mapImportedAgent(row, idx)).filter((a) => a && a.name);
      if (!imported.length) {
        openModal('Upload', 'File không có dữ liệu đại lý hợp lệ.');
        return;
      }
      agents = imported;
      agentsOriginal = [...agents];
      agentsLoaded = true;
      try {
        localStorage.setItem('vme_agents_custom', JSON.stringify(imported));
      } catch (err) {
        // ignore
      }
      openModal('Upload', `Đã import ${imported.length} đại lý.`);
      renderAgents();
    } catch (err) {
      openModal('Upload', 'Không đọc được file. Vui lòng thử lại.');
    }
  });
}
if (agentListEl) {
  agentListEl.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-agent-action]');
    if (!btn) return;
    const action = btn.dataset.agentAction;
    const name = String(btn.dataset.agentName || '').trim() || 'Đại lý';
    if (action === 'policy') {
      openModal('Chính sách', `Chính sách áp dụng cho ${name}.\n\n- Bảo mật thông tin.\n- Hỗ trợ nhanh.\n- Giao dịch đúng mô tả.`);
      return;
    }
    if (action === 'contact') {
      const phone = String(btn.dataset.agentPhone || '').trim();
      if (phone) {
        openModal('Liên hệ đại lý', `${name}\nSĐT: ${phone}`);
      } else {
        openModal('Liên hệ đại lý', `${name}\nChưa có SĐT. Vui lòng inbox qua chat.`);
      }
    }
  });
}
if (storeHomeButton) {
  storeHomeButton.addEventListener('click', () => {
    goHome();
  });
}
if (pro5Btn) {
  pro5Btn.addEventListener('click', () => {
    openProfile();
  });
}
if (profileCloseButton) {
  profileCloseButton.addEventListener('click', () => {
    closeProfile();
  });
}
if (profileHomeButton) {
  profileHomeButton.addEventListener('click', () => {
    goHome();
  });
}
if (khoButton) {
  khoButton.addEventListener('click', () => {
    openInventory();
  });
}
if (inventoryCloseButton) {
  inventoryCloseButton.addEventListener('click', () => {
    closeInventory();
  });
}
if (inventoryHomeButton) {
  inventoryHomeButton.addEventListener('click', () => {
    openProfile();
  });
}
if (chatbotBtn) {
  chatbotBtn.addEventListener('click', () => {
    openModal('Chatbot', 'Tính năng Chatbot đang phát triển.\n\nBạn có thể xem thông báo chạy phía trên icon.');
  });
}
function handleInventoryTabInteraction(event) {
  const tabBtn = event.target.closest('.inventory-tab');
  if (!tabBtn) return;
  event.preventDefault();
  setInventoryTab(tabBtn.dataset.invTab || 'avatar');
}
if (inventoryTabsWrap) {
  inventoryTabsWrap.addEventListener('touchstart', handleInventoryTabInteraction, { passive: false });
  inventoryTabsWrap.addEventListener('pointerdown', handleInventoryTabInteraction);
  inventoryTabsWrap.addEventListener('click', handleInventoryTabInteraction);
  inventoryTabsWrap.addEventListener('touchend', handleInventoryTabInteraction, { passive: false });
  inventoryTabsWrap.addEventListener('pointerup', handleInventoryTabInteraction);
} else if (inventoryTabs.length) {
  inventoryTabs.forEach((btn) => {
    btn.addEventListener('touchstart', handleInventoryTabInteraction, { passive: false });
    btn.addEventListener('pointerdown', handleInventoryTabInteraction);
    btn.addEventListener('click', handleInventoryTabInteraction);
    btn.addEventListener('touchend', handleInventoryTabInteraction, { passive: false });
    btn.addEventListener('pointerup', handleInventoryTabInteraction);
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
    closeProfile();
    closeInventory();
  }
});
loadGames();
loadProfileSummary();
setSearchPlaceholder(getActiveContext());
