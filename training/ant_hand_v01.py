#!/usr/bin/env python3
"""Ant Hand v0.1 training pipeline.

Input: ANT-HAND-21 V2 JSON captures (embedded JPEG + 21 landmarks).
The capture session label is authoritative for physical handedness.
"""
import argparse, base64, io, json, math, random
from pathlib import Path
import numpy as np
from PIL import Image

def load_capture(path, physical_hand):
    raw=json.loads(Path(path).read_text())
    if raw.get("format")!="ANT-HAND-21" or raw.get("version")!=2: raise ValueError(f"{path}: expected ANT-HAND-21 V2")
    out=[]
    for i,s in enumerate(raw["samples"]):
        lm=s.get("landmarks",[])
        if len(lm)!=21: continue
        vec=np.array([[p["x"],p["y"]] for p in lm],dtype=np.float32)
        if not np.isfinite(vec).all(): continue
        b64=s["image"]["data"].split(",",1)[1]
        img=Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGB")
        if img.size!=(224,224): continue
        out.append({"session":Path(path).stem,"index":i,"hand":physical_hand,"image":np.asarray(img),"target":vec.reshape(-1)})
    return out

def temporal_groups(samples, size=25):
    groups={}
    for s in samples:
        key=(s["session"],s["index"]//size)
        groups.setdefault(key,[]).append(s)
    return list(groups.values())

def split_groups(groups, seed=21):
    rng=random.Random(seed); rng.shuffle(groups)
    n=len(groups); a=round(n*.70); b=round(n*.85)
    return {"train":groups[:a],"val":groups[a:b],"test":groups[b:]}

def flatten(gs): return [s for g in gs for s in g]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--left",nargs="+",required=True)
    ap.add_argument("--right",nargs="+",required=True)
    ap.add_argument("--out",default="training/out/v01")
    ap.add_argument("--epochs",type=int,default=40)
    args=ap.parse_args()
    samples=[]
    for p in args.left: samples+=load_capture(p,"LEFT")
    for p in args.right: samples+=load_capture(p,"RIGHT")
    groups=temporal_groups(samples)
    # Stratify at session/temporal-group level, never random adjacent frames.
    left=[g for g in groups if g[0]["hand"]=="LEFT"]; right=[g for g in groups if g[0]["hand"]=="RIGHT"]
    L=split_groups(left,21); R=split_groups(right,22)
    splits={k:flatten(L[k]+R[k]) for k in ("train","val","test")}
    out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    manifest={"format":"ANT-HAND-V01","samples":len(samples),"splits":{k:len(v) for k,v in splits.items()},
              "physicalHands":{h:sum(s["hand"]==h for s in samples) for h in ("LEFT","RIGHT")}}
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2))
    print(json.dumps(manifest,indent=2))

    try:
        import tensorflow as tf
    except ImportError:
        print("TensorFlow not installed; dataset validation/split completed. Install training/requirements.txt to train.")
        return

    def gen(rows, augment=False):
        while True:
            random.shuffle(rows)
            for s in rows:
                x=s["image"].astype(np.float32)/255.0
                y=s["target"].copy()
                # Horizontal flip is safe only when labels are mirrored too.
                if augment and random.random()<.5:
                    x=x[:,::-1,:]; y[0::2]=1.0-y[0::2]
                yield x,y

    def ds(rows, train=False):
        sig=(tf.TensorSpec((224,224,3),tf.float32),tf.TensorSpec((42,),tf.float32))
        d=tf.data.Dataset.from_generator(lambda:gen(rows,train),output_signature=sig)
        return d.batch(32).prefetch(tf.data.AUTOTUNE)

    inp=tf.keras.Input((224,224,3))
    base=tf.keras.applications.MobileNetV3Small(input_tensor=inp,include_top=False,weights="imagenet",minimalistic=True)
    x=tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x=tf.keras.layers.Dense(128,activation="relu")(x)
    outp=tf.keras.layers.Dense(42,name="landmarks_xy")(x)
    model=tf.keras.Model(inp,outp,name="ant_hand_v01")
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),loss=tf.keras.losses.Huber(),metrics=["mae"])
    callbacks=[tf.keras.callbacks.EarlyStopping(patience=7,restore_best_weights=True),
               tf.keras.callbacks.ModelCheckpoint(str(out/"best.keras"),save_best_only=True)]
    model.fit(ds(splits["train"],True),steps_per_epoch=max(1,math.ceil(len(splits["train"])/32)),
              validation_data=ds(splits["val"]),validation_steps=max(1,math.ceil(len(splits["val"])/32)),
              epochs=args.epochs,callbacks=callbacks)
    print(model.evaluate(ds(splits["test"]),steps=max(1,math.ceil(len(splits["test"])/32)),return_dict=True))
    model.export(str(out/"saved_model"))

if __name__=="__main__": main()
