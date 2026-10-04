"""Measure transparent canvas margins for floor alignment; never alter image pixels."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
assets = root / "public/assets"
paths = [assets / f"{actor}.webp" for actor in ("raven", "valkyrie", "nova")]
paths += sorted((assets / "poses").glob("*.webp"))
layout = {}
for path in paths:
    with Image.open(path) as image:
        alpha = image.getchannel("A")
        bounds = alpha.point(lambda a: 255 if a > 30 else 0).getbbox()
        if not bounds:
            raise ValueError(f"Empty cutout: {path}")
        layout[str(path.relative_to(assets))] = {
            "aspect": round(image.width / image.height, 8),
            "bottom": round((image.height - bounds[3]) / image.height, 8),
        }
(root / "src/pose-layout.json").write_text(json.dumps(layout, indent=2) + "\n")
print(f"Measured {len(layout)} cutouts without changing their pixels.")
