'use strict';
/* scenes2.js — Act II (1958–1997): perceptron, ELIZA, XOR, winter, expert systems, backprop, LeNet, Deep Blue. */

/* ===================================================== 1958 Perceptron */
VIS.y1958 = (() => {
  const CA = [255, 190, 110], CB = [90, 235, 215];
  const PX = 1030, PY = 262, PWD = 660, PHT = 500;
  const PTS = (() => {
    const r = rng(58), out = [];
    while (out.length < 36) {
      const cls = out.length % 2, cx = cls ? 0.68 : 0.32, cy = cls ? 0.33 : 0.67;
      const x = cx + (r() - 0.5) * 0.46, y = cy + (r() - 0.5) * 0.46, m = y - x;
      if ((cls === 0 && m < 0.1) || (cls === 1 && m > -0.1) || x < 0.05 || x > 0.95 || y < 0.05 || y > 0.95) continue;
      out.push({ x, y, cls, i: out.length });
    }
    return out;
  })();
  const KEYS = [[0.52, 0.02], [1.05, 0.04], [1.66, -0.03], [2.09, 0.02], [2.37, 0]];
  const UPD = [1.8, 2.7, 3.6, 4.5], DONE = 5.4, NEWS = 6.2;
  const sx = x => PX + x * PWD, sy = y => PY + (1 - y) * PHT;
  const score = (p, phi, off) => Math.cos(phi) * (p.x - 0.5) + Math.sin(phi) * (p.y - 0.5) - off;
  const wrong = (p, phi, off) => (score(p, phi, off) > 0) !== (p.cls === 0);
  const PICK = UPD.map((_, i) => PTS.filter(p => wrong(p, KEYS[i][0], KEYS[i][1])).sort((a, b) => Math.abs(score(b, KEYS[i][0], KEYS[i][1])) - Math.abs(score(a, KEYS[i][0], KEYS[i][1])))[0]);
  let news = null;
  function prep() {
    const NW = 640, NH = 380;
    news = makeCanvas(NW, NH);
    const g = news.getContext('2d'), r = rng(1958);
    g.fillStyle = '#ece4d0';
    g.beginPath(); g.moveTo(0, 6);
    for (let x = 0; x <= NW; x += 16) g.lineTo(x, 4 + r() * 6);
    for (let y = 0; y <= NH; y += 16) g.lineTo(NW - r() * 6, y);
    for (let x = NW; x >= 0; x -= 16) g.lineTo(x, NH - r() * 6);
    for (let y = NH; y >= 0; y -= 16) g.lineTo(r() * 6, y);
    g.closePath(); g.fill();
    const id = g.getImageData(0, 0, NW, NH), d = id.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const n = (r() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
    g.fillStyle = '#1b1712'; g.textAlign = 'center';
    g.font = font(700, 50, F.serif); g.fillText('NEW NAVY DEVICE', NW / 2, 88);
    g.fillText('LEARNS BY DOING', NW / 2, 144);
    g.font = font(400, 19, F.serif, true);
    g.fillText('Psychologist Shows Embryo of Computer Designed', NW / 2, 184);
    g.fillText('to Read and Grow Wiser', NW / 2, 208);
    g.strokeStyle = '#1b1712'; g.lineWidth = 1; g.beginPath(); g.moveTo(40, 226); g.lineTo(NW - 40, 226); g.stroke();
    for (let col = 0; col < 3; col++) for (let k = 0; k < 7; k++) {
      const x = 40 + col * 190, y = 246 + k * 16, w = 170 - (k === 6 ? 70 : r() * 14);
      g.fillStyle = 'rgba(40,34,26,0.55)'; g.fillRect(x, y, w, 5);
    }
    g.font = font(600, 13, F.mono); g.fillStyle = 'rgba(30,25,18,0.8)'; g.fillText('JULY 8, 1958', NW / 2, 32);
  }
  function lineAt(lt) {
    let [phi, off] = KEYS[0];
    for (let i = 0; i < UPD.length; i++) {
      const p = E.io3(prog(UPD[i], UPD[i] + 0.45, lt));
      if (p > 0) { phi = lerp(KEYS[i][0], KEYS[i + 1][0], p); off = lerp(KEYS[i][1], KEYS[i + 1][1], p); }
    }
    return [phi, off];
  }
  function audio(t0) {
    PTS.forEach((p, i) => { if (i % 3 === 0) sfx(t0 + 0.3 + i * 0.022, 'dot', { v: 0.35 }); });
    UPD.forEach(u => sfx(t0 + u, 'tick', { v: 0.8 }));
    sfx(t0 + DONE, 'chime');
    sfx(t0 + NEWS, 'spin', { dur: 1.0 }); sfx(t0 + NEWS + 1.0, 'stamp', { v: 0.8 }); hit(t0 + NEWS + 1.0, 0.45);
  }
  function draw(c, lt) {
    const pa = E.out3(prog(0, 0.5, lt)), back = E.io2(prog(NEWS, NEWS + 1.0, lt));
    c.save();
    c.translate(VCX, VCY); c.scale(1 - 0.12 * back, 1 - 0.12 * back); c.translate(-VCX, -VCY);
    c.globalAlpha = pa * (1 - 0.6 * back);
    c.fillStyle = 'rgba(6,22,20,0.75)'; c.strokeStyle = rgba(CB, 0.35); c.lineWidth = 1.5;
    roundRect(c, PX - 40, PY - 72, PWD + 80, PHT + 112, 18); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,255,220,0.07)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= 10; i++) {
      c.moveTo(PX + (i * PWD) / 10, PY); c.lineTo(PX + (i * PWD) / 10, PY + PHT);
      c.moveTo(PX, PY + (i * PHT) / 10); c.lineTo(PX + PWD, PY + (i * PHT) / 10);
    }
    c.stroke();
    const A0 = c.globalAlpha;
    biLabel(c, '感知机', 'THE PERCEPTRON · 1958', PX - 10, PY - 30, { col: rgba(CB, 1), align: 'left', zs: 18, es: 13 });

    const la = E.out3(prog(0.95, 1.35, lt));
    const [phi, off] = lineAt(lt), nx = Math.cos(phi), ny = Math.sin(phi);
    const cx = 0.5 + nx * off, cy = 0.5 + ny * off;
    const Pp = (u, v) => [sx(cx - ny * u + nx * v), sy(cy + nx * u + ny * v)];
    c.save();
    c.beginPath(); c.rect(PX, PY, PWD, PHT); c.clip();
    c.globalAlpha = A0 * la;
    for (const [sgn, col] of [[1, CA], [-1, CB]]) {
      c.fillStyle = rgba(col, 0.08); c.beginPath();
      c.moveTo(...Pp(-3, 0)); c.lineTo(...Pp(3, 0)); c.lineTo(...Pp(3, 3 * sgn)); c.lineTo(...Pp(-3, 3 * sgn)); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.5;
    c.shadowColor = 'rgba(160,255,230,0.9)'; c.shadowBlur = 16;
    c.beginPath(); c.moveTo(...Pp(-3, 0)); c.lineTo(...Pp(3, 0)); c.stroke();
    c.restore();

    let errors = 0;
    for (const p of PTS) {
      const bad = la > 0.5 && wrong(p, phi, off);
      if (bad) errors++;
      const ap = clamp(E.outBack(prog(0.3 + p.i * 0.022, 0.62 + p.i * 0.022, lt)), 0, 1.3);
      if (ap <= 0) continue;
      const x = sx(p.x), y = sy(p.y), r = 8 * ap;
      c.fillStyle = rgba(p.cls ? CB : CA, 1); c.beginPath();
      if (p.cls === 0) c.arc(x, y, r, 0, TAU);
      else { c.moveTo(x, y - r * 1.3); c.lineTo(x + r * 1.3, y); c.lineTo(x, y + r * 1.3); c.lineTo(x - r * 1.3, y); c.closePath(); }
      c.fill();
      if (bad) { c.strokeStyle = 'rgba(255,95,95,0.9)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 7, 0, TAU); c.stroke(); }
    }
    UPD.forEach((u, i) => {
      const q = prog(u - 0.4, u + 0.35, lt), p = PICK[i];
      if (q <= 0 || q >= 1 || !p) return;
      c.strokeStyle = `rgba(255,255,255,${(1 - q).toFixed(3)})`; c.lineWidth = 2.5;
      c.beginPath(); c.arc(sx(p.x), sy(p.y), 12 + 34 * E.out3(q), 0, TAU); c.stroke();
    });
    const upd = UPD.filter(u => lt >= u).length;
    if (lt < DONE) {
      text(c, `更新 UPDATE ${upd}/4  ·  错误 ERRORS ${String(errors).padStart(2, '0')}`, PX + PWD + 10, PY - 30, { f: font(600, 15, F.mono), color: errors ? 'rgb(255,140,130)' : rgba(CB, 1), align: 'right', sp: 1, alpha: la });
    } else {
      const k = E.out3(prog(DONE, DONE + 0.4, lt));
      text(c, '✓ 收敛 CONVERGED  ·  错误 ERRORS 00', PX + PWD + 10, PY - 30, { f: font(700, 15, F.mono), color: rgba(CB, 1), align: 'right', sp: 1, alpha: k });
      c.globalCompositeOperation = 'lighter';
      glow(c, VCX, sy(0.5), 380, CB, 0.25 * Math.exp(-(lt - DONE) * 2), false);
      c.globalCompositeOperation = 'source-over';
    }
    text(c, '●  A 类 CLASS A      ◆  B 类 CLASS B      —  分界线 DECISION LINE', PX - 10, PY + PHT + 30, { f: font(500, 13, F.mono), color: 'rgba(200,255,240,0.6)', sp: 1 });
    c.restore();

    // the press goes wild: a spinning newspaper lands on the chart
    const np = prog(NEWS, NEWS + 1.0, lt);
    if (np > 0) {
      const e = E.out3(np), sc = lerp(0.05, 1, e);
      c.save();
      c.translate(VCX + 10, VCY - 10); c.rotate((1 - e) * TAU * 2 - 0.05); c.scale(sc, sc);
      c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 40; c.shadowOffsetY = 20;
      c.drawImage(news, -320, -190);
      c.restore();
      const ca = E.out3(prog(NEWS + 1.1, NEWS + 1.7, lt));
      text(c, '报纸头条：“海军新装置边做边学”', VCX, VCY + 250, { f: font(700, 26, F.zh), color: '#eafff9', align: 'center', sp: 3, alpha: ca });
      text(c, '人们相信，会走路、会说话、有意识的机器指日可待', VCX, VCY + 292, { f: font(400, 19, F.zh), color: 'rgba(200,255,240,0.75)', align: 'center', sp: 2, alpha: E.out3(prog(NEWS + 1.5, NEWS + 2.1, lt)) });
    }
  }
  return { prep, audio, draw };
})();

/* ========================================================= 1966 ELIZA */
VIS.y1966 = (() => {
  const G = [110, 255, 160];
  const BX = VCX - 420, BY = VCY - 322, BW = 840, BH = 600;
  const SX = VCX - 365, SY = VCY - 272, SW = 730, SH = 480;
  // from Weizenbaum's 1966 paper
  const LINES = [
    { s: 'HOW DO YOU DO.  PLEASE TELL ME', cps: 48, who: 'e', zh: 'ELIZA：你好。请告诉我你的问题。' },
    { s: 'YOUR PROBLEM.', cps: 48, who: 'e', cont: true },
    { s: '> men are all alike.', cps: 20, who: 'u', gap: 0.45, zh: '用户：男人都一个样。' },
    { s: 'IN WHAT WAY?', cps: 40, who: 'e', gap: 0.4, zh: 'ELIZA：哪方面？' },
    { s: '> they\'re always bugging us about', cps: 24, who: 'u', gap: 0.45, zh: '用户：他们总拿各种事情烦我们。' },
    { s: '  something or other.', cps: 24, who: 'u', cont: true },
    { s: 'CAN YOU THINK OF A SPECIFIC EXAMPLE?', cps: 46, who: 'e', gap: 0.4, zh: 'ELIZA：你能举个具体的例子吗？' },
  ];
  let tc = 0.5;
  for (const L of LINES) { tc += L.cont ? 0.02 : L.gap || 0; L.times = typeTimes(L.s, tc, L.cps, L.s.length); tc = L.times.end; }
  const DIVE = 8.4;
  let scan = null;
  function prep() {
    scan = makeCanvas(SW, SH);
    const g = scan.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = 0; y < SH; y += 3) g.fillRect(0, y, SW, 1);
    const vg = g.createRadialGradient(SW / 2, SH / 2, SH * 0.3, SW / 2, SH / 2, SW * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = vg; g.fillRect(0, 0, SW, SH);
  }
  function audio(t0) {
    for (const L of LINES) sfxTyping(L.times.map(x => x + t0), L.s, L.who === 'u' ? 'key' : 'tele', 0.045, L.who === 'u' ? 1 : 0.7);
  }
  function cam(lt) {
    // dive into the screen at the end
    const d = E.in3(prog(DIVE, 10.4, lt));
    return { z: 1 + 1.6 * d, y: 0, push: 0.04 };
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    c.globalAlpha = inP;
    let g = c.createLinearGradient(0, BY, 0, BY + BH);
    g.addColorStop(0, '#3b3d39'); g.addColorStop(1, '#1a1b19');
    c.fillStyle = '#121311';
    c.beginPath(); c.moveTo(VCX - 90, BY + BH - 4); c.lineTo(VCX + 90, BY + BH - 4); c.lineTo(VCX + 160, BY + BH + 44); c.lineTo(VCX - 160, BY + BH + 44); c.closePath(); c.fill();
    c.fillStyle = g; roundRect(c, BX, BY, BW, BH, 40); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
    c.save();
    roundRect(c, SX, SY, SW, SH, 26); c.clip();
    g = c.createRadialGradient(VCX, VCY, 40, VCX, VCY, 520);
    g.addColorStop(0, '#0c2c18'); g.addColorStop(1, '#020904');
    c.fillStyle = g; c.fillRect(SX, SY, SW, SH);
    const on = E.out3(prog(0.12, 0.42, lt));
    c.save();
    c.translate(VCX, SY + SH / 2); c.scale(1, Math.max(0.01, on)); c.translate(-VCX, -(SY + SH / 2));
    c.globalAlpha = inP * (0.93 + 0.07 * vnoise(lt * 18, 5));
    c.font = font(400, 36, F.crt); c.letterSpacing = '1px'; c.textAlign = 'left';
    c.shadowColor = rgba(G, 0.9); c.shadowBlur = 14;
    c.fillStyle = rgba(G, 0.5);
    c.fillText('MIT  ·  PROJECT MAC  ·  IBM 7094', SX + 38, SY + 56);
    let y = SY + 116, lastX = SX + 38, lastY = y;
    LINES.forEach((L, i) => {
      const n = countTyped(L.times, lt);
      if (n > 0) {
        c.fillStyle = L.who === 'u' ? '#dcffe8' : rgba(G, 1);
        const str = L.s.slice(0, n);
        c.fillText(str, SX + 38, y);
        lastX = SX + 38 + c.measureText(str).width; lastY = y;
      }
      y += 44 + ((LINES[i + 1] && LINES[i + 1].who !== L.who) ? 16 : 0);
    });
    if (Math.floor(lt * 2.6) % 2 === 0) { c.fillStyle = rgba(G, 1); c.fillRect(lastX + 6, lastY - 28, 16, 32); }
    c.restore();
    const by = SY + ((lt * 160) % (SH + 200)) - 100;
    g = c.createLinearGradient(0, by - 60, 0, by + 60);
    g.addColorStop(0, 'rgba(120,255,170,0)'); g.addColorStop(0.5, 'rgba(120,255,170,0.06)'); g.addColorStop(1, 'rgba(120,255,170,0)');
    c.fillStyle = g; c.fillRect(SX, by - 60, SW, 120);
    c.drawImage(scan, SX, SY);
    g = c.createLinearGradient(SX, SY, SX + SW * 0.6, SY + SH);
    g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(SX, SY, SW, SH);
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 6; roundRect(c, SX, SY, SW, SH, 26); c.stroke();
    c.fillStyle = rgba(G, 1); c.beginPath(); c.arc(BX + BW - 70, BY + BH - 26, 5, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; glow(c, BX + BW - 70, BY + BH - 26, 18, G, 0.8); c.globalCompositeOperation = 'source-over';
    text(c, 'ELIZA  ·  1966', BX + 60, BY + BH - 20, { f: font(600, 13, F.mono), color: 'rgba(255,255,255,0.35)', sp: 4 });
    c.globalAlpha = 1;
    // Chinese subtitles for the conversation
    let cur = null;
    for (const L of LINES) if (L.zh && lt >= L.times[0] - 0.05) cur = L;
    if (cur) {
      const a = E.out3(prog(cur.times[0] - 0.05, cur.times[0] + 0.25, lt)) * (1 - prog(DIVE, DIVE + 0.4, lt));
      c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 12;
      text(c, cur.zh, VCX, BY + BH + 92, { f: font(700, 26, F.zh), color: cur.who === 'u' ? '#ffffff' : rgba(mixc(G, WHITE, 0.4), 1), align: 'center', sp: 2, alpha: a });
      c.restore();
    }
  }
  return { prep, audio, cam, draw };
})();

/* =================================================== 1969 XOR problem */
VIS.y1969 = (() => {
  const CA = [255, 170, 100], CB = [110, 220, 255], RED = [255, 90, 90];
  const PX = 1000, PY = 262, PWD = 560, PHT = 480;
  const PTS = (() => {
    const r = rng(69), out = [];
    [[0.22, 0.22, 0], [0.78, 0.78, 0], [0.22, 0.78, 1], [0.78, 0.22, 1]].forEach(([cx, cy, cls], k) => {
      for (let i = 0; i < 9; i++) out.push({ x: cx + (r() - 0.5) * 0.2, y: cy + (r() - 0.5) * 0.2, cls, i: out.length, k });
    });
    return out;
  })();
  // attempts: [time, angle, offset]
  const TRY = [[1.4, 0.7, 0.0], [2.0, 2.3, 0.05], [2.6, 0.05, -0.1], [3.2, 1.6, 0.15], [3.8, 0.9, 0.2], [4.4, 2.6, -0.18]];
  const FAIL = 5.0, CRACK = 5.6;
  const sx = x => PX + x * PWD, sy = y => PY + (1 - y) * PHT;
  const CRACKS = (() => {
    const r = rng(1969), out = [], ox = sx(0.5), oy = sy(0.5);
    function br(x, y, a, len, d, t0) {
      const n = 4;
      let px = x, py = y, t = t0;
      for (let k = 0; k < n; k++) {
        a += (r() - 0.5) * 0.7;
        const nx = px + Math.cos(a) * len / n, ny = py + Math.sin(a) * len / n;
        out.push([px, py, nx, ny, t, t + 0.05]);
        px = nx; py = ny; t += 0.05;
        if (d < 2 && r() < 0.35) br(px, py, a + (r() - 0.5) * 2, len * 0.5, d + 1, t);
      }
    }
    for (let i = 0; i < 9; i++) br(ox, oy, (i / 9) * TAU + r() * 0.5, 240 + r() * 200, 0, 0);
    return out;
  })();
  function lineAt(lt) {
    let [ph, off] = [TRY[0][1], TRY[0][2]];
    for (let i = 1; i < TRY.length; i++) {
      const p = E.io3(prog(TRY[i][0] - 0.3, TRY[i][0], lt));
      if (p > 0) { ph = lerp(TRY[i - 1][1], TRY[i][1], p); off = lerp(TRY[i - 1][2], TRY[i][2], p); }
    }
    return [ph, off];
  }
  function audio(t0) {
    TRY.forEach(([tt]) => sfx(t0 + tt, 'error', { v: 0.5 }));
    sfx(t0 + FAIL, 'error'); sfx(t0 + CRACK, 'crack');
  }
  function draw(c, lt) {
    const pa = E.out3(prog(0, 0.5, lt));
    const shake = lt > CRACK ? Math.exp(-(lt - CRACK) * 6) * 6 : 0;
    c.save(); c.translate(shake * vnoise(lt * 50, 1), shake * vnoise(lt * 50, 2));
    c.globalAlpha = pa;
    c.fillStyle = 'rgba(8,16,26,0.8)'; c.strokeStyle = rgba(CB, 0.3); c.lineWidth = 1.5;
    roundRect(c, PX - 40, PY - 72, PWD + 80, PHT + 112, 18); c.fill(); c.stroke();
    biLabel(c, '异或问题', 'THE XOR PROBLEM', PX - 10, PY - 30, { col: rgba(CB, 1), align: 'left', zs: 18, es: 13 });
    c.strokeStyle = 'rgba(160,210,255,0.3)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(PX, PY + PHT); c.lineTo(PX + PWD, PY + PHT); c.moveTo(PX, PY); c.lineTo(PX, PY + PHT); c.stroke();
    text(c, 'x₁', PX + PWD + 14, PY + PHT + 6, { f: font(400, 22, F.serif, true), color: '#dfeeff' });
    text(c, 'x₂', PX - 6, PY - 8, { f: font(400, 22, F.serif, true), color: '#dfeeff', align: 'right' });
    // the line keeps trying
    const la = E.out3(prog(1.0, 1.4, lt));
    const [phi, off] = lineAt(lt), nx = Math.cos(phi), ny = Math.sin(phi);
    const cx = 0.5 + nx * off, cy = 0.5 + ny * off;
    const Pp = (u, v) => [sx(cx - ny * u + nx * v), sy(cy + nx * u + ny * v)];
    const failK = prog(FAIL, FAIL + 0.3, lt);
    c.save(); c.beginPath(); c.rect(PX, PY, PWD, PHT); c.clip();
    c.globalAlpha = pa * la;
    c.strokeStyle = rgba(mixc(WHITE, RED, failK), 0.95); c.lineWidth = 2.5;
    c.shadowColor = rgba(mixc([160, 220, 255], RED, failK), 0.9); c.shadowBlur = 16;
    c.beginPath(); c.moveTo(...Pp(-3, 0)); c.lineTo(...Pp(3, 0)); c.stroke();
    c.restore();
    let errA = 0;
    for (const p of PTS) if ((Math.cos(phi) * (p.x - cx) + Math.sin(phi) * (p.y - cy) > 0) !== (p.cls === 0)) errA++;
    const errors = Math.min(errA, PTS.length - errA);
    for (const p of PTS) {
      const ap = clamp(E.outBack(prog(0.3 + p.i * 0.02, 0.6 + p.i * 0.02, lt)), 0, 1.3);
      if (ap <= 0) continue;
      const x = sx(p.x), y = sy(p.y), r = 8 * ap;
      c.fillStyle = rgba(p.cls ? CB : CA, 1); c.beginPath();
      if (p.cls === 0) c.arc(x, y, r, 0, TAU);
      else { c.moveTo(x, y - r * 1.3); c.lineTo(x + r * 1.3, y); c.lineTo(x, y + r * 1.3); c.lineTo(x - r * 1.3, y); c.closePath(); }
      c.fill();
    }
    if (la > 0) text(c, `错误 ERRORS ${String(errors).padStart(2, '0')}  ·  第 ${TRY.filter(([tt]) => lt >= tt).length} 次尝试`, PX + PWD + 10, PY - 30,
      { f: font(600, 15, F.mono), color: 'rgb(255,150,140)', align: 'right', sp: 1, alpha: la });
    // truth table
    const ta = E.out3(prog(0.6, 1.1, lt));
    const TX = PX + PWD + 70, TY = PY + 40;
    text(c, 'x₁  x₂  →  y', TX, TY, { f: font(600, 18, F.mono), color: '#dfeeff', alpha: ta });
    [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]].forEach(([a, b, y], i) => {
      text(c, `${a}   ${b}   →  ${y}`, TX + 4, TY + 38 + i * 32, { f: font(500, 18, F.mono), color: rgba(y ? CB : CA, 1), alpha: ta });
    });
    text(c, '相同为 0，不同为 1', TX, TY + 188, { f: font(400, 16, F.zh), color: 'rgba(210,230,255,0.7)', alpha: ta });
    // the verdict
    const fa = E.out3(prog(FAIL, FAIL + 0.4, lt));
    if (fa > 0) {
      c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 16;
      text(c, '没有一条直线能把它们分开', VCX - 60, PY + PHT + 88, { f: font(700, 30, F.zh), color: 'rgb(255,170,160)', align: 'center', sp: 4, alpha: fa });
      text(c, 'NO STRAIGHT LINE CAN SEPARATE THEM  ·  MINSKY & PAPERT, “PERCEPTRONS”', VCX - 60, PY + PHT + 122, { f: font(600, 13, F.mono), color: 'rgba(255,190,180,0.8)', align: 'center', sp: 2, alpha: fa });
      c.restore();
    }
    // the glass cracks
    if (lt > CRACK) {
      const u = lt - CRACK;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = 'rgba(220,240,255,0.85)'; c.lineWidth = 1.6; c.beginPath();
      for (const s of CRACKS) {
        if (s[4] >= u) continue;
        const p = clamp((u - s[4]) / (s[5] - s[4]));
        c.moveTo(s[0], s[1]); c.lineTo(lerp(s[0], s[2], p), lerp(s[1], s[3], p));
      }
      c.stroke();
      glow(c, sx(0.5), sy(0.5), 120, [200, 230, 255], Math.exp(-u * 4));
      c.restore();
    }
    c.restore();
  }
  return { audio, draw };
})();

/* ================================================= 1974 First AI winter */
VIS.y1974 = (() => {
  const ICE = [215, 232, 255];
  const QX = 950, QY = 250, QW = 820, QH = 520;
  const QUOTE = '“In no part of the field have the discoveries made so far produced the major impact that was then promised.”';
  const ZHQ = '“迄今为止，这个领域里没有任何一项发现产生了当初所承诺的重大影响。”';
  let qLines = [], zLines = [], edgeFrost = [], panelFrost = [];
  function genFrost(seeds, seed, depthMax) {
    const r = rng(seed), segs = [];
    function branch(x, y, ang, len, depth, t0) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      segs.push([x, y, x2, y2, t0, t0 + 0.12 + len / 900, depth]);
      if (depth >= depthMax) return;
      const kids = 2 + (r() < 0.4 ? 1 : 0);
      for (let i = 0; i < kids; i++) {
        const f = 0.35 + r() * 0.55, bx = lerp(x, x2, f), by = lerp(y, y2, f), side = i % 2 ? 1 : -1;
        branch(bx, by, ang + side * (0.55 + r() * 0.45), len * (0.42 + r() * 0.2), depth + 1, t0 + f * 0.18);
      }
      branch(x2, y2, ang + (r() - 0.5) * 0.5, len * 0.72, depth + 1, t0 + 0.18);
    }
    for (const [x, y, a, len, t0] of seeds) branch(x, y, a, len, 0, t0);
    return segs;
  }
  function prep() {
    lctx.font = font(400, 34, F.serif, true); lctx.letterSpacing = '0px';
    qLines = wrapLines(lctx, QUOTE, QW - 110);
    lctx.font = font(400, 25, F.zhs); lctx.letterSpacing = '1px';
    zLines = wrapZh(lctx, ZHQ, QW - 110);
    const r = rng(1974), seeds = [];
    for (let i = 0; i < 52; i++) {
      const e = i % 4, u = r();
      const [x, y, a] = e === 0 ? [u * W, -5, Math.PI / 2] : e === 1 ? [u * W, H + 5, -Math.PI / 2] : e === 2 ? [-5, u * H, 0] : [W + 5, u * H, Math.PI];
      if ((e === 1 && x < 1000) || (e === 2 && y > 230 && y < 1000)) continue;
      seeds.push([x, y, a + (r() - 0.5) * 1.1, 45 + r() * 80, r() * 0.6]);
    }
    edgeFrost = genFrost(seeds, 11, 3);
    const ps = [[QX, QY, 0.78], [QX + QW, QY, 2.36], [QX, QY + QH, -0.78], [QX + QW, QY + QH, -2.36]]
      .flatMap(([x, y, a], k) => [[x, y, a - 0.25, 34, k * 0.05], [x, y, a + 0.3, 28, 0.1 + k * 0.05]]);
    panelFrost = genFrost(ps, 12, 3);
  }
  function drawFrost(c, segs, g, alpha) {
    const NB = 4;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let d = 0; d < NB; d++) {
      c.strokeStyle = rgba([190, 220, 255], alpha * (0.5 - d * 0.09)); c.lineWidth = 1.6 - d * 0.3;
      c.beginPath();
      for (const s of segs) {
        if (s[6] !== d || s[4] >= g) continue;
        const p = clamp((g - s[4]) / (s[5] - s[4]));
        c.moveTo(s[0], s[1]); c.lineTo(lerp(s[0], s[2], p), lerp(s[1], s[3], p));
      }
      c.stroke();
    }
    c.restore();
  }
  function audio(t0) {
    for (let i = 0; i < 12; i++) sfx(t0 + 1.2 + i * 0.66 + hash(i, 74) * 0.3, 'ice', { v: 0.4 + 0.6 * hash(i, 75) });
  }
  function draw(c, lt) {
    const fade = E.out2(prog(0, 1.0, lt));
    drawFrost(c, edgeFrost, 1.1 * E.out2(prog(0.2, 9.0, lt)), 0.75 * fade);
    const pa = E.out3(prog(0.1, 0.8, lt));
    c.globalAlpha = pa;
    const g = c.createLinearGradient(QX, QY, QX + QW, QY + QH);
    g.addColorStop(0, 'rgba(200,225,255,0.13)'); g.addColorStop(1, 'rgba(160,195,255,0.04)');
    c.fillStyle = g; roundRect(c, QX, QY, QW, QH, 18); c.fill();
    c.strokeStyle = 'rgba(215,232,255,0.3)'; c.lineWidth = 1.5; c.stroke();
    c.globalAlpha = 1;
    drawFrost(c, panelFrost, 0.9 * E.out2(prog(2.4, 9.5, lt)), 0.9 * pa);
    biLabel(c, '莱特希尔报告 · 英国 · 1973', 'THE LIGHTHILL REPORT', QX + 55, QY + 58, { col: rgba(ICE, 0.9), align: 'left', zs: 16, es: 12, alpha: pa });
    c.font = font(400, 34, F.serif, true); c.letterSpacing = '0px'; c.fillStyle = '#eef5ff'; c.textAlign = 'left';
    c.shadowColor = 'rgba(160,200,255,0.6)'; c.shadowBlur = 12;
    drawWords(c, qLines, QX + 55, QY + 122, 48, 0.55, lt, { stagger: 0.09, dur: 0.7, rise: 10 });
    c.font = font(400, 25, F.zhs); c.letterSpacing = '1px'; c.fillStyle = '#dce9ff';
    drawTokens(c, zLines, QX + 55, QY + 122 + qLines.length * 48 + 34, 42, 2.4, lt, { stagger: 0.03, dur: 0.6 });
    c.shadowBlur = 0;
    text(c, '— 詹姆斯·莱特希尔爵士  SIR JAMES LIGHTHILL', QX + 55, QY + QH - 40, { f: font(600, 15, F.mono), color: rgba(ICE, 1), sp: 2, alpha: 0.75 * E.out3(prog(3.8, 4.4, lt)) });
    // funding meter freezing
    const fa = E.out3(prog(5.2, 5.8, lt));
    if (fa > 0) {
      const fx = QX + QW - 250, fy = QY + 40, v = lerp(1, 0.18, E.io3(prog(5.6, 7.4, lt)));
      text(c, '研究经费 FUNDING', fx, fy + 18, { f: font(700, 14, F.mono), color: rgba(ICE, 0.8), sp: 2, alpha: fa });
      c.globalAlpha = fa;
      c.fillStyle = 'rgba(200,225,255,0.12)'; c.fillRect(fx, fy + 30, 190, 10);
      c.fillStyle = rgba(mixc([255, 140, 120], ICE, 1 - v), 1); c.fillRect(fx, fy + 30, 190 * v, 10);
      c.globalAlpha = 1;
      text(c, `▼ ${Math.round((1 - v) * 100)}%`, fx + 190, fy + 18, { f: font(700, 14, F.mono), color: 'rgb(255,160,150)', align: 'right', alpha: fa });
    }
    c.globalCompositeOperation = 'lighter';
    const gust = 1 + 1.5 * Math.max(0, Math.sin(lt * 0.9 - 1));
    for (let i = 0; i < 52; i++) {
      const sp = (50 + 110 * hash(i, 41)) * gust, r = 5 + 17 * hash(i, 42);
      const y = ((hash(i, 43) * (H + 120) + lt * sp) % (H + 120)) - 60;
      const x = (hash(i, 44) * W + Math.sin(lt * 0.8 + i) * 30 - lt * 40 * gust + W * 4) % W;
      glow(c, x, y, r, ICE, fade * (0.2 + 0.35 * hash(i, 45)), false);
    }
    c.globalCompositeOperation = 'source-over';
  }
  return { prep, audio, draw };
})();

