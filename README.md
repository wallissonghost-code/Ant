# Ant

Ant is an experimental, offline-first XR runtime built from the ground up.

## Principles
- Offline-first: XR must work without a server or internet connection.
- Hardware-agnostic core: platform-specific sensor, camera, display, and GPU code stays behind adapters.
- Minimal dependencies: prefer platform primitives and code owned by this repository.
- Measurable behavior: tracking, timing, and rendering expose diagnostics from the beginning.

## v0.1 target
The first milestone is a local 3DoF prototype:
1. read device motion/orientation;
2. normalize it into an Ant pose;
3. feed that pose to a virtual camera;
4. render a simple stereoscopic scene locally.

No Vercel, Render, database, account, or cloud runtime is required.

## Architecture

```
Device
  -> platform/     sensors, display, camera, clock
  -> core/         math, pose, tracking contracts
  -> runtime/      frame orchestration
  -> renderer/     stereo scene rendering
  -> app/          platform application shell
```

See `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`.
