#!/usr/bin/env python3
"""Original soundtrack for "The History of AI" — synthesized entirely in code.

A film-score style cue in D minor at 120 BPM (one bar = 2 s) whose sections follow the
chapters of the video, plus sound effects cued from audio_events.json (exported by the
animation, so every click, clack and blip lands on its frame).  Writes soundtrack.wav.
"""
import json
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

ROOT = Path(__file__).resolve().parent
SR = 48000
DUR = 120.0
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
        self.dry = np.zeros((N + PAD, 2))
        self.send = np.zeros((N + PAD, 2))


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
CHART = ['D5', 'D5', 'Dm', 'C',
         'Dm', 'Bb', 'F', 'C', 'Bb', 'C',
         'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'A',
         'Dm', 'Bb', 'Gm', 'A',
         'Dm', 'Bb', 'F', 'C',
         'Dm', 'Dm/C', 'Bb', 'A',
         'Dm', 'Bb', 'F', 'C',
         'Dm', 'Bb', 'Gm', 'A',
         'Dm', 'Bb', 'F', 'C',
         'Dm', 'Bb', 'A',
         'Dm', 'Bb', 'F', 'C',
         'Bb', 'F', 'C',
         'Dm', 'Bb', 'C',
         'Asus', 'Dm', 'Bb', 'D']
assert len(CHART) == 60
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

A, B, D, S = Bus(), Bus(), Bus(), Bus()      # music <54 s, music >=54 s, side-chained music, sfx
DUCK = np.ones(N + PAD)


def duck(t, depth=0.5, rel=0.16):
    i, n = int(t * SR), int(rel * 5 * SR)
    tt = np.arange(n) / SR
    g = 1 - depth * np.minimum(1, tt / 0.004) * np.exp(-tt / rel)
    j = min(len(DUCK), i + n)
    DUCK[i:j] *= g[:j - i]


def bar_info(b):
    padn, root, arp = CH[CHART[b]]
    return b * BAR, padn, root, arp


def four_floor(bus, t, gain=0.6, depth=0.5, tone=50, skip=()):
    for k in range(4):
        if k in skip:
            continue
        put(bus, t + k * BEAT, kick(tone=tone), gain=gain, send=0.03)
        duck(t + k * BEAT, depth)


def hats16(bus, t, g=0.085, open_=True):
    for i in range(16):
        put(bus, t + i * 0.125, hat(), gain=g * [1, 0.45, 0.7, 0.45][i % 4], pan=0.25)
    if open_:
        for i in range(4):
            put(bus, t + i * BEAT + 0.25, hat(True), gain=g * 0.7, pan=-0.2, send=0.1)


def arp16(bus, t, arp, inst, g, shift=0, pattern=(0, 1, 2, 3, 2, 3, 1, 2), echo=0.35, send=0.3):
    for i in range(16):
        f = hz(arp[pattern[i % len(pattern)]], shift)
        x = inst(f)
        pan = 0.35 if i % 2 else -0.35
        put(bus, t + i * 0.125, x, gain=g, pan=pan, send=send)
        if echo:
            put(bus, t + i * 0.125 + 0.375, x, gain=g * echo, pan=-pan * 1.6, send=send)


def theme(bus, t0, inst, gain, shift=0, send=0.4, pan=0.0, extra=0.0):
    for off, nm, d in THEME:
        put(bus, t0 + off * BEAT, inst(hz(nm, shift), d * BEAT + extra), gain=gain, pan=pan, send=send)


