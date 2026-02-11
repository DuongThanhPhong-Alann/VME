(() => {
  const body = document.body;
  if (!body || !body.classList.contains('tet-theme')) return;
  if (document.querySelector('.tet-scene')) return;

  function createFlowerSvg(isDao) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('class', 'tet-flower-svg');
    svg.setAttribute('aria-hidden', 'true');

    const petalFill = isDao ? '#f38ab4' : '#ffd446';
    const petalStroke = isDao ? '#cc4d82' : '#b77f09';
    const coreFill = isDao ? '#ffe09b' : '#f48a00';
    const coreDot = isDao ? '#d8962f' : '#b66800';

    const petals = [
      { cx: 32, cy: 15, rx: 10, ry: 13, rot: 0 },
      { cx: 47, cy: 25, rx: 10, ry: 13, rot: 72 },
      { cx: 41, cy: 43, rx: 10, ry: 13, rot: 144 },
      { cx: 23, cy: 43, rx: 10, ry: 13, rot: 216 },
      { cx: 17, cy: 25, rx: 10, ry: 13, rot: 288 },
    ];

    petals.forEach((p) => {
      const el = document.createElementNS(ns, 'ellipse');
      el.setAttribute('cx', String(p.cx));
      el.setAttribute('cy', String(p.cy));
      el.setAttribute('rx', String(p.rx));
      el.setAttribute('ry', String(p.ry));
      el.setAttribute('fill', petalFill);
      el.setAttribute('stroke', petalStroke);
      el.setAttribute('stroke-width', '2.2');
      el.setAttribute('transform', `rotate(${p.rot} 32 32)`);
      svg.appendChild(el);
    });

    const core = document.createElementNS(ns, 'circle');
    core.setAttribute('cx', '32');
    core.setAttribute('cy', '32');
    core.setAttribute('r', '8');
    core.setAttribute('fill', coreFill);
    core.setAttribute('stroke', '#b66f0e');
    core.setAttribute('stroke-width', '1.2');
    svg.appendChild(core);

    const dots = [
      [32, 28],
      [28, 31],
      [36, 31],
      [30, 35],
      [34, 35],
    ];
    dots.forEach(([cx, cy]) => {
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', String(cx));
      dot.setAttribute('cy', String(cy));
      dot.setAttribute('r', '1');
      dot.setAttribute('fill', coreDot);
      svg.appendChild(dot);
    });

    return svg;
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
  const maxFlowers = prefersReducedMotion ? 10 : 18;
  const minFlowers = prefersReducedMotion ? 6 : 11;
  const flowerCount = Math.max(minFlowers, Math.min(maxFlowers, Math.round(viewport / 72)));

  const maxEnvelopes = prefersReducedMotion ? 4 : 8;
  const minEnvelopes = prefersReducedMotion ? 2 : 4;
  const envelopeCount = Math.max(minEnvelopes, Math.min(maxEnvelopes, Math.round(viewport / 190)));

  for (let i = 0; i < flowerCount; i += 1) {
    const flower = document.createElement('span');
    const isDao = Math.random() > 0.46;
    flower.className = isDao ? 'tet-flower is-dao' : 'tet-flower is-mai';

    const icon = document.createElement('span');
    icon.className = 'tet-flower-icon';
    icon.appendChild(createFlowerSvg(isDao));
    flower.appendChild(icon);

    const size = Math.round(30 + Math.random() * 16);
    const duration = prefersReducedMotion ? 18 + Math.random() * 8 : 11 + Math.random() * 13;
    const delay = -Math.random() * duration;
    const opacity = 0.98 + Math.random() * 0.02;
    const drift = -90 + Math.random() * 180;
    const spin = (Math.random() > 0.5 ? 1 : -1) * (110 + Math.random() * 160);
    const startX = Math.random() * 100;
    const sway = 18 + Math.random() * 34;

    flower.style.setProperty('--start-x', `${startX}vw`);
    flower.style.setProperty('--size', `${size}px`);
    flower.style.setProperty('--duration', `${duration}s`);
    flower.style.setProperty('--delay', `${delay}s`);
    flower.style.setProperty('--drift', `${drift}px`);
    flower.style.setProperty('--spin', `${spin}deg`);
    flower.style.setProperty('--opacity', String(opacity));
    flower.style.setProperty('--sway', `${sway}px`);

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
