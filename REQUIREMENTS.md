# Installation requirements

This is a JavaScript/npm project. **`package.json` is the dependency manifest and `package-lock.json` is the reproducible installation lockfile.** This file documents system requirements; it is not a pip requirements file.

## Required to develop or build

| Requirement | Details |
| --- | --- |
| Node.js | 22.12.0 or newer, as declared in `package.json`. `.nvmrc` selects the Node 22 release line for nvm users. |
| npm | Use npm bundled with your compatible Node installation. The repository uses npm lockfile version 3. |
| Git | Needed to clone, update branches and collaborate; unnecessary if a complete source archive is supplied. |
| Browser | A desktop browser with WebGL2, hardware acceleration, Web Audio and fullscreen support. Rehearse in Chrome/Chromium. |
| Internet for first setup | Usually needed for npm packages and the optional Playwright browser download. Playback is local after setup. |

No Python, pip, Docker, global Vite installation, backend service, database, API credentials or `.env` file is required.

## Project dependencies

Install all of these together with `npm ci`; do not manually install each package or choose separate versions. Version ranges below are declared in `package.json`; exact installed versions and transitive dependencies are pinned by `package-lock.json`.

| Package | Declared range | Purpose |
| --- | --- | --- |
| `three` | `^0.186.1` | Procedural 3D scenes, shaders and postprocessing |
| `gsap` | `^3.15.0` | Curtain and cinematic timelines |
| `vite` | `^7.3.6` | Development server and production bundler |
| `@playwright/test` | `^1.61.1` | Browser/rendering tests |

Vite and Playwright are development dependencies. Include development dependencies when installing on a machine that will build the project; `npm ci --omit=dev` cannot build it.

## Installation checklist

From the repository root:

```sh
node --version
npm --version
npm ci
npm run build
npm run preview
```

Open `http://localhost:4173/?presentation=true`. For editing, use `npm run dev` and open the printed URL instead. With nvm on macOS/Linux, `nvm install` followed by `nvm use` reads `.nvmrc`; on Windows, install a compatible Node release using your usual installer/version manager before running the npm commands.

For tests only:

```sh
npx playwright install chromium
npm test
```

Linux machines missing Playwright's system libraries may need `npx playwright install --with-deps chromium`. This can require administrator privileges. You do not need Playwright's browser to present the app in an already installed browser.

## Presentation-only computer

A prebuilt `dist/` folder needs a local HTTP static server and the browser capabilities above. Node/npm are needed if using this project's `npm run preview`, but another installed static server can serve `dist/` without the source or build tooling. Keep the server running and preserve the entire build folder, including assets. Do not use `file://`.

There is no established minimum GPU/RAM specification or guaranteed frame rate. Rehearse the full build on the actual computer/projector. The canvas caps pixel ratio at 2; Act II processing is capped at 1080p. Fonts and audio must remain local and available before going offline.

## Common setup problems

| Problem | Action |
| --- | --- |
| Unsupported Node / Vite engine error | Check `node --version`; select Node 22.12+ and rerun `npm ci`. |
| `vite` not found | Run `npm ci` in the folder containing `package.json`, including development dependencies. |
| Lockfile mismatch | Pull matching `package.json` and `package-lock.json`. Do not delete the lockfile as a routine fix. |
| Playwright executable missing | Run `npx playwright install chromium`. |
| Port already used | Open the URL Vite prints, or use `npm run dev -- --port 5174`. Stop conflicting servers when running tests, whose configured URL uses port 5173. |
| Assets unavailable | Preserve `public/assets/` in source copies and all assets in `dist/`; check the browser console and debug panel. |
| Graphics unavailable / black rendering | Enable hardware acceleration and check browser/WebGL errors. Use the entry-render regression test when changing shaders. |
| Preview shows old visuals | Run `npm run build` again, then reload preview. |

See [README.md](README.md) for scene architecture, visual constraints, controls, audio status and LLM handoff context.
