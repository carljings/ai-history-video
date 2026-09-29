#!/usr/bin/env python3
"""Original soundtrack for "人工智能简史 · The History of AI" (5-minute edition), synthesized in code.

A film-score style cue in D minor at 120 BPM (one bar = 2 s, 150 bars) whose sections follow the
chapters and acts of the video, plus sound effects cued from audio_events.json (exported by the
animation, so every click, clack, whoosh and hit lands on its frame).  Writes soundtrack.wav.
"""
import json
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

ROOT = Path(__file__).resolve().parent
SR = 48000
DUR = 300.0
N = int(SR * DUR)
PAD = 5 * SR                      # room for tails
BEAT, BAR = 0.5, 2.0
R = np.random.default_rng(1943)
TAU = 2 * np.pi

# ------------------------------------------------------------------ pitch
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def hz(name, shift=0):
    n, o = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((12 * (o + 1) + NOTE[n] + shift - 69) / 12)


# ------------------------------------------------------------------ buses
class Bus:
    def __init__(self):
        self.dry = np.zeros((N + PAD, 2), np.float32)
        self.send = np.zeros((N + PAD, 2), np.float32)


def put(bus, t, x, gain=1.0, pan=0.0, send=0.0):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    i, k0 = int(round(t * SR)), 0
    if i < 0:
        k0, i = -i, 0
    n = min(len(x) - k0, len(bus.dry) - i)
    if n <= 0:
        return
    seg = x[k0:k0 + n] * gain
    bus.dry[i:i + n] += seg
    if send:
        bus.send[i:i + n] += seg * send


# ------------------------------------------------------------------ dsp helpers
def filt(x, fc, kind='low', order=2):
    fc = np.atleast_1d(np.asarray(fc, float))
    fc = np.clip(fc, 15, SR / 2 * 0.92) / (SR / 2)
    sos = signal.butter(order, float(fc[0]) if len(fc) == 1 else fc, kind if len(fc) == 1 else 'band', output='sos')
    return signal.sosfilt(sos, x, axis=0)


