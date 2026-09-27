# AWS SBG TKMCE — theatrical inauguration

Vite + vanilla JavaScript + GSAP + real-time Three.js. The approved curtain opening leads into a procedural computational universe and ends on black with a `FINAL_REVEAL_START` event. A fully procedural final environment materializes live typography after the black hold and remains animated until reset. The Act II reference image is not included in the application.

## Run locally

Node.js 22.12+ and npm:

```sh
npm install
npm run dev
npm run build
npm run preview
```

Development: http://localhost:5173. Production preview: http://localhost:4173. Keep the local server running during presentation; do not open the HTML using `file://`. All images, fonts and scripts are local at runtime. The inauguration click and object fly-bys use local sound effects; there is no background music. The stage uses fixed 1920×1080 design coordinates and scales proportionally to cover the viewport. Non-16:9 screens crop the outer edges; nothing stretches. All visual layers share this transform.

## Presentation mode

Open **http://localhost:4173/?presentation=true** after building and starting preview. F requests fullscreen on the root cinematic container. D/debug inspection are disabled in this mode. Context menus, text selection, dragging, and scrolling keys are suppressed. The cursor disappears during playback and remains hidden on the open screen; R restores it. In normal development mode, showing debug also restores the cursor.

`src/core/stage.js` owns cover scaling, resize/orientation/fullscreen listeners, and device-pixel-ratio changes when moving between displays. The CSS composition always remains 1920×1080. Three.js consumes the same viewport metrics, keeps its camera at 16:9, and caps the effective drawing-buffer ratio at 2 (maximum 3840×2160). This avoids applying the display scale twice or allocating oversized HiDPI 4K buffers. Future visual layers belong inside `#stage`; operator controls belong inside `#app`, outside the transformed stage.

Transfer the complete project (then install/build on the other machine), or transfer `dist/` and serve it with a local HTTP static server. No internet connection is required during playback. Fonts, imagery and npm dependencies are local; required visuals load before the start button is enabled.

## Controls

- Click the **gold circle** below **CLICK TO INAUGURATE**: lock playback immediately and begin Act I → camera entry → Act II → black hold.
- **F**: request fullscreen; browser Escape exits.
- **R**: restore the exact closed curtain, original lights, prompt and zero timeline position.
- **D**: show/hide developer controls (hidden initially).
- **Space**, with debug visible: start. In a paused inspection, replay from closed. Repeated starts during normal playback are ignored.
- Debug buttons or **1–5**: closed, 25%, 50%, 75%, fully open. These are physical opening percentages, not elapsed timeline percentages. Inspection pauses silently; R/1 restores readiness.

## Curtain technique

`src/animation/curtain.js` exports `createCurtainOpeningTimeline()`, returning an embeddable GSAP timeline and an explicit reset method. `timeline.js` inserts it into the master.

The supplied photographic reference is reconstructed using 18 overlapping fabric pleats per side. Each has its own transform origin, translation, compression and small motion delay. The free inner pleat pulls first; the other folds follow. Outer pleats stay anchored, while the curtain width compresses to 23% of its closed width. The inner hems use static irregular clipping and small animated skew. Opacity-only shading overlays deepen folds and shift highlights. A small overshoot and rebound settle the fabric.

The reference's proscenium, overhead swags and floor remain fixed. Moving fabric samples the hanging velvet below the swags to avoid dragging the top decoration across the stage. The center seam brightens, widens and fades while a light spill behind the cloth briefly grows; the screen itself never fades over the curtains. A faint cool/violet hem remains along the gathered edges.

The supplied image is only **512×288**. It is stored locally as `public/assets/images/curtain-reference.jpg`; its softness at 1080p is inherited from that source. Higher-resolution matching artwork can replace it without changing the motion architecture. The supplied reference remains the source of the stage imagery. Cinzel is bundled locally with its OFL license in `public/assets/fonts/`.

## Tune the physical feel

Act I timing and motion controls live in `src/config/timing.js`. Act II uses `src/config/actTwo.js`.

| Parameter | Default | Effect |
| --- | --- | --- |
| `resistanceStart` | 0.20 s | Pause before the first movement |
| `mainTravelStart` | 0.40 s | Acceleration starts |
| `mainTravelEnd` | 2.40 s | Main travel arrives at its small overshoot |
| `settleRebound` | 3.10 s | Rebound reaches its return point |
| `curtainOpenDuration` | 3.60 s | Fabric fully rests |
| `travelEase` | Custom cubic curve | Slow take-up, acceleration, extended deceleration |
| `gatheredWidth` | 0.23 | Fraction of each curtain remaining visible |
| `resistanceTravel` | 0.008 | Movement during initial resistance |
| `foldLag` | 0.065 s | Delay between inner and outer fabric |
| `overshoot` / `rebound` | 0.006 / 0.002 | Travel beyond/restoring toward rest, relative to half width |
| `edgeSkew` | 0.18° | Subtle hem deformation during travel |
| `foldShadow` / `foldHighlight` | 0.35 / 0.16 | Compressed fabric depth |
| `pleatsPerSide` | 18 | Fabric subdivisions; higher costs more compositor layers |
| `lightPeak`, `seamFade*`, `spillFade*` | See file | Anticipation light and handoff to exposed screen |

