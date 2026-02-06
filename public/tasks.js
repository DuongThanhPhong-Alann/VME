const tabButtons = Array.from(document.querySelectorAll('.tasks-tab'));
const panels = Array.from(document.querySelectorAll('.tasks-panel'));

const myInviteCodeEl = document.getElementById('myInviteCode');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const inviteInput = document.getElementById('inviteInput');
const inviteSubmitBtn = document.getElementById('inviteSubmitBtn');
const inviteStatus = document.getElementById('inviteStatus');
const backBtn = document.getElementById('tasksBackBtn');

const inviteTasksGrid = document.getElementById('inviteTasksGrid');
const dailyTasksGrid = document.getElementById('dailyTasksGrid');
const vipTasksGrid = document.getElementById('vipTasksGrid');
const eventTasksGrid = document.getElementById('eventTasksGrid');
const linkedGrid = document.getElementById('linkedGrid');

function getInitialTab() {
  const hash = String(window.location.hash || '').replace('#', '').trim().toLowerCase();
  if (hash) return hash;
  const url = new URL(window.location.href);
  const qp = String(url.searchParams.get('tab') || '').trim().toLowerCase();
  return qp || 'invite';
}

function setActiveTab(tab) {
  const safeTab = String(tab || 'invite').trim().toLowerCase();
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === safeTab));
  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === safeTab;
    panel.hidden = !isActive;
  });
  window.history.replaceState(null, '', `#${encodeURIComponent(safeTab)}`);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function clearNode(el) {
  if (!el) return;
  el.innerHTML = '';
}

function renderEmpty(el, message) {
  const empty = document.createElement('div');
  empty.className = 'empty';
  empty.textContent = message;
  el.appendChild(empty);
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';

  const top = document.createElement('div');
  top.className = 'task-top';

  const title = document.createElement('div');
  title.className = 'task-title';
  title.textContent = task.title || 'Nhiệm vụ';

  const reward = document.createElement('div');
  reward.className = 'task-reward';
  reward.textContent = task.reward || '';

  top.appendChild(title);
  if (String(task.reward || '').trim()) top.appendChild(reward);

  const desc = document.createElement('div');
  desc.className = 'task-desc';
  desc.textContent = task.description || '';

  card.appendChild(top);
  if (String(task.description || '').trim()) card.appendChild(desc);
  return card;
}

function renderTasks(gridEl, tasks) {
  clearNode(gridEl);
  if (!Array.isArray(tasks) || !tasks.length) {
    renderEmpty(gridEl, 'Chưa có nhiệm vụ.');
    return;
  }
  tasks.forEach((task) => gridEl.appendChild(createTaskCard(task)));
}

function fallbackInviteCode({ name, rank } = {}) {
  const safeRank = Number(rank) || 0;
  const initial = String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const suffix = String(1000 + (safeRank * 73) % 9000);
  return `VME-${initial || 'U'}-${suffix}`;
}

function createLinkedCard(link) {
  const card = document.createElement('div');
  card.className = 'linked-card';

  const head = document.createElement('div');
  head.className = 'linked-head';

  const avatar = document.createElement('img');
  avatar.className = 'linked-avatar';
  avatar.alt = link.name || 'Avatar';
  avatar.loading = 'lazy';
  avatar.decoding = 'async';
  avatar.src = link.avatar || '/placeholder.svg';

  const meta = document.createElement('div');
  meta.className = 'linked-meta';

  const name = document.createElement('div');
  name.className = 'linked-name';
  name.textContent = link.name || 'Người chơi';

  const sub = document.createElement('div');
  sub.className = 'linked-sub';
  const money = String(link.money || '').trim();
  sub.textContent = `#${link.rank || '-'}${money ? ` • ${money}` : ''}`;

  meta.appendChild(name);
  meta.appendChild(sub);

  const invite = document.createElement('div');
  invite.className = 'linked-invite';

  const inviteLabel = document.createElement('div');
  inviteLabel.className = 'linked-invite-label';
  inviteLabel.textContent = 'Mã mời';

  const inviteCode = document.createElement('div');
  inviteCode.className = 'linked-invite-code';
  inviteCode.textContent = String(link.inviteCode || '').trim() || fallbackInviteCode(link);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'linked-invite-copy';
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    const text = String(inviteCode.textContent || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Đã copy';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 900);
    } catch (err) {
      // ignore
    }
  });

  invite.appendChild(inviteLabel);
  invite.appendChild(inviteCode);
  invite.appendChild(copyBtn);

  head.appendChild(avatar);
  head.appendChild(meta);

  const taskList = document.createElement('div');
  taskList.className = 'linked-tasks';

  const tasks = Array.isArray(link.tasks) ? link.tasks : [];
  tasks.slice(0, 3).forEach((t) => {
    const chip = document.createElement('div');
    chip.className = 'linked-task';
    chip.textContent = String(t || '').trim();
    taskList.appendChild(chip);
  });

  card.appendChild(head);
  card.appendChild(invite);
  card.appendChild(taskList);
  return card;
}

