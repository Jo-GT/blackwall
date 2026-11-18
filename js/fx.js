(function (BW) {
  const U = BW.util;
  const FX = BW.fx = {};
  const $ = s => document.querySelector(s);

  /* ---------------- Background art: the eye in the wall ---------------- */
  const cv = $('#bgart');
  const g = cv.getContext('2d');
  const CELL = 6;
  let W = 0, H = 0, drips = [], flare = 0, blink = 0, lookX = 0, lookY = 0;

  function resize() {
    const wrap = $('#term-wrap');
    W = cv.width = wrap.clientWidth;
    H = cv.height = wrap.clientHeight;
    drips = [];
    const cols = Math.floor(W / CELL);
    for (let i = 0; i < cols; i++) {
      if (Math.random() < 0.08) drips.push({ x: i, len: U.ri(2, 30), max: U.ri(20, Math.floor(H / CELL)), speed: Math.random() * 0.15 + 0.02 });
    }
  }
  window.addEventListener('resize', resize);

  function color() { return getComputedStyle(document.body).getPropertyValue('--fg').trim() || '#e3123f'; }
  function bwColor() { return getComputedStyle(document.body).getPropertyValue('--bw').trim() || '#ff0033'; }

  function draw() {
    if (!W) resize();
    const S = BW.S;
    const exp = S ? S.exposure : 0;
    g.clearRect(0, 0, W, H);
    const c = color();
    const base = 0.10 + flare * 0.4;
    g.fillStyle = c;

    // drips
    g.globalAlpha = base;
    for (const d of drips) {
      d.len = Math.min(d.max, d.len + d.speed);
      if (d.len >= d.max && Math.random() < 0.002) { d.len = 0; }
      for (let y = 0; y < d.len; y++) {
        if ((y * 7 + d.x) % 11 === 0) continue;
        g.fillRect(d.x * CELL, y * CELL, CELL - 1, CELL - 1);
      }
    }

    // the eye. closed at 0 exposure, opening as the signal grows
    const cx = Math.floor(W / 2 / CELL), cy = Math.floor(H / 2 / CELL);
    const rx = Math.min(36, Math.floor(W / CELL / 3));
    const open = Math.max(0.04, Math.min(1, exp / 80)) * (1 - blink);
    const ry = Math.max(1, Math.floor(rx * 0.45 * open));
    g.globalAlpha = base * 1.4 + exp / 500;
    for (let x = -rx; x <= rx; x++) {
      const yy = Math.round(ry * Math.sqrt(1 - (x * x) / (rx * rx)));
      g.fillRect((cx + x) * CELL, (cy - yy) * CELL, CELL - 1, CELL - 1);
      g.fillRect((cx + x) * CELL, (cy + yy) * CELL, CELL - 1, CELL - 1);
      // lashes / drips under the eye
      if (x % 5 === 0 && Math.abs(x) < rx - 2) {
        const dl = 2 + ((x * 13 + 7) % 6);
        for (let k = 1; k < dl; k++) g.fillRect((cx + x) * CELL, (cy + yy + k) * CELL, CELL - 1, CELL - 1);
      }
    }
    if (ry > 2) {
      const ir = Math.max(2, Math.floor(ry * 0.7));
      const ix = cx + Math.round(lookX * (rx - ir) * 0.5), iy = cy + Math.round(lookY * (ry - ir) * 0.4);
      g.globalAlpha = Math.min(0.7, base * 1.6 + exp / 300);
      g.fillStyle = exp > 50 ? bwColor() : c;
      for (let y = -ir; y <= ir; y++) for (let x = -ir; x <= ir; x++) {
        const r2 = x * x + y * y;
        if (r2 <= ir * ir && r2 > (ir * 0.35) ** 2 && Math.abs(y) <= ry - 1) g.fillRect((ix + x) * CELL, (iy + y) * CELL, CELL - 1, CELL - 1);
      }
    }
    g.globalAlpha = 1;
    flare = Math.max(0, flare - 0.02);
    if (blink > 0) blink = Math.max(0, blink - 0.08);
    if (Math.random() < 0.004) blink = 1;
    if (Math.random() < 0.01) { lookX = Math.random() * 2 - 1; lookY = Math.random() * 2 - 1; }
  }
  setInterval(draw, 90);
  FX.flare = (v = 1) => { flare = v; };
  FX.resize = resize;

  /* ---------------- Glitch effects ---------------- */
  function bodyClass(cls, ms) {
    document.body.classList.remove(cls); void document.body.offsetWidth;
    document.body.classList.add(cls);
    setTimeout(() => document.body.classList.remove(cls), ms);
  }
  function textGlitch(ms = 900) {
    document.querySelectorAll('.glitchable').forEach(el => el.classList.add('glitching'));
    setTimeout(() => document.querySelectorAll('.glitchable').forEach(el => el.classList.remove('glitching')), ms);
  }
  const vars = () => ({ handle: BW.S ? BW.S.handle : 'runner' });

  FX.rgb = () => { bodyClass('fx-rgb', 500); textGlitch(500); };
  FX.shake = () => bodyClass('fx-shake', 500);
  FX.flicker = () => bodyClass('fx-flicker', 600);
  FX.tear = () => bodyClass('fx-tear', 450);
  FX.invert = (ms = 140) => bodyClass('fx-invert', ms);

  FX.corruptEl = (el, amount = 0.25) => {
    const orig = el.textContent;
    el.textContent = U.corrupt(orig, amount);
    el.classList.add('corrupt');
    setTimeout(() => { el.textContent = orig; el.classList.remove('corrupt'); }, U.ri(300, 1400));
  };
  FX.corruptLines = (n = 3) => {
    const lines = [...document.querySelectorAll('#out .ln')].slice(-30);
    for (let i = 0; i < n && lines.length; i++) FX.corruptEl(U.pick(lines), 0.4);
  };

  FX.whisper = (text) => {
    text = text || U.fmt(U.pick(BW.data.whispers), vars());
    BW.print('[░▒▓] ' + text, 'bw');
    BW.audio.sfx.glitch();
    FX.flare(0.6);
  };

  FX.footer = () => {
    const f = $('#foot');
    const orig = f.textContent;
    const alt = '// UNREGISTERED DECK /|\\ NETWATCH CANNOT SEE YOU... BUT WE CAN \\\\';
    f.textContent = alt; f.dataset.text = alt;
    f.classList.add('glitching');
    setTimeout(() => { f.textContent = orig; f.dataset.text = orig; f.classList.remove('glitching'); }, 1600);
  };

  let ghostTyping = false;
  FX.ghostType = async () => {
    if (ghostTyping || BW.busy) return;
    const inp = $('#cmd');
    if (inp.value) return;
    ghostTyping = true;
    const txt = U.fmt(U.pick(BW.data.ghostTypes), vars());
    for (const ch of txt) { inp.value += ch; BW.audio.sfx.key(); await U.sleep(U.ri(90, 240)); }
    await U.sleep(900);
    for (let i = txt.length; i >= 0; i--) { inp.value = txt.slice(0, i); await U.sleep(30); }
    ghostTyping = false;
  };

  FX.wall = async (msg, ms = 700) => {
    const fl = $('#flash');
    const cols = Math.ceil(window.innerWidth / 5), rows = Math.ceil(window.innerHeight / 12);
    let art = '';
    for (let r = 0; r < rows; r++) {
      let line = '';
      for (let c = 0; c < cols; c++) line += (Math.random() < 0.5) ? ((r + Math.floor(c / 8)) % 2 ? '▓' : '█') : U.glyph();
      art += line + '\n';
    }
    fl.querySelector('pre').textContent = art;
    fl.querySelector('.msg').textContent = U.fmt(msg || U.pick(['THE WALL SEES YOU', 'BLACKWALL', 'COME CLOSER', '{handle}', 'NOT ALONE']), vars());
    fl.classList.add('on');
    BW.audio.sfx.glitch();
    await U.sleep(ms);
    fl.classList.remove('on');
  };

  FX.hijack = (ms = 2200) => {
    const prev = document.body.dataset.theme;
    document.body.dataset.theme = 'blackwall';
    BW.audio.sfx.drone();
    setTimeout(() => { document.body.dataset.theme = BW.S ? BW.S.theme : prev; }, ms);
  };

  /* ---------------- Random event scheduler ---------------- */
  FX.event = function (tier) {
    const S = BW.S; if (!S || S.ending === 'pending') return;
    const exp = S.exposure;
    if (tier == null) tier = exp > 60 ? U.ri(0, 2) : exp > 25 ? U.ri(0, 1) : 0;
    if (tier === 0) {
      U.pick([FX.rgb, FX.flicker, FX.tear, () => FX.corruptLines(2), FX.footer, () => FX.flare(1)])();
      if (U.chance(0.4)) BW.audio.sfx.glitch();
    } else if (tier === 1) {
      U.pick([() => FX.whisper(), FX.ghostType, () => { FX.rgb(); FX.corruptLines(5); }, FX.footer, () => { FX.invert(); FX.shake(); }])();
    } else {
      U.pick([() => FX.wall(), () => FX.hijack(), () => { FX.wall(null, 400); FX.whisper(); }])();
    }
  };

  function loop() {
    const S = BW.S;
    if (S && S.handle && !BW.busy && !document.hidden) {
      const exp = S.exposure;
      const deep = S.net && S.net.oldnet;
      const p = 0.035 + exp * 0.005 + (deep ? 0.18 : 0) + (S.flags.reported ? -0.03 : 0);
      if (Math.random() < p) FX.event();
    }
    setTimeout(loop, U.ri(7000, 16000));
  }
  setTimeout(loop, 12000);
})(window.BW);
