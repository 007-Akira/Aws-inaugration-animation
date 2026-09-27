# AWS Student Builder Group TKMCE — inauguration experience

A local, interactive cinematic web application built with **Vite, vanilla JavaScript, GSAP and Three.js**. A gold activation circle opens photographic theatre curtains; the camera enters a procedural technology universe, accelerates through it, and reveals **AWS / STUDENT BUILDER GROUP / TKMCE** in a living purple galaxy.

This README describes the current implementation and provides handoff context for collaborators and LLM coding assistants. It replaces the earlier chronological implementation notes.

## Install and run

See [REQUIREMENTS.md](REQUIREMENTS.md) for prerequisites and troubleshooting. Use **Node.js 22.12 or newer**, with npm. No API keys, `.env` file, backend, database or Python environment are required.

```sh
git clone --branch feat/cinematic-tunnel https://github.com/007-Akira/Aws-inaugration-animation.git
cd Aws-inaugration-animation
npm ci
npm run dev
```

Open **http://localhost:5173**. Use the URL printed by Vite if that port is occupied. Keep the terminal running.

For an existing clone, commit or stash your own work before switching branches:

```sh
git fetch origin
git switch feat/cinematic-tunnel
git pull --ff-only
npm ci
```

With nvm on macOS/Linux, run `nvm install` and `nvm use` before `npm ci`; `.nvmrc` selects the Node 22 release line. Other installations can use a compatible Node version directly. `npm ci` installs the exact dependency tree from `package-lock.json`; use `npm install` only when intentionally changing dependencies, and commit the updated lockfile.

## Build and present

```sh
npm run build
npm run preview
```

Open **http://localhost:4173/?presentation=true**, wait for **CLICK TO INAUGURATE**, press **F**, then click the gold circle. Preview serves the last build: rerun `npm run build` after source changes. Do not open `index.html` or `dist/index.html` through `file://`.

Presentation mode disables debug UI, context menus, text selection, image dragging and scrolling keys. The cursor hides during playback; **R** resets the experience and restores it. The final galaxy stays animated until reset. Reduced-motion mode shows a settled, stationary finale.

For another computer, install dependencies and build before the event. Alternatively, transfer `dist/` and serve it with a local HTTP static server. Initial dependency/browser installation may require internet; the finished experience makes no runtime requests to external services. All fonts, audio, images and JavaScript are local. There are no CDN dependencies.

The composition is authored at **1920×1080**. Its shared stage scales proportionally with **cover** behavior: 16:9 screens fill exactly; other aspect ratios crop the extreme edges. Resize, orientation, fullscreen and display pixel-ratio changes update the shared coordinate space. The renderer caps device pixel ratio at 2 and its drawing buffer at 3840×2160; Act II postprocessing caps at 1920×1080.

## Controls and inspection

| Control | Behavior |
| --- | --- |
| Gold circle below the label | Starts one full sequence; repeated starts are ignored |
| F / browser Escape | Enter / exit fullscreen |
| R | Reset curtains, camera, audio, final reveal, debug defaults and cursor |
| D | Toggle debug UI; unavailable in presentation mode |
| Space with debug visible | Start, or replay a paused inspection from the beginning |
| 1–5 with debug visible | Inspect closed, 25%, 50%, 75%, fully open curtains |
| Act II debug buttons | Inspect camera entry, void bridge, flythrough, climax and final cue |
| Final frame · animated | Preview the animated finale |

Direct finale preview: **http://localhost:5173/?final=true**, or **http://localhost:4173/?final=true&presentation=true** for a build. Inspections are silent and do not dispatch the normal final-reveal event. Debug tuning survives checkpoint changes; R restores authored defaults.

## Current visual direction

- **Theatre:** approved crimson photographic velvet, fixed proscenium and overhead swags. Gold activation label and circle with gold hover/focus glow. The circle is the click target.
- **Curtain motion:** 18 fabric pleats per side, anchored outside edges, delayed folds, physical compression, a small overshoot and rebound. Preserve the approved appearance and choreography.
- **Entrance:** stars, a central violet destination glow and the first connected graph emerge while the curtains open. The same scene continues through camera entry; there is no intentional black cut here.
- **Universe:** graphite metal, smoked glass, restrained violet highlights, fine graph links and shaded hardware. Avoid bulky node rings, universally neon wireframes or cartoon-like glow.
- **Light tunnel:** four translucent violet/magenta ribbons flow around the flight corridor, echoing the finale's light rivers. They have soft edges, fine moving strands and gentle spiral motion. Stars show through them. The previous rigid arc/rail tunnel is superseded.
- **Finale:** fully procedural purple ribbons, stars, a warm central flare and sparks, with live SVG typography using local Syncopate. The reference PNG is art direction, not a shipped background texture.

The universe contains nine detailed heroes, 40 instanced midground archetypes, 320 instanced secondary structures, 6,800 far/mid-depth stars and 1,800 entrance stars. Up to 3,200 near particles supply points and motion streaks. The brighter entrance layer fills the opening view while leaving room around the destination glow.