def sec_intro():
    put(A, 0.25, pad(['D2', 'A2', 'D3'], 3.75, attack=2.8, release=0.6, cutoff=650, detune=0.1, hp=40), gain=0.5, send=0.45)
    put(A, 1.0, pad(['A4', 'D5', 'E5'], 3.0, attack=2.2, release=1.2, cutoff=3200, detune=0.16), gain=0.1, send=0.9)
    put(A, 2.2, rev_cymbal(1.8), gain=0.3, send=0.3)
    put(A, 2.0, riser(2.0, 200, 3500), gain=0.22, send=0.3)
    put(A, 4.0, impact(1.0), gain=0.8, send=0.55)
    put(A, 4.0, pad(CH['Dm'][0], 2.0, attack=0.03, release=1.4, cutoff=2400), gain=0.34, send=0.55)
    put(A, 4.0, sub_bass(hz('D2'), 1.95), gain=0.42)
    for t, nm in [(4.5, 'A5'), (5.0, 'D6'), (5.5, 'F6')]:
        put(A, t, bell(hz(nm), 3.0, CELESTA, t60=2.4), gain=0.12, pan=0.25, send=0.7)
    put(A, 6.0, pad(CH['C'][0], 2.0, attack=0.25, release=1.2, cutoff=2000), gain=0.3, send=0.55)
    put(A, 6.0, sub_bass(hz('C2'), 1.95), gain=0.36)
    put(A, 6.8, whoosh(1.3, 300, 5000), gain=0.42, send=0.3)


def sec_early():
    for b in range(4, 19):
        t, padn, root, arp = bar_info(b)
        put(A, t, pad(padn, BAR, attack=0.25, release=0.9, cutoff=1500 + 500 * (b >= 10), detune=0.07), gain=0.24, send=0.45)
        for off in (0.0, 1.0):
            put(A, t + off, ks(hz(root, 12), 0.9, bright=0.35, t60=0.7), gain=0.42, send=0.2)
        for i, pi in enumerate((0, 1, 2, 3, 2, 1, 2, 3)):
            put(A, t + i * 0.25, bell(hz(arp[pi], 12), 1.2, MUSICBOX, t60=0.9), gain=0.06 * (1.15 if i % 2 == 0 else 0.8),
                pan=0.35 if i % 2 else -0.35, send=0.45)
        if b >= 10:
            put(A, t, kick(tone=48, decay=7.5, click=0.1), gain=0.34, send=0.04)
            put(A, t + 1.0, kick(tone=48, decay=7.5, click=0.1), gain=0.24)
        if b >= 13:
            for i in range(8):
                put(A, t + i * 0.25 + 0.125, shaker(), gain=0.05 if i % 2 else 0.035, pan=0.3)
            for i in range(4):
                put(A, t + i * 0.5 + 0.25, hat(), gain=0.04, pan=-0.25)
    theme(A, 20.0, lambda f, d: bell(f, d + 1.6, CELESTA, t60=1.8), 0.2, send=0.5, pan=0.1)
    theme(A, 28.0, lambda f, d: piano(f, d + 1.2, vel=0.6), 0.18, shift=-12, send=0.45, pan=-0.15)
    put(A, 18.5, rev_cymbal(1.5), gain=0.22, send=0.3)
    put(A, 20.0, impact(0.8), gain=0.55, send=0.55)


def sec_winter():
    for b in range(19, 23):
        t, padn, root, arp = bar_info(b)
        put(A, t, pad(padn, BAR, attack=0.7, release=1.6, cutoff=850, detune=0.1), gain=0.15, send=0.7)
        put(A, t, sub_bass(hz(root), BAR - 0.05, drive=1.1), gain=0.1)
    put(A, 37.4, wind(9.4), gain=0.16, send=0.25)
    for t, nm in [(38.5, 'A4'), (39.25, 'F4'), (40.0, 'D4'), (41.0, 'F4'), (42.0, 'Bb4'), (42.75, 'A4'), (43.5, 'G4'),
                  (44.25, 'E4'), (45.0, 'C#5')]:
        put(A, t, piano(hz(nm), 3.0, vel=0.5, t60=3.5), gain=0.14, pan=0.15, send=0.7)
    for k, nm in enumerate(['D6', 'A6', 'E6', 'F6']):
        n = int(7.5 * SR)
        tt = np.arange(n) / SR
        g = sine(hz(nm), n) * (0.5 + 0.5 * np.sin(TAU * (0.3 + k * 0.11) * tt)) * np.minimum(1, tt / 2) * np.minimum(1, (7.5 - tt) / 1.5)
        put(A, 38.3 + k * 0.2, g, gain=0.018, pan=-0.6 + k * 0.4, send=0.9)
    put(A, 45.2, riser(0.8, 150, 5000, tone=0.6), gain=0.3, send=0.2)


