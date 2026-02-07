(() => {
  const nav = document.querySelector('.bottom-nav');
  if (!nav) return;

  const buttons = Array.from(nav.querySelectorAll('.nav-item[data-nav]'));

  const path = String(window.location.pathname || '');
  const defaultActive = path.endsWith('/rank.html')
    ? 'rank'
    : path.endsWith('/tasks.html')
      ? 'task'
      : 'home';

  buttons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === defaultActive);
  });

  nav.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-item[data-nav]');
    if (!button) return;

    const target = String(button.dataset.nav || 'home');
    if (target === 'home') {
      window.location.href = '/';
      return;
    }
    if (target === 'rank') {
      window.location.href = '/rank.html';
      return;
    }
    if (target === 'task') {
      window.location.href = '/tasks.html';
      return;
    }
    if (target === 'agent') {
      window.location.href = '/?nav=agent';
      return;
    }
    if (target === 'store') {
      window.location.href = '/?nav=store';
      return;
    }
    window.location.href = '/';
  });
})();
