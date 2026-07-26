# Advanced Virtual Nuclear Physics Laboratory
### Geiger–Müller Counter Simulation

A production-quality, fully in-browser virtual physics laboratory for studying
Geiger–Müller (GM) counter behaviour and radioactivity — built with plain
HTML5, CSS3 and vanilla JavaScript (ES6). No backend, no database, no build
step, no frameworks.

![status](https://img.shields.io/badge/status-stable-4dffb0) ![license](https://img.shields.io/badge/license-MIT-blue) ![stack](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange)

---

## Features

- **Cinematic boot sequence** — animated atom loader, initialization log, and an "Initialize Laboratory" gate that starts the audio and physics engines.
- **Cyber-laboratory UI** — glassmorphism panels, phosphor/amber CRT colour themes, optional CRT scanline mode, ambient particle field.
- **Five full experiments**, each with real governing equations:
  1. GM Tube Plateau Characteristics
  2. Inverse Square Law
  3. Beta Absorption
  4. Mass Absorption Coefficient
  5. Radioactive Half-Life
- **Real detector physics** — inverse square law, exponential absorption, exponential decay, Poisson counting statistics (±√N), non-paralyzable dead-time correction, a physically modelled recombination/plateau/discharge voltage-response curve, and background/cosmic-ray counts.
- **Animated Canvas apparatus** — GM tube, source holder, absorber, radiation particles travelling from source to detector, detector flash and expanding pulse rings, all rendered at 60 FPS with `requestAnimationFrame`.
- **Digital scaler** — live Counts / CPS / CPM segment display, timer, HV, dead time, and decay clock.
- **Dynamic observation table** — unlimited rows, per-row delete, clear-all, CSV export, automatic percentage-error column.
- **Canvas graph engine** — auto-scaling axes, gridlines, error bars, best-fit regression line, zoom, PNG export.
- **AI Data Solver** — fully offline, rule-based analysis engine that reads your recorded observations and produces theory, a calculation walkthrough (via MathJax), and a data-driven conclusion for the active experiment.
- **AI Lab Assistant** — an offline chat widget that answers common laboratory questions (plateau, absorption, half-life, dead time, Poisson statistics, etc.).
- **Lab Manual** — Aim, Theory, Formulae, Procedure, Observation format, Calculation method, Result, Precautions and Viva Questions for every experiment, with MathJax-rendered equations and text-to-speech read-aloud.
- **Scientific calculator** — trig, log/ln, powers, factorial, √, π, e, memory register and history, as a draggable floating widget.
- **Settings** — theme switcher, CRT mode, audio/ambient/voice toggles, background-radiation toggle, particle colour picker, animation quality.
- **Web Audio API sound** — procedurally generated Geiger clicks, UI clicks, alarm tone and ambient hum (no audio files).
- **Speech Synthesis** — voice narration of the lab manual and AI assistant replies.
- **Exports** — CSV, PNG graphs, and a printable/PDF-able Academic Report (student name, roll number, theory, observations, conclusion, instructor signature line).

---

## Folder Structure

```
Virtual-GM-Counter/
├── index.html
├── css/
│   ├── style.css        # core layout & components
│   ├── responsive.css   # breakpoints
│   ├── animations.css   # keyframes & CRT mode
│   └── themes.css       # design tokens / colour themes
├── js/
│   ├── app.js           # boot sequence, state, event wiring, main loop
│   ├── physics.js       # detector physics engine
│   ├── ui.js             # canvas apparatus + background particles
│   ├── graph.js         # canvas graph renderer
│   ├── calculator.js    # scientific calculator widget
│   ├── manual.js        # lab manual content
│   ├── ai.js             # offline AI assistant + data solver
│   ├── export.js        # CSV / report export
│   ├── widgets.js       # floating widget system + settings panel
│   └── utils.js         # shared helpers (Poisson sampling, regression, etc.)
├── assets/
│   ├── images/
│   ├── icons/
│   ├── sounds/
│   └── fonts/
├── README.md
├── LICENSE
├── vercel.json
├── package.json
└── .gitignore
```

---

## Installation & Local Development

This is a static site with **zero build step**. Any static file server works.

```bash
# Option 1 — Node's "serve" package (used by npm scripts below)
npm install
npm run dev
# → open http://localhost:5173

# Option 2 — Python
python3 -m http.server 5173

# Option 3 — just open index.html directly in a modern browser
```

No environment variables, API keys, or backend services are required.

---

## Deployment

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

The included `vercel.json` configures the project as a static site (`@vercel/static`), so no framework detection or build command is needed. You can also just import the GitHub repository directly in the Vercel dashboard — Vercel will read `vercel.json` automatically.

### Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch, root folder.
3. Your site will be published at `https://<username>.github.io/<repo>/`.

Because all asset paths are relative (`css/...`, `js/...`), the app works from any sub-path without modification.

---

## Browser Support

| Browser | Supported |
|---|---|
| Chrome / Edge (Chromium) | ✅ Full support, including Web Audio & Speech Synthesis |
| Firefox | ✅ Full support |
| Safari (macOS/iOS) | ✅ Supported — Web Audio requires a user gesture to start, which the "Initialize Laboratory" button provides |
| Older browsers without Canvas 2D / ES6 support | ❌ Not supported |

The app uses: Canvas 2D API, CSS `backdrop-filter`, `requestAnimationFrame`, Web Audio API, and the SpeechSynthesis API (optional, gracefully degrades if unavailable).

---

## Technology

- HTML5 / CSS3 / Vanilla JavaScript (ES6 modules pattern via IIFEs)
- Canvas 2D API (apparatus rendering, graphing)
- [Tailwind CSS](https://tailwindcss.com/) (via CDN, used sparingly alongside hand-written CSS)
- [Font Awesome 6](https://fontawesome.com/) (via CDN)
- [MathJax 3](https://www.mathjax.org/) (via CDN, for rendered equations)
- No React / Vue / Angular / Bootstrap
- No backend, database, or external API calls — the "AI" features are fully offline, rule-based JavaScript

---

## Credits

Designed and built as a self-contained educational tool for undergraduate/postgraduate nuclear physics laboratory courses (e.g. GM counter experiments commonly found in B.Sc./M.Sc. Physics curricula). All radiation sources, counts and detector behaviour are **simulated** — this application involves no physical radioactive material and poses no radiation hazard.

For educational use only.