def rbj(kind, fc, q):
    w0 = TAU * min(max(fc, 20), SR * 0.45) / SR
    al, cw = np.sin(w0) / (2 * q), np.cos(w0)
    if kind == 'bp':
        b = [al, 0, -al]
    elif kind == 'lp':
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
    else:
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
    a = [1 + al, -2 * cw, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def sweep(x, fc, q=1.0, kind='bp', block=128):
    """time-varying biquad (block-wise, state carried across blocks)"""
    fc = np.broadcast_to(np.asarray(fc, float), (len(x),))
    y, zi = np.zeros_like(x), np.zeros(2)
    for i in range(0, len(x), block):
        b, a = rbj(kind, fc[min(i + block // 2, len(x) - 1)], q)
        y[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return y


def env_adsr(n, a=0.01, d=0.1, s=0.8, r=0.2, hold=None):
    t = np.arange(n) / SR
    L = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-4), np.where(t < a + d, 1 - (1 - s) * (t - a) / max(d, 1e-4), s))
    k = min(n - 1, int(L * SR))
    rel = t >= L
    e[rel] = e[k] * np.exp(-(t[rel] - L) * 5.0 / max(r, 1e-3))
    return e


def fade_tail(y, sec=0.02):
    k = min(len(y), int(sec * SR))
    if k > 1:
        y[-k:] *= np.linspace(1, 0, k)[:, None] if y.ndim == 2 else np.linspace(1, 0, k)
    return y


def phase(f, n, ph0=None):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    ph0 = R.random() if ph0 is None else ph0
    return (ph0 + np.cumsum(f) / SR) % 1.0, f / SR


def saw(f, n, ph0=None):
    ph, dt = phase(f, n, ph0)
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def sine(f, n, ph0=None):
    return np.sin(TAU * phase(f, n, ph0)[0])


def noise(n):
    return R.standard_normal(n)


# ------------------------------------------------------------------ instruments
def pad(notes, dur, attack=0.5, release=1.2, cutoff=1800, detune=0.08, voices=3, width=0.7, vib=0.0, hp=110):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for k, nm in enumerate(notes):
        f0 = hz(nm) if isinstance(nm, str) else nm
        p0 = (k / max(1, len(notes) - 1) - 0.5) * 2 * width
        for v in range(voices):
            d = (v - (voices - 1) / 2) * detune
            f = f0 * 2 ** (d / 12)
            if vib:
                f = f * (1 + vib * np.sin(TAU * (4.6 + v * 0.7) * t + R.random() * 6))
            y = saw(f, n)
            a = (np.clip(p0 + (v - 1) * 0.35, -1, 1) + 1) * np.pi / 4
            out[:, 0] += y * np.cos(a)
            out[:, 1] += y * np.sin(a)
    out = filt(filt(out, cutoff), hp, 'high') / np.sqrt(len(notes) * voices) * 0.9
    e = env_adsr(n, attack, 0.3, 0.85, release, hold=dur)
    return out * e[:, None]


def choir(notes, dur, attack=0.6, release=1.6, vowel='a'):
    base = pad(notes, dur, attack, release, cutoff=6000, detune=0.14, voices=3, vib=0.0045)
    forms = {'a': [(800, 1.0, 110), (1150, 0.55, 120), (2900, 0.22, 170)],
             'o': [(480, 1.0, 90), (860, 0.5, 110), (2600, 0.12, 160)]}[vowel]
    y = sum(filt(base, (f - bw, f + bw)) * amp for f, amp, bw in forms)
    return y * 2.1


def ks(freq, dur, bright=0.5, t60=0.8):
    """Karplus-Strong plucked string"""
    n = int(dur * SR)
    P = SR / freq
    Ni = max(2, int(round(P - 0.5)))
    damp = 10 ** (-3 / (t60 * freq))
    x = np.zeros(n)
    x[:Ni] = filt(R.uniform(-1, 1, Ni), 600 + 9000 * bright)
    a = np.zeros(Ni + 2)
    a[0], a[Ni], a[Ni + 1] = 1, -0.5 * damp, -0.5 * damp
    y = signal.lfilter([1.0], a, x)
    y *= np.minimum(1, np.arange(n) / (0.002 * SR))
    return fade_tail(y / (np.max(np.abs(y)) + 1e-9), 0.05) * 1.2


MUSICBOX = ((1, 1.0, 1.0), (2.0, 0.22, 2.0), (3.0, 0.12, 3.0), (4.0, 0.05, 4.0), (5.4, 0.04, 6.0))
CELESTA = ((1, 1.0, 1.0), (2.0, 0.35, 1.8), (3.0, 0.08, 2.6), (4.02, 0.06, 3.5))
TUBULAR = ((0.5, 0.25, 0.7), (1, 1.0, 1.0), (1.19, 0.35, 1.4), (1.5, 0.3, 1.5), (2.0, 0.45, 1.9), (2.52, 0.18, 2.6), (3.01, 0.1, 3.2))


def bell(freq, dur, partials=MUSICBOX, t60=1.4, attack=0.002):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for r, a, dk in partials:
        if freq * r < SR * 0.45:
            y += a * np.sin(TAU * freq * r * t + R.random() * TAU) * np.exp(-t * 6.9 * dk / t60)
    return fade_tail(y * np.minimum(1, t / attack), 0.03) * 1.35


def fm(freq, dur, ratio=1.4, index=2.5, t60=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = index * np.exp(-t * 6.9 / (t60 * 0.35))
    y = np.sin(TAU * freq * t + idx * np.sin(TAU * freq * ratio * t)) * np.exp(-t * 6.9 / t60)
    return fade_tail(y * np.minimum(1, t / 0.002), 0.03) * 1.35


def piano(freq, dur, vel=0.8, t60=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k in range(1, 10):
        fk = freq * k * np.sqrt(1 + 0.00035 * k * k)
        if fk > 12000:
            break
        y += (1 / k ** 1.7) * np.sin(TAU * fk * t + R.random() * TAU) * np.exp(-t * 6.9 * (1 + 0.45 * (k - 1)) / t60)
    y += filt(noise(n) * np.exp(-t * 320), 2500) * 0.04 * vel
    y *= np.minimum(1, t / 0.004) * (0.55 + 0.45 * vel)
    return fade_tail(filt(y, 2600 + 3000 * vel), 0.05) * 1.35


def pluck(freq, dur=0.35, cutoff=3200, t60=0.3, detune=0.08):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = saw(freq, n) + saw(freq * 2 ** (detune / 12), n)
    y *= np.exp(-t * 6.9 / t60) * np.minimum(1, t / 0.002)
    return fade_tail(filt(y, cutoff) * 0.5, 0.02) * 1.35


def lead(freq, dur, cutoff=3200):
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.005 * np.sin(TAU * 5.3 * t) * np.minimum(1, t / 0.35)
    y = saw(freq * vib, n) + 0.7 * saw(freq * vib * 2 ** (0.09 / 12), n) + 0.5 * sine(freq / 2, n)
    y = filt(y, cutoff) * env_adsr(n, 0.012, 0.25, 0.75, 0.3, hold=dur)
    return fade_tail(filt(y, 150, 'high') * 0.6, 0.02)


def string_stab(freq, dur, cutoff=1200):
    n = int((dur + 0.12) * SR)
    y = saw(freq, n) + saw(freq * 2 ** (0.1 / 12), n)
    y = filt(y, cutoff) * env_adsr(n, 0.006, 0.12, 0.55, 0.1, hold=dur)
    return fade_tail(filt(y, 90, 'high') * 0.65, 0.01)


def sub_bass(freq, dur, drive=1.6):
    n = int((dur + 0.06) * SR)
    y = np.tanh(drive * sine(freq, n, 0.0)) / np.tanh(drive)
    y += 0.18 * sine(freq * 2, n, 0.0)
    return fade_tail(filt(y * env_adsr(n, 0.004, 0.1, 0.9, 0.06, hold=dur), 32, 'high') * 0.56, 0.01)


def saw_bass(freq, dur, cutoff=800):
    n = int((dur + 0.05) * SR)
    y = saw(freq, n) * 0.6 + sine(freq, n, 0.0) * 0.6
    y = filt(y, cutoff) * env_adsr(n, 0.003, 0.08, 0.7, 0.05, hold=dur)
    return fade_tail(filt(y, 45, 'high') * 0.7, 0.01)


# ------------------------------------------------------------------ drums
def kick(tone=50, punch=115, decay=7.5, click=0.3, dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = tone + punch * np.exp(-t * 32)
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * decay)
    y += filt(noise(n), 2500, 'high') * np.exp(-t * 380) * click
    return fade_tail(filt(np.tanh(1.7 * y), 30, 'high') * 0.72, 0.02)


def snare(tone=185, nd=16, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(TAU * tone * t) * np.exp(-t * 22) * 0.55 + np.sin(TAU * tone * 1.62 * t) * np.exp(-t * 30) * 0.25
    nz = filt(noise(n), (1100, 9000)) * np.exp(-t * nd) * 0.9
    return fade_tail(body + nz, 0.02)


def gated_snare():
    s = snare(dur=0.3)
    n = int(0.36 * SR)
    t = np.arange(n) / SR
    tail = filt(noise(n), (400, 6000)) * np.where(t < 0.24, 0.55 * np.exp(-t * 2), 0) * np.minimum(1, t / 0.01)
    tail = fade_tail(tail, 0.01)
    y = np.zeros(n)
    y[:len(s)] += s
    y += tail
    return y


def clap():
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022, 0.031]):
        i = int(d * SR)
        y[i:] += np.exp(-(t[:n - i]) * (140 if k < 3 else 16)) * (1 if k < 3 else 0.8)
    return fade_tail(filt(noise(n) * y, (900, 5200)) * 0.8, 0.02)


def hat(open_=False):
    n = int((0.35 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    metal = sum(np.sign(np.sin(TAU * f * t + R.random() * TAU)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    y = filt(metal * 0.25 + noise(n) * 0.6, 7000, 'high') * np.exp(-t * (11 if open_ else 55))
    return fade_tail(y * 0.7, 0.01)


def tom(freq=90, decay=5.0, dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1 + 0.6 * np.exp(-t * 18))
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * decay)
    y += filt(noise(n), (150, 1200)) * np.exp(-t * 30) * 0.35
    return fade_tail(np.tanh(1.4 * y), 0.02)


def clock_tick(high=True):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    f = 3100 if high else 2300
    y = filt(noise(n), 2000, 'high') * np.exp(-t * 700) + np.sin(TAU * f * t) * np.exp(-t * 160) * 0.5
    return fade_tail(y, 0.005)


def shaker():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    return fade_tail(filt(noise(n), (4500, 11000)) * np.minimum(1, t / 0.012) * np.exp(-t * 38), 0.01)


# ------------------------------------------------------------------ effects
def impact(size=1.0, dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sub = np.sin(TAU * np.cumsum(40 + 70 * np.exp(-t * 9)) / SR) * np.exp(-t * 1.9) * 0.7
    boom = filt(noise(n), 200) * np.exp(-t * 3.6) * 1.8
    crack = filt(noise(n), (700, 7000)) * np.exp(-t * 22) * 0.45
    return fade_tail(filt(np.tanh((sub + boom + crack) * 1.1), 30, 'high') * size, 0.2)


def riser(dur, f0=250, f1=7000, tone=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    fc = f0 * (f1 / f0) ** u
    y = sweep(noise(n), fc, q=1.4) * 1.4
    y += filt(saw(80 * (8 ** u), n), 3000) * tone
    return fade_tail(filt(y * u ** 2.2, 9000) * 0.8, 0.03)


def whoosh(dur=0.9, f0=300, f1=4000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    fc = f0 * (f1 / f0) ** np.sin(np.pi * u) ** 1.5
    y = sweep(noise(n), fc, q=0.9) * np.sin(np.pi * u) ** 2
    pan = np.clip(-0.8 + 1.6 * u, -1, 1)
    a = (pan + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)], 1) * np.sqrt(2)


def rev_cymbal(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = filt(filt(noise(n), 3500, 'high'), 10000) * np.exp(-(dur - t) * 3.2)
    y[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return y


def wind(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    lfo = 0.5 + 0.5 * np.sin(TAU * 0.13 * t + 1) * np.sin(TAU * 0.29 * t)
    y = sweep(noise(n), 350 + 700 * lfo, q=0.8) * (0.35 + 0.65 * lfo)
    y *= np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.2)
    return y


def snare_roll(t0, t1, rates, gain0, gain1, bus, tone0=180, tone1=240):
    """accelerating snare roll; rates = [(until_time, hits_per_second), ...]"""
    t, k = t0, 0
    while t < t1:
        rate = next(r for tt, r in rates if t < tt)
        u = (t - t0) / (t1 - t0)
        put(bus, t, snare(tone=tone0 + (tone1 - tone0) * u, nd=26, dur=0.2), gain=gain0 + (gain1 - gain0) * u, send=0.15)
        t += 1 / rate
        k += 1


# ------------------------------------------------------------------ reverb & mastering
def make_ir(t60=2.6, length=3.4, predelay=0.025, damp=4200, seed=1):
    n = int(length * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-t * 6.9 / t60)[:, None]
    dark = filt(ir, damp * 0.3)
    w = np.clip(t / (t60 * 0.6), 0, 1)[:, None]
    ir = ir * (1 - w) * 0.8 + dark * w * 1.6
    ir *= np.minimum(1, t / 0.012)[:, None]
    pd = int(predelay * SR)
    ir = np.concatenate([np.zeros((pd, 2)), ir])[:n]
    for _ in range(10):
        d = int((0.006 + r.random() * 0.045) * SR)
        ir[d] += r.uniform(-0.5, 0.5, 2) * 0.6
    ir = filt(ir, 140, 'high')
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(send, ir):
    out = np.zeros_like(send)
    for ch in range(2):
        out[:, ch] = signal.fftconvolve(send[:, ch], ir[:, ch])[:len(send)]
    return out


def tape_stop(x, t0, t1):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    n = i1 - i0
    u = np.arange(n) / n
    pos = i0 + np.cumsum((1 - u) ** 1.4)
    src = x.copy()
    for ch in range(2):
        x[i0:i1, ch] = np.interp(pos, np.arange(len(src)), src[:, ch])
    x[i0:i1] *= np.minimum(1, (1 - u) / 0.15)[:, None]
    x[i1:] = 0


def limiter(x, ceiling=0.84, look=0.006):
    peak = np.max(np.abs(x), axis=1)
    g = np.minimum(1.0, ceiling / (peak + 1e-12))
    L = int(look * SR)
    g = minimum_filter1d(g, 2 * L + 1)
    g = uniform_filter1d(g, L)
    return x * g[:, None]


def lufs(x):
    """ITU-R BS.1770 integrated loudness (K-weighting + gating)"""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.mean(y[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(y) - blk, hop)])
    ld = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[ld > -70]
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g2 = g[(-0.691 + 10 * np.log10(g + 1e-12)) > rel]
    return -0.691 + 10 * np.log10(g2.mean())


# ============================================================== the score
SECTIONS = [  # (first bar, chords) — one bar = 2 s
    (0, ['D5', 'D5', 'D5', 'Dm', 'Bb', 'F', 'A']),                  # intro
    (7, ['Dm', 'C']),                                               # act I card
    (9, ['Dm', 'C', 'Bb', 'A', 'Dm']),                              # 1843
    (14, ['Dm', 'Bb', 'F', 'C', 'Dm']),                             # 1936
    (19, ['Dm', 'Bb', 'F', 'C', 'Gm']),                             # 1943
    (24, ['F', 'C', 'Dm', 'Bb', 'A']),                              # 1950
    (29, ['Dm', 'Bb', 'F', 'C', 'A']),                              # 1956
    (34, ['Dm', 'C']),                                              # act II card
    (36, ['F', 'C', 'Dm', 'Bb', 'C']),                              # 1958
    (41, ['Dm', 'C', 'Bb', 'C', 'Dm']),                             # 1966
    (46, ['Dm', 'Dm/C', 'Bb', 'A']),                                # 1969
    (50, ['Dm', 'Bb', 'Gm', 'A', 'Dm']),                            # 1974
    (55, ['Dm', 'Bb', 'F', 'C']),                                   # 1980
    (59, ['Dm', 'Bb', 'F', 'C', 'Dm']),                             # 1986
    (64, ['Dm', 'Bb', 'F', 'C', 'Dm']),                             # 1989
    (69, ['Dm', 'Bb', 'Gm', 'A', 'A']),                             # 1997
    (74, ['Dm', 'C']),                                              # act III card
    (76, ['Dm', 'Bb', 'F', 'C']),                                   # 2009
    (80, ['Dm', 'Bb', 'F', 'C']),                                   # 2011
    (84, ['Dm', 'Bb', 'F', 'C', 'Dm']),                             # 2012
    (89, ['Gm', 'Dm', 'A', 'Dm', 'Bb']),                            # 2014
    (94, ['Dm', 'Bb', 'Gm', 'A', 'Dm']),                            # 2016
    (99, ['Dm', 'Bb', 'F', 'C', 'A']),                              # 2017
    (104, ['Dm', 'C']),                                             # act IV card
    (106, ['Dm', 'Bb', 'F', 'C']),                                  # 2020
    (110, ['F', 'C', 'Dm', 'Bb', 'F']),                             # 2021
    (115, ['Dm', 'Bb', 'F', 'C', 'A']),                             # 2022 diffusion
    (120, ['Dm', 'Bb', 'F', 'C', 'Dm']),                            # 2022 ChatGPT
    (125, ['Bb', 'F', 'C', 'Dm']),                                  # 2023
    (129, ['Dm', 'Bb', 'F', 'C']),                                  # 2024
    (133, ['Dm', 'Bb', 'F', 'C', 'Dm', 'A']),                       # 2025
    (139, ['Asus', 'A', 'Dm', 'Bb', 'F', 'C', 'Bb', 'A', 'D', 'D', 'D']),   # finale
]
CHART = []
for b0, chords in SECTIONS:
    assert len(CHART) == b0, (b0, len(CHART))
    CHART += chords
assert len(CHART) == 150
CH = {  # pad voicing, bass root, arpeggio notes
    'D5': (['D3', 'A3', 'D4'], 'D2', ['D4', 'A4', 'D5', 'A5']),
    'Dm': (['D3', 'A3', 'D4', 'F4'], 'D2', ['D4', 'F4', 'A4', 'D5']),
    'Bb': (['D3', 'F3', 'Bb3', 'D4'], 'Bb1', ['Bb3', 'D4', 'F4', 'Bb4']),
    'F': (['C3', 'F3', 'A3', 'C4'], 'F2', ['F4', 'A4', 'C5', 'F5']),
    'C': (['C3', 'E3', 'G3', 'C4'], 'C2', ['C4', 'E4', 'G4', 'C5']),
    'Gm': (['D3', 'G3', 'Bb3', 'D4'], 'G2', ['G4', 'Bb4', 'D5', 'G5']),
    'A': (['E3', 'A3', 'C#4', 'E4'], 'A1', ['A4', 'C#5', 'E5', 'A5']),
    'Asus': (['E3', 'A3', 'D4', 'E4'], 'A1', ['A4', 'D5', 'E5', 'A5']),
    'Dm/C': (['C3', 'F3', 'A3', 'D4'], 'C2', ['D4', 'F4', 'A4', 'D5']),
    'D': (['D3', 'A3', 'D4', 'F#4'], 'D2', ['D4', 'F#4', 'A4', 'D5']),
}
# the main theme, in beats over a Dm–Bb–F–C phrase
THEME = [(0, 'A4', 1), (1, 'D5', 1), (2, 'F5', 2), (4, 'G5', 1), (5, 'F5', 1), (6, 'D5', 2),
         (8, 'C5', 1), (9, 'F5', 1), (10, 'A5', 2), (12, 'G5', 1.5), (13.5, 'F5', 0.5), (14, 'E5', 2)]
# a brighter answer phrase over F–C–Dm–Bb
THEME2 = [(0, 'C5', 1), (1, 'F5', 1), (2, 'A5', 2), (4, 'G5', 1), (5, 'E5', 1), (6, 'C5', 2),
          (8, 'D5', 1), (9, 'F5', 1), (10, 'A5', 1.5), (11.5, 'G5', 0.5), (12, 'F5', 2), (14, 'D5', 2)]

CRASH = 127.1                                 # the 1987 CRT collapse (tape stop)
A, B, D, S = Bus(), Bus(), Bus(), Bus()      # music before the crash, after it, side-chained music, sfx
DUCK = np.ones(N + PAD, np.float32)


def M(t):
    return A if t < CRASH else B


def duck(t, depth=0.5, rel=0.16):
    i, n = int(t * SR), int(rel * 5 * SR)
    tt = np.arange(n) / SR
    g = 1 - depth * np.minimum(1, tt / 0.004) * np.exp(-tt / rel)
    j = min(len(DUCK), i + n)
    DUCK[i:j] *= g[:j - i]


def bar_info(b):
    padn, root, arp = CH[CHART[b]]
    return b * BAR, padn, root, arp


def bars(t0, t1):
    for b in range(int(round(t0 / BAR)), int(round(t1 / BAR))):
        yield (b,) + bar_info(b)


def four_floor(bus, t, gain=0.6, depth=0.5, tone=50, skip=()):
    for k in range(4):
        if k in skip:
            continue
        put(bus, t + k * BEAT, kick(tone=tone), gain=gain, send=0.03)
        if depth:
            duck(t + k * BEAT, depth)


def hats16(bus, t, g=0.085, open_=True):
    for i in range(16):
        put(bus, t + i * 0.125, hat(), gain=g * [1, 0.45, 0.7, 0.45][i % 4], pan=0.25)
    if open_:
        for i in range(4):
            put(bus, t + i * BEAT + 0.25, hat(True), gain=g * 0.7, pan=-0.2, send=0.1)


def hats8(bus, t, g=0.05):
    for i in range(8):
        put(bus, t + i * 0.25, hat(), gain=g if i % 2 else g * 0.6, pan=0.3)


def arp16(bus, t, arp, inst, g, shift=0, pattern=(0, 1, 2, 3, 2, 3, 1, 2), echo=0.35, send=0.3, n=16):
    for i in range(n):
        f = hz(arp[pattern[i % len(pattern)]], shift)
        x = inst(f)
        pan = 0.35 if i % 2 else -0.35
        put(bus, t + i * 0.125, x, gain=g, pan=pan, send=send)
        if echo:
            put(bus, t + i * 0.125 + 0.375, x, gain=g * echo, pan=-pan * 1.6, send=send)


def theme(bus, t0, inst, gain, shift=0, send=0.4, pan=0.0, extra=0.0, notes=THEME):
    for off, nm, d in notes:
        put(bus, t0 + off * BEAT, inst(hz(nm, shift), d * BEAT + extra), gain=gain, pan=pan, send=send)


def square_pluck(freq, dur=0.25, cutoff=2400):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sign(np.sin(TAU * freq * t + 0.3)) * 0.6 + np.sign(np.sin(TAU * freq * 2.003 * t)) * 0.15
    y *= np.exp(-t * 14) * np.minimum(1, t / 0.002)
    return fade_tail(filt(y, cutoff), 0.02)


def sub_pulse(bus, t, root, gain=0.2, n=8):
    for i in range(n):
        put(bus, t + i * 0.25, sub_bass(hz(root), 0.2), gain=gain)


def act_card(t0, chord='Dm'):
    bus = M(t0)
    padn = CH[chord][0]
    put(bus, t0, choir(padn, 1.6, attack=0.02, release=1.8), gain=0.32, send=0.75)
    put(bus, t0, pad(padn + ['A4'], 1.8, attack=0.01, release=1.4, cutoff=3000, detune=0.12), gain=0.26, send=0.6)
    put(bus, t0, tom(58, 3.2, 1.6), gain=0.5, send=0.5)
    put(bus, t0, sub_bass(hz(CH[chord][1]), 1.9), gain=0.3)
    put(bus, t0 + 2.0, pad(CH['C'][0], 2.0, attack=0.6, release=0.5, cutoff=1600), gain=0.18, send=0.6)
    put(bus, t0 + 1.4, riser(2.6, 220, 9000), gain=0.3, send=0.3)
    put(bus, t0 + 2.6, rev_cymbal(1.4), gain=0.24)
    snare_roll(t0 + 3.0, t0 + 4.0, [(t0 + 3.5, 8), (t0 + 4.0, 16)], 0.07, 0.24, bus)


def sec_intro():
    put(A, 0.25, pad(['D2', 'A2', 'D3'], 5.75, attack=3.0, release=0.8, cutoff=650, detune=0.1, hp=40), gain=0.5, send=0.45)
    put(A, 1.0, pad(['A4', 'D5', 'E5'], 5.0, attack=3.0, release=1.2, cutoff=3200, detune=0.16), gain=0.08, send=0.9)
    put(A, 4.2, rev_cymbal(1.8), gain=0.3, send=0.3)
    put(A, 3.4, riser(2.6, 200, 4000), gain=0.24, send=0.3)
    for b, t, padn, root, arp in bars(6, 14):
        put(A, t, pad(padn, BAR, attack=0.03 if b == 3 else 0.3, release=1.3, cutoff=2400), gain=0.3, send=0.55)
        put(A, t, sub_bass(hz(root), 1.95), gain=0.36)
        if b >= 4:
            for i, pi in enumerate((0, 1, 2, 3, 2, 1, 2, 3)):
                put(A, t + i * 0.25, bell(hz(arp[pi], 12), 1.2, MUSICBOX, t60=0.9), gain=0.05 * (1.15 if i % 2 == 0 else 0.8),
                    pan=0.35 if i % 2 else -0.35, send=0.5)
    for t, nm in [(6.5, 'A5'), (7.0, 'D6'), (7.5, 'F6'), (8.5, 'E6'), (9.0, 'D6')]:
        put(A, t, bell(hz(nm), 3.0, CELESTA, t60=2.4), gain=0.12, pan=0.25, send=0.7)
    put(A, 11.0, riser(3.0, 250, 9000), gain=0.3, send=0.3)
    put(A, 12.6, rev_cymbal(1.4), gain=0.24)
    snare_roll(13.0, 14.0, [(13.5, 8), (14.0, 16)], 0.07, 0.24, A)


def sec_act1():
    for b, t, padn, root, arp in bars(18, 28):                      # 1843: clockwork
        put(A, t, pad(padn, BAR, attack=0.3, release=1.0, cutoff=1300, detune=0.07), gain=0.2, send=0.5)
        for off in (0.0, 1.0):
            put(A, t + off, ks(hz(root, 12), 0.9, bright=0.35, t60=0.7), gain=0.4, send=0.2)
        for i, pi in enumerate((0, 1, 2, 3, 2, 1, 2, 3)):
            put(A, t + i * 0.25, bell(hz(arp[pi], 12), 1.2, MUSICBOX, t60=0.9), gain=0.06 * (1.15 if i % 2 == 0 else 0.8),
                pan=0.35 if i % 2 else -0.35, send=0.45)
        for i in range(4):
            put(A, t + i * BEAT, clock_tick(i % 2 == 0), gain=0.07, pan=0.4)
    for b, t, padn, root, arp in bars(28, 38):                      # 1936: the machine starts running
        put(A, t, pad(padn, BAR, attack=0.25, release=0.9, cutoff=1800, detune=0.07), gain=0.3, send=0.45)
        for i in range(8):
            put(A, t + i * 0.25, ks(hz(root if i % 4 == 0 else arp[i % 4], 12 if i % 4 == 0 else 0), 0.5, bright=0.5, t60=0.35),
                gain=0.3 if i % 2 == 0 else 0.2, pan=-0.3 if i % 2 else 0.3, send=0.2)
        for i, pi in enumerate((0, 2, 1, 3)):
            put(A, t + i * BEAT + 0.25, bell(hz(arp[pi], 12), 1.0, MUSICBOX, t60=0.8), gain=0.05, pan=0.3, send=0.4)
        put(A, t, kick(tone=48, decay=7.5, click=0.1), gain=0.36, send=0.04)
        put(A, t + 1.0, kick(tone=48, decay=7.5, click=0.1), gain=0.26)
        if b >= 16:
            for i in range(8):
                put(A, t + i * 0.25 + 0.125, shaker(), gain=0.045 if i % 2 else 0.03, pan=0.3)
    for b, t, padn, root, arp in bars(38, 48):                      # 1943: the neuron
        put(A, t, pad(padn, BAR, attack=0.25, release=0.9, cutoff=1800, detune=0.07), gain=0.23, send=0.45)
        for off in (0.0, 1.0):
            put(A, t + off, ks(hz(root, 12), 0.9, bright=0.35, t60=0.7), gain=0.4, send=0.2)
        put(A, t, kick(tone=48, decay=7.5, click=0.1), gain=0.32, send=0.04)
        put(A, t + 1.0, kick(tone=48, decay=7.5, click=0.1), gain=0.24)
        for i in range(8):
            put(A, t + i * 0.25 + 0.125, shaker(), gain=0.05 if i % 2 else 0.035, pan=0.3)
        for i in range(4):
            put(A, t + i * 0.5 + 0.25, hat(), gain=0.04, pan=-0.25)
    theme(A, 40.0, lambda f, d: piano(f, d + 1.2, vel=0.6), 0.2, shift=-12, send=0.45, pan=-0.15)
    for b, t, padn, root, arp in bars(48, 58):                      # 1950: the question (typewriter carries the rhythm)
        put(A, t, pad(padn, BAR, attack=0.4, release=1.2, cutoff=1400, detune=0.08), gain=0.2, send=0.6)
        put(A, t, sub_bass(hz(root), BAR - 0.05, drive=1.1), gain=0.14)
        for i, nm in enumerate(padn[1:]):
            put(A, t + i * 0.12, piano(hz(nm, 12), 1.6, vel=0.45), gain=0.1, pan=-0.2 + 0.2 * i, send=0.55)
    theme(A, 50.0, lambda f, d: bell(f, d + 1.6, CELESTA, t60=1.8), 0.18, send=0.55, pan=0.1, notes=THEME2)
    put(A, 58.0, impact(0.9), gain=0.6, send=0.6)                      # 1956: the birth
    for b, t, padn, root, arp in bars(58, 68):
        put(A, t, pad(padn, BAR, attack=0.1, release=1.0, cutoff=2600, detune=0.1), gain=0.26, send=0.5)
        put(A, t, choir(padn, BAR, attack=0.3, release=1.2), gain=0.22, send=0.6)
        put(A, t, sub_bass(hz(root), BAR - 0.05), gain=0.22)
        put(A, t, kick(tone=48, decay=6), gain=0.5, send=0.05)
        put(A, t + 1.0, snare(dur=0.4), gain=0.26, send=0.45)
        hats8(A, t, 0.04)
    theme(A, 60.0, lambda f, d: bell(f, d + 1.4, CELESTA, t60=1.8), 0.2, send=0.5, pan=0.1)
    theme(A, 60.0, lambda f, d: piano(f, d + 1.2, vel=0.7), 0.16, shift=-12, send=0.45, pan=-0.15)


def sec_act2():
    for b, t, padn, root, arp in bars(72, 82):                      # 1958: optimism
        put(A, t, pad(padn, BAR, attack=0.05, release=0.8, cutoff=2600, detune=0.1), gain=0.22, send=0.45)
        four_floor(A, t, 0.46, 0)
        for k in (1, 3):
            put(A, t + k * BEAT, clap(), gain=0.2, send=0.25)
        hats8(A, t, 0.05)
        sub_pulse(A, t, root, 0.16)
        arp16(A, t, arp, lambda f: pluck(f, 0.25, 3200, 0.16), 0.06, shift=12, send=0.3)
    for b, t, padn, root, arp in bars(82, 92):                      # 1966: retro computer bleeps
        put(A, t, pad(padn, BAR, attack=0.1, release=0.8, cutoff=2200, detune=0.08), gain=0.26, send=0.45)
        put(A, t, kick(tone=50, decay=7), gain=0.46, send=0.03)
        put(A, t + 1.0, kick(tone=50, decay=7), gain=0.3)
        put(A, t + 0.5, clap(), gain=0.14, send=0.3)
        put(A, t + 1.5, clap(), gain=0.14, send=0.3)
        hats8(A, t, 0.04)
        sub_pulse(A, t, root, 0.15)
        arp16(A, t, arp, lambda f: square_pluck(f, 0.2, 2600), 0.075, shift=12, pattern=(0, 2, 1, 3), send=0.25, n=16, echo=0.3)
    for b, t, padn, root, arp in bars(92, 100):                     # 1969: doubt
        put(A, t, pad(padn + ['Eb4'], BAR, attack=0.4, release=1.2, cutoff=1100, detune=0.14), gain=0.2, send=0.6)
        if t < 97.5:
            sub_pulse(A, t, root, 0.2)
            put(A, t, kick(tone=46, decay=6), gain=0.42)
            for i in range(8):
                put(A, t + i * 0.25, string_stab(hz(root, 12), 0.2, cutoff=700), gain=0.08, send=0.3)
    put(A, 98.4, whoosh(1.6, 3000, 250), gain=0.3, send=0.5)
    for b, t, padn, root, arp in bars(100, 110):                    # 1974: winter
        put(A, t, pad(padn, BAR, attack=0.7, release=1.6, cutoff=850, detune=0.1), gain=0.15, send=0.7)
        put(A, t, sub_bass(hz(root), BAR - 0.05, drive=1.1), gain=0.1)
    put(A, 99.4, wind(11.0), gain=0.16, send=0.25)
    for t, nm in [(100.5, 'A4'), (101.25, 'F4'), (102.0, 'D4'), (103.0, 'F4'), (104.0, 'Bb4'), (104.75, 'A4'), (105.5, 'G4'),
                  (106.25, 'E4'), (107.0, 'C#5'), (108.0, 'D5'), (108.75, 'A4'), (109.5, 'F4')]:
        put(A, t, piano(hz(nm), 3.0, vel=0.5, t60=3.5), gain=0.14, pan=0.15, send=0.7)
    for k, nm in enumerate(['D6', 'A6', 'E6', 'F6']):
        n = int(9.5 * SR)
        tt = np.arange(n) / SR
        g = sine(hz(nm), n) * (0.5 + 0.5 * np.sin(TAU * (0.3 + k * 0.11) * tt)) * np.minimum(1, tt / 2) * np.minimum(1, (9.5 - tt) / 1.5)
        put(A, 100.3 + k * 0.2, g, gain=0.018, pan=-0.6 + k * 0.4, send=0.9)
    for b, t, padn, root, arp in bars(110, 118):                    # 1980: the boom
        u = (t - 110) / 6
        put(A, t, pad(padn, BAR, attack=0.05, release=0.6, cutoff=1500 + 1800 * u, detune=0.12), gain=0.2, send=0.4)
        arp16(A, t, arp, lambda f, u=u: pluck(f, 0.25, 1400 + 2600 * u, 0.15), 0.065, shift=12, send=0.3)
        for i in range(8):
            put(A, t + i * 0.25, saw_bass(hz(root, 12 if i % 2 else 0), 0.21, cutoff=700 + 400 * u), gain=0.24)
        if t >= 112:
            four_floor(A, t, 0.5, 0)
            hats8(A, t, 0.05)
    put(A, 116.2, riser(1.8, 300, 7000), gain=0.25, send=0.3)
    for b, t, padn, root, arp in bars(118, 128):                    # 1986: synthwave
        put(A, t, pad(padn, BAR, attack=0.02, release=0.5, cutoff=3300, detune=0.13), gain=0.2, send=0.35)
        for i in range(8):
            put(A, t + i * 0.25, saw_bass(hz(root, 12 if i % 2 else 0), 0.21, cutoff=950), gain=0.3)
        for k in (0, 2):
            put(A, t + k * BEAT, kick(tone=52, decay=8), gain=0.58, send=0.03)
        for k in (1, 3):
            put(A, t + k * BEAT, gated_snare(), gain=0.36)
        hats8(A, t, 0.06)
        arp16(A, t, arp, lambda f: pluck(f, 0.3, 2600, 0.22), 0.07, shift=12, send=0.25)
    theme(A, 118.0, lambda f, d: lead(f, d, 2600), 0.13, shift=-12, send=0.35)
    for b, t, padn, root, arp in bars(128, 138):                    # 1989: rebuilding in the cold
        u = (t - 128) / 8
        put(B, t, pad(padn, BAR, attack=0.4, release=1.0, cutoff=700 + 1400 * u, detune=0.09), gain=0.22, send=0.55)
        put(B, t, sub_bass(hz(root), BAR - 0.05, drive=1.2), gain=0.16)
        for i in range(8):
            put(B, t + i * 0.25, clock_tick(i % 2 == 0), gain=0.05 if i % 2 == 0 else 0.035, pan=0.3)
        for i, pi in enumerate((0, 2, 1, 3)):
            put(B, t + i * BEAT + 0.25, bell(hz(arp[pi], 12), 1.4, CELESTA, t60=1.0), gain=0.05, pan=-0.3 + 0.2 * i, send=0.55)
        if t >= 132:
            put(B, t, kick(tone=48, decay=7), gain=0.4, send=0.03)
            put(B, t + 1.0, kick(tone=48, decay=7), gain=0.3)
            put(B, t + 1.5, clap(), gain=0.14, send=0.35)
    for i in range(40):                                             # 1997: the clock is ticking
        put(B, 138.0 + i * 0.25, clock_tick(i % 2 == 0), gain=0.1 if i % 2 == 0 else 0.07, pan=0.25)
    for b, t, padn, root, arp in bars(138, 148):
        for i in range(8):
            k = (b - 69) * 8 + i
            put(B, t + i * 0.25, string_stab(hz(root, 12 if i % 2 else 24), 0.22, cutoff=450 + 2000 * k / 40), gain=0.2, send=0.3)
        put(B, t, pad(padn, BAR, attack=0.4, release=1.0, cutoff=1100, detune=0.09), gain=0.22, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.18)
        if t >= 142:
            put(B, t, kick(tone=48, decay=6), gain=0.45)
    put(B, 145.55, tom(62, 3.5, 1.4), gain=0.45, send=0.4)
    put(B, 145.4, riser(2.6, 300, 8000), gain=0.28, send=0.3)
    put(B, 146.6, rev_cymbal(1.4), gain=0.26)
    snare_roll(147.0, 148.0, [(147.5, 8), (148.0, 16)], 0.08, 0.26, B)


def sec_act3():
    for b, t, padn, root, arp in bars(152, 160):                    # 2009: data pours in
        u = (t - 152) / 6
        put(B, t, pad(padn, BAR, attack=0.1, release=0.8, cutoff=1200 + 2000 * u, detune=0.1), gain=0.22, send=0.45)
        arp16(B, t, arp, lambda f, u=u: pluck(f, 0.25, 900 + 3500 * u, 0.16), 0.07, shift=12, send=0.3)
        sub_pulse(B, t, root, 0.16)
        hats16(B, t, 0.05, open_=False)
        if t >= 156:
            four_floor(B, t, 0.5, 0)
    put(B, 158.0, riser(2.0, 300, 7000), gain=0.22, send=0.3)
    for b, t, padn, root, arp in bars(160, 168):                    # 2011: game show groove
        four_floor(B, t, 0.56, 0.45)
        for k in (1, 3):
            put(B, t + k * BEAT, clap(), gain=0.28, send=0.2)
        hats16(B, t, 0.055)
        for i in range(8):
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.18)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.7, cutoff=2400), gain=0.22, send=0.4)
        for i, pi in enumerate((0, 1, 2, 3)):
            put(B, t + i * BEAT, bell(hz(arp[pi], 12), 1.2, CELESTA, t60=0.8), gain=0.06, pan=-0.3 + 0.2 * i, send=0.4)
    put(B, 166.4, riser(1.6, 300, 9000), gain=0.3, send=0.3)
    snare_roll(167.0, 168.0, [(167.5, 8), (168.0, 16)], 0.08, 0.28, B)
    put(B, 168.0, impact(1.2), gain=0.85, send=0.6)                   # 2012: the big bang
    for b, t, padn, root, arp in bars(168, 178):
        four_floor(B, t, 0.62, 0.55)
        for k in (1, 3):
            put(B, t + k * BEAT, clap(), gain=0.34, send=0.2)
        hats16(B, t, 0.065)
        for i in range(8):
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.2)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.7, cutoff=2800), gain=0.24, send=0.4)
        arp16(B, t, arp, lambda f: pluck(f, 0.25, 3800, 0.16), 0.075, shift=12, send=0.3)
    theme(B, 170.0, lambda f, d: lead(f, d, 3200), 0.12, send=0.35)
    for b, t, padn, root, arp in bars(178, 188):                    # 2014: forger vs detective, call and response
        put(B, t, pad(padn, BAR, attack=0.1, release=0.9, cutoff=1600, detune=0.12), gain=0.2, send=0.5)
        put(B, t, kick(tone=48, decay=7), gain=0.5, send=0.03)
        put(B, t + 1.0, snare(dur=0.3), gain=0.24, send=0.3)
        put(B, t + 1.25, kick(tone=48, decay=7), gain=0.34)
        hats8(B, t, 0.05)
        sub_pulse(B, t, root, 0.17)
        for i in range(8):
            gen = i % 2 == 0
            nm = arp[(0, 2, 1, 3)[(i // 2) % 4]]
            x = fm(hz(nm, 12 if gen else 19), 0.35, 2.0 if gen else 3.5, 1.6, 0.3)
            put(B, t + i * 0.25, x, gain=0.06, pan=-0.6 if gen else 0.6, send=0.3)
    taiko = [0, 0.75, 1.5, 2.0, 3.0, 3.5]                               # 2016: taiko and choir
    for b, t, padn, root, arp in bars(188, 198):
        put(B, t, choir(padn, BAR, attack=0.3, release=1.2), gain=0.44, send=0.6)
        put(B, t, pad(padn, BAR, attack=0.2, release=1.0, cutoff=2200, detune=0.1), gain=0.22, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.15)
        breath = 192.0 <= t < 194.0
        for k in taiko:
            if breath and k >= 2.5:
                continue
            put(B, t + k * BEAT, filt(tom(66 if k in (0, 2) else 92, 4.0, 1.0), 50, 'high'), gain=0.3 if k in (0, 2) else 0.22, send=0.35)
        if not breath:
            for i in range(8):
                put(B, t + i * 0.25, string_stab(hz(arp[(0, 2, 1, 3)[i % 4]]), 0.2, 2400), gain=0.1, pan=0.3 if i % 2 else -0.3, send=0.35)
    put(B, 193.0, rev_cymbal(0.7), gain=0.2)
    put(B, 193.7, choir(['D4', 'G4', 'Bb4', 'D5'], 2.0, attack=0.05, release=1.6, vowel='o'), gain=0.2, send=0.7)
    for b, t, padn, root, arp in bars(198, 208):                    # 2017: attention
        put(B, t, pad(padn, BAR, attack=0.3, release=1.2, cutoff=2400, detune=0.12), gain=0.2, send=0.6)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.18)
        arp16(B, t, arp, lambda f: fm(f, 0.6, 3.0, 1.6, 0.5), 0.07, shift=12, pattern=(0, 2, 1, 3, 2, 0, 3, 1), send=0.45)
        put(B, t, kick(tone=48, decay=7), gain=0.46, send=0.03)
        put(B, t + 1.0, kick(tone=48, decay=7), gain=0.36)
        put(B, t + 1.5, clap(), gain=0.18, send=0.35)
        hats8(B, t, 0.045)


def sec_act4():
    for b, t, padn, root, arp in bars(212, 220):                    # 2020: scale
        u = (t - 212) / 6
        put(B, t, pad(padn, BAR, attack=0.05, release=0.6, cutoff=900 + 3000 * u), gain=0.24, send=0.4)
        sub_pulse(B, t, root, 0.2)
        four_floor(B, t, 0.52, 0.0, skip=(3,) if t == 218 else ())
        arp16(B, t, arp, lambda f, u=u: pluck(f, 0.25, 1200 + 3500 * u, 0.16), 0.065, shift=12, send=0.3)
    snare_roll(214.0, 219.6, [(216.0, 4), (218.0, 8), (219.0, 16), (219.6, 32)], 0.06, 0.3, B, 170, 260)
    put(B, 215.0, riser(4.8, 200, 10000), gain=0.3, send=0.3)
    put(B, 218.5, rev_cymbal(1.5), gain=0.26)
    for b, t, padn, root, arp in bars(220, 230):                    # 2021: wonder
        put(B, t, choir(padn, BAR, attack=0.4, release=1.4), gain=0.3, send=0.7)
        put(B, t, pad(padn, BAR, attack=0.3, release=1.2, cutoff=2000, detune=0.1), gain=0.18, send=0.6)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.14)
        put(B, t, kick(tone=46, decay=6), gain=0.38, send=0.05)
        for i, pi in enumerate((0, 1, 2, 3, 2, 3, 1, 2)):
            put(B, t + i * 0.25, bell(hz(arp[pi], 12), 1.6, CELESTA, t60=1.3), gain=0.05 * (1.2 if i % 2 == 0 else 0.8),
                pan=0.4 if i % 2 else -0.4, send=0.6)
    theme(B, 222.0, lambda f, d: piano(f, d + 1.5, vel=0.6), 0.17, shift=-12, send=0.55, notes=THEME2)
    for b, t, padn, root, arp in bars(230, 240):                    # 2022: noise becomes a picture
        u = (t - 230) / 8
        put(B, t, pad(padn, BAR, attack=0.1, release=0.8, cutoff=1400 + 2600 * u, detune=0.12), gain=0.22, send=0.45)
        arp16(B, t, arp, lambda f: fm(f, 0.45, 2.0, 1.4, 0.35), 0.06, shift=12, send=0.4)
        sub_pulse(B, t, root, 0.17)
        hats16(B, t, 0.045, open_=False)
        if t >= 234:
            four_floor(B, t, 0.5, 0, skip=(3,) if t == 238 else ())
    put(B, 236.0, riser(4.0, 200, 11000), gain=0.32, send=0.3)
    snare_roll(237.0, 239.8, [(238.0, 4), (239.0, 8), (239.5, 16), (239.8, 32)], 0.07, 0.32, B, 170, 260)
    put(B, 240.0, impact(1.3), gain=0.9, send=0.6)                   # 2022: the drop
    for b, t, padn, root, arp in bars(240, 258):
        four_floor(B, t, 0.64, 0.55)
        for k in (1, 3):
            put(B, t + k * BEAT, clap(), gain=0.36, send=0.2)
            put(B, t + k * BEAT, snare(dur=0.3), gain=0.12)
        hats16(B, t, 0.07)
        for i in range(8):
            put(D, t + i * 0.25, saw_bass(hz(root, 12 if i % 2 else 0), 0.21, cutoff=1100), gain=0.3)
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.16)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.8, cutoff=3500, detune=0.13), gain=0.24, send=0.4)
        arp16(B, t, arp, lambda f: pluck(f, 0.25, 4200, 0.15), 0.065, shift=24 if t >= 250 else 12, send=0.3)
    theme(B, 240.0, lambda f, d: lead(f, d, 3600), 0.2, send=0.35)
    theme(B, 240.0, lambda f, d: bell(f, d + 1.0, CELESTA, t60=1.2), 0.07, shift=12, send=0.4, pan=0.3)
    theme(B, 250.0, lambda f, d: lead(f, d, 3800), 0.16, send=0.35, notes=THEME2)
    put(B, 256.6, rev_cymbal(1.4), gain=0.24)
    for b, t, padn, root, arp in bars(258, 266):                    # 2024: honours
        put(B, t, choir(padn, BAR, attack=0.15, release=1.4), gain=0.26, send=0.6)
        put(B, t, pad(padn, BAR, attack=0.05, release=1.2, cutoff=2600, detune=0.1), gain=0.2, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.2)
        put(B, t, kick(tone=48, decay=6), gain=0.52, send=0.05)
        put(B, t + 1.0, snare(dur=0.4), gain=0.3, send=0.45)
        hats8(B, t, 0.04)
        for i, pi in enumerate((0, 1, 2, 3)):
            put(B, t + i * BEAT, bell(hz(arp[pi], 12), 2.0, CELESTA, t60=1.6), gain=0.08, pan=-0.3 + 0.2 * i, send=0.6)
    for b, t, padn, root, arp in bars(266, 278):                    # 2025: reasoning, then agents at work
        four_floor(B, t, 0.6, 0.5, skip=(3,) if t == 276 else ())
        hats16(B, t, 0.06, open_=t < 276)
        for i in range(8):
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.19)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.7, cutoff=3000), gain=0.22, send=0.45)
        arp16(B, t, arp, lambda f: fm(f, 0.4, 2.0, 1.8, 0.35), 0.075, shift=12, send=0.35)
        put(B, t + 1.0, clap(), gain=0.3, send=0.25)
    put(B, 274.0, riser(4.0, 250, 9000), gain=0.3, send=0.3)
    snare_roll(276.0, 278.0, [(277.0, 8), (277.5, 16), (278.0, 32)], 0.08, 0.3, B)


