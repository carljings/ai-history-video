'use strict';
/* core.js — shared engine for “人工智能简史 · The History of AI” (300 s @ 1920x1080).
   Every frame is a pure function of time t (seconds), so frames can be rendered
   independently, in any order, by several browsers in parallel. */

const W = 1920, H = 1080, DURATION = 300;
const TAU = Math.PI * 2;
const VCX = 1360, VCY = 520;            // centre of the right-hand visual area

/* ------------------------------------------------------------------ math */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (a, b, x) => clamp((x - a) / (b - a));
const mod = (a, n) => ((a % n) + n) % n;
const smooth = t => t * t * (3 - 2 * t);
const E = {
  in2: t => t * t,
  out2: t => 1 - (1 - t) * (1 - t),
  in3: t => t * t * t,
  out3: t => 1 - Math.pow(1 - t, 3),
  io2: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  io3: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out5: t => 1 - Math.pow(1 - t, 5),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  ioExpo: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};
/** integer hash -> [0,1) */
function hash(i, seed = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** seeded PRNG (mulberry32) */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** smooth 1-D value noise in [-1,1] */
function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return lerp(hash(i, seed), hash(i + 1, seed), smooth(f)) * 2 - 1;
}
/** piecewise-smooth curve through [t, value] keyframes */
function curve(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (t <= K[i][0]) {
      const [t0, v0] = K[i - 1], [t1, v1] = K[i];
      return t1 <= t0 ? v1 : lerp(v0, v1, smooth((t - t0) / (t1 - t0)));
    }
  }
  return K[K.length - 1][1];
}

