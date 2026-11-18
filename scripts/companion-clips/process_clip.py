"""Turn a Google Flow companion clip into an app-ready transparent WebM.

Usage:
    python3 scripts/companion-clips/process_clip.py OUT_DIR STAGE clip_idle.mp4 clip_hello.mp4 clip_celebrate.mp4

The clips are generated with the shared recipe in docs/flow/README.md, so every
stage and reaction has the same framing. This script:
  1. keys out the flat cream background (only background pixels connected to the
     frame edge, so white shoes and shirts survive),
  2. crops every clip of a stage to one shared box (so clips swap without jumping),
  3. scales down and encodes VP9 WebM with alpha plus a PNG poster,
  4. writes the resting-pose body box so the app can line the video up with the
     still PNG art.
"""

import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

KEY_THRESHOLD = 14  # max colour distance from the background still counted as background
POCKET_MIN_AREA = 4000  # enclosed cream areas bigger than this (px) may be background
POCKET_MIN_HEIGHT = 110  # ...and taller than this (sneakers are shorter)
POCKET_MAX_MEAN_DIST = 10.0  # ...and this close to the background colour (shirt is whiter)
SHADOW_MAX_HEIGHT = 30  # painted ground shadow is a thin strip under the feet
EDGE_SOFTNESS = 70.0  # colour distance at which an edge pixel becomes fully opaque
SCALE = 0.6
PAD = 12


def read_frames(path):
    cap = cv2.VideoCapture(path)
    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    return frames


def background_colour(frame):
    border = np.concatenate([
        frame[:12].reshape(-1, 3), frame[-12:].reshape(-1, 3),
        frame[:, :12].reshape(-1, 3), frame[:, -12:].reshape(-1, 3),
    ])
    return np.median(border, axis=0)


