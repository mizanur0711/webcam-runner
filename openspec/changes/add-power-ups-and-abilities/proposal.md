## Why

While running and collecting stars provides score incentives, the gameplay lacks dynamic tactical variety and moment-to-moment excitement. Introducing temporary active power-ups (Star Magnet, Invincibility Shield, and Hyper Rocket Boost) gives players strategic survival choices, sudden high-speed surges, and high-energy visual feedback.

## What Changes

- **New Collectible Power-Up Items**: Introduce 3 distinct 3D power-up items on the track alongside stars:
  - 🧲 **Star Magnet**: Magnetically pulls stars from adjacent lanes directly to the player for 6 seconds.
  - 🛡️ **Invincibility Shield**: Surrounds the player with a glowing 3D energy bubble that absorbs 1 collision hit without ending the run.
  - 🚀 **Hyper Rocket Boost**: Grants invincible hyper-speed flight across all obstacles for 3.5 seconds with flame particles and motion blur.
- **Power-Up Manager & State Integration**:
  - `PowerUpManager`: Handles spawning, pooling, duration timers, active state toggles, and collision pickups.
  - `PowerUpRenderer`: Renders 3D rotating power-up items (Magnet, Shield, Rocket) and active visual aura/bubbles around the player.
- **HUD Active Power-Up Timer**: Displays active power-up badges and remaining duration countdown rings on the game HUD.

## Capabilities

### New Capabilities
- `power-ups`: Power-up spawning, pickup collection, active power-up effects (Star Magnet, Shield, Rocket Boost), duration management, visual aura rendering, and HUD timers.

### Modified Capabilities
<!-- None -->

## Impact

- **Affected Systems**: `CollectibleManager`, `CollisionDetector`, `GameStateMachine`, `ParticleManager`, `UIRenderer`, `ScoreManager`, `AudioManager`.
- **Dependencies**: No external npm dependencies required; built natively with HTML5 Canvas 2D / pseudo-3D and Web Audio API.