def sec_finale():
    put(B, 277.6, whoosh(2.4, 200, 6000), gain=0.32, send=0.3)
    put(B, 278.0, pad(CH['Asus'][0], 2.0, attack=0.05, release=0.4, cutoff=2600), gain=0.24, send=0.5)
    put(B, 280.0, pad(CH['A'][0], 2.0, attack=0.05, release=0.4, cutoff=3200), gain=0.26, send=0.5)
    put(B, 278.0, sub_bass(hz('A1'), 3.95), gain=0.2)
    put(B, 278.0, riser(4.0, 300, 10000), gain=0.26, send=0.3)
    t = 278.0
    while t < 282.0:
        u = (t - 278) / 4
        put(B, t, tom(80 + 60 * u, 6, 0.5), gain=0.16 + 0.22 * u, send=0.3)
        t += 0.5 if u < 0.5 else 0.25 if u < 0.8 else 0.125
    for b, tb, padn, root, arp in bars(282, 294):
        name = CHART[b]
        put(B, tb, choir(padn, BAR, attack=0.05 if tb == 282 else 0.3, release=1.6), gain=0.28, send=0.7)
        put(B, tb, pad(padn + ['A4'], BAR, attack=0.05, release=1.4, cutoff=2600, detune=0.1), gain=0.2, send=0.6)
        put(B, tb, sub_bass(hz(root), BAR - 0.05), gain=0.22)
        put(B, tb, filt(tom(56, 3.0, 1.2), 40, 'high'), gain=0.36, send=0.5)
        if name != 'A':
            for i, pi in enumerate((0, 1, 2, 3, 2, 1, 2, 3)):
                put(B, tb + i * 0.25, bell(hz(arp[pi], 12), 1.4, CELESTA, t60=1.0), gain=0.04, pan=0.35 if i % 2 else -0.35, send=0.6)
    theme(B, 282.0, lambda f, d: piano(f, d + 1.4, vel=0.75), 0.28, send=0.6, pan=0.1)
    theme(B, 282.0, lambda f, d: lead(f, d, 2400), 0.07, shift=-12, send=0.5)
    put(B, 290.0, piano(hz('Bb4'), 2.5, vel=0.6), gain=0.22, send=0.6)
    put(B, 292.0, piano(hz('A4'), 2.5, vel=0.6), gain=0.22, send=0.6)
    put(B, 293.2, rev_cymbal(1.0), gain=0.14)
    # resolution: D major under the end card
    padn = CH['D'][0]
    put(B, 294.0, choir(padn, 4.5, attack=0.4, release=2.0), gain=0.26, send=0.8)
    put(B, 294.0, pad(padn + ['A4'], 4.5, attack=0.3, release=2.0, cutoff=2400, detune=0.1), gain=0.2, send=0.7)
    put(B, 294.0, sub_bass(hz('D2'), 4.4, drive=1.1), gain=0.2)
    for t0, nm in [(294.0, 'D5'), (294.03, 'F#5'), (294.06, 'A5'), (295.0, 'D6'), (296.0, 'A5'), (297.0, 'F#5')]:
        put(B, t0, piano(hz(nm), 3.0, vel=0.6, t60=3.0), gain=0.2, pan=0.1, send=0.7)
    for t0, nm in [(294.5, 'A6'), (295.5, 'F#6'), (296.5, 'D6'), (297.5, 'A5')]:
        put(B, t0, bell(hz(nm), 2.5, CELESTA, t60=2.0), gain=0.06, pan=0.3, send=0.8)


