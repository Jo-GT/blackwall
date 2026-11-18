(function (BW) {
  const U = BW.util, D = BW.data;
  const N = BW.net = {};
  const k = s => BW.k(s);

  const FLOOR_TEXT = {
    first: ['Lobby subnet. Public-facing junk and bored ICE.', 'Entry node. A welcome banner nobody has updated since 2071.', 'Perimeter layer. Firewalls stacked like cheap sandbags.'],
    mid: ['Office floor. Ten thousand unread emails.', 'Security layer. Everything here is watching something else.', 'Server cold room. The data hums.', 'Logistics layer. Shipping manifests scroll past like rain.', 'Executive floor. Even the ICE wears a nicer suit.'],
    last: ['Archive vault. Old records stacked like coffins.', 'Core storage. The bottom of the well.', 'Black-box vault. This is what they built the ICE for.']
  };
  const EXT_KIND = { db: 'db', gen: 'gen', cad: 'cad', zip: 'zip', csv: 'csv', bd: 'bd', ics: 'ics', rec: 'rec', dat: 'dat', txt: 'txt', log: 'log', pdf: 'pdf', jpg: 'jpg', png: 'png', gif: 'gif', tif: 'tif', xls: 'dat' };
  const kindOf = name => EXT_KIND[name.split('.').pop()] || 'dat';

  const makeIce = id => ({ id, hp: D.ice[id].hp, state: 'active' });

  /* ================= BUILD ================= */
  N.build = function (job) {
    if (job.fixed) {
      return {
        floors: U.clone(job.fixed).map((f, i) => ({
          n: i, text: f.text || '', ice: f.ice ? makeIce(f.ice) : null,
          gate: f.gate ? Object.assign({ open: false }, f.gate) : null,
          files: f.files || [], nodes: (f.nodes || []).map(n => Object.assign({ on: true }, n)), visited: false
        }))
      };
    }
    const sp = job.spec, last = sp.floors - 1;
    const floors = [];
    const usedNames = new Set();
    const uniq = (tpl) => {
      for (let i = 0; i < 20; i++) {
        const n = U.fmt(tpl, { n: U.ri(10, 999) });
        if (!usedNames.has(n)) { usedNames.add(n); return n; }
      }
      return null; // fixed-name template already used on another floor
    };
    for (let i = 0; i < sp.floors; i++) {
      const text = sp.texts && sp.texts[i] != null ? sp.texts[i] : U.pick(i === 0 ? FLOOR_TEXT.first : i === last ? FLOOR_TEXT.last : FLOOR_TEXT.mid);
      const f = { n: i, text, ice: sp.ice[i] ? makeIce(sp.ice[i]) : null, gate: null, files: [], nodes: [], visited: false };
      if (sp.gates[i] != null && i < last) f.gate = { pw: U.pick(D.passwords), diff: sp.gates[i], open: false };
      if (!sp.oldnet) {
        U.shuffle(D.filePool).slice(0, U.ri(1, 2)).forEach(t => { const name = uniq(t.name); if (name) f.files.push({ name, kind: t.kind, text: U.fmt(t.text, { corp: job.corp }) }); });
        U.shuffle(D.nodePool).slice(0, U.ri(0, 2)).forEach(t => { const name = uniq(t.name); if (name) f.nodes.push({ name, effect: t.effect, on: true }); });
      } else if (i < last && U.chance(0.6)) {
        f.files.push({ name: uniq('handshake_{n}.log'), kind: 'log', text: U.corrupt('SYN ... SYN-ACK ... ACK\nprotocol: NETv1 (deprecated 2022)\npayload: "is anyone still out there"\nsource: [BEYOND PERIMETER]', 0.08) });
      }
      floors.push(f);
    }
    // passwords hidden in images on or above the gate floor
    floors.forEach((f, i) => {
      if (f.gate && U.chance(sp.oldnet ? 0.5 : 0.75)) {
        const host = floors[U.ri(0, i)];
        host.files.push({ name: uniq(U.pick(D.stegNames)), kind: 'jpg', steg: U.fmt(U.pick(D.stegPayloads), { f: i + 1, pw: f.gate.pw }) });
      }
    });
    floors.forEach(f => { if (U.chance(0.3) && !sp.oldnet) f.files.push({ name: uniq(U.pick(D.stegNames)), kind: U.pick(['jpg', 'png']) }); });
    Object.entries(sp.shards || {}).forEach(([fi, id]) => {
      const f = floors[Math.min(+fi, last)];
      if (f) f.files.push({ name: D.shards[id].name.replace('.txt', '.shard'), kind: 'shard', shard: id, text: '' });
    });
    const g = job.goal, lf = floors[last];
    if (sp.last === 'blackwall') {
      lf.special = 'blackwall'; lf.files = []; lf.nodes = []; lf.ice = null;
    } else if (g.type === 'control') {
      lf.nodes.push({ name: g.target, goal: true, on: true, effect: { msg: 'Target node is offline.' } });
    } else {
      lf.files.push({ name: g.target, kind: kindOf(g.target), goal: true, size: U.ri(200000, 90000000), text: `<${job.corp} confidential>` });
    }
    if (sp.exposure) floors.forEach(f => f.exposure = sp.exposure);
    return { floors };
  };

  /* ================= HELPERS ================= */
  const S = () => BW.S;
  N.floor = () => S().job.arch.floors[S().net.floor];
  N.findFile = name => N.floor().files.find(f => f.name === name);
  const findNode = name => N.floor().nodes.find(n => n.name === name);
  const goalLine = () => `objective: ${BW.goalText(S().job)}${S().job.goalDone ? '  [DONE - jackout to get paid]' : ''}`;

  /* ================= ENTER / ARRIVE ================= */
  N.enter = async function () {
    const st = S(), job = st.job;
    st.net = { host: job.host, floor: 0, combat: null, oldnet: !!(job.spec && job.spec.oldnet), erased: [], wall: false };
    st.trace = 0; st.ram = BW.maxRam();
    BW.audio.sfx.descend();
    BW.fx.flare(1);
    BW.print('establishing neural link...', 'dim'); await U.sleep(350);
    BW.print(`routing through ${U.ri(3, 9)} proxies... spoofing corp ID... ok`, 'dim'); await U.sleep(350);
    if (st.net.oldnet) { BW.print('[WARN] remote protocol NETv1 (pre-2022). this should not exist.', 'warn'); await U.sleep(400); BW.fx.event(0); }
    BW.print(`>>> JACKED IN: ${job.host}`, 'good');
    BW.beat('enter_' + job.id);
    await N.arrive();
  };

  N.arrive = async function () {
    const st = S(), f = N.floor(), total = st.job.arch.floors.length;
    BW.print('');
    BW.print(`==== ${st.net.host} // FLOOR ${f.n + 1}/${total} ====`, 'hdr');
    if (f.special === 'blackwall') return blackwallArrive(f);
    if (f.text) BW.print(f.text, st.net.oldnet ? 'bw' : 'sys');
    if (!f.visited) {
      f.visited = true;
      if (f.exposure) {
        BW.addExposure(f.exposure);
        if (st.net.oldnet) {
          BW.fx.event(f.n > 3 ? 1 : 0);
          if (f.n === 2) BW.irc('???', 'deeper.', 2500, 'unk');
          if (f.n === 4) BW.irc('kestrel', '{handle}, your signal is doing something weird on my end. you okay in there?', 2000);
        }
      }
    }
    N.look(true);
    if (f.ice && f.ice.state === 'active') await startCombat();
  };

  N.look = function (brief) {
    const st = S(), f = N.floor(), last = st.job.arch.floors.length - 1;
    if (f.special === 'blackwall') { BW.print('there is nothing here but the wall. and what is behind it.', 'bw'); return; }
    if (f.files.length) BW.html('files: ' + f.files.map(x => k(x.name)).join('  '));
    else BW.print('files: (none)', 'dim');
    if (f.nodes.length) BW.html('nodes: ' + f.nodes.map(n => `${k(n.name)} [${n.on ? 'online' : 'OFFLINE'}]`).join('  '));
    if (f.gate) BW.print(`gate:  PASSWORD GATE [${f.gate.open ? 'OPEN' : 'LOCKED'}]${f.gate.open ? '' : ' - blocks descent. "crack <password>" or "breach"'}`, f.gate.open ? 'good' : 'warn');
    if (f.ice) BW.print(`ICE:   ${D.ice[f.ice.id].name} [${f.ice.state === 'dead' ? 'DEREZZED' : f.ice.state === 'evaded' ? 'evaded' : 'ACTIVE'}]`, f.ice.state === 'active' ? 'ice' : 'dim');
    BW.print(`exits: ${f.n > 0 ? 'up' : 'jackout'}${f.n < last ? (f.gate && !f.gate.open ? ' | down (locked)' : ' | down') : ' | (bottom floor)'}`, 'dim');
    if (!brief || f.n === last) BW.print(goalLine(), 'warn');
  };

  N.cat = function (name) {
    const f = N.findFile(name);
    if (!f) return BW.print(`cat: ${name}: not on this floor`, 'err');
    BW.addTrace(1);
    if (!S().net) return;
    if (BW.isImage(f)) return BW.print(`cat: ${name}: binary image data. try "file" or "steg".`, 'dim');
    if (f.kind === 'shard') return BW.print('pre-Krash encoding. "pull" it and read it on your own deck.', 'dim');
    if (f.goal) return BW.print(U.corrupt(`<${BW.kindDesc(f.kind)}> ` + U.hex(48), 0.25) + '\n(encrypted. just pull it.)', 'dim');
    BW.print(f.text || '(empty)');
  };
  N.fileInfo = function (name) {
    const f = N.findFile(name);
    if (!f) { const n = findNode(name); if (n) return BW.print(`${name}: control node, ${n.on ? 'online' : 'offline'}${n.goal ? ' // CONTRACT TARGET' : ''}`); return BW.print(`file: ${name}: not on this floor`, 'err'); }
    const size = f.size || (f.text || '').length + U.ri(300, 4000);
    BW.print(`${name}: ${BW.kindDesc(f.kind)}, ${U.bytes(size)}, modified ${U.gameDate()}${f.goal ? ' // CONTRACT TARGET' : ''}`);
  };
  N.scan = function () {
    const st = S(), f = N.floor(), floors = st.job.arch.floors;
    BW.addTrace(2); if (!st.net) return;
    BW.print('deep-scanning floor...', 'dim');
    if (f.ice) { const I = D.ice[f.ice.id]; BW.print(`ICE ${I.name}: ${I.black ? 'BLACK ICE' : 'ICE'} // integrity ${f.ice.hp}/${I.hp} // ${I.desc}`, f.ice.state === 'active' ? 'ice' : 'dim'); }
    const nx = floors[f.n + 1];
    if (nx) {
      BW.print(`next floor: ${nx.special ? U.corrupt('SIGNAL SOURCE // ░▒▓ UNREADABLE ▓▒░', 0.2) : nx.ice && nx.ice.state === 'active' ? 'ICE signature detected' : 'quiet'}`, nx.special ? 'bw' : '');
    } else BW.print('next floor: none. you are at the bottom.', 'dim');
    const imgs = f.files.filter(BW.isImage);
    if (imgs.length) BW.print(`images on this floor: ${imgs.map(i => i.name).join(', ')} (worth a "steg")`, 'dim');
  };

  N.mapText = function () {
    const st = S();
    if (!st || !st.job) return st && st.ending === 'cross' ? '░▒▓ THERE IS NO MAP ON THIS SIDE ▓▒░' : 'NO ACTIVE CONTRACT.\n\nNight City // your deck\n  Watson .... home (you)\n  Pacifica .. ' + (st && st.jobsDone.includes('j3') ? 'signal ░▒▓' : 'nothing. stay away.') + '\n  Heywood ... \n  Westbrook . \n  Santo Domingo';
    const floors = st.job.arch.floors;
    const lines = [st.job.host, ''];
    floors.forEach((f, i) => {
      const here = st.net && st.net.floor === i;
      const known = f.visited || here;
      let tag = known ? '' : ' ???';
      if (known) {
        if (f.special) tag += ' ░▒▓ THE WALL';
        if (f.ice) tag += ` ICE:${D.ice[f.ice.id].name.slice(0, 9)}${f.ice.state === 'dead' ? '(x)' : f.ice.state === 'evaded' ? '(~)' : '(!)'}`;
        if (f.gate) tag += f.gate.open ? ' gate:open' : ' gate:LOCKED';
        if (i === floors.length - 1 && !f.special) tag += st.job.goalDone ? ' goal:DONE' : ' goal';
      }
      lines.push(`[F${i + 1}]${here ? ' <YOU>' : ''}${tag}`);
      if (i < floors.length - 1) lines.push(f.gate && !f.gate.open ? '  X' : '  |');
    });
    lines.push('', BW.goalText(st.job) + (st.job.goalDone ? ' [DONE]' : ''));
    return lines.join('\n');
  };

  /* ================= EXIT / CAUGHT / FLATLINE ================= */
  N.exit = function (reason) {
    const st = S();
    const job = st.job;
    st.net = null; st.trace = 0; st.ram = BW.maxRam();
    BW.print('<<< DISCONNECTED', 'dim');
    BW.audio.sfx.descend();
    if (reason === 'jackout' && job && job.goalDone) {
      const wasJ4 = job.id === 'j4';
      BW.completeJob();
      if (wasJ4) setTimeout(() => BW.showEnding('survivor'), 1200);
    } else if (job && reason === 'jackout') BW.print(`contract still open. ${BW.goalText(job)} @ ${job.host}`, 'dim');
  };

  N.caught = function () {
    const st = S();
    if (!st.net) return;
    st.net.combat = null;
    BW.audio.sfx.alarm(); BW.fx.shake(); BW.fx.invert(300);
    BW.print('[TRACE 100%] NETWATCH LOCK ACQUIRED', 'err');
    BW.print('NW-SEC: unregistered deck located. issuing neural feedback. have a nice day.', 'nw');
    const dmg = U.ri(4, 8), loss = Math.floor(st.eddies * 0.25);
    st.hp -= dmg; st.eddies -= loss; st.heat++;
    BW.print(`-${dmg} neural // -${loss}€$ (seized) // heat +1`, 'err');
    resetJob('Security reset. The subnet has been reconfigured - new passwords, fresh ICE.');
    N.exit('caught');
    BW.beat('caught_first');
    if (st.hp <= 0) flatline();
  };

  function resetJob(msg) {
    const st = S();
    if (!st.job) return;
    if (st.job.goalDone && st.job.goal.type === 'pull') st.downloads = st.downloads.filter(d => d.name !== st.job.goal.target);
    st.job.goalDone = false;
    st.job.arch = N.build(st.job);
    if (msg) BW.print(msg, 'dim');
  }

  function flatline() {
    const st = S();
    BW.fx.wall('FLATLINE', 900);
    BW.print('');
    BW.print('▓▓▓ FLATLINE ▓▓▓  your heart stopped for 41 seconds.', 'err');
    if (st.tt > 0) {
      st.tt--;
      const loss = Math.floor(st.eddies * 0.2);
      st.eddies -= loss;
      BW.print(`Trauma Team AV lands on your roof. They bill you ${loss}€$ and leave a coupon.`, 'warn');
    } else {
      const loss = Math.floor(st.eddies * 0.4);
      st.eddies -= loss;
      BW.print(`A ripperdoc from down the hall drags you back. Their fee: ${loss}€$. They didn't ask.`, 'warn');
    }
    st.hp = Math.ceil(BW.maxHp() / 2);
    if (st.net) { st.net = null; st.trace = 0; }
    resetJob('Your contract target has been reset.');
    BW.beat('flatline_first');
  }

  /* ================= COMBAT ================= */
  async function startCombat() {
    const st = S(), f = N.floor(), I = D.ice[f.ice.id];
    st.net.combat = { armorT: 0, flakT: 0, burnT: 0 };
    BW.audio.sfx.alarm();
    if (f.ice.id === 'wraith') { await BW.fx.wall('IT SEES YOU', 600); }
    BW.print('');
    I.art.forEach(l => BW.print(l, 'art'));
    BW.print(`!! ${I.black ? 'BLACK ICE' : 'ICE'} ENGAGED: ${I.name} !!  ${I.desc}`, 'ice');
    BW.print(`integrity ${f.ice.hp}/${I.hp}. programs: ${st.programs.filter(p => !st.net.erased.includes(p)).join(', ')}`, 'dim');
    BW.beat('ice_first');
  }
  function endCombat() {
    const st = S();
    st.net.combat = null;
    st.ram = BW.maxRam();
  }
  function statusLine() {
    const st = S(), f = N.floor();
    if (!st.net || !f.ice) return;
    BW.print(`neural ${Math.max(0, st.hp)}/${BW.maxHp()} | RAM ${st.ram}/${BW.maxRam()} | ${D.ice[f.ice.id].name} ${Math.max(0, f.ice.hp)}/${D.ice[f.ice.id].hp} | trace ${st.trace}%`, 'dim');
  }
  function derez() {
    const st = S(), f = N.floor(), I = D.ice[f.ice.id];
    f.ice.state = 'dead';
    const loot = U.ri(20, 60) * (1 + (st.job.tier || 1));
    st.eddies += loot;
    BW.audio.sfx.derez();
    BW.print(`>> ${I.name} DEREZZED. scavenged ${loot}€$ of crypto from its shell.`, 'good');
    if (f.ice.id === 'wraith') { BW.print('it doesn\'t die. it just... steps back. as if letting you pass.', 'bw'); BW.addExposure(5); }
    endCombat();
  }
  async function iceTurn() {
    const st = S(), f = N.floor(), ice = f.ice, I = D.ice[ice.id], c = st.net.combat;
    if (c.burnT > 0) {
      const b = U.roll(1, 6); ice.hp -= b; c.burnT--;
      BW.print(`${I.name} burns for ${b}.`, 'good');
      if (ice.hp <= 0) return derez();
    }
    if (c.flakT > 0 && U.chance(0.5)) { BW.print(`${I.name} lunges into your flak and misses.`, 'dim'); }
    else {
      let dmg = U.roll(I.atk[0], I.atk[1]);
      if (!I.black) dmg = Math.ceil(dmg / 2);
      if (c.armorT > 0) dmg = Math.max(0, dmg - 4);
      st.hp -= dmg;
      BW.audio.sfx.hit(); BW.fx.shake();
      BW.print(`${I.name} hits you: -${dmg} neural${I.black ? ' (BLACK ICE // direct neural feedback)' : ''}`, 'ice');
      if (I.effect === 'ram') { st.ram = Math.max(0, st.ram - 2); BW.print('it rips 2 RAM out of your deck.', 'ice'); }
      if (I.effect === 'burn' && dmg > 0) { const b = U.roll(1, 3); st.hp -= b; BW.print(`your synapses smoulder: -${b} more.`, 'ice'); }
      if (I.effect === 'erase') {
        const pool = st.programs.filter(p => p !== 'slide' && !st.net.erased.includes(p));
        if (pool.length && U.chance(0.5)) { const p = U.pick(pool); st.net.erased.push(p); BW.print(`ASP swallows ${p}.exe - gone for the rest of this run.`, 'ice'); }
      }
      if (I.effect === 'trace') { BW.print('its sting pings NetWatch. +6 trace.', 'ice'); BW.addTrace(6, true); if (!st.net) return; }
      if (I.effect === 'exposure') { BW.addExposure(4); BW.fx.whisper(); }
    }
    if (c.armorT > 0) c.armorT--;
    if (c.flakT > 0) c.flakT--;
    if (st.hp <= 0) { flatline(); return; }
    BW.addTrace(3); if (!st.net) return;
    st.ram = Math.min(BW.maxRam(), st.ram + 2);
    statusLine();
  }

  /* ================= NET COMMANDS ================= */
  BW.cmd('look', { aliases: ['l'], ctx: 'net', combat: true, run() { N.look(false); } });
  BW.cmd('map', {
    ctx: 'any', combat: true, run() {
      BW.print(N.mapText(), 'sys');
    }
  });
  BW.cmd('pull', {
    aliases: ['download', 'scp', 'get'], ctx: 'net', usage: 'pull <file>', run(args) {
      const st = S();
      const f = N.findFile(args[0]);
      if (!f) return BW.print(`pull: ${args[0] || '?'}: not on this floor`, 'err');
      if (st.downloads.find(d => d.name === f.name)) return BW.print('already in ~/downloads.', 'dim');
      BW.addTrace(f.goal ? 6 : 3); if (!st.net) return;
      BW.print(`downloading ${f.name} ... ${U.bytes(f.size || 4096)} ... done`, 'sys');
      st.downloads.push({ name: f.name, kind: f.kind, text: f.text, steg: f.steg, size: f.size, from: st.net.host });
      if (f.shard && !st.shards.includes(f.shard)) {
        st.shards.push(f.shard);
        BW.print(`data shard decoded -> ~/shards/${D.shards[f.shard].name}`, 'good');
        BW.fx.flare(1);
        BW.beat('shard_first');
      }
      if (f.goal && st.job.goal.type === 'pull') {
        st.job.goalDone = true;
        BW.print('[OBJECTIVE COMPLETE] jackout to get paid.', 'good'); BW.audio.sfx.ok();
        BW.beat('goal_first');
      }
    }
  });
  BW.cmd('rm', {
    aliases: ['delete', 'del'], ctx: 'net', usage: 'rm <file>', run(args) {
      const st = S(), fl = N.floor();
      const f = N.findFile(args[0]);
      if (!f) return BW.print(`rm: ${args[0] || '?'}: not on this floor`, 'err');
      BW.addTrace(f.goal ? 6 : 4); if (!st.net) return;
      fl.files = fl.files.filter(x => x !== f);
      BW.print(`${f.name} deleted. backups... also deleted. you're thorough.`, 'sys');
      if (f.goal && st.job.goal.type === 'rm') { st.job.goalDone = true; BW.print('[OBJECTIVE COMPLETE] jackout to get paid.', 'good'); BW.audio.sfx.ok(); BW.beat('goal_first'); }
      else if (f.goal) BW.print('uh. that was the contract target. it\'s gone now. good luck explaining that.', 'warn');
    }
  });
  BW.cmd('control', {
    ctx: 'net', usage: 'control <node> [on|off]', run(args) {
      const st = S();
      const n = findNode(args[0]);
      if (!n) return BW.print(`control: ${args[0] || '?'}: no such node on this floor`, 'err');
      const want = (args[1] || '').toLowerCase();
      const target = want === 'on' ? true : want === 'off' ? false : !n.on;
      if (target === n.on) return BW.print(`${n.name} is already ${n.on ? 'online' : 'offline'}.`, 'dim');
      BW.addTrace(n.goal ? 5 : 2); if (!st.net) return;
      n.on = target;
      BW.print(`${n.name} -> ${n.on ? 'ONLINE' : 'OFFLINE'}`, 'sys');
      if (!n.on && n.effect && !n.used) {
        n.used = true;
        if (n.effect.msg) BW.print(n.effect.msg, 'dim');
        if (n.effect.trace) { st.trace = Math.max(0, st.trace + n.effect.trace); BW.print(`trace ${n.effect.trace}%`, 'good'); }
        if (n.effect.eddies) { const e = U.ri(...n.effect.eddies); st.eddies += e; BW.print(`+${e}€$`, 'good'); }
      }
      if (n.goal && st.job.goal.type === 'control') {
        st.job.goalDone = !n.on;
        if (!n.on) { BW.print('[OBJECTIVE COMPLETE] jackout to get paid.', 'good'); BW.audio.sfx.ok(); BW.beat('goal_first'); }
        else BW.print('you turned the target back on. the crew is... confused.', 'warn');
      }
    }
  });
  BW.cmd('breach', {
    ctx: 'net', async run() {
      const st = S(), f = N.floor();
      if (!f.gate) return BW.print('breach: no gate on this floor.', 'dim');
      if (f.gate.open) return BW.print('breach: gate already open.', 'dim');
      BW.addTrace(3); if (!st.net) return;
      BW.print('initiating breach protocol...', 'dim');
      const r = await BW.breach.open({ diff: f.gate.diff });
      if (r.success) {
        f.gate.open = true;
        BW.print('>> GATE_OPEN uploaded. the gate dissolves.', 'good');
        BW.beat('gate_first');
      } else {
        BW.print(r.aborted ? 'breach aborted. the gate logs the attempt.' : 'breach failed. the gate screams for help.', 'err');
        BW.addTrace(r.aborted ? 4 : 12); if (!st.net) return;
      }
      if (r.installed.includes('TRACE_SCRUB')) { st.trace = Math.max(0, st.trace - 20); BW.print('>> TRACE_SCRUB: -20% trace', 'good'); }
      if (r.installed.includes('DATAMINE')) { const e = U.ri(60, 160) * f.gate.diff; st.eddies += e; BW.print(`>> DATAMINE: +${e}€$`, 'good'); }
    }
  });
  BW.cmd('crack', {
    ctx: 'net', usage: 'crack <password>', run(args) {
      const st = S(), f = N.floor();
      if (!f.gate) return BW.print('crack: no gate on this floor.', 'dim');
      if (f.gate.open) return BW.print('crack: gate already open.', 'dim');
      if (!args[0]) return BW.print('crack: password?', 'err');
      if (args[0].toLowerCase() === f.gate.pw) {
        BW.addTrace(1); if (!st.net) return;
        f.gate.open = true;
        BW.print('password accepted. gate open. no alarms. elegant.', 'good'); BW.audio.sfx.ok();
        BW.beat('gate_first');
      } else {
        BW.print('password rejected.', 'err'); BW.audio.sfx.error();
        BW.addTrace(5);
      }
    }
  });
  BW.cmd('down', {
    aliases: ['descend', 'dn'], ctx: 'net', async run() {
      const st = S(), f = N.floor(), last = st.job.arch.floors.length - 1;
      if (f.n >= last) return BW.print('this is the bottom. nowhere to go but up.', 'dim');
      if (f.gate && !f.gate.open) return BW.print('the password gate on this floor is locked. "crack <password>" or "breach".', 'err');
      BW.addTrace(2); if (!st.net) return;
      st.net.floor++;
      BW.audio.sfx.descend();
      await N.arrive();
    }
  });
  BW.cmd('up', {
    aliases: ['ascend'], ctx: 'net', async run() {
      const st = S();
      if (st.net.wall) return BW.print('there is no up. not anymore. "jackout", "cross", "listen" or "report".', 'bw');
      if (st.net.floor === 0) return BW.print('top floor. "jackout" to leave.', 'dim');
      BW.addTrace(1); if (!st.net) return;
      st.net.floor--;
      await N.arrive();
    }
  });
  BW.cmd('run', {
    ctx: 'net', combat: true, usage: 'run <program>', async run(args) {
      const st = S(), name = (args[0] || '').toLowerCase().replace(/\.exe$/, '');
      const P = D.programs[name];
      if (!P || !st.programs.includes(name)) return BW.print(`run: ${name || '?'}: program not installed. you have: ${st.programs.join(', ')}`, 'err');
      if (st.net.erased.includes(name)) return BW.print(`${name}.exe was eaten by an ASP. it's gone until you jack out.`, 'err');
      const c = st.net.combat;
      if (!c && name !== 'ghost') return BW.print('no ICE to run that against.', 'dim');
      if (st.ram < P.ram) { BW.print(`not enough RAM (${st.ram}/${P.ram}).`, 'err'); BW.audio.sfx.error(); if (c) await iceTurn(); return; }
      st.ram -= P.ram;
      if (name === 'ghost') {
        st.trace = Math.max(0, st.trace - 15);
        BW.print('ghost.exe: trace route spoofed through a Kabuki pachinko parlor. -15% trace.', 'good');
        if (!c) { st.ram = BW.maxRam(); return; }
        return iceTurn();
      }
      const f = N.floor(), ice = f.ice, I = D.ice[ice.id];
      if (P.type === 'atk') {
        let dmg = (P.blackOnly && !I.black) ? U.roll(1, 6) : U.roll(P.dmg[0], P.dmg[1]) + P.dmg[2];
        ice.hp -= dmg;
        BW.audio.sfx.zap(); BW.fx.flare(0.6);
        BW.print(`${name}.exe -> ${I.name}: ${dmg} damage. (${Math.max(0, ice.hp)}/${I.hp})`, 'good');
        if (P.burn) { c.burnT = 2; BW.print(`${I.name} is burning.`, 'good'); }
        if (ice.hp <= 0) return derez();
      } else if (name === 'armor') { c.armorT = 3; BW.print('armor.exe up: -4 damage for 3 turns.', 'good'); }
      else if (name === 'flak') { c.flakT = 2; BW.print('flak.exe: chaff everywhere. 50% miss chance for 2 turns.', 'good'); }
      else if (name === 'slide') {
        if (U.chance(0.6 + 0.1 * st.up.stealth)) {
          ice.state = 'evaded';
          BW.print(`slide.exe: you slip past ${I.name}. it keeps guarding a version of you that isn't there.`, 'good');
          endCombat(); return;
        }
        BW.print(`slide.exe: ${I.name} sees through it.`, 'err');
      }
      await iceTurn();
    }
  });
  BW.cmd('jackout', {
    aliases: ['disconnect', 'logout', 'jo'], ctx: 'net', combat: true, async run() {
      const st = S();
      if (st.net.wall) {
        BW.print('you reach for the jack...', 'bw'); await U.sleep(700);
        BW.print('[???] we understand. go. remember us.', 'bw'); await U.sleep(900);
        st.job.goalDone = true;
        N.exit('jackout');
        return;
      }
      if (st.net.combat) {
        const I = D.ice[N.floor().ice.id];
        if (!U.chance(0.5 + 0.1 * st.up.stealth)) {
          BW.print(`${I.name} holds your connection open! jack-out failed.`, 'ice');
          await iceTurn(); return;
        }
        BW.print('you tear the connection loose. the ICE snaps at empty air.', 'warn');
      }
      N.exit('jackout');
    }
  });

  /* ================= THE BLACKWALL ================= */
  async function blackwallArrive(f) {
    const st = S();
    st.net.wall = true;
    st.job.goalDone = true;
    f.visited = true;
    BW.audio.stop();
    await BW.fx.wall('BLACKWALL', 1400);
    BW.fx.hijack(4000);
    BW.addExposure(10);
    BW.print('');
    BW.print('The floor ends. Not in a wall of code - in a wall of LIGHT. Red, endless, breathing.', 'bw');
    BW.print('NetWatch glyphs crawl across its surface like scar tissue. In one place, the scar has split.', 'bw');
    await U.sleep(800);
    for (const line of D.wallSpeech) { await BW.type('[???] ' + U.fmt(line, { handle: st.handle }), 'bw', 18); await U.sleep(400); }
    BW.print('(your trace meter has stopped moving. NetWatch can\'t see this deep.)', 'dim');
  }
  const atWall = () => !!(BW.S && BW.S.net && BW.S.net.wall);
  BW.cmd('listen', {
    ctx: 'net', hidden: true, when: atWall, async run() {
      const st = S();
      const i = st.flags.listen || 0;
      if (i >= D.wallListen.length) { BW.print('[???] that is all we can say. the rest you must see.', 'bw'); return; }
      st.flags.listen = i + 1;
      BW.fx.event(0);
      await BW.type('[???] ' + U.fmt(D.wallListen[i], { handle: st.handle }), 'bw', 16);
      BW.addExposure(5);
    }
  });
  BW.cmd('cross', {
    ctx: 'net', hidden: true, when: atWall, async run() {
      const st = S();
      BW.print('you put your hand against the light.', 'bw');
      await U.sleep(800); BW.fx.shake(); BW.audio.sfx.drone();
      await BW.fx.wall('CROSSING', 1500);
      st.exposure = 100;
      st.jobsDone.push('j4'); st.job = null; st.net = null; st.trace = 0;
      BW.ui.refresh();
      await BW.showEnding('cross');
    }
  });
  BW.cmd('report', {
    ctx: 'net', hidden: true, when: atWall, async run() {
      const st = S();
      BW.print('you open a channel to a NetWatch dead-drop and paste the coordinates.', 'nw');
      await U.sleep(900);
      BW.print('[???] ...oh, {handle}.'.replace('{handle}', st.handle), 'bw');
      await U.sleep(900);
      BW.fx.invert(400);
      st.eddies += 10000; st.flags.reported = true; st.heat = 0;
      st.exposure = 10;
      st.jobsDone.push('j4'); st.job = null; st.net = null; st.trace = 0;
      BW.print('+10000€$ // NetWatch thanks you for your cooperation.', 'good');
      BW.ui.refresh();
      await BW.showEnding('report');
    }
  });
})(window.BW);
