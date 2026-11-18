(function (BW) {
  const U = BW.util;
  const CODES = ['1C', '55', 'BD', 'E9', '7A', 'FF'];

  function makePath(size, len) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const used = new Set();
      let r = 0, c = U.ri(0, size - 1);
      const path = [[r, c]]; used.add(r + ',' + c);
      let ok = true;
      for (let i = 1; i < len; i++) {
        const opts = [];
        if (i % 2 === 1) { for (let rr = 0; rr < size; rr++) if (!used.has(rr + ',' + c)) opts.push([rr, c]); }
        else { for (let cc = 0; cc < size; cc++) if (!used.has(r + ',' + cc)) opts.push([r, cc]); }
        if (!opts.length) { ok = false; break; }
        [r, c] = U.pick(opts);
        used.add(r + ',' + c); path.push([r, c]);
      }
      if (ok) return path;
    }
    return null;
  }

  function genPuzzle(diff, bufLvl) {
    const size = diff >= 3 ? 6 : 5;
    const buffer = 4 + bufLvl + (diff >= 2 ? 1 : 0) + (diff >= 3 ? 1 : 0);
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => U.pick(CODES)));
    const path = makePath(size, buffer);
    const pc = path.map(([r, c]) => grid[r][c]);
    const l0 = diff === 1 ? 2 : 3, l1 = diff >= 3 ? 3 : 2;
    const daemons = [
      { id: 'GATE_OPEN', label: 'unlock password gate', req: true, len: l0 },
      { id: 'TRACE_SCRUB', label: '-20 trace', len: l1 }
    ];
    // place the two solvable sequences in the solution path in random order
    const order = U.chance(0.5) ? [0, 1] : [1, 0];
    const total = l0 + l1;
    let off = U.ri(0, Math.max(0, buffer - total));
    for (const i of order) { daemons[i].seq = pc.slice(off, off + daemons[i].len); off += daemons[i].len; }
    // a bonus daemon that may or may not be reachable
    const bonus = { id: 'DATAMINE', label: '+eddies', len: diff >= 2 ? 4 : 3 };
    bonus.seq = Array.from({ length: bonus.len }, () => U.pick(CODES));
    daemons.push(bonus);
    return { size, buffer, grid, daemons };
  }

  function longestMatch(buf, seq) {
    // longest prefix of seq that is a suffix of buf
    for (let k = Math.min(seq.length, buf.length); k > 0; k--) {
      let ok = true;
      for (let i = 0; i < k; i++) if (buf[buf.length - k + i] !== seq[i]) { ok = false; break; }
      if (ok) return k;
    }
    return 0;
  }
  function contains(buf, seq) {
    for (let i = 0; i + seq.length <= buf.length; i++) {
      let ok = true;
      for (let j = 0; j < seq.length; j++) if (buf[i + j] !== seq[j]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }

  BW.breach = {
    open(opts = {}) {
      return new Promise(resolve => {
        const S = BW.S;
        const diff = opts.diff || 1;
        const P = genPuzzle(diff, S.up.buffer);
        const timeLimit = (diff === 1 ? 30 : diff === 2 ? 24 : 20) + S.up.buffer * 5;
        const ov = document.getElementById('overlay');
        const buf = []; const picked = [];
        let started = false, t0 = 0, done = false, raf = 0;
        const done_ = new Set();

        ov.innerHTML = `
          <div class="bp" role="dialog" aria-label="Breach protocol">
            <div class="bp-h"><span>BREACH PROTOCOL</span><span class="bp-timer">${timeLimit.toFixed(2)}</span></div>
            <div class="bp-tbar"><i></i></div>
            <div class="bp-body">
              <div class="bp-grid" style="grid-template-columns: repeat(${P.size}, auto)"></div>
              <div class="bp-side">
                <h4>BUFFER</h4><div class="bp-buf"></div>
                <h4>SEQUENCE REQUIRED TO UPLOAD</h4><div class="bp-seqs"></div>
              </div>
            </div>
            <div class="bp-foot"><span>Pick from the highlighted ROW first, then alternate COLUMN / ROW. Timer starts on first pick. [ESC] abort.</span><button class="bp-end">END</button></div>
          </div>`;
        ov.hidden = false;
        const gridEl = ov.querySelector('.bp-grid');
        const bufEl = ov.querySelector('.bp-buf');
        const seqEl = ov.querySelector('.bp-seqs');
        const timerEl = ov.querySelector('.bp-timer');
        const tbar = ov.querySelector('.bp-tbar i');

        const cells = [];
        for (let r = 0; r < P.size; r++) for (let c = 0; c < P.size; c++) {
          const b = document.createElement('button');
          b.textContent = P.grid[r][c]; b.dataset.r = r; b.dataset.c = c;
          b.addEventListener('click', () => pick(r, c));
          b.addEventListener('mouseenter', () => hint(P.grid[r][c]));
          b.addEventListener('mouseleave', () => hint(null));
          gridEl.appendChild(b); cells.push(b);
        }

        function activeLine() {
          if (!picked.length) return { row: 0 };
          const [r, c] = picked[picked.length - 1];
          return picked.length % 2 === 1 ? { col: c } : { row: r };
        }
        function inLine(r, c) {
          const a = activeLine();
          return a.row != null ? r === a.row : c === a.col;
        }
        function hint(code) {
          cells.forEach(b => b.classList.toggle('hint', !!code && b.textContent === code && !b.classList.contains('used')));
        }
        function render() {
          cells.forEach(b => {
            const r = +b.dataset.r, c = +b.dataset.c;
            const used = picked.some(p => p[0] === r && p[1] === c);
            b.classList.toggle('used', used);
            b.classList.toggle('line', !used && !done && inLine(r, c));
            b.disabled = done || used || !inLine(r, c);
          });
          bufEl.innerHTML = Array.from({ length: P.buffer }, (_, i) => `<span class="${buf[i] ? 'f' : ''}">${buf[i] || ''}</span>`).join('');
          seqEl.innerHTML = P.daemons.map(d => {
            const isDone = done_.has(d.id);
            const left = P.buffer - buf.length;
            const m = isDone ? d.seq.length : longestMatch(buf, d.seq);
            const fail = !isDone && (d.seq.length - m) > left;
            return `<div class="bp-seq ${isDone ? 'done' : ''} ${fail ? 'fail' : ''} ${d.req ? 'req' : ''}">
              <div class="codes">${d.seq.map((s, i) => `<span class="${i < m ? 'm' : ''}">${s}</span>`).join('')}</div>
              <div class="nm">${d.id}<small>${d.label}</small></div></div>`;
          }).join('');
        }
        function pick(r, c) {
          if (done || !inLine(r, c) || picked.some(p => p[0] === r && p[1] === c)) return;
          if (!started) { started = true; t0 = performance.now(); raf = requestAnimationFrame(tick); }
          picked.push([r, c]); buf.push(P.grid[r][c]);
          BW.audio.sfx.enter();
          P.daemons.forEach(d => { if (!done_.has(d.id) && contains(buf, d.seq)) { done_.add(d.id); BW.audio.sfx.ok(); } });
          render();
          const allDone = P.daemons.every(d => done_.has(d.id));
          if (buf.length >= P.buffer || allDone) finish(false);
          else {
            const next = cells.find(b => !b.disabled);
            if (next) next.focus({ preventScroll: true });
          }
        }
        function tick() {
          if (done) return;
          const left = Math.max(0, timeLimit - (performance.now() - t0) / 1000);
          timerEl.textContent = left.toFixed(2);
          tbar.style.width = (left / timeLimit * 100) + '%';
          if (left <= 0) return finish(false, true);
          raf = requestAnimationFrame(tick);
        }
        async function finish(aborted, timeout) {
          if (done) return; done = true;
          cancelAnimationFrame(raf);
          document.removeEventListener('keydown', onKey, true);
          render();
          const success = done_.has('GATE_OPEN') && !aborted;
          const res = document.createElement('div');
          res.className = 'bp-result ' + (success ? 'ok' : 'no');
          res.textContent = aborted ? 'BREACH ABORTED' : success ? 'BREACH SUCCESSFUL // DAEMONS UPLOADED: ' + [...done_].join(', ') : (timeout ? 'BREACH TIMED OUT' : 'BREACH FAILED');
          ov.querySelector('.bp').appendChild(res);
          success ? BW.audio.sfx.ok() : BW.audio.sfx.error();
          await U.sleep(1300);
          ov.hidden = true; ov.innerHTML = '';
          resolve({ success, aborted: !!aborted, installed: [...done_] });
        }
        function onKey(e) {
          if (e.key === 'Escape') { e.preventDefault(); finish(true); }
        }
        document.addEventListener('keydown', onKey, true);
        ov.querySelector('.bp-end').addEventListener('click', () => finish(buf.length === 0));
        render();
        const first = cells.find(b => !b.disabled); if (first) first.focus();
      });
    }
  };
})(window.BW);
