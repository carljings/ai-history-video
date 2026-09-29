'use strict';
/* scenes.js — one visual per chapter.
   Each entry: { prep?(), audio?(t0), draw(c, lt, dur, t, P) }
   c = scene layer context, lt = seconds since the scene started, P = palette. */

const VIS = {};

/* ============================================================ INTRO 0–8 s */
VIS.intro = (() => {
  const CX = W / 2, CY = 455, pts = [];
  function prep() {
    const off = makeCanvas(W, H), o = off.getContext('2d');
    o.fillStyle = '#fff'; o.textAlign = 'center';
    o.font = font(700, 440); o.letterSpacing = '36px';
    o.fillText('AI', CX + 18, 610);
    const d = o.getImageData(0, 0, W, H).data, r = rng(42);
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) {
      if (d[(y * W + x) * 4 + 3] > 140) pts.push({ tx: x + (r() - 0.5) * 3, ty: y + (r() - 0.5) * 3 });
    }
    for (const p of pts) {
      p.a = r() * TAU; p.rad = 380 + Math.pow(r(), 0.8) * 1150;
      p.del = 0.8 + r() * 1.5; p.dur = 1.35 + r() * 0.35;
      p.z = r(); p.ph = r() * TAU; p.sw = r() - 0.5; p.ex = 0.6 + r() * 0.8;
    }
  }
  function draw(c, lt) {
    const fade = E.out2(prog(0.1, 1.8, lt));
    const zoom = 1 + 0.05 * E.io3(prog(0, 6.9, lt)) + 0.55 * E.in3(prog(6.9, 8.0, lt));
    c.save();
    c.translate(CX, CY); c.scale(zoom, zoom); c.translate(-CX, -CY);
    const lock = E.out3(prog(3.75, 4.4, lt)), gone = E.in2(prog(6.9, 7.8, lt));
    if (lock > 0 && gone < 1) {
      c.save();
      c.font = font(700, 440); c.letterSpacing = '36px'; c.textAlign = 'center';
      c.globalAlpha = 0.6 * lock * (1 - gone);
      c.shadowColor = 'rgba(70,130,255,1)'; c.shadowBlur = 90;
      c.fillStyle = 'rgba(30,60,160,0.35)';
      c.fillText('AI', CX + 18, 610);
      c.restore();
    }
    c.globalCompositeOperation = 'lighter';
    const ex = E.in3(prog(6.85, 8.0, lt)), exFade = 1 - E.in2(prog(7.0, 8.0, lt));
    for (const p of pts) {
      const m = E.io3(prog(p.del, p.del + p.dur, lt));
      const ang = p.a + lt * 0.14 * (1.25 - p.z * 0.5), rad = p.rad * (1 - 0.05 * lt);
      const gx = CX + Math.cos(ang) * rad, gy = CY + Math.sin(ang) * rad * 0.5;
      let x = lerp(gx, p.tx, m), y = lerp(gy, p.ty, m);
      const sw = Math.sin(m * Math.PI) * 140 * p.sw;
      x += sw; y -= sw * 0.4;
      if (ex > 0) {
        const dx = p.tx - CX, dy = p.ty - CY, dl = Math.hypot(dx, dy) + 1;
        x += (dx / dl) * ex * 1100 * p.ex; y += (dy / dl) * ex * 1100 * p.ex;
      }
      const tw = m > 0.97 ? 0.72 + 0.28 * Math.sin(lt * 5 + p.ph) : 0.85;
      const size = (2.2 + p.z * 2.4) * (1 + (1 - m) * 1.2);
      glow(c, x, y, size * 3.2, m > 0.5 ? [150, 200, 255] : [120, 140, 255], fade * tw * (0.45 + 0.55 * m) * exFade);
    }
    c.restore();

    // anamorphic lens flare as the letters lock
    const fl = lt < 4 ? prog(3.85, 4.0, lt) : Math.exp(-(lt - 4) * 2.2);
    if (fl > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.translate(CX, CY); c.scale(9, 0.22);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 120);
      g.addColorStop(0, rgba([210, 230, 255], 0.9 * fl)); g.addColorStop(0.3, rgba([90, 150, 255], 0.35 * fl)); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-120, -120, 240, 240);
      c.restore();
    }
    const sa = E.out3(prog(4.15, 5.0, lt)) * (1 - E.in2(prog(6.6, 7.3, lt)));
    if (sa > 0) {
      const sp = lerp(40, 13, E.out3(prog(4.15, 6.4, lt)));
      text(c, 'THE HISTORY OF ARTIFICIAL INTELLIGENCE', CX, 735, { f: font(600, 30), align: 'center', sp, alpha: sa * 0.95 });
      const ta = E.out3(prog(4.9, 5.8, lt)) * (1 - E.in2(prog(6.6, 7.3, lt)));
      const lw = 220 * E.out3(prog(4.9, 5.9, lt));
      c.strokeStyle = rgba([150, 190, 255], 0.5 * ta); c.lineWidth = 1;
      c.beginPath(); c.moveTo(CX - lw, 768); c.lineTo(CX + lw, 768); c.stroke();
      text(c, '1943 — 2026  ·  IN 120 SECONDS', CX, 804, { f: font(500, 17, F.mono), color: 'rgb(160,195,255)', align: 'center', sp: 6, alpha: ta * 0.9 });
    }
  }
  return { prep, draw };
})();

/* ================================================= 1943 McCulloch–Pitts */
VIS.y1943 = (() => {
  const C = [255, 184, 108], CL = [255, 226, 190];
  const IN = [[1010, 350], [1010, 520], [1010, 690]], N = [1400, 520], NR = 76, TH = [1610, 520], OUT = [1780, 520];
  const WAVES = [[1.05, [1, 0, 1]], [2.55, [0, 1, 0]], [4.05, [1, 1, 1]]], TRAVEL = 0.45;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const edgePoint = i => { const a = Math.atan2(IN[i][1] - N[1], IN[i][0] - N[0]); return [N[0] + Math.cos(a) * NR, N[1] + Math.sin(a) * NR]; };
  function audio(t0) {
    for (const [ws, act] of WAVES) {
      sfx(t0 + ws, 'tick', { v: 0.5 });
      sfx(t0 + ws + TRAVEL, sum(act) >= 2 ? 'fire' : 'nofire');
    }
  }
  function formula(c, cx, y, a) {
    const big = font(400, 34, F.serif, true), small = font(400, 19, F.serif, true), up = font(400, 30, F.body);
    const toks = [['y', big], ['  =  1    if    ', up], ['x', big], ['1', small, 8], ['  +  ', up], ['x', big], ['2', small, 8],
      ['  +  ', up], ['x', big], ['3', small, 8], ['   ≥   ', up], ['θ', up]];
    c.letterSpacing = '0px';
    let tw = 0;
    for (const tk of toks) { c.font = tk[1]; tk.w = c.measureText(tk[0]).width; tw += tk.w; }
    let x = cx - tw / 2;
    c.fillStyle = rgba(CL, 1); c.textAlign = 'left'; c.globalAlpha = a;
    for (const tk of toks) { c.font = tk[1]; c.fillText(tk[0], x, y + (tk[2] || 0)); x += tk.w; }
    c.globalAlpha = 1;
  }
  function draw(c, lt) {
    c.strokeStyle = rgba(C, 0.06); c.lineWidth = 1; c.beginPath();
    for (let x = 920; x <= 1800; x += 40) { c.moveTo(x, 170); c.lineTo(x, 870); }
    for (let y = 170; y <= 870; y += 40) { c.moveTo(920, y); c.lineTo(1800, y); }
    c.stroke();
    text(c, 'McCULLOCH–PITTS NEURON · 1943', 1360, 212, { f: font(600, 15, F.mono), color: rgba(C, 1), align: 'center', sp: 5, alpha: 0.85 * prog(0.2, 0.8, lt) });

    let flash = 0, dud = 0;
    for (const [ws, act] of WAVES) {
      const d = lt - (ws + TRAVEL);
      if (d >= 0) { if (sum(act) >= 2) flash = Math.max(flash, Math.exp(-d * 3.2)); else dud = Math.max(dud, 0.35 * Math.exp(-d * 5)); }
    }
    // input -> neuron connections draw in
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const p = E.out3(prog(0.25 + i * 0.12, 0.95 + i * 0.12, lt));
      if (p <= 0) continue;
      const sx = IN[i][0] + 24, sy = IN[i][1], [ex, ey] = edgePoint(i);
      c.strokeStyle = rgba(C, 0.55); c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(lerp(sx, ex, p), lerp(sy, ey, p)); c.stroke();
    }
    // inputs
    for (let i = 0; i < 3; i++) {
      const [x, y] = IN[i], ap = clamp(E.outBack(prog(0.1 + i * 0.1, 0.55 + i * 0.1, lt)), 0, 1.2);
      if (ap <= 0) continue;
      let on = 0;
      for (const [ws, act] of WAVES) if (act[i]) on = Math.max(on, prog(ws - 0.15, ws, lt) * (1 - prog(ws + 0.9, ws + 1.2, lt)));
      c.fillStyle = rgba(mixc([25, 15, 6], C, on * 0.85), 1); c.strokeStyle = rgba(C, 0.9); c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 24 * ap, 0, TAU); c.fill(); c.stroke();
      if (on > 0) { c.globalCompositeOperation = 'lighter'; glow(c, x, y, 70, C, on * 0.8); c.globalCompositeOperation = 'source-over'; }
      text(c, on > 0.5 ? '1' : '0', x, y + 8, { f: font(600, 22, F.mono), color: on > 0.5 ? '#2a1606' : rgba(C, 0.9), align: 'center', alpha: clamp(ap) });
      text(c, 'x', x - 66, y + 10, { f: font(400, 36, F.serif, true), color: rgba(CL, 1), align: 'center', alpha: clamp(ap) });
      text(c, String(i + 1), x - 51, y + 19, { f: font(400, 19, F.serif, true), color: rgba(CL, 1), align: 'center', alpha: clamp(ap) });
    }
    // travelling signals
    c.globalCompositeOperation = 'lighter';
    for (const [ws, act] of WAVES) {
      for (let i = 0; i < 3; i++) {
        if (!act[i]) continue;
        const p = prog(ws, ws + TRAVEL, lt);
        if (p > 0 && p < 1) { const [ex, ey] = edgePoint(i); glow(c, lerp(IN[i][0] + 24, ex, p), lerp(IN[i][1], ey, p), 34, C, 1); }
      }
      if (sum(act) >= 2) {
        const p1 = prog(ws + TRAVEL, ws + TRAVEL + 0.25, lt), p2 = prog(ws + TRAVEL + 0.25, ws + TRAVEL + 0.5, lt);
        if (p1 > 0 && p1 < 1) glow(c, lerp(N[0] + NR, TH[0] - 50, p1), N[1], 36, C, 1);
        if (p2 > 0 && p2 < 1) glow(c, lerp(TH[0] + 50, OUT[0] - 10, p2), N[1], 36, C, 1);
      }
    }
    c.globalCompositeOperation = 'source-over';
    // neuron body
    const np = clamp(E.outBack(prog(0.45, 1.0, lt)), 0, 1.15);
    if (np > 0) {
      const r = NR * np;
      c.globalCompositeOperation = 'lighter';
      glow(c, N[0], N[1], r * 2.6 + flash * 100, C, 0.3 + flash * 0.9 + dud);
      c.globalCompositeOperation = 'source-over';
      const g = c.createRadialGradient(N[0] - 20, N[1] - 25, 5, N[0], N[1], r);
      g.addColorStop(0, rgba(mixc([70, 40, 12], C, flash * 0.8), 1)); g.addColorStop(1, 'rgb(22,12,5)');
      c.fillStyle = g; c.strokeStyle = rgba(mixc(C, WHITE, flash * 0.6), 1); c.lineWidth = 3;
      c.beginPath(); c.arc(N[0], N[1], r, 0, TAU); c.fill(); c.stroke();
      text(c, 'Σ', N[0], N[1] + 21, { f: font(500, 62, F.body), color: rgba(mixc(CL, WHITE, flash), 1), align: 'center', alpha: clamp(np) });
      for (const [ws, act] of WAVES) {
        if (sum(act) < 2) continue;
        const d = lt - (ws + TRAVEL);
        if (d > 0 && d < 0.9) { c.strokeStyle = rgba(C, (1 - d / 0.9) * 0.8); c.lineWidth = 2; c.beginPath(); c.arc(N[0], N[1], NR + d * 130, 0, TAU); c.stroke(); }
      }
      text(c, 'THRESHOLD θ = 2', N[0], N[1] + NR + 44, { f: font(500, 16, F.mono), color: rgba(C, 0.85), align: 'center', sp: 2, alpha: clamp(np) });
    }
    // neuron -> threshold -> output
    const op = E.out3(prog(0.8, 1.4, lt));
    if (op > 0) {
      c.strokeStyle = rgba(C, 0.55); c.lineWidth = 2;
      c.beginPath(); c.moveTo(N[0] + NR, N[1]); c.lineTo(lerp(N[0] + NR, TH[0] - 50, op), N[1]); c.stroke();
      c.globalAlpha = op;
      c.fillStyle = 'rgb(25,14,5)'; c.strokeStyle = rgba(C, 0.9);
      roundRect(c, TH[0] - 50, TH[1] - 40, 100, 80, 12); c.fill(); c.stroke();
      c.strokeStyle = rgba(CL, 1); c.lineWidth = 3; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(TH[0] - 28, TH[1] + 18); c.lineTo(TH[0], TH[1] + 18); c.lineTo(TH[0], TH[1] - 18); c.lineTo(TH[0] + 28, TH[1] - 18); c.stroke();
      c.strokeStyle = rgba(C, 0.55); c.lineWidth = 2;
      c.beginPath(); c.moveTo(TH[0] + 50, N[1]); c.lineTo(OUT[0] - 12, N[1]); c.stroke();
      c.fillStyle = rgba(C, 0.8);
      c.beginPath(); c.moveTo(OUT[0] - 2, N[1]); c.lineTo(OUT[0] - 16, N[1] - 8); c.lineTo(OUT[0] - 16, N[1] + 8); c.fill();
      c.globalAlpha = 1;
      let outv = 0;
      for (const [ws, act] of WAVES) {
        const ta = ws + TRAVEL + 0.5;
        if (sum(act) >= 2 && lt >= ta && lt < ta + 0.95) outv = 1 - prog(ta + 0.65, ta + 0.95, lt);
      }
      text(c, outv > 0.02 ? '1' : '0', OUT[0] + 8, N[1] + 12, { f: font(700, 34, F.mono), color: outv > 0.02 ? rgba(mixc(C, WHITE, 0.5), 1) : rgba(C, 0.45), alpha: op });
      if (outv > 0.02) { c.globalCompositeOperation = 'lighter'; glow(c, OUT[0] + 20, N[1], 60, C, outv); c.globalCompositeOperation = 'source-over'; }
      text(c, 'y', OUT[0] + 8, N[1] - 36, { f: font(400, 32, F.serif, true), color: rgba(CL, 1), alpha: op });
    }
    const fp = E.out3(prog(1.3, 2.0, lt));
    if (fp > 0) formula(c, 1395, 812, fp);
  }
  return { audio, draw };
})();

