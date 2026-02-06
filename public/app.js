const listEl = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const tabButtons = Array.from(document.querySelectorAll('.tab'));

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

  const addMeta = (label, value) => {
    if (!value) return;
    const item = document.createElement('div');
    item.className = 'h5-item';

    const itemLabel = document.createElement('div');
    itemLabel.className = 'h5-label';
    itemLabel.textContent = label;

    const itemValue = document.createElement('div');
    itemValue.className = 'h5-value';
    itemValue.textContent = value;

    item.appendChild(itemLabel);
    item.appendChild(itemValue);
    meta.appendChild(item);
  };

  addMeta('Category', game.category);
  addMeta('Dung lượng', game.capacity);
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

function setActiveTab(tab) {
  activeTab = tab;
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  listEl.classList.toggle('h5-list', tab === 'h5');
  renderList();
}

function renderList() {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = games.filter((game) => {
    if (activeTab === 'h5') {
      if (game.type !== 'h5') return false;
    } else if (game.type === 'h5') {
      return false;
    }
    const title = String(game.title || '').toLowerCase();
    return title.includes(term);
  });

  listEl.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = activeTab === 'h5' ? 'Chưa có game H5.' : 'Không có game phù hợp.';
    listEl.appendChild(empty);
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
    if (games.length && games.every((game) => game.type === 'h5')) {
      activeTab = 'h5';
      tabButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === 'h5');
      });
      listEl.classList.add('h5-list');
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
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
loadGames();
