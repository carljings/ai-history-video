'use strict';
/* scenes1.js — intro, act title cards and Act I (1843–1956).
   Each entry: { prep?(), audio?(t0), cam?(lt, dur), draw(c, lt, dur, t, P) }
   c = scene layer context, lt = seconds since the scene started, P = palette. */

const VIS = {};

/* ============================================================ INTRO 0–14 s */
VIS.intro = (() => {
  const CX = W / 2, CY = 455;
  let pts = [], segs = [], NB = 5;
  function prep() {
    // a dendritic "neuron" that grows out of a single spark
    const r = rng(1843);
    segs = [];
    function branch(x, y, ang, len, depth, t0) {
      let px = x, py = y, t = t0;
      const steps = Math.max(3, Math.round(len / 24));
      for (let k = 0; k < steps; k++) {
        ang += (r() - 0.5) * 0.55;
        const nx = px + (Math.cos(ang) * len) / steps, ny = py + (Math.sin(ang) * len) / steps * 0.78;
        const dt = 0.045 + 0.02 * depth;
        segs.push([px, py, nx, ny, t, t + dt, depth]);
        px = nx; py = ny; t += dt;
        if (depth < 3 && r() < 0.18) branch(px, py, ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5), len * (0.4 + r() * 0.2), depth + 2, t);
      }
      if (depth < 4) {
        branch(px, py, ang - 0.35 - r() * 0.35, len * 0.62, depth + 1, t);
        branch(px, py, ang + 0.35 + r() * 0.35, len * 0.62, depth + 1, t);
      }
    }
    for (let i = 0; i < 7; i++) branch(CX, CY, (i / 7) * TAU + r() * 0.4, 230 + r() * 110, 0, 1.25 + r() * 0.25);
    // particles: born on the branches, they fly into the letters "AI"
    const off = makeCanvas(W, H), o = off.getContext('2d');
    o.fillStyle = '#fff'; o.textAlign = 'center';
    o.font = font(700, 440); o.letterSpacing = '36px';
    o.fillText('AI', CX + 18, 610);
    const d = o.getImageData(0, 0, W, H).data;
    pts = [];
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x += 6) {
      if (d[(y * W + x) * 4 + 3] > 140) pts.push({ tx: x + (r() - 0.5) * 3, ty: y + (r() - 0.5) * 3 });
    }
    for (const p of pts) {
      const s = segs[(r() * segs.length) | 0];
      p.sx = s[2]; p.sy = s[3]; p.born = s[5];
      p.del = 3.75 + r() * 0.75; p.dur = 5.95 - p.del - r() * 0.15;
      p.z = r(); p.ph = r() * TAU; p.sw = r() - 0.5; p.ex = 0.6 + r() * 0.9;
    }
  }
  function audio(t0) {
    sfx(t0 + 0.8, 'thump', { v: 0.8 }); sfx(t0 + 1.05, 'thump', { v: 0.55 });
    sfx(t0 + 2.8, 'thump', { v: 0.8 }); sfx(t0 + 3.05, 'thump', { v: 0.55 });
    hit(t0 + 6.0, 1.1); flash(t0 + 6.0, 0.3, [170, 205, 255]);
    hit(t0 + 11.9, 0.7);
  }
  function draw(c, lt) {
    const zoom = curve([[0, 1.3], [5.8, 1.0], [11.4, 1.05], [14, 1.9]], lt);
    c.save();
    c.translate(CX, CY); c.scale(zoom, zoom); c.translate(-CX, -CY);

    // the first spark, beating like a heart
    const beat = t0 => Math.exp(-Math.max(0, lt - t0) * 9) * (lt >= t0 ? 1 : 0);
    const spark = E.out2(prog(0.3, 0.9, lt)) * (1 - prog(4.2, 5.2, lt));
    if (spark > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const b = beat(0.8) + 0.6 * beat(1.05) + beat(2.8) + 0.6 * beat(3.05);
      glow(c, CX, CY, 26 + 30 * b, [160, 200, 255], spark);
      glow(c, CX, CY, 140 + 80 * b, [60, 110, 255], 0.35 * spark, false);
      c.restore();
    }
    // the tree grows, then dissolves into the particles
    const treeA = 1 - prog(4.1, 5.3, lt);
    if (treeA > 0 && lt > 1.2) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let dp = 0; dp < NB; dp++) {
        c.strokeStyle = rgba([120, 170, 255], treeA * (0.75 - dp * 0.12)); c.lineWidth = 2.8 - dp * 0.45;
        c.beginPath();
        for (const s of segs) {
          if (Math.min(4, s[6]) !== dp || s[4] >= lt) continue;
          const p = clamp((lt - s[4]) / (s[5] - s[4]));
          c.moveTo(s[0], s[1]); c.lineTo(lerp(s[0], s[2], p), lerp(s[1], s[3], p));
        }
        c.stroke();
      }
      for (const s of segs) if (lt > s[4] && lt < s[5] + 0.25) glow(c, s[2], s[3], 12, [170, 210, 255], treeA * (1 - prog(s[5], s[5] + 0.25, lt)));
      c.restore();
    }
    // particles
    const ex = E.in3(prog(11.75, 13.6, lt)), exFade = 1 - E.in2(prog(12.6, 13.8, lt));
    if (lt > 3.2 && exFade > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const p of pts) {
        const born = prog(3.2, 3.9, lt);
        const m = E.io3(prog(p.del, p.del + p.dur, lt));
        const ang = (1 - m) * 1.4 * (p.sw > 0 ? 1 : -1);
        let x = lerp(p.sx, p.tx, m), y = lerp(p.sy, p.ty, m);
        const dx0 = x - CX, dy0 = y - CY, ca = Math.cos(ang * Math.sin(m * Math.PI)), sa = Math.sin(ang * Math.sin(m * Math.PI));
        x = CX + dx0 * ca - dy0 * sa; y = CY + dx0 * sa + dy0 * ca;
        let streak = 0;
        if (ex > 0) {
          const dx = p.tx - CX, dy = p.ty - CY + 0.001, dl = Math.hypot(dx, dy) + 1;
          x += (dx / dl) * ex * 1500 * p.ex; y += (dy / dl) * ex * 1500 * p.ex;
          streak = ex * 90 * p.ex;
        }
        const tw = m > 0.97 ? 0.72 + 0.28 * Math.sin(lt * 5 + p.ph) : 0.85;
        const size = (2.2 + p.z * 2.4) * (1 + (1 - m) * 1.0);
        const a = born * tw * (0.45 + 0.55 * m) * exFade;
        if (streak > 2) {
          const dx = p.tx - CX, dy = p.ty - CY, dl = Math.hypot(dx, dy) + 1;
          c.strokeStyle = rgba([150, 200, 255], a * 0.6); c.lineWidth = 1.5 + p.z * 2;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x - (dx / dl) * streak, y - (dy / dl) * streak); c.stroke();
        }
        glow(c, x, y, size * 3.2, m > 0.5 ? [150, 200, 255] : [120, 140, 255], a);
      }
      c.restore();
    }
    // soft backing glow once the letters lock
    const lock = E.out3(prog(5.85, 6.4, lt)), gone = E.in2(prog(11.6, 12.4, lt));
    if (lock > 0 && gone < 1) {
      c.save();
      c.font = font(700, 440); c.letterSpacing = '36px'; c.textAlign = 'center';
      c.globalAlpha = 0.6 * lock * (1 - gone);
      c.shadowColor = 'rgba(70,130,255,1)'; c.shadowBlur = 90;
      c.fillStyle = 'rgba(30,60,160,0.35)';
      c.fillText('AI', CX + 18, 610);
      c.restore();
    }
    c.restore();

    // opening line
    const la = E.out3(prog(0.9, 1.7, lt)) * (1 - E.in2(prog(3.3, 3.9, lt)));
    if (la > 0) {
      c.save(); c.shadowColor = 'rgba(80,140,255,0.8)'; c.shadowBlur = 20;
      text(c, '一切，始于一个梦想……', CX, 790 + (1 - la) * 12, { f: font(400, 38, F.zhs), color: '#eef3ff', align: 'center', sp: 8, alpha: la });
      c.restore();
      text(c, 'IT ALL BEGAN WITH A DREAM', CX, 836, { f: font(500, 15, F.mono), color: 'rgb(150,185,255)', align: 'center', sp: 8, alpha: la * 0.8 });
    }
    // anamorphic lens flare as the letters lock
    const fl = lt < 6 ? prog(5.85, 6.0, lt) : Math.exp(-(lt - 6) * 2.2);
    if (fl > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.translate(CX, CY); c.scale(9, 0.22);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 120);
      g.addColorStop(0, rgba([210, 230, 255], 0.9 * fl)); g.addColorStop(0.3, rgba([90, 150, 255], 0.35 * fl)); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-120, -120, 240, 240);
      c.restore();
    }
    // title
    const out = 1 - E.in2(prog(11.3, 11.9, lt));
    const ta = E.out3(prog(6.3, 7.3, lt)) * out;
    if (ta > 0) {
      const sp = lerp(60, 26, E.out3(prog(6.3, 8.6, lt)));
      c.save(); c.shadowColor = 'rgba(60,120,255,0.9)'; c.shadowBlur = 30;
      text(c, '人工智能简史', CX, 790, { f: font(700, 84, F.zh), color: '#ffffff', align: 'center', sp, alpha: ta });
      c.restore();
      const ea = E.out3(prog(7.0, 7.9, lt)) * out;
      text(c, 'THE HISTORY OF ARTIFICIAL INTELLIGENCE', CX, 846, { f: font(600, 24), align: 'center', sp: lerp(24, 11, E.out3(prog(7.0, 9.0, lt))), color: '#dfe8ff', alpha: ea * 0.95 });
      const ba = E.out3(prog(7.7, 8.6, lt)) * out;
      const lw = 260 * E.out3(prog(7.7, 8.8, lt));
      c.strokeStyle = rgba([150, 190, 255], 0.5 * ba); c.lineWidth = 1;
      c.beginPath(); c.moveTo(CX - lw, 876); c.lineTo(CX + lw, 876); c.stroke();
      text(c, '1843 — 2026  ·  183 年  ·  5 分钟', CX, 910, { f: font(500, 19, F.mono), color: 'rgb(160,195,255)', align: 'center', sp: 5, alpha: ba * 0.9 });
    }
  }
  return { prep, audio, draw };
})();

