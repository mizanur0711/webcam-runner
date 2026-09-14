## Context

The game currently manages ground/hurdle stars in `CollectibleManager.js` and player state in `GameStateMachine.js`. To support active power-ups without cluttering existing managers, we will create a dedicated `PowerUpManager.js` and `PowerUpRenderer.js` following the established architecture of `ParticleManager` and `ObstacleManager`.

## Goals / Non-Goals

**Goals:**
- Modular `PowerUpManager` handling power-up item pooling (8 items max), spawn timers (~4-6s interval), and active duration counters.
- Visual rendering of 3D rotating power-up items on track and active aura effects (glowing magnet aura, 3D shield bubble, rocket exhaust flames) around player.
- Star Magnet logic attracting stars from adjacent lanes toward player position in `CollectibleManager`.
- Rocket Hyper Boost speed override and flight altitude in `GameStateMachine`.
- Shield collision absorption check in `CollisionDetector`.

**Non-Goals:**
- Persistent power-up inventory store or microtransactions.
- Stackable simultaneous power-up effects (collecting a new power-up replaces or refreshes active power-up).

## Decisions

### Decision 1: Dedicated PowerUpManager vs extending CollectibleManager
- **Choice**: Create `PowerUpManager.js` as a separate subsystem.
- **Rationale**: Keeps star collection and special ability timers decoupled, allowing clean testing and maintenance.

### Decision 2: Magnet Pull Vector Calculation
- **Choice**: Lerp star `x` position toward `player.visualX` when star `z` is within 600 units and `activePowerUp === 'MAGNET'`.
- **Rationale**: Provides smooth visual magnetic attraction without teleportation or physics glitches.

### Decision 3: Rocket Boost Invincibility Scoping
- **Choice**: When `activePowerUp === 'ROCKET'`, `CollisionDetector` skips obstacle hit checks and player height `y` is set to flight altitude (120px).
- **Rationale**: Gives exhilarating hyper-speed invincibility while spawning rocket flame particles.

## Risks / Trade-offs

- **[Risk] High speed during Rocket Boost causing obstacle collision skipping bugs**:
  - **Mitigation**: Collision checks are explicitly bypassed during Rocket Boost active timer, ensuring clean flight.
- **[Risk] HUD visual clutter with multiple badges**:
  - **Mitigation**: Power-ups use a single active slot with a clean circular arc countdown timer next to the score.
