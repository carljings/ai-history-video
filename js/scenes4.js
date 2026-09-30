'use strict';
/* scenes4.js — Act IV (2020–2025) and the finale. */

/* =========================================================== 2020 Scale */
VIS.y2020 = (() => {
  const R3 = 285, BASE = 800;
  const MODELS = [
    { name: 'GPT-1', year: '2018', p: 117e6, label: '1.17 亿', x: 965, t: 0.5 },
    { name: 'GPT-2', year: '2019', p: 1.5e9, label: '15 亿', x: 1070, t: 1.0 },
    { name: 'GPT-3', year: '2020', p: 175e9, label: '1750 亿', x: 1455, t: 1.5 },
  ];
  const FEW = 4.6;
  const SHOTS = [['sea otter', 'loutre de mer'], ['cheese', 'fromage'], ['peppermint', 'menthe poivrée']];
  const radius = m => R3 * Math.sqrt(m.p / 175e9);
  const DOTS = (() => { const r = rng(2020); return Array.from({ length: 1500 }, () => { const a = r() * TAU, d = Math.sqrt(r()); return [Math.cos(a) * d, Math.sin(a) * d, r()]; }); })();
  const ANS = SHOTS[2][1], ANS_T = typeTimes(ANS, FEW + 1.9, 16, 7);
  function audio(t0) {
    sfx(t0 + 0.5, 'pop'); sfx(t0 + 1.0, 'pop'); sfx(t0 + 1.5, 'swell');
    sfxTyping(ANS_T.map(x => x + t0), ANS, 'tok', 0.05, 0.8);
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt)), dim = 1 - 0.7 * E.io2(prog(FEW - 0.3, FEW + 0.3, lt));
    c.save(); c.globalAlpha = dim;
    c.strokeStyle = `rgba(180,200,255,${(0.2 * inP).toFixed(3)})`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(920, BASE); c.lineTo(1790, BASE); c.stroke();
    biLabel(c, '模型规模 · 参数数量', 'NUMBER OF PARAMETERS', VCX, 206, { col: 'rgb(170,200,255)', alpha: 0.9 * inP, zs: 17, es: 12 });
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
        text(c, 'GPT-3  ·  2020', cx, cy - 78, { f: font(600, 18, F.mono), color: 'rgb(190,215,255)', align: 'center', sp: 4, alpha: g });
        text(c, Math.round(175e9 * k).toLocaleString('en-US'), cx, cy + 6, { f: font(700, 50, F.sans), color: '#fff', align: 'center', alpha: g });
        text(c, '个参数 PARAMETERS', cx, cy + 46, { f: font(700, 16, F.zh), color: 'rgb(190,215,255)', align: 'center', sp: 4, alpha: g });
        text(c, '训练文本约 3000 亿词元 · 300B TOKENS', cx, cy + 92, { f: font(400, 14, F.zh), color: 'rgba(190,215,255,0.75)', align: 'center', sp: 1, alpha: E.out3(prog(3.2, 3.8, lt)) });
      } else {
        c.fillStyle = 'rgba(150,190,255,0.9)'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, cy, r * 3 + 12, [120, 170, 255], 0.6); c.restore();
        text(c, m.name, cx, BASE + 30, { f: font(700, 16, F.mono), color: '#fff', align: 'center', alpha: clamp(g) });
        text(c, m.year + ' · ' + m.label, cx, BASE + 52, { f: font(400, 13, F.zh), color: 'rgba(190,215,255,0.75)', align: 'center', alpha: clamp(g) });
      }
    });
    const ar = E.out3(prog(2.3, 2.9, lt));
    if (ar > 0) {
      c.strokeStyle = `rgba(255,190,120,${(0.85 * ar).toFixed(3)})`; c.lineWidth = 2; c.setLineDash([6, 6]);
      c.beginPath(); c.moveTo(1085, 740); c.quadraticCurveTo(1100, 560, 1185, 520); c.stroke(); c.setLineDash([]);
      text(c, '×117', 1070, 560, { f: font(700, 30, F.sans), color: 'rgb(255,200,140)', align: 'center', alpha: ar });
      text(c, '一年扩大 117 倍', 1070, 588, { f: font(700, 13, F.zh), color: 'rgba(255,200,140,0.85)', align: 'center', sp: 1, alpha: ar });
    }
    c.restore();
    // few-shot learning: three examples, and it continues the pattern
    const fa = E.out3(prog(FEW, FEW + 0.5, lt));
    if (fa > 0) {
      const X = 1030, Y = 330, WW = 660, HH = 380;
      c.save(); c.globalAlpha = fa; c.translate(0, (1 - fa) * 30);
      c.fillStyle = 'rgba(8,12,30,0.92)'; roundRect(c, X, Y, WW, HH, 16); c.fill();
      c.strokeStyle = 'rgba(150,190,255,0.4)'; c.lineWidth = 1.5; c.stroke();
      text(c, '少样本学习：只看几个例子', X + 32, Y + 48, { f: font(700, 22, F.zh), color: '#fff', sp: 2 });
      text(c, 'FEW-SHOT LEARNING  ·  Translate English to French', X + 32, Y + 78, { f: font(600, 13, F.mono), color: 'rgb(160,195,255)', sp: 1 });
      SHOTS.forEach(([en, fr], i) => {
        const y = Y + 150 + i * 62, a = E.out3(prog(FEW + 0.4 + i * 0.35, FEW + 0.8 + i * 0.35, lt));
        text(c, en, X + 40, y, { f: font(500, 28, F.body), color: '#e8eeff', alpha: a });
        text(c, '→', X + 290, y, { f: font(500, 28, F.body), color: 'rgb(160,195,255)', alpha: a });
        if (i < 2) text(c, fr, X + 340, y, { f: font(500, 28, F.body), color: '#e8eeff', alpha: a });
        else {
          const n = countTyped(ANS_T, lt);
          text(c, ANS.slice(0, n), X + 340, y, { f: font(700, 28, F.body), color: 'rgb(255,200,140)', alpha: a });
          if (n < ANS.length && Math.floor(lt * 3) % 2 === 0) { c.fillStyle = 'rgb(255,200,140)'; c.fillRect(X + 340 + c.measureText(ANS.slice(0, n)).width + 4, y - 24, 3, 30); }
        }
      });
      const da = E.out3(prog(ANS_T.end + 0.2, ANS_T.end + 0.6, lt));
      text(c, '✓ 从未专门学过翻译，却学会了照着例子做', X + 40, Y + HH - 30, { f: font(700, 17, F.zh), color: 'rgb(140,255,190)', sp: 1, alpha: da });
      c.restore();
    }
  }
  return { audio, draw };
})();

