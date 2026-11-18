(function (BW) {
  const U = BW.util, D = BW.data;
  const $ = s => document.querySelector(s);
  const SAVE_KEY = 'blackwall.save.v1';

  BW.cmds = {}; BW.alias = {};
  BW.cmd = (name, def) => { def.name = name; def.desc = def.desc || D.cmdDocs[name] || ''; BW.cmds[name] = def; (def.aliases || []).forEach(a => BW.alias[a] = name); };

  /* ================= STATE ================= */
  function fresh(handle) {
    return {
      v: 1, handle, deckId: U.ri(100000, 999999),
      hp: 20, ram: 6, eddies: 150, trace: 0, exposure: 0, heat: 0,
      up: { ram: 0, hp: 0, stealth: 0, buffer: 0 }, tt: 0,
      programs: D.startPrograms.slice(),
      cwd: ['home'], downloads: [], shards: [], briefs: [],
      job: null, jobsDone: [], gigs: [], gigsDone: 0, net: null,
      irc: [], flags: {}, notes: '', theme: 'afterlife', sound: true, history: [], ending: null,
      created: Date.now()
    };
  }
  BW.maxHp = () => 20 + BW.S.up.hp * 5;
  BW.maxRam = () => 6 + BW.S.up.ram * 2;

  BW.save = () => { if (!BW.S || !BW.S.handle) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(BW.S)); } catch (e) { /* storage blocked */ } };
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.handle ? s : null; } catch (e) { return null; } }
  function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

  /* ================= OUTPUT ================= */
  const out = $('#out');
  const scroll = () => { out.scrollTop = out.scrollHeight; };
  function trim() { while (out.children.length > 700) out.removeChild(out.firstChild); }
  BW.print = (text, cls = '') => {
    const d = document.createElement('div');
    d.className = 'ln' + (cls ? ' ' + cls : '');
    d.textContent = text;
    out.appendChild(d); trim(); scroll();
    const S = BW.S;
    if (S && cls !== 'cmd' && cls !== 'bw' && S.exposure > 20 && Math.random() < S.exposure / 900) setTimeout(() => BW.fx.corruptEl(d, 0.2), U.ri(200, 2000));
    return d;
  };
  BW.html = (h, cls = '') => {
    const d = document.createElement('div');
    d.className = 'ln' + (cls ? ' ' + cls : '');
    d.innerHTML = h;
    out.appendChild(d); trim(); scroll();
    return d;
  };
  BW.type = async (text, cls = '', speed = 14) => {
    const d = BW.print('', cls);
    for (const ch of text) { d.textContent += ch; if (ch !== ' ') await U.sleep(speed); scroll(); }
    return d;
  };
  BW.clear = () => { out.innerHTML = ''; };
  const k = s => `<span class="k">${U.esc(s)}</span>`;
  BW.k = k;

  /* ================= STATS HELPERS ================= */
  BW.addTrace = (n, raw) => {
    const S = BW.S;
    if (!S.net || S.net.wall) return;
    if (n > 0 && !raw) n = Math.ceil(n * (1 - 0.15 * S.up.stealth) * (1 + 0.1 * S.heat));
    const before = S.trace;
    S.trace = U.clamp(S.trace + n, 0, 100);
    if (before < 50 && S.trace >= 50) { BW.print('[!] TRACE 50% // NetWatch routing daemons are sniffing your path.', 'warn'); BW.audio.sfx.alarm(); }
    if (before < 80 && S.trace >= 80) { BW.print('[!!] TRACE 80% // they are almost on your address. finish up or jack out.', 'err'); BW.audio.sfx.alarm(); BW.fx.shake(); }
    BW.ui.refresh();
    if (S.trace >= 100) return BW.net.caught();
  };
  BW.addExposure = (n) => {
    const S = BW.S;
    const before = S.exposure;
    S.exposure = U.clamp(S.exposure + n, 0, 100);
    if (before < 25 && S.exposure >= 25) setTimeout(() => BW.fx.whisper('there\'s a new file in your home directory, {handle}. "ls -a".'), 4000);
    if (before < 40 && S.exposure >= 40) setTimeout(() => BW.print('[deck] new theme unlocked: blackwall', 'dim'), 2500);
    BW.ui.refresh();
  };
  BW.heal = (n) => { const S = BW.S; S.hp = U.clamp(S.hp + n, 0, BW.maxHp()); };

  /* ================= IRC ================= */
  BW.irc = (from, text, delay = 0, cls = '') => {
    setTimeout(() => {
      const S = BW.S; if (!S) return;
      text = U.fmt(text, { handle: S.handle });
      S.irc.push({ from, text, cls, t: Date.now() });
      if (S.irc.length > 80) S.irc.shift();
      BW.html(`[#lowtide] <b>&lt;${U.esc(from)}&gt;</b> ${U.esc(text)}`, cls === 'nw' ? 'nw' : cls === 'unk' ? 'bw' : 'irc');
      BW.audio.sfx.msg();
      BW.ui.refresh(); BW.save();
    }, delay);
  };

  const BEATS = {
    boot: [['kestrel', 'Deck\'s live, {handle}. Read the README on the left, then type "jobs". Don\'t make me regret this.', 1800]],
    accept_j1: [['kestrel', 'Easy one. Biotechnica farm lab. Type "scan" to find the host, then "connect btk_agrisys_lab04".', 900]],
    enter_j1: [['kestrel', 'You\'re in. "look" around. Corp admins hide passwords in the dumbest places. Try "steg" on any image you find.', 1300]],
    steg_first: [['kestrel', 'See? Jot it in NOTES (right panel). At a gate use "crack <password>". No password? "breach" it the hard way.', 900]],
    ice_first: [['kestrel', 'ICE! "run zap" or "run sword". Watch your RAM. If it goes bad: "run slide" or "jackout".', 500]],
    gate_first: [['kestrel', 'Gate\'s open. "down" to descend. The good stuff is always at the bottom.', 900]],
    goal_first: [['kestrel', 'Got it? Now "jackout". Don\'t get greedy.', 800]],
    done_j1: [['kestrel', 'Clean work, choom. Eddies sent. Check "shop" for upgrades, "rest" if your head hurts, and "jobs" when you\'re hungry.', 1200]],
    accept_j2: [['kestrel', 'Banks are touchier than farms. Better gates, nastier ICE. "map" if you lose your way.', 900]],
    done_j2: [['kestrel', 'Tanaka sends noodles. Real noodles. I ate them. You get eddies.', 1000], ['kestrel', 'Heads up - chatter on a few boards about logins from users that don\'t exist. Probably nothing.', 6000]],
    accept_j3: [['kestrel', 'Militech. Asps on the upper floors. They chew programs. Keep a spare.', 900]],
    done_j3: [['kestrel', 'Bix got their crate out. They say thanks. Militech says other things.', 1000],
      ['kestrel', 'Something else. I\'m picking up a signal off an old relay in Pacifica. Pre-Krash handshakes. I\'ve got a job for you when you\'re ready. Check "jobs".', 5000],
      ['NW-HALLORAN', 'Unregistered deck. We noticed the Militech depot. NetWatch doesn\'t care about corp squabbles. We DO care about what you\'re about to do next. Stay out of Pacifica.', 11000, 'nw']],
    accept_j4: [['kestrel', 'Stay sharp. If your deck starts talking back, you leave. Promise me.', 900], ['???', 'hello, {handle}.', 6000, 'unk']],
    caught_first: [['NW-HALLORAN', 'Gotcha, ghost. Consider that a warning shot. Register your deck, or next time we keep it.', 1500, 'nw']],
    flatline_first: [['kestrel', 'You flatlined. You\'re lucky someone was nearby with a defib and no morals. Be careful.', 2000]],
    shard_first: [['kestrel', 'You found a data shard? Those things are older than you. Check ~/shards. Read it if you want, but don\'t believe everything.', 1500]]
  };
  BW.beat = (name, once = true) => {
    const S = BW.S;
    if (once) { if (S.flags['beat_' + name]) return; S.flags['beat_' + name] = 1; }
    (BEATS[name] || []).forEach(([f, t, d, c]) => BW.irc(f, t, d, c));
  };

  /* ================= LOCAL FILESYSTEM ================= */
  const KINDS = {
    txt: 'ASCII text', log: 'ASCII text, log', pdf: 'PDF document, version 9.1', jpg: 'JPEG image data, 1920x1080', png: 'PNG image data, 512x512',
    gif: 'GIF image data, animated', tif: 'TIFF image data, scanned', dat: 'binary data', db: 'SQLite 7 database', gen: 'Biotechnica genome archive (encrypted)',
    bin: 'ELF 64-bit executable, Z-OS', shard: 'data shard, pre-Krash encoding', cad: 'Militech CAD blueprint', zip: 'Zip archive', csv: 'CSV text', bd: 'braindance recording',
    ics: 'calendar data', rec: 'court record', ghost: '???'
  };
  BW.kindDesc = k => KINDS[k] || 'data';
  BW.isImage = f => ['jpg', 'png', 'gif', 'tif'].includes(f.kind);

  function fsTree() {
    const S = BW.S;
    const file = (content, extra = {}) => Object.assign({ type: 'file', content, kind: 'txt' }, extra);
    const dir = children => ({ type: 'dir', children });
    const commands = {};
    Object.values(BW.cmds).filter(c => !c.hidden).forEach(c => { commands[c.name] = file(c.desc, { kind: 'bin', size: 4096 + c.name.length * 911 }); });
    const downloads = {};
    S.downloads.forEach(d => { downloads[d.name] = file(d.text || '', d); });
    const msgs = {};
    S.briefs.forEach(b => { msgs[b.id + '_brief.msg'] = file(`FROM: kestrel\nCONTRACT: ${b.title}\nCLIENT: ${b.client}\nTARGET: ${b.corp} // ${b.host}\nPAY: ${b.pay}€$\n\n${b.brief}`); });
    const shards = {};
    S.shards.forEach(id => { const sh = D.shards[id]; if (sh) shards[sh.name] = file(sh.text, { kind: 'shard' }); });
    const home = {
      'readme.txt': file(D.readmeText),
      commands: dir(commands), msgs: dir(msgs), downloads: dir(downloads), shards: dir(shards)
    };
    if (S.exposure >= 25 && !S.flags.reported) home['.ghost'] = file(U.fmt(D.ghostFile, { handle: S.handle }), { kind: 'ghost', hidden: true });
    if (S.heat > 0) home['.netwatch_notice'] = file(`NETWATCH // NOTICE OF INFRACTION\nsubject: ${S.handle}\ninfractions on record: ${S.heat}\nstatus: MONITORED`, { hidden: true });
    return dir({ home: dir(home) });
  }
  BW.fsTree = fsTree;
  function resolvePath(p) {
    const S = BW.S;
    let parts;
    if (!p || p === '.') parts = S.cwd.slice();
    else if (p === '~' || p.startsWith('~/')) parts = ['home', ...p.slice(2).split('/')];
    else if (p.startsWith('/')) parts = p.split('/');
    else parts = [...S.cwd, ...p.split('/')];
    const stack = [];
    for (const x of parts) { if (!x || x === '.') continue; if (x === '..') stack.pop(); else stack.push(x); }
    let node = fsTree();
    for (const x of stack) {
      if (!node || node.type !== 'dir' || !node.children[x]) return { node: null, path: stack };
      node = node.children[x];
    }
    return { node, path: stack };
  }
  BW.resolvePath = resolvePath;
  BW.localFile = name => { const r = resolvePath(name); return r.node && r.node.type === 'file' ? Object.assign({ name: r.path[r.path.length - 1] }, r.node) : null; };

  /* ================= INPUT ================= */
  const inp = $('#cmd');
  let histIdx = -1;
  BW.busy = false;
  BW.inputHandler = null;

  $('#cmdline').addEventListener('submit', e => {
    e.preventDefault();
    const raw = inp.value; inp.value = ''; histIdx = -1;
    BW.audio.sfx.enter();
    if (BW.inputHandler) { const h = BW.inputHandler; h(raw); return; }
    if (BW.busy) return;
    BW.exec(raw);
  });
  inp.addEventListener('keydown', e => {
    const S = BW.S;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!S || !S.history.length) return;
      e.preventDefault();
      if (e.key === 'ArrowUp') histIdx = histIdx < 0 ? S.history.length - 1 : Math.max(0, histIdx - 1);
      else histIdx = histIdx < 0 ? -1 : histIdx + 1;
      if (histIdx >= S.history.length) histIdx = -1;
      inp.value = histIdx < 0 ? '' : S.history[histIdx];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key.length === 1) BW.audio.sfx.key();
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#center') && !window.getSelection().toString() && !e.target.closest('a,button')) inp.focus();
  });

  function completions(tokens) {
    const S = BW.S;
    if (!S) return [];
    if (tokens.length <= 1) return Object.keys(BW.cmds).filter(n => !BW.cmds[n].hidden).concat(Object.keys(BW.alias));
    const cmd = BW.alias[tokens[0]] || tokens[0];
    if (cmd === 'run') return S.programs;
    if (cmd === 'connect') return S.job ? [S.job.host] : [];
    if (cmd === 'theme') return BW.ui.themes.map(t => t.id);
    if (cmd === 'glossary') return Object.keys(D.glossary).map(s => s.toLowerCase().replace(/ /g, '_'));
    if (cmd === 'buy') return D.shop.map(s => s.id);
    if (cmd === 'accept') return BW.availableJobs().map(j => j.id);
    if (S.net) { const f = BW.net.floor(); return [...f.files.map(x => x.name), ...f.nodes.map(x => x.name)]; }
    const r = resolvePath(tokens[tokens.length - 1].includes('/') ? tokens[tokens.length - 1].replace(/[^/]*$/, '') : '.');
    if (r.node && r.node.type === 'dir') {
      const prefix = tokens[tokens.length - 1].includes('/') ? tokens[tokens.length - 1].replace(/[^/]*$/, '') : '';
      return Object.keys(r.node.children).map(n => prefix + n + (r.node.children[n].type === 'dir' ? '/' : ''));
    }
    return [];
  }
  function complete() {
    const v = inp.value;
    const tokens = v.split(/\s+/);
    const last = tokens[tokens.length - 1];
    const opts = completions(tokens).filter(o => o.startsWith(last));
    if (opts.length === 1) { tokens[tokens.length - 1] = opts[0]; inp.value = tokens.join(' ') + (opts[0].endsWith('/') ? '' : ' '); }
    else if (opts.length > 1) {
      let p = opts[0];
      for (const o of opts) while (!o.startsWith(p)) p = p.slice(0, -1);
      if (p.length > last.length) { tokens[tokens.length - 1] = p; inp.value = tokens.join(' '); }
      else BW.print(opts.join('   '), 'dim');
    }
  }

  BW.promptText = () => {
    const S = BW.S;
    if (!S || !S.handle) return 'login:';
    if (S.net) return `${S.handle}@${S.net.host}:F${S.net.floor + 1} #:`;
    return `${S.handle}@ghostdeck_${S.deckId} $:`;
  };

  BW.exec = async (raw) => {
    const S = BW.S;
    raw = raw.trim();
    BW.html(`<span class="p">${U.esc(BW.promptText())}</span> ${U.esc(raw)}`, 'cmd');
    if (!raw) return;
    S.history.push(raw); if (S.history.length > 150) S.history.shift();
    const tokens = U.tokenize(raw);
    const name0 = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const name = BW.alias[name0] || name0;
    const c = BW.cmds[name];
    if (!c || (c.hidden && !(c.when && c.when()))) {
      BW.print(`${tokens[0]}: command not found. type "cmds" for the list.`, 'err');
      BW.audio.sfx.error();
      if (S.exposure > 35 && U.chance(0.15)) setTimeout(() => BW.fx.whisper(`"${tokens[0]}"? we know that one. we invented it.`), 700);
      BW.save(); return;
    }
    if (args.includes('--help') || args.includes('-h')) {
      BW.html(`${k(name)}: ${U.esc(c.desc)}${c.usage ? '\nusage: ' + U.esc(c.usage) : ''}${c.aliases ? '\naliases: ' + U.esc(c.aliases.join(', ')) : ''}`);
      return;
    }
    const inNet = !!S.net;
    if (c.ctx === 'local' && inNet) { BW.print('can\'t do that while jacked in. "jackout" first.', 'err'); BW.audio.sfx.error(); return; }
    if (c.ctx === 'net' && !inNet) { BW.print('you\'re not jacked in. "jobs", "accept", "scan", "connect".', 'err'); BW.audio.sfx.error(); return; }
    if (inNet && S.net.combat && !c.combat) { BW.print('ICE is on you! "run <program>", "run slide" or "jackout".', 'ice'); BW.audio.sfx.error(); return; }
    BW.busy = true;
    try { await c.run(args, raw); }
    catch (e) { console.error(e); BW.print('segfault: ' + e.message, 'err'); }
    BW.busy = false;
    BW.ui.refresh();
    BW.save();
  };

  /* ================= JOBS ================= */
  function nextStory() {
    const S = BW.S;
    if (S.ending) return null;
    return D.story.find(j => !S.jobsDone.includes(j.id)) || null;
  }
  BW.availableJobs = () => {
    const S = BW.S; const list = [];
    const st = nextStory(); if (st) list.push(st);
    if (S.jobsDone.includes('j1')) list.push(...S.gigs);
    return list;
  };
  BW.genGigs = () => {
    const S = BW.S;
    const storyN = S.jobsDone.length;
    const gigs = [];
    for (let i = 1; i <= 3; i++) {
      const tier = U.clamp(1 + Math.floor(storyN * 0.7) + U.ri(-1, 1), 1, 3);
      const corp = U.pick(D.corps);
      const tpl = U.pick(D.gigTemplates);
      const target = U.pick(tpl.targets);
      const floors = U.clamp(2 + tier + U.ri(-1, 1), 2, 6);
      const icePool = tier === 1 ? ['wisp', 'wisp', 'raven'] : tier === 2 ? ['raven', 'scorpion', 'asp', 'wisp'] : ['asp', 'hellhound', 'kraken', 'scorpion'];
      const ice = {};
      const nIce = Math.min(floors - 1, tier);
      U.shuffle([...Array(floors).keys()].slice(1)).slice(0, nIce).forEach(f => ice[f] = U.pick(icePool));
      const gates = {};
      const nGates = Math.min(floors - 1, tier === 1 ? 1 : U.ri(1, 2));
      U.shuffle([...Array(floors - 1).keys()]).slice(0, nGates).forEach(f => gates[f] = U.clamp(tier + U.ri(-1, 0), 1, 3));
      const shards = {};
      const unfound = ['bartmoss', 'charter', 'datakrash'].filter(s => !S.shards.includes(s));
      if (unfound.length && U.chance(0.3)) shards[U.ri(0, floors - 1)] = U.pick(unfound);
      const pay = 250 + floors * 150 + tier * 250 + U.ri(0, 20) * 10;
      gigs.push({
        id: 'g' + i, gig: true, title: `${tpl.verb.toUpperCase()} ${target}`, client: 'street board', corp: corp.name,
        host: `${corp.tag}_${U.pick(D.districts)}_${U.pick(D.hostSuffix)}${U.ri(1, 99)}`, pay, tier,
        brief: `${tpl.verb} ${target} from a ${corp.name} subnet. ${U.pick(tpl.why)}`,
        goal: { type: tpl.type, target },
        spec: { floors, ice, gates, shards, diff: tier }
      });
    }
    S.gigs = gigs;
  };
  BW.goalText = (j) => {
    const g = j.goal;
    return g.type === 'pull' ? `pull ${g.target}` : g.type === 'rm' ? `rm ${g.target}` : g.type === 'control' ? `control ${g.target} off` : 'find the source';
  };
  BW.completeJob = () => {
    const S = BW.S; const j = S.job;
    S.eddies += j.pay;
    BW.print(`[CONTRACT COMPLETE] ${j.title} // +${j.pay}€$ transferred by kestrel`, 'good');
    BW.audio.sfx.ok();
    if (S.heat > 0 && U.chance(0.5)) { S.heat--; BW.print('[heat] NetWatch loses interest a little. heat -1', 'dim'); }
    if (j.gig) { S.gigsDone++; BW.genGigs(); BW.irc('kestrel', U.pick(['Gig done. Eddies sent.', 'Nice. Street board says thanks.', 'Paid. Don\'t spend it all on chrome.', 'Smooth. Keep that up and people will learn your handle.']), 900); }
    else { S.jobsDone.push(j.id); BW.beat('done_' + j.id); if (!S.gigs.length) BW.genGigs(); }
    S.job = null;
  };

  /* ================= ENDINGS ================= */
  BW.showEnding = async (key) => {
    const S = BW.S;
    const E = D.endings[key];
    S.ending = key;
    BW.save();
    const ov = $('#overlay');
    ov.innerHTML = `<div class="ending"><h2></h2><pre></pre><div class="btns"></div></div>`;
    ov.hidden = false;
    const pre = ov.querySelector('pre');
    ov.querySelector('h2').textContent = E.title;
    if (key === 'cross') { document.body.dataset.theme = 'blackwall'; BW.audio.sfx.drone(); }
    const text = U.fmt(E.text, { handle: S.handle });
    for (const ch of text) { pre.textContent += ch; if (ch === '\n') await U.sleep(60); else if (ch !== ' ') await U.sleep(12); }
    const btns = ov.querySelector('.btns');
    const b = document.createElement('button');
    if (key === 'cross') {
      b.textContent = 'REBOOT AS SOMEONE NEW';
      b.onclick = () => { wipe(); location.reload(); };
      const b2 = document.createElement('button');
      b2.textContent = 'STAY ON THIS SIDE';
      b2.style.marginLeft = '10px';
      b2.onclick = () => { ov.hidden = true; ov.innerHTML = ''; BW.print('[░▒▓] the deck is yours now. it always was.', 'bw'); inp.focus(); };
      btns.append(b, b2);
    } else {
      b.textContent = 'KEEP RUNNING';
      b.onclick = () => { ov.hidden = true; ov.innerHTML = ''; BW.print('Night City doesn\'t stop. "jobs" for gigs. (story complete - freeplay unlocked)', 'dim'); inp.focus(); };
      btns.append(b);
    }
  };

  /* ================= BOOT ================= */
  async function bootSequence() {
    BW.busy = true;
    const lines = [
      ['Z-OS v4.2.0 (c) ZETATECH 2061 // UNLICENSED COPY', 'hdr'],
      ['[ OK ] neural interface handshake', 'sys'],
      ['[ OK ] cyberdeck: SALVAGED // serial burned off', 'sys'],
      ['[ OK ] corp ID chip: none', 'sys'],
      ['[WARN] NetWatch registry: NOT FOUND - this deck does not exist', 'warn'],
      ['[ OK ] mounting /home ... RAM-only', 'sys'],
      ['[ OK ] ICE-breakers: zap sword armor slide', 'sys'],
      ['[ ?? ] checking perimeter integrity ... ░▒▓ ... ok', 'dim']
    ];
    BW.audio.sfx.boot();
    for (const [t, c] of lines) { BW.print(t, c); await U.sleep(U.ri(120, 340)); }
    await U.sleep(300);
    BW.print('');
    BW.print('No runner profile found on this deck.', 'sys');
    BW.print('ENTER YOUR HANDLE (2-16 chars, letters/numbers/_/-):', 'hdr');
    BW.busy = false;
    inp.placeholder = 'your handle';
    inp.focus();
    BW.inputHandler = (raw) => {
      const h = raw.trim();
      BW.html(`<span class="p">login:</span> ${U.esc(h)}`, 'cmd');
      if (!/^[a-z0-9_\-]{2,16}$/i.test(h)) { BW.print('invalid handle. try again.', 'err'); BW.audio.sfx.error(); return; }
      if (/^netwatch|^nw[-_]/i.test(h)) { BW.print('nice try. you are not NetWatch. pick another.', 'err'); BW.audio.sfx.error(); return; }
      BW.inputHandler = null;
      inp.placeholder = 'type your commands here';
      BW.S = fresh(h);
      BW.genGigs();
      BW.save();
      BW.ui.refresh();
      BW.print(`Profile created. Welcome to the Net, ${h}.`, 'good');
      BW.print('Type "cmds" to see what you can do. Type "jobs" to get paid.', 'sys');
      BW.beat('boot');
    };
  }

  BW.boot = () => {
    BW.ui.init();
    const saved = load();
    if (saved) {
      BW.S = Object.assign(fresh(saved.handle), saved);
      document.body.dataset.theme = BW.S.theme;
      BW.audio.enabled = BW.S.sound !== false;
      BW.ui.refresh();
      BW.print('Z-OS v4.2.0 // resuming session from RAM...', 'hdr');
      if (BW.S.net) {
        BW.print('[WARN] previous session terminated while jacked in. emergency disconnect performed.', 'warn');
        BW.S.net = null; BW.S.trace = 0;
      }
      BW.print(`Welcome back, ${BW.S.handle}.` + (BW.S.job ? ` Active contract: ${BW.S.job.title}.` : ''), 'good');
      if (BW.S.exposure > 40) setTimeout(() => BW.fx.whisper('welcome back. we waited.'), 3000);
      BW.ui.refresh();
    } else {
      BW.S = null;
      BW.ui.refresh();
      bootSequence();
    }
    inp.focus();
  };

  /* ================= LOCAL COMMANDS ================= */
  BW.cmd('cmds', {
    aliases: ['help', '?'], ctx: 'any', combat: true, run() {
      const S = BW.S;
      const avail = Object.values(BW.cmds).filter(c => !c.hidden || (c.when && c.when()))
        .filter(c => c.ctx === 'any' || (c.ctx === 'net') === !!S.net)
        .filter(c => !(S.net && S.net.combat) || c.combat);
      BW.print(S.net ? (S.net.combat ? '== COMBAT COMMANDS ==' : '== NET COMMANDS ==') : '== LOCAL COMMANDS ==', 'hdr');
      BW.print(avail.map(c => c.name).sort().join('  '));
      BW.print('add --help after any command for details.', 'dim');
    }
  });
  BW.cmd('ls', {
    ctx: 'any', usage: 'ls [-a] [path]', run(args) {
      if (BW.S.net) return BW.cmds.look.run(args);
      const all = args.includes('-a');
      const p = args.find(a => !a.startsWith('-'));
      const r = resolvePath(p);
      if (!r.node) return BW.print(`ls: ${p}: no such file or directory`, 'err');
      if (r.node.type === 'file') return BW.print(p);
      const names = Object.entries(r.node.children)
        .filter(([n, v]) => all || !v.hidden)
        .map(([n, v]) => v.type === 'dir' ? n + '/' : n).sort();
      BW.print(names.length ? names.join(' ') : '(empty)', names.length ? '' : 'dim');
    }
  });
  BW.cmd('cd', {
    ctx: 'any', usage: 'cd <dir>', run(args) {
      if (BW.S.net) {
        const a = (args[0] || '').toLowerCase();
        if (a === '..' || a === 'up') return BW.cmds.up.run([]);
        if (a === 'down' || /^f\d+$/.test(a)) return BW.cmds.down.run([]);
        return BW.print('cd in the Net: "cd .." to ascend, "cd down" to descend', 'dim');
      }
      const p = args[0] || '~';
      const r = resolvePath(p);
      if (!r.node) return BW.print(`cd: ${p}: no such directory`, 'err');
      if (r.node.type !== 'dir') return BW.print(`cd: ${p}: not a directory`, 'err');
      BW.S.cwd = r.path;
      BW.print(r.path[r.path.length - 1] || '/');
    }
  });
  BW.cmd('cat', {
    ctx: 'any', usage: 'cat <file>', run(args) {
      if (!args[0]) return BW.print('cat: which file?', 'err');
      if (BW.S.net) return BW.net.cat(args[0]);
      const f = BW.localFile(args[0]);
      if (!f) return BW.print(`cat: ${args[0]}: no such file`, 'err');
      if (BW.isImage(f)) return BW.print(`cat: ${args[0]}: binary image data. try "file" or "steg".`, 'dim');
      if (f.kind === 'gen' || f.kind === 'db') return BW.print(U.corrupt('<' + BW.kindDesc(f.kind) + '> ' + U.hex(64), 0.3), 'dim');
      if (f.kind === 'ghost') { BW.print(f.content, 'bw'); BW.addExposure(2); BW.fx.rgb(); return; }
      BW.print(f.content);
      if (f.kind === 'shard') BW.fx.flare(0.5);
    }
  });
  BW.cmd('file', {
    ctx: 'any', usage: 'file <file>', run(args) {
      if (!args[0]) return BW.print('file: which file?', 'err');
      if (BW.S.net) return BW.net.fileInfo(args[0]);
      const r = resolvePath(args[0]);
      if (!r.node) return BW.print(`file: ${args[0]}: no such file`, 'err');
      if (r.node.type === 'dir') return BW.print(`${args[0]}: directory`);
      const f = r.node;
      const size = f.size || (f.content || '').length + 256;
      BW.print(`${args[0]}: ${BW.kindDesc(f.kind)}, ${U.bytes(size)}, modified ${U.gameDate()}${f.from ? ', source: ' + f.from : ''}`);
    }
  });
  BW.cmd('steg', {
    aliases: ['steghide'], ctx: 'any', combat: false, usage: 'steg <image file>', run(args) {
      if (!args[0]) return BW.print('steg: which file?', 'err');
      if (args[0] === 'steghide' || args[0] === 'steg') { BW.print('well done. you\'ve successfully used steghide on itself. nothing inside but recursion.', 'dim'); return; }
      const f = BW.S.net ? BW.net.findFile(args[0]) : BW.localFile(args[0]);
      if (!f) return BW.print(`steg: ${args[0]}: no such file`, 'err');
      if (BW.S.net) BW.addTrace(1);
      if (!BW.isImage(f)) return BW.print(`steg: ${args[0]}: not an image format I can read.`, 'err');
      BW.print('extracting embedded data...', 'dim');
      if (f.steg) { BW.print(f.steg, 'good'); BW.audio.sfx.ok(); BW.beat('steg_first'); }
      else BW.print(U.pick(D.stegDecoys), 'dim');
    }
  });
  BW.cmd('clear', { ctx: 'any', combat: true, run() { BW.clear(); } });
  BW.cmd('whoami', {
    ctx: 'any', combat: true, run() {
      const S = BW.S;
      BW.print(`${S.handle} // freelance netrunner // deck: ghostdeck_${S.deckId} (unregistered)`);
      BW.print(`not corp. not NetWatch. never NetWatch. NetWatch heat on record: ${S.heat}`, 'dim');
      if (S.exposure > 50) BW.print(U.corrupt('also: something else is listening through this deck.', 0.2), 'bw');
    }
  });
  BW.cmd('stats', {
    aliases: ['deck', 'status'], ctx: 'any', combat: true, run() {
      const S = BW.S;
      BW.print('== RUNNER ==', 'hdr');
      BW.print(`handle ........ ${S.handle}\nneural ........ ${S.hp}/${BW.maxHp()}\nRAM ........... ${S.ram}/${BW.maxRam()}\neddies ........ ${S.eddies}€$\nheat .......... ${S.heat}\ncontracts ..... ${S.jobsDone.length} story / ${S.gigsDone} gigs`);
      BW.print('== DECK ==', 'hdr');
      BW.print(`RAM lvl ${S.up.ram} | neural lvl ${S.up.hp} | stealth lvl ${S.up.stealth} | breach buffer lvl ${S.up.buffer}${S.tt ? ' | Trauma Team: ' + S.tt : ''}\nprograms: ${S.programs.join(', ')}`);
      if (S.exposure > 0) BW.print(`signal ........ ${S.exposure}%  (${S.exposure < 25 ? 'faint' : S.exposure < 50 ? 'persistent' : S.exposure < 75 ? 'loud' : 'IT KNOWS YOUR NAME'})`, 'bw');
      if (S.job) BW.print(`active contract: ${S.job.title} -> ${BW.goalText(S.job)} @ ${S.job.host}`, 'warn');
    }
  });
  BW.cmd('jobs', {
    ctx: 'local', run() {
      const S = BW.S;
      if (S.job) {
        BW.print(`ACTIVE: [${S.job.id}] ${S.job.title} // ${BW.goalText(S.job)} @ ${S.job.host} // ${S.job.pay}€$`, 'warn');
        BW.print('"scan" then "connect" to run it, or "abandon" to drop it.', 'dim');
        return;
      }
      const st = nextStory();
      BW.print('== CONTRACTS // via kestrel ==', 'hdr');
      if (st) {
        BW.html(`[${k(st.id)}] ${U.esc(st.title)} // client: ${U.esc(st.client)} // target: ${U.esc(st.corp)} // ${st.pay}€$`);
        BW.print('    ' + st.brief, 'dim');
      } else BW.print(S.ending ? '    kestrel has nothing else for you. not after Pacifica.' : '    nothing right now.', 'dim');
      if (S.jobsDone.includes('j1')) {
        if (!S.gigs.length) BW.genGigs();
        BW.print('== GIGS // street board ==', 'hdr');
        S.gigs.forEach(g => BW.html(`[${k(g.id)}] ${U.esc(g.title)} // ${U.esc(g.corp)} // ${g.spec.floors} floors, tier ${g.tier} // ${g.pay}€$`));
      } else BW.print('(street gigs unlock after your first contract)', 'dim');
      BW.print('"accept <id>" to take one.', 'dim');
    }
  });
  BW.cmd('accept', {
    ctx: 'local', usage: 'accept <id>', run(args) {
      const S = BW.S;
      if (S.job) return BW.print(`you already have a contract: ${S.job.title}. finish it or "abandon".`, 'err');
      const id = (args[0] || '').toLowerCase();
      const j = BW.availableJobs().find(x => x.id === id);
      if (!j) return BW.print('accept: no such job. see "jobs".', 'err');
      S.job = U.clone(j);
      S.job.arch = BW.net.build(S.job);
      if (!j.gig && !S.briefs.find(b => b.id === j.id)) S.briefs.push({ id: j.id, title: j.title, client: j.client, corp: j.corp, host: j.host, pay: j.pay, brief: j.brief });
      BW.print(`contract accepted: ${j.title}`, 'good');
      BW.print(`objective: ${BW.goalText(j)}   target host: ${j.host}`, 'sys');
      if (!j.gig) BW.print(`brief saved to ~/msgs/${j.id}_brief.msg`, 'dim');
      BW.audio.sfx.ok();
      if (!j.gig) BW.beat('accept_' + j.id);
    }
  });
  BW.cmd('abandon', {
    ctx: 'local', run() {
      const S = BW.S;
      if (!S.job) return BW.print('no active contract.', 'dim');
      BW.print(`contract dropped: ${S.job.title}. kestrel's opinion of you: lowered.`, 'warn');
      S.job = null;
    }
  });
  BW.cmd('scan', {
    ctx: 'any', combat: true, run() {
      const S = BW.S;
      if (S.net) return BW.net.scan();
      BW.print('scanning local subnet...', 'dim');
      const noise = Array.from({ length: U.ri(2, 4) }, () => `${U.pick(D.corps).tag}_${U.pick(D.districts)}_${U.pick(D.hostSuffix)}${U.ri(1, 99)}`);
      const hosts = U.shuffle([...noise, ...(S.job ? [S.job.host] : [])]);
      hosts.forEach(h => {
        if (S.job && h === S.job.host) BW.html(`  ${k(h)}  [OPEN]  &lt;-- contract target`, 'good');
        else BW.print(`  ${h}  [ICE WALL // no route]`, 'dim');
      });
      if (S.exposure >= 30 && U.chance(0.5)) BW.print(`  ░▒▓_${U.hex(6)}  [????] <-- it's already connected to you`, 'bw');
      if (!S.job) BW.print('nothing worth your time. accept a contract first.', 'dim');
    }
  });
  BW.cmd('connect', {
    aliases: ['ssh', 'jackin'], ctx: 'local', usage: 'connect <host>', async run(args) {
      const S = BW.S;
      const host = args[0];
      if (!host) return BW.print('connect: which host? try "scan".', 'err');
      if (!S.job || S.job.host !== host) return BW.print(`connect: ${host}: connection refused (ICE wall). you need a contract and a route.`, 'err');
      if (S.hp <= 3) return BW.print('your neural integrity is too low to jack in safely. "rest" first.', 'err');
      await BW.net.enter();
    }
  });
  BW.cmd('shop', {
    ctx: 'local', run() {
      const S = BW.S;
      BW.print(`== BLACK MARKET // "Fingers' Discount Chrome" (no refunds) == you have ${S.eddies}€$`, 'hdr');
      D.shop.forEach(it => {
        let price, owned = '';
        if (it.up) { const lvl = S.up[it.up]; price = it.costs[lvl]; owned = `lvl ${lvl}/${it.costs.length}`; if (price == null) { price = '--'; owned = 'MAXED'; } }
        else if (it.prog) { price = S.programs.includes(it.prog) ? '--' : it.cost; owned = S.programs.includes(it.prog) ? 'OWNED' : ''; }
        else { price = it.cost; owned = S.tt ? `have ${S.tt}` : ''; }
        BW.html(`[${k(it.id)}] ${U.esc(it.name).padEnd(28, '.')} ${String(price).padStart(5)}€$  ${U.esc(it.desc)} ${owned ? '<span class="k">(' + owned + ')</span>' : ''}`);
      });
      BW.print('"buy <id>" to purchase.', 'dim');
    }
  });
  BW.cmd('buy', {
    ctx: 'local', usage: 'buy <item id>', run(args) {
      const S = BW.S;
      const it = D.shop.find(x => x.id === (args[0] || '').toLowerCase());
      if (!it) return BW.print('buy: no such item. see "shop".', 'err');
      let price;
      if (it.up) { price = it.costs[S.up[it.up]]; if (price == null) return BW.print('already maxed out, choom.', 'dim'); }
      else if (it.prog) { if (S.programs.includes(it.prog)) return BW.print('you already own that.', 'dim'); price = it.cost; }
      else price = it.cost;
      if (S.eddies < price) return BW.print(`not enough eddies. you need ${price}€$, you have ${S.eddies}€$.`, 'err');
      S.eddies -= price;
      if (it.up) { S.up[it.up]++; if (it.up === 'hp') S.hp = BW.maxHp(); if (it.up === 'ram') S.ram = BW.maxRam(); }
      else if (it.prog) S.programs.push(it.prog);
      else if (it.tt) S.tt++;
      BW.print(`purchased: ${it.name}. -${price}€$`, 'good');
      BW.audio.sfx.ok();
    }
  });
  BW.cmd('rest', {
    ctx: 'local', async run() {
      const S = BW.S;
      BW.print('you unplug, eat something that might have been noodles, and sleep for nine hours.', 'dim');
      await U.sleep(600);
      S.hp = BW.maxHp(); S.ram = BW.maxRam(); S.trace = 0;
      if (S.jobsDone.includes('j1')) { BW.genGigs(); BW.print('neural integrity restored. the street board has new gigs.', 'good'); }
      else BW.print('neural integrity restored.', 'good');
      if (S.exposure >= 20 && U.chance(0.6)) {
        await U.sleep(800);
        BW.print('you dreamed of a wall made of screaming light. someone on the other side knew your name.', 'bw');
        BW.fx.flicker();
      }
    }
  });
  BW.cmd('irc', {
    ctx: 'any', combat: true, run() {
      const S = BW.S;
      if (!S.irc.length) return BW.print('#lowtide: no messages.', 'dim');
      BW.print('== #lowtide ==', 'hdr');
      S.irc.slice(-25).forEach(m => BW.html(`<b>&lt;${U.esc(m.from)}&gt;</b> ${U.esc(m.text)}`, m.cls === 'nw' ? 'nw' : m.cls === 'unk' ? 'bw' : 'irc'));
    }
  });
  BW.cmd('theme', {
    ctx: 'any', usage: 'theme <afterlife|amber|pacifica|glacier|bone|blackwall>', run(args) {
      const t = BW.ui.themes.find(x => x.id === (args[0] || '').toLowerCase());
      if (!t) return BW.print('themes: ' + BW.ui.themes.filter(x => x.unlocked()).map(x => x.id).join(', '), 'dim');
      if (!t.unlocked()) return BW.print('theme: locked. something has to find you first.', 'err');
      BW.ui.setTheme(t.id);
      BW.print('theme set: ' + t.name);
    }
  });
  BW.cmd('radio', {
    ctx: 'any', combat: true, usage: 'radio <1-5|off>', run(args) {
      const a = (args[0] || '').toLowerCase();
      if (a === 'off' || a === 'stop') { BW.audio.stop(); BW.ui.refresh(); return BW.print('radio off.', 'dim'); }
      const n = parseInt(a, 10);
      const st = BW.audio.stations.find(s => s.id === n && (!s.hidden || BW.S.exposure >= 30));
      if (!st) { BW.print('stations:', 'dim'); BW.audio.stations.filter(s => !s.hidden || BW.S.exposure >= 30).forEach(s => BW.print(`  ${s.id}. ${s.name} // ${s.genre}`)); return; }
      BW.audio.play(st.id); BW.ui.refresh();
      BW.print(`now playing: ${st.name} // ${st.genre}`, 'good');
      if (st.hidden) setTimeout(() => BW.fx.whisper('you found our station.'), 4000);
    }
  });
  BW.cmd('sound', {
    ctx: 'any', usage: 'sound on|off', run(args) {
      const S = BW.S;
      S.sound = (args[0] || '').toLowerCase() === 'on' ? true : (args[0] || '').toLowerCase() === 'off' ? false : !S.sound;
      BW.audio.enabled = S.sound;
      BW.print('sound effects: ' + (S.sound ? 'on' : 'off'));
    }
  });
  BW.cmd('history', { ctx: 'any', combat: true, run() { BW.S.history.slice(-30).forEach((h, i) => BW.print(String(i + 1).padStart(3) + '  ' + h, 'dim')); } });
  BW.cmd('echo', {
    ctx: 'any', run(args) {
      const t = args.join(' ');
      BW.print(t);
      if (/blackwall|hello|anyone/i.test(t) && BW.S.exposure > 15) setTimeout(() => BW.print(U.corrupt(t.split('').reverse().join(''), 0.2), 'bw'), 1200);
    }
  });
  BW.cmd('date', { ctx: 'any', combat: true, run() { BW.print(U.gameDate() + ' // Night City, Free State of Northern California'); } });
  BW.cmd('glossary', {
    ctx: 'any', combat: true, usage: 'glossary <term>', run(args) {
      const q = args.join(' ').replace(/_/g, ' ').toUpperCase();
      const key = Object.keys(D.glossary).find(x => x === q) || Object.keys(D.glossary).find(x => q && x.startsWith(q));
      if (!key) return BW.print('terms: ' + Object.keys(D.glossary).join(', ').toLowerCase(), 'dim');
      BW.print('== ' + key + ' ==', 'hdr'); BW.print(D.glossary[key]);
    }
  });
  BW.cmd('reboot', {
    ctx: 'local', usage: 'reboot [--wipe]', run(args) {
      if (!args.includes('--wipe')) { BW.save(); location.reload(); return; }
      BW.print('this deletes your runner forever. type WIPE to confirm, anything else to cancel.', 'warn');
      BW.inputHandler = (raw) => {
        BW.inputHandler = null;
        BW.html(`<span class="p">confirm:</span> ${U.esc(raw)}`, 'cmd');
        if (raw.trim() === 'WIPE') { wipe(); BW.S = null; location.reload(); }
        else BW.print('cancelled. you still exist.', 'dim');
      };
    }
  });
  BW.cmd('exit', {
    ctx: 'any', combat: true, run() {
      if (BW.S.net) return BW.cmds.jackout.run([]);
      BW.print('there is no exit. only jacking out. and you\'re not even jacked in.', 'dim');
    }
  });
})(window.BW);