def alpha_mask(frame, bg):
    """Return (alpha, cleaned_bgr) for one frame.

    Background = cream pixels connected to the frame edge, plus large enclosed
    cream pockets (e.g. the gap between the legs). Small enclosed cream areas
    are kept because the white sneakers are almost exactly the background
    colour. Edge pixels get a soft alpha and their cream fringe removed, and
    the painted ground shadow (darkened cream) is dropped: the app draws its own.
    """
    f = frame.astype(np.float32)
    bgf = bg.astype(np.float32)
    dist = np.linalg.norm(f - bgf, axis=2)
    candidate = (dist < KEY_THRESHOLD).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(candidate, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
    background_labels = set(l for l in edge_labels if l != 0)
    figure_rows = np.where((candidate == 0).any(axis=1))[0]
    figure_top, figure_bottom = (figure_rows.min(), figure_rows.max()) if figure_rows.size else (0, frame.shape[0])
    lower_half = figure_top + 0.5 * (figure_bottom - figure_top)
    for label in range(1, count):
        if label in background_labels:
            continue
        # Pockets only count below the waist: a light shirt can also be
        # background-coloured, but it sits in the upper half.
        if stats[label, cv2.CC_STAT_TOP] + stats[label, cv2.CC_STAT_HEIGHT] / 2 < lower_half:
            continue
        # A large, tall pocket of exact background colour (the gap between the
        # legs). Sneakers are background-coloured too but short; the shirt is
        # tall but whiter, so its mean distance is higher.
        if (stats[label, cv2.CC_STAT_AREA] >= POCKET_MIN_AREA
                and stats[label, cv2.CC_STAT_HEIGHT] >= POCKET_MIN_HEIGHT
                and dist[labels == label].mean() < POCKET_MAX_MEAN_DIST):
            background_labels.add(label)
    background = np.isin(labels, list(background_labels)) & (candidate == 1)

    # Painted ground shadow: background colour darkened evenly on all channels,
    # sitting low in the frame.
    k = (f / np.maximum(bgf, 1)).mean(axis=2)
    deviation = np.linalg.norm(f - k[..., None] * bgf, axis=2)
    h = frame.shape[0]
    rows = np.arange(h)[:, None]
    shadow = ((deviation < 10) & (k > 0.55) & (k < 0.985) & (rows > h * 0.78)).astype(np.uint8)
    s_count, s_labels, s_stats, _ = cv2.connectedComponentsWithStats(shadow, connectivity=8)
    touching = cv2.dilate(background.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    for label in range(1, s_count):
        region = s_labels == label
        if s_stats[label, cv2.CC_STAT_HEIGHT] <= SHADOW_MAX_HEIGHT and (region & touching).any():
            background |= region

    alpha = np.where(background, 0.0, 1.0).astype(np.float32)
    # Soft edge band next to the background: estimate coverage from distance.
    band = cv2.dilate(background.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2).astype(bool) & ~background
    soft = np.clip(dist / EDGE_SOFTNESS, 0.0, 1.0)
    alpha[band] = soft[band]
    # Remove the cream fringe from partly transparent edge pixels.
    a = np.maximum(alpha, 1e-3)[..., None]
    cleaned = np.clip((f - (1.0 - a) * bgf) / a, 0, 255)
    cleaned = np.where(alpha[..., None] > 0, cleaned, f).astype(np.uint8)
    return (alpha * 255).astype(np.uint8), cleaned


def bbox(alpha):
    ys, xs = np.where(alpha > 40)
    return xs.min(), ys.min(), xs.max(), ys.max()


def main():
    out_dir, stage, *clips = sys.argv[1:]
    reactions = ["idle", "hello", "celebrate"]
    os.makedirs(out_dir, exist_ok=True)

    decoded = {}
    union = None
    rest_box = None
    for reaction, path in zip(reactions, clips):
        frames = read_frames(path)
        bg = background_colour(frames[0])
        results = [alpha_mask(f, bg) for f in frames]
        alphas = [r[0] for r in results]
        frames = [r[1] for r in results]
        decoded[reaction] = (frames, alphas)
        for a in alphas:
            x0, y0, x1, y1 = bbox(a)
            union = (x0, y0, x1, y1) if union is None else (
                min(union[0], x0), min(union[1], y0), max(union[2], x1), max(union[3], y1))
        if reaction == "idle":
            rest_box = bbox(alphas[0])

    h, w = decoded["idle"][0][0].shape[:2]
    cx0 = max(0, union[0] - PAD)
    cy0 = max(0, union[1] - PAD)
    cx1 = min(w, union[2] + PAD)
    cy1 = min(h, union[3] + PAD)
    out_w = int(round((cx1 - cx0) * SCALE / 2) * 2)
    out_h = int(round((cy1 - cy0) * SCALE / 2) * 2)

    for reaction, (frames, alphas) in decoded.items():
        with tempfile.TemporaryDirectory() as tmp:
            for i, (frame, alpha) in enumerate(zip(frames, alphas)):
                rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
                rgba[:, :, 3] = alpha
                crop = rgba[cy0:cy1, cx0:cx1]
                crop = cv2.resize(crop, (out_w, out_h), interpolation=cv2.INTER_AREA)
                cv2.imwrite(os.path.join(tmp, f"f{i:04d}.png"), crop)
                if i == 0:
                    cv2.imwrite(os.path.join(out_dir, f"ari-{stage}-{reaction}-poster.png"), crop)
            target = os.path.join(out_dir, f"ari-{stage}-{reaction}.webm")
            subprocess.run([
                "ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(tmp, "f%04d.png"),
                "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "36",
                "-row-mt", "1", "-deadline", "good", "-an", target,
            ], check=True)

    rx0, ry0, rx1, ry1 = rest_box
    geometry = {
        "stage": stage,
        "video": {"width": out_w, "height": out_h},
        # Resting-pose body box inside the video, as fractions of the video size.
        "body": {
            "left": (rx0 - cx0) / (cx1 - cx0),
            "top": (ry0 - cy0) / (cy1 - cy0),
            "width": (rx1 - rx0) / (cx1 - cx0),
            "height": (ry1 - ry0) / (cy1 - cy0),
        },
    }
    with open(os.path.join(out_dir, f"ari-{stage}-geometry.json"), "w") as handle:
        json.dump(geometry, handle, indent=2)
    print(json.dumps(geometry))


if __name__ == "__main__":
    main()
