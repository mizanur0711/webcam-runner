# Webcam-Controlled Kids Runner Game — Project Spec

## 1. Project Summary

A browser-based (Chrome only) endless runner game, in the style of Temple Run / Subway Surfer, designed for very young kids (ages 2–5). Instead of keyboard, mouse, or touch, the game is controlled entirely through the laptop's webcam: the child stands in front of the laptop, and their body movements (jumping, ducking, leaning left/right) steer an on-screen character through obstacles.

The game is fully client-side — no backend server, no account system, no video ever leaves the laptop. It runs as a static web page loaded in Chrome, using the laptop's built-in webcam.

**Core design goals:**
- Zero manual setup for the kid — no keyboard, no controller, no login
- Forgiving, toddler-friendly gesture detection (big, sloppy movements should still register)
- Auto-adapts difficulty and character to whichever kid is playing, using height estimation from the webcam feed
- Runs comfortably on modest, integrated-graphics hardware (see Section 6)

---

## 2. High-Level Workflow

The game is a state machine. Each state has a clear entry condition, exit condition, and what's rendered on screen.

```
IDLE  →  DETECTED  →  CALIBRATING  →  COUNTDOWN  →  PLAYING  ⇄ PAUSED
  ↑                                                      ↓
  └──────────────────────  GAME OVER  ←──────────────────┘
```

| State | Trigger to enter | What happens | Trigger to exit |
|---|---|---|---|
| **IDLE** | App load, or game over screen times out | Webcam runs in background at low frame rate; idle animation/screen shown ("Stand in front of the camera to play!") | A person is detected in frame with stable confidence |
| **DETECTED** | Stable person detected for ~1s | Brief "Get ready!" message | Auto-advances to calibration |
| **CALIBRATING** | — | 2–3 second still-pose capture: records baseline shoulder/hip position and bounding-box height | Calibration data captured successfully, or times out and retries |
| **COUNTDOWN** | Calibration success | 3-2-1 on-screen countdown with matching audio cues | Countdown reaches zero |
| **PLAYING** | Countdown ends | Main game loop: scrolling track, obstacle spawning, gesture-driven character control, live score | Collision with obstacle (→ GAME OVER), or player leaves frame (→ PAUSED) |
| **PAUSED** | Player leaves frame during PLAYING, or manual pause | Game freezes, "Come back!" or "Paused" overlay shown | Player re-detected in frame (auto-resume after brief re-stabilization), or manual resume |
| **GAME OVER** | Collision | Score shown, shared high score updated if beaten, short celebratory animation | Auto-returns to IDLE after a few seconds, or immediately on child leaving frame |

This loop is designed so a parent never has to touch the laptop after the initial page load — a kid can walk up, play, walk away, and another kid can walk up and play next, entirely hands-free.

---

## 3. Feature-by-Feature Explanation

### 3.1 Presence Detection (auto start)

**How it works:** The pose model runs continuously at a reduced frame rate (roughly 5–10 fps) whenever the game isn't actively in PLAYING state, to save CPU. It looks for a minimum set of confidently-detected landmarks (nose, both shoulders, both hips). If these stay above a confidence threshold continuously for about a second, the app treats a player as "present" and moves to calibration.

**Why the 1-second stabilization window:** A kid walking past the camera, a pet, or a passing shadow could otherwise trigger false starts. Requiring sustained detection filters most of this out without adding noticeable delay.

### 3.2 Calibration & Height-Tier Detection