Keep times ordered: resistance < main start < main end < rebound < total. Keep `foldLag` below the travel duration and `gatheredWidth` above `overshoot`. Use the presets to inspect physical width and Space to judge the actual pacing.

## Act II: computational universe

The 3.6-second curtain choreography is unchanged. A separate theatre wrapper scales into the existing black opening over 1.7 seconds. A single persistent Three.js canvas lives behind the curtains from the initial frame. Its sparse, almost stationary white/violet particles are physically uncovered by the pleats. During the camera entry, the same field gains depth and velocity. A 350 ms particle-only void bridges into the technology environment; the canvas is neither replaced nor faded in at that boundary. The 10.6-second fly-through integrates a forward Z velocity curve from 25 to 200 world units/second, with restrained X/Y drift and roll. It finishes with convergence, a 220 ms energy burst, and at least 400 ms of visible black before firing the reveal event. The burst begins at 16.25 seconds; the purple reveal starts at 16.87 seconds and the title settles at about 21.77 seconds.

The color story is crimson/black theatre → cool-white/violet void → violet/white technology → increasing orange during the last 40% of travel → orange-white burst → black. The crimson photographic velvet and all pleat motion parameters are retained. Theatre typography uses white with a restrained violet/magenta halo. A small click pulse and a vertical seam energy sweep synchronize with the original curtain start. Foreground dust uses 28 cool-white, 10 violet and 2 subdued warm particles. The GPU field follows the same 70/25/5 palette before acceleration. The final scene uses procedural violet ribbons and live SVG typography.

`src/config/identity.js` holds shared 3D colors, void density and entry beacon, and pulse timings. Lighting CSS in `src/styles.css` mirrors that palette. The supplied Stitch screen could not be accessed during this implementation, so the written color specification is the basis for the treatment; it is not a claim of exact matching to unseen final artwork.

All technology objects are procedural geometry. The opening graph retains 21 glowing nodes and instanced traveling pulses. Later heroes use the supplied dark-metal compute core, rotating database reactor, smoked-glass cloud, neural structure, glowing code panel, nested glass vault, and serverless orbital core. Distant and midground archetypes use shared instanced silhouettes; secondary geometry is also instanced. BUILD / COMPUTE / CLOUD / DATA / DEPLOY / AI planes remain in the scene. There is no floor, city, screenshot backdrop, external API, or Act II footage.

Nine detailed heroes have explicit world positions and scales: the opening graph, two medium-distance structures, and six close passes. Forty additional archetype silhouettes populate the midground; 320 instanced secondary structures fill the surrounding space. Secondary objects are seeded deterministically. Objects remain at their authored Z positions as the perspective camera moves toward and past them; they are not enlarged to fake travel. Passed heroes are culled rather than teleported. Two actual 3D depth layers contain 6,800 distant stars/data lights, with another 1,800 stars distributed across the entrance view for immediate depth. A near GPU field of up to 3,200 points plus instanced streaks supplies the radial speed effect. Procedural depth-bearing light sprites and four haze planes give atmosphere without raymarching or shadow maps. Act II uses a capped bloom chain; the final galaxy bypasses it.

`src/config/actTwo.js` controls entry scale/duration, darkness, fly duration, convergence, burst, black hold, camera speed curve, particle count/depth, fog and authored hero placements. GSAP ramps `cameraSpeed`, `particleSpeed`, `streakLength`, `orangeEnergyIntensity`, `objectDensity`, `cameraShake`, `emergence` and `collapse`. A requestAnimationFrame renderer samples the master timeline; analytical camera integration makes seeks/replays independent of frame rate. Debug camera speed is a path multiplier, so changing it while paused changes the sampled camera position immediately.

The D overlay adds **Camera entry**, **Void bridge**, **Flythrough start**, **Flythrough mid**, **Flythrough fast**, **Climax**, and **Final reveal start** checkpoints, plus sliders for hero density, secondary density, star density, midground density, close-pass count, camera speed, streak length, fog density, bloom strength and orange energy. Checkboxes separately disable heroes, secondary structures, stars, streaks and fog. Start is sampled 350 ms into emergence so there is something to inspect. Checkpoints pause silently and do **not** dispatch production reveal events. Space replays from closed; R resets the scene, theatre push, all controls/sliders, pending completion timers. Debug is disabled in presentation mode.

