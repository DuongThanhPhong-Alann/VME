(() => {
  const body = document.body;
  if (!body || !body.classList.contains('tet-theme')) return;
  if (document.querySelector('.tet-scene')) return;

  function mediaUrl(winPath) {
    return `/media?path=${encodeURIComponent(winPath)}`;
  }

  const PETAL_IMAGES = {
    dao: {
      primary: '/kaidao1.png?v=20260211',
      fallback: mediaUrl('D:\\VME\\kaidao1.png'),
    },
    mai: {
      primary: '/kaimai1.png?v=20260211',
      fallback: mediaUrl('D:\\VME\\kaimai1.png'),
    },
  };

  function createFlowerIcon(type) {
    const icon = document.createElement('span');
    icon.className = 'tet-flower-icon';

    const imageSet = PETAL_IMAGES[type] || PETAL_IMAGES.dao;
    const img = document.createElement('img');
    img.className = 'tet-flower-img';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.src = imageSet.primary;
    img.addEventListener(
      'error',
      () => {
        if (img.dataset.retry === '1') {
          icon.style.display = 'none';
          return;
        }
        img.dataset.retry = '1';
        img.src = imageSet.fallback;
      },
    );
    icon.appendChild(img);
    return icon;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = document.createElement('div');
  scene.className = 'tet-scene';
  scene.setAttribute('aria-hidden', 'true');

  const flowers = document.createElement('div');
  flowers.className = 'tet-flowers';
  scene.appendChild(flowers);

  const envelopes = document.createElement('div');
  envelopes.className = 'tet-envelopes';
  scene.appendChild(envelopes);

  const lanternLeft = document.createElement('div');
  lanternLeft.className = 'tet-lantern tet-lantern-left';
  scene.appendChild(lanternLeft);

  const lanternRight = document.createElement('div');
  lanternRight.className = 'tet-lantern tet-lantern-right';
  scene.appendChild(lanternRight);

  body.prepend(scene);

  const viewport = Math.max(window.innerWidth || 0, 320);
  const maxFlowers = prefersReducedMotion ? 14 : 30;
  const minFlowers = prefersReducedMotion ? 8 : 16;
  const flowerCount = Math.max(minFlowers, Math.min(maxFlowers, Math.round(viewport / 52)));

  const maxEnvelopes = prefersReducedMotion ? 4 : 8;
  const minEnvelopes = prefersReducedMotion ? 2 : 4;
  const envelopeCount = Math.max(minEnvelopes, Math.min(maxEnvelopes, Math.round(viewport / 190)));

  for (let i = 0; i < flowerCount; i += 1) {
    const flower = document.createElement('span');
    const type = Math.random() > 0.5 ? 'dao' : 'mai';
    flower.className = `tet-flower is-${type}`;
    flower.appendChild(createFlowerIcon(type));

    const size = Math.round(18 + Math.random() * 20);
    const duration = prefersReducedMotion ? 20 + Math.random() * 8 : 12 + Math.random() * 14;
    const delay = -Math.random() * duration;
    const opacity = 0.74 + Math.random() * 0.24;
    const drift = -170 + Math.random() * 340;
    const curveA = drift * 0.24 + (-28 + Math.random() * 56);
    const curveB = drift * 0.58 + (-38 + Math.random() * 76);
    const curveC = drift * 0.84 + (-28 + Math.random() * 56);
    const spin = (Math.random() > 0.5 ? 1 : -1) * (220 + Math.random() * 360);
    const tilt = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 14);
    const startX = Math.random() * 100;
    const sway = 26 + Math.random() * 42;
    const flutterDuration = 2.8 + Math.random() * 4.8;
    const flutterAngle = (Math.random() > 0.5 ? 1 : -1) * (9 + Math.random() * 17);

    flower.style.setProperty('--start-x', `${startX}vw`);
    flower.style.setProperty('--size', `${size}px`);
    flower.style.setProperty('--duration', `${duration}s`);
    flower.style.setProperty('--delay', `${delay}s`);
    flower.style.setProperty('--drift', `${drift}px`);
    flower.style.setProperty('--curve-a', `${curveA}px`);
    flower.style.setProperty('--curve-b', `${curveB}px`);
    flower.style.setProperty('--curve-c', `${curveC}px`);
    flower.style.setProperty('--spin', `${spin}deg`);
    flower.style.setProperty('--tilt', `${tilt}deg`);
    flower.style.setProperty('--opacity', String(opacity));
    flower.style.setProperty('--sway', `${sway}px`);
    flower.style.setProperty('--flutter-duration', `${flutterDuration}s`);
    flower.style.setProperty('--flutter-angle', `${flutterAngle}deg`);

    flowers.appendChild(flower);
  }

  for (let i = 0; i < envelopeCount; i += 1) {
    const envelope = document.createElement('span');
    envelope.className = 'tet-envelope';

    const width = Math.round(24 + Math.random() * 12);
    const duration = prefersReducedMotion ? 16 + Math.random() * 7 : 9 + Math.random() * 10;
    const delay = -Math.random() * duration;
    const opacity = 0.96 + Math.random() * 0.04;
    const drift = -130 + Math.random() * 260;
    const spin = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 120);
    const startX = Math.random() * 100;
    const sway = 24 + Math.random() * 50;

    envelope.style.setProperty('--start-x', `${startX}vw`);
    envelope.style.setProperty('--env-w', `${width}px`);
    envelope.style.setProperty('--duration', `${duration}s`);
    envelope.style.setProperty('--delay', `${delay}s`);
    envelope.style.setProperty('--drift', `${drift}px`);
    envelope.style.setProperty('--spin', `${spin}deg`);
    envelope.style.setProperty('--opacity', String(opacity));
    envelope.style.setProperty('--sway', `${sway}px`);

    envelopes.appendChild(envelope);
  }
})();