/* ================================================ 2021 AlphaFold */
VIS.y2021 = (() => {
  const PL = [[0, 83, 214], [101, 203, 243], [255, 219, 19], [255, 125, 69]];   // pLDDT: very high, confident, low, very low
  const FOLD0 = 1.2, FOLD1 = 5.6, SCALE = 17;
  let RES = [];
  function prep() {
    const r = rng(2021), tgt = [], kind = [];
    const helix = (a, b, n) => {
      const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...ax), d = ax.map(v => v / L);
      let u = Math.abs(d[1]) < 0.9 ? [d[2], 0, -d[0]] : [1, 0, 0];
      const ul = Math.hypot(...u); u = u.map(v => v / ul);
      const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), th = i * (100 * Math.PI / 180);
        tgt.push([0, 1, 2].map(k => a[k] + ax[k] * t + 2.3 * (Math.cos(th) * u[k] + Math.sin(th) * v[k]))); kind.push(0);
      }
    };
    const strand = (a, b, n, side) => {
      for (let i = 0; i < n; i++) { const t = i / (n - 1); tgt.push([lerp(a[0], b[0], t) + (i % 2 ? 0.9 : -0.9) * side, lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); kind.push(1); }
    };
    const loop = n => {
      const p = tgt[tgt.length - 1];
      return (q) => {
        for (let i = 1; i <= n; i++) {
          const t = i / (n + 1), bulge = Math.sin(t * Math.PI) * 4;
          tgt.push([lerp(p[0], q[0], t) + bulge * 0.4, lerp(p[1], q[1], t) + bulge, lerp(p[2], q[2], t) - bulge * 0.6]); kind.push(2);
        }
      };
    };
    helix([-7, -10, 0], [-7, 10, 0], 18);
    loop(4)([-1, 10, 3]);
    helix([-1, 10, 3], [-1, -10, 3], 18);
    loop(4)([5, -9, -1]);
    strand([5, -9, -1], [5, 8, -1], 11, 1);
    loop(3)([9, 8, -2]);
    strand([9, 8, -2], [9, -9, -2], 11, -1);
    loop(4)([3, -10, -7]);
    helix([3, -10, -7], [3, 10, -7], 18);
    loop(4)([-5, 10, -6]);
    helix([-5, 10, -6], [-5, -8, -6], 16);
    const cx = tgt.reduce((s, p) => s + p[0], 0) / tgt.length, cy = tgt.reduce((s, p) => s + p[1], 0) / tgt.length, cz = tgt.reduce((s, p) => s + p[2], 0) / tgt.length;
    // unfolded: a long wiggling chain stretched across the view
    const n = tgt.length;
    RES = tgt.map((p, i) => {
      const u = i / (n - 1);
      const start = [lerp(-36, 36, u) + (r() - 0.5) * 1.5, 7 * Math.sin(u * 9) + (r() - 0.5) * 2, 6 * Math.cos(u * 7) + (r() - 0.5) * 2];
      const conf = kind[i] === 2 ? 0.55 + r() * 0.25 : 0.88 + r() * 0.12;
      return { s: start, t: [p[0] - cx, p[1] - cy, p[2] - cz], kind: kind[i], del: kind[i] === 2 ? 0.25 + r() * 0.15 : r() * 0.2, conf, ph: r() * TAU };
    });
  }
  const confCol = v => (v > 0.9 ? PL[0] : v > 0.7 ? mixc(PL[1], PL[0], (v - 0.7) / 0.2) : v > 0.5 ? mixc(PL[2], PL[1], (v - 0.5) / 0.2) : mixc(PL[3], PL[2], v / 0.5));
  const SEQ = 'MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQCGVWPAAVRESVPALL';
  function audio(t0) {
    sfx(t0 + FOLD0, 'swell');
    sfx(t0 + FOLD1 - 0.2, 'chime');
    sfx(t0 + 7.2, 'shimmer', { dur: 1.2 });
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    const yaw = lt * 0.42 - 0.6, pitch = 0.3 + 0.12 * Math.sin(lt * 0.4);
    const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const zoom = lerp(0.8, 1.15, E.io2(prog(FOLD0, FOLD1 + 1, lt)));
    const CX = VCX, CY = 470;
    const pts = RES.map((q, i) => {
      const m = E.io3(clamp((prog(FOLD0, FOLD1, lt) - q.del) / (1 - q.del * 0.8)));
      const jig = (1 - m) * 1.2;
      const x = lerp(q.s[0], q.t[0], m) + jig * Math.sin(lt * 3 + q.ph), y = lerp(q.s[1], q.t[1], m) + jig * Math.cos(lt * 2.6 + q.ph), z = lerp(q.s[2], q.t[2], m);
      const X = x * cy_ + z * sy_, Z1 = -x * sy_ + z * cy_, Y = y * cp - Z1 * sp, Z = y * sp + Z1 * cp;
      const s = (SCALE * zoom * 60) / (60 + Z);
      const conf = lerp(0.3 + 0.15 * Math.sin(i), q.conf, m);
      return { x: CX + X * s, y: CY - Y * s, z: Z, s, col: confCol(conf), i };
    });
    // backbone tube, drawn back to front in depth buckets
    c.save(); c.globalAlpha = inP; c.lineCap = 'round'; c.lineJoin = 'round';
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1], (pts[i].z + pts[i + 1].z) / 2]);
    segs.sort((a, b) => b[2] - a[2]);
    for (const [a, b, z] of segs) {
      const fog = clamp(1 - (z + 20) / 60);
      const col = mixc(a.col, [10, 20, 40], 0.55 * (1 - fog));
      c.strokeStyle = rgba(mixc(col, [0, 0, 0], 0.45), 1); c.lineWidth = 0.9 * a.s + 3;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.strokeStyle = rgba(col, 1); c.lineWidth = 0.9 * a.s;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.strokeStyle = rgba(mixc(col, WHITE, 0.55), 0.55); c.lineWidth = 0.25 * a.s;
      c.beginPath(); c.moveTo(a.x - 0.15 * a.s, a.y - 0.2 * a.s); c.lineTo(b.x - 0.15 * a.s, b.y - 0.2 * a.s); c.stroke();
    }
    c.restore();
    const fin = E.out3(prog(FOLD1 - 0.3, FOLD1 + 0.4, lt));
    if (fin > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, CY, 420, [80, 150, 255], 0.3 * fin * Math.exp(-(lt - FOLD1) * 1.2), false); c.restore(); }
    // labels
    const stage = lt < FOLD0 + 0.3 ? 0 : lt < FOLD1 ? 1 : 2;
    const labels = [['氨基酸链', 'AMINO-ACID CHAIN'], ['正在折叠……', 'FOLDING'], ['预测出的三维结构', 'PREDICTED 3-D STRUCTURE']];
    biLabel(c, labels[stage][0], labels[stage][1], VCX, 170, { col: 'rgb(150,205,255)', alpha: inP, zs: 20, es: 13 });
    // the sequence ticker
    c.save();
    c.font = font(600, 16, F.mono); c.letterSpacing = '4px'; c.textAlign = 'left';
    const off = (lt * 60) % 400;
    c.beginPath(); c.rect(930, 820, 860, 30); c.clip();
    for (let i = 0; i < 60; i++) {
      const ch = SEQ[mod(i + Math.floor(lt * 3), SEQ.length)], x = 930 + i * 22 - (off % 22);
      c.fillStyle = rgba(confCol(0.3 + 0.7 * hash(i + Math.floor(lt * 3), 3)), 0.85 * inP);
      c.fillText(ch, x, 842);
    }
    c.restore();
    // pLDDT legend
    const la = E.out3(prog(FOLD1, FOLD1 + 0.6, lt));
    const legend = [['>90', '很高'], ['70–90', '较高'], ['50–70', '较低'], ['<50', '很低']];
    text(c, '置信度 pLDDT', 1580, 250, { f: font(700, 14, F.zh), color: 'rgba(210,230,255,0.8)', sp: 1, alpha: la });
    legend.forEach(([v, zh], i) => {
      c.fillStyle = rgba(PL[i], la); c.fillRect(1580, 268 + i * 26, 18, 14);
      text(c, `${v} ${zh}`, 1608, 280 + i * 26, { f: font(400, 13, F.zh), color: 'rgba(210,230,255,0.75)', alpha: la });
    });
    const ka = E.out3(prog(7.0, 7.6, lt));
    if (ka > 0) {
      const v = Math.round(200e6 * E.out3(prog(7.0, 8.6, lt)));
      c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 16;
      text(c, v.toLocaleString('en-US') + '+', VCX, 900, { f: font(700, 40, F.sans), color: '#fff', align: 'center', alpha: ka });
      c.restore();
      text(c, '种蛋白质结构已被预测并免费公开', VCX, 936, { f: font(700, 17, F.zh), color: 'rgb(150,205,255)', align: 'center', sp: 2, alpha: ka });
    }
  }
  return { prep, audio, draw };
})();

