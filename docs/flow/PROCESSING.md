# Running companion animation clips

This guide supplements [the Google Flow clip recipe](README.md) with the instructions for processing the three downloaded clips for each growth stage.

## Run it

Put the three Flow downloads for a stage next to each other, then run:

```bash
python3 scripts/companion-clips/process_clip.py public/companion child idle.mp4 hello.mp4 celebrate.mp4
```

The script writes `ari-<stage>-{idle,hello,celebrate}.webm` and prints the body box. Copy the box into `STAGE_CLIPS` in `src/frontend/companion/clips.ts`. Posters and the geometry JSON are only for checking; you don't need to commit them.

Needs Python 3 with `opencv-python` and `numpy`, plus `ffmpeg` with `libvpx-vp9`.