/* ======================================================== 1950 Turing */
VIS.y1950 = (() => {
  const PW = 600, PH = 740, INK = 'rgb(36,29,22)';
  const LINES = [
    { s: 'I.—COMPUTING MACHINERY AND', size: 24, y: 262, align: 'center', cps: 95 },
    { s: 'INTELLIGENCE', size: 24, y: 294, align: 'center', cps: 95 },
    { s: 'BY A. M. TURING', size: 16, y: 332, align: 'center', cps: 95 },
    { s: '1. The Imitation Game.', size: 19, y: 392, align: 'left', cps: 75 },
    { s: 'I propose to consider the question,', size: 19, y: 432, align: 'left', cps: 72 },
    { s: '“Can machines think?”', size: 36, y: 498, align: 'left', cps: 23, hl: true },
    { s: 'This should begin with definitions of', size: 17, y: 560, align: 'left', cps: 100, dim: true },
    { s: 'the meaning of the terms “machine” and', size: 17, y: 588, align: 'left', cps: 100, dim: true },
    { s: '“think.” The definitions might be framed', size: 17, y: 616, align: 'left', cps: 100, dim: true },
    { s: 'so as to reflect so far as possible the', size: 17, y: 644, align: 'left', cps: 100, dim: true },
  ];
  let tc = 0.3;
  for (const L of LINES) { L.times = typeTimes(L.s, tc, L.cps, L.y); tc = L.times.end + (L.hl ? 0.3 : 0.06); }
  const QUOTE = LINES.find(L => L.hl), HL0 = QUOTE.times.end + 0.05;
  let paper = null;
  function prep() {
    paper = makeCanvas(PW, PH);
    const g = paper.getContext('2d'), r = rng(1950);
    let gr = g.createLinearGradient(0, 0, PW, PH);
    gr.addColorStop(0, '#f1e8d3'); gr.addColorStop(1, '#dccfaf');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    const id = g.getImageData(0, 0, PW, PH), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; }
    g.putImageData(id, 0, 0);
    for (let k = 0; k < 7; k++) {
      const x = r() * PW, y = r() * PH, rr = 30 + r() * 90;
      gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(150,105,40,0.07)'); gr.addColorStop(1, 'rgba(150,105,40,0)');
      g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    }
    gr = g.createRadialGradient(PW / 2, PH / 2, PH * 0.3, PW / 2, PH / 2, PH * 0.78);
    gr.addColorStop(0, 'rgba(110,70,20,0)'); gr.addColorStop(1, 'rgba(110,70,20,0.32)');
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    // printed masthead of the journal Mind, October 1950
    g.fillStyle = 'rgba(38,30,22,0.88)';
    g.font = font(500, 13, F.serif); g.textAlign = 'left'; g.fillText('VOL. LIX. No. 236.]', 40, 50);
    g.textAlign = 'right'; g.fillText('[October, 1950', PW - 40, 50);
    g.textAlign = 'center'; g.font = font(700, 50, F.serif); g.letterSpacing = '16px'; g.fillText('MIND', PW / 2 + 8, 118);
    g.font = font(500, 12, F.serif); g.letterSpacing = '4px';
    g.fillText('A QUARTERLY REVIEW', PW / 2 + 2, 146); g.fillText('OF', PW / 2 + 2, 164); g.fillText('PSYCHOLOGY AND PHILOSOPHY', PW / 2 + 2, 182);
    g.letterSpacing = '0px'; g.strokeStyle = 'rgba(38,30,22,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(40, 206); g.lineTo(PW - 40, 206); g.moveTo(40, 210); g.lineTo(PW - 40, 210); g.stroke();
    // per-character x offsets for the typed lines
    for (const L of LINES) {
      g.font = font(400, L.size, F.type);
      L.w = g.measureText(L.s).width;
      L.xs = [...L.s].map((_, i) => g.measureText(L.s.slice(0, i)).width);
      L.x0 = L.align === 'center' ? (PW - L.w) / 2 : 58;
    }
  }
  function audio(t0) {
    for (const L of LINES) sfxTyping(L.times.map(x => x + t0), L.s, 'type', 0.055, L.dim ? 0.5 : 1);
    sfx(t0 + QUOTE.times.end + 0.02, 'ding');
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    const rot = lerp(-0.12, -0.035, inP), dy = lerp(90, 0, inP);
    const zoom = 1 + 0.12 * E.io2(prog(2.6, 6.0, lt));
    const qx = QUOTE.x0 + QUOTE.w / 2 - PW / 2, qy = QUOTE.y - 12 - PH / 2;
    c.save();
    c.globalAlpha = inP;
    c.translate(VCX - 10, VCY + 22 + dy); c.rotate(rot);
    c.translate(qx, qy); c.scale(zoom, zoom); c.translate(-qx, -qy);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
    c.drawImage(paper, -PW / 2, -PH / 2);
    c.restore();
    c.translate(-PW / 2, -PH / 2);
    // highlighter sweep behind the famous question
    const hp = E.io2(prog(HL0, HL0 + 0.5, lt));
    if (hp > 0) {
      c.save(); c.globalCompositeOperation = 'multiply';
      c.fillStyle = 'rgba(255,196,70,0.8)';
      c.fillRect(QUOTE.x0 - 10, QUOTE.y - QUOTE.size * 0.95, (QUOTE.w + 20) * hp, QUOTE.size * 1.3);
      c.restore();
    }
    for (const L of LINES) {
      const n = countTyped(L.times, lt);
      if (!n) continue;
      c.font = font(400, L.size, F.type); c.fillStyle = INK; c.textAlign = 'left';
      for (let i = 0; i < n; i++) {
        const ch = L.s[i];
        if (ch === ' ') continue;
        const fresh = clamp((lt - L.times[i]) / 0.08);
        c.globalAlpha = inP * (L.dim ? 0.5 : 1) * (0.78 + 0.22 * hash(i, L.y)) * (0.6 + 0.4 * fresh);
        c.fillText(ch, L.x0 + L.xs[i], L.y + (hash(i, L.y + 1) - 0.5) * 1.6);
      }
    }
    c.restore();
  }
  return { prep, audio, draw };
})();

/* ===================================================== 1956 Dartmouth */
VIS.y1956 = (() => {
  const C = [255, 200, 130];
  let rays = null;
  function prep() {
    const S = 1500;
    rays = makeCanvas(S, S);
    const g = rays.getContext('2d'), cg = g.createConicGradient(0, S / 2, S / 2), N = 22;
    for (let i = 0; i < N; i++) {
      const a = i / N;
      cg.addColorStop(a, 'rgba(255,215,160,0)'); cg.addColorStop(a + 0.35 / N, 'rgba(255,215,160,0.16)'); cg.addColorStop(a + 0.7 / N, 'rgba(255,215,160,0)');
    }
    g.fillStyle = cg; g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'destination-in';
    const rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.5, 'rgba(0,0,0,0.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, S, S);
  }
  function stampLine(c, str, cy, t0, lt, size) {
    c.font = font(700, size); c.letterSpacing = '0px';
    const sp = 10, ws = [...str].map(ch => c.measureText(ch).width);
    const total = ws.reduce((a, b) => a + b, 0) + sp * (str.length - 1);
    let x = VCX - total / 2;
    for (let i = 0; i < str.length; i++) {
      const p = prog(t0 + i * 0.045, t0 + i * 0.045 + 0.32, lt);
      if (p > 0) {
        const e = E.out3(p), sc = lerp(2.4, 1, e);
        c.save();
        c.translate(x + ws[i] / 2, cy - size * 0.35); c.scale(sc, sc);
        c.globalAlpha = e; c.textAlign = 'center';
        c.shadowColor = rgba(C, 0.9); c.shadowBlur = 28;
        c.fillStyle = '#fff8ec'; c.fillText(str[i], 0, size * 0.35);
        c.restore();
      }
      x += ws[i] + sp;
    }
  }
  function draw(c, lt) {
    const burst = E.out3(prog(0, 0.9, lt));
    c.save();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * burst;
    c.translate(VCX, VCY); c.rotate(lt * 0.06); c.scale(0.6 + 0.4 * burst, 0.6 + 0.4 * burst);
    c.drawImage(rays, -750, -750);
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    glow(c, VCX, VCY - 10, 560 * (0.5 + 0.5 * burst), C, 0.35 * burst + 0.5 * Math.exp(-lt * 3), false);
    for (let i = 0; i < 70; i++) {
      const sp = 30 + 70 * hash(i, 3), y = 900 - ((lt * sp + hash(i, 2) * 800) % 800);
      const x = VCX + (hash(i, 1) - 0.5) * 1000 + Math.sin(lt * 1.5 + i) * 14;
      glow(c, x, y, 5 + 6 * hash(i, 4), C, burst * (0.25 + 0.5 * hash(i, 5)) * (0.6 + 0.4 * Math.sin(lt * 7 + i)));
    }
    c.restore();
    stampLine(c, 'ARTIFICIAL', 470, 0.12, lt, 92);
    stampLine(c, 'INTELLIGENCE', 580, 0.6, lt, 92);
    const ul = E.io3(prog(1.35, 2.0, lt));
    c.strokeStyle = rgba(C, 0.7); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(VCX - 400 * ul, 626); c.lineTo(VCX + 400 * ul, 626); c.stroke();
    const names = ['JOHN McCARTHY', 'MARVIN MINSKY', 'NATHANIEL ROCHESTER', 'CLAUDE SHANNON'], sep = '  ·  ';
    c.font = font(500, 15, F.mono); c.letterSpacing = '2px';
    let x = VCX - c.measureText(names.join(sep)).width / 2;
    names.forEach((nm, i) => {
      const a = E.out3(prog(1.6 + i * 0.16, 2.1 + i * 0.16, lt));
      text(c, nm, x, 672 + (1 - a) * 10, { color: '#ffe9cc', sp: 2, alpha: a });
      x += c.measureText(nm).width;
      if (i < 3) text(c, sep, x, 672, { color: rgba(C, 1), sp: 2, alpha: a });
      x += c.measureText(sep).width;
    });
    text(c, 'DARTMOUTH COLLEGE  ·  HANOVER, NEW HAMPSHIRE  ·  SUMMER 1956', VCX, 716, { f: font(500, 13, F.mono), color: rgba(C, 1), align: 'center', sp: 4, alpha: 0.6 * E.out3(prog(2.4, 3.0, lt)) });
  }
  return { prep, draw };
})();

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
  const UPD = [1.5, 2.25, 3.0, 3.75], DONE = 4.5;
  const sx = x => PX + x * PWD, sy = y => PY + (1 - y) * PHT;
  const score = (p, phi, off) => Math.cos(phi) * (p.x - 0.5) + Math.sin(phi) * (p.y - 0.5) - off;
  const wrong = (p, phi, off) => (score(p, phi, off) > 0) !== (p.cls === 0);
  // the misclassified example the perceptron "learns from" at each update
  const PICK = UPD.map((_, i) => PTS.filter(p => wrong(p, KEYS[i][0], KEYS[i][1])).sort((a, b) => Math.abs(score(b, KEYS[i][0], KEYS[i][1])) - Math.abs(score(a, KEYS[i][0], KEYS[i][1])))[0]);
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
  }
  function draw(c, lt) {
    const pa = E.out3(prog(0, 0.5, lt));
    c.globalAlpha = pa;
    c.fillStyle = 'rgba(6,22,20,0.75)'; c.strokeStyle = rgba(CB, 0.35); c.lineWidth = 1.5;
    roundRect(c, PX - 40, PY - 72, PWD + 80, PHT + 112, 18); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,255,220,0.07)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= 10; i++) {
      c.moveTo(PX + (i * PWD) / 10, PY); c.lineTo(PX + (i * PWD) / 10, PY + PHT);
      c.moveTo(PX, PY + (i * PHT) / 10); c.lineTo(PX + PWD, PY + (i * PHT) / 10);
    }
    c.stroke();
    c.globalAlpha = 1;
    text(c, 'THE PERCEPTRON  ·  1958', PX - 10, PY - 30, { f: font(600, 15, F.mono), color: rgba(CB, 1), sp: 4, alpha: pa });

    const la = E.out3(prog(0.95, 1.35, lt));
    const [phi, off] = lineAt(lt), nx = Math.cos(phi), ny = Math.sin(phi);
    const cx = 0.5 + nx * off, cy = 0.5 + ny * off;
    const Pp = (u, v) => [sx(cx - ny * u + nx * v), sy(cy + nx * u + ny * v)];
    c.save();
    c.beginPath(); c.rect(PX, PY, PWD, PHT); c.clip();
    c.globalAlpha = la;
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
    // learning from one mistake at a time
    UPD.forEach((u, i) => {
      const q = prog(u - 0.4, u + 0.35, lt), p = PICK[i];
      if (q <= 0 || q >= 1 || !p) return;
      c.strokeStyle = `rgba(255,255,255,${(1 - q).toFixed(3)})`; c.lineWidth = 2.5;
      c.beginPath(); c.arc(sx(p.x), sy(p.y), 12 + 34 * E.out3(q), 0, TAU); c.stroke();
    });
    const upd = UPD.filter(u => lt >= u).length;
    if (lt < DONE) {
      text(c, `UPDATE ${upd}/4   ·   ERRORS ${String(errors).padStart(2, '0')}`, PX + PWD + 10, PY - 30, { f: font(600, 15, F.mono), color: errors ? 'rgb(255,140,130)' : rgba(CB, 1), align: 'right', sp: 2, alpha: la });
    } else {
      const k = E.out3(prog(DONE, DONE + 0.4, lt));
      text(c, '✓ CONVERGED   ·   ERRORS 00', PX + PWD + 10, PY - 30, { f: font(700, 15, F.mono), color: rgba(CB, 1), align: 'right', sp: 2, alpha: k });
      c.globalCompositeOperation = 'lighter';
      glow(c, VCX, sy(0.5), 380, CB, 0.25 * Math.exp(-(lt - DONE) * 2), false);
      c.globalCompositeOperation = 'source-over';
    }
    text(c, '●  CLASS A      ◆  CLASS B', PX - 10, PY + PHT + 30, { f: font(500, 13, F.mono), color: 'rgba(200,255,240,0.6)', sp: 2, alpha: pa });
  }
  return { audio, draw };
})();

