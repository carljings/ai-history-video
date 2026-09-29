# 人工智能简史 · The History of AI (5-minute edition)

[![人工智能简史](docs/poster.jpg)](https://github.com/carljings/ai-history-5min/releases/download/v1.0/ai_history_5min.mp4)

**▶ [Watch / download the video (MP4, 1080p60, 5:00)](https://github.com/carljings/ai-history-5min/releases/download/v1.0/ai_history_5min.mp4)** · 观看 / 下载视频

Looking for the short version? See [The History of AI — in 120 seconds](https://github.com/carljings/ai-history-video).

A five-minute motion-graphics film about the history of artificial intelligence, from Ada Lovelace's first program (1843) to reasoning models and AI agents (2025). All on-screen text is bilingual, with Chinese first: every chapter has a Chinese title, an English title and a short Chinese explanation of what happened and why it mattered.

一部五分钟的人工智能发展史动画：从 1843 年洛芙莱斯写下第一个程序，到 2025 年会推理的模型和智能体。每一章都配有中文标题、英文标题和中文解说。

Everything is generated from code. Every frame is drawn on an HTML canvas, and the score and sound effects are synthesized in Python.

![Preview frames](docs/preview.jpg)

## Chapters · 章节

| Time | Year | 章节 | Chapter |
|---|---|---|---|
| 0:00 | | 片头 | Intro |
| 0:14 | | 第一幕 · 梦想 | Act I · The Dream |
| 0:18 | 1843 | 第一个计算机程序 | Ada Lovelace's program for the Analytical Engine |
| 0:28 | 1936 | 万能的图灵机 | Turing's universal machine |
| 0:38 | 1943 | 第一个人工神经元 | McCulloch & Pitts neuron |
| 0:48 | 1950 | “机器能思考吗？” | Turing's question and the Imitation Game |
| 0:58 | 1956 | 人工智能正式诞生 | The Dartmouth workshop |
| 1:08 | | 第二幕 · 起落 | Act II · Boom & Bust |
| 1:12 | 1958 | 感知机 | Rosenblatt's perceptron |
| 1:22 | 1966 | 第一个聊天机器人 | ELIZA |
| 1:32 | 1969 | 感知机的极限 | The XOR problem |
| 1:40 | 1974 | 第一次 AI 寒冬 | The first AI winter |
| 1:50 | 1980 | 专家系统热潮 | The expert-system boom |
| 1:58 | 1986 | 反向传播 | Backpropagation |
| 2:08 | 1989 | 机器学会“看” | LeNet reads handwritten zip codes |
| 2:18 | 1997 | 深蓝击败卡斯帕罗夫 | Deep Blue beats Kasparov |
| 2:28 | | 第三幕 · 深度学习 | Act III · Deep Learning |
| 2:32 | 2009 | ImageNet 数据集 | ImageNet |
| 2:40 | 2011 | 沃森赢得智力竞赛 | Watson wins Jeopardy! |
| 2:48 | 2012 | 深度学习崛起 | AlexNet |
| 2:58 | 2014 | 机器学会想象 | Generative adversarial networks |
| 3:08 | 2016 | AlphaGo 的第 37 手 | AlphaGo's Move 37 |
| 3:18 | 2017 | 注意力就是一切 | The Transformer |
| 3:28 | | 第四幕 · 生成时代 | Act IV · The Generative Age |
| 3:32 | 2020 | 大就是不一样 | GPT-3 and scale |
| 3:40 | 2021 | 破解蛋白质折叠 | AlphaFold |
| 3:50 | 2022 | 文字变成图画 | Diffusion image generators |
| 4:00 | 2022 | AI 走进千家万户 | ChatGPT |
| 4:10 | 2023 | 能看、能听、能说 | Multimodal models |
| 4:18 | 2024 | 诺贝尔奖献给 AI | Nobel Prizes for AI research |
| 4:26 | 2025 | 会推理的机器 | Reasoning models and agents |
| 4:38 | | 尾声 | Finale |

## How it's made

| File | What it does |
|---|---|
| `index.html`, `js/core.js` | The timeline (every chapter's Chinese and English text), palette, background, “neural dust” network, and the bilingual on-screen text: year counter, titles, explanations and timeline. |
| `js/fx.js` | Camera moves and scene transitions (zoom-through, whip pan, glitch, pixelate, iris, flash, shatter, CRT collapse), plus the post-processing: bloom, lens chromatic aberration, impact shake, light leaks, letterbox, grain. |
| `js/scenes1.js` … `scenes4.js` | One animated visual per chapter, four acts. Each frame is a pure function of time, so frames can be rendered in any order. |
| `js/main.js` | Composites the background, scene layers, transitions, on-screen text and post effects for each frame. |
| `render.py` | Drives headless Chrome to render every frame in parallel, exports the sound-effect cue list, and encodes the MP4 with ffmpeg. |
| `music.py` | Synthesizes the original score (D minor, 120 BPM, 150 bars, one section per chapter) plus more than 40 kinds of sound effects timed from `audio_events.json`, then masters to −14 LUFS. |

## Rebuild the video

Requires Python 3.12, ffmpeg, Google Chrome at `/usr/bin/google-chrome`, and the Noto CJK fonts (`fonts-noto-cjk`, which provides Noto Sans CJK SC and Noto Serif CJK SC).

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python render.py events                        # sound-effect cues -> audio_events.json
.venv/bin/python music.py                                # soundtrack -> soundtrack.wav
.venv/bin/python render.py frames --fps 60 --workers 4   # 18,000 frames -> build/frames60/
.venv/bin/python render.py encode --fps 60               # -> ai_history_5min.mp4
```

For a quick look at any moment, `render.py sheet 0 300 10` renders a contact sheet of frames every 10 seconds. To preview live in a browser (visuals only), run `python3 -m http.server` in this folder and open `http://localhost:8000/?play` (add `&t=120` to start at 2:00).

## Credits

Fonts: Space Grotesk, Inter, Playfair Display, JetBrains Mono and VT323 (SIL Open Font License) and Special Elite (Apache License 2.0), from Google Fonts, with their licenses in `fonts/`. Chinese text uses the system Noto Sans CJK SC and Noto Serif CJK SC fonts (SIL Open Font License).
