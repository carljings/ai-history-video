#!/usr/bin/env python3
"""Render the canvas animation in index.html with headless Chrome.

  render.py sheet  T0 T1 STEP [--out f.jpg]  contact sheet of frames every STEP seconds
  render.py still  T [T ...]                  full-size PNG stills
  render.py events                            dump sound-effect cue list -> audio_events.json
  render.py frames [--fps 30] [--workers 4]   every frame as JPEG into build/
  render.py encode [--fps 30] [--out ai_history_5min.mp4]
"""
import argparse, asyncio, base64, http.server, io, json, os, socketserver, subprocess, sys, threading, time
from multiprocessing import Process
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRATCH = Path(os.environ.get("AIH_SCRATCH", ROOT / "build"))
CHROME = '/usr/bin/google-chrome'
DURATION = 300


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def log_message(self, *a):
        pass


def start_server():
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd.server_address[1]


async def open_page(pw, port):
    browser = await pw.chromium.launch(executable_path=CHROME, args=[
        '--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'])
    page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.on('pageerror', lambda e: print('PAGE ERROR:', e, file=sys.stderr))
    page.on('console', lambda m: print('console:', m.text, file=sys.stderr) if m.type in ('error', 'warning') else None)
    await page.goto(f'http://127.0.0.1:{port}/index.html')
    try:
        await page.wait_for_function('window.__ready === true || window.__initError', timeout=90000)
    except Exception:
        pass
    err = await page.evaluate('window.__initError || null')
    if err:
        raise RuntimeError(err)
    return browser, page


async def grab(page, t, kind='jpeg', q=0.95):
    url = await page.evaluate('([t, k, q]) => window.renderToDataURL(t, k, q)', [t, f'image/{kind}', q])
    return base64.b64decode(url.split(',', 1)[1])


def run_async(coro):
    return asyncio.run(coro)


async def _stills(times, outdir, kind):
    from playwright.async_api import async_playwright
    port = start_server()
    async with async_playwright() as pw:
        browser, page = await open_page(pw, port)
        paths = []
        for t in times:
            t0 = time.time()
            data = await grab(page, t, kind)
            p = outdir / f't{t:07.3f}.{"png" if kind == "png" else "jpg"}'
            p.write_bytes(data)
            paths.append((t, p, time.time() - t0))
        await browser.close()
        return paths


def cmd_sheet(a):
    from PIL import Image, ImageDraw, ImageFont
    times, t = [], a.t0
    while t <= a.t1 + 1e-9:
        times.append(round(t, 3)); t += a.step
    if a.times:
        times = a.times
    tmp = SCRATCH / 'sheet_tmp'; tmp.mkdir(parents=True, exist_ok=True)
    shots = run_async(_stills(times, tmp, 'jpeg'))
    cols = a.cols
    tw, th = a.tw, a.tw * 9 // 16
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * th), 'black')
    fnt = ImageFont.truetype(str(ROOT / 'fonts/JetBrainsMono.ttf'), 22)
    for i, (t, p, dt) in enumerate(shots):
        im = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 118, 30], fill=(0, 0, 0))
        d.text((6, 2), f'{t:6.2f}s', fill=(255, 255, 0), font=fnt)
        sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
    out = Path(a.out) if a.out else SCRATCH / f'sheet_{a.t0:g}_{a.t1:g}.jpg'
    sheet.save(out, quality=88)
    avg = sum(s[2] for s in shots) / len(shots)
    print(f'{out}  ({len(shots)} frames, {avg*1000:.0f} ms/frame)')


def cmd_still(a):
    out = SCRATCH / 'stills'; out.mkdir(parents=True, exist_ok=True)
    for t, p, dt in run_async(_stills(a.times, out, 'png')):
        print(f'{p}  ({dt*1000:.0f} ms)')


def cmd_events(a):
    from playwright.async_api import async_playwright

    async def go():
        port = start_server()
        async with async_playwright() as pw:
            browser, page = await open_page(pw, port)
            ev = await page.evaluate('window.getAudioEvents()')
            await browser.close()
            return ev
    ev = run_async(go())
    (ROOT / 'audio_events.json').write_text(json.dumps(ev, indent=0))
    print(f'{len(ev)} events -> audio_events.json')


def worker(k, n, fps, outdir, first, last):
    from playwright.async_api import async_playwright

    async def go():
        port = start_server()
        async with async_playwright() as pw:
            browser, page = await open_page(pw, port)
            t_start = time.time()
            frames = [i for i in range(first, last) if i % n == k]
            for c, i in enumerate(frames):
                p = outdir / f'{i:05d}.jpg'
                if p.exists():
                    continue
                data = await grab(page, i / fps, 'jpeg', 0.94)
                tmp = p.with_suffix('.tmp')
                tmp.write_bytes(data)
                tmp.rename(p)
                if k == 0 and c % 60 == 0:
                    el = time.time() - t_start
                    print(f'  worker0 {c}/{len(frames)}  {el:.0f}s elapsed', flush=True)
            await browser.close()
    run_async(go())


def cmd_frames(a):
    outdir = SCRATCH / f'frames{a.fps}'
    outdir.mkdir(parents=True, exist_ok=True)
    total = int(DURATION * a.fps)
    first, last = a.first, min(total, a.last or total)
    t0 = time.time()
    procs = [Process(target=worker, args=(k, a.workers, a.fps, outdir, first, last)) for k in range(a.workers)]
    for p in procs: p.start()
    for p in procs: p.join()
    missing = [i for i in range(first, last) if not (outdir / f'{i:05d}.jpg').exists()]
    print(f'rendered frames {first}-{last} in {time.time() - t0:.0f}s; missing: {len(missing)}')


def cmd_encode(a):
    frames = SCRATCH / f'frames{a.fps}'
    audio = ROOT / 'soundtrack.wav'
    out = ROOT / a.out
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-framerate', str(a.fps), '-i', str(frames / '%05d.jpg')]
    if audio.exists():
        cmd += ['-i', str(audio)]
    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-tune', 'film', '-pix_fmt', 'yuv420p',
            '-metadata', 'title=人工智能简史 · The History of AI (5-minute edition)',
            '-profile:v', 'high', '-movflags', '+faststart', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']
    if audio.exists():
        cmd += ['-c:a', 'aac', '-b:a', '256k', '-shortest']
    cmd += [str(out)]
    subprocess.run(cmd, check=True)
    print(out, f'{out.stat().st_size/1e6:.1f} MB')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest='cmd', required=True)
    s = sp.add_parser('sheet'); s.add_argument('t0', type=float); s.add_argument('t1', type=float); s.add_argument('step', type=float)
    s.add_argument('--cols', type=int, default=4); s.add_argument('--out'); s.add_argument('--times', type=float, nargs='*'); s.add_argument('--tw', type=int, default=640)
    s = sp.add_parser('still'); s.add_argument('times', type=float, nargs='+')
    sp.add_parser('events')
    s = sp.add_parser('frames'); s.add_argument('--fps', type=int, default=30); s.add_argument('--workers', type=int, default=4)
    s.add_argument('--first', type=int, default=0); s.add_argument('--last', type=int, default=0)
    s = sp.add_parser('encode'); s.add_argument('--fps', type=int, default=30); s.add_argument('--out', default='ai_history_5min.mp4'); s.add_argument('--crf', type=int, default=18)
    a = ap.parse_args()
    {'sheet': cmd_sheet, 'still': cmd_still, 'events': cmd_events, 'frames': cmd_frames, 'encode': cmd_encode}[a.cmd](a)