/* ========================================================= 1966 ELIZA */
VIS.y1966 = (() => {
  const G = [110, 255, 160];
  const BX = VCX - 420, BY = VCY - 312, BW = 840, BH = 600;
  const SX = VCX - 365, SY = VCY - 262, SW = 730, SH = 480;
  const LINES = [
    { s: 'HOW DO YOU DO.  PLEASE TELL ME', cps: 48, who: 'e' },
    { s: 'YOUR PROBLEM.', cps: 48, who: 'e', cont: true },
    { s: '> i am worried about the future', cps: 25, who: 'u', gap: 0.4 },
    { s: 'HOW LONG HAVE YOU BEEN WORRIED', cps: 50, who: 'e', gap: 0.35 },
    { s: 'ABOUT THE FUTURE?', cps: 50, who: 'e', cont: true },
  ];
  let tc = 0.5;
  for (const L of LINES) { tc += L.cont ? 0.02 : L.gap || 0; L.times = typeTimes(L.s, tc, L.cps, L.s.length); tc = L.times.end; }
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
    c.font = font(400, 40, F.crt); c.letterSpacing = '1px'; c.textAlign = 'left';
    c.shadowColor = rgba(G, 0.9); c.shadowBlur = 14;
    c.fillStyle = rgba(G, 0.5);
    c.fillText('MIT  ·  PROJECT MAC  ·  IBM 7094', SX + 38, SY + 62);
    const dash = c.measureText('-').width;
    c.fillText('-'.repeat(Math.floor((SW - 76) / dash)), SX + 38, SY + 94);
    let y = SY + 158, lastX = SX + 38, lastY = y;
    LINES.forEach((L, i) => {
      const n = countTyped(L.times, lt);
      if (n > 0) {
        c.fillStyle = L.who === 'u' ? '#dcffe8' : rgba(G, 1);
        const str = L.s.slice(0, n);
        c.fillText(str, SX + 38, y);
        lastX = SX + 38 + c.measureText(str).width; lastY = y;
      }
      y += 50 + ((LINES[i + 1] && LINES[i + 1].who !== L.who) ? 20 : 0);
    });
    if (Math.floor(lt * 2.6) % 2 === 0) { c.fillStyle = rgba(G, 1); c.fillRect(lastX + 6, lastY - 30, 18, 34); }
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
  }
  return { prep, audio, draw };
})();

/* ================================================= 1974 First AI winter */
VIS.y1974 = (() => {
  const ICE = [215, 232, 255];
  const QX = 950, QY = 300, QW = 820, QH = 420;
  const QUOTE = '“In no part of the field have the discoveries made so far produced the major impact that was then promised.”';
  let qLines = [], edgeFrost = [], panelFrost = [];
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
    lctx.font = font(400, 40, F.serif, true); lctx.letterSpacing = '0px';
    qLines = wrapLines(lctx, QUOTE, QW - 110);
    const r = rng(1974), seeds = [];
    for (let i = 0; i < 52; i++) {
      const e = i % 4, u = r();
      const [x, y, a] = e === 0 ? [u * W, -5, Math.PI / 2] : e === 1 ? [u * W, H + 5, -Math.PI / 2] : e === 2 ? [-5, u * H, 0] : [W + 5, u * H, Math.PI];
      if ((e === 1 && x < 1000) || (e === 2 && y > 230 && y < 1000)) continue;   // keep the text & timeline clear
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
    for (let i = 0; i < 9; i++) sfx(t0 + 1.2 + i * 0.62 + hash(i, 74) * 0.3, 'ice', { v: 0.4 + 0.6 * hash(i, 75) });
  }
  function draw(c, lt) {
    const fade = E.out2(prog(0, 1.0, lt));
    drawFrost(c, edgeFrost, 1.1 * E.out2(prog(0.2, 7.2, lt)), 0.75 * fade);
    // frosted glass panel
    const pa = E.out3(prog(0.1, 0.8, lt));
    c.globalAlpha = pa;
    const g = c.createLinearGradient(QX, QY, QX + QW, QY + QH);
    g.addColorStop(0, 'rgba(200,225,255,0.13)'); g.addColorStop(1, 'rgba(160,195,255,0.04)');
    c.fillStyle = g; roundRect(c, QX, QY, QW, QH, 18); c.fill();
    c.strokeStyle = 'rgba(215,232,255,0.3)'; c.lineWidth = 1.5; c.stroke();
    c.globalAlpha = 1;
    drawFrost(c, panelFrost, 0.9 * E.out2(prog(2.4, 7.5, lt)), 0.9 * pa);
    text(c, 'THE LIGHTHILL REPORT  ·  UK  ·  1973', QX + 55, QY + 58, { f: font(600, 13, F.mono), color: rgba(ICE, 1), sp: 4, alpha: 0.6 * pa });
    c.font = font(400, 40, F.serif, true); c.letterSpacing = '0px'; c.fillStyle = '#eef5ff'; c.textAlign = 'left';
    c.shadowColor = 'rgba(160,200,255,0.6)'; c.shadowBlur = 12;
    drawWords(c, qLines, QX + 55, QY + 130, 56, 0.55, lt, { stagger: 0.1, dur: 0.7, rise: 10 });
    c.shadowBlur = 0;
    text(c, '— SIR JAMES LIGHTHILL', QX + 55, QY + QH - 44, { f: font(500, 16, F.mono), color: rgba(ICE, 1), sp: 3, alpha: 0.7 * E.out3(prog(2.8, 3.4, lt)) });
    // drifting bokeh snowflakes in front
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const sp = 50 + 110 * hash(i, 41), r = 5 + 17 * hash(i, 42);
      const y = ((hash(i, 43) * (H + 120) + lt * sp) % (H + 120)) - 60;
      const x = hash(i, 44) * W + Math.sin(lt * 0.8 + i) * 30;
      glow(c, x, y, r, ICE, fade * (0.2 + 0.35 * hash(i, 45)), false);
    }
    c.globalCompositeOperation = 'source-over';
  }
  return { prep, audio, draw };
})();