/* ============================================ 2022 diffusion: pictures from words */
VIS.y2022i = (() => {
  const PROMPT = '海边悬崖上的灯塔，夕阳，油画风格';
  const PROMPT_EN = 'a lighthouse on a cliff at sunset, oil painting';
  const S = 480, IX = VCX, IY = 540, STEPS = 50;
  const T0 = 2.0, T1 = 6.6, GRID = 7.4;
  const TT = typeTimes(PROMPT, 0.4, 12, 22);
  let paint = [], blurs = [], noise = [];
  const SCHEMES = [
    { sky: ['#1d1b4a', '#e2573a', '#ffc36b'], sun: '#fff1b8', sea: ['#f08a4b', '#2a2250'], cliff: '#22151c' },
    { sky: ['#07122e', '#1d3a6e', '#4a6aa5'], sun: '#eef4ff', sea: ['#3a5a92', '#06102a'], cliff: '#0b0f1c' },
    { sky: ['#f7b1a0', '#ffd8a8', '#fff3d6'], sun: '#ffffff', sea: ['#9ec9d6', '#3f6f8f'], cliff: '#3a2a2a' },
    { sky: ['#1f2a2e', '#56666a', '#9aa6a2'], sun: '#dfe7e0', sea: ['#5f7470', '#1a2426'], cliff: '#161a1a' },
  ];
  function painting(sc, seed) {
    const cv = makeCanvas(S, S), g = cv.getContext('2d'), r = rng(seed);
    let gr = g.createLinearGradient(0, 0, 0, S * 0.62);
    gr.addColorStop(0, sc.sky[0]); gr.addColorStop(0.65, sc.sky[1]); gr.addColorStop(1, sc.sky[2]);
    g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.62);
    // sun and glow
    const sx = S * 0.3, sy = S * 0.5;
    gr = g.createRadialGradient(sx, sy, 0, sx, sy, S * 0.4);
    gr.addColorStop(0, sc.sun); gr.addColorStop(0.12, sc.sun); gr.addColorStop(0.14, 'rgba(255,220,160,0.5)'); gr.addColorStop(1, 'rgba(255,200,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.62);
    // clouds
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(255,${(180 + r() * 60) | 0},${(150 + r() * 60) | 0},${(0.12 + r() * 0.2).toFixed(2)})`;
      g.beginPath(); g.ellipse(r() * S, S * (0.12 + r() * 0.3), S * (0.12 + r() * 0.2), S * (0.015 + r() * 0.02), 0, 0, TAU); g.fill();
    }
    // sea
    gr = g.createLinearGradient(0, S * 0.62, 0, S);
    gr.addColorStop(0, sc.sea[0]); gr.addColorStop(1, sc.sea[1]);
    g.fillStyle = gr; g.fillRect(0, S * 0.62, S, S * 0.38);
    for (let i = 0; i < 70; i++) {
      const y = S * (0.63 + r() * 0.36), w = S * (0.03 + r() * 0.1) * (1 - (y / S - 0.6));
      g.fillStyle = `rgba(255,${(200 + r() * 55) | 0},${(160 + r() * 60) | 0},${(0.15 + r() * 0.35).toFixed(2)})`;
      g.fillRect(sx - S * 0.12 + (r() - 0.5) * S * 0.35, y, w, 2);
    }
    // cliff
    g.fillStyle = sc.cliff; g.beginPath(); g.moveTo(S * 0.55, S);
    g.lineTo(S * 0.6, S * 0.66); g.lineTo(S * 0.66, S * 0.6); g.lineTo(S * 0.72, S * 0.57); g.lineTo(S * 0.9, S * 0.55); g.lineTo(S, S * 0.56); g.lineTo(S, S); g.closePath(); g.fill();
    // lighthouse
    const lx = S * 0.8, ly = S * 0.555;
    g.fillStyle = '#efe6da'; g.beginPath(); g.moveTo(lx - 14, ly); g.lineTo(lx - 9, ly - 110); g.lineTo(lx + 9, ly - 110); g.lineTo(lx + 14, ly); g.closePath(); g.fill();
    g.fillStyle = '#b8322b'; for (const k of [0.2, 0.55]) { const y = ly - 110 * k; g.fillRect(lx - 13 + k * 4, y - 12, 26 - k * 8, 14); }
    g.fillStyle = '#2a2020'; g.fillRect(lx - 12, ly - 124, 24, 14);
    g.fillStyle = '#fff4c0'; g.fillRect(lx - 8, ly - 122, 16, 10);
    g.fillStyle = '#2a2020'; g.beginPath(); g.moveTo(lx - 13, ly - 124); g.lineTo(lx, ly - 136); g.lineTo(lx + 13, ly - 124); g.fill();
    gr = g.createLinearGradient(lx, ly - 117, lx - S * 0.5, ly - 150);
    gr.addColorStop(0, 'rgba(255,245,200,0.55)'); gr.addColorStop(1, 'rgba(255,245,200,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(lx, ly - 120); g.lineTo(lx - S * 0.55, ly - 190); g.lineTo(lx - S * 0.55, ly - 120); g.closePath(); g.fill();
    // brush strokes sampled from the picture itself: the "oil painting" look
    const id = g.getImageData(0, 0, S, S).data;
    for (let i = 0; i < 5200; i++) {
      const x = r() * S, y = r() * S, k = ((y | 0) * S + (x | 0)) * 4;
      g.save(); g.translate(x, y); g.rotate((y < S * 0.62 ? 0 : 0.05) + (r() - 0.5) * 0.5);
      g.fillStyle = `rgba(${id[k] + (r() - 0.5) * 30 | 0},${id[k + 1] + (r() - 0.5) * 30 | 0},${id[k + 2] + (r() - 0.5) * 30 | 0},0.55)`;
      g.beginPath(); g.ellipse(0, 0, 3 + r() * 6, 1 + r() * 1.6, 0, 0, TAU); g.fill();
      g.restore();
    }
    return cv;
  }
  function blurred(src, px) { const cv = makeCanvas(S, S), g = cv.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0); return cv; }
  function prep() {
    paint = SCHEMES.map((sc, i) => painting(sc, 220 + i));
    blurs = [blurred(paint[0], 40), blurred(paint[0], 16), blurred(paint[0], 6)];
    const r = rng(2022);
    for (let k = 0; k < 4; k++) {
      const n = makeCanvas(160, 160), g = n.getContext('2d'), id = g.createImageData(160, 160);
      for (let i = 0; i < id.data.length; i += 4) { const v = (r() + r() + r()) / 3; id.data[i] = r() * 255 * v * 1.6; id.data[i + 1] = r() * 255 * v * 1.6; id.data[i + 2] = r() * 255 * v * 1.6; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      noise.push(n);
    }
  }
  function audio(t0) {
    sfxTyping(TT.map(x => x + t0), PROMPT, 'key', 0.07, 0.8);
    sfx(t0 + T0, 'denoise', { dur: T1 - T0 });
    sfx(t0 + T1, 'chime');
    for (let i = 0; i < 3; i++) sfx(t0 + GRID + 0.2 + i * 0.25, 'pop', { f: 1 + i * 0.2 });
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    // prompt box
    const n = countTyped(TT, lt);
    c.save(); c.globalAlpha = inP;
    c.fillStyle = 'rgba(16,10,24,0.9)'; roundRect(c, VCX - 380, 170, 760, 82, 41); c.fill();
    c.strokeStyle = 'rgba(255,180,140,0.45)'; c.lineWidth = 1.5; c.stroke();
    text(c, '✦', VCX - 340, 222, { f: font(700, 24, F.sym), color: 'rgb(255,180,140)' });
    text(c, PROMPT.slice(0, n), VCX - 300, 219, { f: font(400, 25, F.zh), color: '#fff', sp: 1 });
    c.font = font(400, 25, F.zh); c.letterSpacing = '1px';
    if (n < PROMPT.length || Math.floor(lt * 2.5) % 2 === 0) { c.fillStyle = '#fff'; c.fillRect(VCX - 300 + c.measureText(PROMPT.slice(0, n)).width + 4, 196, 2.5, 30); }
    text(c, PROMPT_EN, VCX - 300, 243, { f: font(400, 13, F.mono), color: 'rgba(255,200,170,0.6)', alpha: prog(TT.end, TT.end + 0.3, lt) });
    c.restore();
    // the canvas: noise -> picture
    const g4 = E.io3(prog(GRID, GRID + 0.7, lt));
    const size = lerp(S, 250, g4), gx = lerp(IX, VCX - 130, g4), gy = lerp(IY + 40, 450, g4);
    const u = prog(T0, T1, lt), step = Math.min(STEPS, Math.floor(u * STEPS + (u > 0 ? 1 : 0)));
    const noiseA = lt < T0 ? 1 : Math.pow(1 - u, 1.3);
    c.save(); c.globalAlpha = E.out3(prog(TT.end - 0.2, TT.end + 0.4, lt));
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40;
    c.fillStyle = '#000'; c.fillRect(gx - size / 2, gy - size / 2, size, size);
    c.shadowBlur = 0;
    if (u > 0) {
      const b = u < 0.33 ? blurs[0] : u < 0.6 ? blurs[1] : u < 0.85 ? blurs[2] : paint[0];
      c.drawImage(b, gx - size / 2, gy - size / 2, size, size);
      if (u >= 0.85 && u < 1) { c.globalAlpha *= 1; c.drawImage(paint[0], gx - size / 2, gy - size / 2, size, size); }
    }
    if (noiseA > 0.005) {
      const a0 = c.globalAlpha;
      c.globalAlpha = a0 * noiseA; c.imageSmoothingEnabled = false;
      c.drawImage(noise[mod(Math.floor(lt * 24), 4)], gx - size / 2, gy - size / 2, size, size);
      c.globalAlpha = a0;
    }
    c.restore();
    // the other three variations
    if (g4 > 0) {
      [[VCX + 130, 450], [VCX - 130, 710], [VCX + 130, 710]].forEach(([x, y], i) => {
        const p = E.outBack(prog(GRID + 0.2 + i * 0.25, GRID + 0.6 + i * 0.25, lt));
        if (p <= 0) return;
        c.save(); c.translate(x, y); c.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
        c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30;
        c.drawImage(paint[i + 1], -125, -125, 250, 250);
        c.restore();
      });
    }
    // step counter
    const sa = E.out3(prog(T0 - 0.2, T0 + 0.2, lt)) * (1 - prog(GRID - 0.2, GRID + 0.2, lt));
    if (sa > 0) {
      text(c, `去噪 DENOISING  ·  第 ${step}/${STEPS} 步`, IX, IY + 40 + S / 2 + 42, { f: font(700, 18, F.zh), color: 'rgb(255,190,150)', align: 'center', sp: 2, alpha: sa });
      c.fillStyle = 'rgba(255,190,150,0.15)'; c.fillRect(IX - 200, IY + 40 + S / 2 + 58, 400, 5);
      c.fillStyle = 'rgba(255,190,150,0.9)'; c.fillRect(IX - 200, IY + 40 + S / 2 + 58, 400 * u, 5);
    }
    const va = E.out3(prog(GRID + 1.0, GRID + 1.5, lt));
    text(c, '同一句话，四种画法', VCX, 900, { f: font(700, 22, F.zh), color: '#fff', align: 'center', sp: 4, alpha: va });
  }
  return { prep, audio, draw };
})();

/* ================================================= 2022 ChatGPT boom */
VIS.y2022 = (() => {
  const WX = 975, WY = 240, WW = 770, WH = 420;
  const Q = '用一句话讲讲人工智能的历史。';
  const ANSWER = '七十多年前，图灵问：“机器能思考吗？”今天，你正在向一台机器提问。';
  const T_USER = 0.5, T_ANS = 1.3, CPS = 13, CHIPS = 6.0;
  const TILES = [[1015, 212, 118, -0.08], [1712, 228, 108, 0.07], [1800, 500, 120, 0.05], [925, 600, 112, -0.06], [1790, 770, 104, 0.06]];
  const USES = [['写诗', 'poems'], ['写代码', 'code'], ['翻译', 'translate'], ['总结', 'summarize'], ['学习辅导', 'tutoring'], ['头脑风暴', 'brainstorm'], ['写邮件', 'email'], ['做计划', 'planning']];
  let ansLines = [], tileArt = [], tileNoise = [];
  function prep() {
    lctx.font = font(400, 28, F.zh); lctx.letterSpacing = '1px';
    ansLines = wrapZh(lctx, ANSWER, 640);
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
  const nChars = () => ANSWER.length;
  function audio(t0) {
    sfx(t0 + T_USER, 'pop');
    for (let i = 0; i < nChars(); i += 2) sfx(t0 + T_ANS + i / CPS, 'tok', { v: 0.45 });
    sfx(t0 + 4.7, 'pop', { f: 1.3 }); sfx(t0 + 5.2, 'pop', { f: 1.6 });
    USES.forEach((_, i) => sfx(t0 + CHIPS + i * 0.18, 'dot', { v: 0.4 }));
  }
  function card(c, x, y, w, h, big, label, k, col) {
    if (k <= 0) return;
    c.save();
    c.globalAlpha = k; c.translate(0, (1 - k) * 24);
    c.fillStyle = 'rgba(20,16,38,0.88)'; roundRect(c, x, y, w, h, 16); c.fill();
    c.strokeStyle = rgba(col, 0.6); c.lineWidth = 1.5; c.stroke();
    text(c, big, x + 26, y + 58, { f: font(700, 40, F.sans), color: '#fff' });
    text(c, label, x + 28, y + 90, { f: font(700, 16, F.zh), color: rgba(col, 1), sp: 2 });
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
    // orbiting use-case chips (behind the window on the far side of the orbit)
    const chipA = E.out3(prog(CHIPS, CHIPS + 0.6, lt));
    const chips = USES.map(([zh, en], i) => {
      const a = (i / USES.length) * TAU + lt * 0.5, x = VCX + Math.cos(a) * 520, z = Math.sin(a), y = 460 + Math.sin(a) * 60 + (i % 2 ? -150 : 170);
      return { zh, en, x, y, z, s: 0.8 + 0.25 * z, k: chipA * E.out3(prog(CHIPS + i * 0.18, CHIPS + 0.4 + i * 0.18, lt)) };
    });
    const drawChip = ch => {
      if (ch.k <= 0) return;
      c.save(); c.translate(ch.x, ch.y); c.scale(ch.s, ch.s); c.globalAlpha = ch.k * (0.55 + 0.45 * (ch.z + 1) / 2);
      c.font = font(700, 22, F.zh); c.letterSpacing = '1px';
      const w = c.measureText(ch.zh).width + 110;
      c.fillStyle = 'rgba(30,20,50,0.9)'; roundRect(c, -w / 2, -26, w, 52, 26); c.fill();
      c.strokeStyle = 'rgba(120,255,225,0.6)'; c.lineWidth = 1.5; c.stroke();
      text(c, ch.zh, -w / 2 + 22, 8, { color: '#fff', sp: 1 });
      text(c, ch.en, w / 2 - 20, 7, { f: font(600, 12, F.mono), color: 'rgba(120,255,225,0.9)', align: 'right', sp: 1 });
      c.restore();
    };
    chips.filter(ch => ch.z < 0).forEach(drawChip);
    // chat window
    c.save();
    c.globalAlpha = inP; c.translate(0, (1 - inP) * 30);
    c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 40;
    c.fillStyle = 'rgba(16,13,30,0.92)'; roundRect(c, WX, WY, WW, WH, 22); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 1.5; c.stroke();
    [[255, 95, 87], [255, 189, 46], [40, 200, 64]].forEach((col, i) => { c.fillStyle = rgba(col, 0.9); c.beginPath(); c.arc(WX + 28 + i * 22, WY + 26, 6, 0, TAU); c.fill(); });
    text(c, '新对话 NEW CHAT', WX + WW / 2, WY + 32, { f: font(700, 13, F.zh), color: 'rgba(255,255,255,0.45)', align: 'center', sp: 3 });
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(WX, WY + 52); c.lineTo(WX + WW, WY + 52); c.stroke();
    const up = E.outBack(prog(T_USER, T_USER + 0.35, lt));
    if (up > 0) {
      c.font = font(400, 26, F.zh); c.letterSpacing = '1px';
      const tw = c.measureText(Q).width, bx = WX + WW - 34 - tw - 40, by = WY + 80;
      c.save(); c.globalAlpha = inP * clamp(up); c.translate(bx + tw + 40, by); c.scale(clamp(up, 0, 1.1), clamp(up, 0, 1.1)); c.translate(-(bx + tw + 40), -by);
      c.fillStyle = 'rgba(120,110,255,0.35)'; roundRect(c, bx, by, tw + 40, 58, 22); c.fill();
      text(c, Q, bx + 20, by + 38, { color: '#fff', sp: 1 });
      c.restore();
    }
    const nc = Math.floor(clamp((lt - T_ANS) * CPS, 0, 999));
    if (lt > T_ANS - 0.3) {
      const ax = WX + 42, ay = WY + 196;
      const ag = c.createLinearGradient(ax - 16, ay - 16, ax + 16, ay + 16);
      ag.addColorStop(0, '#ff7ac6'); ag.addColorStop(1, '#6bd6ff');
      c.fillStyle = ag; c.beginPath(); c.arc(ax, ay, 16, 0, TAU); c.fill();
      text(c, '✦', ax, ay + 7, { f: font(700, 18, F.sym), color: '#fff', align: 'center' });
      c.font = font(400, 28, F.zh); c.letterSpacing = '1px'; c.fillStyle = '#f2f0ff'; c.textAlign = 'left';
      let k = 0, lastX = ax + 30, lastY = ay + 8;
      ansLines.forEach((line, li) => {
        let x = ax + 32;
        for (const tk of line) {
          const w = c.measureText(tk).width;
          if (k < nc) { c.fillText(tk, x, ay + 10 + li * 46); lastX = x + w; lastY = ay + 10 + li * 46; }
          x += w; k += tk.length;
        }
      });
      if (nc < nChars() || Math.floor(lt * 2.5) % 2 === 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(lastX + 12, lastY - 9, 6, 0, TAU); c.fill(); }
    }
    c.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(c, WX + 24, WY + WH - 74, WW - 48, 50, 25); c.fill();
    text(c, '给 AI 发消息……', WX + 50, WY + WH - 42, { f: font(400, 19, F.zh), color: 'rgba(255,255,255,0.35)' });
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(WX + WW - 50, WY + WH - 49, 16, 0, TAU); c.fill();
    text(c, '↑', WX + WW - 50, WY + WH - 42, { f: font(700, 19, F.body), color: '#16122a', align: 'center' });
    c.restore();
    const k1 = E.out3(prog(4.7, 5.2, lt)), k2 = E.out3(prog(5.2, 5.7, lt));
    const n1 = Math.round(1e6 * E.out3(prog(4.7, 5.7, lt))).toLocaleString('en-US');
    const n2 = Math.round(1e8 * E.out3(prog(5.2, 6.3, lt))).toLocaleString('en-US');
    card(c, WX, 700, 370, 112, n1, '5 天内的用户数', k1, [120, 255, 225]);
    card(c, WX + 400, 700, 370, 112, n2, '2 个月内的用户数', k2, [255, 140, 200]);
    chips.filter(ch => ch.z >= 0).forEach(drawChip);
  }
  return { prep, audio, draw };
})();

/* ================================================ 2023 multimodal models */
VIS.y2023 = (() => {
  const CORE = [VCX, 520], CY_ = [150, 200, 255], TEAL = [60, 230, 210], PINK = [255, 130, 200], GOLD = [255, 210, 120];
  const MODELS = ['GPT-4', 'Claude', 'Gemini', 'Llama'];
  const IN = [
    { zh: '图像', en: 'IMAGE', x: 1000, y: 280, col: PINK, t: 0.6 },
    { zh: '语音', en: 'AUDIO', x: 960, y: 560, col: TEAL, t: 1.0 },
    { zh: '文字与代码', en: 'TEXT & CODE', x: 1010, y: 820, col: GOLD, t: 1.4 },
  ];
  const OUT = 3.6;
  const OUTS = [['描述图片', 'describe'], ['回答问题', 'answer'], ['编写代码', 'code'], ['开口说话', 'speak']];
  function audio(t0) {
    IN.forEach(s => sfx(t0 + s.t, 'whoosh', { dur: 0.6 }));
    sfx(t0 + 2.4, 'swell');
    OUTS.forEach((_, i) => sfx(t0 + OUT + i * 0.3, 'dot', { v: 0.5 }));
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    const [cx, cy] = CORE, pulse = 0.5 + 0.5 * Math.sin(lt * 4);
    // streams flowing into the core
    c.save(); c.globalCompositeOperation = 'lighter';
    IN.forEach((s, k) => {
      const a = E.out3(prog(s.t, s.t + 0.5, lt));
      if (a <= 0) return;
      for (let i = 0; i < 26; i++) {
        const u = (lt * 0.7 + i / 26 + k * 0.13) % 1, bend = Math.sin(u * Math.PI) * (k - 1) * 60;
        const x = lerp(s.x + 90, cx - 60, u), y = lerp(s.y, cy, u) + bend;
        glow(c, x, y, 8 + 6 * Math.sin(u * Math.PI), s.col, a * 0.8 * Math.sin(Math.PI * u));
      }
    });
    c.restore();
    // input tiles
    IN.forEach((s, k) => {
      const a = inP * E.out3(prog(s.t - 0.3, s.t + 0.2, lt));
      if (a <= 0) return;
      c.save(); c.globalAlpha = a; c.translate(s.x, s.y);
      c.fillStyle = 'rgba(10,14,34,0.9)'; roundRect(c, -90, -56, 180, 112, 14); c.fill();
      c.strokeStyle = rgba(s.col, 0.7); c.lineWidth = 1.5; c.stroke();
      if (k === 0) {   // an image, split into patches
        for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
          const g = hash(i * 7 + j, 3);
          c.fillStyle = rgba(mixc([255, 150, 90], [90, 130, 220], j / 3 + g * 0.2), 0.9);
          const off = Math.sin(lt * 3 + i + j) * 2 * prog(1.5, 2.5, lt);
          c.fillRect(-72 + i * 24 + off, -38 + j * 19, 22, 17);
        }
      } else if (k === 1) {   // a waveform
        c.strokeStyle = rgba(s.col, 1); c.lineWidth = 2.5; c.beginPath();
        for (let x = -72; x <= 72; x += 3) { const y = Math.sin(x * 0.12 + lt * 8) * 22 * Math.exp(-Math.pow(x / 60, 2)) * (0.6 + 0.4 * Math.sin(x * 0.05 - lt * 3)); x === -72 ? c.moveTo(x, y) : c.lineTo(x, y); }
        c.stroke();
      } else {
        ['def solve(x):', '  return x * 2', '# 解释这段代码'].forEach((ln, i) => text(c, ln, -74, -22 + i * 24, { f: font(500, 15, F.mono), color: rgba(mixc(s.col, WHITE, 0.4), 1) }));
      }
      text(c, s.zh + '  ' + s.en, 0, 84, { f: font(700, 14, F.zh), color: rgba(s.col, 1), align: 'center', sp: 2 });
      c.restore();
    });
    // the model core
    const ca = E.out3(prog(0.2, 0.9, lt));
    c.save(); c.globalAlpha = ca;
    c.globalCompositeOperation = 'lighter';
    glow(c, cx, cy, 260 + 30 * pulse, [110, 150, 255], 0.35, false);
    c.lineCap = 'round';
    for (let r = 0; r < 4; r++) {
      c.save(); c.translate(cx, cy); c.rotate(lt * (0.6 + r * 0.25) * (r % 2 ? -1 : 1)); c.scale(1, 0.35 + r * 0.12);
      c.strokeStyle = rgba(mixc(CY_, [r % 2 ? 255 : 120, 160, 255], 0.5), 0.5); c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 110 + r * 22, 0, TAU * 0.8); c.stroke();
      c.restore();
    }
    c.globalCompositeOperation = 'source-over';
    const g = c.createRadialGradient(cx - 20, cy - 24, 6, cx, cy, 80);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#9ec2ff'); g.addColorStop(1, '#2a3a9a');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 78, 0, TAU); c.fill();
    text(c, '大模型', cx, cy + 10, { f: font(700, 28, F.zh), color: '#0c1440', align: 'center', sp: 2 });
    c.restore();
    // model names orbiting on a ring
    MODELS.forEach((m, i) => {
      const a = (i / 4) * TAU + lt * 0.35, x = cx + Math.cos(a) * 200, y = cy + Math.sin(a) * 200 * 0.42 - 150;
      const k = E.out3(prog(1.8 + i * 0.12, 2.3 + i * 0.12, lt));
      text(c, m, x, y, { f: font(700, 22, F.sans), color: '#eaf1ff', align: 'center', alpha: k * (0.6 + 0.4 * (Math.sin(a) + 1) / 2) });
    });
    // outputs to the right
    OUTS.forEach(([zh, en], i) => {
      const k = E.outBack(prog(OUT + i * 0.3, OUT + 0.4 + i * 0.3, lt));
      if (k <= 0) return;
      const x = 1690, y = 330 + i * 110;
      c.save(); c.globalAlpha = clamp(k); c.translate(x, y); c.scale(clamp(k, 0, 1.1), clamp(k, 0, 1.1));
      c.fillStyle = 'rgba(16,24,50,0.92)'; roundRect(c, -100, -32, 200, 64, 32); c.fill();
      c.strokeStyle = rgba(CY_, 0.6); c.lineWidth = 1.5; c.stroke();
      text(c, '✓ ' + zh, 0, 4, { f: font(700, 21, F.zh), color: '#fff', align: 'center', sp: 1 });
      text(c, en.toUpperCase(), 0, 24, { f: font(600, 11, F.mono), color: rgba(CY_, 1), align: 'center', sp: 2 });
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter';
      const u = (lt * 0.8 + i * 0.25) % 1;
      glow(c, lerp(cx + 80, x - 100, u), lerp(cy, y, u), 9, CY_, 0.7 * Math.sin(Math.PI * u) * clamp(k));
      c.restore();
    });
    const ba = E.out3(prog(5.4, 6.0, lt));
    if (ba > 0) {
      c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 14;
      text(c, 'GPT-4 模拟律师资格考试：超过约 90% 的考生', VCX, 900, { f: font(700, 22, F.zh), color: rgba(GOLD, 1), align: 'center', sp: 2, alpha: ba });
      c.restore();
    }
    biLabel(c, '多模态：一个模型，多种感官', 'MULTIMODAL MODELS', VCX, 170, { col: rgba(CY_, 1), alpha: inP, zs: 19, es: 12 });
  }
  return { audio, draw };
})();

/* ======================================================= 2024 Nobel */
VIS.y2024 = (() => {
  const GOLD = [255, 214, 125];
  const MED = [
    { x: 1150, label: 'NOBEL PRIZE IN PHYSICS  ·  2024  ·  ', cat: '物理学奖 PHYSICS', names: ['霍普菲尔德 · 辛顿', 'Hopfield · Hinton'], note: '人工神经网络的奠基性发现', icon: 'net' },
    { x: 1570, label: 'NOBEL PRIZE IN CHEMISTRY  ·  2024  ·  ', cat: '化学奖 CHEMISTRY', names: ['哈萨比斯 · 詹珀 · 贝克', 'Hassabis · Jumper · Baker'], note: '蛋白质结构预测与设计', icon: 'helix' },
  ];
  const MY = 430, MR = 150;
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
  function audio(t0) { MED.forEach((_, i) => sfx(t0 + 1.0 + i * 0.6, 'bell', { f: i ? 1.5 : 1 })); }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.5, lt));
    biLabel(c, '2024 年诺贝尔奖', 'THE 2024 NOBEL PRIZES', VCX, 200, { col: rgba(GOLD, 1), alpha: 0.9 * inP, zs: 20, es: 13 });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const x = VCX + (hash(i, 7) - 0.5) * 950, y = 180 + hash(i, 8) * 650 - ((lt * (15 + 25 * hash(i, 9))) % 80);
      glow(c, x, y, 4 + 7 * hash(i, 10), GOLD, inP * Math.max(0, Math.sin(lt * (2 + hash(i, 11) * 3) + i * 1.7)) * 0.7);
    }
    c.restore();
    MED.forEach((m, i) => {
      const p = E.out3(prog(0.3 + i * 0.6, 1.2 + i * 0.6, lt));
      if (p <= 0) return;
      const sx = Math.max(0.02, Math.abs(Math.cos((1 - p) * Math.PI * 2.5)));
      const y = MY + Math.sin(lt * 1.3 + i) * 5 - (1 - p) * 80;
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, m.x, y, 260, GOLD, 0.35 * p, false); c.restore();
      c.save();
      c.translate(m.x, y); c.scale(sx * lerp(0.6, 1, p), lerp(0.6, 1, p));
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 30; c.shadowOffsetY = 14;
      c.drawImage(imgs[i], -170, -170); c.shadowBlur = 0; c.shadowOffsetY = 0;
      const sh = prog(1.6 + i * 0.4, 2.5 + i * 0.4, lt);
      if (sh > 0 && sh < 1) {
        c.beginPath(); c.arc(0, 0, 165, 0, TAU); c.clip();
        const bx = lerp(-260, 260, sh), g = c.createLinearGradient(bx - 60, -170, bx + 60, 170);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,240,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(-170, -170, 340, 340);
      }
      c.restore();
      const ta = E.out3(prog(1.1 + i * 0.6, 1.6 + i * 0.6, lt));
      text(c, m.cat, m.x, MY + MR + 58, { f: font(700, 17, F.zh), color: rgba(GOLD, 1), align: 'center', sp: 4, alpha: ta });
      text(c, m.names[0], m.x, MY + MR + 100, { f: font(700, 26, F.zh), color: '#fff', align: 'center', sp: 2, alpha: ta });
      text(c, m.names[1], m.x, MY + MR + 132, { f: font(500, 18, F.sans), color: 'rgba(255,236,200,0.8)', align: 'center', alpha: ta });
      text(c, m.note, m.x, MY + MR + 168, { f: font(400, 18, F.zh), color: 'rgba(255,236,200,0.75)', align: 'center', sp: 1, alpha: ta });
    });
  }
  return { prep, audio, draw };
})();

/* =================================================== 2025 Reasoning + agents */
VIS.y2025 = (() => {
  const GOLD = [255, 214, 125], CY_ = [140, 220, 255], RED = [255, 120, 120], GREEN = [120, 255, 170];
  const NODES = [
    { x: 1000, y: 520, t: 0.2 },
    { p: 0, x: 1165, y: 350, t: 0.45, note: '试小例子' }, { p: 0, x: 1165, y: 520, t: 0.55, note: '对 n 归纳' }, { p: 0, x: 1165, y: 690, t: 0.65, note: '反证法？' },
    { p: 1, x: 1330, y: 290, t: 1.0, dead: 1.7 }, { p: 1, x: 1330, y: 395, t: 1.05, dead: 1.8 },
    { p: 2, x: 1330, y: 485, t: 1.1 }, { p: 2, x: 1330, y: 575, t: 1.15, dead: 1.9 },
    { p: 3, x: 1330, y: 660, t: 1.2, dead: 1.75 }, { p: 3, x: 1330, y: 755, t: 1.25, dead: 1.85 },
    { p: 6, x: 1495, y: 410, t: 1.9, dead: 2.5, note: '模 4？' }, { p: 6, x: 1495, y: 500, t: 2.0, note: 'a² + b² ≥ 2ab' }, { p: 6, x: 1495, y: 590, t: 2.1, dead: 2.6 },
    { p: 11, x: 1665, y: 500, t: 2.75, goal: true },
  ];
  const PATH = [0, 2, 6, 11, 13], LIGHT = 3.0, BADGE = 4.0, AG = 6.0;
  const WINS = [
    { zh: '终端', en: 'TERMINAL', x: 1070, t: AG + 0.6 },
    { zh: '浏览器', en: 'BROWSER', x: 1360, t: AG + 0.9 },
    { zh: '编辑器', en: 'EDITOR', x: 1650, t: AG + 1.2 },
  ];
  const STEPS = [['计划', 'PLAN'], ['搜索', 'SEARCH'], ['写代码', 'CODE'], ['测试', 'TEST'], ['交付', 'DELIVER']];
  const STEP_T = k => AG + 1.6 + k * 0.72, DONE = AG + 1.6 + 5 * 0.72;
  function audio(t0) {
    NODES.forEach(n => sfx(t0 + n.t, 'dot', { v: 0.45 }));
    sfx(t0 + LIGHT + 0.75, 'chime'); sfx(t0 + BADGE, 'bell', { f: 2 });
    WINS.forEach(w => sfx(t0 + w.t, 'pop', { f: 1.2 }));
    STEPS.forEach((_, k) => sfx(t0 + STEP_T(k) + 0.5, 'check', { v: 0.7 }));
    sfx(t0 + DONE + 0.1, 'chime');
  }
  function drawTree(c, lt, A) {
    const inP = E.out3(prog(0, 0.5, lt)) * A;
    biLabel(c, '推理：尝试、检验、回溯', 'EXPLORE · CHECK · BACKTRACK', VCX, 200, { col: rgba(CY_, 1), alpha: 0.9 * inP * (1 - prog(BADGE - 0.3, BADGE, lt)), zs: 18, es: 12 });
    const pathLit = i => { const k = PATH.indexOf(i); return k < 0 ? 0 : E.out2(prog(LIGHT + k * 0.2, LIGHT + k * 0.2 + 0.25, lt)); };
    c.save(); c.globalAlpha = A; c.lineCap = 'round';
    NODES.forEach((n, i) => {
      if (n.p === undefined) return;
      const P = NODES[n.p], g = E.out3(prog(n.t - 0.2, n.t + 0.1, lt));
      if (g <= 0) return;
      const dead = n.dead && lt > n.dead ? prog(n.dead, n.dead + 0.3, lt) : 0, lit = Math.min(pathLit(i), pathLit(n.p));
      c.strokeStyle = rgba(mixc(mixc(CY_, RED, dead * 0.8), GOLD, lit), 0.55 - dead * 0.35 + lit * 0.45);
      c.lineWidth = 2 + lit * 2.5;
      c.beginPath(); c.moveTo(P.x, P.y); c.bezierCurveTo(P.x + 70, P.y, n.x - 70, n.y, lerp(P.x, n.x, g), lerp(P.y, n.y, g)); c.stroke();
    });
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < PATH.length - 1; k++) {
      const a = NODES[PATH[k]], b = NODES[PATH[k + 1]], q = prog(LIGHT + k * 0.2, LIGHT + (k + 1) * 0.2, lt);
      if (q > 0 && q < 1) glow(c, lerp(a.x, b.x, q), lerp(a.y, b.y, q), 40, GOLD, 1);
    }
    c.globalCompositeOperation = 'source-over';
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
      if (n.note) text(c, n.note, n.x, n.y - 22, { f: font(400, 15, F.zh), color: 'rgba(200,230,255,0.7)', align: 'center', alpha: g * (1 - dead * 0.6) });
    });
    const qa = E.out3(prog(LIGHT + 0.85, LIGHT + 1.2, lt));
    text(c, '证毕 Q.E.D.', 1665, 562, { f: font(700, 20, F.zh), color: rgba(GOLD, 1), align: 'center', sp: 2, alpha: qa });
    c.restore();
    const ba = E.outBack(prog(BADGE, BADGE + 0.45, lt)) * A;
    if (ba > 0) {
      c.save();
      c.translate(VCX, 208); c.scale(clamp(ba, 0, 1.2), clamp(ba, 0, 1.2));
      c.fillStyle = 'rgba(40,30,8,0.92)'; roundRect(c, -300, -32, 600, 64, 32); c.fill();
      c.strokeStyle = rgba(GOLD, 0.9); c.lineWidth = 2; c.stroke();
      const mg = c.createRadialGradient(-263, -6, 2, -262, 0, 18); mg.addColorStop(0, '#fff3c4'); mg.addColorStop(1, '#c8922e');
      c.fillStyle = mg; c.beginPath(); c.arc(-262, 0, 17, 0, TAU); c.fill();
      text(c, '国际数学奥赛 IMO 2025 · 金牌水平', 18, 8, { f: font(700, 22, F.zh), color: rgba(GOLD, 1), align: 'center', sp: 2 });
      c.restore();
    }
  }
  function drawAgents(c, lt) {
    const a = E.out3(prog(AG, AG + 0.6, lt));
    if (a <= 0) return;
    const ax = VCX, ay = 250;
    biLabel(c, '智能体：自己规划、调用工具、完成任务', 'AI AGENTS', VCX, 170, { col: rgba(CY_, 1), alpha: a, zs: 18, es: 12 });
    // task
    text(c, '任务：修复登录页的 bug，测试通过后提交', ax, 330, { f: font(700, 20, F.zh), color: '#fff', align: 'center', sp: 1, alpha: E.out3(prog(AG + 0.3, AG + 0.8, lt)) });
    // agent orb
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
    glow(c, ax, ay, 90 + 10 * Math.sin(lt * 5), CY_, 0.6, false);
    for (let r = 0; r < 3; r++) {
      c.save(); c.translate(ax, ay); c.rotate(lt * (1 + r * 0.4) * (r % 2 ? -1 : 1)); c.scale(1, 0.4);
      c.strokeStyle = rgba(CY_, 0.6); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 40 + r * 10, 0, TAU * 0.7); c.stroke();
      c.restore();
    }
    c.restore();
    c.fillStyle = '#e8f7ff'; c.beginPath(); c.arc(ax, ay, 18 * a, 0, TAU); c.fill();
    // tool windows
    const cur = STEPS.findIndex((_, k) => lt < STEP_T(k) + 0.72);
    WINS.forEach((w, i) => {
      const k = E.outBack(prog(w.t, w.t + 0.45, lt));
      if (k <= 0) return;
      const x = w.x, y = 560, ww = 270, hh = 190;
      c.save();
      c.strokeStyle = rgba(CY_, 0.35 * clamp(k)); c.lineWidth = 1.5; c.setLineDash([5, 6]);
      c.beginPath(); c.moveTo(ax, ay + 20); c.lineTo(x, y - hh / 2); c.stroke(); c.setLineDash([]);
      const u = (lt * 1.2 + i * 0.3) % 1;
      c.globalCompositeOperation = 'lighter'; glow(c, lerp(ax, x, u), lerp(ay + 20, y - hh / 2, u), 10, CY_, 0.8 * clamp(k)); c.globalCompositeOperation = 'source-over';
      c.translate(x, y); c.scale(clamp(k, 0, 1.1), clamp(k, 0, 1.1)); c.globalAlpha = clamp(k);
      c.fillStyle = 'rgba(10,16,30,0.94)'; roundRect(c, -ww / 2, -hh / 2, ww, hh, 12); c.fill();
      c.strokeStyle = 'rgba(160,210,255,0.35)'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = 'rgba(160,210,255,0.1)'; c.fillRect(-ww / 2, -hh / 2, ww, 30);
      text(c, `${w.zh}  ${w.en}`, -ww / 2 + 14, -hh / 2 + 21, { f: font(700, 13, F.zh), color: 'rgba(200,230,255,0.85)', sp: 1 });
      const L = -ww / 2 + 16, T = -hh / 2 + 56;
      if (i === 0) {
        const lines = [['$ npm test', '#cfe8ff'], ['✕ login.spec  1 failed', '#ff9a9a'], ['$ npm test', '#cfe8ff'], ['✓ 42 passed', '#9dffc4']];
        const shown = lt < STEP_T(3) ? 2 : lt < STEP_T(3) + 0.4 ? 3 : 4;
        lines.slice(0, shown).forEach(([s, col], j) => text(c, s, L, T + j * 30, { f: font(500, 15, F.mono), color: col }));
      } else if (i === 1) {
        c.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(c, L, T - 18, ww - 32, 28, 14); c.fill();
        text(c, '🔍 session cookie expired', L + 10, T + 2, { f: font(400, 13, F.mono), color: 'rgba(230,240,255,0.8)' });
        for (let j = 0; j < 3; j++) {
          const show = lt > STEP_T(1) + j * 0.2;
          if (!show) continue;
          c.fillStyle = 'rgba(140,200,255,0.8)'; c.fillRect(L, T + 26 + j * 34, 150 - j * 20, 7);
          c.fillStyle = 'rgba(200,220,255,0.3)'; c.fillRect(L, T + 38 + j * 34, 220, 5);
        }
      } else {
        const code = ['if (token.expired) {', '  await refresh(token);', '}', 'return session;'];
        const n = lt < STEP_T(2) ? 0 : Math.floor(prog(STEP_T(2), STEP_T(2) + 0.6, lt) * 4);
        code.forEach((s, j) => {
          const add = j < 3;
          if (add && j >= n) return;
          if (add) { c.fillStyle = 'rgba(80,255,150,0.12)'; c.fillRect(L - 6, T - 16 + j * 28, ww - 20, 24); }
          text(c, (add ? '+ ' : '  ') + s, L, T + j * 28, { f: font(500, 14, F.mono), color: add ? '#aef7c9' : 'rgba(220,230,255,0.7)' });
        });
      }
      c.restore();
    });
    // step checklist
    STEPS.forEach(([zh, en], k) => {
      const x = 1000 + k * 180, y = 800, done = lt > STEP_T(k) + 0.5, active = k === cur && !done;
      const ka = E.out3(prog(AG + 1.2 + k * 0.1, AG + 1.6 + k * 0.1, lt));
      c.save(); c.globalAlpha = ka;
      c.fillStyle = done ? 'rgba(40,120,80,0.35)' : 'rgba(20,30,50,0.8)'; roundRect(c, x - 80, y - 30, 160, 60, 30); c.fill();
      c.strokeStyle = done ? rgba(GREEN, 0.9) : active ? rgba(CY_, 0.9) : 'rgba(160,190,230,0.25)'; c.lineWidth = active ? 2.5 : 1.5; c.stroke();
      text(c, (done ? '✓ ' : `${k + 1} `) + zh, x, y + 6, { f: font(700, 19, F.zh), color: done ? rgba(GREEN, 1) : '#e8f1ff', align: 'center', sp: 1 });
      text(c, en, x, y + 50, { f: font(600, 11, F.mono), color: 'rgba(180,210,240,0.6)', align: 'center', sp: 2 });
      c.restore();
      if (k < 4) { c.strokeStyle = `rgba(160,190,230,${(0.3 * ka).toFixed(3)})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 82, y); c.lineTo(x + 98, y); c.stroke(); }
    });
    const da = E.outBack(prog(DONE, DONE + 0.4, lt));
    if (da > 0) {
      c.save(); c.translate(VCX, 895); c.scale(clamp(da, 0, 1.15), clamp(da, 0, 1.15));
      text(c, '任务完成 ✓  TASK COMPLETE', 0, 0, { f: font(700, 26, F.zh), color: rgba(GREEN, 1), align: 'center', sp: 3 });
      c.restore();
    }
  }
  function draw(c, lt) {
    const A = 1 - E.io2(prog(AG - 0.5, AG + 0.1, lt));
    if (A > 0) drawTree(c, lt, A);
    drawAgents(c, lt);
  }
  return { audio, draw };
})();