/* ================================================== 1980 Expert systems */
VIS.y1980 = (() => {
  const AMB = [255, 176, 80], HOTC = [255, 230, 170];
  const WORDS = ['IF', 'THEN', 'AND', 'OR', '→', 'RULE', '(cpu 780)', '(disk RA81)', 'cabinet', 'bus', 'power', '(mem 8MB)', 'NOT', 'ASSERT', 'unibus', 'slot'];
  const FACTS = [['处理器 CPU', 'VAX-11/780', 1010], ['内存 MEMORY', '8 MB', 1360], ['磁盘 DISKS', '× 4', 1710]];
  const RULES = [
    ['IF 磁盘 > 2', 'THEN 加扩展机柜', 1060, 1.2, [2]],
    ['IF 内存 > 4 MB', 'THEN 加内存板', 1360, 1.8, [0, 1]],
    ['IF 加了机柜', 'THEN 加电源', 1660, 2.4, [0, 2]],
  ];
  const DONE = 3.2, MONEY = 4.6;
  function audio(t0) {
    RULES.forEach(r => sfx(t0 + r[3], 'blip', { f: 660, v: 0.7 }));
    sfx(t0 + DONE, 'chime');
    for (let i = 0; i < 10; i++) sfx(t0 + MONEY + i * 0.1, 'coin', { v: 0.4 + i * 0.05 });
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.6, lt));
    // rule rain
    c.save();
    c.font = font(500, 14, F.mono); c.letterSpacing = '0px'; c.textAlign = 'left';
    for (let col = 0; col < 22; col++) {
      const x = 910 + col * 42, sp = 40 + 60 * hash(col, 3), off = hash(col, 4) * 900;
      for (let k = 0; k < 42; k++) {
        const y = ((k * 24 + lt * sp + off) % 1008) + 100;
        const head = ((lt * sp + off) % 1008) / 24;
        const a = 0.05 + 0.12 * hash(col * 50 + k, 9);
        c.fillStyle = rgba(AMB, a * inP);
        c.fillText(WORDS[(col * 7 + k * 3) % WORDS.length], x, y);
        void head;
      }
    }
    c.restore();
    const cardAt = (x, y, w, h, lit, a, label1, label2) => {
      c.save(); c.globalAlpha = a;
      c.fillStyle = rgba(mixc([30, 16, 6], [90, 50, 10], lit), 0.92); c.strokeStyle = rgba(mixc(AMB, HOTC, lit), 0.5 + 0.5 * lit); c.lineWidth = 2;
      roundRect(c, x - w / 2, y - h / 2, w, h, 10); c.fill(); c.stroke();
      if (lit > 0.01) { c.globalCompositeOperation = 'lighter'; glow(c, x, y, w * 0.7, AMB, 0.35 * lit, false); c.globalCompositeOperation = 'source-over'; }
      text(c, label1, x, y - 6, { f: font(700, 18, F.mono), color: rgba(mixc(AMB, WHITE, 0.3 + 0.5 * lit), 1), align: 'center' });
      text(c, label2, x, y + 20, { f: font(700, 17, F.zh), color: rgba(mixc(AMB, WHITE, 0.2 + 0.6 * lit), 1), align: 'center', sp: 1 });
      c.restore();
    };
    biLabel(c, 'XCON 专家系统 · DEC 公司', 'EXPERT SYSTEM', VCX, 196, { col: rgba(AMB, 1), alpha: inP });
    // facts -> rules -> conclusion, forward chaining
    const fy = 290, ry = 480, cy = 680;
    FACTS.forEach(([a, b, x], i) => cardAt(x, fy, 270, 70, 0.2, inP * E.out3(prog(0.2 + i * 0.12, 0.6 + i * 0.12, lt)), b, a));
    c.lineCap = 'round';
    RULES.forEach(([l1, l2, x, t, from]) => {
      for (const f of from) {
        const fx = FACTS[f][2], p = E.out3(prog(t - 0.5, t - 0.1, lt));
        if (p <= 0) continue;
        c.strokeStyle = rgba(AMB, 0.45); c.lineWidth = 2;
        c.beginPath(); c.moveTo(fx, fy + 35); c.lineTo(lerp(fx, x, p), lerp(fy + 35, ry - 38, p)); c.stroke();
        const q = prog(t - 0.35, t, lt);
        if (q > 0 && q < 1) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, lerp(fx, x, q), lerp(fy + 35, ry - 38, q), 22, HOTC, 1); c.restore(); }
      }
      const lit = lt > t ? Math.max(0.35, Math.exp(-(lt - t) * 3)) : 0;
      cardAt(x, ry, 280, 76, lit, inP * E.out3(prog(t - 0.4, t, lt)), l1, l2);
      const p = E.out3(prog(t + 0.1, DONE, lt));
      if (p > 0) {
        c.strokeStyle = rgba(AMB, 0.45); c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, ry + 38); c.lineTo(lerp(x, VCX, p), lerp(ry + 38, cy - 40, p)); c.stroke();
      }
    });
    const dk = E.outBack(prog(DONE, DONE + 0.45, lt));
    if (dk > 0) {
      c.save(); c.translate(VCX, cy); c.scale(clamp(dk, 0, 1.15), clamp(dk, 0, 1.15));
      c.fillStyle = 'rgba(40,22,6,0.95)'; c.strokeStyle = rgba(HOTC, 0.9); c.lineWidth = 2.5;
      roundRect(c, -300, -42, 600, 84, 14); c.fill(); c.stroke();
      text(c, '✓ 订单配置完成', 0, -4, { f: font(700, 26, F.zh), color: '#fff3dc', align: 'center', sp: 3 });
      text(c, 'ORDER CONFIGURED  ·  3 CABINETS  ·  2 POWER SUPPLIES', 0, 26, { f: font(600, 13, F.mono), color: rgba(AMB, 1), align: 'center', sp: 2 });
      c.restore();
    }
    // the money pours in
    const ma = E.out3(prog(MONEY, MONEY + 0.5, lt));
    if (ma > 0) {
      const v = Math.round(1e9 * E.out3(prog(MONEY, MONEY + 1.4, lt)));
      c.save(); c.shadowColor = rgba(AMB, 0.9); c.shadowBlur = 24;
      text(c, '$' + v.toLocaleString('en-US') + '+', VCX, 830, { f: font(700, 52, F.sans), color: '#fff1d6', align: 'center', alpha: ma });
      c.restore();
      text(c, '1985 年，全球企业每年在 AI 上的投入超过 10 亿美元', VCX, 874, { f: font(700, 18, F.zh), color: rgba(AMB, 1), align: 'center', sp: 2, alpha: ma });
    }
  }
  return { audio, draw };
})();