/* ---------------------------------------------------------------- colour */
const WHITE = [255, 255, 255];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`;
const mixc = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];

/* ---------------------------------------------------------------- canvas */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const LAYER = makeCanvas(W, H), lctx = LAYER.getContext('2d');      // outgoing / current scene
const LAYER2 = makeCanvas(W, H), lctx2 = LAYER2.getContext('2d');   // incoming scene during a transition
const TMP = makeCanvas(W, H), tctx = TMP.getContext('2d');
function resetCtx(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.shadowColor = 'rgba(0,0,0,0)';
  c.letterSpacing = '0px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.lineCap = 'butt'; c.lineJoin = 'miter'; c.setLineDash([]); c.lineWidth = 1;
  c.imageSmoothingEnabled = true;
}

/* ------------------------------------------------------------------ text */
const F = {
  sans: 'Space Grotesk', body: 'Inter', serif: 'Playfair Display', mono: 'JetBrains Mono',
  crt: 'VT323', type: 'Special Elite', sym: 'DejaVu Sans', emoji: 'Noto Color Emoji',
  zh: 'Noto Sans CJK SC', zhs: 'Noto Serif CJK SC',
};
// every font falls back to the Chinese face, so mixed Chinese/English labels just work
const font = (w, s, fam = F.sans, italic = false) =>
  `${italic ? 'italic ' : ''}${w} ${s}px "${fam}", "${fam === F.zhs ? F.zhs : F.zh}"`;

/** fillText with styling in one call; compensates letterSpacing's trailing gap */
function text(c, str, x, y, { f, color = '#fff', align = 'left', base = 'alphabetic', sp = 0, alpha = 1 } = {}) {
  if (alpha <= 0.002) return;
  if (f) c.font = f;
  c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.letterSpacing = sp + 'px';
  const ga = c.globalAlpha; c.globalAlpha = ga * clamp(alpha);
  c.fillText(str, x + (align === 'center' ? sp / 2 : align === 'right' ? sp : 0), y);
  c.globalAlpha = ga;
}
function wrapLines(c, str, maxW) {
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && c.measureText(test).width > maxW) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
/** split mixed Chinese/Latin text into tokens: single CJK characters, Latin words, spaces */
function zhTokens(str) {
  const out = [];
  const re = /[A-Za-z0-9·.,'’\-–%+&/()!?:;]+|\s+|./gu;
  let m;
  while ((m = re.exec(str))) out.push(m[0]);
  return out;
}
const NO_START = '，。、；：！？”’）》」』%…—';
const NO_END = '“‘（《「『';
/** line-wrap mixed Chinese text (kinsoku: no closing punctuation at a line start) */
function wrapZh(c, str, maxW) {
  const toks = zhTokens(str), lines = [];
  let cur = [], w = 0;
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i], tw = c.measureText(tk).width;
    if (cur.length && w + tw > maxW && !NO_START.includes(tk[0]) && !/^\s+$/.test(tk)) {
      // don't leave an opening quote dangling at the end of a line
      const carry = [];
      while (cur.length && NO_END.includes(cur[cur.length - 1])) carry.unshift(cur.pop());
      lines.push(cur);
      cur = carry; w = carry.reduce((s, x) => s + c.measureText(x).width, 0);
    }
    if (!cur.length && /^\s+$/.test(tk)) continue;
    cur.push(tk); w += tw;
  }
  if (cur.length) lines.push(cur);
  return lines;           // array of token arrays
}
/** token-by-token reveal (rise + fade), with an optional staggered exit */
function drawTokens(c, lines, x, y, lh, t0, t, { stagger = 0.014, dur = 0.5, rise = 14, alpha = 1, exitT = 1e9, exitDur = 0.4 } = {}) {
  let k = 0;
  const ga = c.globalAlpha;
  lines.forEach((line, li) => {
    let cx = x;
    for (const tk of line) {
      const w = c.measureText(tk).width;
      if (!/^\s+$/.test(tk)) {
        const p = E.out3(prog(t0 + k * stagger, t0 + k * stagger + dur, t));
        const q = E.in2(prog(exitT + k * 0.004, exitT + k * 0.004 + exitDur, t));
        const a = p * (1 - q);
        if (a > 0.003) { c.globalAlpha = ga * alpha * a; c.fillText(tk, cx, y + li * lh + (1 - p) * rise - q * 12); }
        k++;
      }
      cx += w;
    }
  });
  c.globalAlpha = ga;
}
/** word-by-word reveal for Latin text (left aligned) */
function drawWords(c, lines, x, y, lh, t0, t, { stagger = 0.035, dur = 0.55, rise = 16, alpha = 1 } = {}) {
  let k = 0;
  const ga = c.globalAlpha;
  lines.forEach((line, li) => {
    let cx = x;
    for (const w of line.split(' ')) {
      const p = E.out3(prog(t0 + k * stagger, t0 + k * stagger + dur, t));
      if (p > 0) { c.globalAlpha = ga * alpha * p; c.fillText(w, cx, y + li * lh + (1 - p) * rise); }
      cx += c.measureText(w + ' ').width;
      k++;
    }
  });
  c.globalAlpha = ga;
}
/** typewriter schedule: times at which each character of `str` appears */
function typeTimes(str, t0, cps, seed = 1) {
  const out = [];
  let t = t0;
  for (let i = 0; i < str.length; i++) {
    out.push(t);
    const ch = str[i];
    let d = (1 / cps) * (0.65 + 0.7 * hash(i, seed));
    if (ch === ',' || ch === '，') d += 0.06;
    if ('.?!。？！'.includes(ch)) d += 0.1;
    t += d;
  }
  out.end = t;
  return out;
}
const countTyped = (times, t) => { let n = 0; while (n < times.length && times[n] <= t) n++; return n; };

/** a bilingual label: Chinese, then a smaller spaced English tag */
function biLabel(c, zh, en, x, y, { col = '#fff', alpha = 1, align = 'center', zs = 17, es = 12, gap = 16 } = {}) {
  if (alpha <= 0.002) return;
  c.font = font(700, zs, F.zh); c.letterSpacing = '3px';
  const w1 = c.measureText(zh).width;
  c.font = font(600, es, F.mono); c.letterSpacing = '3px';
  const w2 = en ? c.measureText(en).width : 0, tw = w1 + (en ? gap + w2 : 0);
  const x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  text(c, zh, x0, y, { f: font(700, zs, F.zh), color: col, sp: 3, alpha });
  if (en) text(c, en, x0 + w1 + gap, y - 1, { f: font(600, es, F.mono), color: col, sp: 3, alpha: alpha * 0.7 });
}

/* ----------------------------------------------------------- audio events */
const AUDIO = [];
function sfx(t, type, o = {}) { AUDIO.push(Object.assign({ t: Math.round(t * 1000) / 1000, type }, o)); }
/** typing clicks, thinned so fast bursts don't become a buzz */
function sfxTyping(times, str, type, minGap = 0.05, vel = 1) {
  let last = -1;
  times.forEach((tt, i) => {
    if (str[i] === ' ' || tt - last < minGap) return;
    sfx(tt, type, { v: vel * (0.75 + 0.25 * hash(i, 77)) });
    last = tt;
  });
}
/** big musical hits: camera shake, lens aberration, zoom punch (the score adds the boom) */
const HITS = [];
function hit(t, s = 1) { HITS.push([t, s]); }

/* --------------------------------------------------------------- sprites */
const _sprites = new Map();
function glowSprite(col, hot = true) {
  const q = col.map(v => (v >> 3) << 3), key = q.join(',') + (hot ? 'h' : 's');
  let s = _sprites.get(key);
  if (!s) {
    s = makeCanvas(64, 64);
    const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (hot) {
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.1, rgba(mixc(q, WHITE, 0.55), 0.95));
      gr.addColorStop(0.3, rgba(q, 0.4));
      gr.addColorStop(0.6, rgba(q, 0.1));
    } else {
      gr.addColorStop(0, rgba(q, 1));
      gr.addColorStop(0.45, rgba(q, 0.55));
      gr.addColorStop(0.75, rgba(q, 0.15));
    }
    gr.addColorStop(1, rgba(q, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _sprites.set(key, s);
  }
  return s;
}
function glow(c, x, y, r, col, a = 1, hot = true) {
  if (a <= 0.003 || r <= 0) return;
  const ga = c.globalAlpha;
  c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(col, hot), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
}
/** shaded sphere sprite (for 3-D beads) */
function ballSprite(col) {
  const q = col.map(v => (v >> 3) << 3), key = 'ball' + q.join(',');
  let s = _sprites.get(key);
  if (!s) {
    s = makeCanvas(64, 64);
    const g = s.getContext('2d'), gr = g.createRadialGradient(24, 22, 2, 32, 32, 31);
    gr.addColorStop(0, rgba(mixc(q, WHITE, 0.85), 1)); gr.addColorStop(0.25, rgba(mixc(q, WHITE, 0.25), 1));
    gr.addColorStop(0.75, rgba(q, 1)); gr.addColorStop(1, rgba(mixc(q, [0, 0, 0], 0.55), 1));
    g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill();
    _sprites.set(key, s);
  }
  return s;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

/* =============================================================== timeline */
const P_ = (bg, ga, gb, acc) => ({ bg, ga, gb, acc });
const SCENE_DEFS = [
  { id: 'intro', dur: 14, kind: 'intro', pal: P_([2, 3, 9], [30, 60, 150], [80, 40, 150], [140, 190, 255]) },
  { id: 'act1', dur: 4, kind: 'act', num: 'I', zhNum: '第一幕', zhName: '梦想', name: 'THE DREAM', span: '1843 — 1956',
    pal: P_([10, 7, 4], [255, 160, 70], [150, 80, 30], [255, 196, 120]) },
  { id: 'y1843', dur: 10, year: 1843, zhChapter: '梦想', chapter: 'THE DREAM', zhTitle: '第一个计算机程序', title: 'The first computer program',
    zh: '英国数学家艾达·洛芙莱斯为巴贝奇设计的“分析机”写下了计算伯努利数的算法。她预言：机器将来不只会算数，还能创作音乐。',
    pal: P_([12, 8, 4], [255, 170, 80], [120, 70, 25], [255, 200, 130]) },
  { id: 'y1936', dur: 10, year: 1936, zhChapter: '梦想', chapter: 'THE DREAM', zhTitle: '万能的图灵机', title: 'The universal machine',
    zh: '阿兰·图灵构想出一台极简的机器：一条无限长的纸带、一个读写头和几条规则。它能完成任何可计算的任务——这是所有现代计算机的蓝图。',
    pal: P_([4, 9, 12], [80, 200, 230], [60, 90, 160], [130, 225, 245]) },
  { id: 'y1943', dur: 10, year: 1943, zhChapter: '梦想', chapter: 'THE DREAM', zhTitle: '第一个人工神经元', title: 'The first artificial neuron',
    zh: '麦卡洛克与皮茨把大脑的神经元简化成逻辑开关：把输入信号加起来，超过阈值就“发放”。神经网络的种子由此埋下。',
    pal: P_([11, 7, 4], [255, 150, 60], [140, 70, 20], [255, 184, 108]) },
  { id: 'y1950', dur: 10, year: 1950, zhChapter: '提问', chapter: 'THE QUESTION', zhTitle: '“机器能思考吗？”', title: '“Can machines think?”',
    zh: '图灵发表论文《计算机器与智能》，提出“模仿游戏”：如果人无法分辨对面是人还是机器，就可以说机器会思考。后人称之为“图灵测试”。',
    pal: P_([11, 8, 4], [255, 170, 90], [140, 90, 40], [255, 196, 130]) },
  { id: 'y1956', dur: 10, year: 1956, zhChapter: '诞生', chapter: 'THE BIRTH', zhTitle: '人工智能正式诞生', title: 'A new field gets its name',
    zh: '在达特茅斯学院的夏季研讨会上，约翰·麦卡锡首次提出“人工智能”一词。明斯基、香农等人相信：智能的每个方面都能被机器模拟。',
    pal: P_([12, 8, 3], [255, 190, 90], [160, 90, 30], [255, 205, 140]) },
  { id: 'act2', dur: 4, kind: 'act', num: 'II', zhNum: '第二幕', zhName: '起落', name: 'BOOM & BUST', span: '1958 — 1997',
    pal: P_([3, 10, 10], [60, 220, 170], [40, 90, 160], [110, 240, 205]) },
  { id: 'y1958', dur: 10, year: 1958, zhChapter: '早期乐观', chapter: 'EARLY OPTIMISM', zhTitle: '感知机', title: 'The Perceptron',
    zh: '罗森布拉特发明了感知机：每看错一个例子，就把分界线挪动一点，直到把两类样本分开。这是第一个能从例子中学习的神经网络。',
    pal: P_([3, 10, 10], [60, 220, 170], [40, 90, 160], [110, 240, 205]) },
  { id: 'y1966', dur: 10, year: 1966, zhChapter: '早期乐观', chapter: 'EARLY OPTIMISM', zhTitle: '第一个聊天机器人', title: 'ELIZA, the first chatbot',
    zh: '魏森鲍姆在麻省理工写出 ELIZA。它扮演心理医生，只会套用简单的句式规则，把你的话变成问题——可许多人仍向它倾诉心事。',
    pal: P_([2, 9, 5], [60, 255, 120], [30, 90, 60], [120, 255, 160]) },
  { id: 'y1969', dur: 8, year: 1969, zhChapter: '质疑', chapter: 'DOUBT', zhTitle: '感知机的极限', title: 'The limits of perceptrons',
    zh: '明斯基与派珀特在《感知机》一书中指出：单层感知机连“异或”都学不会，因为没有一条直线能把这两类点分开。神经网络研究随之遇冷。',
    pal: P_([5, 8, 12], [100, 150, 200], [200, 80, 80], [160, 200, 235]) },
  { id: 'y1974', dur: 10, year: 1974, zhChapter: '寒冬', chapter: 'WINTER', zhTitle: '第一次 AI 寒冬', title: 'The first AI winter',
    zh: '承诺太多，计算机又太慢。英国《莱特希尔报告》批评 AI 未能兑现承诺，英美政府大幅削减经费，研究冰封多年。',
    pal: P_([6, 9, 15], [140, 185, 255], [200, 220, 255], [185, 215, 255]) },
  { id: 'y1980', dur: 8, year: 1980, zhChapter: '繁荣', chapter: 'THE BOOM', zhTitle: '专家系统热潮', title: 'The expert-system boom',
    zh: '专家系统把人类专家的经验写成成千上万条“如果……就……”规则。DEC 公司用 XCON 自动配置电脑订单，企业纷纷投入巨资。',
    pal: P_([12, 6, 3], [255, 140, 40], [200, 60, 40], [255, 170, 80]) },
  { id: 'y1986', dur: 10, year: 1986, zhChapter: '复兴', chapter: 'THE REVIVAL', zhTitle: '反向传播', title: 'Backpropagation',
    zh: '鲁梅尔哈特、辛顿和威廉姆斯推广“反向传播”：网络先做预测，再把误差从输出层逐层传回，微调每一个连接的权重。多层网络终于能学习了。',
    pal: P_([9, 3, 19], [255, 40, 180], [40, 200, 255], [255, 100, 210]) },
  { id: 'y1989', dur: 10, year: 1989, zhChapter: '第二次寒冬', chapter: 'SECOND WINTER', zhTitle: '机器学会“看”', title: 'Machines learn to see',
    zh: '专家系统泡沫破裂，AI 再入寒冬。杨立昆却用卷积神经网络教会机器识别手写邮编：小窗口在图像上滑动，逐层提取笔画特征。',
    pal: P_([3, 7, 12], [60, 170, 255], [40, 200, 160], [120, 215, 255]) },
  { id: 'y1997', dur: 10, year: 1997, zhChapter: '人机对决', chapter: 'MAN VS. MACHINE', zhTitle: '深蓝击败卡斯帕罗夫', title: 'Deep Blue beats Kasparov',
    zh: 'IBM 的“深蓝”每秒能评估两亿个棋局。它在六局比赛中以 3.5 比 2.5 战胜了国际象棋世界冠军卡斯帕罗夫。',
    pal: P_([8, 7, 5], [230, 180, 90], [90, 70, 40], [240, 200, 125]) },
  { id: 'act3', dur: 4, kind: 'act', num: 'III', zhNum: '第三幕', zhName: '深度学习', name: 'DEEP LEARNING', span: '2009 — 2017',
    pal: P_([2, 6, 16], [40, 120, 255], [0, 200, 255], [95, 175, 255]) },
  { id: 'y2009', dur: 8, year: 2009, zhChapter: '大数据', chapter: 'BIG DATA', zhTitle: 'ImageNet 数据集', title: 'ImageNet',
    zh: '李飞飞团队借助全球众包，为 1400 多万张图片标注了两万多个类别。海量数据成了机器认识世界的教科书。',
    pal: P_([4, 6, 14], [255, 130, 80], [60, 140, 255], [160, 205, 255]) },
  { id: 'y2011', dur: 8, year: 2011, zhChapter: '问答', chapter: 'QUESTION & ANSWER', zhTitle: '沃森赢得智力竞赛', title: 'Watson wins Jeopardy!',
    zh: 'IBM 的沃森在美国智力问答节目《危险边缘》中击败两位传奇冠军。同年，苹果推出语音助手 Siri，AI 走进了千万人的口袋。',
    pal: P_([2, 5, 18], [40, 90, 255], [120, 60, 255], [120, 170, 255]) },
  { id: 'y2012', dur: 10, year: 2012, zhChapter: '深度学习大爆发', chapter: 'THE BIG BANG', zhTitle: '深度学习崛起', title: 'Deep learning takes off',
    zh: '辛顿和学生用两块游戏显卡训练出 AlexNet，在 ImageNet 图像识别大赛中把错误率大幅拉低。深度学习的时代由此开启。',
    pal: P_([2, 6, 16], [40, 120, 255], [0, 200, 255], [95, 175, 255]) },
  { id: 'y2014', dur: 10, year: 2014, zhChapter: '想象力', chapter: 'IMAGINATION', zhTitle: '机器学会想象', title: 'Machines learn to imagine',
    zh: '古德费洛提出生成对抗网络（GAN）：一个网络负责“造假”，另一个负责“鉴别”。两者不断对抗，生成的图像越来越逼真。',
    pal: P_([10, 3, 10], [255, 60, 110], [60, 200, 255], [255, 130, 175]) },
  { id: 'y2016', dur: 10, year: 2016, zhChapter: '超越人类', chapter: 'SUPERHUMAN', zhTitle: 'AlphaGo 的第 37 手', title: 'AlphaGo’s Move 37',
    zh: 'DeepMind 的 AlphaGo 以 4 比 1 击败围棋传奇李世石。第二局第 37 手震惊世界——AlphaGo 自己估计，人类棋手下出这一步的概率只有万分之一。',
    pal: P_([3, 10, 10], [40, 200, 180], [200, 150, 80], [90, 235, 215]) },
  { id: 'y2017', dur: 10, year: 2017, zhChapter: '注意力', chapter: 'ATTENTION', zhTitle: '注意力就是一切', title: 'Attention is all you need',
    zh: '谷歌研究者提出 Transformer：句子里的每个词都会“注意”其他所有词，从而读懂上下文。它就是 GPT 里的“T”，现代 AI 的引擎。',
    pal: P_([8, 4, 17], [150, 80, 255], [60, 160, 255], [190, 150, 255]) },
  { id: 'act4', dur: 4, kind: 'act', num: 'IV', zhNum: '第四幕', zhName: '生成时代', name: 'THE GENERATIVE AGE', span: '2020 — 2026',
    pal: P_([8, 4, 17], [255, 80, 160], [80, 120, 255], [255, 160, 220]) },
  { id: 'y2020', dur: 8, year: 2020, zhChapter: '规模', chapter: 'SCALE', zhTitle: '大就是不一样', title: 'Bigger is different',
    zh: 'GPT-3 拥有 1750 亿个参数，读过数千亿词的文本。只要给几个示例，它就能写作、翻译、编程——规模带来了全新的能力。',
    pal: P_([3, 5, 14], [60, 110, 255], [255, 120, 60], [130, 180, 255]) },
  { id: 'y2021', dur: 10, year: 2021, zhChapter: '科学', chapter: 'SCIENCE', zhTitle: '破解蛋白质折叠', title: 'AlphaFold folds proteins',
    zh: '蛋白质的形状决定它的功能。AlphaFold 2 能从氨基酸序列预测出三维结构，精度接近实验测定，并向全世界的科学家免费开放。',
    pal: P_([3, 6, 14], [60, 140, 255], [255, 170, 60], [120, 190, 255]) },
  { id: 'y2022i', dur: 10, year: 2022, zhChapter: '生成时代', chapter: 'THE GENERATIVE ERA', zhTitle: '文字变成图画', title: 'Pictures from words',
    zh: 'DALL·E 2、Midjourney 和 Stable Diffusion 能把一句话变成一幅画：扩散模型从一片噪声出发，一步步去除噪声，画面逐渐清晰。',
    pal: P_([10, 5, 10], [255, 120, 70], [140, 70, 200], [255, 175, 125]) },
  { id: 'y2022', dur: 10, year: 2022, zhChapter: '生成时代', chapter: 'THE GENERATIVE ERA', zhTitle: 'AI 走进千家万户', title: 'AI goes mainstream',
    zh: 'ChatGPT 上线 5 天用户破百万，两个月破亿，成为当时增长最快的消费级应用。生成式 AI 从此无处不在。',
    pal: P_([7, 4, 15], [255, 80, 160], [40, 220, 200], [120, 255, 225]) },
  { id: 'y2023', dur: 8, year: 2023, zhChapter: '多模态', chapter: 'MULTIMODAL', zhTitle: '能看、能听、能说', title: 'Models that see, hear and speak',
    zh: 'GPT-4、Claude、Gemini 和开源的 Llama 等大模型能读图、听音、写代码。GPT-4 在模拟律师资格考试中的成绩超过了约九成考生。',
    pal: P_([4, 5, 15], [90, 120, 255], [40, 220, 200], [150, 200, 255]) },
  { id: 'y2024', dur: 8, year: 2024, zhChapter: '殊荣', chapter: 'RECOGNITION', zhTitle: '诺贝尔奖献给 AI', title: 'Nobel Prizes for AI',
    zh: '霍普菲尔德与辛顿因神经网络的奠基性工作获诺贝尔物理学奖；哈萨比斯与詹珀凭 AlphaFold、贝克凭蛋白质设计共获化学奖。',
    pal: P_([10, 8, 3], [255, 200, 90], [180, 120, 40], [255, 214, 125]) },
  { id: 'y2025', dur: 12, year: 2025, zhChapter: '推理', chapter: 'REASONING', zhTitle: '会推理的机器', title: 'Machines that reason',
    zh: '推理模型先“思考”再回答：尝试、检验、回溯。AI 在国际数学奥林匹克竞赛中达到金牌水平，智能体开始替人完成真实的工作。',
    pal: P_([3, 7, 13], [80, 200, 255], [160, 120, 255], [140, 220, 255]) },
  { id: 'finale', dur: 22, kind: 'finale', pal: P_([2, 3, 9], [60, 110, 255], [140, 90, 255], [170, 205, 255]) },
];
const SCENES = [];
{
  let t = 0;
  for (const d of SCENE_DEFS) { SCENES.push(Object.assign({}, d, { t0: t, t1: t + d.dur })); t += d.dur; }
  if (Math.abs(t - DURATION) > 1e-6) throw new Error('scene durations sum to ' + t);
}
const SC = Object.fromEntries(SCENES.map(s => [s.id, s]));
const ST = id => SC[id].t0;
const YEARS = SCENES.filter(s => s.year);
SCENES.forEach((s, i) => { s.index = i; s.prev = SCENES[i - 1] || null; s.next = SCENES[i + 1] || null; });
function sceneIndexAt(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}
function yearIndex(t) {
  for (let i = YEARS.length - 1; i >= 0; i--) if (t >= YEARS[i].t0 - 0.2) return i;
  return 0;
}
// the moment the 1980s picture collapses like an old CRT (the expert-system bust)
const CRT_T0 = ST('y1989') - 0.9;

/* ---------------------------------------------------------------- palette */
function paletteAt(t) {
  let { bg, ga, gb, acc } = SCENES[0].pal;
  for (let i = 1; i < SCENES.length; i++) {
    const s = SCENES[i], w = smooth(prog(s.t0 - 0.5, s.t0 + 0.5, t));
    if (w <= 0) break;
    bg = mixc(bg, s.pal.bg, w); ga = mixc(ga, s.pal.ga, w); gb = mixc(gb, s.pal.gb, w); acc = mixc(acc, s.pal.acc, w);
  }
  return { bg, ga, gb, acc };
}
/** blend a per-scene value across scene boundaries */
function sceneBlend(t, fn, width = 0.5) {
  let v = fn(SCENES[0]);
  for (let i = 1; i < SCENES.length; i++) {
    const s = SCENES[i], w = smooth(prog(s.t0 - width, s.t0 + width, t));
    if (w <= 0) break;
    v = lerp(v, fn(s), w);
  }
  return v;
}

/* ------------------------------------------------------------- background */
function drawBackground(c, t, P) {
  c.fillStyle = rgba(P.bg, 1);
  c.fillRect(0, 0, W, H);
  const k = curve([[0, 0.2], [3, 1], [DURATION - 2, 1], [DURATION, 0.4]], t);
  const g1x = 1250 + 180 * Math.sin(t * 0.11), g1y = 430 + 90 * Math.cos(t * 0.13);
  let g = c.createRadialGradient(g1x, g1y, 0, g1x, g1y, 1050);
  g.addColorStop(0, rgba(P.ga, 0.17 * k)); g.addColorStop(0.45, rgba(P.ga, 0.05 * k)); g.addColorStop(1, rgba(P.ga, 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const g2x = 280 + 140 * Math.cos(t * 0.09), g2y = 880 + 70 * Math.sin(t * 0.15);
  g = c.createRadialGradient(g2x, g2y, 0, g2x, g2y, 950);
  g.addColorStop(0, rgba(P.gb, 0.11 * k)); g.addColorStop(1, rgba(P.gb, 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

/* ------------------------------------- "neural dust": the growing network */
const DUST_N = 340;
const DUST = (() => {
  const r = rng(7);
  return Array.from({ length: DUST_N }, () => ({
    x: r() * (W + 200) - 100, y: r() * (H + 200) - 100, z: 0.3 + 0.7 * r(),
    vx: (r() - 0.5) * 16, vy: (r() - 0.5) * 10, ph: r() * TAU, sz: r(),
  }));
})();
const GROWTH = [[0, 0.18], [ST('y1843'), 0.12], [ST('y1956'), 0.25], [ST('y1966'), 0.35], [ST('y1974'), 0.42], [ST('y1986'), 0.3],
  [ST('y2009'), 0.5], [ST('y2012'), 0.6], [ST('y2017'), 0.75], [ST('y2020'), 0.85], [ST('y2024'), 1.0], [DURATION, 1.0]];
const LINKS = [[0, 0], [ST('y1843'), 0.15], [ST('y1943'), 0.25], [ST('y1974') - 0.4, 0.4], [ST('y1974') + 1.4, 0], [ST('y1980') - 0.4, 0],
  [ST('y1980') + 1, 0.35], [CRT_T0 - 0.1, 0.45], [CRT_T0 + 0.5, 0.05], [ST('y1989') + 1.5, 0.2], [ST('y2012'), 0.6], [ST('y2024'), 1],
  [ST('finale') - 0.5, 1], [ST('finale') + 1, 0], [DURATION, 0]];
const SNOW = [[0, 0], [ST('y1974') + 0.2, 0], [ST('y1974') + 1.6, 1], [ST('y1980') - 0.7, 1], [ST('y1980') + 0.4, 0], [DURATION, 0]];
const SNOW_CUM = (() => {
  const n = DURATION * 100 + 2, a = new Float32Array(n);
  let s = 0;
  for (let i = 0; i < n; i++) { a[i] = s; s += curve(SNOW, i / 100) / 100; }
  return a;
})();
function snowCum(t) {
  const x = clamp(t * 100, 0, DURATION * 100), i = Math.floor(x);
  return lerp(SNOW_CUM[i], SNOW_CUM[i + 1], x - i);
}
const snowAmt = t => curve(SNOW, t);

function drawDust(c, t, P, amount) {
  if (amount <= 0.01) return;
  const n = curve(GROWTH, t) * DUST_N, link = curve(LINKS, t) * amount;
  const snow = snowAmt(t), fall = snowCum(t);
  const col = mixc(P.acc, WHITE, 0.3 + 0.55 * snow);
  const pts = [];
  for (let i = 0; i < DUST_N; i++) {
    const vis = clamp(n - i);
    if (vis <= 0) break;
    const d = DUST[i];
    let x = d.x + d.vx * t * d.z + 40 * vnoise(t * 0.08 + i * 3.1, 11) + Math.sin(t * 1.1 + d.ph) * 16 * snow;
    let y = d.y + d.vy * t * d.z + 30 * vnoise(t * 0.07 + i * 1.7, 23) + fall * 150 * (0.35 + d.z);
    x = (((x + 100) % (W + 200)) + (W + 200)) % (W + 200) - 100;
    y = (((y + 100) % (H + 200)) + (H + 200)) % (H + 200) - 100;
    const tw = 0.65 + 0.35 * Math.sin(t * (1 + d.sz * 2) + d.ph);
    pts.push([x, y, d.z, vis * tw]);
  }
  if (link > 0.01) {
    const D = 150, D2 = D * D, NB = 6, buckets = Array.from({ length: NB }, () => []);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = p[0] - q[0], dy = p[1] - q[1], d2 = dx * dx + dy * dy;
        if (d2 < D2) {
          const a = (1 - Math.sqrt(d2) / D) * Math.min(p[3], q[3]);
          buckets[Math.min(NB - 1, (a * NB) | 0)].push(p, q);
        }
      }
    }
    c.lineWidth = 1;
    for (let b = 0; b < NB; b++) {
      const L = buckets[b];
      if (!L.length) continue;
      c.strokeStyle = rgba(col, link * 0.2 * (b + 0.5) / NB);
      c.beginPath();
      for (let k = 0; k < L.length; k += 2) { c.moveTo(L[k][0], L[k][1]); c.lineTo(L[k + 1][0], L[k + 1][1]); }
      c.stroke();
    }
  }
  c.globalCompositeOperation = 'lighter';
  for (const p of pts) glow(c, p[0], p[1], (4 + p[2] * 7) * (1 + snow * 0.7), col, p[3] * (0.3 + 0.45 * p[2]) * amount);
  c.globalCompositeOperation = 'source-over';
}

/* foreground bokeh: big soft out-of-focus lights drifting in front of everything */
const BOKEH = (() => { const r = rng(31); return Array.from({ length: 9 }, () => ({ x: r(), y: r(), r: 50 + r() * 120, s: 0.3 + r() * 0.7, ph: r() * TAU })); })();
function drawBokeh(c, t, P, amount) {
  if (amount <= 0.01) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const b of BOKEH) {
    const x = ((b.x * (W + 400) + t * 22 * b.s) % (W + 400)) - 200, y = b.y * H + Math.sin(t * 0.3 + b.ph) * 40;
    glow(c, x, y, b.r, mixc(P.acc, WHITE, 0.2), amount * 0.07 * (0.6 + 0.4 * Math.sin(t * 0.7 + b.ph)), false);
  }
  c.restore();
}

/* -------------------------------------------------------------------- HUD */
let DIGIT_W = 118;
const HUD_ZH = { title: 56, titleLH: 68, en: 24, body: 27, bodyLH: 45, bodyW: 650 };
function initHUD() {
  const c = lctx;
  c.font = font(700, 196);
  DIGIT_W = Math.max(...'0123456789'.split('').map(d => c.measureText(d).width)) + 4;
  for (const s of YEARS) {
    c.font = font(700, HUD_ZH.title, F.zh); c.letterSpacing = '2px';
    s._title = wrapZh(c, s.zhTitle, 720);
    c.font = font(400, HUD_ZH.body, F.zh); c.letterSpacing = '1px';
    s._body = wrapZh(c, s.zh, HUD_ZH.bodyW);
  }
  resetCtx(c);
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
function scramble(str, p, seed) {
  const n = str.length, front = p * (n + 6);
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    if (ch === ' ' || i < front - 6) out += ch;
    else if (i < front) out += GLYPHS[(hash(i * 31 + Math.floor(front * 4), seed) * GLYPHS.length) | 0];
    else out += ' ';
  }
  return out;
}

/** HUD is shown during year chapters; it slides in after an act card and out before one */
function hudVisibility(t) {
  const s = SCENES[sceneIndexAt(t)];
  const nx = s.next;
  if (!s.year) {
    if (nx && nx.year) return E.out2(prog(nx.t0 - 0.25, nx.t0 + 0.6, t));
    return 0;
  }
  const inn = s.prev && s.prev.year ? 1 : E.out2(prog(s.t0 - 0.25, s.t0 + 0.6, t));
  const out = nx && nx.year ? 1 : 1 - E.in2(prog(s.t1 - 0.7, s.t1 - 0.1, t));
  return inn * out;
}

function drawHUD(c, t, P) {
  const vis = hudVisibility(t);
  if (vis <= 0.001) return;
  const k = yearIndex(t), s = YEARS[k], lt = t - s.t0, dur = s.t1 - s.t0;
  const out = 1 - E.in2(prog(dur - 0.42, dur - 0.04, lt));
  const acc = mixc(P.acc, WHITE, 0.1);
  const slide = (1 - vis) * -60;
  c.save();
  c.translate(slide, 0);

  // chapter label: Chinese + scrambled English
  const lp = prog(0.05, 0.75, lt);
  if (lp > 0) {
    c.strokeStyle = rgba(acc, 0.9 * vis * out); c.lineWidth = 2;
    c.beginPath(); c.moveTo(124, 314); c.lineTo(124 + 40 * E.out3(prog(0, 0.5, lt)), 314); c.stroke();
    c.font = font(700, 22, F.zh); c.letterSpacing = '6px';
    const zw = c.measureText(s.zhChapter).width;
    text(c, s.zhChapter, 182, 323, { color: rgba(acc, 1), sp: 6, alpha: vis * out * E.out3(prog(0.05, 0.45, lt)) });
    text(c, scramble(s.chapter, lp, k + 3), 182 + zw + 18, 322, { f: font(600, 15, F.mono), color: rgba(acc, 0.8), sp: 5, alpha: vis * out });
  }
  drawYear(c, t, vis, P, k);

  // Chinese title, English title, Chinese explanation
  const exitT = s.t1 - 0.5;
  c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 18;
  c.font = font(700, HUD_ZH.title, F.zh); c.letterSpacing = '2px';
  const ty = 600;
  drawTokens(c, s._title, 118, ty, HUD_ZH.titleLH, s.t0 + 0.2, t, { alpha: vis, stagger: 0.04, dur: 0.55, rise: 24, exitT });
  const ey = ty + (s._title.length - 1) * HUD_ZH.titleLH + 46;
  c.font = font(500, HUD_ZH.en, F.sans); c.letterSpacing = '0.5px';
  c.fillStyle = rgba(mixc(P.acc, WHITE, 0.45), 1);
  drawWords(c, [s.title], 121, ey, 30, s.t0 + 0.45, t, { alpha: 0.85 * vis * out, stagger: 0.03, rise: 10 });
  c.font = font(400, HUD_ZH.body, F.zh); c.letterSpacing = '1px';
  c.fillStyle = 'rgba(236,240,248,1)';
  drawTokens(c, s._body, 121, ey + 58, HUD_ZH.bodyLH, s.t0 + 0.75, t, { alpha: 0.9 * vis, stagger: 0.018, dur: 0.45, rise: 10, exitT });
  c.shadowBlur = 0;
  c.restore();

  drawTimeline(c, t, vis, P, k);
}

function drawYear(c, t, vis, P, k) {
  const s = YEARS[k], prev = k > 0 ? YEARS[k - 1].year : 1800;
  const a = String(prev), b = String(s.year), x0 = 112, y = 505, DH = 205;
  c.save();
  c.font = font(700, 196); c.letterSpacing = '0px';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const val = (j, tt) => {
    const da = +a[j], db = +b[j], steps = (db - da + 10) % 10;
    const st = s.t0 - 0.25 + (3 - j) * 0.07;
    return da + steps * E.io3(prog(st, st + 0.75 + steps * 0.025, tt));
  };
  // soft glow, drawn unclipped (shadow-only: the glyph itself lands off-canvas); dims while a digit rolls
  c.shadowColor = rgba(P.acc, 0.5 * vis); c.shadowBlur = 45; c.shadowOffsetX = 10000; c.fillStyle = '#000';
  for (let j = 0; j < 4; j++) {
    const v = val(j, t), settle = Math.pow(1 - Math.sin(Math.PI * (v - Math.floor(v + 1e-6))), 2);
    if (settle < 0.02) continue;
    c.globalAlpha = settle * vis;
    c.fillText(String(((Math.round(v) % 10) + 10) % 10), x0 + j * DIGIT_W + DIGIT_W / 2 - 10000, y);
  }
  c.globalAlpha = 1; c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = 0;
  const grad = c.createLinearGradient(0, y - 145, 0, y + 5);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, rgba(mixc(P.acc, WHITE, 0.2), 1));
  c.fillStyle = grad;
  for (let j = 0; j < 4; j++) {
    const v = val(j, t), speed = Math.abs(val(j, t + 0.01) - val(j, t - 0.01)) / 0.02;
    const cx = x0 + j * DIGIT_W + DIGIT_W / 2;
    c.save();
    c.beginPath(); c.rect(cx - DIGIT_W / 2 - 6, y - 168, DIGIT_W + 12, 196); c.clip();
    const draw = (off, al) => {
      const base = Math.floor(v + 1e-6), f = v - base;
      c.globalAlpha = vis * al;
      c.fillText(String(((base % 10) + 10) % 10), cx, y - f * DH + off);
      if (f > 0.002) c.fillText(String((base + 1) % 10), cx, y - f * DH + DH + off);
    };
    const blur = Math.min(46, speed * 5);
    if (blur > 2) { draw(-blur / 2, 0.35); draw(blur / 2, 0.35); draw(0, 0.55); } else draw(0, 1);
    c.restore();
  }
  c.restore();
}

// timeline: 1840–1940 is compressed into the first 16 %, 1940–2026 gets the rest
const TL = { x0: 124, x1: 1796, y: 992, k: 0.16 };
function tlx(yr) {
  const L = TL.x1 - TL.x0;
  if (yr < 1940) return TL.x0 + ((yr - 1840) / 100) * TL.k * L;
  return TL.x0 + (TL.k + ((yr - 1940) / 86) * (1 - TL.k)) * L;
}
function timelineYear(t, k) {
  const s = YEARS[k], prev = k > 0 ? YEARS[k - 1].year : 1840;
  return lerp(prev, s.year, E.io3(prog(s.t0 - 0.1, s.t0 + 0.9, t)));
}
function drawTimeline(c, t, vis, P, k) {
  const yr = timelineYear(t, k), y = TL.y, acc = P.acc;
  c.save();
  c.globalAlpha = vis;
  for (const [a, b] of [[1974, 1980], [1987, 1993]]) {
    c.fillStyle = 'rgba(170,200,255,0.10)';
    c.fillRect(tlx(a), y - 7, tlx(b) - tlx(a), 14);
    text(c, 'AI 寒冬', (tlx(a) + tlx(b)) / 2, y - 14, { f: font(700, 11, F.zh), color: 'rgba(190,215,255,0.55)', align: 'center', sp: 2 });
  }
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(TL.x0, y); c.lineTo(TL.x1, y); c.stroke();
  // the compressed 19th-century stretch is drawn dashed
  c.setLineDash([3, 5]); c.strokeStyle = 'rgba(255,255,255,0.3)';
  c.beginPath(); c.moveTo(TL.x0, y); c.lineTo(tlx(1940), y); c.stroke(); c.setLineDash([]);
  const ticks = [1840, 1900];
  for (let d = 1940; d <= 2020; d += 10) ticks.push(d);
  for (const d of ticks) {
    const x = tlx(d);
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.stroke();
    text(c, String(d), x, y + 30, { f: font(500, 13, F.mono), color: 'rgba(255,255,255,0.38)', align: 'center', sp: 1 });
  }
  const mx = tlx(yr);
  const g = c.createLinearGradient(TL.x0, 0, mx + 1, 0);
  g.addColorStop(0, rgba(acc, 0.15)); g.addColorStop(1, rgba(mixc(acc, WHITE, 0.4), 1));
  c.strokeStyle = g; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(TL.x0, y); c.lineTo(mx, y); c.stroke();
  const seen = new Set();
  for (const s of YEARS) {
    if (seen.has(s.year)) continue;
    seen.add(s.year);
    const x = tlx(s.year);
    c.beginPath(); c.arc(x, y, 3.5, 0, TAU);
    if (s.year <= yr + 0.01) { c.fillStyle = rgba(mixc(acc, WHITE, 0.3), 1); c.fill(); }
    else { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.2; c.stroke(); }
  }
  c.globalCompositeOperation = 'lighter';
  glow(c, mx, y, 30, acc, 0.9);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#fff'; c.beginPath(); c.arc(mx, y, 4.5, 0, TAU); c.fill();
  c.restore();
}