Observe the final environment cue using:

```js
document.addEventListener('FINAL_REVEAL_START', () => {
  // The procedural final environment has started.
});
```

It is dispatched once per normal completed run. The black hold has a wall-clock guard, so GPU/timeline catch-up cannot shorten it. A reset cancels the pending cue. Shader compilation, textures and geometry buffers are warmed up before enabling the inauguration button. If WebGL is unavailable, readiness is blocked with an operator message instead of starting a broken sequence. Shared resources are reused on replay and disposed on module teardown.

## Architecture and assets

```text
src/
  main.js                 lifecycle, readiness, reset, inspection and playback lock
  styles.css              reference composition, pleats, fixed frame and lights
  animation/
    curtain.js            isolated physical curtain timeline
    atmosphere.js         sparse seeded 70/25/5 theatre dust
    timeline.js           master timeline integration
    effects.js            Three.js renderer, compile/warm-up and responsive sizing
    final.js              staged title and persistent final render loop
  scene/
    universe.js           camera, deterministic placements, lights, convergence
    objects.js            reusable procedural technology object library
    particles.js          GPU-instanced speed field and points
  core/
    stage.js              shared cover transform, viewport events and pixel ratio cap
    state.js              allowed lifecycle transitions
    controls.js           pointer, keyboard and debug preset controls
    assetLoader.js        image/video preload, timeout and failure handling
    video.js              future local video playback/reset (inactive)
    debug.js              state, progress, asset status, FPS
  config/
    timing.js             approved Act I motion and light parameters
    actTwo.js             Act II timing, world layout, speed curve and defaults
    identity.js           shared colors, void treatment and seam pulse timings
    assets.js             local asset manifest
public/assets/
  images/                 curtain-reference.jpg
  fonts/                  local Cinzel + license
  video/                  future MP4
  logos/                  future local logo
```

Layer order: persistent 3D void, transparent theatre opening, moving curtains, fixed proscenium, atmosphere/seam/vignette, reserved title, burst/blackout, interaction. Debug lives outside the stage. Decoration never intercepts interaction.

The curtain image is a critical preloaded asset. Manifest entries use unique IDs, type (`image`, `audio`, `audio-buffer`, `video`), local URL and a `critical` flag. Loading uses a 15-second timeout. Critical failures block start; optional failures are listed in debug. Reload after fixing a missing critical file. The local-video API remains reserved; Act II is rendered live rather than played as footage.

## Validation and performance

```sh
npx playwright install chromium
npm test
npm run build
```

Tests cover duplicate-start locking, debug gating, intermediate reset/replay, exact curtain reset, viewport coverage, asset failures, real camera Z travel, debug tuning/reset, silent checkpoint seeking, root fullscreen, renderer pixel ratio limits, and the one-shot reveal event after visible black. Procedural scene checkpoints are also rendered and visually inspected.

Act I uses transforms and opacity with no per-frame layout reads, width animation, filter animation or dynamic clip paths. Act II uses a bounded WebGL scene with shared geometry/materials, merged vents, instanced nodes/particles, and GPU particle displacement. Its render loop stops on black, reset or disposal. Static clipping defines the hem; small shading layers are promoted for compositing. The preset solver reads GSAP's cached transform values only when inspecting, not during playback.

Headless Chromium verifies functionality and WebGL shader compilation, but does not establish sustained 60 FPS on the presentation laptop. Rehearse the production build in hardware-accelerated Chrome at the venue; the debug overlay shows draw calls and FPS. Lower particle density / pixel ratio if the device needs it. Vite reports a non-blocking large-chunk warning for the bundled Three.js scene.

## Procedural final reveal

Preview directly at **http://localhost:4173/?final=true** (add `&presentation=true` for presentation controls), or use D → **Final frame · animated**. The full sequence also reveals this frame automatically after `FINAL_REVEAL_START`. R cancels its fade and animation and restores the closed theatre.

The final scene contains no reference bitmap. `src/scene/finalScene.js` builds four layered ribbon structures, secondary wisps, depth particles, residual sparks and an energy core. Curve geometry is sampled once; vertex shaders continuously deform it. `src/scene/finalTitle.js` renders live SVG text in a locally bundled Apache-2.0-licensed Syncopate font selected through visual comparison with the typography reference. Its temporary canvas samples particle destinations only and is never uploaded as a texture.

The 4.9-second materialization resolves AWS in 750ms, sweeps the subtitle in 700ms, pauses briefly, then draws the geometric sans-serif TKMCE outward from the center. A crossing light resolves the outlines into solid type. `TKMCE_IMPACT` fires once when the word becomes fully readable (the existing `FINAL_TITLE_IMPACT` alias is retained). The approved environment keeps its existing calm-down timing and continues indefinitely with slight perspective parallax. R cancels the one owned animation loop and resets all final state; GPU resources are reused for replay and disposed on application teardown. Reduced-motion mode shows the settled title with a stationary environment.