/* ======================================== 1986 Backprop (synthwave) */
VIS.y1986 = (() => {
  const HZ = 740, PINK = [255, 60, 200], CYAN = [60, 220, 255], RED = [255, 110, 90], GREEN = [120, 255, 170];
  const LAYERS = [3, 5, 4, 2], LX = [1075, 1275, 1475, 1665], LY = 342, GAP = 70;
  const nodePos = (l, i) => [LX[l], LY + (i - (LAYERS[l] - 1) / 2) * GAP];
  const EDGES = [];
  { const r = rng(86); for (let l = 0; l < 3; l++) for (let i = 0; i < LAYERS[l]; i++) for (let j = 0; j < LAYERS[l + 1]; j++) EDGES.push([l, i, j, r() * 2 - 1, r() * 2 - 1]); }
  const FWD1 = 1.0, BWD = 2.6, FWD2 = 4.2, STEP = 0.4;
  const RULES = '专家系统 EXPERT SYSTEMS   ▸   IF fever AND rash THEN measles (0.7)   ▸   IF oil_pressure < 20 THEN stop_engine   ▸   IF loan_risk = HIGH THEN refer_to_manager   ▸   IF spectrum HAS peak_43 THEN ketone   ▸   ';
  const CRASH = '▼ 1987 · LISP 机器市场崩盘  ·  专家系统泡沫破裂  ·  LISP MACHINE MARKET COLLAPSES   ▼   ';
  const LOCAL_CRT = CRT_T0 - ST('y1986');
  let sun = null, rulesW = 0, crashW = 0;
  function prep() {
    const S = 420;
    sun = makeCanvas(S, S);
    const g = sun.getContext('2d'), gr = g.createLinearGradient(0, 20, 0, S - 20);
    gr.addColorStop(0, '#ffe985'); gr.addColorStop(0.45, '#ff8a4c'); gr.addColorStop(1, '#ff2d95');
    g.fillStyle = gr; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 10, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 8; k++) g.fillRect(0, S / 2 + 12 + k * 24, S, 2 + k * 2.3);
    lctx.font = font(500, 15, F.mono); lctx.letterSpacing = '1px';
    rulesW = lctx.measureText(RULES).width; crashW = lctx.measureText(CRASH).width;
  }
  function audio(t0) {
    for (let s = 0; s < 3; s++) {
      sfx(t0 + FWD1 + s * STEP, 'blip', { f: 520 * Math.pow(1.26, s) });
      sfx(t0 + BWD + s * STEP, 'blip', { f: 760 / Math.pow(1.26, s), v: 0.8 });
      sfx(t0 + FWD2 + s * STEP, 'blip', { f: 520 * Math.pow(1.26, s) });
    }
    sfx(t0 + FWD1 + 3 * STEP, 'error');
    sfx(t0 + FWD2 + 3 * STEP + 0.05, 'chime');
    sfx(t0 + LOCAL_CRT - 1.4, 'alarm');
    sfx(CRT_T0, 'powerdown');
  }
  function draw(c, lt) {
    let fl = 1;
    if (lt > LOCAL_CRT - 1.0) { fl = hash(Math.floor(lt * 24), 99) > 0.42 ? 1 : 0.3; if (lt > LOCAL_CRT - 0.3) fl *= 0.85; }
    const crash = prog(LOCAL_CRT - 1.5, LOCAL_CRT - 1.3, lt);
    c.globalAlpha = fl;
    let g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, 'rgba(20,0,40,0)'); g.addColorStop(0.6, 'rgba(90,10,110,0.22)'); g.addColorStop(1, 'rgba(255,60,170,0.34)');
    c.fillStyle = g; c.fillRect(0, 0, W, HZ);
    const rise = E.out3(prog(0, 1.6, lt));
    c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip();
    c.globalCompositeOperation = 'lighter';
    glow(c, VCX, HZ - 130, 460, [255, 80, 160], 0.4 * rise * fl, false);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(sun, VCX - 210, HZ - 215 + (1 - rise) * 170 + 60 * E.in2(prog(LOCAL_CRT - 1.4, LOCAL_CRT, lt)));
    c.restore();
    c.fillStyle = 'rgba(12,0,24,0.92)'; c.fillRect(0, HZ, W, H - HZ);
    c.save(); c.beginPath(); c.rect(0, HZ, W, H - HZ); c.clip();
    const f = 760, hc = 0.5, phase = (lt * 1.8) % 1;
    c.beginPath();
    for (let X = -14; X <= 14.01; X += 0.4) { c.moveTo(VCX + (X * f) / 60, HZ + (hc * f) / 60); c.lineTo(VCX + (X * f) / 0.8, HZ + (hc * f) / 0.8); }
    for (let k = 0; k < 44; k++) { const Z = 0.8 + k - phase; if (Z <= 0.35) continue; const y = HZ + (hc * f) / Z; if (y > H + 2) continue; c.moveTo(0, y); c.lineTo(W, y); }
    c.strokeStyle = rgba(PINK, 0.18); c.lineWidth = 6; c.stroke();
    c.strokeStyle = rgba([255, 120, 230], 0.8); c.lineWidth = 1.6; c.stroke();
    g = c.createLinearGradient(0, HZ, 0, HZ + 150);
    g.addColorStop(0, 'rgba(34,2,52,1)'); g.addColorStop(1, 'rgba(34,2,52,0)');
    c.fillStyle = g; c.fillRect(0, HZ, W, 150);
    c.restore();
    c.strokeStyle = rgba([255, 140, 235], 0.95); c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, HZ); c.lineTo(W, HZ); c.stroke();
    c.strokeStyle = rgba(PINK, 0.25); c.lineWidth = 10; c.stroke();
    // keep the chapter text readable over the neon floor
    g = c.createLinearGradient(0, 0, 1050, 0);
    g.addColorStop(0, 'rgba(8,0,18,0.85)'); g.addColorStop(0.75, 'rgba(8,0,18,0.5)'); g.addColorStop(1, 'rgba(8,0,18,0)');
    c.fillStyle = g; c.fillRect(0, 540, 1050, 346);
    // expert-system rule ticker (it crashes at the end)
    c.fillStyle = crash > 0.5 ? 'rgba(40,0,6,0.85)' : 'rgba(8,0,18,0.75)'; c.fillRect(0, 886, W, 34);
    c.strokeStyle = rgba(crash > 0.5 ? RED : PINK, 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 886); c.lineTo(W, 886); c.moveTo(0, 920); c.lineTo(W, 920); c.stroke();
    c.font = font(500, 15, F.mono); c.letterSpacing = '1px'; c.textAlign = 'left';
    if (crash < 0.5) {
      c.fillStyle = rgba([255, 170, 235], 0.9);
      for (let x = -((lt * 120) % rulesW); x < W; x += rulesW) c.fillText(RULES, x, 909);
    } else {
      c.fillStyle = rgba([255, 130, 120], 1);
      for (let x = -((lt * 260) % crashW); x < W; x += crashW) c.fillText(CRASH, x, 909);
    }

    const na = E.out3(prog(0.2, 0.7, lt)), wmix = E.io3(prog(BWD + 0.2, BWD + 1.4, lt));
    c.lineCap = 'round';
    for (const [l, i, j, w0, w1] of EDGES) {
      const w = lerp(w0, w1, wmix), [x1, y1] = nodePos(l, i), [x2, y2] = nodePos(l + 1, j);
      c.strokeStyle = rgba(w > 0 ? CYAN : PINK, (0.16 + 0.42 * Math.abs(w)) * na);
      c.lineWidth = 0.6 + 2.8 * Math.abs(w);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    c.globalCompositeOperation = 'lighter';
    const pulse = (start, dir, col) => {
      for (let s = 0; s < 3; s++) {
        const l = dir > 0 ? s : 2 - s, p = prog(start + s * STEP, start + (s + 1) * STEP, lt);
        if (p <= 0 || p >= 1) continue;
        for (const [el, i, j] of EDGES) {
          if (el !== l) continue;
          const [x1, y1] = nodePos(l, i), [x2, y2] = nodePos(l + 1, j), q = dir > 0 ? p : 1 - p;
          glow(c, lerp(x1, x2, q), lerp(y1, y2, q), 15, col, 0.9);
        }
      }
    };
    pulse(FWD1, 1, CYAN); pulse(BWD, -1, RED); pulse(FWD2, 1, CYAN);
    c.globalCompositeOperation = 'source-over';
    const errT = FWD1 + 3 * STEP, okT = FWD2 + 3 * STEP;
    for (let l = 0; l < 4; l++) for (let i = 0; i < LAYERS[l]; i++) {
      const [x, y] = nodePos(l, i);
      let lit = 0, col = CYAN;
      for (const st of [FWD1, FWD2]) { const reach = st + l * STEP; if (lt >= reach) lit = Math.max(lit, Math.exp(-(lt - reach) * 4)); }
      const rb = BWD + (3 - l) * STEP;
      if (lt >= rb && Math.exp(-(lt - rb) * 4) > lit) { lit = Math.exp(-(lt - rb) * 4); col = RED; }
      let ring = CYAN;
      if (l === 3 && lt >= errT && lt < FWD2 + 3 * STEP) ring = RED;
      if (l === 3 && lt >= okT) ring = GREEN;
      const ap = clamp(E.outBack(prog(0.1 + l * 0.08, 0.5 + l * 0.08, lt)), 0, 1.2);
      c.fillStyle = 'rgb(14,4,28)'; c.strokeStyle = rgba(ring, 1); c.lineWidth = 2.5;
      c.beginPath(); c.arc(x, y, 15 * ap, 0, TAU); c.fill(); c.stroke();
      c.globalCompositeOperation = 'lighter';
      glow(c, x, y, 40, ring === CYAN ? col : ring, 0.25 * na + lit * 0.9);
      c.globalCompositeOperation = 'source-over';
    }
    const lab = (zh, en, a, b, col) => { const k = prog(a, a + 0.25, lt) * (1 - prog(b - 0.2, b, lt)); if (k > 0) biLabel(c, zh, en, 1370, 172, { col: rgba(col, 1), alpha: k * na, zs: 20, es: 14 }); };
    lab('前向传播 →', 'FORWARD PASS', 0.6, 2.5, CYAN);
    lab('← 反向传播 · 调整权重', 'BACKPROPAGATION', 2.5, 4.1, RED);
    lab('再次前向传播 →', 'FORWARD PASS', 4.1, 5.4, CYAN);
    lab('学会了 ✓', 'LEARNED', 5.4, LOCAL_CRT - 1.5, GREEN);
    if (lt >= errT && lt < okT) text(c, '误差 0.83', 1700, LY + 6, { f: font(700, 16, F.mono), color: rgba(RED, 1), sp: 1, alpha: prog(errT, errT + 0.2, lt) });
    if (lt >= okT) text(c, '误差 0.02', 1700, LY + 6, { f: font(700, 16, F.mono), color: rgba(GREEN, 1), sp: 1, alpha: prog(okT, okT + 0.2, lt) });
    c.globalAlpha = 1;
  }
  return { prep, audio, draw };
})();