function renderLinked(gridEl, links) {
  clearNode(gridEl);
  if (!Array.isArray(links) || !links.length) {
    renderEmpty(gridEl, 'Chưa có liên kết.');
    return;
  }
  links.forEach((link) => gridEl.appendChild(createLinkedCard(link)));
}

function setInviteStatus(message, type = 'info') {
  if (!inviteStatus) return;
  inviteStatus.textContent = message || '';
  inviteStatus.dataset.type = type;
}

function loadSavedInvite() {
  try {
    const code = String(localStorage.getItem('vme_linked_invite') || '').trim();
    if (inviteInput && code) inviteInput.value = code;
  } catch (err) {
    // ignore
  }
}

function bindInviteActions() {
  if (copyInviteBtn && myInviteCodeEl) {
    copyInviteBtn.addEventListener('click', async () => {
      const text = String(myInviteCodeEl.textContent || '').trim();
      if (!text || text === '---') return;
      try {
        await navigator.clipboard.writeText(text);
        copyInviteBtn.textContent = 'Đã copy';
        setTimeout(() => {
          copyInviteBtn.textContent = 'Copy';
        }, 900);
      } catch (err) {
        // ignore
      }
    });
  }

  if (inviteSubmitBtn) {
    inviteSubmitBtn.addEventListener('click', () => {
      const code = String(inviteInput?.value || '').trim();
      if (!code) {
        setInviteStatus('Vui lòng nhập mã mời.', 'error');
        return;
      }
      try {
        localStorage.setItem('vme_linked_invite', code);
      } catch (err) {
        // ignore
      }
      setInviteStatus(`Đã lưu mã mời: ${code}`, 'success');
    });
  }
}

async function loadProfileInviteCode() {
  if (!myInviteCodeEl) return;
  try {
    const data = await fetchJson('/api/profile');
    const code = String(data?.profile?.inviteCode || '').trim();
    myInviteCodeEl.textContent = code || '---';
  } catch (err) {
    myInviteCodeEl.textContent = '---';
  }
}

async function loadAllTasks() {
  const [invite, daily, vip, event, links] = await Promise.allSettled([
    fetchJson('/api/tasks/invite'),
    fetchJson('/api/tasks/daily'),
    fetchJson('/api/tasks/vip'),
    fetchJson('/api/tasks/event'),
    fetchJson('/api/tasks/links'),
  ]);

  renderTasks(inviteTasksGrid, invite.status === 'fulfilled' ? invite.value.tasks : []);
  renderTasks(dailyTasksGrid, daily.status === 'fulfilled' ? daily.value.tasks : []);
  renderTasks(vipTasksGrid, vip.status === 'fulfilled' ? vip.value.tasks : []);
  renderTasks(eventTasksGrid, event.status === 'fulfilled' ? event.value.tasks : []);
  renderLinked(linkedGrid, links.status === 'fulfilled' ? links.value.links : []);
}

function bindTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });
}

function bindBackButton() {
  if (!backBtn) return;
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/';
  });
}

async function init() {
  bindTabs();
  bindBackButton();
  bindInviteActions();
  loadSavedInvite();

  setActiveTab(getInitialTab());
  await Promise.all([loadProfileInviteCode(), loadAllTasks()]);
}

init();
