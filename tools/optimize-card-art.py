"""Copy generated originals and optimize the dedicated SLAY card illustrations."""
import json
import re
import sys
from pathlib import Path
from shutil import copy2
from PIL import Image

root = Path(__file__).resolve().parent.parent
entries = json.loads(Path(sys.argv[1]).read_text())
target = root / "public/assets/cards"
originals = root / "artifacts/card-art-sources"
target.mkdir(parents=True, exist_ok=True)
originals.mkdir(parents=True, exist_ok=True)
for entry in entries:
    card_id = entry["id"]
    if not re.fullmatch(r"[a-z]+", card_id):
        raise ValueError("Invalid card ID")
    source = Path(entry["source"])
    copy2(source, originals / f"{card_id}.png")
    with Image.open(source) as original:
        image = original.convert("RGB")
        image.thumbnail((1024, 683), Image.Resampling.LANCZOS)
        image.save(target / f"{card_id}.webp", quality=88, method=6)
        print(f"{card_id}: {image.width} x {image.height}")
