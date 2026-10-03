# Ant Hand v0.1 training

This pipeline trains the first Ant-owned 21-landmark regressor from ANT-HAND-21 V2 captures.

## Dataset rules
- Use only V2 captures containing the embedded 224x224 JPEG.
- Pass the operator-confirmed physical hand with `--left` / `--right`. Do not trust the temporary teacher handedness field as ground truth.
- Adjacent frames are grouped before the 70/15/15 split to reduce temporal leakage.
- The current 1,200-sample corpus is a bootstrap dataset. Teacher landmarks are pseudo-labels, not independent human-reviewed ground truth.

## Run
```bash
python -m pip install -r training/requirements.txt
python training/ant_hand_v01.py \
  --left left_1.json left_2.json \
  --right right_1.json right_2.json \
  --out training/out/v01
```

The script first validates images/landmarks and writes `manifest.json`. With TensorFlow installed it trains a lightweight MobileNetV3Small regression head for 42 XY values, evaluates the held-out test split, and exports the model.

Do not replace the current runtime teacher merely because training finishes. Ant Hand v0.1 should first run side-by-side with the teacher on iPhone and be evaluated for landmark error, tracking stability and inference latency.