/* ===================================================== ACT TITLE CARDS */
function actCard() {
  const TX = makeCanvas(W, 320), tx = TX.getContext('2d');
  const STARS = (() => { const r = rng(77); return Array.from({ length: 160 }, () => [(r() - 0.5) * 2.6, (r() - 0.5) * 1.6, r()]); })();
  // travel along the tunnel: fast arrival, slow drift, fast exit
  const travel = lt => 1.6 * (1 - Math.exp(-lt * 2.6)) + 0.22 * lt + 1.4 * Math.pow(Math.max(0, lt - 3.0), 2);
  function draw(c, lt, dur, t, P, s) {
    const acc = s.pal.acc, CX = W / 2, CY = H / 2;
    const d = travel(lt), speed = (travel(lt + 0.02) - travel(lt - 0.02)) / 0.04;
    c.save(); c.globalCompositeOperation = 'lighter';
    // tunnel of rounded frames rushing past
    const N = 16;
    for (let k = 0; k < N; k++) {
      const z = (((k / N - d * 0.5) % 1) + 1) % 1 * 3 + 0.12;
      const sc = 0.55 / z, a = clamp((3.1 - z) / 1.2) * clamp((z - 0.12) / 0.25);
      if (a <= 0.01) continue;
      const w = W * 0.62 * sc, h = H * 0.62 * sc;
      c.strokeStyle = rgba(acc, 0.28 * a); c.lineWidth = Math.max(1, 3 * sc);
      roundRect(c, CX - w / 2, CY - h / 2, w, h, 40 * sc); c.stroke();
    }
    // star streaks
    c.lineCap = 'round';
    for (let b = 0; b < 2; b++) {
      c.strokeStyle = rgba(mixc(acc, WHITE, 0.5), 0.35 + b * 0.3); c.lineWidth = 1 + b;
      c.beginPath();
      STARS.forEach(([x, y, z0], i) => {
        if (i % 2 !== b) return;
        const z = ((z0 - d * 0.35) % 1 + 1) % 1 + 0.04, z2 = z + 0.01 + 0.03 * speed;
        c.moveTo(CX + (x / z) * 420, CY + (y / z) * 420); c.lineTo(CX + (x / z2) * 420, CY + (y / z2) * 420);
      });
      c.stroke();
    }
    glow(c, CX, CY, 520, acc, 0.22, false);
    c.restore();

    // giant roman numeral, outlined, drifting
    const na = E.out2(prog(0.05, 0.6, lt));
    c.save();
    c.translate(CX, CY + 40); c.scale(1 + 0.08 * lt, 1 + 0.08 * lt);
    c.font = font(700, 560, F.serif); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = rgba(acc, 0.18 * na); c.lineWidth = 2;
    c.strokeText(s.num, 0, 0);
    c.restore();

    // act number
    const a1 = E.out3(prog(0.15, 0.6, lt));
    biLabel(c, s.zhNum, 'ACT ' + s.num, CX, 392 + (1 - a1) * 10, { col: rgba(mixc(acc, WHITE, 0.35), 1), alpha: a1, zs: 26, es: 15, gap: 22 });
    // the act name: characters fly in from the depth, then a light sweep crosses them
    tx.setTransform(1, 0, 0, 1, 0, 0);
    tx.clearRect(0, 0, W, 320);
    tx.font = font(700, 150, F.zh); tx.letterSpacing = '0px'; tx.textBaseline = 'alphabetic'; tx.textAlign = 'center';
    const chars = [...s.zhName], gap = 24;
    const ws = chars.map(ch => tx.measureText(ch).width), total = ws.reduce((x, y) => x + y, 0) + gap * (chars.length - 1);
    let x = CX - total / 2;
    chars.forEach((ch, i) => {
      const p = E.out3(prog(0.3 + i * 0.09, 1.05 + i * 0.09, lt));
      if (p > 0) {
        const sc = lerp(2.8, 1, p);
        tx.save();
        tx.translate(x + ws[i] / 2, 200); tx.scale(sc, sc);
        tx.globalAlpha = p; tx.fillStyle = '#fff';
        tx.fillText(ch, 0, 50);
        tx.restore();
      }
      x += ws[i] + gap;
    });
    const sw = prog(1.2, 2.3, lt);
    if (sw > 0 && sw < 1) {
      tx.globalCompositeOperation = 'source-atop';
      const bx = lerp(CX - total / 2 - 200, CX + total / 2 + 200, E.io2(sw)), g = tx.createLinearGradient(bx - 120, 0, bx + 120, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, rgba(mixc(acc, WHITE, 0.3), 1)); g.addColorStop(1, 'rgba(255,255,255,0)');
      tx.fillStyle = g; tx.fillRect(0, 0, W, 320);
      tx.globalCompositeOperation = 'source-over';
    }
    c.save();
    c.shadowColor = rgba(acc, 0.9); c.shadowBlur = 40;
    c.drawImage(TX, 0, 400);
    c.restore();
    // English name + years
    const ea = E.out3(prog(0.8, 1.5, lt));
    text(c, s.name, CX, 710, { f: font(600, 30), color: '#eef2ff', align: 'center', sp: lerp(30, 14, E.out3(prog(0.8, 2.4, lt))), alpha: ea });
    const ya = E.out3(prog(1.2, 1.9, lt)), lw = 180 * ya;
    c.strokeStyle = rgba(acc, 0.6 * ya); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(CX - 150 - lw, 757); c.lineTo(CX - 150, 757); c.moveTo(CX + 150, 757); c.lineTo(CX + 150 + lw, 757); c.stroke();
    text(c, s.span, CX, 764, { f: font(500, 20, F.mono), color: rgba(mixc(acc, WHITE, 0.4), 1), align: 'center', sp: 4, alpha: ya });
  }
  return { draw };
}
for (const id of ['act1', 'act2', 'act3', 'act4']) {
  const card = actCard();
  VIS[id] = { draw: (c, lt, dur, t, P) => card.draw(c, lt, dur, t, P, SC[id]) };
}

