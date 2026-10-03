# Ant Hand 21
Target: measured 21-point hand pose, processed locally.
Landmarks: wrist 0; thumb 1-4; index 5-8; middle 9-12; ring 13-16; pinky 17-20.
Pipeline: camera -> detector -> hand ROI -> pose inference -> landmarks -> temporal filter -> gestures -> renderer.
Rules: do not render a skeleton below confidence threshold; report lost tracking instead of freezing; test open palm, fist, pinch, pointing, side view, rotation, and partial occlusion. Camera frames are not uploaded by the hand-tracking pipeline.
Current runtime uses a temporary teacher pose backend while Ant Hand is being developed.

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

## ANT HAND v0.1 dataset baseline
The current trainable V2 corpus contains 1,200 samples in four 300-frame capture sessions:
- 600 physical LEFT
- 600 physical RIGHT
- each sample includes a 224x224 JPEG hand crop and 21 teacher landmarks
- source frame size and normalized crop rectangle are retained

Physical hand labels are defined by the capture-session label supplied by the operator, not by the teacher handedness field. The teacher handedness output disagrees with the known physical hand in parts of the corpus, so it must not be treated as ground truth.

The 1,200-sample corpus is experimental, not production-complete. Teacher landmarks can inherit teacher-model errors.

### Verified quality audit (1,200 V2 samples)
- 1,200/1,200 samples contain exactly 21 finite landmarks.
- 1,200/1,200 embedded JPEGs decode successfully at 224x224.
- 1,200/1,200 crop rectangles are structurally valid.
- Some crop-normalized x/y landmarks fall outside [0,1], concentrated in captures near source-frame boundaries. Keep these samples flagged for review rather than silently clamping labels.
- Current ROI crops are rectangular and then resized to 224x224. Their aspect ratios vary substantially, so this can geometrically stretch the hand. Future collection should use a square padded crop before resize.

### Split policy
Do not randomly split adjacent frames. Captures from the same short motion sequence are strongly correlated and can leak nearly identical images into train and validation/test.

Group temporally adjacent/visually similar samples first, then assign whole groups approximately:
- 70% train
- 15% validation
- 15% test

Keep physical LEFT/RIGHT balanced inside every split. Near-duplicate frames must remain in the same group.

### Quality gate
Before training:
1. Require exactly 21 finite landmarks.
2. Require a decodable 224x224 image.
3. Require valid crop metadata.
4. Flag crop-boundary/truncation/occlusion cases for review.
5. Deduplicate or group near-identical consecutive poses/images.
6. Preserve the operator-confirmed physical handedness independently from teacher handedness.
7. Do not clamp teacher landmarks merely to force x/y into [0,1].

### v0.1 objective
Ant Hand v0.1 learns image crop -> 21 normalized landmarks. Handedness remains metadata for v0.1 instead of a required prediction head.

The temporary teacher is used only to bootstrap labels. Evaluation must use a held-out split and later manually reviewed ground truth. The goal is to replace the teacher runtime once Ant Hand reaches acceptable accuracy and iPhone inference latency.

### Next collection format
Before collecting a larger corpus, Dataset Lab should switch to a square padded ROI (preserve aspect ratio) and explicit operator-selected physical hand (LEFT/RIGHT). This prevents geometric distortion and avoids relying on teacher handedness.