def sec_80s():
    for b in range(23, 27):
        t, padn, root, arp = bar_info(b)
        put(A, t, pad(padn, BAR, attack=0.02, release=0.5, cutoff=3300, detune=0.13), gain=0.2, send=0.35)
        for i in range(8):
            put(A, t + i * 0.25, saw_bass(hz(root, 12 if i % 2 else 0), 0.21, cutoff=950), gain=0.3)
        for k in (0, 2):
            put(A, t + k * BEAT, kick(tone=52, decay=8), gain=0.58, send=0.03)
        for k in (1, 3):
            put(A, t + k * BEAT, gated_snare(), gain=0.36)
        for i in range(8):
            put(A, t + i * 0.25, hat(), gain=0.06 if i % 2 else 0.035, pan=0.3)
        arp16(A, t, arp, lambda f: pluck(f, 0.3, 2600, 0.22), 0.07, shift=12, send=0.25)
    theme(A, 46.0, lambda f, d: lead(f, d, 2600), 0.13, shift=-12, send=0.35)


def sec_1997():
    for i in range(32):
        put(B, 54.0 + i * 0.25, clock_tick(i % 2 == 0), gain=0.1 if i % 2 == 0 else 0.07, pan=0.25)
    for b in range(27, 31):
        t, padn, root, arp = bar_info(b)
        for i in range(8):
            k = (b - 27) * 8 + i
            put(B, t + i * 0.25, string_stab(hz(root, 12 if i % 2 else 24), 0.22, cutoff=450 + 1700 * k / 32), gain=0.2, send=0.3)
        put(B, t, pad(padn, BAR, attack=0.4, release=1.0, cutoff=1100, detune=0.09), gain=0.22, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.18)
    put(B, 60.0, impact(0.7), gain=0.5, send=0.5)
    put(B, 60.0, tom(62, 3.5, 1.4), gain=0.45, send=0.4)
    put(B, 60.2, riser(1.8, 300, 8000), gain=0.3, send=0.3)
    put(B, 60.5, rev_cymbal(1.5), gain=0.26)
    snare_roll(61.0, 62.0, [(61.5, 8), (62.0, 16)], 0.08, 0.26, B)


def sec_2012():
    put(B, 62.0, impact(1.2), gain=0.85, send=0.6)
    for b in range(31, 35):
        t, padn, root, arp = bar_info(b)
        four_floor(B, t, 0.62, 0.55)
        for k in (1, 3):
            put(B, t + k * BEAT, clap(), gain=0.34, send=0.2)
        hats16(B, t, 0.065)
        for i in range(8):
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.2)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.7, cutoff=2800), gain=0.24, send=0.4)
        arp16(B, t, arp, lambda f: pluck(f, 0.25, 3800, 0.16), 0.075, shift=12, send=0.3)


def sec_2016():
    taiko = [0, 0.75, 1.5, 2.0, 3.0, 3.5]
    for b in range(35, 39):
        t, padn, root, arp = bar_info(b)
        put(B, t, choir(padn, BAR, attack=0.3, release=1.2), gain=0.46, send=0.6)
        put(B, t, pad(padn, BAR, attack=0.2, release=1.0, cutoff=2200, detune=0.1), gain=0.24, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.15)
        for k in taiko:
            if b == 36 and k >= 3:
                continue                                  # a breath before move 37
            put(B, t + k * BEAT, filt(tom(66 if k in (0, 2) else 92, 4.0, 1.0), 50, 'high'), gain=0.3 if k in (0, 2) else 0.22, send=0.35)
        if b != 36:
            for i in range(8):
                put(B, t + i * 0.25, string_stab(hz(arp[(0, 2, 1, 3)[i % 4]]), 0.2, 2400), gain=0.1, pan=0.3 if i % 2 else -0.3, send=0.35)
    put(B, 74.0, impact(1.0), gain=0.62, send=0.6)
    put(B, 73.3, rev_cymbal(0.7), gain=0.2)
    put(B, 74.0, choir(['D4', 'G4', 'Bb4', 'D5'], 2.0, attack=0.05, release=1.6, vowel='o'), gain=0.2, send=0.7)