/* ============================================ 1843 Lovelace & the Engine */
VIS.y1843 = (() => {
  const BRASS = [255, 200, 130], MOD = 4.6;
  // a meshing gear train: [parent, direction from parent, teeth]
  const TRAIN = [[-1, 0, 36], [0, -0.35, 20], [1, 0.9, 28], [0, 2.3, 14], [0, -2.4, 24], [2, 2.0, 16]];
  const G = [];
  TRAIN.forEach(([p, dir, n], i) => {
    const r = n * MOD;
    if (p < 0) G.push({ x: 1290, y: 445, r, n, dir: 0, p });
    else { const q = G[p]; G.push({ x: q.x + (q.r + r) * Math.cos(dir), y: q.y + (q.r + r) * Math.sin(dir), r, n, dir, p }); }
  });
  const BACK = [[1000, 700, 40, 0.55], [1760, 220, 30, 0.5], [1520, 860, 34, 0.45], [980, 180, 26, 0.5]];
  const OPS = [
    ['1', '×', 'V₂ × V₃', 'V₄, V₅, V₆', '= 2n'],
    ['2', '−', 'V₄ − V₁', 'V₄', '= 2n − 1'],
    ['3', '+', 'V₅ + V₁', 'V₅', '= 2n + 1'],
    ['4', '÷', 'V₄ ÷ V₅', 'V₁₁', '= (2n−1)/(2n+1)'],
    ['5', '÷', 'V₁₁ ÷ V₂', 'V₁₁', '= ½ · (2n−1)/(2n+1)'],
    ['6', '−', 'V₁₃ − V₁₁', 'V₁₃', '= −½ · (2n−1)/(2n+1)'],
  ];
  const OP0 = 3.0, OPD = 0.5, RES = OP0 + OPS.length * OPD + 0.2, QT = 6.9;
  let spr = {}, back = [];
  function gearSprite(n, style, blur = 0) {
    const r = n * MOD, ha = MOD * 1.05, hd = MOD * 1.25, R = Math.ceil(r + ha + 6 + blur * 2), S = R * 2;
    const cv = makeCanvas(S, S), g = cv.getContext('2d'), P = TAU / n;
    g.translate(R, R);
    if (blur) g.filter = `blur(${blur}px)`;
    const tooth = [];
    for (let k = 0; k < n; k++) {
      const a = k * P;
      for (const [rad, da] of [[r - hd, -0.3], [r, -0.24], [r + ha, -0.13], [r + ha, 0.13], [r, 0.24], [r - hd, 0.3]]) tooth.push([Math.cos(a + da * P) * rad, Math.sin(a + da * P) * rad]);
    }
    g.beginPath(); tooth.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    const gr = g.createRadialGradient(0, 0, r * 0.1, 0, 0, r + ha);
    if (style === 'front') { gr.addColorStop(0, '#fbe2a0'); gr.addColorStop(0.45, '#d8a94c'); gr.addColorStop(0.8, '#a8762a'); gr.addColorStop(1, '#6e4a14'); }
    else { gr.addColorStop(0, '#6a4c22'); gr.addColorStop(1, '#2e2010'); }
    g.fillStyle = gr; g.fill();
    g.strokeStyle = style === 'front' ? 'rgba(60,35,8,0.9)' : 'rgba(20,12,4,0.8)'; g.lineWidth = 1.5; g.stroke();
    // spoked windows
    const spokes = n > 24 ? 6 : n > 16 ? 5 : 4, rin = r * 0.3, rout = r - hd - Math.max(8, r * 0.12), sw = 0.16 + 0.1 * (spokes === 4);
    g.save(); g.globalCompositeOperation = 'destination-out';
    if (rout > rin + 8) for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * TAU + sw, a1 = ((k + 1) / spokes) * TAU - sw;
      g.beginPath(); g.arc(0, 0, rout, a0, a1); g.arc(0, 0, rin, a1, a0, true); g.closePath(); g.fill();
    }
    g.restore();
    g.strokeStyle = style === 'front' ? 'rgba(255,236,180,0.55)' : 'rgba(150,110,60,0.35)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(0, 0, rout + 3, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, 0, rin - 3, 0, TAU); g.stroke();
    const hub = g.createRadialGradient(-4, -4, 1, 0, 0, rin * 0.7);
    hub.addColorStop(0, style === 'front' ? '#fff0c0' : '#8a6a3a'); hub.addColorStop(1, style === 'front' ? '#8a5e1c' : '#2a1c0c');
    g.fillStyle = hub; g.beginPath(); g.arc(0, 0, rin * 0.62, 0, TAU); g.fill();
    g.fillStyle = 'rgba(30,18,4,0.9)'; g.beginPath(); g.arc(0, 0, rin * 0.18, 0, TAU); g.fill();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.beginPath(); g.arc(Math.cos(a) * rin * 0.42, Math.sin(a) * rin * 0.42, 2.2, 0, TAU); g.fill(); }
    return { cv, R };
  }
  let paper = null, qLines = [];
  function prep() {
    for (const q of G) if (!spr[q.n]) spr[q.n] = gearSprite(q.n, 'front');
    back = BACK.map(([x, y, n, s]) => ({ x, y, n, s, sp: gearSprite(n, 'back', 5) }));
    spr.fg = gearSprite(44, 'front', 14);
    // Note G panel
    paper = makeCanvas(640, 380);
    const g = paper.getContext('2d'), r = rng(43);
    const gr = g.createLinearGradient(0, 0, 640, 380);
    gr.addColorStop(0, '#f1e6cc'); gr.addColorStop(1, '#d9c8a2');
    g.fillStyle = gr; g.fillRect(0, 0, 640, 380);
    const id = g.getImageData(0, 0, 640, 380), dd = id.data;
    for (let i = 0; i < dd.length; i += 4) { const nz = (r() - 0.5) * 14; dd[i] += nz; dd[i + 1] += nz; dd[i + 2] += nz * 0.9; }
    g.putImageData(id, 0, 0);
    const vg = g.createRadialGradient(320, 190, 120, 320, 190, 420);
    vg.addColorStop(0, 'rgba(110,70,20,0)'); vg.addColorStop(1, 'rgba(110,70,20,0.35)');
    g.fillStyle = vg; g.fillRect(0, 0, 640, 380);
    g.strokeStyle = 'rgba(60,40,15,0.55)'; g.lineWidth = 1;
    g.strokeRect(18, 18, 604, 344);
    g.fillStyle = 'rgb(35,22,8)'; g.font = font(600, 17, F.serif, true); g.textAlign = 'center';
    g.fillText('Diagram for the computation by the Engine of the Numbers of Bernoulli', 320, 48);
    g.font = font(700, 16, F.zh); g.fillText('注释 G · 伯努利数计算图表（节选）', 320, 74);
    g.beginPath(); g.moveTo(34, 86); g.lineTo(606, 86); g.stroke();
    lctx.font = font(400, 30, F.zhs); lctx.letterSpacing = '2px';
    qLines = wrapZh(lctx, '“分析机或许能创作出任意复杂、任意长度的精妙乐曲。”', 820);
  }
  // gear angles: continuous turning plus a mechanical step for every operation
  const phase0 = lt => 0.22 * lt + OPS.reduce((s, _, k) => s + 0.45 * E.io3(prog(OP0 + k * OPD, OP0 + k * OPD + 0.3, lt)), 0);
  function angles(lt) {
    const a = [phase0(lt)];
    for (let i = 1; i < G.length; i++) {
      const q = G[i], pa = G[q.p], th = q.dir;
      a.push(th + Math.PI + Math.PI / q.n - (a[q.p] - th) * (pa.n / q.n));
    }
    return a;
  }
  function audio(t0) {
    OPS.forEach((_, k) => sfx(t0 + OP0 + k * OPD, 'clack', { v: 0.9 }));
    for (let k = 0; k < 6; k++) sfx(t0 + 0.5 + k * 0.4, 'tick', { v: 0.3 });
    sfx(t0 + RES, 'chime');
    sfx(t0 + QT, 'shimmer', { dur: 1.5 });
  }
  function cam(lt) { return { x: lerp(40, -30, E.io2(lt / 10)), z: 1.02, push: 0.05 }; }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.9, lt));
    const dimG = 1 - 0.55 * E.io2(prog(2.5, 3.1, lt)) * (1 - E.io2(prog(QT - 0.6, QT, lt))) - 0.35 * E.io2(prog(QT - 0.3, QT + 0.6, lt));
    const ang = angles(lt);
    // blurred background gears (depth)
    for (const b of back) {
      c.save(); c.globalAlpha = 0.7 * inP;
      c.translate(b.x + (lt - 5) * 6 * b.s, b.y); c.rotate(lt * 0.3 * (b.n % 2 ? 1 : -1)); c.scale(b.s * 2.2, b.s * 2.2);
      c.drawImage(b.sp.cv, -b.sp.R, -b.sp.R);
      c.restore();
    }
    // the gear train
    c.save();
    c.globalAlpha = inP * dimG;
    G.forEach((q, i) => {
      const s = spr[q.n], drop = (1 - E.out3(prog(0.05 + i * 0.08, 0.75 + i * 0.08, lt))) * 60;
      c.save(); c.translate(q.x, q.y - drop); c.rotate(ang[i]);
      c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
      c.drawImage(s.cv, -s.R, -s.R);
      c.restore();
    });
    // one warm key light over the whole mechanism
    c.globalCompositeOperation = 'source-atop';
    const lg = c.createLinearGradient(1000, 150, 1750, 850);
    lg.addColorStop(0, 'rgba(255,240,200,0.28)'); lg.addColorStop(0.5, 'rgba(255,220,160,0)'); lg.addColorStop(1, 'rgba(20,10,0,0.45)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
    c.restore();
    // out-of-focus foreground gear
    c.save(); c.globalAlpha = 0.85 * inP;
    c.translate(1830 - lt * 6, 930); c.rotate(-lt * 0.25);
    c.drawImage(spr.fg.cv, -spr.fg.R, -spr.fg.R);
    c.restore();
    text(c, '分析机 · 查尔斯·巴贝奇设计', VCX, 150, { f: font(700, 18, F.zh), color: rgba(BRASS, 1), align: 'center', sp: 4, alpha: 0.9 * inP * (1 - prog(QT - 0.4, QT, lt)) });
    text(c, 'THE ANALYTICAL ENGINE  ·  CHARLES BABBAGE', VCX, 176, { f: font(600, 12, F.mono), color: rgba(BRASS, 0.8), align: 'center', sp: 4, alpha: 0.9 * inP * (1 - prog(QT - 0.4, QT, lt)) });

    // Note G: the program, one operation per turn of the engine
    const pa = E.out3(prog(2.5, 3.1, lt)) * (1 - E.in3(prog(QT - 0.5, QT, lt)));
    if (pa > 0) {
      c.save();
      c.translate(VCX, 470 + (1 - pa) * 80); c.rotate(lerp(-0.08, -0.025, pa)); c.scale(lerp(0.85, 1, pa), lerp(0.85, 1, pa));
      c.globalAlpha = pa;
      c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 20;
      c.drawImage(paper, -320, -190);
      c.shadowBlur = 0; c.shadowOffsetY = 0;
      OPS.forEach((op, k) => {
        const p = E.out3(prog(OP0 + k * OPD, OP0 + k * OPD + 0.3, lt));
        if (p <= 0) return;
        const y = -190 + 122 + k * 36, ink = 'rgb(28,16,4)';
        const cur = lt >= OP0 + k * OPD && lt < OP0 + (k + 1) * OPD;
        if (cur) { c.fillStyle = 'rgba(255,190,80,0.35)'; c.fillRect(-300, y - 23, 600 * p, 32); }
        c.globalAlpha = pa * p;
        text(c, op[0], -290, y, { f: font(600, 19, F.mono), color: ink });
        text(c, op[1], -258, y, { f: font(700, 24, F.serif), color: ink });
        text(c, op[2], -222, y, { f: font(600, 23, F.serif, true), color: ink });
        text(c, '→ ' + op[3], -86, y, { f: font(600, 23, F.serif, true), color: ink });
        text(c, op[4], 86, y, { f: font(600, 18, F.serif), color: 'rgb(110,50,10)' });
        c.globalAlpha = pa;
      });
      const rp = E.outBack(prog(RES, RES + 0.4, lt));
      if (rp > 0) {
        c.save(); c.translate(160, 150); c.scale(clamp(rp, 0, 1.2), clamp(rp, 0, 1.2));
        c.fillStyle = 'rgba(120,30,20,0.9)'; roundRect(c, -118, -26, 236, 44, 8); c.fill();
        text(c, 'B₇ = −1/30', 0, 7, { f: font(700, 24, F.serif), color: '#fff3dc', align: 'center' });
        c.restore();
      }
      c.restore();
    }
    // the prophecy: music from a machine
    const qa = E.out3(prog(QT, QT + 0.8, lt));
    if (qa > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const born = QT + hash(i, 5) * 2.5, u = (lt - born) / 2.6;
        if (u <= 0 || u >= 1) continue;
        const g = G[i % G.length], x = g.x + Math.sin(u * 5 + i) * 30 + (hash(i, 6) - 0.5) * g.r, y = g.y - u * 320;
        c.globalAlpha = Math.sin(Math.PI * u) * 0.9;
        text(c, i % 3 ? '♪' : '♫', x, y, { f: font(400, 26 + hash(i, 7) * 18, F.sym), color: '#ffe1a8', align: 'center' });
      }
      c.restore();
      c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 24;
      c.font = font(400, 30, F.zhs); c.letterSpacing = '2px'; c.fillStyle = '#fff6e4';
      const qy = 420 - (qLines.length - 1) * 24;
      qLines.forEach((line, i) => {
        c.font = font(400, 30, F.zhs);
        const w = line.reduce((s, tk) => s + c.measureText(tk).width, 0);
        drawTokens(c, [line], VCX - w / 2, qy + i * 50, 50, QT + 0.1 + i * 0.3, lt, { stagger: 0.035, dur: 0.6 });
      });
      text(c, '“…might compose elaborate and scientific pieces of music of any degree of complexity or extent.”', VCX, qy + qLines.length * 50 + 14,
        { f: font(400, 19, F.serif, true), color: 'rgba(255,236,205,0.85)', align: 'center', alpha: E.out3(prog(QT + 0.9, QT + 1.6, lt)) });
      text(c, '— 艾达·洛芙莱斯  ADA LOVELACE, 1843', VCX, qy + qLines.length * 50 + 60,
        { f: font(600, 15, F.mono), color: rgba(BRASS, 1), align: 'center', sp: 3, alpha: E.out3(prog(QT + 1.3, QT + 2.0, lt)) });
      c.restore();
    }
  }
  return { prep, audio, cam, draw };
})();

