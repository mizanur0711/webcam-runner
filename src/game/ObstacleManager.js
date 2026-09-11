/**
 * Manages obstacle spawning, pooling, and movement.
 */
export class ObstacleManager {
    constructor() {
        this.POOL_SIZE = 15;
        this.pool = [];
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool.push({
                active: false,
                type: 'LOW',
                lane: 0,
                x: 0,
                y: 0,
                z: 0,
                baseWidth: 0,
                baseHeight: 0,
                color: '#fff',
                depth: 0,
                prevZ: 0
            });
        }
        this.spawnTimer = 0;
        this.difficultyManager = null;
    }

    /**
     * @param {import('./DifficultyManager.js').DifficultyManager} difficultyManager 
     */
    init(difficultyManager) {
        this.difficultyManager = difficultyManager;
        this.reset();
    }

    /**
     * @param {number} dt 
     * @param {number} speed 
     */
    update(dt, speed) {
        // Move active obstacles
        const moveDist = speed * 60 * dt;
        for (const obs of this.pool) {
            if (obs.active) {
                obs.prevZ = obs.z;
                obs.z -= moveDist;
                if (obs.z < -100) {
                    obs.active = false;
                }
            }
        }

        // Spawn logic
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawn();
            this.spawnTimer = this.difficultyManager.getObstacleInterval();
        }
    }

    spawn(initialZ) {
        const obs = this.pool.find(o => !o.active);
        if (!obs) return;

        const rand = Math.random();
        let type;
        if (rand < 0.4) type = 'LOW';
        else if (rand < 0.7) type = 'HIGH';
        else type = 'SIDE';

        let lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1

        obs.active = true;
        obs.type = type;
        obs.lane = lane;
        obs.x = lane * 180;
        obs.z = initialZ || 1800;
        obs.prevZ = obs.z;

        if (type === 'LOW') {
            obs.baseWidth = 100; obs.baseHeight = 50; obs.y = 0; obs.depth = 40;
        } else if (type === 'HIGH') {
            obs.baseWidth = 220; obs.baseHeight = 40; obs.y = 100; obs.depth = 40;
        } else if (type === 'SIDE') {
            obs.baseWidth = 80; obs.baseHeight = 140; obs.y = 0; obs.depth = 40;
        }
    }

    /**
     * @returns {Array<object>}
     */
    getActiveObstacles() {
        return this.pool.filter(o => o.active);
    }

    reset() {
        for (const obs of this.pool) {
            obs.active = false;
        }
        // First obstacle spawns quickly (0.5s)
        this.spawnTimer = 0.5;
    }
}
