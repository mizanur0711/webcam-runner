/**
 * Manages collectible star items (pooling, spawning, movement, pickup collision).
 */
export class CollectibleManager {
    constructor() {
        this.POOL_SIZE = 24;
        this.pool = [];
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool.push({
                active: false,
                lane: 0,
                x: 0,
                y: 0,
                z: 0,
                prevZ: 0,
                radius: 35,
                collected: false,
                rotation: 0
            });
        }
        this.spawnTimer = 0;
    }

    init() {
        this.reset();
    }

    /**
     * @param {number} dt 
     * @param {number} speed 
     * @param {Array<object>} activeObstacles 
     * @param {boolean} [isMagnetActive=false]
     * @param {object} [player=null]
     */
    update(dt, speed, activeObstacles = [], isMagnetActive = false, player = null) {
        const moveDist = speed * 60 * dt;

        // Move and rotate active collectibles
        for (const item of this.pool) {
            if (item.active) {
                item.prevZ = item.z;
                item.z -= moveDist;
                item.rotation += dt * 4.0; // dynamic spin animation

                // Star Magnet Attraction Logic
                if (isMagnetActive && player && item.z < 800 && item.z > 150) {
                    const targetX = player.visualX !== undefined ? player.visualX : (player.lane * 180);
                    const decay = 1 - Math.exp(-14 * dt);
                    item.x += (targetX - item.x) * decay;
                    item.lane = player.lane; // sync lane for pickup collision check
                }

                if (item.z < -100) {
                    item.active = false;
                }
            }
        }

        // Spawn timer — balanced star spawns (~1.05s delay) to avoid visual congestion
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawn(activeObstacles);
            this.spawnTimer = 0.75 + Math.random() * 0.6; // Spawns stars every ~0.75 - 1.35 seconds
        }
    }

    /**
     * Spawns a collectible star line/single in a safe position or above a low hurdle
     * @param {Array<object>} activeObstacles 
     */
    spawn(activeObstacles = []) {
        const lanes = [-1, 0, 1];
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        // Check if there is an obstacle at spawning distance (Z ~ 1800) in this lane
        const obstacleInLane = activeObstacles.find(obs => obs.lane === lane && obs.z > 1400);

        let yPos = 30; // standard ground-level float height
        if (obstacleInLane) {
            if (obstacleInLane.type === 'LOW') {
                // Place star sequence above the LOW hurdle so jumping collects them!
                yPos = 130;
            } else {
                // Skip spawning in lane occupied by HIGH or SIDE obstacle at spawning distance
                return;
            }
        }

        // 30% chance to spawn a pair of 2 stars in a row
        const count = Math.random() < 0.3 ? 2 : 1;

        for (let k = 0; k < count; k++) {
            const item = this.pool.find(i => !i.active);
            if (!item) break;

            item.active = true;
            item.collected = false;
            item.lane = lane;
            item.x = lane * 180;
            item.y = yPos;
            item.z = 1800 + (k * 160); // space stars out cleanly in z
            item.prevZ = item.z;
            item.rotation = Math.random() * Math.PI * 2;
        }
    }

    /**
     * Checks pickup collision between player and active collectibles
     * @param {object} player 
     * @returns {number} Count of collected items in this frame
     */
    checkPickups(player) {
        let collectedCount = 0;
        const playerY = player.y;

        for (const item of this.pool) {
            if (item.active && !item.collected) {
                // Check if player is near Z=320 (player position)
                const inZRange = item.z <= 420 && item.z >= 220;
                const inSameLane = (item.lane === player.lane);

                // Y-distance check (ground vs jumping)
                const yDist = Math.abs(item.y - playerY);
                const inYRange = yDist < 105;

                if (inZRange && inSameLane && inYRange) {
                    item.collected = true;
                    item.active = false;
                    collectedCount++;
                }
            }
        }

        return collectedCount;
    }

    /**
     * @returns {Array<object>}
     */
    getActiveCollectibles() {
        return this.pool.filter(i => i.active && !i.collected);
    }

    reset() {
        for (const item of this.pool) {
            item.active = false;
            item.collected = false;
        }
        this.spawnTimer = 0.7;
    }
}