/* ============================================ 1936 the Turing machine */
VIS.y1936 = (() => {
  const C = [130, 225, 245], CW = [220, 250, 255], HOT = [255, 210, 120];
  const R = 6.2, RISE = 0.2, F_ = 950;
  const STEPS = [];
  let T_END = 0;
  (function simulate() {
    const tape = new Map([[0, 1], [1, 0], [2, 1], [3, 1]]);
    let pos = 0, state = 'R', t = 1.3, k = 0;
    while (t < 9.3) {
      const d = lerp(0.36, 0.16, clamp(k / 30)), sym = tape.has(pos) ? tape.get(pos) : -1;
      let write = null, move = 1, next = state;
      if (state === 'R') { if (sym === -1) { move = -1; next = 'C'; } }
      else { if (sym === 1) { write = 0; move = -1; } else { write = 1; move = 1; next = 'R'; } }
      if (write !== null) tape.set(pos, write);
      STEPS.push({ t, d, pos, write, move, state, next, snap: new Map(tape) });
      pos += move; state = next; t += d; k++;
    }
    T_END = t;
  })();
  const INITIAL = new Map([[0, 1], [1, 0], [2, 1], [3, 1]]);
  function stateAt(lt) {
    let k = -1;
    for (let i = 0; i < STEPS.length; i++) if (STEPS[i].t <= lt) k = i;
    if (k < 0) return { head: 0, tape: INITIAL, step: null, state: 'R' };
    const s = STEPS[k], m = E.io2(prog(s.t + s.d * 0.3, s.t + s.d * 0.95, lt));
    return { head: s.pos + s.move * m, tape: s.snap, step: s, state: m > 0.5 ? s.next : s.state };
  }
  function audio(t0) {
    for (const s of STEPS) sfx(t0 + s.t, s.write !== null ? 'clack' : 'tick', { v: s.write !== null ? 0.6 : 0.35 });
  }
  function camAt(lt) {
    return {
      D: curve([[0, 3.4], [1.3, 5.0], [6.0, 5.6], [9.6, 19]], lt),
      yaw: curve([[0, 0.3], [6.0, 0.06], [9.8, -0.5]], lt),
      pitch: curve([[0, 0.1], [6.0, 0.14], [9.8, 0.55]], lt),
    };
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    const { head, tape, step, state } = stateAt(lt);
    const { D, yaw, pitch } = camAt(lt), cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const SX = VCX, SY = VCY + 60;
    // position along the helical tape; s = distance from the head
    const P = (s, v) => {
      const th = s / R, x = R * Math.sin(th), z = R * (1 - Math.cos(th)), y = -s * RISE + v;
      const X = x * cy_ + z * sy_, Z1 = -x * sy_ + z * cy_;
      const Y = y * cp - Z1 * sp, Z = y * sp + Z1 * cp + D;
      return [SX + (F_ * X) / Z, SY - (F_ * Y) / Z, Z];
    };
    const cells = [];
    const n0 = Math.floor(head);
    for (let n = n0 - 46; n <= n0 + 46; n++) {
      const s = n - head;
      const q = [P(s - 0.47, 0.62), P(s + 0.47, 0.62), P(s + 0.47, -0.62), P(s - 0.47, -0.62)];
      if (q.some(p => p[2] < 0.6)) continue;
      cells.push({ n, s, q, z: (q[0][2] + q[2][2]) / 2 });
    }
    cells.sort((a, b) => b.z - a.z);
    c.save();
    c.globalAlpha = inP;
    for (const cl of cells) {
      const fog = clamp(Math.exp(-(cl.z - D) / 16)), sym = tape.has(cl.n) ? tape.get(cl.n) : -1;
      const q = cl.q, near = Math.abs(cl.s) < 0.5;
      let flip = 1, hot = 0;
      if (step && step.write !== null && step.pos === cl.n) { const u = prog(step.t, step.t + 0.22, lt); flip = Math.abs(Math.cos(u * Math.PI)); hot = 1 - prog(step.t, step.t + 0.8, lt); }
      c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = rgba(mixc([6, 26, 34], [30, 70, 80], near ? 0.6 : 0), 0.92 * fog + 0.05);
      c.fill();
      c.strokeStyle = rgba(mixc(C, HOT, hot), (0.25 + 0.5 * fog) * (near ? 1.4 : 1)); c.lineWidth = Math.max(0.6, 2.2 * (D / cl.z)); c.stroke();
      if (sym >= 0 && fog > 0.04) {
        const [ox, oy] = P(cl.s, 0), [rx, ry] = P(cl.s + 0.5, 0), [ux, uy] = P(cl.s, 0.5);
        const ex = (rx - ox) * 2 / 100, ey = (ry - oy) * 2 / 100, fx = (ux - ox) * 2 / 100 * flip, fy = (uy - oy) * 2 / 100 * flip;
        c.save();
        c.setTransform(ex, ey, -fx, -fy, ox, oy);
        c.font = font(700, 78, F.mono); c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '0px';
        c.fillStyle = rgba(mixc(CW, HOT, hot), 0.25 + 0.75 * fog);
        c.fillText(String(sym), 0, 4);
        c.restore();
      }
      if (hot > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; const [gx, gy] = P(cl.s, 0); glow(c, gx, gy, 140 * (D / cl.z), HOT, hot * 0.8); c.restore(); }
    }
    // read/write head
    const hq = [P(-0.62, 0.85), P(0.62, 0.85), P(0.62, -0.85), P(-0.62, -0.85)];
    const ha = inP * (1 - prog(8.2, 9.4, lt) * 0.7);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(HOT, 0.95 * ha); c.lineWidth = 3; c.lineJoin = 'round';
    const L = 0.3;
    for (let i = 0; i < 4; i++) {
      const a = hq[i], b = hq[(i + 1) % 4], d = hq[(i + 3) % 4];
      c.beginPath();
      c.moveTo(lerp(a[0], d[0], L), lerp(a[1], d[1], L)); c.lineTo(a[0], a[1]); c.lineTo(lerp(a[0], b[0], L), lerp(a[1], b[1], L));
      c.stroke();
    }
    const [hx, hy] = P(0, 1.3);
    glow(c, hx, hy + 30, 90, HOT, 0.3 * ha, false);
    c.restore();
    c.fillStyle = rgba(HOT, ha); c.beginPath(); c.moveTo(hx, hy + 6); c.lineTo(hx - 12, hy - 12); c.lineTo(hx + 12, hy - 12); c.closePath(); c.fill();
    // state panel above the head
    const labels = { R: ['向右扫描', 'SCAN RIGHT →'], C: ['进位 +1', '← CARRY'] };
    let bits = [...tape.entries()].filter(([, v]) => v >= 0).sort((a, b) => a[0] - b[0]).map(([, v]) => v).join('').replace(/^0+(?=\d)/, '');
    const val = parseInt(bits, 2);
    const pw = 330, px = hx - pw / 2, py = hy - 150;
    c.save(); c.globalAlpha = ha;
    c.fillStyle = 'rgba(4,18,24,0.85)'; roundRect(c, px, py, pw, 104, 12); c.fill();
    c.strokeStyle = rgba(C, 0.5); c.lineWidth = 1.5; c.stroke();
    text(c, '状态', px + 20, py + 34, { f: font(700, 16, F.zh), color: rgba(C, 0.8), sp: 2 });
    text(c, labels[state][0], px + 72, py + 35, { f: font(700, 22, F.zh), color: '#e8fbff', sp: 2 });
    text(c, labels[state][1], px + pw - 20, py + 34, { f: font(600, 13, F.mono), color: rgba(C, 0.8), align: 'right', sp: 2 });
    text(c, `${bits}₂`, px + 20, py + 80, { f: font(700, 26, F.mono), color: rgba(HOT, 1), sp: 2 });
    text(c, `= ${val}`, px + pw - 20, py + 80, { f: font(700, 26, F.mono), color: '#fff', align: 'right' });
    c.restore();
    c.restore();
    const tA = inP * (1 - prog(8.4, 9.2, lt));
    text(c, '《论可计算数》 · 图灵 · 1936', VCX, 168, { f: font(700, 18, F.zh), color: rgba(C, 1), align: 'center', sp: 4, alpha: 0.9 * tA });
    text(c, 'ON COMPUTABLE NUMBERS  ·  A. M. TURING', VCX, 194, { f: font(600, 12, F.mono), color: rgba(C, 0.8), align: 'center', sp: 4, alpha: 0.9 * tA });
    const ia = E.out3(prog(7.2, 8.0, lt));
    if (ia > 0) {
      text(c, '无限长的纸带  ·  读写头  ·  几条规则', VCX, 880, { f: font(700, 24, F.zh), color: '#e8fbff', align: 'center', sp: 6, alpha: ia });
      text(c, 'AN ENDLESS TAPE  ·  A HEAD  ·  A FEW RULES', VCX, 912, { f: font(600, 13, F.mono), color: rgba(C, 0.85), align: 'center', sp: 4, alpha: ia });
    }
  }
  return { audio, cam: () => ({ push: 0 }), draw };
})();

