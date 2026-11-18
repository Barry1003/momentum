# Companion animation clips (Google Flow)

Every growth stage uses the **same recipe**, so the animations look the same as the character grows.

## Frames
- `ari-<stage>-start.png` is 720×1280 (9:16).
- The character is always 880 px tall, horizontally centred, with feet 170 px above the bottom edge.
- The background is flat cream `#F9F2E5`.
- Use the same image as both the **Start** and **End** frame, so every clip begins and ends in the resting pose and loops cleanly.

## Flow settings
- Video, Frames mode, 9:16, Omni 1.2 Flash, 720p, x1.
- Length: idle 4 s, hello 4 s, celebrate 4 s.

## Prompt template
Change only the `Action:` sentence.

> 2D anime character animation of the exact same boy from the reference frame: same face, hair, outfit, colors and art style. Locked static camera, no zoom, no pan. Flat plain cream background (#F9F2E5) that never changes, no shadows, no props, no text. Full body always in frame, feet stay planted in the same spot. Action: … Gentle, friendly, smooth motion.

| Reaction | Action sentence |
|---|---|
| idle | he breathes gently, sways very slightly and blinks twice, hands stay in his pockets, then returns exactly to the starting pose. |
| hello | he blinks, takes his right hand out of his jacket pocket and waves hello at the viewer twice with a big warm smile, then puts his hand back in his pocket and returns exactly to the starting pose. |
| celebrate | he smiles widely with happy closed eyes, does one small joyful hop with both fists up, lands, puts his hands back in his pockets and returns exactly to the starting pose. |

## Processing
The raw MP4s go through the same script: cream key-out, trim, loop check, then 480 px WebM (VP9 + alpha) and MP4.
