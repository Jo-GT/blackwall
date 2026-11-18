(function (BW) {
  let ctx = null, master, sfxBus, musicBus, noiseBuf;
  const A = BW.audio = { enabled: true, station: null };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.22; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.28; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  A.init = init;

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(freq, dur, type = 'square', vol = 0.2, when = 0, slideTo = null, bus = sfxBus, cutoff = null) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
    node.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.2, when = 0, ftype = 'bandpass', freq = 2000, bus = sfxBus) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  const on = () => A.enabled && init();
  A.sfx = {
    key() { if (on()) tone(1600 + Math.random() * 600, 0.012, 'square', 0.025); },
    enter() { if (on()) tone(880, 0.04, 'square', 0.07); },
    error() { if (on()) { tone(140, 0.18, 'sawtooth', 0.14); tone(104, 0.2, 'sawtooth', 0.12, 0.06); } },
    ok() { if (on()) [660, 880, 1320].forEach((f, i) => tone(f, 0.08, 'square', 0.07, i * 0.07)); },
    msg() { if (on()) { tone(1320, 0.06, 'sine', 0.15); tone(1760, 0.1, 'sine', 0.12, 0.08); } },
    glitch() { if (on()) { noise(0.3, 0.3, 0, 'highpass', 1500); tone(70, 0.35, 'sawtooth', 0.18, 0, 25); } },
    alarm() { if (on()) for (let i = 0; i < 4; i++) { tone(880, 0.12, 'square', 0.08, i * 0.26); tone(660, 0.12, 'square', 0.08, i * 0.26 + 0.13); } },
    hit() { if (on()) { noise(0.15, 0.35, 0, 'lowpass', 900); tone(90, 0.2, 'sine', 0.35, 0, 35); } },
    zap() { if (on()) tone(1400, 0.16, 'sawtooth', 0.09, 0, 180); },
    derez() { if (on()) { for (let i = 0; i < 6; i++) tone(1200 - i * 150, 0.05, 'square', 0.06, i * 0.04); noise(0.4, 0.2, 0.2, 'lowpass', 600); } },
    descend() { if (on()) { tone(440, 0.25, 'triangle', 0.1, 0, 220); } },
    boot() { if (on()) { tone(110, 0.6, 'sawtooth', 0.08, 0, 440, sfxBus, 900); tone(1760, 0.05, 'square', 0.05, 0.6); } },
    drone() {
      if (!on()) return;
      [41, 41.6, 61.7].forEach(f => tone(f, 2.6, 'sawtooth', 0.12, 0, f * 0.8, sfxBus, 300));
      noise(2.4, 0.08, 0.1, 'bandpass', 300);
    }
  };

  /* ---------------- Procedural pirate radio ---------------- */
  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  A.stations = [
    { id: 1, name: 'CHROME PULSE 101.9', genre: 'synthwave', bpm: 100, root: 45, scale: 'minor', prog: [0, 5, 2, 6],
      bass: 'x.x.x.x.x.x.x.x.', arp: 'xxxxxxxxxxxxxxxx', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', arpWave: 'square', bassWave: 'sawtooth', cutoff: 1400, pad: true },
    { id: 2, name: 'DEAD SIGNAL 66.6', genre: 'darksynth', bpm: 118, root: 40, scale: 'phrygian', prog: [0, 0, 1, 0],
      bass: 'xxxxxxxxxxxxxxxx', arp: 'x..x..x...x..x..', kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', arpWave: 'sawtooth', bassWave: 'sawtooth', cutoff: 700, pad: false },
    { id: 3, name: 'STATIC SAINT 88.0', genre: 'ambient', bpm: 64, root: 50, scale: 'dorian', prog: [0, 3, 4, 2],
      bass: 'x...............', arp: 'x...x...x...x...', kick: '................', snare: '................', hat: '................', arpWave: 'sine', bassWave: 'triangle', cutoff: 900, pad: true },
    { id: 4, name: 'LOWTIDE PIRATE ~93', genre: 'glitch-hop', bpm: 128, root: 43, scale: 'minor', prog: [0, 3, 5, 4], random: true,
      bass: 'x..x..x.x..x..x.', arp: 'x.xx.x.xx.x.x.xx', kick: 'x..x..x...x..x..', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx', arpWave: 'square', bassWave: 'square', cutoff: 1100, pad: false },
    { id: 5, name: '░▒▓ ??.? ▓▒░', genre: '???', bpm: 52, root: 33, scale: 'locrian', prog: [0, 4, 0, 1], hidden: true,
      bass: 'x...............', arp: '..x.......x.....', kick: '................', snare: '................', hat: '................', arpWave: 'sine', bassWave: 'sawtooth', cutoff: 400, pad: true, whisper: true }
  ];

  let timer = null, step = 0, nextT = 0, st = null;

  function chordTones(sc, deg) {
    const s = SCALES[sc];
    return [0, 2, 4].map(o => { const i = deg + o; return s[i % 7] + 12 * Math.floor(i / 7); });
  }
  function scheduleStep(t) {
    const spb = 60 / st.bpm / 4;
    const bar = Math.floor(step / 16), s = step % 16;
    const deg = st.prog[bar % st.prog.length];
    const ch = chordTones(st.scale, deg);
    const when = t - ctx.currentTime;
    if (st.kick[s] === 'x') tone(150, 0.18, 'sine', 0.5, when, 38, musicBus);
    if (st.snare[s] === 'x') noise(0.14, 0.22, when, 'bandpass', 1800, musicBus);
    if (st.hat[s] === 'x') noise(0.035, 0.08, when, 'highpass', 7000, musicBus);
    if (st.bass[s] === 'x') tone(mtof(st.root + ch[0] - 12), spb * 1.8, st.bassWave, 0.18, when, null, musicBus, st.cutoff);
    if (st.arp[s] === 'x') {
      let n = st.random ? BW.util.pick(ch) + 12 * BW.util.ri(1, 2) : ch[s % 3] + 12 + (s % 6 >= 3 ? 12 : 0);
      tone(mtof(st.root + n), spb * 0.9, st.arpWave, st.arpWave === 'sine' ? 0.12 : 0.05, when, null, musicBus, st.cutoff * 2);
    }
    if (st.pad && s === 0) ch.forEach(n => tone(mtof(st.root + n + 12), spb * 15, 'triangle', 0.04, when, null, musicBus, 1200));
    if (st.whisper && s === 0 && Math.random() < 0.4) noise(spb * 12, 0.05, when, 'bandpass', 500 + Math.random() * 900, musicBus);
  }
  function tick() {
    while (nextT < ctx.currentTime + 0.12) {
      scheduleStep(nextT);
      nextT += 60 / st.bpm / 4;
      step++;
    }
  }
  A.play = function (id) {
    A.stop();
    if (!init()) return null;
    st = A.stations.find(s => s.id === id);
    if (!st) return null;
    step = 0; nextT = ctx.currentTime + 0.05;
    timer = setInterval(tick, 25);
    A.station = id;
    return st;
  };
  A.stop = function () {
    if (timer) clearInterval(timer);
    timer = null; A.station = null;
  };
})(window.BW);
