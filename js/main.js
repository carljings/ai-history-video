'use strict';
/* main.js — composites background, scene layers (with transitions), HUD and post effects for time t. */

// how each scene arrives (keyed by the incoming scene)
const TRANS_OF = {
  act1: 'zoom', y1843: 'zoom', y1936: 'whip', y1943: 'iris', y1950: 'flash', y1956: 'zoom',
  act2: 'flash', y1958: 'zoom', y1966: 'pixel', y1969: 'glitch', y1974: 'shatter', y1980: 'flash', y1986: 'whip', y1989: 'crt', y1997: 'zoom',
  act3: 'glitch', y2009: 'zoom', y2011: 'iris', y2012: 'flash', y2014: 'glitch', y2016: 'whip', y2017: 'zoom',
  act4: 'flash', y2020: 'zoom', y2021: 'iris', y2022i: 'pixel', y2022: 'flash', y2023: 'whip', y2024: 'zoom', y2025: 'glitch', finale: 'zoom',
};
const TRANS_SFX = { zoom: 'whoosh', whip: 'whip', glitch: 'glitch', pixel: 'bitcrush', iris: 'shimmer', flash: 'swoosh', shatter: 'glass' };

for (const s of SCENES) {
  s.vis = VIS[s.id];
  if (!s.vis) throw new Error('no visual for scene ' + s.id);
  s.trans = TRANS_OF[s.id] || 'fade';
  s.center = s.year ? [VCX, VCY] : [W / 2, H / 2];
  if (!s.year) s.cam = false;
  s.dust = s.year ? 1 : s.kind === 'act' ? 0.25 : s.kind === 'intro' ? 0.5 : 0.6;
  s.bokeh = s.year ? 1 : 0.4;
}

function renderScene(s, t, c, P) {
  resetCtx(c);
  c.clearRect(0, 0, W, H);
  const lt = t - s.t0;
  applyCamera(c, s, lt, s.dur, t);
  s.vis.draw(c, lt, s.dur, t, P);
}

function renderFrame(t) {
  FX.chroma = 0;
  resetCtx(ctx);
  const P = paletteAt(t);
  drawBackground(ctx, t, P);
  const [sx, sy] = shakeAt(t);
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  drawDust(ctx, t, P, sceneBlend(t, s => s.dust));

  const s = SCENES[sceneIndexAt(t)];
  let out = null, inn = null;
  if (s.next && t > s.t1 - TRANS[s.next.trans].pre) { out = s; inn = s.next; }
  else if (s.prev && t < s.t0 + TRANS[s.trans].post) { out = s.prev; inn = s; }
  if (!inn) {
    renderScene(s, t, lctx, P);
    ctx.drawImage(LAYER, 0, 0);
  } else {
    const tr = TRANS[inn.trans];
    renderScene(out, t, lctx, P);
    renderScene(inn, t, lctx2, P);
    const p = prog(inn.t0 - tr.pre, inn.t0 + tr.post, t);
    const c0 = inn.center, c1 = out.center;
    ctx.save();
    tr.fn(ctx, LAYER, LAYER2, p, { cx: lerp(c1[0], c0[0], p), cy: lerp(c1[1], c0[1], p), acc: inn.pal.acc, t });
    ctx.restore();
  }
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  drawBokeh(ctx, t, P, sceneBlend(t, s => s.bokeh));
  resetCtx(ctx);
  ctx.setTransform(1, 0, 0, 1, sx * 0.5, sy * 0.5);
  drawHUD(ctx, t, P);
  resetCtx(ctx);
  post(ctx, t, P);
}

function registerTransitions() {
  for (const s of SCENES) {
    if (!s.prev) continue;
    const tr = TRANS[s.trans], T = s.t0;
    const ty = TRANS_SFX[s.trans];
    if (ty) sfx(T - Math.min(tr.pre, 0.4), ty, { dur: tr.pre + tr.post });
    if (s.trans === 'flash') { flash(T, 0.34, mixc(s.pal.acc, WHITE, 0.4)); leak(T, [255, 150, 80], [255, 70, 140], 1); }
    if (s.trans === 'zoom' && hash(s.index, 3) < 0.5) leak(T, [255, 170, 90], [255, 90, 150], hash(s.index, 4) < 0.5 ? 1 : -1);
    if (s.kind === 'act') { hit(T, 1); flash(T, 0.28, mixc(s.pal.acc, WHITE, 0.5)); }
  }
}

async function init() {
  const fams = [
    font(700, 40), font(400, 40), font(400, 20, F.body), font(700, 20, F.body), font(400, 20, F.serif), font(400, 20, F.serif, true),
    font(500, 20, F.mono), font(400, 20, F.crt), font(400, 20, F.type),
  ];
  await Promise.all(fams.map(f => document.fonts.load(f)));
  await Promise.all([font(400, 30, F.zh), font(700, 30, F.zh), font(400, 30, F.zhs), font(700, 30, F.zhs)].map(f => document.fonts.load(f, '人工智能简史')));
  await document.fonts.ready;
  initHUD();
  for (const s of SCENES) if (s.vis.prep) { s.vis.prep(); resetCtx(lctx); }
  for (const s of SCENES) if (s.vis.audio) s.vis.audio(s.t0, s);
  registerTransitions();
  AUDIO.sort((a, b) => a.t - b.t);
  window.__ready = true;

  if (/[?&]play\b/.test(location.search)) {
    // real-time preview in a normal browser tab (visuals only)
    let start = null;
    const t0 = +(new URLSearchParams(location.search).get('t') || 0);
    const loop = now => {
      if (start === null) start = now;
      renderFrame((t0 + (now - start) / 1000) % DURATION);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

window.renderToDataURL = (t, type = 'image/jpeg', q = 0.95) => { renderFrame(t); return canvas.toDataURL(type, q); };
window.getAudioEvents = () => AUDIO.concat(HITS.map(([t, s]) => ({ t: Math.round(t * 1000) / 1000, type: 'hit', v: s })));
init().catch(e => { console.error('init failed', e); window.__initError = String(e && e.stack || e); });
