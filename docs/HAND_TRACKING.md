# Ant Hand 21
Target: measured 21-point hand pose, processed locally.
Landmarks: wrist 0; thumb 1-4; index 5-8; middle 9-12; ring 13-16; pinky 17-20.
Pipeline: camera -> detector -> hand ROI -> pose inference -> landmarks -> temporal filter -> gestures -> renderer.
Rules: do not render a skeleton below confidence threshold; report lost tracking instead of freezing; test open palm, fist, pinch, pointing, side view, rotation, and partial occlusion. Camera frames are not uploaded by the hand-tracking pipeline.
Current runtime has camera, IMU, frame sampling and an experimental coarse ROI. It does not yet have a trained 21-landmark pose model.