/* ================================================= 1943 McCulloch–Pitts */
VIS.y1943 = (() => {
  const C = [255, 184, 108], CL = [255, 226, 190];
  const IN = [[1010, 350], [1010, 520], [1010, 690]], N = [1400, 520], NR = 76, TH = [1610, 520], OUT = [1780, 520];
  const SH = 2.4;   // the biological prelude, then the logic model
  const WAVES = [[1.05, [1, 0, 1]], [2.55, [0, 1, 0]], [4.05, [1, 1, 1]], [5.55, [0, 1, 1]]], TRAVEL = 0.45;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const edgePoint = i => { const a = Math.atan2(IN[i][1] - N[1], IN[i][0] - N[0]); return [N[0] + Math.cos(a) * NR, N[1] + Math.sin(a) * NR]; };
  // biological neuron: dendrite curves (to be straightened) and side branches (to retract)
  const BIO = (() => {
    const r = rng(1943), dend = [];
    for (let i = 0; i < 3; i++) {
      const [sx, sy] = edgePoint(i), [ex, ey] = IN[i];
      const nx = -(ey - sy), ny = ex - sx, L = Math.hypot(nx, ny);
      const off = (r() - 0.5) * 140;
      const c1 = [lerp(sx, ex, 0.33) + (nx / L) * off, lerp(sy, ey, 0.33) + (ny / L) * off];
      const c2 = [lerp(sx, ex, 0.66) - (nx / L) * off * 0.8, lerp(sy, ey, 0.66) - (ny / L) * off * 0.8];
      const kids = [];
      for (let k = 0; k < 5; k++) {
        const u = 0.2 + k * 0.16, a = Math.atan2(ey - sy, ex - sx) + (k % 2 ? 1 : -1) * (0.6 + r() * 0.6);
        kids.push({ u, a, len: 40 + r() * 70, sub: r() < 0.6 ? (r() - 0.5) * 1.4 : null });
      }
      dend.push({ c1, c2, kids });
    }
    const axon = { c1: [1480, 440], c2: [1640, 610] };
    return { dend, axon };
  })();
  const bez = (p0, p1, p2, p3, u) => {
    const v = 1 - u;
    return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
  };
  function audio(t0) {
    for (const [ws, act] of WAVES) {
      sfx(t0 + SH + ws, 'tick', { v: 0.5 });
      sfx(t0 + SH + ws + TRAVEL, sum(act) >= 2 ? 'fire' : 'nofire');
    }
    sfx(t0 + 1.7, 'shimmer', { dur: 1.0 });
  }
  function drawBio(c, lt) {
    const grow = E.out3(prog(0.1, 1.2, lt)), st = E.io3(prog(1.7, 2.5, lt)), fade = 1 - prog(2.4, 2.9, lt);
    if (fade <= 0) return;
    c.save(); c.globalAlpha = fade; c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = rgba(C, 0.85);
    BIO.dend.forEach((d, i) => {
      const s0 = edgePoint(i), e = IN[i];
      const c1 = [lerp(d.c1[0], lerp(s0[0], e[0], 0.33), st), lerp(d.c1[1], lerp(s0[1], e[1], 0.33), st)];
      const c2 = [lerp(d.c2[0], lerp(s0[0], e[0], 0.66), st), lerp(d.c2[1], lerp(s0[1], e[1], 0.66), st)];
      c.lineWidth = lerp(7, 2, st); c.beginPath();
      for (let k = 0; k <= 30; k++) { const u = (k / 30) * grow, p = bez(s0, c1, c2, e, u); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.stroke();
      const kidA = 1 - E.in2(prog(1.5, 2.1, lt));
      d.kids.forEach(k => {
        if (k.u > grow) return;
        const p = bez(s0, c1, c2, e, k.u), len = k.len * kidA * clamp((grow - k.u) * 4);
        if (len < 1) return;
        const q = [p[0] + Math.cos(k.a) * len, p[1] + Math.sin(k.a) * len];
        c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
        if (k.sub !== null) {
          c.lineWidth = 2; c.beginPath(); c.moveTo(lerp(p[0], q[0], 0.6), lerp(p[1], q[1], 0.6));
          c.lineTo(lerp(p[0], q[0], 0.6) + Math.cos(k.a + k.sub) * len * 0.5, lerp(p[1], q[1], 0.6) + Math.sin(k.a + k.sub) * len * 0.5); c.stroke();
        }
      });
    });
    // axon with myelin sheaths
    const a0 = [N[0] + NR, N[1]], a3 = [OUT[0] - 10, N[1]];
    const ac1 = [lerp(BIO.axon.c1[0], lerp(a0[0], a3[0], 0.33), st), lerp(BIO.axon.c1[1], N[1], st)];
    const ac2 = [lerp(BIO.axon.c2[0], lerp(a0[0], a3[0], 0.66), st), lerp(BIO.axon.c2[1], N[1], st)];
    c.lineWidth = lerp(6, 2, st); c.beginPath();
    for (let k = 0; k <= 30; k++) { const u = (k / 30) * grow, p = bez(a0, ac1, ac2, a3, u); k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    c.stroke();
    const my = 1 - prog(1.4, 2.0, lt);
    for (const u of [0.25, 0.45, 0.65]) {
      if (u > grow || my <= 0) continue;
      const p = bez(a0, ac1, ac2, a3, u), q = bez(a0, ac1, ac2, a3, u + 0.01);
      c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(q[1] - p[1], q[0] - p[0]));
      c.fillStyle = rgba([120, 70, 25], 0.95 * my); c.strokeStyle = rgba(C, 0.8 * my); c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 24, 11, 0, 0, TAU); c.fill(); c.stroke();
      c.restore();
    }
    // soma: a lumpy cell body that becomes a perfect circle
    const sp = E.outBack(prog(0.0, 0.6, lt));
    c.beginPath();
    for (let k = 0; k <= 64; k++) {
      const a = (k / 64) * TAU, rr = lerp(60 + 9 * Math.sin(3 * a + 1) + 6 * Math.sin(5 * a), NR, st) * clamp(sp, 0, 1.2);
      const x = N[0] + Math.cos(a) * rr, y = N[1] + Math.sin(a) * rr;
      k ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    const g = c.createRadialGradient(N[0] - 15, N[1] - 18, 4, N[0], N[1], NR);
    g.addColorStop(0, 'rgb(120,70,25)'); g.addColorStop(1, 'rgb(30,16,6)');
    c.fillStyle = g; c.fill(); c.strokeStyle = rgba(C, 1); c.lineWidth = 3; c.stroke();
    c.fillStyle = rgba(CL, 0.8 * (1 - st)); c.beginPath(); c.arc(N[0] + 8, N[1] - 6, 18, 0, TAU); c.fill();
    c.restore();
    const la = E.out3(prog(0.3, 0.8, lt)) * (1 - prog(1.6, 2.0, lt));
    biLabel(c, '生物神经元', 'BIOLOGICAL NEURON', VCX, 212, { col: rgba(C, 1), alpha: la });
    const lb = E.out3(prog(1.8, 2.2, lt)) * (1 - prog(2.6, 2.9, lt));
    biLabel(c, '抽象为逻辑模型 →', 'ABSTRACTION', VCX, 212, { col: rgba(C, 1), alpha: lb });
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
  function draw(c, ltAll) {
    drawBio(c, ltAll);
    const lt = ltAll - SH;
    if (lt < -0.3) return;
    const gridA = E.out2(prog(-0.3, 0.5, lt));
    c.strokeStyle = rgba(C, 0.06 * gridA); c.lineWidth = 1; c.beginPath();
    for (let x = 920; x <= 1800; x += 40) { c.moveTo(x, 170); c.lineTo(x, 870); }
    for (let y = 170; y <= 870; y += 40) { c.moveTo(920, y); c.lineTo(1800, y); }
    c.stroke();
    biLabel(c, '麦卡洛克-皮茨神经元', 'M–P NEURON · 1943', VCX, 212, { col: rgba(C, 1), alpha: 0.9 * prog(0.2, 0.8, lt) });

    let flash_ = 0, dud = 0;
    for (const [ws, act] of WAVES) {
      const d = lt - (ws + TRAVEL);
      if (d >= 0) { if (sum(act) >= 2) flash_ = Math.max(flash_, Math.exp(-d * 3.2)); else dud = Math.max(dud, 0.35 * Math.exp(-d * 5)); }
    }
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const p = E.out3(prog(-0.2 + i * 0.05, 0.3 + i * 0.05, lt));
      if (p <= 0) continue;
      const sx = IN[i][0] + 24, sy = IN[i][1], [ex, ey] = edgePoint(i);
      c.strokeStyle = rgba(C, 0.55); c.lineWidth = 2;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(lerp(ex, sx, p), lerp(ey, sy, p)); c.stroke();
    }
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
    const np = prog(-0.2, 0.2, lt);
    if (np > 0) {
      const r = NR;
      c.globalCompositeOperation = 'lighter';
      glow(c, N[0], N[1], r * 2.6 + flash_ * 100, C, (0.3 + flash_ * 0.9 + dud) * np);
      c.globalCompositeOperation = 'source-over';
      const g = c.createRadialGradient(N[0] - 20, N[1] - 25, 5, N[0], N[1], r);
      g.addColorStop(0, rgba(mixc([70, 40, 12], C, flash_ * 0.8), 1)); g.addColorStop(1, 'rgb(22,12,5)');
      c.globalAlpha = np;
      c.fillStyle = g; c.strokeStyle = rgba(mixc(C, WHITE, flash_ * 0.6), 1); c.lineWidth = 3;
      c.beginPath(); c.arc(N[0], N[1], r, 0, TAU); c.fill(); c.stroke();
      c.globalAlpha = 1;
      text(c, 'Σ', N[0], N[1] + 21, { f: font(500, 62, F.body), color: rgba(mixc(CL, WHITE, flash_), 1), align: 'center', alpha: np });
      for (const [ws, act] of WAVES) {
        if (sum(act) < 2) continue;
        const d = lt - (ws + TRAVEL);
        if (d > 0 && d < 0.9) { c.strokeStyle = rgba(C, (1 - d / 0.9) * 0.8); c.lineWidth = 2; c.beginPath(); c.arc(N[0], N[1], NR + d * 130, 0, TAU); c.stroke(); }
      }
      text(c, '阈值 THRESHOLD θ = 2', N[0], N[1] + NR + 44, { f: font(600, 16, F.mono), color: rgba(C, 0.85), align: 'center', sp: 2, alpha: np });
    }
    const op = E.out3(prog(0.1, 0.6, lt));
    if (op > 0) {
      c.strokeStyle = rgba(C, 0.55); c.lineWidth = 2;
      c.beginPath(); c.moveTo(N[0] + NR, N[1]); c.lineTo(TH[0] - 50, N[1]); c.stroke();
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
    if (fp > 0) {
      formula(c, 1395, 812, fp);
      text(c, '输入之和达到阈值，神经元就“发放”', 1395, 862, { f: font(400, 20, F.zh), color: rgba(CL, 0.85), align: 'center', sp: 2, alpha: fp });
    }
  }
  return { audio, draw };
})();

/* ======================================================== 1950 Turing */
VIS.y1950 = (() => {
  const PW = 600, PH = 740, INK = 'rgb(36,29,22)';
  const LINES = [
    { s: 'I.—COMPUTING MACHINERY AND', size: 24, y: 262, align: 'center', cps: 80 },
    { s: 'INTELLIGENCE', size: 24, y: 294, align: 'center', cps: 80 },
    { s: 'BY A. M. TURING', size: 16, y: 332, align: 'center', cps: 80 },
    { s: '1. The Imitation Game.', size: 19, y: 392, align: 'left', cps: 62 },
    { s: 'I propose to consider the question,', size: 19, y: 432, align: 'left', cps: 60 },
    { s: '“Can machines think?”', size: 36, y: 498, align: 'left', cps: 19, hl: true },
    { s: 'This should begin with definitions of', size: 17, y: 560, align: 'left', cps: 90, dim: true },
    { s: 'the meaning of the terms “machine” and', size: 17, y: 588, align: 'left', cps: 90, dim: true },
    { s: '“think.” The definitions might be framed', size: 17, y: 616, align: 'left', cps: 90, dim: true },
    { s: 'so as to reflect so far as possible the', size: 17, y: 644, align: 'left', cps: 90, dim: true },
  ];
  let tc = 0.4;
  for (const L of LINES) { L.times = typeTimes(L.s, tc, L.cps, L.y); tc = L.times.end + (L.hl ? 0.35 : 0.08); }
  const QUOTE = LINES.find(L => L.hl), HL0 = QUOTE.times.end + 0.05, LIFT = 6.0;
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
    g.fillStyle = 'rgba(38,30,22,0.88)';
    g.font = font(500, 13, F.serif); g.textAlign = 'left'; g.fillText('VOL. LIX. No. 236.]', 40, 50);
    g.textAlign = 'right'; g.fillText('[October, 1950', PW - 40, 50);
    g.textAlign = 'center'; g.font = font(700, 50, F.serif); g.letterSpacing = '16px'; g.fillText('MIND', PW / 2 + 8, 118);
    g.font = font(500, 12, F.serif); g.letterSpacing = '4px';
    g.fillText('A QUARTERLY REVIEW', PW / 2 + 2, 146); g.fillText('OF', PW / 2 + 2, 164); g.fillText('PSYCHOLOGY AND PHILOSOPHY', PW / 2 + 2, 182);
    g.letterSpacing = '0px'; g.strokeStyle = 'rgba(38,30,22,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(40, 206); g.lineTo(PW - 40, 206); g.moveTo(40, 210); g.lineTo(PW - 40, 210); g.stroke();
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
    sfx(t0 + LIFT, 'shimmer', { dur: 1.6 });
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    const lift = E.io3(prog(LIFT, LIFT + 1.4, lt));
    const rot = lerp(-0.12, -0.035, inP), dy = lerp(90, 0, inP) + 170 * lift;
    const zoom = (1 + 0.12 * E.io2(prog(2.6, 5.6, lt))) * (1 - 0.3 * lift);
    const qx = QUOTE.x0 + QUOTE.w / 2 - PW / 2, qy = QUOTE.y - 12 - PH / 2;
    c.save();
    c.globalAlpha = inP * (1 - 0.82 * lift);
    c.translate(VCX - 10, VCY + 22 + dy); c.rotate(rot - 0.05 * lift);
    c.translate(qx, qy); c.scale(zoom, zoom); c.translate(-qx, -qy);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
    c.drawImage(paper, -PW / 2, -PH / 2);
    c.restore();
    c.translate(-PW / 2, -PH / 2);
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
        c.globalAlpha = inP * (1 - 0.82 * lift) * (L.dim ? 0.5 : 1) * (0.78 + 0.22 * hash(i, L.y)) * (0.6 + 0.4 * fresh);
        c.fillText(ch, L.x0 + L.xs[i], L.y + (hash(i, L.y + 1) - 0.5) * 1.6);
      }
    }
    c.restore();
    // the question lifts off the page and becomes light
    if (lift > 0) {
      c.save();
      const vg = c.createRadialGradient(VCX, VCY, 60, VCX, VCY, 560);
      vg.addColorStop(0, `rgba(8,5,2,${(0.6 * lift).toFixed(3)})`); vg.addColorStop(1, 'rgba(8,5,2,0)');
      c.fillStyle = vg; c.fillRect(VCX - 600, VCY - 600, 1200, 1200);
      c.restore();
      c.save();
      c.shadowColor = 'rgba(255,190,90,0.9)'; c.shadowBlur = 30 * lift;
      const zh = '“机器能思考吗？”';
      c.font = font(700, 70, F.zhs); c.letterSpacing = '6px'; c.textAlign = 'center';
      const y = lerp(VCY + 40, VCY - 20, lift);
      c.globalAlpha = lift;
      c.fillStyle = '#fff4dc';
      c.fillText(zh, VCX + 3, y);
      c.restore();
      text(c, 'CAN MACHINES THINK?', VCX, y + 58, { f: font(600, 22, F.mono), color: 'rgb(255,214,150)', align: 'center', sp: 8, alpha: E.out3(prog(LIFT + 0.6, LIFT + 1.4, lt)) });
      const ga = E.out3(prog(LIFT + 1.4, LIFT + 2.2, lt));
      if (ga > 0) {
        // the imitation game: a judge, a person and a machine behind a wall
        const Y = y + 170, icons = [[VCX - 260, '裁判', 'JUDGE', '?'], [VCX + 90, '人', 'HUMAN', 'A'], [VCX + 290, '机器', 'MACHINE', 'B']];
        c.strokeStyle = rgba([255, 214, 150], 0.5 * ga); c.lineWidth = 2; c.setLineDash([6, 6]);
        c.beginPath(); c.moveTo(VCX - 20, Y - 60); c.lineTo(VCX - 20, Y + 50); c.stroke(); c.setLineDash([]);
        icons.forEach(([x, zhn, en, g], i) => {
          const a = ga * E.out3(prog(LIFT + 1.4 + i * 0.15, LIFT + 1.9 + i * 0.15, lt));
          c.fillStyle = rgba([40, 26, 10], 0.9 * a); c.strokeStyle = rgba([255, 214, 150], 0.8 * a); c.lineWidth = 2;
          c.beginPath(); c.arc(x, Y - 12, 30, 0, TAU); c.fill(); c.stroke();
          text(c, g, x, Y - 2, { f: font(700, 26, F.sans), color: '#fff4dc', align: 'center', alpha: a });
          text(c, zhn + ' ' + en, x, Y + 44, { f: font(600, 14, F.mono), color: 'rgb(255,214,150)', align: 'center', sp: 2, alpha: a });
        });
      }
    }
  }
  return { prep, audio, draw };
})();