/* ============================================================ FINALE */
VIS.finale = (() => {
  const CX = W / 2, CY = 455, R = 300;
  const WARP = 4.0, COL0 = 12.4, END = 15.0;
  const STARS = (() => { const r = rng(120); return Array.from({ length: 420 }, () => [(r() - 0.5) * 2.4, (r() - 0.5) * 1.6, r()]); })();
  const UY = [...new Set(YEARS.map(s => s.year))].map(y => YEARS.find(s => s.year === y));
  const SPH = (() => {
    const n = 620, pts = [], ga = Math.PI * (3 - Math.sqrt(5)), r = rng(121);
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
  const dist = lt => lt * 0.3 + 3.2 * smooth(prog(0, WARP, lt)) + 1.2 * E.in3(prog(2.5, WARP, lt));
  function audio(t0) {
    hit(t0 + WARP, 1.2); flash(t0 + WARP, 0.4, [200, 220, 255]);
    UY.forEach((_, k) => sfx(t0 + 0.2 + k * (WARP - 0.4) / UY.length, 'tick', { v: 0.25 }));
    hit(t0 + 13.2, 0.6); flash(t0 + 13.2, 0.35, [220, 235, 255]);
  }
  function draw(c, lt) {
    // warp through history
    const warp = prog(0, 0.3, lt) * (1 - prog(WARP - 0.2, WARP + 0.4, lt));
    if (warp > 0) {
      const d = dist(lt), speed = (dist(lt + 0.02) - dist(lt - 0.02)) / 0.04;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let b = 0; b < 3; b++) {
        c.strokeStyle = rgba([170, 205, 255], (0.25 + b * 0.25) * warp); c.lineWidth = 1 + b * 0.8;
        c.beginPath();
        STARS.forEach(([x, y, z0], i) => {
          if (i % 3 !== b) return;
          const z = ((z0 - d) % 1 + 1) % 1 + 0.03, z2 = z + 0.02 + 0.04 * speed;
          c.moveTo(CX + (x / z) * 500, CY + (y / z) * 500); c.lineTo(CX + (x / z2) * 500, CY + (y / z2) * 500);
        });
        c.stroke();
      }
      c.restore();
      UY.forEach((s, k) => {
        const z = 0.25 + 0.14 * (k + 1) - (0.14 * UY.length + 0.4) * (lt / WARP);
        if (z < 0.06 || z > 1.7) return;
        const a = prog(1.7, 1.3, z) * prog(0.06, 0.2, z) * warp, ang = k * 2.4;
        const x = CX + (Math.cos(ang) * 0.55 / z) * 500, y = CY + (Math.sin(ang) * 0.32 / z) * 500;
        const pal = s.pal.acc;
        c.save(); c.shadowColor = rgba(pal, 0.9); c.shadowBlur = 25;
        text(c, String(s.year), x, y, { f: font(700, Math.min(600, 46 / z), F.sans), color: rgba(mixc(pal, WHITE, 0.5), 1), align: 'center', base: 'middle', alpha: a });
        if (z < 0.6) text(c, s.zhTitle, x, y + 34 / z, { f: font(700, Math.min(200, 16 / z), F.zh), color: '#ffffff', align: 'center', base: 'middle', alpha: a * 0.8 });
        c.restore();
      });
    }
    // the sphere: a network of ideas, from one neuron to billions
    const form = E.out3(prog(WARP - 0.1, WARP + 1.5, lt)), links = E.out2(prog(WARP + 0.6, WARP + 1.8, lt));
    const col = prog(COL0, COL0 + 0.8, lt), fadeAll = 1 - prog(COL0 + 0.85, COL0 + 1.4, lt);
    if (form > 0 && fadeAll > 0) {
      const yaw = lt * 0.3, pitch = 0.35 + 0.1 * Math.sin(lt * 0.3), cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const shrink = 1 - E.in3(col);
      const grow = 1 + 0.08 * E.io2(prog(WARP, COL0, lt));
      const proj = SPH.pts.map(p => {
        const m = E.out3(clamp((form - p.d * 0.3) / 0.7));
        let x = lerp(p.sx, p.x, m), y = lerp(p.sy, p.y, m), z = lerp(p.sz, p.z, m);
        const X = x * cy - z * sy, Z1 = x * sy + z * cy, Y = y * cp - Z1 * sp, Z = y * sp + Z1 * cp;
        const s = 1400 / (1400 + Z * R * 1.6) * shrink * grow;
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
        for (let k = 0; k < 70; k++) {
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
    const last = prog(COL0 + 0.7, COL0 + 0.9, lt) * (1 - prog(COL0 + 1.2, END - 0.2, lt));
    if (last > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, CY, 34, [200, 225, 255], last); c.restore(); }
    // closing lines
    const l1 = E.out3(prog(WARP + 1.4, WARP + 2.1, lt)), l2 = E.out3(prog(WARP + 3.6, WARP + 4.3, lt)), out = 1 - E.in2(prog(COL0 - 0.3, COL0 + 0.3, lt));
    const line = (yr, zh, en, y, a, dim) => {
      if (a <= 0) return;
      c.font = font(500, 18, F.mono); c.letterSpacing = '6px';
      const w1 = c.measureText(yr).width + 34;
      c.font = font(700, 52, F.zhs); c.letterSpacing = '4px';
      const w2 = c.measureText(zh).width, x0 = CX - (w1 + w2) / 2;
      text(c, yr, x0, y - 8, { f: font(500, 18, F.mono), color: 'rgb(160,200,255)', sp: 6, alpha: a * dim });
      c.save(); c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 20;
      text(c, zh, x0 + w1, y + (1 - a) * 16, { f: font(700, 52, F.zhs), color: '#ffffff', sp: 4, alpha: a * dim });
      c.restore();
      text(c, en, x0 + w1 + 4, y + 36, { f: font(400, 20, F.serif, true), color: 'rgba(200,220,255,0.8)', alpha: a * dim });
    };
    line('1950', '“机器能思考吗？”', 'Can machines think?', 810, l1 * out, 1 - 0.45 * l2);
    line('2026', '“我们将一起创造什么？”', 'What will we build together?', 920, l2 * out, 1);
    // end card
    const ec = E.out3(prog(END, END + 1.2, lt));
    if (ec > 0) {
      c.save(); c.shadowColor = 'rgba(70,130,255,0.9)'; c.shadowBlur = 36;
      text(c, '人工智能简史', CX, 500, { f: font(700, 96, F.zh), color: '#ffffff', align: 'center', sp: lerp(40, 24, E.out3(prog(END, END + 3, lt))), alpha: ec });
      c.restore();
      text(c, 'THE HISTORY OF ARTIFICIAL INTELLIGENCE', CX, 562, { f: font(600, 24), color: '#dfe8ff', align: 'center', sp: 10, alpha: ec * 0.95 });
      const lw = 240 * E.out3(prog(END + 0.4, END + 1.6, lt));
      c.strokeStyle = rgba([150, 190, 255], 0.5 * ec); c.lineWidth = 1;
      c.beginPath(); c.moveTo(CX - lw, 598); c.lineTo(CX + lw, 598); c.stroke();
      text(c, '1843 — 2026', CX, 636, { f: font(500, 20, F.mono), color: 'rgb(160,195,255)', align: 'center', sp: 6, alpha: ec * 0.9 });
      const cr = E.out3(prog(END + 1.2, END + 2.2, lt));
      text(c, '全部画面由代码逐帧绘制 · 音乐与音效由 Python 合成', CX, 760, { f: font(400, 20, F.zh), color: 'rgba(210,225,255,0.75)', align: 'center', sp: 3, alpha: cr });
      text(c, 'EVERY FRAME DRAWN IN CODE  ·  MUSIC SYNTHESIZED IN PYTHON', CX, 794, { f: font(500, 13, F.mono), color: 'rgba(170,195,240,0.6)', align: 'center', sp: 4, alpha: cr });
    }
  }
  return { audio, draw };
})();
