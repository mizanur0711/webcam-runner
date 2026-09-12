/**
 * Manages collectible star items (pooling, spawning, movement, pickup collision).
 */
export class CollectibleManager {
    constructor() {
        this.POOL_SIZE = 12;
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
     */
    update(dt, speed, activeObstacles = []) {
        const moveDist = speed * 60 * dt;

        // Move and rotate active collectibles
        for (const item of this.pool) {
            if (item.active) {
                item.prevZ = item.z;
                item.z -= moveDist;
                item.rotation += dt * 3.5; // continuous spin animation

                if (item.z < -100) {
                    item.active = false;
                }
            }
        }

        // Spawn timer
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawn(activeObstacles);
            this.spawnTimer = 1.2 + Math.random() * 1.5; // Frequent star spawns for kid engagement
        }
    }

    /**
     * Spawns a collectible star in a safe position or above a low hurdle
     * @param {Array<object>} activeObstacles 
     */
    spawn(activeObstacles = []) {
        const item = this.pool.find(i => !i.active);
        if (!item) return;

        const lanes = [-1, 0, 1];
        // Pick a random lane
        const lane = lanes[Math.floor(Math.random() * lanes.length)];

        // Check if there is an obstacle at spawning distance (Z ~ 1800) in this lane
        const obstacleInLane = activeObstacles.find(obs => obs.lane === lane && obs.z > 1400);

        let yPos = 30; // standard ground-level float height
        if (obstacleInLane) {
            if (obstacleInLane.type === 'LOW') {
                // Place star above the LOW hurdle so jumping collects it!
                yPos = 125;
            } else {
                // Skip spawning in lane occupied by HIGH or SIDE obstacle at spawning distance
                return;
            }
        }

        item.active = true;
        item.collected = false;
        item.lane = lane;
        item.x = lane * 180;
        item.y = yPos;
        item.z = 1800;
        item.prevZ = item.z;
        item.rotation = Math.random() * Math.PI * 2;
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
                const inZRange = item.z <= 380 && item.z >= 240;
                const inSameLane = (item.lane === player.lane);

                // Y-distance check (ground vs jumping)
                const yDist = Math.abs(item.y - playerY);
                const inYRange = yDist < 85;

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
        this.spawnTimer = 0.8;
    }
}