# ------------------------------------------------------------------ sound effects
def sfx_bank(e):
    ty, v, f = e['type'], e.get('v', 1.0), e.get('f', 1.0)
    dur = e.get('dur', 1.0)
    n = lambda s: int(s * SR)
    tt = lambda s: np.arange(n(s)) / SR
    if ty == 'type':
        t = tt(0.09)
        y = filt(noise(len(t)), 2500, 'high') * np.exp(-t * 480) * 0.8 + np.sin(TAU * 150 * t) * np.exp(-t * 60) * 0.6 \
            + np.sin(TAU * 3300 * t) * np.exp(-t * 130) * 0.12
        return y * v, 0.55, 0.25, 0.12
    if ty == 'tele':
        t = tt(0.05)
        y = filt(noise(len(t)), (1500, 6000)) * np.exp(-t * 600) + np.sin(TAU * 1050 * t) * np.exp(-t * 180) * 0.25
        return y * v, 0.45, 0.25, 0.1
    if ty == 'key':
        t = tt(0.07)
        y = filt(noise(len(t)), (1400, 5500)) * np.exp(-t * 420) + np.sin(TAU * 95 * t) * np.exp(-t * 90) * 0.4
        return y * v, 0.34, 0.2, 0.1
    if ty == 'tick':
        return clock_tick(True) * v, 0.45, 0.25, 0.15
    if ty == 'fire':
        t = tt(0.6)
        y = np.sin(TAU * np.cumsum(520 + 560 * np.minimum(1, t / 0.06)) / SR) * np.exp(-t * 9) + bell(hz('A5'), 0.6, CELESTA, 0.9) * 0.4
        return y, 0.2, 0.3, 0.35
    if ty == 'nofire':
        t = tt(0.12)
        return np.sin(TAU * 240 * t) * np.exp(-t * 40), 0.2, 0.3, 0.1
    if ty == 'dot':
        t = tt(0.12)
        fr = [1175, 1397, 1760, 2349][int(R.integers(0, 4))]
        return np.sin(TAU * fr * t) * np.exp(-t * 45) * v, 0.34, 0.25, 0.3
    if ty == 'chime':
        y = np.zeros(n(2.2))
        for k, nm in enumerate(['A5', 'D6', 'F6']):
            b = bell(hz(nm), 2.0, CELESTA, t60=1.6)
            y[n(k * 0.07):n(k * 0.07) + len(b)] += b
        return y, 0.11, 0.2, 0.5
    if ty == 'ding':
        t = tt(1.4)
        y = (np.sin(TAU * 2350 * t) + 0.4 * np.sin(TAU * 3480 * t)) * np.exp(-t * 3.2) * np.minimum(1, t / 0.002)
        return y, 0.14, 0.3, 0.3
    if ty == 'ice':
        y = np.zeros(n(0.4))
        for _ in range(int(R.integers(6, 14))):
            i = n(R.random() * 0.25)
            k = n(0.002)
            y[i:i + k] += R.standard_normal(k) * R.random()
        t = tt(0.4)
        y = filt(y, 3000, 'high') + np.sin(TAU * R.uniform(3000, 6000) * t) * np.exp(-t * 18) * 0.15
        return y * v, 0.45, R.uniform(-0.8, 0.8), 0.3
    if ty == 'blip':
        t = tt(0.14)
        y = (np.sin(TAU * f * t) + 0.25 * np.sin(TAU * 3 * f * t)) * np.exp(-t * 32)
        return y * v, 0.28, 0.2, 0.25
    if ty == 'error':
        t = tt(0.3)
        y = filt(saw(110, len(t)) + saw(117, len(t)), 1400) * np.exp(-t * 8)
        return y * v, 0.18, 0.2, 0.15
    if ty == 'powerdown':
        t = tt(1.0)
        fr = 900 * np.exp(-t * 6) + 30
        y = np.sin(TAU * np.cumsum(fr) / SR) * np.exp(-t * 2.2) * 0.6
        y += filt(noise(len(t)), (500, 6000)) * np.exp(-t * 9) * 0.35
        k = n(0.72)
        y[k:] += tom(55, 6, 1.0 - 0.72)[:len(y) - k] * 0.7
        return y, 0.42, 0.0, 0.3
    if ty == 'clack':
        t = tt(0.12)
        fr = 850 * R.uniform(0.85, 1.15)
        y = sweep(noise(len(t)) * np.exp(-t * 90), fr, q=5) * 3 + filt(noise(len(t)), 3000, 'high') * np.exp(-t * 900) * 0.4
        return y * v, 0.42, 0.2, 0.2
    if ty == 'stone':
        t = tt(0.1)
        y = sweep(noise(len(t)) * np.exp(-t * 130), 2300 * R.uniform(0.9, 1.1), q=6) * 3 \
            + np.sin(TAU * 420 * t) * np.exp(-t * 80) * 0.4 + filt(noise(len(t)), 4000, 'high') * np.exp(-t * 1200) * 0.4
        return y * v, 0.45, 0.2, 0.2
    if ty == 'ping':
        return fm(1180 * f, 1.8, 1.4, 2.0, 1.4), 0.2, 0.2, 0.5
    if ty == 'pop':
        t = tt(0.15)
        y = np.sin(TAU * np.cumsum(260 * f + 520 * f * np.minimum(1, t / 0.035)) / SR) * np.exp(-t * 30)
        return y, 0.4, 0.2, 0.25
    if ty == 'tok':
        t = tt(0.03)
        return np.sin(TAU * 2600 * t) * np.exp(-t * 200) * v, 0.55, 0.15, 0.1
    if ty == 'swell':
        t = tt(1.6)
        u = t / 1.6
        y = sweep(noise(len(t)), 200 * 15 ** u, q=1.2) * u ** 1.5 * np.minimum(1, (1.6 - t) / 0.25)
        y += np.sin(TAU * np.cumsum(70 + 90 * u) / SR) * np.sin(np.pi * u) * 0.5
        return y, 0.7, 0.1, 0.4
    if ty == 'bell':
        return bell(587.33 * f, 3.0, TUBULAR, t60=2.4), 0.16, 0.2, 0.5
    # ---- new for the extended cut
    if ty == 'thump':      # heartbeat
        t = tt(0.4)
        y = np.sin(TAU * np.cumsum(48 + 60 * np.exp(-t * 30)) / SR) * np.exp(-t * 12)
        return filt(y, 400) * v, 0.9, 0.0, 0.2
    if ty == 'whoosh':
        return whoosh(max(0.4, min(1.4, dur + 0.2)), 300, 4500), 0.42, 0.0, 0.3
    if ty == 'whip':
        t = tt(0.45)
        u = t / 0.45
        y = sweep(noise(len(t)), 600 * 12 ** np.sin(np.pi * u), q=1.0) * np.sin(np.pi * u) ** 3
        pan = np.clip(1.2 - 2.4 * u, -1, 1)
        a = (pan + 1) * np.pi / 4
        return np.stack([y * np.cos(a), y * np.sin(a)], 1) * np.sqrt(2), 0.42, 0.0, 0.25
    if ty == 'glitch':
        y = np.zeros(n(0.6))
        for _ in range(9):
            i, L = n(R.random() * 0.5), n(0.02 + R.random() * 0.05)
            t = np.arange(L) / SR
            y[i:i + L] += np.sign(np.sin(TAU * R.uniform(120, 2400) * t)) * R.uniform(0.3, 1.0)
        hold = 6
        y = np.repeat(y[::hold], hold)[:len(y)]
        return filt(y, 7000) * 0.6, 0.26, R.uniform(-0.5, 0.5), 0.15
    if ty == 'bitcrush':
        t = tt(0.7)
        u = t / 0.7
        y = sweep(noise(len(t)), 300 + 5000 * np.sin(np.pi * u), q=2) * np.sin(np.pi * u) ** 2
        hold = 24
        y = np.repeat(y[::hold], hold)[:len(y)]
        return y, 0.3, 0.0, 0.2
    if ty == 'shimmer':
        d = max(0.6, min(2.0, dur))
        t = tt(d + 1.2)
        env = np.minimum(1, t / d) ** 2 * np.exp(-np.maximum(0, t - d) * 3)
        y = sum(np.sin(TAU * hz(nm) * t + R.random() * 6) * (0.6 + 0.4 * np.sin(TAU * (5 + k) * t)) for k, nm in enumerate(['A6', 'D7', 'E7', 'F7']))
        return y * env * 0.4, 0.4, R.uniform(-0.4, 0.4), 0.7
    if ty == 'swoosh':
        y = np.concatenate([rev_cymbal(0.3), np.zeros(n(0.4))])
        y[n(0.3):n(0.3) + n(0.4)] += filt(noise(n(0.4)), 300) * np.exp(-np.arange(n(0.4)) / SR * 12) * 0.8
        return y, 0.34, 0.0, 0.35
    if ty == 'glass':
        y = np.zeros(n(1.2))
        for _ in range(60):
            i, L = n(R.random() ** 2 * 0.9), n(0.004 + R.random() * 0.03)
            t = np.arange(L) / SR
            y[i:i + L] += filt(noise(L), (3000, 12000)) * np.exp(-t * 120) * R.uniform(0.2, 1)
        for _ in range(12):
            i = n(0.05 + R.random() * 0.9)
            t = np.arange(n(0.3)) / SR
            y[i:i + len(t)] += np.sin(TAU * R.uniform(3000, 7000) * t)[:len(y) - i] * np.exp(-t * 20)[:len(y) - i] * 0.2
        y[:n(0.2)] += filt(noise(n(0.2)), 1500, 'high') * np.exp(-np.arange(n(0.2)) / SR * 25)
        return y, 0.3, 0.0, 0.4
    if ty in ('stamp', 'stampNo'):
        t = tt(0.4)
        y = np.sin(TAU * np.cumsum(110 + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 14) + filt(noise(len(t)), (400, 3500)) * np.exp(-t * 60) * 0.8
        if ty == 'stampNo':
            k = n(0.18)
            y[:k] += filt(saw(98, k) + saw(104, k), 1600) * 0.3
        return y * v, 0.5, 0.1, 0.2
    if ty == 'spin':
        t = tt(1.1)
        u = t / 1.1
        y = sweep(noise(len(t)), 500 + 3000 * u, q=1.2) * (0.5 + 0.5 * np.sin(TAU * (6 + 14 * u) * t)) * np.sin(np.pi * u) ** 0.7
        return y, 0.35, 0.0, 0.25
    if ty == 'crack':
        t = tt(1.4)
        y = filt(noise(len(t)), 1200, 'high') * np.exp(-t * 40) * 1.2
        y += sweep(noise(len(t)), 900 * np.exp(-t * 1.2) + 150, q=4) * np.exp(-t * 2.5) * 0.8
        return y, 0.4, 0.0, 0.4
    if ty == 'scribble':
        t = tt(0.3)
        am = np.abs(np.sin(TAU * 11 * t + R.random() * 3)) ** 2
        return filt(noise(len(t)), (2000, 7000)) * am * np.minimum(1, t / 0.02) * v, 0.2, 0.15, 0.1
    if ty == 'alarm':
        t = tt(1.2)
        fr = np.where((t * 4).astype(int) % 2 == 0, 880, 660)
        y = np.sign(np.sin(TAU * np.cumsum(fr) / SR)) * 0.5 * np.minimum(1, (1.2 - t) / 0.2)
        return filt(y, 3000), 0.1, 0.3, 0.3
    if ty == 'coin':
        t = tt(0.35)
        y = (np.sin(TAU * 1975 * t) + 0.6 * np.sin(TAU * 2637 * t) * (t > 0.06)) * np.exp(-t * 12)
        return y * v, 0.14, R.uniform(-0.4, 0.4), 0.3
    if ty == 'flip':
        t = tt(0.07)
        y = filt(noise(len(t)), (800, 5000)) * np.exp(-t * 90) + np.sin(TAU * 500 * t) * np.exp(-t * 60) * 0.3
        return y * v, 0.3, R.uniform(-0.3, 0.3), 0.15
    if ty == 'buzz':
        t = tt(0.6)
        y = (np.sin(TAU * 988 * t) + np.sin(TAU * 1319 * t) * (t > 0.12)) * np.exp(-t * 5)
        return y, 0.16, 0.0, 0.3
    if ty == 'impactS':
        return impact(0.6, 1.8) * v, 0.35, 0.0, 0.4
    if ty == 'denoise':
        d = max(1.0, dur)
        t = tt(d + 1.0)
        u = np.clip(t / d, 0, 1)
        nz = sweep(noise(len(t)), 7000 - 5000 * u, q=1.5) * (1 - u) ** 1.5
        tone = sum(np.sin(TAU * hz(nm) * t) for nm in ['D5', 'F5', 'A5', 'D6']) * u ** 2 * np.exp(-np.maximum(0, t - d) * 3)
        return nz * 0.6 + tone * 0.12, 0.2, 0.0, 0.5
    if ty == 'check':
        t = tt(0.3)
        y = np.sin(TAU * 1319 * t) * (t < 0.08) * np.exp(-t * 20) + np.sin(TAU * 1760 * t) * (t >= 0.08) * np.exp(-(t - 0.08) * 16)
        return y * v, 0.2, 0.2, 0.3
    return None


def place_sfx(events):
    for e in events:
        if e['type'] == 'hit':               # big hits belong to the score: hall reverb, sub drop
            v = e.get('v', 1.0)
            put(M(e['t']), e['t'], impact(min(1.3, 0.55 + 0.6 * v)), gain=0.75, send=0.55)
            put(M(e['t']), e['t'], sub_bass(hz('D1'), 0.9, drive=2.0), gain=0.25 * v)
            continue
        r = sfx_bank(e)
        if r is None:
            print('unknown sfx', e)
            continue
        y, gain, pan, send = r
        put(S, e['t'], y, gain=gain, pan=pan, send=send)


# ------------------------------------------------------------------ render
def main():
    events = json.loads((ROOT / 'audio_events.json').read_text())
    for fn in (sec_intro, sec_act1, sec_act2, sec_act3, sec_act4, sec_finale):
        fn()
    for t0 in (14.0, 68.0, 148.0, 208.0):
        act_card(t0)
    place_sfx(events)
    hall, room = make_ir(2.8, 3.6, seed=1), make_ir(1.1, 1.6, predelay=0.012, damp=6000, seed=2)
    musA = A.dry + reverb(A.send, hall)
    tape_stop(musA, CRASH, CRASH + 0.8)
    musB = B.dry + D.dry * DUCK[:, None] + reverb(B.send + D.send * DUCK[:, None], hall)
    del A.dry, A.send, B.dry, B.send, D.dry, D.send
    sfx = S.dry + reverb(S.send, room)
    music = musA + musB
    del musA, musB
    mix = (music + sfx)[:N].astype(np.float64)
    import os
    if os.environ.get('AIH_STEMS'):
        np.save(ROOT / 'build' / 'stem_music.npy', music[:N].astype(np.float32))
        np.save(ROOT / 'build' / 'stem_sfx.npy', sfx[:N].astype(np.float32))
    mix = filt(mix, 28, 'high')
    for k, x in {'music': music[:N], 'sfx': sfx[:N]}.items():
        print(f'{k:6s} rms {20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-12):6.1f} dBFS  peak {20 * np.log10(np.max(np.abs(x)) + 1e-12):5.1f} dBFS')
    del music, sfx
    # loudness: -14 LUFS, peaks under -1.5 dBFS
    g = 10 ** ((-14.0 - lufs(mix)) / 20)
    mix = limiter(mix * g, ceiling=10 ** (-1.5 / 20))
    fade = np.ones(N)
    fade[-int(2.0 * SR):] = (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, int(2.0 * SR)))) ** 1.5
    mix *= fade[:, None]
    print(f'master: {lufs(mix):.1f} LUFS, peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS')
    pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
    import wave
    with wave.open(str(ROOT / 'soundtrack.wav'), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote soundtrack.wav', f'{len(pcm) / SR:.2f} s')


if __name__ == '__main__':
    main()
