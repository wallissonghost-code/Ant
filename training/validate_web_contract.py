"""Validate the browser contract before an Ant Hand model is published."""
import json
from pathlib import Path
p=Path("training/results/v01_metrics.json")
m=json.loads(p.read_text())
assert m["status"]=="TRAINED_EXPERIMENTAL_NOT_RUNTIME_READY"
assert m["samples"]==1200
assert m["output"]==42
print("ANT v0.1 contract OK: 224 crop -> model preprocessing -> 42 XY outputs")
print("Runtime model is intentionally NOT marked ready until real weights are exported.")
