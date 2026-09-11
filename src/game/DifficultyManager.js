/**
 * Manages game difficulty based on player tier and run duration.
 */
export class DifficultyManager {
    constructor() {
        this.TIERS = {
            'SMALL': { baseSpeed: 3, obstacleIntervalMin: 2.5, obstacleIntervalMax: 4.0, speedRampRate: 0.03, maxSpeedMultiplier: 1.5 },
            'MEDIUM': { baseSpeed: 5, obstacleIntervalMin: 1.5, obstacleIntervalMax: 3.0, speedRampRate: 0.04, maxSpeedMultiplier: 1.8 },
            'TALL': { baseSpeed: 7, obstacleIntervalMin: 1.0, obstacleIntervalMax: 2.0, speedRampRate: 0.05, maxSpeedMultiplier: 2.0 }
        };
        this.currentTier = 'MEDIUM';
        this.config = this.TIERS[this.currentTier];
        this.elapsed = 0;
    }

    /**
     * @param {string} tier 
     */
    init(tier) {
        if (this.TIERS[tier]) {
            this.currentTier = tier;
            this.config = this.TIERS[tier];
        } else {
            console.warn(`Unknown tier ${tier}, defaulting to MEDIUM`);
            this.currentTier = 'MEDIUM';
            this.config = this.TIERS['MEDIUM'];
        }
        this.reset();
    }

    /**
     * @param {number} dt 
     */
    update(dt) {
        this.elapsed += dt;
    }

    /**
     * @returns {number}
     */
    getCurrentSpeed() {
        return this.config.baseSpeed * (1 + Math.min(this.elapsed * this.config.speedRampRate, this.config.maxSpeedMultiplier - 1));
    }

    /**
     * @returns {number}
     */
    getObstacleInterval() {
        const min = this.config.obstacleIntervalMin;
        const max = this.config.obstacleIntervalMax;
        const randomBase = min + Math.random() * (max - min);
        const speedMultiplier = this.getCurrentSpeed() / this.config.baseSpeed;
        return randomBase / speedMultiplier;
    }

    reset() {
        this.elapsed = 0;
    }

    /**
     * @param {string} tier 
     * @returns {object}
     */
    getTierConfig(tier) {
        return this.TIERS[tier] || this.TIERS['MEDIUM'];
    }
}