/* ======================================== 1986 Backprop (synthwave) */
VIS.y1986 = (() => {
  const HZ = 740, PINK = [255, 60, 200], CYAN = [60, 220, 255], RED = [255, 110, 90], GREEN = [120, 255, 170];
  const LAYERS = [3, 5, 4, 2], LX = [1075, 1275, 1475, 1665], LY = 342, GAP = 70;
  const nodePos = (l, i) => [LX[l], LY + (i - (LAYERS[l] - 1) / 2) * GAP];
  const EDGES = [];
  { const r = rng(86); for (let l = 0; l < 3; l++) for (let i = 0; i < LAYERS[l]; i++) for (let j = 0; j < LAYERS[l + 1]; j++) EDGES.push([l, i, j, r() * 2 - 1, r() * 2 - 1]); }
  const FWD1 = 0.5, BWD = 2.0, FWD2 = 3.5, STEP = 0.375;
  const RULES = 'EXPERT SYSTEMS   ▸   IF fever AND rash THEN measles (0.7)   ▸   IF oil_pressure < 20 THEN stop_engine   ▸   IF loan_risk = HIGH THEN refer_to_manager   ▸   IF spectrum HAS peak_43 THEN ketone   ▸   ';
  let sun = null, rulesW = 0;
  function prep() {
    const S = 420;
    sun = makeCanvas(S, S);
    const g = sun.getContext('2d'), gr = g.createLinearGradient(0, 20, 0, S - 20);
    gr.addColorStop(0, '#ffe985'); gr.addColorStop(0.45, '#ff8a4c'); gr.addColorStop(1, '#ff2d95');
    g.fillStyle = gr; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 10, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 8; k++) g.fillRect(0, S / 2 + 12 + k * 24, S, 2 + k * 2.3);
    lctx.font = font(500, 15, F.mono); lctx.letterSpacing = '1px';
    rulesW = lctx.measureText(RULES).width;
  }
  function audio(t0) {
    for (let s = 0; s < 3; s++) {
      sfx(t0 + FWD1 + s * STEP, 'blip', { f: 520 * Math.pow(1.26, s) });
      sfx(t0 + BWD + s * STEP, 'blip', { f: 760 / Math.pow(1.26, s), v: 0.8 });
      sfx(t0 + FWD2 + s * STEP, 'blip', { f: 520 * Math.pow(1.26, s) });
    }
    sfx(t0 + FWD1 + 3 * STEP, 'error');
    sfx(t0 + FWD2 + 3 * STEP + 0.05, 'chime');
    sfx(CRT_T0, 'powerdown');
  }
  function draw(c, lt) {
    let fl = 1;
    if (lt > 6.2) { fl = hash(Math.floor(lt * 24), 99) > 0.42 ? 1 : 0.3; if (lt > 6.9) fl *= 0.85; }
    c.globalAlpha = fl;
    let g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, 'rgba(20,0,40,0)'); g.addColorStop(0.6, 'rgba(90,10,110,0.22)'); g.addColorStop(1, 'rgba(255,60,170,0.34)');
    c.fillStyle = g; c.fillRect(0, 0, W, HZ);
    const rise = E.out3(prog(0, 1.6, lt));
    c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip();
    c.globalCompositeOperation = 'lighter';
    glow(c, VCX, HZ - 130, 460, [255, 80, 160], 0.4 * rise * fl, false);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(sun, VCX - 210, HZ - 215 + (1 - rise) * 170);
    c.restore();
    // neon floor
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
    // expert-system rule ticker
    c.fillStyle = 'rgba(8,0,18,0.75)'; c.fillRect(0, 886, W, 34);
    c.strokeStyle = rgba(PINK, 0.4); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 886); c.lineTo(W, 886); c.moveTo(0, 920); c.lineTo(W, 920); c.stroke();
    c.font = font(500, 15, F.mono); c.letterSpacing = '1px'; c.fillStyle = rgba([255, 170, 235], 0.9); c.textAlign = 'left';
    let x0 = -((lt * 120) % rulesW);
    for (let x = x0; x < W; x += rulesW) c.fillText(RULES, x, 909);

    // the neural network, learning
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
    const lab = (s, a, b, col) => { const k = prog(a, a + 0.25, lt) * (1 - prog(b - 0.2, b, lt)); if (k > 0) text(c, s, 1370, 172, { f: font(600, 17, F.mono), color: rgba(col, 1), align: 'center', sp: 4, alpha: k * na }); };
    lab('FORWARD PASS  →', 0.35, 1.9, CYAN);
    lab('←  BACKPROPAGATION  ·  ADJUST WEIGHTS', 1.9, 3.4, RED);
    lab('FORWARD PASS  →', 3.4, 4.7, CYAN);
    lab('LEARNED  ✓', 4.7, 8, GREEN);
    if (lt >= errT && lt < okT) text(c, 'ERROR 0.83', 1700, LY + 6, { f: font(700, 16, F.mono), color: rgba(RED, 1), sp: 1, alpha: prog(errT, errT + 0.2, lt) });
    if (lt >= okT) text(c, 'ERROR 0.02', 1700, LY + 6, { f: font(700, 16, F.mono), color: rgba(GREEN, 1), sp: 1, alpha: prog(okT, okT + 0.2, lt) });
    c.globalAlpha = 1;
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
  const MT = MOVES.map((_, k) => (k === 0 ? 1.0 : 2.2 + (k - 1) * 0.165)), MD = MOVES.map((_, k) => (k === 0 ? 0.5 : 0.14));
  const SCORE_T = 6.0;
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
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.8, lt));
    const yaw = lerp(-0.17, 0.07, lt / 8), D = lerp(12.6, 11.8, E.io2(prog(0, 8, lt))), pitch = 0.72;
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
    // the knight sacrifice that opened the final game
    const hl = prog(1.0, 1.3, lt) * (1 - prog(2.1, 2.4, lt));
    if (hl > 0) {
      const [ex, ey] = pr(4 - 3.5, 0, 5 - 3.5);
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, ex, ey, 110, [255, 200, 100], 0.7 * hl);
      c.restore();
      text(c, '8. Nxe6!', ex, ey - 130, { f: font(700, 30, F.sans), color: '#ffe3a8', align: 'center', alpha: hl });
    }
    // pieces, far to near
    const items = P.filter(p => p.a > 0.01).map(p => {
      const [x, y, z] = pr(p.x - 3.5, p.lift, p.y - 3.5), [bx, by] = pr(p.x - 3.5, 0, p.y - 3.5);
      return { p, x, y, z, bx, by };
    }).sort((a, b) => b.z - a.z);
    for (const it of items) {
      const size = (CAM.f / it.z) * 0.92, white = it.p.code[0] === 'w';
      c.globalAlpha = inP * it.p.a;
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath(); c.ellipse(it.bx, it.by + size * 0.05, size * 0.3, size * 0.11, 0, 0, TAU); c.fill();
      c.font = `${size.toFixed(1)}px "${F.sym}"`; c.textAlign = 'center'; c.letterSpacing = '0px';
      const gx = it.x, gy = it.y + size * 0.16;
      if (white) {
        c.lineWidth = 2.4; c.strokeStyle = 'rgb(40,28,16)'; c.strokeText(GL[it.p.code[1]], gx, gy);
        const gg = c.createLinearGradient(0, gy - size * 0.8, 0, gy);
        gg.addColorStop(0, '#fffaf0'); gg.addColorStop(1, '#d9cbb0');
        c.fillStyle = gg; c.fillText(GL[it.p.code[1]], gx, gy);
      } else {
        c.shadowColor = 'rgba(255,190,90,0.55)'; c.shadowBlur = 10;
        c.fillStyle = '#17120d'; c.fillText(GL[it.p.code[1]], gx, gy);
        c.shadowBlur = 0; c.lineWidth = 1.4; c.strokeStyle = 'rgba(240,200,125,0.95)'; c.strokeText(GL[it.p.code[1]], gx, gy);
      }
    }
    c.restore();
    text(c, 'IBM DEEP BLUE  vs  GARRY KASPAROV  ·  GAME 6  ·  MAY 11, 1997', VCX, 184, { f: font(600, 14, F.mono), color: 'rgb(240,205,140)', align: 'center', sp: 3, alpha: 0.8 * inP });
    if (lt < SCORE_T) {
      const shown = MOVES.slice(0, last + 1).slice(-5);
      c.font = font(500, 20, F.mono); c.letterSpacing = '1px';
      const str = shown.map(m => m[0]).join('   ');
      let x = VCX - c.measureText(str).width / 2;
      shown.forEach((m, i) => {
        const w = c.measureText(m[0] + '   ').width;
        text(c, m[0], x, 230, { color: i === shown.length - 1 ? '#ffe3a8' : 'rgba(255,235,200,0.45)', sp: 1, alpha: inP * (1 - prog(SCORE_T - 0.2, SCORE_T, lt)) });
        x += w;
      });
    } else {
      const k = E.out3(prog(SCORE_T, SCORE_T + 0.45, lt));
      c.save();
      c.translate(VCX, 238); c.scale(lerp(1.25, 1, k), lerp(1.25, 1, k));
      text(c, 'DEEP BLUE   3½ – 2½   KASPAROV', 0, 0, { f: font(800, 40, F.body), color: '#ffe3a8', align: 'center', sp: 2, alpha: k });
      c.restore();
    }
  }
  return { audio, draw };
})();

/* ============================================= 2012 AlexNet / ImageNet */
VIS.y2012 = (() => {
  const B = [95, 175, 255], BH = [170, 225, 255];
  const LAYERS = [ // [x, slabs, cells, size, step]
    [905, 1, 20, 235, 0], [1080, 6, 12, 170, 15], [1285, 10, 8, 125, 10], [1462, 14, 5, 86, 6.5],
  ];
  const SK = 0.62, RISE = -0.22, CY = 505;
  const SCORES = [['tabby cat', 0.92], ['tiger cat', 0.06], ['Egyptian cat', 0.02]];
  const BARS = [[2010, 28.2], [2011, 25.8], [2012, 16.4], [2013, 11.7], [2014, 6.7], [2015, 3.6]];
  const WAVE0 = 0.5, WSTEP = 0.5, CHART = 4.2;
  let CAT = [];
  function prep() {
    const big = makeCanvas(96, 96), g = big.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `84px "${F.emoji}"`;
    g.fillText('🐱', 48, 52);
    const sm = makeCanvas(20, 20), s = sm.getContext('2d');
    s.imageSmoothingQuality = 'high'; s.drawImage(big, 0, 0, 20, 20);
    const d = s.getImageData(0, 0, 20, 20).data;
    CAT = [];
    for (let i = 0; i < 400; i++) CAT.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3] / 255]);
  }
  function audio(t0) {
    for (let l = 0; l < 5; l++) sfx(t0 + WAVE0 + l * WSTEP, 'blip', { f: 440 * Math.pow(1.335, l), v: 0.6 });
    sfx(t0 + WAVE0 + 5 * WSTEP, 'chime');
    BARS.forEach((_, i) => sfx(t0 + CHART + 0.35 + i * 0.13, 'dot', { v: 0.5 }));
  }
  const lit = (l, lt) => E.out2(prog(WAVE0 + l * WSTEP, WAVE0 + l * WSTEP + 0.35, lt));
  function slab(c, x, y, size, n, fill) {
    c.save();
    c.transform(SK, RISE, 0, 1, x, y);
    const cs = size / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const col = fill(i, j); if (col) { c.fillStyle = col; c.fillRect(i * cs + 0.6, j * cs + 0.6, cs - 1.2, cs - 1.2); } }
    c.strokeStyle = 'rgba(150,200,255,0.5)'; c.lineWidth = 1.2; c.strokeRect(0, 0, size, size);
    c.restore();
  }
  function drawNet(c, lt, A) {
    c.save(); c.globalAlpha = A;
    LAYERS.forEach(([x0, m, n, size, step], l) => {
      const L = lit(l, lt), y0 = CY - size / 2;
      for (let k = m - 1; k >= 0; k--) {
        slab(c, x0 + k * step, y0 - k * step * 0.35, size, n, (i, j) => {
          if (l === 0) { const p = CAT[j * 20 + i]; return p[3] > 0.05 ? rgba(p, (0.35 + 0.65 * L) * p[3]) : 'rgba(40,60,90,0.25)'; }
          const v = hash(i * 97 + j * 13 + k * 7, l * 31 + 5), fl = 0.75 + 0.25 * Math.sin(lt * 9 + i + j * 2 + k);
          const a = 0.08 + L * Math.pow(v, 2.2) * 0.95 * fl;
          return rgba(mixc(B, BH, v), a);
        });
      }
      // receptive-field cone into the next layer
      if (l < 3 && L > 0) {
        const nx = LAYERS[l + 1], s0 = size, s1 = nx[3], tIn = lit(l + 1, lt);
        const u = ((lt * 1.3 + l * 0.37) % 1) * (s0 * 0.7), v = (0.25 + 0.5 * ((Math.floor(lt * 1.3 + l * 0.37) * 0.37) % 1)) * s0;
        const px = x0 + SK * u, py = y0 + RISE * u + v, pw = s0 / n * 3;
        const tx = nx[0] + SK * (u / s0 * s1), ty = CY - s1 / 2 + RISE * (u / s0 * s1) + (v / s0) * s1;
        c.strokeStyle = rgba(BH, 0.5 * L * (1 - 0.5 * tIn)); c.lineWidth = 1;
        c.beginPath();
        for (const [dx, dy] of [[0, 0], [pw, 0], [0, pw], [pw, pw]]) { c.moveTo(px + SK * dx, py + RISE * dx + dy); c.lineTo(tx, ty); }
        c.stroke();
        c.strokeStyle = rgba(BH, 0.9 * L); c.strokeRect(px, py, pw * SK + 1, pw);
      }
    });
    // fully connected layer + prediction
    const Lf = lit(4, lt);
    for (let i = 0; i < 14; i++) {
      const y = CY - 170 + i * 26, v = hash(i, 88);
      c.fillStyle = rgba(mixc(B, BH, v), 0.2 + Lf * v * 0.8);
      c.beginPath(); c.arc(1618, y, 6, 0, TAU); c.fill();
    }
    const Lo = E.out3(prog(WAVE0 + 5 * WSTEP - 0.1, WAVE0 + 5 * WSTEP + 0.5, lt));
    SCORES.forEach(([name, p], i) => {
      const y = CY - 60 + i * 62, top = i === 0;
      text(c, name, 1645, y, { f: font(top ? 700 : 500, top ? 23 : 18, F.sans), color: top ? '#fff' : 'rgba(210,225,255,0.7)', alpha: Lo });
      c.fillStyle = 'rgba(120,170,255,0.15)'; c.fillRect(1645, y + 11, 165, 7);
      c.fillStyle = rgba(top ? BH : B, 1); c.globalAlpha = A * Lo; c.fillRect(1645, y + 11, 165 * p * Lo, 7); c.globalAlpha = A;
      text(c, `${Math.round(p * 100 * Lo)}%`, 1810, y, { f: font(600, 15, F.mono), color: top ? rgba(BH, 1) : 'rgba(210,225,255,0.6)', align: 'right', alpha: Lo });
    });
    text(c, 'ALEXNET  ·  8 LAYERS  ·  60M PARAMETERS  ·  2 GPUs', VCX, 206, { f: font(600, 14, F.mono), color: rgba(BH, 1), align: 'center', sp: 3, alpha: 0.8 * E.out3(prog(0.1, 0.6, lt)) });
    text(c, 'INPUT', 905 + 73, CY + 162, { f: font(500, 12, F.mono), color: 'rgba(190,215,255,0.55)', align: 'center', sp: 3 });
    text(c, 'CONVOLUTIONS  →  FEATURES', 1290, CY + 162, { f: font(500, 12, F.mono), color: 'rgba(190,215,255,0.55)', align: 'center', sp: 3 });
    c.restore();
  }
  function drawChart(c, lt, A) {
    c.save(); c.globalAlpha = A;
    const X0 = 990, Y0 = 800, HT = 500, BW = 86, GAPB = 46, yOf = v => Y0 - (v / 30) * HT;
    text(c, 'IMAGENET CHALLENGE  ·  TOP-5 ERROR RATE', VCX, 206, { f: font(600, 14, F.mono), color: rgba(BH, 1), align: 'center', sp: 3, alpha: 0.85 });
    c.strokeStyle = 'rgba(160,200,255,0.12)'; c.lineWidth = 1; c.beginPath();
    for (let v = 0; v <= 30; v += 10) { c.moveTo(970, yOf(v)); c.lineTo(1780, yOf(v)); }
    c.stroke();
    for (let v = 10; v <= 30; v += 10) text(c, v + '%', 962, yOf(v) + 5, { f: font(500, 13, F.mono), color: 'rgba(190,215,255,0.45)', align: 'right' });
    const dx = X0 + 2 * (BW + GAPB) - GAPB / 2;
    c.setLineDash([5, 6]); c.strokeStyle = 'rgba(190,215,255,0.35)';
    c.beginPath(); c.moveTo(dx, 250); c.lineTo(dx, Y0); c.stroke(); c.setLineDash([]);
    text(c, 'CLASSIC', dx - 16, 262, { f: font(600, 12, F.mono), color: 'rgba(190,215,255,0.55)', align: 'right', sp: 3 });
    text(c, 'DEEP LEARNING', dx + 16, 262, { f: font(600, 12, F.mono), color: rgba(BH, 1), sp: 3 });
    BARS.forEach(([yr, v], i) => {
      const p = E.out3(prog(CHART + 0.35 + i * 0.13, CHART + 0.95 + i * 0.13, lt));
      const x = X0 + i * (BW + GAPB), h = (v / 30) * HT * p, deep = yr >= 2012;
      const g = c.createLinearGradient(0, Y0 - h, 0, Y0);
      if (yr === 2012) { g.addColorStop(0, '#bfe4ff'); g.addColorStop(1, '#2f7dff'); }
      else if (deep) { g.addColorStop(0, 'rgba(90,160,255,0.95)'); g.addColorStop(1, 'rgba(40,90,220,0.9)'); }
      else { g.addColorStop(0, 'rgba(160,175,200,0.6)'); g.addColorStop(1, 'rgba(110,120,140,0.5)'); }
      c.fillStyle = g; c.fillRect(x, Y0 - h, BW, h);
      if (yr === 2012 && p > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x + BW / 2, Y0 - h, 90, B, 0.6 * p); c.restore(); }
      text(c, v.toFixed(1) + '%', x + BW / 2, Y0 - h - 14, { f: font(700, 21, F.sans), color: deep ? '#fff' : 'rgba(220,230,245,0.75)', align: 'center', alpha: p });
      text(c, String(yr), x + BW / 2, Y0 + 30, { f: font(500, 15, F.mono), color: yr === 2012 ? rgba(BH, 1) : 'rgba(200,215,240,0.6)', align: 'center', sp: 1, alpha: A });
    });
    const an = E.out3(prog(CHART + 1.3, CHART + 1.8, lt));
    const ax = X0 + 2 * (BW + GAPB) + BW / 2, ay = yOf(16.4) - 62;
    text(c, 'AlexNet', ax, ay - 8, { f: font(700, 24, F.sans), color: rgba(BH, 1), align: 'center', alpha: an });
    const hu = E.out3(prog(CHART + 1.9, CHART + 2.4, lt)), hy = yOf(5.1);
    if (hu > 0) {
      c.setLineDash([8, 7]); c.strokeStyle = rgba([255, 214, 125], 0.85 * hu); c.lineWidth = 2;
      c.beginPath(); c.moveTo(975, hy); c.lineTo(975 + 800 * hu, hy); c.stroke(); c.setLineDash([]);
      text(c, 'HUMAN ≈ 5%', 1778, hy - 12, { f: font(700, 14, F.mono), color: 'rgb(255,214,125)', align: 'right', sp: 2, alpha: hu });
      text(c, 'ResNet', X0 + 5 * (BW + GAPB) + BW / 2, Y0 - (3.6 / 30) * HT - 44, { f: font(600, 15, F.sans), color: rgba(BH, 1), align: 'center', alpha: hu });
    }
    c.restore();
  }
  function draw(c, lt) {
    const na = E.out3(prog(0, 0.5, lt)) * (1 - E.io2(prog(CHART - 0.2, CHART + 0.4, lt)));
    if (na > 0) drawNet(c, lt, na);
    const ca = E.out3(prog(CHART, CHART + 0.6, lt));
    if (ca > 0) drawChart(c, lt, ca);
  }
  return { prep, audio, draw };
})();

