(function (BW) {
  const U = BW.util, D = BW.data;
  const $ = s => document.querySelector(s);
  const UI = BW.ui = {};

  UI.themes = [
    { id: 'afterlife', name: 'Afterlife Red (by kestrel)', unlocked: () => true },
    { id: 'amber', name: 'Watson Amber', unlocked: () => true },
    { id: 'pacifica', name: 'Pacifica Green', unlocked: () => true },
    { id: 'glacier', name: 'Glacier Blue', unlocked: () => true },
    { id: 'bone', name: 'Bone White (eye-searing)', unlocked: () => true },
    { id: 'blackwall', name: '░▒▓ BLACKWALL ▓▒░', unlocked: () => !!BW.S && (BW.S.exposure >= 40 || BW.S.ending === 'cross') }
  ];

  UI.setTheme = (id) => {
    document.body.dataset.theme = id;
    if (BW.S) { BW.S.theme = id; BW.save(); }
    UI.refresh();
  };

  function runOrPrint(cmd, fallback) {
    if (BW.S && !BW.busy && !BW.inputHandler) BW.exec(cmd);
    else if (fallback) fallback();
  }

  UI.init = () => {
    $('#readme').innerHTML = D.readmeHTML;

    const gl = $('#glossary');
    Object.keys(D.glossary).forEach(term => {
      const b = document.createElement('button');
      b.textContent = term;
      b.onclick = () => runOrPrint('glossary ' + term.toLowerCase().replace(/ /g, '_'), () => { BW.print('== ' + term + ' ==', 'hdr'); BW.print(D.glossary[term]); });
      gl.appendChild(b);
    });

    document.querySelectorAll('.card-h').forEach(h => h.addEventListener('click', () => {
      const card = h.parentElement;
      if (window.matchMedia('(max-width: 820px)').matches) card.classList.toggle('open');
      else card.classList.toggle('collapsed');
      if (card.querySelector('#map')) UI.refresh();
    }));

    const notes = $('#notes');
    let t;
    notes.addEventListener('input', () => {
      if (!BW.S) return;
      BW.S.notes = notes.value;
      clearTimeout(t); t = setTimeout(BW.save, 400);
    });

    // first interaction unlocks audio
    const unlock = () => { BW.audio.init(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    setTimeout(BW.fx.resize, 50);
  };

  function bar(id, frac) { $(id + ' .bar i').style.width = (U.clamp(frac, 0, 1) * 100) + '%'; }

  UI.refresh = () => {
    const S = BW.S;
    $('#prompt').textContent = BW.promptText();

    // location
    let parent = '--', current = '--', child = '--';
    if (S && S.net) {
      const floors = S.job.arch.floors, n = S.net.floor, f = floors[n];
      parent = n === 0 ? `ghostdeck_${S.deckId}` : `${S.net.host}/F${n}`;
      current = `${S.net.host}/F${n + 1}`;
      child = n < floors.length - 1 ? `F${n + 2}${f.gate && !f.gate.open ? ' [LOCKED]' : ''}` : (f.special ? '░▒▓' : '(none)');
    } else if (S) {
      const cwd = S.cwd;
      parent = cwd.length > 1 ? cwd[cwd.length - 2] : cwd.length === 1 ? '/' : '--';
      current = cwd.length ? cwd[cwd.length - 1] : '/';
      const r = BW.resolvePath('.');
      if (r.node && r.node.type === 'dir') child = Object.entries(r.node.children).filter(([, v]) => v.type === 'dir').map(([n]) => n).join(' ') || '';
    }
    $('#loc-parent').textContent = parent;
    $('#loc-current').textContent = current;
    $('#loc-child').textContent = child;

    // meters
    const meters = $('#meters');
    meters.style.visibility = S ? 'visible' : 'hidden';
    if (S) {
      bar('#m-hp', S.hp / BW.maxHp());
      $('#m-hp .val').textContent = `${Math.max(0, S.hp)}/${BW.maxHp()}`;
      const max = BW.maxRam();
      $('#m-ram .pips').innerHTML = Array.from({ length: max }, (_, i) => `<b class="${i < S.ram ? 'f' : ''}"></b>`).join('');
      $('#m-ram .val').textContent = `${S.ram}/${max}`;
      bar('#m-trace', S.trace / 100);
      $('#m-trace .val').textContent = S.net ? (S.net.wall ? '--' : S.trace + '%') : 'offline';
      $('#m-trace').classList.toggle('hot', S.trace >= 75);
      bar('#m-exp', S.exposure / 100);
      $('#m-exp .val').textContent = S.exposure + '%';
      $('#m-exp').classList.toggle('hidden', S.exposure <= 0);
      $('#m-ed .val').textContent = S.eddies.toLocaleString('en-US') + ' €$';
    }

    // irc
    const irc = $('#irc');
    if (!S || !S.irc.length) irc.innerHTML = '<div class="empty">no messages. it\'s quiet. too quiet.</div>';
    else {
      irc.innerHTML = S.irc.slice(-12).map(m => `<div class="m ${m.cls || ''}"><b>&lt;${U.esc(m.from)}&gt;</b> ${U.esc(m.text)}</div>`).join('');
      irc.scrollTop = irc.scrollHeight;
    }

    // deck info
    if (S) {
      const rows = [
        ['deck', `ghostdeck_${S.deckId}`], ['registry', 'NONE'], ['RAM', `${BW.maxRam()} (lvl ${S.up.ram})`],
        ['stealth', `lvl ${S.up.stealth}`], ['breach buf', `lvl ${S.up.buffer}`], ['programs', S.programs.length],
        ['contract', S.job ? S.job.title : '--']
      ];
      $('#deckinfo').innerHTML = '<p>Your rig. Salvaged, stripped, and not legally real. Upgrade it in the "shop".</p>' +
        rows.map(([a, b]) => `<div class="row"><span>${a}</span><span>${U.esc(String(b))}</span></div>`).join('') +
        `<p style="margin-top:8px">${S.programs.map(p => U.esc(p) + '.exe').join(' ')}</p>`;
    }

    // themes
    const th = $('#themes');
    th.innerHTML = '';
    UI.themes.forEach(t => {
      const b = document.createElement('button');
      const ok = t.unlocked();
      b.textContent = ok ? t.name : 'ERROR:' + U.hex(4) + '_' + U.hex(3) + ' ::: USER NOT FOUND';
      b.className = (document.body.dataset.theme === t.id ? 'on' : '') + (ok ? '' : ' locked');
      b.onclick = () => ok ? UI.setTheme(t.id) : (BW.audio.sfx.error(), BW.fx.rgb());
      th.appendChild(b);
    });

    // radio
    const rd = $('#radio');
    rd.innerHTML = '';
    BW.audio.stations.filter(s => !s.hidden || (S && S.exposure >= 30)).forEach(s => {
      const b = document.createElement('button');
      b.textContent = `${s.name} // ${s.genre}`;
      b.className = BW.audio.station === s.id ? 'on' : '';
      b.onclick = () => { if (BW.audio.station === s.id) BW.audio.stop(); else BW.audio.play(s.id); UI.refresh(); };
      rd.appendChild(b);
    });
    if (BW.audio.station) {
      const b = document.createElement('button');
      b.textContent = '[ OFF ]';
      b.onclick = () => { BW.audio.stop(); UI.refresh(); };
      rd.appendChild(b);
    }

    // notes + map
    const notes = $('#notes');
    if (S && document.activeElement !== notes && notes.value !== S.notes) notes.value = S.notes || '';
    $('#map').textContent = S ? BW.net.mapText() : 'no runner.';

    $('#ver-sub').textContent = S && S.exposure >= 60 ? '(' + U.corrupt('unregistered deck', 0.3) + ')' : '(unregistered deck)';
  };
})(window.BW);