def sec_2017():
    for b in range(39, 43):
        t, padn, root, arp = bar_info(b)
        put(B, t, pad(padn, BAR, attack=0.3, release=1.2, cutoff=2400, detune=0.12), gain=0.2, send=0.6)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.18)
        arp16(B, t, arp, lambda f: fm(f, 0.6, 3.0, 1.6, 0.5), 0.07, shift=12, pattern=(0, 2, 1, 3, 2, 0, 3, 1), send=0.45)
        put(B, t, kick(tone=48, decay=7), gain=0.46, send=0.03)
        put(B, t + 1.0, kick(tone=48, decay=7), gain=0.36)
        put(B, t + 1.5, clap(), gain=0.18, send=0.35)
        for i in range(8):
            put(B, t + i * 0.25, hat(), gain=0.045 if i % 2 else 0.028, pan=0.25)


def sec_2020():
    for b in range(43, 46):
        t, padn, root, arp = bar_info(b)
        u = (b - 43) / 2
        put(B, t, pad(padn, BAR, attack=0.05, release=0.6, cutoff=900 + 3000 * u), gain=0.24, send=0.4)
        for i in range(8):
            put(B, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.2)
        four_floor(B, t, 0.55, 0.0, skip=(3,) if b == 45 else ())
        arp16(B, t, arp, lambda f, u=u: pluck(f, 0.25, 1200 + 3500 * u, 0.16), 0.065, shift=12, send=0.3)
    snare_roll(86.0, 91.5, [(88.0, 4), (90.0, 8), (91.0, 16), (91.5, 32)], 0.07, 0.34, B, 170, 260)
    put(B, 87.0, riser(4.9, 200, 10000), gain=0.34, send=0.3)
    put(B, 90.4, rev_cymbal(1.5), gain=0.3)


def sec_2022():
    put(B, 92.0, impact(1.3), gain=0.85, send=0.6)
    for b in range(46, 50):
        t, padn, root, arp = bar_info(b)
        four_floor(B, t, 0.64, 0.55)
        for k in (1, 3):
            put(B, t + k * BEAT, clap(), gain=0.36, send=0.2)
            put(B, t + k * BEAT, snare(dur=0.3), gain=0.12)
        hats16(B, t, 0.07)
        for i in range(8):
            put(D, t + i * 0.25, saw_bass(hz(root, 12 if i % 2 else 0), 0.21, cutoff=1100), gain=0.3)
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.16)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.8, cutoff=3500, detune=0.13), gain=0.24, send=0.4)
        arp16(B, t, arp, lambda f: pluck(f, 0.25, 4200, 0.15), 0.065, shift=12, send=0.3)
    theme(B, 92.0, lambda f, d: lead(f, d, 3600), 0.2, send=0.35)
    theme(B, 92.0, lambda f, d: bell(f, d + 1.0, CELESTA, t60=1.2), 0.07, shift=12, send=0.4, pan=0.3)


def sec_2024():
    for b in range(50, 53):
        t, padn, root, arp = bar_info(b)
        put(B, t, choir(padn, BAR, attack=0.15, release=1.4), gain=0.24, send=0.6)
        put(B, t, pad(padn, BAR, attack=0.05, release=1.2, cutoff=2600, detune=0.1), gain=0.2, send=0.5)
        put(B, t, sub_bass(hz(root), BAR - 0.05), gain=0.2)
        put(B, t, kick(tone=48, decay=6), gain=0.52, send=0.05)
        put(B, t + 1.0, snare(dur=0.4), gain=0.3, send=0.45)
        for i in range(8):
            put(B, t + i * 0.25, hat(), gain=0.04 if i % 2 else 0.025, pan=0.25)
        for i, pi in enumerate((0, 1, 2, 3)):
            put(B, t + i * BEAT, bell(hz(arp[pi], 12), 2.0, CELESTA, t60=1.6), gain=0.08, pan=-0.3 + 0.2 * i, send=0.6)


