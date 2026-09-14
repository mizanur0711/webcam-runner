## Purpose

Manages temporary active power-up collectibles (Star Magnet, Invincibility Shield, and Hyper Rocket Boost), including track spawning, collision pickup detection, active duration management, visual aura effects, and HUD timers.

## ADDED Requirements

### Requirement: Power-Up Spawning and Collection
The system SHALL periodically spawn 3D power-up items (Star Magnet 🧲, Invincibility Shield 🛡️, Hyper Rocket Boost 🚀) along the track in open lanes and detect when the player intersects them.

#### Scenario: Power-up item appears on lane
- **WHEN** the power-up spawn timer expires during an active run
- **THEN** the system SHALL spawn a randomly selected power-up item in a safe open lane at spawning distance

#### Scenario: Player collects a power-up
- **WHEN** the player character overlaps with an active power-up item position
- **THEN** the system SHALL deactivate the item on track, play a power-up pickup audio cue, and activate the corresponding power-up effect for its set duration

### Requirement: Star Magnet Effect
The system SHALL pull all collectible stars from adjacent lanes directly toward the player character while the Star Magnet effect is active.

#### Scenario: Star magnet pulls nearby stars
- **WHEN** the Star Magnet power-up is active and collectible stars enter proximity
- **THEN** the system SHALL smoothly pull the stars toward the player's current lane and position for automatic pickup

### Requirement: Invincibility Shield Effect
The system SHALL surround the player with a visual protective 3D shield bubble that absorbs one obstacle collision without ending the run.

#### Scenario: Shield absorbs obstacle collision
- **WHEN** the player impacts an obstacle while the Invincibility Shield is active
- **THEN** the system SHALL consume the shield, trigger a shield shatter particle burst, play a shield break sound, and keep the run active

### Requirement: Hyper Rocket Boost Effect
The system SHALL propel the player character into hyper-speed flight across all obstacles for 3.5 seconds with full invincibility and flame particle trails.

#### Scenario: Rocket boost invincibility and hyper speed
- **WHEN** the Hyper Rocket Boost power-up is activated
- **THEN** the system SHALL temporarily double forward game speed, elevate the player above obstacle hitboxes, and render rocket flame particle trails behind the character

### Requirement: Power-Up HUD Indicators
The system SHALL display an active power-up badge icon and a remaining duration countdown ring on the game HUD.

#### Scenario: Active power-up duration countdown displayed on HUD
- **WHEN** any power-up is currently active
- **THEN** the system SHALL render a glowing status badge with an animated countdown ring indicating the remaining effect duration in seconds
