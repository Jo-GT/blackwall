window.BW = window.BW || {};

(function (BW) {
  const GLYPHS = '░▒▓█▄▀■□▪▫◘◙¤§¶†‡∆∑Ω≠≈∞¥€$#@%&*<>/\\|=+~^';

  BW.util = {
    ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance(p) { return Math.random() < p; },
    roll(n, s) { let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * s); return t; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    esc(s) {
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    shuffle(a) {
      a = a.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
    sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
    hex(len) { let s = ''; for (let i = 0; i < len; i++) s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)]; return s; },
    glyph() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; },
    corrupt(str, amount = 0.15) {
      return [...str].map(ch => (ch !== ' ' && ch !== '\n' && Math.random() < amount) ? BW.util.glyph() : ch).join('');
    },
    fmt(str, vars) { return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null) ? vars[k] : m); },
    clone(o) { return JSON.parse(JSON.stringify(o)); },
    bytes(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + 'MB' : n > 1024 ? (n / 1024).toFixed(1) + 'kB' : n + 'B'; },
    gameDate() {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      return `2077-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    },
    tokenize(raw) {
      const out = []; const re = /"([^"]*)"|'([^']*)'|(\S+)/g; let m;
      while ((m = re.exec(raw))) out.push(m[1] ?? m[2] ?? m[3]);
      return out;
    }
  };
})(window.BW);