def sec_2025():
    for b in range(53, 56):
        t, padn, root, arp = bar_info(b)
        four_floor(B, t, 0.6, 0.5)
        hats16(B, t, 0.06, open_=b != 55)
        for i in range(8):
            put(D, t + i * 0.25, sub_bass(hz(root), 0.2), gain=0.19)
        put(D, t, pad(padn, BAR, attack=0.02, release=0.7, cutoff=3000), gain=0.22, send=0.45)
        arp16(B, t, arp, lambda f: fm(f, 0.4, 2.0, 1.8, 0.35), 0.075, shift=12, send=0.35)
        put(B, t + 1.0, clap(), gain=0.3, send=0.25)
    put(B, 110.0, riser(2.0, 250, 9000), gain=0.32, send=0.3)
    snare_roll(111.0, 112.0, [(111.5, 8), (112.0, 16)], 0.1, 0.3, B)


def sec_finale():
    put(B, 111.6, whoosh(2.4, 200, 6000), gain=0.34, send=0.3)
    put(B, 112.0, pad(CH['Asus'][0], 1.0, attack=0.05, release=0.4, cutoff=2600), gain=0.26, send=0.5)
    put(B, 113.0, pad(CH['A'][0], 1.0, attack=0.05, release=0.4, cutoff=3200), gain=0.28, send=0.5)
    put(B, 112.0, sub_bass(hz('A1'), 1.95), gain=0.22)
    put(B, 112.0, riser(2.0, 400, 9000), gain=0.22, send=0.3)
    t = 112.0
    while t < 114.0:
        u = (t - 112) / 2
        put(B, t, tom(80 + 60 * u, 6, 0.5), gain=0.18 + 0.2 * u, send=0.3)
        t += 0.25 if u < 0.5 else 0.125
    put(B, 114.0, impact(1.3), gain=0.9, send=0.7)
    for t0, name, dur in [(114.0, 'Dm', 2.0), (116.0, 'Bb', 2.0), (118.0, 'D', 1.6)]:
        padn, root, _ = CH[name]
        rel = 1.6 if name != 'D' else 0.5
        put(B, t0, choir(padn, dur, attack=0.05 if t0 == 114 else 0.3, release=rel), gain=0.26, send=0.7)
        put(B, t0, pad(padn + ['A4'], dur, attack=0.05, release=rel, cutoff=2600, detune=0.1), gain=0.2, send=0.6)
        put(B, t0, sub_bass(hz(root), dur - 0.05), gain=0.24)
    for t0, nm in [(114.0, 'A4'), (114.5, 'D5'), (115.0, 'F5'), (116.0, 'G5'), (116.5, 'F5'), (117.0, 'D5'),
                   (118.0, 'F#5'), (118.03, 'A5'), (118.06, 'D6')]:
        put(B, t0, piano(hz(nm), 2.5, vel=0.75, t60=3.0), gain=0.3, pan=0.1, send=0.65)
    put(B, 118.5, rev_cymbal(0.8), gain=0.16)
    put(B, 119.3, bell(hz('D6'), 0.7, CELESTA, t60=1.2), gain=0.12, send=0.8)


def sec_whooshes():
    for tb in (14, 26, 32, 70, 78, 86, 100, 106):
        put(A if tb < 54 else B, tb - 0.45, whoosh(0.9, 350, 3500), gain=0.13, send=0.2)
    put(A, 37.5, whoosh(1.2, 2500, 400), gain=0.2, send=0.4)


