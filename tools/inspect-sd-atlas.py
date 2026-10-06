#!/usr/bin/env python3
"""Read SD PNG alpha and emit whole-pose CSS crop metadata; never write pixels.

Requires Pillow. Separators follow transparent valleys near one/two thirds,
not fixed equal cells. The manifest contains three complete character boxes.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ACTORS = (
    "raven", "valkyrie", "nova", "viper", "ember",
    "atlas", "seraph", "lynx", "tempest", "onyx",
)


def runs(values, predicate):
    """Half-open contiguous index intervals satisfying a predicate."""
    result, start = [], None
    for index, value in enumerate(values):
        if predicate(value):
            if start is None:
                start = index
        elif start is not None:
            result.append((start, index))
            start = None
    if start is not None:
        result.append((start, len(values)))
    return result


def edge_stats(values, threshold):
    strong = runs(values, lambda value: value > threshold)
    opaque = runs(values, lambda value: value >= 240)
    return {
        "nonzeroPixels": sum(value > 0 for value in values),
        "strongPixels": sum(value > threshold for value in values),
        "opaquePixels": sum(value >= 240 for value in values),
        "maxAlpha": max(values, default=0),
        "longestStrongRun": max((end - start for start, end in strong), default=0),
        "longestOpaqueRun": max((end - start for start, end in opaque), default=0),
    }


def validate_entry(entry):
    errors = []
    width, height = entry["width"], entry["height"]
    if len(entry["frames"]) != 3:
        errors.append("Expected exactly three whole-pose frames.")
    previous_right = 0
    for index, frame in enumerate(entry["frames"]):
        x, y, w, h = (frame[key] for key in ("x", "y", "width", "height"))
        if not all(isinstance(value, int) for value in (x, y, w, h)):
            errors.append(f"Frame {index}: coordinates must be integer pixels.")
        if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > width or y + h > height:
            errors.append(f"Frame {index}: bounds escape source image or are empty.")
        if x < previous_right:
            errors.append(f"Frame {index}: box overlaps the preceding character.")
        previous_right = x + w
    return errors


def inspect_alpha(alpha, width, height, threshold=32, padding=3):
    """Measure bytes without modifying them. QA warnings require visual review."""
    if width < 12 or height < 4 or len(alpha) != width * height:
        raise ValueError("Invalid alpha buffer dimensions.")
    if not 0 <= threshold < 255 or padding < 0:
        raise ValueError("Invalid alpha threshold or padding.")
    occupancy = [0] * width
    for index, value in enumerate(alpha):
        if value > threshold:
            occupancy[index % width] += 1
    cuts, valleys = [], []
    for fraction in (1 / 3, 2 / 3):
        target = width * fraction
        left = max(1, int(target - width * 0.1))
        right = min(width - 1, int(target + width * 0.1) + 1)
        minimum = min(occupancy[left:right])
        candidates = [
            (left + start, left + end)
            for start, end in runs(occupancy[left:right], lambda value: value == minimum)
        ]
        start, end = min(candidates, key=lambda span: (abs((span[0] + span[1]) / 2 - target), -(span[1] - span[0])))
        cut = (start + end) // 2
        cuts.append(cut)
        valleys.append({
            "expectedX": round(target, 3), "search": [left, right],
            "interval": [start, end], "cutX": cut,
            "minimumStrongPixelsPerColumn": minimum,
        })
    boundaries = [0, *cuts, width]
    frames, frame_qa, warnings, errors = [], [], [], []
    for index, (left, right) in enumerate(zip(boundaries, boundaries[1:])):
        x0, y0, x1, y1, foreground = right, height, left, 0, 0
        for y in range(height):
            for x in range(left, right):
                if alpha[y * width + x] > threshold:
                    x0, y0 = min(x0, x), min(y0, y)
                    x1, y1 = max(x1, x + 1), max(y1, y + 1)
                    foreground += 1
        if not foreground:
            errors.append(f"Frame {index}: region contains no alpha > {threshold}.")
            frame = {"x": left, "y": 0, "width": max(1, right - left), "height": height}
            strong_bounds = None
        else:
            fx, fy = max(left, x0 - padding), max(0, y0 - padding)
            fr, fb = min(right, x1 + padding), min(height, y1 + padding)
            frame = {"x": fx, "y": fy, "width": fr - fx, "height": fb - fy}
            strong_bounds = {"x": x0, "y": y0, "width": x1 - x0, "height": y1 - y0}
        frames.append(frame)
        fringe_outside, max_fringe = 0, 0
        for y in range(height):
            for x in range(left, right):
                if frame["x"] <= x < frame["x"] + frame["width"] and frame["y"] <= y < frame["y"] + frame["height"]:
                    continue
                value = alpha[y * width + x]
                if value:
                    fringe_outside += 1
                    max_fringe = max(max_fringe, value)
        if max_fringe > threshold:
            errors.append(f"Frame {index}: crop excludes strong foreground.")
        frame_qa.append({
            "pose": ("idle", "attack", "hurt")[index],
            "region": [left, right], "strongBounds": strong_bounds,
            "foregroundPixels": foreground,
            "foregroundFraction": round(foreground / max(1, (right - left) * height), 6),
            "outsideCropFringePixels": fringe_outside,
            "outsideCropMaxAlpha": max_fringe,
        })
    entry = {"width": width, "height": height, "frames": frames}
    errors.extend(validate_entry(entry))
    for index, valley in enumerate(valleys):
        if valley["minimumStrongPixelsPerColumn"]:
            errors.append(f"Separator {index}: no transparent valley; splitting may cut a character.")
    edges = {
        "top": edge_stats(alpha[:width], threshold),
        "bottom": edge_stats(alpha[-width:], threshold),
        "left": edge_stats(alpha[::width], threshold),
        "right": edge_stats(alpha[width - 1::width], threshold),
    }
    for side, stats in edges.items():
        if stats["strongPixels"]:
            warnings.append(f"{side}: strong silhouette touches canvas edge ({stats['strongPixels']} pixels); inspect for source clipping.")
        elif stats["nonzeroPixels"]:
            warnings.append(f"{side}: low-alpha fringe only (max alpha {stats['maxAlpha']}); no strong silhouette clipping.")
    transparent = alpha.count(0)
    if transparent == 0:
        errors.append("No fully transparent background pixels.")
    # A major occupied column band is evidence of a silhouette, not an anatomy detector.
    bands = [
        {"start": left, "end": right, "pixels": sum(occupancy[left:right])}
        for left, right in runs(occupancy, lambda value: value > 0)
    ]
    major = [band for band in bands if band["pixels"] >= max(10, sum(occupancy) * 0.01)]
    if len(major) != 3:
        warnings.append(f"Found {len(major)} major occupied-column bands; inspect the three-character count visually.")
    qa = {
        "alphaThreshold": threshold, "paddingPixels": padding,
        "transparentFraction": round(transparent / len(alpha), 6),
        "foregroundFraction": round(sum(occupancy) / len(alpha), 6),
        "nonemptyPoseCount": sum(frame["foregroundPixels"] > 0 for frame in frame_qa),
        "majorSilhouetteBands": major, "valleys": valleys,
        "edges": edges, "frames": frame_qa,
        "warnings": warnings, "errors": errors,
    }
    return entry, qa


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset-dir", type=Path, default=ROOT / "public/assets/sd2d")
    parser.add_argument("--manifest", type=Path, default=ROOT / "public/assets/sd2d/manifest.json")
    parser.add_argument("--qa", type=Path, default=ROOT / "artifacts/sd2d-atlas-qa.json")
    parser.add_argument("--threshold", type=int, default=32)
    parser.add_argument("--padding", type=int, default=3)
    parser.add_argument("--allow-partial", action="store_true")
    parser.add_argument("--check", action="store_true", help="Read/validate only; require existing manifest to match fresh measurements.")
    args = parser.parse_args()
    manifest, assets, errors = {}, {}, []
    for actor in ACTORS:
        path = args.asset_dir / f"{actor}.png"
        if not path.exists():
            if not args.allow_partial:
                errors.append(f"Missing actor: {actor}")
            continue
        before = hashlib.sha256(path.read_bytes()).hexdigest()
        with Image.open(path) as image:
            if image.mode != "RGBA":
                errors.append(f"{actor}: expected RGBA PNG, got {image.mode}.")
                continue
            width, height = image.size
            entry, qa = inspect_alpha(image.getchannel("A").tobytes(), width, height, args.threshold, args.padding)
        after = hashlib.sha256(path.read_bytes()).hexdigest()
        if after != before:
            errors.append(f"{actor}: source hash changed during read-only inspection.")
        manifest[actor] = entry
        assets[actor] = {"source": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path), "sha256": before, **qa}
        errors.extend(f"{actor}: {error}" for error in qa["errors"])
        print(f"{actor}: {width}x{height}, {qa['nonemptyPoseCount']} poses, {len(qa['majorSilhouetteBands'])} silhouette bands, transparent {qa['transparentFraction']:.1%}, {len(qa['warnings'])} warnings")
    report = {
        "sourcePixelsModified": False, "actorsExpected": list(ACTORS),
        "actorsMeasured": len(assets), "posesMeasured": sum(asset["nonemptyPoseCount"] for asset in assets.values()),
        "assets": assets, "errors": errors,
    }
    if args.check:
        if not args.manifest.exists() or json.loads(args.manifest.read_text()) != manifest:
            errors.append("Existing manifest differs from current source-alpha measurements.")
    else:
        args.manifest.parent.mkdir(parents=True, exist_ok=True)
        args.qa.parent.mkdir(parents=True, exist_ok=True)
        args.manifest.write_text(json.dumps(manifest, indent=2) + "\n")
        args.qa.write_text(json.dumps(report, indent=2) + "\n")
    for error in errors:
        print(f"ERROR: {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
