# Ant architecture

## Boundary rule
The Ant core must not import mobile-vendor XR frameworks. Native OS access is isolated in `platform/`.

## Modules
- `core/`: portable math and XR data types.
- `platform/`: adapters for IMU, camera, display, GPU and monotonic time.
- `runtime/`: owns the update/frame loop and converts platform samples into engine state.
- `renderer/`: consumes poses and scene data; it must not own tracking.
- `app/`: thin executable/application entry point.

## Initial tracking contract
Ant starts with 3DoF orientation. A platform adapter supplies timestamped IMU/orientation samples. The runtime converts these to a normalized quaternion and publishes a `Pose`.

Position remains zero in v0.1. This keeps the API compatible with a future 6DoF VIO/SLAM implementation without pretending positional tracking already exists.

## Cloud policy
Core XR execution has no network dependency. Online services, if ever introduced, must be optional modules outside the frame/tracking path.