The first hero is a connected graph. Six curated close passes follow: compute core, database reactor, network, vault, code/API panel and serverless core. Cloud and neural structures add depth. Objects stay in seeded/authored world positions; forward camera travel creates parallax. A 125-unit distance limit switches detailed heroes to cheaper distant proxies. The tunnel surrounds the camera route. Close-pass object positions stay authored; the camera gently steers away from their sides, with small vertical adjustments and restrained banking. Sound cues are recalculated from this same curved route.

## Sequence and timing

Times below are seconds from the inauguration click, at authored defaults. Configuration files are authoritative if these values change.

| Time | Event |
| --- | --- |
| 0.00 | Activation sound begins; interaction locks |
| ~0.20 | Curtain resistance/movement begins; seam light peaks around 0.21 |
| 0.70 onward | The destination and technology environment progressively emerge behind the opening fabric |
| 3.60 | Curtains settle; camera entry starts |
| 5.30 | Enlarged theatre wrapper is hidden; the persistent universe remains visible |
| 5.65 | Main 10.6-second flythrough starts |
| 15.40 | Convergence starts |
| 16.25 | Visual energy burst starts |
| 16.47 | Black hold starts |
| 16.87 or later | `FINAL_REVEAL_START`; purple finale begins after at least 400 ms of visible black |
| ~21.77 | Final title has settled; background continues animating |

`darknessDuration` and `VOID_BRIDGE` are historical names for the last 350 ms of camera entry. **They do not mean the screen should go black.** Stars, the light tunnel and technology remain in the same scene throughout the handoff.

The master timeline is sampled from elapsed wall-clock time so slow frames do not stretch the whole sequence. A separate guard preserves the minimum visible black hold. Forward camera velocity joins smoothly into the flythrough, rising from 25 to 200 world units/second. A deterministic lateral route anticipates each enabled close-pass hero; lateral displacement is bounded to 3.5 units horizontally and 1.2 vertically at default tuning. Heading is capped around 3.7 degrees, pitch around 2 degrees, and bank around 1 degree. The route returns smoothly to the center before convergence. During the last 40% of travel, orange energy increases toward the burst; the light tunnel fades during convergence.

## Audio: implemented versus proposed

Only these two local sounds are currently installed and wired into playback:

| File in `public/assets/audio/` | Role |
| --- | --- |
| `mixkit-mouse-click-close-1113.wav` | Inauguration click, started from the user gesture at volume 0.55 |
| `mixkit-air-woosh-1489.wav` | Six curated fly-bys, decoded once and played as independent overlapping voices |

Fly-by cues begin roughly 0.7 seconds before closest approach, compensate for playback rates of 0.94–1.06, pan toward the passing object and use restrained gain/overlap compensation. Debug previews are silent; reset stops all voices. Whooshes fade out before the burst.

**Background music, burst impact and final-reveal music are not implemented.** The discussed direction is a rising bed under acceleration, one impact aligned to the burst, approximately 400 ms of near-silence, then spacious uplifting ambient music beneath the purple reveal. No tracks have been selected for those roles. Earlier riser/impact/arcade-click filenames from conversation history are not current dependencies. Add future approved audio locally through the asset manifest and sequence lifecycle; do not introduce streaming URLs or autoplay before interaction.

## Code map

| Location | Responsibility |
| --- | --- |
| `index.html`, `src/styles.css` | Stage markup, curtain composition, gold trigger, layer order and debug UI |
| `src/main.js` | Readiness, lifecycle, start lock, reset, audio ownership and debug inspection |
| `src/core/stage.js` | Shared 1920×1080 cover transform, viewport events and pixel-ratio limits |
| `src/core/state.js`, `controls.js`, `debug.js` | State transitions, keyboard/pointer controls and telemetry |
| `src/core/assetLoader.js`, `src/config/assets.js` | Critical local assets, preload, timeout and errors |
| `src/core/cameraPath.js` | Shared deterministic avoidance path used by camera rendering and fly-by cue planning |
| `src/core/flybyAudio.js` | Polyphonic whooshes, approach timing, panning and reset |
| `src/animation/curtain.js`, `atmosphere.js` | Approved pleat choreography and theatre dust |
| `src/animation/timeline.js` | Curtain → entry → flythrough → burst → guarded black hold |
| `src/animation/effects.js` | Renderer ownership, shader preparation and scene rendering |
| `src/scene/universe.js` | Camera path, lights, object visibility, tunnel and convergence |
| `src/scene/objects.js`, `objects/`, `details.js` | Procedural heroes, shared materials, local animation and resource disposal |
| `src/scene/population.js` | Seeded instanced midground/secondary objects and hero proxies |
| `src/scene/starField.js`, `particles.js` | Distant/entrance stars and near GPU points/streaks |
| `src/scene/flightTunnel.js` | Current flowing light-ribbon tunnel, one shared mesh/material |
| `src/scene/postprocessing.js` | Act II RenderPass → bloom → OutputPass → FXAA |
| `src/animation/final.js` | Final reveal timeline, event dispatch and persistent render loop |
| `src/scene/finalScene.js`, `finalTitle.js` | Approved procedural galaxy and live SVG title |
| `src/config/timing.js` | Curtain motion and lighting timings |
| `src/config/actTwo.js` | Universe layout, timing, camera integration and debug defaults |
| `src/config/identity.js`, `final.js` | Shared palette/entry treatment and final reveal settings |