**How it works:** Once a player is detected, the game asks them (via a simple visual cue — a character outline they need to "step into," rather than text, since toddlers can't read) to stand still for 2–3 seconds. During this window the game records:
- Baseline Y-position of shoulders and hips (the "neutral" pose, used later to detect jump/duck)
- Baseline X-position of the torso center (used later to detect left/right slides)
- The height of the player's bounding box relative to the camera frame (used for tier selection)

**Height-tier bucketing:** The bounding-box height is compared against two thresholds, sorting the player into one of three tiers:
- **Small** → "Cub" character, slowest base speed, most forgiving gesture thresholds, widest obstacle spacing
- **Medium** → "Scout" character, standard difficulty
- **Tall** → "Ranger" character, faster pace, tighter gesture thresholds

This single measurement drives both which character the kid sees (cosmetic) and how forgiving/fast the game is (mechanical) — one calibration step, two payoffs.

**Why relative to camera frame, not absolute cm:** Without depth sensing, you can't measure true height — you're measuring apparent height, which depends on distance from the camera too. Since you can't easily control how far a toddler stands, tier detection should be framed as "how much of the frame do you fill," and a floor sticker/marker (a low-tech physical cue like a piece of tape) can help keep standing distance roughly consistent, but isn't strictly required — the tiers are wide enough to tolerate a meter or so of drift.

### 3.3 Character Selection

Directly derived from the height tier above — no separate detection step. Once a tier is assigned, the corresponding character sprite is loaded for that session. No face recognition, no manual picker screen — this keeps the whole flow hands-free, which matters most for the 2-year-old case.

### 3.4 Gesture Controls

All gestures are measured **relative to the calibration baseline**, not fixed pixel values, so the same logic works regardless of the kid's actual size or distance from the camera.

| Gesture | Detection logic | In-game action |
|---|---|---|
| **Jump** | Hip Y-position moves upward past a threshold (a percentage of the player's calibrated torso height), held briefly, then returns | Character jumps over a low obstacle |
| **Duck** | Shoulder Y-position drops below baseline by a threshold percentage | Character ducks under a high obstacle |
| **Slide left / right** | Torso-center X-position crosses a left/right threshold from the calibrated center | Character moves to the corresponding lane |

**Cooldowns:** Each gesture has a short cooldown (roughly 300–500ms) after triggering, so a single duck or jump doesn't fire multiple times as the kid's body passes back through the threshold on the way to and from the pose.

**Tier-based tolerance:** Smaller/younger tiers get looser thresholds (less movement needed to register) and longer cooldowns (less likely to double-trigger from wobbly movement); taller/older tiers get tighter thresholds, which keeps the game meaningfully harder for a 5-year-old than a 2-year-old without changing the underlying logic.

### 3.5 Obstacle System & Difficulty Scaling

Obstacles spawn on a timer that's randomized within a tier-specific range (e.g., Small tier obstacles are spaced further apart in time than Ranger tier). Obstacle types map directly to the three gestures:
- Low obstacle → requires jump
- High/overhead obstacle → requires duck
- Side-blocking obstacle → requires slide left or right

Difficulty can optionally ramp within a single run (obstacles get slightly faster/denser the longer the run goes), independent of the tier-based starting difficulty.

### 3.6 Scoring & Persistence

Score increases automatically with survival time/distance (simplest and most toddler-friendly — no separate "coin collection" mechanic needed for an MVP, though it can be added later).

**Persistence:** A single shared high score, stored in the browser's `localStorage` on this laptop. No per-kid or per-tier breakdown — whoever's playing is compared against the same all-time best. This keeps the data model trivially simple: one key, one number, read on game-over and overwritten if beaten.

### 3.7 Pause / Resume (leaving and returning)

If the player disappears from frame mid-run (confidence drops below threshold for ~2 seconds, debounced similarly to presence detection), the game pauses rather than ending — this matters a lot for toddlers, who commonly wander off mid-activity and wander back. A visible "Paused — come back!" state is shown. When the player is re-detected and stable again, the game resumes after a short re-stabilization countdown (so it doesn't resume mid-gesture accidentally).

A manual pause affordance (e.g., spacebar, or a big on-screen button a parent can click) should also exist as a fallback, since gesture-based pause detection isn't reliable if a kid is still in frame but, say, sitting down mid-tantrum.

### 3.8 Audio/Visual Feedback

Given the audience, feedback should lean heavily visual and auditory rather than textual:
- Simple, cheerful sound cues for jump/duck/slide success, collision, and high score
- Large, high-contrast on-screen indicators rather than small text
- The countdown and calibration steps use visual metaphors (an outline to "step into," a filling progress ring) instead of instructions a non-reader can't parse

---

## 4. Edge Cases

Grouped by the part of the system they affect.

### Detection & Calibration
- **Poor lighting** (evening, backlit by a window): pose confidence drops. Detect this as a distinct state ("Can't see you clearly — try moving to better light") rather than silently failing or misreading it as "no player."
- **Two people in frame at once** (parent standing behind/beside the kid): use the largest/most centrally-positioned detected person as the active player, and ignore secondary detections rather than getting confused between them.
- **Kid right up against the camera** (very close, filling most of the frame): bounding-box height calculation can get skewed. Clamp tier detection to sane bounds, and if the frame is more than, say, 90% filled by one person, prompt them to step back before calibrating.
- **Kid mid-motion during calibration** (toddlers rarely stand still): calibration should re-capture rather than lock in a bad baseline if movement variance during the capture window is too high — silently retry once or twice before falling back to a looser default calibration.
- **Glasses/reflections or baggy clothing**: mostly a non-issue for pose-landmark models (they track skeletal points, not fine visual detail), but worth noting as a known limitation if detection seems flaky for a specific kid — not something you can fully engineer around.

### Presence / Session Flow
- **Kid walks away mid-run** → pause, not game-over (see 3.7).
- **Sibling swap mid-session**: if one kid walks away and a different kid walks up, the game will treat this as "player returned" and resume with the *previous* kid's tier/character rather than re-calibrating. Decide explicitly whether re-entry after a pause should re-run calibration (more correct, slightly slower) or trust the original calibration (faster, but wrong if it's actually a different kid) — recommend re-calibrating after any pause longer than a few seconds, since you can't otherwise tell it's a different child.
- **Camera permission denied or revoked mid-session**: show a clear, simple "camera access needed" state distinct from "no player detected," with a way to re-trigger the permission prompt.
- **Camera in use by another app**: Chrome will fail to acquire the stream; detect this on load and show a distinct error state rather than an infinite "waiting for player" screen.
- **Browser tab loses focus / laptop sleeps**: pause the pose-detection loop and game loop entirely (don't burn CPU in the background), resume cleanly on refocus rather than trying to catch up on "missed" frames.
- **Accidental page refresh mid-game**: since there's no account/session system, this simply restarts to IDLE — acceptable for this use case, but worth an explicit decision (vs. e.g. trying to persist an in-progress run, which isn't worth the complexity here).

### Gameplay
- **Kid raises hands instead of jumping** (a very common toddler instinct): if only hip/shoulder Y-position is used for jump detection, this naturally won't false-trigger, which is good — but you may want to explicitly test that arm-raising alone doesn't accidentally cross any threshold.
- **Kid squats instead of a clean duck**: squatting also lowers the hip position, not just shoulders — worth deciding whether a squat should *also* count as a duck (probably yes, for the youngest tier, since it's a natural and equally valid way to "get low").
- **False double-triggers from natural bounce/wobble**: mitigated by the per-gesture cooldown, but worth tuning per tier — a 2-year-old's natural stance sway is bigger than a 5-year-old's.
- **Local storage full/blocked** (rare, but some locked-down browser profiles disable storage): high-score save should fail gracefully (just don't persist) rather than crashing the game.

---

## 5. Performance Considerations for This Hardware

Your dev/target machine: Linux, Intel Core i5 (11th gen), 16GB RAM, 512GB SSD, integrated graphics (Iris Xe on most 11th-gen i5 mobile parts) — no discrete GPU.

- **Use the "lite" Pose Landmarker model**, not "full" or "heavy." The lite model is noticeably cheaper to run and, for large, deliberate toddler-scale movements, accuracy difference vs. the full model is not the bottleneck — detection *threshold tuning* matters more than model size here.
- **Downscale the webcam capture resolution** before feeding it to the model — request something like 640×480 from `getUserMedia` rather than full 1080p. Rendering can still use a larger canvas; only the *inference* input needs to be small. This is the single biggest lever for keeping CPU usage down.
- **Run inference at a capped rate**, not every animation frame — e.g., pose inference at 15–20fps while the game's visual render loop stays at 60fps via `requestAnimationFrame`. The gesture interpreter only needs a new landmark set roughly every other or every third rendered frame; more than that is wasted CPU.
- **Check GPU acceleration is actually active in Chrome on Linux.** Intel iGPU acceleration in Chrome on Linux (via VAAPI) isn't always enabled by default depending on distro/Chrome build — worth checking `chrome://gpu` before assuming MediaPipe's WebGL backend is getting hardware acceleration. If it's not, you'll be doing pose inference on CPU only, which is more noticeable on an 11th-gen i5 without a dGPU. Falling back to the WASM (CPU) backend with the lite model is still viable, just budget for it.
- **Watch for thermal throttling** during longer play sessions — sustained webcam capture + pose inference + canvas rendering for many minutes at a stretch on a laptop can trigger CPU throttling on 11th-gen i5 mobile chips, which would show up as increasing input lag over a session rather than a hard crash. Worth stress-testing a 10–15 minute continuous play session before considering it done.
- **16GB RAM and the 512GB SSD are both comfortably sufficient** for this — this is a lightweight client-side app with a small model and no large asset pipeline; RAM/storage aren't meaningful constraints here, CPU/GPU inference cost is the only real budget to manage.
- Keep other Chrome tabs/extensions to a minimum while testing — background tabs and extensions are a common, easy-to-overlook source of CPU contention that can make gesture detection feel laggy for reasons unrelated to your code.

---

## 6. Data Persistence Plan

Minimal by design, per your preference:

- **Storage:** browser `localStorage`, one key (e.g. `runnerGame_highScore`), one integer value.
- **Read:** on game load, to display "Best: N" somewhere in the UI.
- **Write:** on game-over, only if the current run's score exceeds the stored value.
- **No accounts, no per-kid/tier breakdown, no server sync** — entirely local to this laptop, which matches "one shared high score" as specified.
- **Failure handling:** if `localStorage` is unavailable or throws (private browsing edge cases, locked-down profiles), the game should simply not persist rather than erroring out — high score just resets each session in that case.

---

## 7. Open Assumptions (flag if any of these are wrong)

- Single webcam, single active player at a time (no simultaneous two-player mode).
- Chrome-only is fine — no cross-browser compatibility requirement.
- No sound requirement conflicts (i.e., it's fine for the game to play audio automatically without a mute-by-default requirement, though a mute button is a sensible addition).
- No need for a parent-facing settings/analytics dashboard beyond what's specified above — keep this out of MVP scope unless you want it added back in.
