# Ant iOS runtime

This is the first executable Ant target, not a web demo.

## Current capability
- native iOS application
- local Core Motion device orientation at 100 Hz
- stereoscopic left/right SceneKit views
- approximately 64 mm virtual eye separation
- local 3D scene
- no server, account, database, Vercel or Render dependency

## Build/install
The project definition is `project.yml`. Generate/open the Xcode project on macOS, sign it with an Apple development team, build for a physical iPhone, and install it.

The runtime itself works offline after installation.

## Next
Replace the temporary SceneKit renderer with the Ant renderer layer, add native camera capture, frame timing diagnostics, and then the hand-tracking pipeline.