`src/scene/entryCorridor.js` is the superseded guide-line implementation, not the active tunnel. `src/core/video.js` and commented video entries in the manifest are reserved infrastructure; the experience does not require an MP4. Trace imports from `src/main.js` rather than assuming every legacy module is active.

Local assets are in `public/assets/`: curtain imagery, Cinzel and Syncopate fonts with bundled licenses, and the two audio files. The curtain reference is only 512×288; its inherent softness is not a renderer-resolution bug. Retain the font license files when sharing the project.

## Rendering and lifecycle constraints

- All major layers share the same stage coordinates. Keep debug controls outside the scaled stage; decorative layers must not intercept clicks.
- The universe canvas exists behind the theatre before the click. Finish critical asset I/O before expensive graphics warm-up; enable interaction only after scene/audio/finale preparation succeeds.
- Use shared geometry/materials, instancing and shader motion. The tunnel uses one draw call with no per-frame geometry allocation. Local hero animation belongs inside a container so it cannot overwrite flight transforms.
- Act II uses a locally generated reflection environment and ACES exposure 0.9. Bloom defaults: strength 0.3, radius 0.5, threshold 1.15. The finale bypasses this processing chain and retains its own color treatment.
- Keep HDR targets single-sampled and apply FXAA after output conversion. The earlier multisampled HDR path was removed while addressing GPU-dependent black frames. Clamp fractional-power shader inputs: invalid particle values can contaminate bloom.
- R must cancel pending timers, render loops, audio voices and reveal callbacks. Reuse allocated scene resources on replay; dispose geometry, materials, textures and render targets on teardown.
- `FINAL_REVEAL_START` fires once per completed run. `TKMCE_IMPACT` fires when the final word resolves, with the existing `FINAL_TITLE_IMPACT` alias retained. Checkpoints must not dispatch production reveal events.

## Validation

Install the test browser once after `npm ci`:

```sh
npx playwright install chromium
npm test
npm run build
```

On Linux, if Playwright reports missing system libraries, use `npx playwright install --with-deps chromium` (may require administrator privileges). Browser download is for tests, not for running the app in your installed browser.

Targeted transition/rendering checks:

```sh
npm test -- tests/camera-path.spec.js tests/entry-render.spec.js tests/act-two.spec.js tests/identity.spec.js
```

Tests cover stage coverage/HiDPI, readiness and asset failures, curtain reset, camera continuity, actual rendered pixels during entry, one-shot final events, black-hold timing, debug population controls, six audio cues, increased close-pass clearance, smooth route endpoints, deterministic seeking and resource cleanup. Playwright serializes tests because each owns a WebGL context. Inspect both debug checkpoints and a real uninterrupted run after visual changes; DOM visibility alone cannot detect a black WebGL frame.

Before presentation, rehearse the production build fullscreen on the actual laptop/projector with hardware acceleration enabled. Headless tests do not establish sustained 60 FPS on that device. The debug overlay reports FPS and draw calls; existing checks allow fewer than 200 draws at checkpoints. Vite's large-chunk warning is currently expected and non-blocking. Generated `dist/`, `artifacts/`, browser reports and `node_modules/` are ignored by Git.

## Collaborator / LLM handoff

Paste this README into your coding assistant, or use this starting instruction with repository access:

> Read README.md and REQUIREMENTS.md, then inspect package.json and the active modules listed in the code map. Summarize the current implementation before changing it. Treat my new request as the task; do not implement historical suggestions simply because they appear in notes. Preserve the approved curtain choreography, responsive cover stage, gold trigger, procedural finale and live typography unless I explicitly ask to change them. Keep the first hero a graph, maintain camera continuity and the existing close-pass audio timing, and keep runtime assets local. Make scoped changes, test the affected behavior and run npm run build. Report what changed, checks performed and remaining limitations. Do not infer that the proposed BGM has already been added.

For implementation decisions, inspect the current source and latest user request first. This document is a handoff snapshot, not a substitute for checking the code. Important distinctions: Act II uses the purple light tunnel; the finale has a separate approved ribbon implementation; references are art direction rather than screenshot backgrounds; and black is intentional only after the energy burst.

### Branches and restore points

- `feat/cinematic-tunnel`: current development branch, including the flowing-ribbon direction.
- `28b2a66`: pushed pre-tunnel baseline, preserving the stars, refined models and rendering fixes.
- `88c1edc`: first pushed tunnel version, with rigid segmented ribs/rails, before the light-river revision.

Keep commits focused so individual visual experiments can be reverted. To inspect an older version without disturbing ongoing work, create a separate worktree (from the repository root):

```sh
git worktree add --detach ../aws-intro-before-tunnel 28b2a66
```

Install dependencies in that worktree separately. Do not use a hard reset to review old visuals when uncommitted work exists.