`?final=true` previews the resting scene directly. Production requires only local assets. The art-direction bitmap has been removed from the project and build.

The curtain opening now reveals a destination already forming: six faint, suspended data paths and the first technology silhouettes emerge during the fabric travel. A continuous fog reveal carries through the camera entry; no scene-wide object switch occurs at the flythrough boundary. The two corridor draw calls share the same world and are compiled before interaction. The inauguration label and motif use gold, with a stronger gold hover/focus glow.

The final title matches the supplied art direction using live, warm near-white sans-serif text. Montserrat, Jost, Outfit, Urbanist, Manrope, Inter Tight, Gruppo, Space Grotesk and Syncopate were compared; Syncopate was the closest tested match in natural width and letter construction, not an identification of the raster source font. Tracking is restrained (5px / 3px / 8px at the 1920 design size). The approximate cap-height hierarchy is 95px / 46px / 180px. Local comparison sheets and the 1920×1080 capture are kept in ignored `artifacts/`; no reference image ships in production.

The first hero remains a connected graph. Six close passes follow the opening graph: compute core (left), database reactor (lower-right), network (upper-left), vault (lower-right), readable API panel (left), and serverless core (right). Cloud and neural heroes provide additional medium-distance structure. Graphs use shared nearest-neighbour edge geometry, instanced nodes and moving packets; their traffic and gentle rotation start during the curtain reveal.

Fly-by whooshes are decoded once and triggered from the visual timeline about 0.7 seconds before each hero object’s closest approach. Independent voices overlap, pan toward the object, vary playback rate from 0.94–1.06, and use restrained gains with overlap compensation. Reset stops every voice; debug previews stay silent and whooshes fade out before the burst.

## Hero materials and bloom

The adapted object modules live in `src/scene/objects/`; shared materials use the supplied dark metal, emissive violet/magenta/white/orange, and smoked glass palette. Each hero animates inside a separate container so its local motion cannot overwrite flight transforms. Compute-core pulses use an isolated material. Static repeated details are merged by material; secondary models retain cheaper geometry. All geometry and materials, including per-object clones, are registered for disposal.

`src/scene/postprocessing.js` owns Act II's RenderPass → UnrealBloomPass → OutputPass → FXAA chain. Render targets cap at 1920×1080 with screen-space edge smoothing (avoiding GPU-dependent multisampled HDR resolves), transmission uses half resolution, and all passes resize/dispose with the renderer. Bloom is tuned to strength 0.3, radius 0.5, threshold 1.15 with ACES exposure 0.9 to retain glass/metal detail. The supplied lower threshold washed out the existing scene. The finale preserves its own color treatment and bypasses this chain. The debug draw counter includes transmission and postprocessing passes; checkpoint checks enforce a 200-call budget (observed 38–70 at 1280×720 after population instancing and near-hero LOD).

Live cinematic playback samples the timeline from elapsed time so slow frames do not stretch the authored sequence through GSAP lag smoothing. The visible black hold remains guarded for at least 400ms.

## Dense universe population

`src/scene/population.js` builds its seeded layout once. The eight archetypes repeat five times each at varied scales and rotations, with 320 secondary cubes, shards, rings, columns and strips. Thirteen instanced batches supply these structures and distant proxies for the nine detailed heroes. High-detail heroes render only within 125 world units. All instances remain in authored world space; the camera supplies parallax. The central corridor is reserved for travel, with major objects around its perimeter.

`src/scene/starField.js` adds far, mid-depth and entrance stars using three Points draws; the existing near particles transition to speed-responsive streaks. White/violet dominate, magenta is secondary, and orange stays rare until convergence. Population visibility, stars and motion activity build progressively; reduced fog and much fainter haze preserve deep blacks.

Only the six close heroes schedule fly-by audio. Cue planning includes camera-speed tuning and selects the first pass before convergence, compensates playback-rate variation, and preserves polyphony and side-based pan. R stops all voices and restores the existing seeded matrices, debug defaults and timeline without allocating replacement populations. The approved curtain and final galaxy assets/shaders are unchanged by this density update.

Debug tuning survives checkpoint changes and replay; R explicitly restores all defaults, including checkbox states. Star sizing uses the capped scene-buffer scale so high-DPI presentation does not inflate the star sprites.

The refined Act II treatment uses graphite metals with a locally generated studio reflection environment, subdued violet accents, thin graph links without node rings, and solid shaded midground hardware instead of universal wireframe. The opening graph is smaller and offset for separation. Entry guide lines fade away as the universe establishes; they do not persist across the main fly-through. Curtains and final reveal are unchanged.
