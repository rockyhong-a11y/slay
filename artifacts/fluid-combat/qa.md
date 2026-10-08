# Continuous classic combat — 2026-10-08

Scope: Raven, Valkyrie, Nova, Viper and Ember. Additional fighters retain the existing renderer; SD and card → fighter → result sequencing are unchanged.

## Implementation

- The existing 60 complete pose paintings (12 per fighter) now use a connected WebGL surface. Fourteen anatomical landmarks align consecutive paintings; no detached head/arm/leg layers are assembled.
- Position, rotation and scale follow continuous quintic curves. Every displayed frame samples elapsed time, including contact, recoil and recovery. Damage hitstop is capped at two 60 Hz frames.
- A fixed feet-aligned canvas prevents pose crops changing character scale. A pose-aware envelope keeps the camera steady without framing the empty padding of unrelated poses.
- Ink exchange occupies only the central part of each 220–320 ms geometric transition to reduce prolonged double silhouettes. Original condition artwork blends in/out over 100/120 ms.
- Textures and GPU resources are prepared once per mounted surface. React is not the frame clock. Hidden, paused, reduced-motion and completed scenes stop the frame loop; unavailable/lost WebGL uses the prior complete-image renderer.

## Browser verification

Codex in-app Chromium, real UI actions, 390×844 portrait and 844×390 landscape. Local QA fixtures; no application-state injection.

| Case | Result |
| --- | --- |
| Raven powerbomb | Lift → drive → landing, full silhouettes framed; portrait proof saved |
| Valkyrie suplex | Card then fighter scene; 90 RAF samples: 59.3 fps, p95 interval 16.8 ms, average JS draw 0.27 ms |
| Nova ankle lock | Final landscape framing; 90 samples: 60.0 fps, p95 18.4 ms, JS draw 0.36 ms |
| Viper elbow | Whole-pose midpoint and limb alignment inspected |
| Ember armbar | Control and recovery; final cold run 90 samples: 56.2 fps, p95 16.8 ms, JS draw 0.42 ms |
| Incoming guarded hit | 30 samples: 60.0 fps, p95 16.8 ms, JS draw 0.19 ms |
| Atlas exclusion | Player action pose remains `original`; only Nova opponent owns a fluid surface |
| SD regression | SD scene and result still work through the existing renderer |
| Concise setting | `classicMotion=reduced`, zero active fluid surfaces; restored full setting afterward |
| Console | No error/warning logs in the inspected local session |

Timing is RAF cadence and main-thread drawing work on this host, not GPU completion time or a guarantee for every phone. The cold Ember run contains an initial outlier; its p95 is still one display interval. Source artwork remains the existing authored poses, with real-time interpolation between them, not 60 newly painted images per second.

## Reproduce

Start Vite, open `/?qaHand=10&qaActor=raven&qaImpact=actions` and press 1–9/0 to use the ten fixture cards. `qaFluidFrame=0.42` freezes the fighter shot for deterministic visual inspection in development only. Final screenshots show the actual app rendering. Frame statistics and the frozen-frame parameter are removed by the production build.

Tests cover all 60 registrations, connected-surface resource reuse/cleanup, continuous transforms and endpoints, responsive envelope coverage, capped contact pauses, utility behavior, excluded actors and static/reduced fallback. Full suite: 351/351 passed. Production build with `BASE_PATH=/slay/`: passed.

The camera coverage check includes all five fighters, five transition pairs and three intermediate blends, with all 775 vertices per layer rotated and mirrored. Cold timeline planning measured 14.4 ms; warm planning 1.8–4.8 ms. Pair bounds share the immutable atlas-frame cache across stage instances and are not recalculated per display frame.