/* ===================================================== 1956 Dartmouth */
VIS.y1956 = (() => {
  const C = [255, 200, 130];
  let rays = null, seal = null, qLines = [];
  const SEAL_T = 2.3, Q0 = 3.4;
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
    // a red Chinese seal: 人工智能
    seal = makeCanvas(200, 200);
    const s = seal.getContext('2d'), r = rng(56);
    s.fillStyle = '#c8241c'; roundRect(s, 10, 10, 180, 180, 14); s.fill();
    s.globalCompositeOperation = 'destination-out';
    s.strokeStyle = '#000'; s.lineWidth = 6; roundRect(s, 22, 22, 156, 156, 8); s.stroke();
    s.font = font(700, 66, F.zhs); s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillStyle = '#000';
    [['智', 60, 64], ['人', 140, 64], ['能', 60, 140], ['工', 140, 140]].forEach(([ch, x, y]) => s.fillText(ch, x, y + 4));
    for (let i = 0; i < 260; i++) { s.globalAlpha = r() * 0.8; s.beginPath(); s.arc(r() * 200, r() * 200, r() * 2.6, 0, TAU); s.fill(); }
    lctx.font = font(400, 25, F.zhs); lctx.letterSpacing = '1px';
    qLines = wrapZh(lctx, '“学习的每一个方面，或智能的任何其他特征，原则上都能被精确描述，以至于可以造一台机器来模拟它。”', 860);
  }
  function audio(t0) { sfx(t0 + SEAL_T, 'stamp'); hit(t0 + SEAL_T, 0.5); }
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
    const up = -40 * E.io2(prog(Q0 - 0.3, Q0 + 0.6, lt));
    c.save();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * burst;
    c.translate(VCX, VCY + up); c.rotate(lt * 0.06); c.scale(0.6 + 0.4 * burst, 0.6 + 0.4 * burst);
    c.drawImage(rays, -750, -750);
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    glow(c, VCX, VCY - 10 + up, 560 * (0.5 + 0.5 * burst), C, 0.35 * burst + 0.5 * Math.exp(-lt * 3), false);
    for (let i = 0; i < 70; i++) {
      const sp = 30 + 70 * hash(i, 3), y = 900 - ((lt * sp + hash(i, 2) * 800) % 800);
      const x = VCX + (hash(i, 1) - 0.5) * 1000 + Math.sin(lt * 1.5 + i) * 14;
      glow(c, x, y, 5 + 6 * hash(i, 4), C, burst * (0.25 + 0.5 * hash(i, 5)) * (0.6 + 0.4 * Math.sin(lt * 7 + i)));
    }
    c.restore();
    c.save(); c.translate(0, up);
    stampLine(c, 'ARTIFICIAL', 400, 0.12, lt, 92);
    stampLine(c, 'INTELLIGENCE', 510, 0.6, lt, 92);
    const ul = E.io3(prog(1.35, 2.0, lt));
    c.strokeStyle = rgba(C, 0.7); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(VCX - 400 * ul, 556); c.lineTo(VCX + 400 * ul, 556); c.stroke();
    const names = ['JOHN McCARTHY', 'MARVIN MINSKY', 'NATHANIEL ROCHESTER', 'CLAUDE SHANNON'], sep = '  ·  ';
    c.font = font(500, 15, F.mono); c.letterSpacing = '2px';
    let x = VCX - c.measureText(names.join(sep)).width / 2;
    names.forEach((nm, i) => {
      const a = E.out3(prog(1.6 + i * 0.16, 2.1 + i * 0.16, lt));
      text(c, nm, x, 600 + (1 - a) * 10, { color: '#ffe9cc', sp: 2, alpha: a });
      x += c.measureText(nm).width;
      if (i < 3) text(c, sep, x, 600, { color: rgba(C, 1), sp: 2, alpha: a });
      x += c.measureText(sep).width;
    });
    text(c, '达特茅斯学院 · 新罕布什尔州 · 1956 年夏', VCX, 642, { f: font(700, 16, F.zh), color: rgba(C, 1), align: 'center', sp: 4, alpha: 0.75 * E.out3(prog(2.4, 3.0, lt)) });
    c.restore();
    // the seal slams down
    const sp_ = prog(SEAL_T - 0.18, SEAL_T, lt);
    if (sp_ > 0) {
      const sc = lerp(3.2, 1, E.in2(sp_)) * (1 + 0.06 * Math.exp(-(lt - SEAL_T) * 10) * (lt > SEAL_T ? 1 : 0));
      c.save(); c.translate(1690, 250 + up * 0.5); c.rotate(-0.14); c.scale(sc * 0.75, sc * 0.75);
      c.globalAlpha = clamp(sp_ * 1.5) * 0.95;
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 20 * (1 - sp_);
      c.drawImage(seal, -100, -100);
      c.restore();
    }
    // the proposal's founding conjecture
    const qa = E.out3(prog(Q0, Q0 + 0.6, lt));
    if (qa > 0) {
      c.save(); c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 16;
      c.font = font(400, 25, F.zhs); c.letterSpacing = '1px'; c.fillStyle = '#fff3df';
      qLines.forEach((line, i) => {
        const w = line.reduce((s, tk) => s + c.measureText(tk).width, 0);
        drawTokens(c, [line], VCX - w / 2, 720 + i * 44, 44, Q0 + i * 0.5, lt, { stagger: 0.03, dur: 0.5 });
      });
      c.restore();
      text(c, '“…every aspect of learning or any other feature of intelligence can in principle be so precisely described', VCX, 720 + qLines.length * 44 + 12,
        { f: font(400, 17, F.serif, true), color: 'rgba(255,230,195,0.75)', align: 'center', alpha: E.out3(prog(Q0 + 2.0, Q0 + 2.8, lt)) });
      text(c, 'that a machine can be made to simulate it.”  — DARTMOUTH PROPOSAL, 1955', VCX, 720 + qLines.length * 44 + 38,
        { f: font(400, 17, F.serif, true), color: 'rgba(255,230,195,0.75)', align: 'center', alpha: E.out3(prog(Q0 + 2.2, Q0 + 3.0, lt)) });
    }
  }
  return { prep, audio, draw };
})();