/* ================================================ 1989 LeNet reads digits */
VIS.y1989 = (() => {
  const C = [120, 215, 255], INK = [30, 45, 110], OK = [120, 255, 170];
  const ZIP = '07733', DEMO = 1;
  // hand-drawn digit strokes in a unit box
  const STROKES = {
    0: [[[0.5, 0.06], [0.2, 0.2], [0.14, 0.55], [0.3, 0.9], [0.62, 0.93], [0.84, 0.62], [0.8, 0.22], [0.52, 0.05]]],
    7: [[[0.14, 0.12], [0.5, 0.1], [0.86, 0.1], [0.62, 0.45], [0.42, 0.93]]],
    3: [[[0.2, 0.16], [0.5, 0.04], [0.8, 0.18], [0.72, 0.42], [0.44, 0.5], [0.78, 0.58], [0.84, 0.8], [0.55, 0.95], [0.2, 0.84]]],
  };
  const STRIP = { x: VCX - 300, y: 176, w: 600, h: 120 };
  const WRITE0 = 0.6, WRITE_D = 0.32, LIFT = 2.4, SCAN0 = 3.1, SCAN1 = 5.4, FWD = 5.5, READ0 = 6.7;
  const GRID = { x: 945, y: 430, n: 16, cs: 14 };
  let input = [], maps1 = [], maps2 = [], out = [];
  const KERN = [
    [[-1, -1, -1, -1, -1], [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [-1, -1, -1, -1, -1]],
    [[-1, 0, 1, 0, -1], [-1, 0, 1, 0, -1], [-1, 0, 1, 0, -1], [-1, 0, 1, 0, -1], [-1, 0, 1, 0, -1]],
    [[1, 0, -1, -1, -1], [0, 1, 0, -1, -1], [-1, 0, 1, 0, -1], [-1, -1, 0, 1, 0], [-1, -1, -1, 0, 1]],
    [[-1, -1, -1, 0, 1], [-1, -1, 0, 1, 0], [-1, 0, 1, 0, -1], [0, 1, 0, -1, -1], [1, 0, -1, -1, -1]],
  ];
  function strokePath(g, digit, x, y, w, h, jit, seed) {
    const r = rng(seed);
    for (const s of STROKES[digit]) {
      const pts = s.map(([u, v]) => [x + (u + (r() - 0.5) * jit) * w, y + (v + (r() - 0.5) * jit) * h]);
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      g.stroke();
    }
  }
  function prep() {
    const cv = makeCanvas(16, 16), g = cv.getContext('2d');
    g.strokeStyle = '#fff'; g.lineWidth = 2.1; g.lineCap = 'round'; g.lineJoin = 'round';
    strokePath(g, 7, 2, 1.5, 12, 13, 0.05, 1989 + DEMO);
    const d = g.getImageData(0, 0, 16, 16).data;
    input = Array.from({ length: 256 }, (_, i) => d[i * 4 + 3] / 255);
    maps1 = [];
    for (let m = 0; m < 12; m++) {
      const K = KERN[m % 4], sgn = m >= 4 && m < 8 ? -1 : 1, map = [];
      for (let oy = 0; oy < 8; oy++) for (let ox = 0; ox < 8; ox++) {
        let s = 0;
        for (let ky = 0; ky < 5; ky++) for (let kx = 0; kx < 5; kx++) {
          const ix = ox * 2 + kx - 2, iy = oy * 2 + ky - 2;
          if (ix >= 0 && iy >= 0 && ix < 16 && iy < 16) s += K[ky][kx] * input[iy * 16 + ix] * sgn;
        }
        map.push(Math.max(0, s));
      }
      const mx = Math.max(...map) || 1;
      maps1.push(map.map(v => v / mx));
    }
    maps2 = maps1.map(m => {
      const o = [];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) o.push(Math.max(m[(y * 2) * 8 + x * 2], m[(y * 2) * 8 + x * 2 + 1], m[(y * 2 + 1) * 8 + x * 2], m[(y * 2 + 1) * 8 + x * 2 + 1]));
      return o;
    });
    out = [0.01, 0.03, 0.02, 0.06, 0.01, 0.02, 0.01, 0.96, 0.03, 0.05];
  }
  function audio(t0) {
    [...ZIP].forEach((_, i) => sfx(t0 + WRITE0 + i * WRITE_D, 'scribble', { v: 0.7 }));
    sfx(t0 + LIFT, 'whoosh', { dur: 0.6 });
    for (let k = 0; k < 8; k++) sfx(t0 + SCAN0 + k * ((SCAN1 - SCAN0) / 8), 'tick', { v: 0.4 });
    sfx(t0 + FWD + 0.9, 'chime');
    [...ZIP].forEach((_, i) => sfx(t0 + READ0 + i * 0.3, 'dot', { v: 0.6 }));
    sfx(t0 + READ0 + 1.6, 'chime');
  }
  function drawDigits(c, lt) {
    const a = E.out3(prog(0.2, 0.7, lt));
    c.save(); c.globalAlpha = a;
    c.translate(0, (1 - a) * -30);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
    c.fillStyle = '#efe9da'; roundRect(c, STRIP.x, STRIP.y, STRIP.w, STRIP.h, 6); c.fill();
    c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.strokeStyle = 'rgba(180,40,40,0.6)'; c.lineWidth = 1.5; c.setLineDash([10, 6]);
    c.strokeRect(STRIP.x + 8, STRIP.y + 8, STRIP.w - 16, STRIP.h - 16); c.setLineDash([]);
    text(c, 'U.S. MAIL  ·  ZIP', STRIP.x + 18, STRIP.y + 26, { f: font(600, 10, F.mono), color: 'rgba(120,40,40,0.7)', sp: 2 });
    [...ZIP].forEach((d, i) => {
      const p = prog(WRITE0 + i * WRITE_D, WRITE0 + i * WRITE_D + WRITE_D * 0.9, lt);
      if (p <= 0) return;
      const x = STRIP.x + 70 + i * 100, y = STRIP.y + 18, w = 60, h = 86;
      c.save();
      c.strokeStyle = rgba(INK, 0.95); c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
      c.setLineDash([400 * p, 400]);
      strokePath(c, +d, x, y, w, h, 0.05, 1989 + i);
      c.restore();
      const rd = prog(READ0 + i * 0.3, READ0 + i * 0.3 + 0.25, lt);
      if (rd > 0) {
        c.strokeStyle = rgba(OK, rd); c.lineWidth = 3; c.strokeRect(x - 12, y - 6, w + 24, h + 12);
        text(c, d, x + w / 2, STRIP.y + STRIP.h + 34, { f: font(700, 26, F.mono), color: rgba(OK, 1), align: 'center', alpha: rd });
      }
    });
    c.restore();
  }
  function drawGrid(c, lt, a) {
    const { x, y, n, cs } = GRID;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(4,14,24,0.9)'; c.fillRect(x - 6, y - 6, n * cs + 12, n * cs + 12);
    for (let i = 0; i < n * n; i++) {
      const v = input[i], gx = x + (i % n) * cs, gy = y + Math.floor(i / n) * cs;
      c.fillStyle = rgba(mixc([10, 30, 50], [230, 245, 255], v), 1);
      c.fillRect(gx + 0.5, gy + 0.5, cs - 1, cs - 1);
    }
    c.strokeStyle = rgba(C, 0.6); c.lineWidth = 1.5; c.strokeRect(x - 6, y - 6, n * cs + 12, n * cs + 12);
    text(c, '输入 16×16', x + (n * cs) / 2, y + n * cs + 30, { f: font(700, 14, F.mono), color: rgba(C, 0.85), align: 'center', sp: 1 });
    c.restore();
  }
  const slabPos = (layer, k) => layer === 1 ? [1230 + k * 9, 470 - k * 7] : [1440 + k * 7, 505 - k * 5];
  function drawNet(c, lt, a) {
    const sc = prog(SCAN0, SCAN1, lt), done1 = sc >= 1;
    const pos = Math.floor(sc * 64), wx = pos % 8, wy = Math.floor(pos / 8);
    c.save(); c.globalAlpha = a;
    // layer 1: 12 feature maps 8x8, shown as a stack
    for (let k = 11; k >= 0; k--) {
      const [sx, sy] = slabPos(1, k), cs = 16;
      const lit = k === 0 ? 1 : E.out2(prog(FWD, FWD + 0.4, lt));
      c.fillStyle = 'rgba(4,14,24,0.92)'; c.fillRect(sx, sy, 8 * cs, 8 * cs);
      for (let i = 0; i < 64; i++) {
        const shown = k === 0 ? (done1 || i < pos) : lit > 0;
        if (!shown) continue;
        const v = maps1[k][i];
        c.fillStyle = rgba(mixc([10, 40, 70], C, v), (0.3 + 0.7 * v) * (k === 0 ? 1 : lit));
        c.fillRect(sx + (i % 8) * cs + 0.5, sy + Math.floor(i / 8) * cs + 0.5, cs - 1, cs - 1);
      }
      c.strokeStyle = rgba(C, 0.5); c.lineWidth = 1; c.strokeRect(sx, sy, 8 * cs, 8 * cs);
    }
    // the sliding 5x5 kernel and its receptive-field cone
    if (sc > 0 && sc < 1) {
      const { x, y, cs } = GRID, kx = x + (wx * 2 - 2) * cs, ky = y + (wy * 2 - 2) * cs;
      const [sx, sy] = slabPos(1, 0), tx = sx + wx * 16 + 8, ty = sy + wy * 16 + 8;
      c.strokeStyle = rgba([255, 220, 120], 0.95); c.lineWidth = 2.5; c.strokeRect(kx, ky, 5 * cs, 5 * cs);
      c.strokeStyle = rgba([255, 220, 120], 0.35); c.lineWidth = 1;
      c.beginPath();
      for (const [dx, dy] of [[0, 0], [5, 0], [0, 5], [5, 5]]) { c.moveTo(kx + dx * cs, ky + dy * cs); c.lineTo(tx, ty); }
      c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, tx, ty, 30, [255, 220, 120], 0.8); c.restore();
    }
    // layer 2
    const l2 = E.out2(prog(FWD + 0.3, FWD + 0.6, lt));
    for (let k = 11; k >= 0; k--) {
      const [sx, sy] = slabPos(2, k), cs = 14;
      c.fillStyle = 'rgba(4,14,24,0.92)'; c.fillRect(sx, sy, 4 * cs, 4 * cs);
      if (l2 > 0) for (let i = 0; i < 16; i++) {
        const v = maps2[k][i];
        c.fillStyle = rgba(mixc([10, 40, 70], C, v), (0.3 + 0.7 * v) * l2);
        c.fillRect(sx + (i % 4) * cs + 0.5, sy + Math.floor(i / 4) * cs + 0.5, cs - 1, cs - 1);
      }
      c.strokeStyle = rgba(C, 0.5); c.strokeRect(sx, sy, 4 * cs, 4 * cs);
    }
    // hidden units and outputs
    const l3 = E.out2(prog(FWD + 0.55, FWD + 0.8, lt)), l4 = E.out3(prog(FWD + 0.8, FWD + 1.3, lt));
    for (let i = 0; i < 15; i++) {
      c.fillStyle = rgba(mixc([20, 50, 80], C, hash(i, 5)), 0.3 + 0.7 * l3 * hash(i, 5));
      c.beginPath(); c.arc(1590, 380 + i * 22, 6, 0, TAU); c.fill();
    }
    for (let d = 0; d < 10; d++) {
      const y = 370 + d * 34, v = out[d] * l4, top = d === 7;
      text(c, String(d), 1640, y + 7, { f: font(700, 20, F.mono), color: top && l4 > 0.5 ? rgba(OK, 1) : 'rgba(200,225,255,0.6)' });
      c.fillStyle = 'rgba(120,180,255,0.12)'; c.fillRect(1664, y - 6, 140, 12);
      c.fillStyle = rgba(top ? OK : C, 0.9); c.fillRect(1664, y - 6, 140 * v, 12);
    }
    if (l4 > 0) text(c, `识别为 “7” · ${Math.round(96 * l4)}%`, 1720, 730, { f: font(700, 17, F.zh), color: rgba(OK, 1), align: 'center', alpha: l4 });
    text(c, '卷积层 C1  12@8×8', 1300, 690, { f: font(700, 13, F.mono), color: rgba(C, 0.8), align: 'center', alpha: 1 });
    text(c, 'C2  12@4×4', 1470, 690, { f: font(700, 13, F.mono), color: rgba(C, 0.8), align: 'center', alpha: 1 });
    c.restore();
  }
  function draw(c, lt) {
    drawDigits(c, lt);
    // the "7" lifts off the envelope and becomes pixels
    const lp = E.io3(prog(LIFT, LIFT + 0.7, lt));
    const na = E.out3(prog(LIFT + 0.4, LIFT + 0.9, lt)) * (1 - 0.0 * prog(9, 10, lt));
    if (lp > 0 && lp < 1) {
      const x0 = STRIP.x + 70 + DEMO * 100, y0 = STRIP.y + 18, x1 = GRID.x + 28, y1 = GRID.y + 21;
      c.save(); c.globalAlpha = 1 - lp * 0.7;
      c.strokeStyle = rgba(mixc(INK, [230, 245, 255], lp), 1); c.lineWidth = lerp(7, 24, lp); c.lineCap = 'round'; c.lineJoin = 'round';
      const s = lerp(1, 2.8, lp);
      strokePath(c, 7, lerp(x0, x1, lp), lerp(y0, y1, lp), 60 * s, 86 * s * 0.85, 0.05, 1989 + DEMO);
      c.restore();
    }
    if (na > 0) { drawGrid(c, lt, na); drawNet(c, lt, na); }
    biLabel(c, '卷积神经网络 · 贝尔实验室', 'LeNet · CONVOLUTIONAL NETWORK', VCX, 150, { col: rgba(C, 1), alpha: E.out3(prog(0.3, 0.9, lt)) });
    const fa = E.out3(prog(READ0 + 1.6, READ0 + 2.2, lt));
    if (fa > 0) {
      text(c, '✓ 邮编识别完成 ZIP CODE READ', VCX, 800, { f: font(700, 24, F.zh), color: rgba(OK, 1), align: 'center', sp: 2, alpha: fa });
      text(c, '后来，这类系统读取了全美 10% 以上的支票', VCX, 846, { f: font(400, 20, F.zh), color: 'rgba(210,235,255,0.85)', align: 'center', sp: 2, alpha: E.out3(prog(READ0 + 2.0, READ0 + 2.6, lt)) });
    }
  }
  return { prep, audio, draw };
})();

