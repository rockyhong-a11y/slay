"""Pure alpha-buffer tests; no source image is created or modified."""
import importlib.util
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("inspect_sd_atlas", Path(__file__).resolve().parents[1] / "tools/inspect-sd-atlas.py")
atlas = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(atlas)


def pixels(width=300, height=120, boxes=((9, 10, 80, 110), (101, 5, 191, 109), (225, 15, 291, 112))):
    values = bytearray(width * height)
    for left, top, right, bottom in boxes:
        for y in range(top, bottom):
            values[y * width + left:y * width + right] = bytes([255]) * (right - left)
    return values


class InspectSDAtlasTest(unittest.TestCase):
    def test_uneven_valleys_keep_all_three_figures_and_padding_separate(self):
        alpha = pixels()
        original = bytes(alpha)
        entry, qa = atlas.inspect_alpha(alpha, 300, 120)
        self.assertEqual(bytes(alpha), original)
        self.assertEqual(qa["nonemptyPoseCount"], 3)
        self.assertEqual(len(qa["majorSilhouetteBands"]), 3)
        self.assertEqual([valley["cutX"] for valley in qa["valleys"]], [90, 208])
        self.assertEqual(entry["frames"], [
            {"x": 6, "y": 7, "width": 77, "height": 106},
            {"x": 98, "y": 2, "width": 96, "height": 110},
            {"x": 222, "y": 12, "width": 72, "height": 103},
        ])
        self.assertEqual(qa["errors"], [])
        self.assertTrue(all(frame["outsideCropMaxAlpha"] <= 32 for frame in qa["frames"]))

    def test_faint_border_fringe_is_distinguished_from_a_cut_off_pose(self):
        alpha = pixels()
        alpha[0:20] = bytes([6]) * 20
        entry, qa = atlas.inspect_alpha(alpha, 300, 120)
        self.assertEqual(qa["edges"]["top"]["strongPixels"], 0)
        self.assertTrue(any("low-alpha fringe" in message for message in qa["warnings"]))
        for y in range(25, 50):
            alpha[y * 300 + 299] = 252
        _, qa = atlas.inspect_alpha(alpha, 300, 120)
        self.assertEqual(qa["edges"]["right"]["strongPixels"], 25)
        self.assertEqual(qa["edges"]["right"]["longestOpaqueRun"], 25)
        self.assertTrue(any("inspect for source clipping" in message for message in qa["warnings"]))
        self.assertEqual(atlas.validate_entry(entry), [])

    def test_opaque_background_and_connected_figures_cannot_silently_pass(self):
        _, qa = atlas.inspect_alpha(bytes([255]) * 300 * 120, 300, 120)
        self.assertTrue(any("No fully transparent" in error for error in qa["errors"]))
        self.assertEqual(sum("no transparent valley" in error for error in qa["errors"]), 2)

    def test_empty_pose_is_an_error_and_frames_cannot_overlap_or_escape(self):
        _, qa = atlas.inspect_alpha(bytes(300 * 120), 300, 120)
        self.assertEqual(qa["nonemptyPoseCount"], 0)
        self.assertEqual(sum("contains no alpha" in error for error in qa["errors"]), 3)
        invalid = {"width": 100, "height": 100, "frames": [
            {"x": 0, "y": 0, "width": 40, "height": 90},
            {"x": 30, "y": 0, "width": 40, "height": 90},
            {"x": 70, "y": 0, "width": 40, "height": 101},
        ]}
        errors = atlas.validate_entry(invalid)
        self.assertTrue(any("overlaps" in error for error in errors))
        self.assertTrue(any("escape" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