# ------------------------------------------------------------------ sound effects
def sfx_bank(e):
    ty, v, f = e['type'], e.get('v', 1.0), e.get('f', 1.0)
    n = lambda s: int(s * SR)
    tt = lambda s: np.arange(n(s)) / SR
    if ty == 'type':
        t = tt(0.09)
        y = filt(noise(len(t)), 2500, 'high') * np.exp(-t * 480) * 0.8 + np.sin(TAU * 150 * t) * np.exp(-t * 60) * 0.6 \
            + np.sin(TAU * 3300 * t) * np.exp(-t * 130) * 0.12
        return y * v, 0.22, 0.25, 0.12
    if ty == 'tele':
        t = tt(0.05)
        y = filt(noise(len(t)), (1500, 6000)) * np.exp(-t * 600) + np.sin(TAU * 1050 * t) * np.exp(-t * 180) * 0.25
        return y * v, 0.36, 0.25, 0.1
    if ty == 'key':
        t = tt(0.07)
        y = filt(noise(len(t)), (1400, 5500)) * np.exp(-t * 420) + np.sin(TAU * 95 * t) * np.exp(-t * 90) * 0.4
        return y * v, 0.34, 0.2, 0.1
    if ty == 'tick':
        return clock_tick(True) * v, 0.18, 0.25, 0.15
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
        return y, 0.16, 0.2, 0.5
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
        return y * v, 0.22, R.uniform(-0.8, 0.8), 0.3
    if ty == 'blip':
        t = tt(0.14)
        y = (np.sin(TAU * f * t) + 0.25 * np.sin(TAU * 3 * f * t)) * np.exp(-t * 32)
        return y * v, 0.28, 0.2, 0.25
    if ty == 'error':
        t = tt(0.3)
        y = filt(saw(110, len(t)) + saw(117, len(t)), 1400) * np.exp(-t * 8)
        return y, 0.18, 0.2, 0.15
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
        return np.sin(TAU * 2600 * t) * np.exp(-t * 200) * v, 0.42, 0.15, 0.1
    if ty == 'swell':
        t = tt(1.6)
        u = t / 1.6
        y = sweep(noise(len(t)), 200 * 15 ** u, q=1.2) * u ** 1.5 * np.minimum(1, (1.6 - t) / 0.25)
        y += np.sin(TAU * np.cumsum(70 + 90 * u) / SR) * np.sin(np.pi * u) * 0.5
        return y, 0.4, 0.1, 0.4
    if ty == 'bell':
        return bell(587.33 * f, 3.0, TUBULAR, t60=2.4), 0.16, 0.2, 0.5
    return None


def place_sfx(events):
    for e in events:
        r = sfx_bank(e)
        if r is None:
            print('unknown sfx', e)
            continue
        y, gain, pan, send = r
        put(S, e['t'], y, gain=gain, pan=pan, send=send)


# ------------------------------------------------------------------ render
def main():
    events = json.loads((ROOT / 'audio_events.json').read_text())
    for fn in (sec_intro, sec_early, sec_winter, sec_80s, sec_1997, sec_2012, sec_2016, sec_2017,
               sec_2020, sec_2022, sec_2024, sec_2025, sec_finale, sec_whooshes):
        fn()
    place_sfx(events)
    hall, room = make_ir(2.8, 3.6, seed=1), make_ir(1.1, 1.6, predelay=0.012, damp=6000, seed=2)
    musA = A.dry + reverb(A.send, hall)
    tape_stop(musA, 53.1, 53.9)
    musB = B.dry + D.dry * DUCK[:, None] + reverb(B.send + D.send * DUCK[:, None], hall)
    sfx = S.dry + reverb(S.send, room)
    mix = (musA + musB + sfx)[:N]
    mix = filt(mix, 28, 'high')
    stems = {'music': (musA + musB)[:N], 'sfx': sfx[:N]}
    for k, x in stems.items():
        print(f'{k:6s} rms {20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12):6.1f} dBFS  peak {20 * np.log10(np.max(np.abs(x)) + 1e-12):5.1f} dBFS')
    # loudness: -14 LUFS, peaks under -1.5 dBFS
    g = 10 ** ((-14.0 - lufs(mix)) / 20)
    mix = limiter(mix * g, ceiling=10 ** (-1.5 / 20))
    fade = np.ones(N)
    fade[-int(1.0 * SR):] = (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, int(1.0 * SR)))) ** 1.5
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