/* ===================================================== 1997 Deep Blue */
VIS.y1997 = (() => {
  const GL = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
  const START = {
    e1: 'wK', d1: 'wQ', a1: 'wR', h1: 'wR', c1: 'wB', d3: 'wB', f3: 'wN', g5: 'wN', a2: 'wP', b2: 'wP', c2: 'wP', d4: 'wP', f2: 'wP', g2: 'wP', h2: 'wP',
    e8: 'bK', d8: 'bQ', a8: 'bR', h8: 'bR', c8: 'bB', f8: 'bB', d7: 'bN', f6: 'bN', a7: 'bP', b7: 'bP', c6: 'bP', e6: 'bP', f7: 'bP', g7: 'bP', h6: 'bP',
  };
  // Deep Blue – Kasparov, game 6, 11 May 1997, from move 8 (position after 7…h6)
  const MOVES = [
    ['8.Nxe6', 'g5', 'e6'], ['Qe7', 'd8', 'e7'], ['9.O-O', 'e1', 'g1', 'h1', 'f1'], ['fxe6', 'f7', 'e6'],
    ['10.Bg6+', 'd3', 'g6'], ['Kd8', 'e8', 'd8'], ['11.Bf4', 'c1', 'f4'], ['b5', 'b7', 'b5'],
    ['12.a4', 'a2', 'a4'], ['Bb7', 'c8', 'b7'], ['13.Re1', 'f1', 'e1'], ['Nd5', 'f6', 'd5'],
    ['14.Bg3', 'f4', 'g3'], ['Kc8', 'd8', 'c8'], ['15.axb5', 'a4', 'b5'], ['cxb5', 'c6', 'b5'],
    ['16.Qd3', 'd1', 'd3'], ['Bc6', 'b7', 'c6'], ['17.Bf5', 'g6', 'f5'], ['exf5', 'e6', 'f5'],
    ['18.Rxe7', 'e1', 'e7'], ['Bxe7', 'f8', 'e7'], ['19.c4', 'c2', 'c4'],
  ];
  const MT = MOVES.map((_, k) => (k === 0 ? 1.0 : 2.4 + (k - 1) * 0.2)), MD = MOVES.map((_, k) => (k === 0 ? 0.5 : 0.16));
  const RESIGN = 7.0, SCORE_T = 7.8;
  const sq = s => [s.charCodeAt(0) - 97, +s[1] - 1];
  const CAM = { f: 1000, cx: VCX, cy: VCY + 30 };
  function proj(x, y, z, yaw, D, pitch) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw), X = x * cs - z * sn, Z = x * sn + z * cs;
    const sp = Math.sin(pitch), cp = Math.cos(pitch);
    const yc = y * cp + Z * sp, zc = D - y * sp + Z * cp;
    return [CAM.cx + (CAM.f * X) / zc, CAM.cy - (CAM.f * yc) / zc, zc];
  }
  function boardAt(lt) {
    const P = Object.entries(START).map(([s, code]) => { const [f, r] = sq(s); return { code, f, r, x: f, y: r, a: 1, lift: 0 }; });
    let last = -1;
    for (let k = 0; k < MOVES.length; k++) {
      if (lt < MT[k]) break;
      const p = E.io2(clamp((lt - MT[k]) / MD[k])), m = MOVES[k];
      const move = (from, to) => {
        const [ff, fr] = sq(from), [tf, tr] = sq(to);
        const mover = P.find(q => q.a > 0 && q.f === ff && q.r === fr);
        const victim = P.find(q => q.a > 0 && q.f === tf && q.r === tr && q !== mover);
        if (victim) victim.a = 1 - p;
        mover.x = lerp(ff, tf, p); mover.y = lerp(fr, tr, p);
        mover.lift = Math.sin(p * Math.PI) * (mover.code[1] === 'N' ? 0.9 : 0.25);
        if (p >= 1) { mover.f = tf; mover.r = tr; }
      };
      move(m[1], m[2]);
      if (m[3]) move(m[3], m[4]);
      last = k;
    }
    return { P, last };
  }
  function audio(t0) {
    MOVES.forEach((m, k) => sfx(t0 + MT[k] + MD[k], 'clack', { v: m[0].includes('x') ? 1 : 0.7 }));
    sfx(t0 + RESIGN + 0.55, 'clack', { v: 1.2 }); hit(t0 + RESIGN + 0.55, 0.6);
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.8, lt));
    const yaw = lerp(-0.2, 0.1, lt / 10), D = lerp(12.8, 11.4, E.io2(prog(0, 10, lt))), pitch = lerp(0.62, 0.8, E.io2(prog(RESIGN - 0.5, RESIGN + 1.5, lt)));
    const pr = (x, y, z) => proj(x, y, z, yaw, D, pitch);
    c.save();
    c.globalAlpha = inP;
    c.translate(0, (1 - inP) * 60);
    const frame = [pr(-4.35, 0, -4.35), pr(4.35, 0, -4.35), pr(4.35, 0, 4.35), pr(-4.35, 0, 4.35)];
    c.fillStyle = '#20170f'; c.beginPath(); frame.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(240,200,125,0.55)'; c.lineWidth = 2; c.stroke();
    const { P, last } = boardAt(lt);
    const hi = last >= 0 ? [sq(MOVES[last][1]), sq(MOVES[last][2])] : [];
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      const q = [pr(f - 4, 0, r - 4), pr(f - 3, 0, r - 4), pr(f - 3, 0, r - 3), pr(f - 4, 0, r - 3)];
      const light = (f + r) % 2 === 1;
      c.fillStyle = light ? 'rgb(226,204,162)' : 'rgb(62,46,31)';
      c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
      if (hi.some(h => h[0] === f && h[1] === r)) { c.fillStyle = 'rgba(255,196,80,0.38)'; c.fill(); }
    }
    const sheen = c.createLinearGradient(frame[3][0], frame[3][1], frame[1][0], frame[1][1]);
    sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(255,230,180,0.06)');
    c.fillStyle = sheen; c.beginPath(); frame.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
    const hl = prog(1.0, 1.3, lt) * (1 - prog(2.1, 2.4, lt));
    if (hl > 0) {
      const [ex, ey] = pr(4 - 3.5, 0, 5 - 3.5);
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, ex, ey, 110, [255, 200, 100], 0.7 * hl);
      c.restore();
      text(c, '8. Nxe6!  弃马', ex, ey - 130, { f: font(700, 30, F.sans), color: '#ffe3a8', align: 'center', alpha: hl });
    }
    const tip = E.outBack(prog(RESIGN, RESIGN + 0.6, lt));
    const items = P.filter(p => p.a > 0.01).map(p => {
      const [x, y, z] = pr(p.x - 3.5, p.lift, p.y - 3.5), [bx, by] = pr(p.x - 3.5, 0, p.y - 3.5);
      return { p, x, y, z, bx, by };
    }).sort((a, b) => b.z - a.z);
    for (const it of items) {
      const size = (CAM.f / it.z) * 0.92, white = it.p.code[0] === 'w';
      const king = it.p.code === 'bK';
      c.globalAlpha = inP * it.p.a;
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath(); c.ellipse(it.bx, it.by + size * 0.05, size * 0.3, size * 0.11, 0, 0, TAU); c.fill();
      c.font = `${size.toFixed(1)}px "${F.sym}"`; c.textAlign = 'center'; c.letterSpacing = '0px';
      const gx = it.x, gy = it.y + size * 0.16;
      c.save();
      if (king && tip > 0) { c.translate(gx + size * 0.2, gy); c.rotate(tip * 1.45); c.translate(-gx - size * 0.2, -gy); }
      if (white) {
        c.lineWidth = 2.4; c.strokeStyle = 'rgb(40,28,16)'; c.strokeText(GL[it.p.code[1]], gx, gy);
        const gg = c.createLinearGradient(0, gy - size * 0.8, 0, gy);
        gg.addColorStop(0, '#fffaf0'); gg.addColorStop(1, '#d9cbb0');
        c.fillStyle = gg; c.fillText(GL[it.p.code[1]], gx, gy);
      } else {
        c.shadowColor = king && tip > 0 ? 'rgba(255,120,60,0.9)' : 'rgba(255,190,90,0.55)'; c.shadowBlur = king && tip > 0 ? 24 : 10;
        c.fillStyle = '#17120d'; c.fillText(GL[it.p.code[1]], gx, gy);
        c.shadowBlur = 0; c.lineWidth = 1.4; c.strokeStyle = 'rgba(240,200,125,0.95)'; c.strokeText(GL[it.p.code[1]], gx, gy);
      }
      c.restore();
    }
    c.restore();
    text(c, 'IBM 深蓝  vs  加里·卡斯帕罗夫  ·  第六局  ·  1997.5.11', VCX, 178, { f: font(700, 16, F.zh), color: 'rgb(240,205,140)', align: 'center', sp: 3, alpha: 0.9 * inP });
    if (lt < RESIGN) {
      const shown = MOVES.slice(0, last + 1).slice(-5);
      c.font = font(500, 20, F.mono); c.letterSpacing = '1px';
      const str = shown.map(m => m[0]).join('   ');
      let x = VCX - c.measureText(str).width / 2;
      shown.forEach((m, i) => {
        const w = c.measureText(m[0] + '   ').width;
        text(c, m[0], x, 224, { color: i === shown.length - 1 ? '#ffe3a8' : 'rgba(255,235,200,0.45)', sp: 1, alpha: inP * (1 - prog(RESIGN - 0.2, RESIGN, lt)) });
        x += w;
      });
    } else {
      const ra = E.out3(prog(RESIGN + 0.3, RESIGN + 0.7, lt)) * (1 - prog(SCORE_T - 0.2, SCORE_T, lt));
      text(c, '卡斯帕罗夫认输  KASPAROV RESIGNS', VCX, 232, { f: font(700, 30, F.zh), color: '#ffb899', align: 'center', sp: 2, alpha: ra });
      const k = E.out3(prog(SCORE_T, SCORE_T + 0.45, lt));
      c.save();
      c.translate(VCX, 238); c.scale(lerp(1.25, 1, k), lerp(1.25, 1, k));
      text(c, '深蓝 DEEP BLUE   3½ – 2½   卡斯帕罗夫', 0, 0, { f: font(800, 36, F.body), color: '#ffe3a8', align: 'center', sp: 1, alpha: k });
      c.restore();
    }
  }
  return { audio, draw };
})();
