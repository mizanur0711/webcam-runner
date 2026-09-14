## 1. Power-Up Subsystems

- [x] 1.1 Create `src/game/PowerUpManager.js` with pooling (8 items max), random interval spawning (~4-6s), collision pickup checks, and active effect timer management. Verify file compiles and exports class.
- [x] 1.2 Create `src/renderer/PowerUpRenderer.js` to render 3D rotating Magnet 🧲, Shield 🛡️, and Rocket 🚀 items on track plus visual player aura/shield bubbles. Verify rendering methods work without errors.

## 2. Ability Mechanisms & State Integration

- [x] 2.1 Integrate Star Magnet pulling logic in `src/game/CollectibleManager.js` to lerp star positions toward player lane when Star Magnet effect is active. Verify stars smoothly converge on player.
- [x] 2.2 Update `src/game/CollisionDetector.js` to support Invincibility Shield collision absorption (consumes shield on hit) and Rocket Boost invincibility bypass. Verify hits are absorbed without ending the run.
- [x] 2.3 Integrate Hyper Rocket Boost speed multiplier and flight altitude in `src/game/GameStateMachine.js` with rocket flame particle emissions in `ParticleManager.js`. Verify flight animation and particles.

## 3. UI HUD Timers & Audio Sound Synthesis

- [x] 3.1 Update `src/renderer/UIRenderer.js` to display active power-up badge icon and animated circular countdown ring. Verify HUD countdown renders cleanly.
- [x] 3.2 Add synthesized Web Audio sound effects for power-up pickup, shield shatter, and rocket flight in `src/audio/AudioManager.js`. Verify audio playback on pickups.

## 4. Subsystem Wiring & Build Verification

- [x] 4.1 Wire `PowerUpManager` and `PowerUpRenderer` into `src/main.js` and `GameStateMachine.js`. Verify full game loop integration.
- [x] 4.2 Run production build `npm run build` and verify 0 compilation errors or warnings.
