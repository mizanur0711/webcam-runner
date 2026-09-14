/**
 * Manages power-up item pooling, spawning on track, collision pickups, and active ability timers.
 */
export class PowerUpManager {
  constructor() {
    this.POOL_SIZE = 8;
    this.pool = [];
    for (let i = 0; i < this.POOL_SIZE; i++) {
      this.pool.push({
        active: false,
        type: 'MAGNET', // 'MAGNET' | 'SHIELD' | 'ROCKET'
        lane: 0,
        x: 0,
        y: 35,
        z: 0,
        rotation: 0,
        floatTime: 0
      });
    }

    this.spawnTimer = 0;
    this.activeEffect = null; // { type: string, remainingTime: number, maxDuration: number }
  }

  init() {
    this.reset();
  }

  reset() {
    for (const item of this.pool) {
      item.active = false;
    }
    this.spawnTimer = 3.0; // first power-up spawns 3s into run
    this.activeEffect = null;
  }

  /**
   * Update active effect timer & move power-up items along Z axis
   * @param {number} dt 
   * @param {number} speed 
   * @param {Array<object>} activeObstacles 
   */
  update(dt, speed, activeObstacles = []) {
    const moveDist = speed * 60 * dt;

    // Move power-up items on track
    for (const item of this.pool) {
      if (item.active) {
        item.z -= moveDist;
        item.rotation += dt * 3.0;
        item.floatTime += dt * 4.0;
        item.y = 35 + Math.sin(item.floatTime) * 12; // gentle floating hover

        if (item.z < -100) {
          item.active = false;
        }
      }
    }

    // Spawn timer for new power-up items
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn(activeObstacles);
      this.spawnTimer = 4.5 + Math.random() * 2.5; // Every 4.5 - 7.0 seconds
    }

    // Active power-up effect countdown timer
    if (this.activeEffect) {
      this.activeEffect.remainingTime -= dt;
      if (this.activeEffect.remainingTime <= 0) {
        this.activeEffect = null;
      }
    }
  }

  /**
   * Spawns a random power-up item in a safe open lane
   * @param {Array<object>} activeObstacles 
   */
  spawn(activeObstacles = []) {
    // Only spawn if player doesn't already have an active power-up or items on track
    const activeOnTrack = this.pool.filter(i => i.active).length;
    if (activeOnTrack >= 2) return;

    const types = ['MAGNET', 'SHIELD', 'ROCKET'];
    const type = types[Math.floor(Math.random() * types.length)];

    const lanes = [-1, 0, 1];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    // Check if lane is blocked by obstacle at spawning distance (Z ~ 1800)
    const blocked = activeObstacles.some(obs => obs.lane === lane && obs.z > 1400);
    if (blocked && type !== 'ROCKET') return;

    const item = this.pool.find(i => !i.active);
    if (!item) return;

    item.active = true;
    item.type = type;
    item.lane = lane;
    item.x = lane * 180;
    item.y = 35;
    item.z = 1800;
    item.rotation = Math.random() * Math.PI * 2;
    item.floatTime = Math.random() * Math.PI;
  }

  /**
   * Check collision between player and power-up items
   * @param {object} player 
   * @returns {string|null} Type of power-up picked up, or null
   */
  checkPickups(player) {
    const playerY = player.y;

    for (const item of this.pool) {
      if (item.active) {
        const inZRange = item.z <= 420 && item.z >= 220;
        const inSameLane = (item.lane === player.lane);
        const inYRange = Math.abs(item.y - playerY) < 110;

        if (inZRange && inSameLane && inYRange) {
          item.active = false;
          this.activatePowerUp(item.type);
          return item.type;
        }
      }
    }
    return null;
  }

  /**
   * Activate a power-up effect
   * @param {string} type 
   */
  activatePowerUp(type) {
    const durations = {
      'MAGNET': 6.0,
      'SHIELD': 12.0, // shield lasts 12s or until hit
      'ROCKET': 3.5
    };

    const maxDuration = durations[type] || 5.0;
    this.activeEffect = {
      type,
      remainingTime: maxDuration,
      maxDuration
    };
  }

  /**
   * Consume active shield on hit
   * @returns {boolean} True if shield was active and consumed
   */
  consumeShield() {
    if (this.activeEffect && this.activeEffect.type === 'SHIELD') {
      this.activeEffect = null;
      return true;
    }
    return false;
  }

  /**
   * @returns {Array<object>} Active power-up items on track
   */
  getActivePowerUps() {
    return this.pool.filter(i => i.active);
  }

  /**
   * @returns {string|null} Current active power-up type
   */
  getActiveType() {
    return this.activeEffect ? this.activeEffect.type : null;
  }
}
