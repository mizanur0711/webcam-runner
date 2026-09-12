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
        this.lastType = null;
        this.lastLane = null;
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
            const spawnedType = this.spawn();
            let interval = (this.difficultyManager && typeof this.difficultyManager.getObstacleInterval === 'function')
                ? this.difficultyManager.getObstacleInterval()
                : 2.5;

            // Extra recovery padding after JUMP (LOW) or DUCK (HIGH) obstacles so player lands cleanly!
            if (spawnedType === 'LOW' || spawnedType === 'HIGH') {
                interval += 0.5;
            }

            this.spawnTimer = interval;
        }
    }

    spawn(initialZ) {
        const obs = this.pool.find(o => !o.active);
        if (!obs) return null;

        let type;
        let lane;

        // Try up to 5 times to pick a type and lane that does NOT repeat identical lane & type back-to-back
        for (let attempt = 0; attempt < 5; attempt++) {
            const rand = Math.random();
            if (rand < 0.45) type = 'LOW';
            else if (rand < 0.75) type = 'HIGH';
            else type = 'SIDE';

            const lanes = [-1, 0, 1];
            lane = lanes[Math.floor(Math.random() * lanes.length)];

            // Avoid repeating identical type in identical lane back-to-back
            if (type !== this.lastType || lane !== this.lastLane) {
                break;
            }
        }

        this.lastType = type;
        this.lastLane = lane;

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

        return type;
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
        this.lastType = null;
        this.lastLane = null;
        // First obstacle spawns after 1.2s to let player settle in
        this.spawnTimer = 1.2;
    }
}