/* ===================================================== 2016 AlphaGo */
VIS.y2016 = (() => {
  const BS = 600, M = 30, SP = (BS - 2 * M) / 18, X0 = VCX - BS / 2, Y0 = 515 - BS / 2;
  const BLACK = [[15, 3], [16, 15], [2, 13], [13, 16], [9, 3], [2, 6], [9, 15], [14, 13], [10, 10], [16, 12], [7, 14], [11, 15], [4, 12], [6, 11], [3, 7], [16, 6], [5, 14], [12, 12]];
  const WHITE_ = [[3, 15], [3, 3], [5, 16], [15, 9], [15, 5], [5, 2], [12, 2], [4, 9], [6, 6], [13, 4], [2, 10], [8, 8], [12, 6], [10, 4], [7, 3], [14, 11], [8, 17], [11, 8]];
  const SEQ = BLACK.flatMap((b, i) => [[...b, 1], [...WHITE_[i], 0]]);
  const MOVE37 = [14, 8], T37 = 4.0;
  const stoneT = k => 0.5 + k / 12;
  const pos = (col, row) => [X0 + M + col * SP, Y0 + M + row * SP];
  let wood = null, sB = null, sW = null;
  function prep() {
    wood = makeCanvas(BS, BS);
    const g = wood.getContext('2d'), r = rng(2016);
    let gr = g.createLinearGradient(0, 0, BS, BS);
    gr.addColorStop(0, '#e4b870'); gr.addColorStop(1, '#c78f46');
    g.fillStyle = gr; g.fillRect(0, 0, BS, BS);
    for (let i = 0; i < 90; i++) {
      const y0 = r() * BS;
      g.strokeStyle = `rgba(120,70,20,${(0.03 + r() * 0.06).toFixed(3)})`; g.lineWidth = 1 + r() * 2.5;
      g.beginPath();
      for (let x = 0; x <= BS; x += 20) { const y = y0 + Math.sin(x * 0.01 + i) * 8 + Math.sin(x * 0.037 + i * 2) * 3; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(40,25,10,0.85)'; g.lineWidth = 1.3;
    for (let i = 0; i < 19; i++) { const p = M + i * SP; g.beginPath(); g.moveTo(M, p); g.lineTo(BS - M, p); g.moveTo(p, M); g.lineTo(p, BS - M); g.stroke(); }
    g.fillStyle = 'rgba(40,25,10,0.95)';
    for (const a of [3, 9, 15]) for (const b of [3, 9, 15]) { g.beginPath(); g.arc(M + a * SP, M + b * SP, 4, 0, TAU); g.fill(); }
    const mk = black => {
      const s = makeCanvas(40, 40), q = s.getContext('2d'), rg = q.createRadialGradient(15, 13, 2, 20, 20, 16);
      if (black) { rg.addColorStop(0, '#6a6a6a'); rg.addColorStop(0.3, '#1d1d1d'); rg.addColorStop(1, '#050505'); }
      else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.55, '#ece8df'); rg.addColorStop(1, '#b9b2a6'); }
      q.fillStyle = rg; q.beginPath(); q.arc(20, 20, 14.5, 0, TAU); q.fill();
      return s;
    };
    sB = mk(true); sW = mk(false);
  }
  function audio(t0) {
    SEQ.forEach((_, k) => sfx(t0 + stoneT(k) + 0.1, 'stone', { v: 0.55 + 0.3 * hash(k, 16) }));
    sfx(t0 + T37 + 0.2, 'stone', { v: 1.3 });
  }
  function stone(c, col, row, black, t0, lt, big = false) {
    const p = prog(t0, t0 + (big ? 0.2 : 0.1), lt);
    if (p <= 0) return;
    const [x, y] = pos(col, row), sc = lerp(big ? 2.4 : 1.5, 1, E.in2(p)), sz = 30 * sc;
    c.globalAlpha = Math.min(1, p * 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 3, y + 4, 14.5, 13, 0, 0, TAU); c.fill();
    c.drawImage(black ? sB : sW, x - sz * 0.667, y - sz * 0.667 - (sc - 1) * 20, sz * 1.333, sz * 1.333);
    c.globalAlpha = 1;
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    c.save();
    c.globalAlpha = inP;
    c.translate(VCX, 515); c.rotate(lerp(-0.05, -0.02, lt / 8)); c.translate(-VCX, -515);
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    c.drawImage(wood, X0, Y0); c.shadowBlur = 0; c.shadowOffsetY = 0;
    SEQ.forEach(([col, row, b], k) => stone(c, col, row, b, stoneT(k), lt));
    // spotlight on move 37
    const sl = E.out2(prog(T37 + 0.05, T37 + 0.5, lt));
    const [mx, my] = pos(...MOVE37);
    if (sl > 0) {
      const g = c.createRadialGradient(mx, my, 40, mx, my, 260);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,10,12,${(0.55 * sl).toFixed(3)})`);
      c.fillStyle = g; c.fillRect(X0, Y0, BS, BS);
    }
    stone(c, MOVE37[0], MOVE37[1], true, T37, lt, true);
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++) {
      const d = lt - T37 - 0.15 - k * 0.22;
      if (d > 0 && d < 1.1) { c.strokeStyle = rgba([90, 235, 215], (1 - d / 1.1) * 0.95); c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 16 + d * 240, 0, TAU); c.stroke(); }
    }
    if (lt > T37) glow(c, mx, my, 70, [90, 235, 215], 0.8 * Math.exp(-(lt - T37) * 0.8) + 0.35);
    c.globalCompositeOperation = 'source-over';
    c.restore();
    // label
    const la = E.out3(prog(T37 + 0.3, T37 + 0.7, lt));
    if (la > 0) {
      const ex = mx + 150 * la, ey = my - 140 * la;
      c.strokeStyle = 'rgba(160,255,240,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(mx + 14, my - 14); c.lineTo(ex, ey); c.lineTo(ex + 20, ey); c.stroke();
      c.fillStyle = 'rgba(2,20,20,0.82)'; roundRect(c, ex + 22, ey - 44, 236, 74, 10); c.globalAlpha = la; c.fill(); c.globalAlpha = 1;
      text(c, 'MOVE 37', ex + 38, ey - 8, { f: font(700, 32, F.sans), color: '#dffff9', alpha: la });
      text(c, 'A 1-IN-10,000 MOVE', ex + 40, ey + 17, { f: font(600, 13, F.mono), color: 'rgb(110,235,215)', sp: 2, alpha: la });
    }
    text(c, 'ALPHAGO  vs  LEE SEDOL  ·  GAME 2  ·  SEOUL  ·  MARCH 10, 2016', VCX, 190, { f: font(600, 14, F.mono), color: 'rgb(140,235,220)', align: 'center', sp: 3, alpha: 0.8 * inP });
    const sc = E.out3(prog(5.2, 5.7, lt));
    if (sc > 0) text(c, 'ALPHAGO   4 – 1   LEE SEDOL', VCX, 872, { f: font(800, 34, F.body), color: '#dffff9', align: 'center', sp: 2, alpha: sc });
  }
  return { prep, audio, draw };
})();

/* ================================================== 2017 Transformer */
VIS.y2017 = (() => {
  const TOK = ['The', 'animal', 'didn’t', 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
  const W1 = [0.03, 0.6, 0.02, 0.03, 0.04, 0.08, 0.02, 0.1, 0.02, 0.02, 0.04];
  const W2 = [0.03, 0.07, 0.02, 0.03, 0.06, 0.6, 0.02, 0.09, 0.02, 0.02, 0.06];
  const XL = 1150, XR = 1580, Y0 = 270, DY = 50, IT = 7, SWITCH = 4.0;
  const V = [190, 150, 255], CY_ = [100, 220, 255];
  const yOf = i => Y0 + i * DY;
  function audio(t0) { sfx(t0 + 1.5, 'ping'); sfx(t0 + SWITCH, 'ping', { f: 1.25 }); }
  function curveTo(c, x1, y1, x2, y2) { c.moveTo(x1, y1); c.bezierCurveTo(x1 + 170, y1, x2 - 170, y2, x2, y2); }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.6, lt));
    const mesh = E.out3(prog(0.4, 1.3, lt)) * (1 - 0.8 * E.out3(prog(1.5, 2.2, lt)));
    const focus = E.out3(prog(1.5, 2.2, lt)), sw = E.io3(prog(SWITCH, SWITCH + 0.8, lt));
    text(c, 'SELF-ATTENTION  ·  EVERY WORD LOOKS AT EVERY OTHER WORD', VCX + 5, 205, { f: font(600, 14, F.mono), color: rgba(V, 1), align: 'center', sp: 3, alpha: 0.8 * inP });
    if (mesh > 0.01) {
      c.strokeStyle = rgba(V, 0.09 * mesh); c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < TOK.length; i++) for (let j = 0; j < TOK.length; j++) curveTo(c, XL + 14, yOf(i) - 8, XR - 14, yOf(j) - 8);
      c.stroke();
    }
    if (focus > 0) {
      for (let j = 0; j < TOK.length; j++) {
        const w = lerp(W1[j], W2[j], sw);
        const g = c.createLinearGradient(XL, 0, XR, 0);
        g.addColorStop(0, rgba(V, (0.15 + 0.85 * w) * focus)); g.addColorStop(1, rgba(CY_, (0.15 + 0.85 * w) * focus));
        c.strokeStyle = g; c.lineWidth = 1 + w * 18; c.lineCap = 'round';
        c.beginPath(); curveTo(c, XL + 14, yOf(IT) - 8, XR - 14, yOf(j) - 8); c.stroke();
      }
    }
    for (let i = 0; i < TOK.length; i++) {
      const a = inP * E.out3(prog(0.15 + i * 0.03, 0.5 + i * 0.03, lt));
      for (const side of [0, 1]) {
        let word = TOK[i], alt = null;
        if (i === TOK.length - 1) { word = 'tired'; alt = 'wide'; }
        const x = side ? XR : XL, y = yOf(i), align = side ? 'left' : 'right';
        const w = side ? lerp(W1[i], W2[i], sw) : 0;
        c.font = font(500, 28); c.letterSpacing = '0px';
        if (side === 0 && i === IT && focus > 0) {
          const tw = c.measureText('it').width;
          c.fillStyle = rgba(V, 0.35 * focus); roundRect(c, x - tw - 14, y - 30, tw + 28, 40, 10); c.fill();
        }
        if (side === 1 && w > 0.3 && focus > 0) {
          const tw = c.measureText(i === 1 ? 'animal' : 'street').width, k = focus * clamp((w - 0.3) / 0.3);
          c.fillStyle = rgba(CY_, 0.25 * k); roundRect(c, x - 14, y - 30, tw + 28, 40, 10); c.fill();
          c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x + tw / 2, y - 10, 90, CY_, 0.35 * k); c.restore();
        }
        const col = (side === 0 && i === IT) ? '#ffffff' : `rgba(235,235,255,${(0.55 + (side ? w : 0) * 0.45).toFixed(3)})`;
        if (alt) {
          const p = E.io3(prog(SWITCH - 0.1, SWITCH + 0.3, lt));
          if (p < 1) text(c, word, x, y - p * 22, { f: font(500, 28), color: col, align, alpha: a * (1 - p) });
          if (p > 0) text(c, alt, x, y + (1 - p) * 22, { f: font(500, 28), color: '#ffe9a8', align, alpha: a * p });
        } else text(c, word, x, y, { f: font(500, 28), color: col, align, alpha: a });
      }
    }
    const cap = (s, k) => { if (k > 0) text(c, s, VCX + 5, 848, { f: font(400, 32, F.serif, true), color: '#efe8ff', align: 'center', alpha: k }); };
    cap('“it” → animal', focus * (1 - prog(SWITCH - 0.1, SWITCH + 0.2, lt)));
    cap('“it” → street', prog(SWITCH + 0.3, SWITCH + 0.7, lt));
    text(c, 'VASWANI ET AL.  ·  “ATTENTION IS ALL YOU NEED”  ·  ARXIV 1706.03762', VCX + 5, 895, { f: font(500, 12, F.mono), color: 'rgba(210,200,255,0.5)', align: 'center', sp: 2, alpha: inP });
  }
  return { audio, draw };
})();

/* =========================================================== 2020 Scale */
VIS.y2020 = (() => {
  const R3 = 285, BASE = 800;
  const MODELS = [
    { name: 'GPT-1', year: '2018', p: 117e6, label: '117M', x: 965, t: 0.5 },
    { name: 'GPT-2', year: '2019', p: 1.5e9, label: '1.5B', x: 1070, t: 1.0 },
    { name: 'GPT-3', year: '2020', p: 175e9, label: '175B', x: 1455, t: 1.5 },
  ];
  const radius = m => R3 * Math.sqrt(m.p / 175e9);
  const DOTS = (() => { const r = rng(2020); return Array.from({ length: 1500 }, () => { const a = r() * TAU, d = Math.sqrt(r()); return [Math.cos(a) * d, Math.sin(a) * d, r()]; }); })();
  function audio(t0) { sfx(t0 + 0.5, 'pop'); sfx(t0 + 1.0, 'pop'); sfx(t0 + 1.5, 'swell'); }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    c.strokeStyle = `rgba(180,200,255,${(0.2 * inP).toFixed(3)})`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(920, BASE); c.lineTo(1790, BASE); c.stroke();
    text(c, 'MODEL SIZE  ·  NUMBER OF PARAMETERS', VCX, 206, { f: font(600, 14, F.mono), color: 'rgb(170,200,255)', align: 'center', sp: 3, alpha: 0.8 * inP });
    MODELS.forEach((m, i) => {
      const big = i === 2;
      const g = big ? E.outExpo(prog(m.t, m.t + 1.5, lt)) : E.outBack(prog(m.t, m.t + 0.4, lt));
      if (g <= 0) return;
      const r = Math.max(0.5, radius(m) * g), cx = m.x, cy = BASE - r;
      if (big) {
        const gr = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
        gr.addColorStop(0, 'rgba(90,140,255,0.35)'); gr.addColorStop(1, 'rgba(30,50,140,0.12)');
        c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < DOTS.length; k++) {
          const [dx, dy, s] = DOTS[k], tw = 0.4 + 0.6 * Math.abs(Math.sin(lt * (1 + s * 3) + k));
          c.fillStyle = rgba(mixc([90, 150, 255], [255, 170, 120], s * s), 0.7 * tw);
          c.fillRect(cx + dx * r * 0.96, cy + dy * r * 0.96, 2, 2);
        }
        c.restore();
        c.strokeStyle = 'rgba(160,200,255,0.9)'; c.lineWidth = 2.5;
        c.shadowColor = 'rgba(110,160,255,1)'; c.shadowBlur = 30;
        c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); c.shadowBlur = 0;
        const k = E.out3(prog(m.t + 0.3, m.t + 1.8, lt));
        const n = Math.round(175e9 * k).toLocaleString('en-US');
        text(c, 'GPT-3  ·  2020', cx, cy - 78, { f: font(600, 18, F.mono), color: 'rgb(190,215,255)', align: 'center', sp: 4, alpha: g });
        text(c, n, cx, cy + 6, { f: font(700, 50, F.sans), color: '#fff', align: 'center', alpha: g });
        text(c, 'PARAMETERS', cx, cy + 44, { f: font(600, 15, F.mono), color: 'rgb(190,215,255)', align: 'center', sp: 6, alpha: g });
        text(c, 'TRAINED ON 300 BILLION TOKENS OF TEXT', cx, cy + 92, { f: font(500, 12, F.mono), color: 'rgba(190,215,255,0.7)', align: 'center', sp: 2, alpha: E.out3(prog(3.2, 3.8, lt)) });
      } else {
        c.fillStyle = 'rgba(150,190,255,0.9)'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, cy, r * 3 + 12, [120, 170, 255], 0.6); c.restore();
        text(c, m.name, cx, BASE + 30, { f: font(700, 16, F.mono), color: '#fff', align: 'center', alpha: clamp(g) });
        text(c, m.year + ' · ' + m.label, cx, BASE + 52, { f: font(500, 13, F.mono), color: 'rgba(190,215,255,0.7)', align: 'center', alpha: clamp(g) });
      }
    });
    const ar = E.out3(prog(2.3, 2.9, lt));
    if (ar > 0) {
      c.strokeStyle = `rgba(255,190,120,${(0.85 * ar).toFixed(3)})`; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(1085, 740); c.quadraticCurveTo(1100, 560, 1185, 520); c.stroke(); c.setLineDash([]);
      text(c, '×117', 1070, 560, { f: font(700, 30, F.sans), color: 'rgb(255,200,140)', align: 'center', alpha: ar });
      text(c, '2019 → 2020', 1070, 586, { f: font(600, 12, F.mono), color: 'rgba(255,200,140,0.8)', align: 'center', sp: 3, alpha: ar });
    }
  }
  return { audio, draw };
})();

/* ================================================= 2022 ChatGPT boom */
VIS.y2022 = (() => {
  const WX = 975, WY = 250, WW = 770, WH = 400;
  const ANSWER = 'Seventy years ago, Alan Turing asked whether machines could think. Today, you’re asking one.';
  const T_USER = 0.5, T_ANS = 1.25, WPS = 6.5;
  const TILES = [[1015, 222, 118, -0.08], [1712, 238, 108, 0.07], [1800, 500, 120, 0.05], [925, 590, 112, -0.06], [1790, 760, 104, 0.06]];
  let ansLines = [], tileArt = [], tileNoise = [];
  function prep() {
    lctx.font = font(400, 28, F.body); lctx.letterSpacing = '0px';
    ansLines = wrapLines(lctx, ANSWER, 640);
    const r = rng(22);
    TILES.forEach((_, k) => {
      const S = 128, a = makeCanvas(S, S), g = a.getContext('2d');
      const hues = [[255, 120, 170], [90, 200, 255], [255, 200, 90], [150, 110, 255], [90, 240, 190]];
      const c1 = hues[k % 5], c2 = hues[(k + 2) % 5];
      let gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, rgba(c1, 1)); gr.addColorStop(1, rgba(c2, 1));
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(255,250,230,0.85)'; g.beginPath(); g.arc(S * (0.3 + r() * 0.4), S * 0.38, S * 0.13, 0, TAU); g.fill();
      for (let m = 0; m < 3; m++) {
        g.fillStyle = `rgba(20,10,40,${(0.25 + m * 0.2).toFixed(2)})`; g.beginPath(); g.moveTo(0, S);
        for (let x = 0; x <= S; x += 8) g.lineTo(x, S * (0.55 + m * 0.12) + Math.sin(x * 0.05 + r() * 6 + m) * 10 * (1 + r()));
        g.lineTo(S, S); g.closePath(); g.fill();
      }
      tileArt.push(a);
      const nz = makeCanvas(S, S), q = nz.getContext('2d'), id = q.createImageData(S, S);
      for (let i = 0; i < id.data.length; i += 4) { id.data[i] = r() * 255; id.data[i + 1] = r() * 255; id.data[i + 2] = r() * 255; id.data[i + 3] = 255; }
      q.putImageData(id, 0, 0);
      tileNoise.push(nz);
    });
  }
  const words = () => ANSWER.split(' ').length;
  function audio(t0) {
    sfx(t0 + T_USER, 'pop');
    for (let i = 0; i < words(); i++) sfx(t0 + T_ANS + i / WPS, 'tok', { v: 0.45 });
    sfx(t0 + 4.0, 'pop', { f: 1.3 }); sfx(t0 + 4.5, 'pop', { f: 1.6 });
  }
  function card(c, x, y, w, h, big, label, k, col) {
    if (k <= 0) return;
    c.save();
    c.globalAlpha = k; c.translate(0, (1 - k) * 24);
    c.fillStyle = 'rgba(20,16,38,0.82)'; roundRect(c, x, y, w, h, 16); c.fill();
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
    text(c, big, x + 26, y + 58, { f: font(700, 40, F.sans), color: '#fff' });
    text(c, label, x + 28, y + 88, { f: font(600, 13, F.mono), color: rgba(col, 1), sp: 3 });
    c.restore();
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.6, lt));
    c.save(); c.globalCompositeOperation = 'lighter';
    const blobs = [[[255, 70, 170], 0], [[40, 220, 220], 1.7], [[140, 90, 255], 3.1], [[255, 180, 80], 4.4]];
    for (const [col, ph] of blobs) {
      const x = VCX + Math.cos(lt * 0.5 + ph) * 330, y = 500 + Math.sin(lt * 0.7 + ph * 1.3) * 200;
      glow(c, x, y, 480, col, 0.3 * inP, false);
    }
    c.restore();
    TILES.forEach(([x, y, s, rot], k) => {
      const p = E.io2(prog(0.6 + k * 0.35, 2.4 + k * 0.35, lt)), a = inP * E.out3(prog(0.2 + k * 0.1, 0.8 + k * 0.1, lt));
      if (a <= 0) return;
      c.save();
      c.translate(x, y + Math.sin(lt * 1.2 + k) * 8); c.rotate(rot); c.globalAlpha = a;
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 20;
      c.drawImage(tileArt[k], -s / 2, -s / 2, s, s); c.shadowBlur = 0;
      c.globalAlpha = a * (1 - p); c.drawImage(tileNoise[k], -s / 2, -s / 2, s, s);
      c.globalAlpha = a; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5; c.strokeRect(-s / 2, -s / 2, s, s);
      c.restore();
    });
    // chat window
    c.save();
    c.globalAlpha = inP; c.translate(0, (1 - inP) * 30);
    c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 40;
    c.fillStyle = 'rgba(16,13,30,0.9)'; roundRect(c, WX, WY, WW, WH, 22); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 1.5; c.stroke();
    [[255, 95, 87], [255, 189, 46], [40, 200, 64]].forEach((col, i) => { c.fillStyle = rgba(col, 0.9); c.beginPath(); c.arc(WX + 28 + i * 22, WY + 26, 6, 0, TAU); c.fill(); });
    text(c, 'NEW CHAT', WX + WW / 2, WY + 31, { f: font(600, 12, F.mono), color: 'rgba(255,255,255,0.45)', align: 'center', sp: 4 });
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(WX, WY + 52); c.lineTo(WX + WW, WY + 52); c.stroke();
    const up = E.outBack(prog(T_USER, T_USER + 0.35, lt));
    if (up > 0) {
      const msg = 'Explain the history of AI in one sentence.';
      c.font = font(500, 24, F.body); c.letterSpacing = '0px';
      const tw = c.measureText(msg).width, bx = WX + WW - 34 - tw - 36, by = WY + 80;
      c.save(); c.globalAlpha = inP * clamp(up); c.translate(bx + tw + 36, by); c.scale(clamp(up, 0, 1.1), clamp(up, 0, 1.1)); c.translate(-(bx + tw + 36), -by);
      c.fillStyle = 'rgba(120,110,255,0.35)'; roundRect(c, bx, by, tw + 36, 56, 22); c.fill();
      text(c, msg, bx + 18, by + 37, { color: '#fff' });
      c.restore();
    }
    const nw = Math.floor(clamp((lt - T_ANS) * WPS, 0, 99));
    if (lt > T_ANS - 0.3) {
      const ax = WX + 42, ay = WY + 196;
      const ag = c.createLinearGradient(ax - 16, ay - 16, ax + 16, ay + 16);
      ag.addColorStop(0, '#ff7ac6'); ag.addColorStop(1, '#6bd6ff');
      c.fillStyle = ag; c.beginPath(); c.arc(ax, ay, 16, 0, TAU); c.fill();
      text(c, '✦', ax, ay + 7, { f: font(700, 18, F.sym), color: '#fff', align: 'center' });
      c.font = font(400, 28, F.body); c.letterSpacing = '0px'; c.fillStyle = '#f2f0ff'; c.textAlign = 'left';
      let k = 0, lastX = ax + 30, lastY = ay + 8;
      ansLines.forEach((line, li) => {
        let x = ax + 32;
        for (const w of line.split(' ')) {
          if (k < nw) { c.fillText(w, x, ay + 10 + li * 42); lastX = x + c.measureText(w).width; lastY = ay + 10 + li * 42; }
          x += c.measureText(w + ' ').width; k++;
        }
      });
      if (nw < words() || Math.floor(lt * 2.5) % 2 === 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(lastX + 12, lastY - 8, 6, 0, TAU); c.fill(); }
    }
    c.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(c, WX + 24, WY + WH - 74, WW - 48, 50, 25); c.fill();
    text(c, 'Message…', WX + 50, WY + WH - 42, { f: font(400, 19, F.body), color: 'rgba(255,255,255,0.35)' });
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(WX + WW - 50, WY + WH - 49, 16, 0, TAU); c.fill();
    text(c, '↑', WX + WW - 50, WY + WH - 42, { f: font(700, 19, F.body), color: '#16122a', align: 'center' });
    c.restore();
    const k1 = E.out3(prog(4.0, 4.5, lt)), k2 = E.out3(prog(4.5, 5.0, lt));
    const n1 = Math.round(1e6 * E.out3(prog(4.0, 5.0, lt))).toLocaleString('en-US');
    const n2 = Math.round(1e8 * E.out3(prog(4.5, 5.6, lt))).toLocaleString('en-US');
    card(c, WX, 690, 370, 108, n1, 'USERS IN 5 DAYS', k1, [120, 255, 225]);
    card(c, WX + 400, 690, 370, 108, n2, 'USERS IN 2 MONTHS', k2, [255, 140, 200]);
  }
  return { prep, audio, draw };
})();

/* ======================================================= 2024 Nobel */
VIS.y2024 = (() => {
  const GOLD = [255, 214, 125];
  const MED = [
    { x: 1150, label: 'NOBEL PRIZE IN PHYSICS  ·  2024  ·  ', cat: 'PHYSICS', names: ['John Hopfield', 'Geoffrey Hinton'], note: 'neural networks', icon: 'net' },
    { x: 1570, label: 'NOBEL PRIZE IN CHEMISTRY  ·  2024  ·  ', cat: 'CHEMISTRY', names: ['Demis Hassabis · John Jumper', '& David Baker'], note: 'protein structure & design', icon: 'helix' },
  ];
  const MY = 440, MR = 150;
  function medal(m) {
    const S = 340, c0 = S / 2, cv = makeCanvas(S, S), g = cv.getContext('2d');
    let gr = g.createRadialGradient(c0 - 60, c0 - 70, 20, c0, c0, 170);
    gr.addColorStop(0, '#fff4c2'); gr.addColorStop(0.35, '#f0c75a'); gr.addColorStop(0.75, '#b8862c'); gr.addColorStop(1, '#7a5516');
    g.fillStyle = gr; g.beginPath(); g.arc(c0, c0, 165, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,60,10,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(c0, c0, 150, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,240,190,0.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(c0, c0, 147, 0, TAU); g.stroke();
    gr = g.createRadialGradient(c0 - 40, c0 - 50, 10, c0, c0, 125);
    gr.addColorStop(0, '#ffe9a0'); gr.addColorStop(1, '#c8962e');
    g.fillStyle = gr; g.beginPath(); g.arc(c0, c0, 118, 0, TAU); g.fill();
    g.font = font(700, 15, F.sans); g.letterSpacing = '2px'; g.fillStyle = 'rgba(85,55,10,0.85)'; g.textAlign = 'center';
    const chars = [...m.label], rr = 133, ws = chars.map(ch => g.measureText(ch).width);
    let a = -Math.PI / 2 - ws.reduce((x, y) => x + y, 0) / rr / 2;
    chars.forEach((ch, i) => { g.save(); g.translate(c0, c0); g.rotate(a + ws[i] / rr / 2 + Math.PI / 2); g.fillText(ch, 0, -rr + 5); g.restore(); a += ws[i] / rr; });
    const engrave = (fn) => { g.save(); g.translate(1.2, 1.2); g.strokeStyle = 'rgba(255,245,210,0.6)'; g.fillStyle = 'rgba(255,245,210,0.6)'; fn(); g.restore(); g.strokeStyle = 'rgba(95,62,12,0.85)'; g.fillStyle = 'rgba(95,62,12,0.85)'; fn(); };
    if (m.icon === 'net') {
      const L = [[c0 - 60, 3], [c0, 4], [c0 + 60, 2]], P = L.map(([x, n]) => Array.from({ length: n }, (_, i) => [x, c0 + (i - (n - 1) / 2) * 34]));
      engrave(() => {
        g.lineWidth = 1.6; g.beginPath();
        for (let l = 0; l < 2; l++) for (const p of P[l]) for (const q of P[l + 1]) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
        g.stroke();
        for (const layer of P) for (const [x, y] of layer) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
      });
    } else {
      engrave(() => {
        g.lineWidth = 3; g.lineCap = 'round';
        for (const ph of [0, Math.PI]) {
          g.beginPath();
          for (let i = 0; i <= 120; i++) { const u = i / 120, x = c0 - 70 + u * 140, y = c0 + Math.sin(u * TAU * 2.5 + ph) * 34 * Math.sin(u * Math.PI); i ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
        }
        g.lineWidth = 1.5;
        for (let i = 1; i < 12; i++) { const u = i / 12, x = c0 - 70 + u * 140, a1 = Math.sin(u * TAU * 2.5) * 34 * Math.sin(u * Math.PI); g.beginPath(); g.moveTo(x, c0 + a1); g.lineTo(x, c0 - a1); g.stroke(); }
      });
    }
    return cv;
  }
  let imgs = [];
  function prep() { imgs = MED.map(medal); }
  function audio(t0) { MED.forEach((_, i) => sfx(t0 + 1.0 + i * 0.5, 'bell', { f: i ? 1.5 : 1 })); }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    text(c, 'THE 2024 NOBEL PRIZES', VCX, 205, { f: font(600, 15, F.mono), color: rgba(GOLD, 1), align: 'center', sp: 6, alpha: 0.85 * inP });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const x = VCX + (hash(i, 7) - 0.5) * 950, y = 180 + hash(i, 8) * 650 - ((lt * (15 + 25 * hash(i, 9))) % 80);
      glow(c, x, y, 4 + 7 * hash(i, 10), GOLD, inP * Math.max(0, Math.sin(lt * (2 + hash(i, 11) * 3) + i * 1.7)) * 0.7);
    }
    c.restore();
    MED.forEach((m, i) => {
      const p = E.out3(prog(0.3 + i * 0.5, 1.0 + i * 0.5, lt));
      if (p <= 0) return;
      const sx = Math.max(0.02, Math.abs(Math.cos((1 - p) * Math.PI * 1.5)));
      const y = MY + Math.sin(lt * 1.3 + i) * 5;
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, m.x, y, 260, GOLD, 0.35 * p, false); c.restore();
      c.save();
      c.translate(m.x, y); c.scale(sx, 1);
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 30; c.shadowOffsetY = 14;
      c.drawImage(imgs[i], -170, -170); c.shadowBlur = 0; c.shadowOffsetY = 0;
      const sh = prog(1.25 + i * 0.35, 2.1 + i * 0.35, lt);
      if (sh > 0 && sh < 1) {
        c.beginPath(); c.arc(0, 0, 165, 0, TAU); c.clip();
        const bx = lerp(-260, 260, sh), g = c.createLinearGradient(bx - 60, -170, bx + 60, 170);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,240,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-170, -170, 340, 340);
      }
      c.restore();
      const ta = E.out3(prog(0.9 + i * 0.5, 1.4 + i * 0.5, lt));
      text(c, m.cat, m.x, MY + MR + 58, { f: font(700, 15, F.mono), color: rgba(GOLD, 1), align: 'center', sp: 6, alpha: ta });
      m.names.forEach((nm, j) => text(c, nm, m.x, MY + MR + 96 + j * 32, { f: font(600, 25, F.sans), color: '#fff', align: 'center', alpha: ta }));
      text(c, m.note, m.x, MY + MR + 96 + m.names.length * 32 + 6, { f: font(400, 18, F.body), color: 'rgba(255,236,200,0.7)', align: 'center', alpha: ta });
    });
  }
  return { prep, audio, draw };
})();

/* =================================================== 2025 Reasoning */
VIS.y2025 = (() => {
  const GOLD = [255, 214, 125], CY_ = [140, 220, 255], RED = [255, 120, 120];
  const NODES = [
    { x: 1000, y: 520, t: 0.2 },
    { p: 0, x: 1165, y: 350, t: 0.45, note: 'try small cases' }, { p: 0, x: 1165, y: 520, t: 0.55, note: 'induction on n' }, { p: 0, x: 1165, y: 690, t: 0.65, note: 'contradiction?' },
    { p: 1, x: 1330, y: 290, t: 1.0, dead: 1.7 }, { p: 1, x: 1330, y: 395, t: 1.05, dead: 1.8 },
    { p: 2, x: 1330, y: 485, t: 1.1 }, { p: 2, x: 1330, y: 575, t: 1.15, dead: 1.9 },
    { p: 3, x: 1330, y: 660, t: 1.2, dead: 1.75 }, { p: 3, x: 1330, y: 755, t: 1.25, dead: 1.85 },
    { p: 6, x: 1495, y: 410, t: 1.9, dead: 2.5, note: 'mod 4 ?' }, { p: 6, x: 1495, y: 500, t: 2.0, note: 'a² + b² ≥ 2ab' }, { p: 6, x: 1495, y: 590, t: 2.1, dead: 2.6 },
    { p: 11, x: 1665, y: 500, t: 2.75, goal: true },
  ];
  const PATH = [0, 2, 6, 11, 13], LIGHT = 3.0, BADGE = 4.0;
  function audio(t0) {
    NODES.forEach(n => sfx(t0 + n.t, 'dot', { v: 0.45 }));
    sfx(t0 + LIGHT + 0.75, 'chime'); sfx(t0 + BADGE, 'bell', { f: 2 });
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    text(c, 'REASONING  ·  EXPLORE, CHECK, BACKTRACK', VCX, 206, { f: font(600, 14, F.mono), color: rgba(CY_, 1), align: 'center', sp: 3, alpha: 0.8 * inP * (1 - prog(BADGE - 0.3, BADGE, lt)) });
    const pathLit = i => { const k = PATH.indexOf(i); return k < 0 ? 0 : E.out2(prog(LIGHT + k * 0.2, LIGHT + k * 0.2 + 0.25, lt)); };
    c.lineCap = 'round';
    NODES.forEach((n, i) => {
      if (n.p === undefined) return;
      const P = NODES[n.p], g = E.out3(prog(n.t - 0.2, n.t + 0.1, lt));
      if (g <= 0) return;
      const dead = n.dead && lt > n.dead ? prog(n.dead, n.dead + 0.3, lt) : 0, lit = Math.min(pathLit(i), pathLit(n.p));
      c.strokeStyle = rgba(mixc(mixc(CY_, RED, dead * 0.8), GOLD, lit), 0.55 - dead * 0.35 + lit * 0.45);
      c.lineWidth = 2 + lit * 2.5;
      c.beginPath(); c.moveTo(P.x, P.y); c.bezierCurveTo(P.x + 70, P.y, n.x - 70, n.y, lerp(P.x, n.x, g), lerp(P.y, n.y, g)); c.stroke();
    });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < PATH.length - 1; k++) {
      const a = NODES[PATH[k]], b = NODES[PATH[k + 1]], q = prog(LIGHT + k * 0.2, LIGHT + (k + 1) * 0.2, lt);
      if (q > 0 && q < 1) glow(c, lerp(a.x, b.x, q), lerp(a.y, b.y, q), 40, GOLD, 1);
    }
    c.restore();
    NODES.forEach((n, i) => {
      const g = clamp(E.outBack(prog(n.t, n.t + 0.3, lt)), 0, 1.25);
      if (g <= 0) return;
      const dead = n.dead && lt > n.dead ? prog(n.dead, n.dead + 0.3, lt) : 0, lit = pathLit(i);
      const r = (n.goal ? 26 : i === 0 ? 24 : 11) * g, col = mixc(mixc(CY_, RED, dead * 0.8), GOLD, lit);
      c.fillStyle = 'rgb(8,16,26)'; c.strokeStyle = rgba(col, 1 - dead * 0.5); c.lineWidth = 2.5;
      c.beginPath(); c.arc(n.x, n.y, r, 0, TAU); c.fill(); c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, n.x, n.y, r * 3.5, col, (0.3 + lit * 0.8) * (1 - dead * 0.8)); c.restore();
      if (i === 0) text(c, '?', n.x, n.y + 10, { f: font(700, 28, F.sans), color: '#fff', align: 'center' });
      if (n.goal) text(c, '∎', n.x, n.y + 10, { f: font(700, 26, F.sym), color: lit > 0.5 ? rgba(GOLD, 1) : '#fff', align: 'center' });
      if (dead > 0) text(c, '✕', n.x, n.y + 6, { f: font(700, 14, F.sym), color: rgba(RED, 1), align: 'center', alpha: dead });
      if (n.note) text(c, n.note, n.x, n.y - 22, { f: font(500, 13, F.mono), color: 'rgba(200,230,255,0.6)', align: 'center', alpha: g * (1 - dead * 0.6) });
    });
    const qa = E.out3(prog(LIGHT + 0.85, LIGHT + 1.2, lt));
    text(c, 'Q.E.D.', 1665, 560, { f: font(700, 20, F.sans), color: rgba(GOLD, 1), align: 'center', sp: 3, alpha: qa });
    const ba = E.outBack(prog(BADGE, BADGE + 0.45, lt));
    if (ba > 0) {
      c.save();
      c.translate(VCX, 208); c.scale(clamp(ba, 0, 1.2), clamp(ba, 0, 1.2));
      c.fillStyle = 'rgba(40,30,8,0.9)'; roundRect(c, -250, -30, 500, 60, 30); c.fill();
      c.strokeStyle = rgba(GOLD, 0.9); c.lineWidth = 2; c.stroke();
      const mg = c.createRadialGradient(-213, -6, 2, -212, 0, 18); mg.addColorStop(0, '#fff3c4'); mg.addColorStop(1, '#c8922e');
      c.fillStyle = mg; c.beginPath(); c.arc(-212, 0, 17, 0, TAU); c.fill();
      text(c, 'IMO 2025  ·  GOLD-MEDAL LEVEL', 18, 7, { f: font(700, 19, F.mono), color: rgba(GOLD, 1), align: 'center', sp: 2 });
      c.restore();
    }
    const ag = E.out3(prog(4.3, 4.8, lt));
    text(c, 'AGENTS:   PLAN  →  SEARCH  →  WRITE CODE  →  CHECK  →  DELIVER', VCX, 858, { f: font(600, 14, F.mono), color: 'rgba(200,235,255,0.75)', align: 'center', sp: 2, alpha: ag });
  }
  return { audio, draw };
})();

/* ============================================================ FINALE */
VIS.finale = (() => {
  const CX = W / 2, CY = 455, R = 300;
  const STARS = (() => { const r = rng(120); return Array.from({ length: 420 }, () => [(r() - 0.5) * 2.4, (r() - 0.5) * 1.6, r()]); })();
  const SPH = (() => {
    const n = 560, pts = [], ga = Math.PI * (3 - Math.sqrt(5)), r = rng(121);
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, rad = Math.sqrt(1 - y * y), th = ga * i;
      pts.push({ x: Math.cos(th) * rad, y, z: Math.sin(th) * rad, sx: (r() - 0.5) * 3.2, sy: (r() - 0.5) * 2, sz: r() * 2 - 1, d: r() * 0.7 });
    }
    const pairs = [];
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => [j, (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2]).filter(([j]) => j > i).sort((a, b) => a[1] - b[1]).slice(0, 3);
      for (const [j] of near) pairs.push([i, j]);
    });
    return { pts, pairs };
  })();
  const dist = lt => lt * 0.3 + 1.5 * smooth(prog(0, 2.2, lt));
  function audio() {}
  function draw(c, lt, dur, t, P) {
    // warp through the years
    const warp = prog(0, 0.3, lt) * (1 - prog(1.6, 2.4, lt));
    if (warp > 0) {
      const d = dist(lt), speed = (dist(lt + 0.02) - dist(lt - 0.02)) / 0.04;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let b = 0; b < 3; b++) {
        c.strokeStyle = rgba([170, 205, 255], (0.25 + b * 0.25) * warp); c.lineWidth = 1 + b * 0.8;
        c.beginPath();
        STARS.forEach(([x, y, z0], i) => {
          if (i % 3 !== b) return;
          const z = ((z0 - d) % 1 + 1) % 1 + 0.03, z2 = z + 0.02 + 0.05 * speed;
          c.moveTo(CX + (x / z) * 500, CY + (y / z) * 500); c.lineTo(CX + (x / z2) * 500, CY + (y / z2) * 500);
        });
        c.stroke();
      }
      c.restore();
      YEARS.forEach((s, k) => {
        const z = 0.3 + 0.15 * (k + 1) - 1.3 * lt;
        if (z < 0.06 || z > 1.7) return;
        const a = prog(1.7, 1.3, z) * prog(0.06, 0.2, z) * warp, ang = k * 2.4;
        const x = CX + (Math.cos(ang) * 0.55 / z) * 500, y = CY + (Math.sin(ang) * 0.32 / z) * 500;
        const pal = paletteAt(s.t0 + 1).acc;
        c.save(); c.shadowColor = rgba(pal, 0.9); c.shadowBlur = 25;
        text(c, String(s.year), x, y, { f: font(700, Math.min(600, 46 / z), F.sans), color: rgba(mixc(pal, WHITE, 0.5), 1), align: 'center', base: 'middle', alpha: a });
        c.restore();
      });
    }
    // the sphere: a network of ideas, from one neuron to billions
    const form = E.out3(prog(1.9, 3.4, lt)), links = E.out2(prog(2.6, 3.6, lt));
    const col = prog(6.5, 7.3, lt), fadeAll = 1 - prog(7.35, 7.9, lt);
    if (form > 0 && fadeAll > 0) {
      const yaw = lt * 0.35, pitch = 0.35 + 0.1 * Math.sin(lt * 0.3), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const shrink = 1 - E.in3(col);
      const proj = SPH.pts.map(p => {
        const m = E.out3(clamp((form - p.d * 0.3) / 0.7));
        let x = lerp(p.sx, p.x, m), y = lerp(p.sy, p.y, m), z = lerp(p.sz, p.z, m);
        const X = x * cy - z * sy, Z1 = x * sy + z * cy, Y = y * cp - Z1 * sp, Z = y * sp + Z1 * cp;
        const s = 1400 / (1400 + Z * R * 1.6) * shrink;
        return [CX + X * R * s, CY + Y * R * s, Z, m];
      });
      c.save(); c.globalCompositeOperation = 'lighter';
      const acc = [150, 195, 255];
      if (links > 0) {
        for (let b = 0; b < 4; b++) {
          c.strokeStyle = rgba(acc, (0.06 + b * 0.09) * links * fadeAll); c.lineWidth = 1;
          c.beginPath();
          for (const [i, j] of SPH.pairs) {
            const p = proj[i], q = proj[j], depth = 1 - ((p[2] + q[2]) / 2 + 1) / 2;
            if (Math.min(3, Math.floor(depth * 4)) !== b) continue;
            c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
          }
          c.stroke();
        }
        for (let k = 0; k < 60; k++) {
          const [i, j] = SPH.pairs[(k * 37) % SPH.pairs.length], q = (lt * 0.9 + hash(k, 3)) % 1;
          const a = proj[i], b = proj[j];
          glow(c, lerp(a[0], b[0], q), lerp(a[1], b[1], q), 9, [255, 225, 170], links * fadeAll * (0.5 - a[2] * 0.3));
        }
      }
      for (const p of proj) glow(c, p[0], p[1], 5 + (1 - p[2]) * 3, acc, (0.35 + 0.4 * (1 - p[2]) / 2) * fadeAll * Math.min(1, form * 2));
      glow(c, CX, CY, 260 * (1 - col * 0.6), [120, 160, 255], (0.25 + 0.1 * Math.sin(lt * 3)) * form * fadeAll, false);
      if (col > 0) glow(c, CX, CY, 40 + 160 * Math.sin(col * Math.PI), [220, 235, 255], Math.sin(col * Math.PI) * fadeAll);
      c.restore();
    }
    // the last neuron: a single point of light, as it began
    const last = prog(7.2, 7.4, lt) * (1 - prog(7.6, 7.95, lt));
    if (last > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, CY, 34, [200, 225, 255], last); c.restore(); }
    // closing lines
    const l1 = E.out3(prog(2.3, 2.9, lt)), l2 = E.out3(prog(4.0, 4.6, lt)), out = 1 - E.in2(prog(6.5, 7.1, lt));
    const line = (yr, q, y, a, dim) => {
      if (a <= 0) return;
      c.font = font(500, 18, F.mono); c.letterSpacing = '6px';
      const w1 = c.measureText(yr).width + 34;
      c.font = font(400, 50, F.serif, true); c.letterSpacing = '0px';
      const w2 = c.measureText(q).width, x0 = CX - (w1 + w2) / 2;
      text(c, yr, x0, y - 6, { f: font(500, 18, F.mono), color: 'rgb(160,200,255)', sp: 6, alpha: a * dim });
      c.save(); c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 20;
      text(c, q, x0 + w1, y + (1 - a) * 16, { f: font(400, 50, F.serif, true), color: '#ffffff', alpha: a * dim });
      c.restore();
    };
    line('1950', '“Can machines think?”', 860, l1 * out, 1 - 0.45 * l2);
    line('2026', '“What will we build together?”', 935, l2 * out, 1);
  }
  return { audio, draw };
})();
