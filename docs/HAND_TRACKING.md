# Ant Hand 21
Target: measured 21-point hand pose, processed locally.
Landmarks: wrist 0; thumb 1-4; index 5-8; middle 9-12; ring 13-16; pinky 17-20.
Pipeline: camera -> detector -> hand ROI -> pose inference -> landmarks -> temporal filter -> gestures -> renderer.
Rules: do not render a skeleton below confidence threshold; report lost tracking instead of freezing; test open palm, fist, pinch, pointing, side view, rotation, and partial occlusion. Camera frames are not uploaded by the hand-tracking pipeline.
Current runtime has camera, IMU, frame sampling and an experimental coarse ROI. It does not yet have a trained 21-landmark pose model.


## Runtime state machine
BOOT -> CAMERA_READY -> ROI_SEARCH -> ROI_LOCKED -> POSE_LOADING -> POSE_TRACKING | POSE_LOST | POSE_ERROR

POSE_TRACKING is valid only when a pose backend returns 21 measured landmarks with confidence above threshold. The UI must never synthesize 21/21 from the ROI.

## Pose backend interface
Input: cropped RGB hand ROI plus frame timestamp.
Output:
- landmarks[21]: {x,y,z?,confidence}
- handedness: left | right | unknown
- confidence: 0..1
- inferenceMs
- timestamp

## Gesture layer (after pose)
Derived from landmarks, never directly from the coarse ROI:
OPEN, FIST, POINT, PINCH, THREE, UNKNOWN.

## Performance budget
Camera rendering and IMU remain independent from pose inference. Pose inference may run at a lower cadence and landmarks are temporally filtered between inference frames. A slow pose frame must not stall the camera loop.
