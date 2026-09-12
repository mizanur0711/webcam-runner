/**
 * Manages game difficulty based on explicit level selection (EASY, MEDIUM, HARD)
 * and player run duration.
 */
export class DifficultyManager {
    constructor() {
        this.LEVELS = {
            'EASY': {
                name: 'EASY',
                label: '🌱 Easy',
                baseSpeed: 3.5,
                obstacleIntervalMin: 2.8,
                obstacleIntervalMax: 4.0,
                speedRampRate: 0.015,
                maxSpeedMultiplier: 1.4,
                scoreMultiplier: 1.0
            },
            'MEDIUM': {
                name: 'MEDIUM',
                label: '⚡ Medium',
                baseSpeed: 5.0,
                obstacleIntervalMin: 2.2,
                obstacleIntervalMax: 3.2,
                speedRampRate: 0.028,
                maxSpeedMultiplier: 1.8,
                scoreMultiplier: 1.5
            },
            'HARD': {
                name: 'HARD',
                label: '🔥 Hard',
                baseSpeed: 7.2,
                obstacleIntervalMin: 1.8,
                obstacleIntervalMax: 2.4,
                speedRampRate: 0.045,
                maxSpeedMultiplier: 2.2,
                scoreMultiplier: 2.0
            }
        };

        // Load persisted difficulty or default to EASY for toddler suitability
        const savedLevel = localStorage.getItem('webcam_runner_difficulty');
        this.currentLevel = (savedLevel && this.LEVELS[savedLevel]) ? savedLevel : 'EASY';
        this.config = this.LEVELS[this.currentLevel];
        this.elapsed = 0;
    }

    /**
     * Set active difficulty level (EASY, MEDIUM, HARD)
     * @param {string} level 
     */
    setLevel(level) {
        const lvlUpper = (level || '').toUpperCase();
        if (this.LEVELS[lvlUpper]) {
            this.currentLevel = lvlUpper;
            this.config = this.LEVELS[lvlUpper];
            localStorage.setItem('webcam_runner_difficulty', lvlUpper);
        }
    }

    /**
     * @param {string} tier 
     */
    init(tier) {
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
        return min + Math.random() * (max - min);
    }


    /**
     * @returns {number}
     */
    getScoreMultiplier() {
        return this.config.scoreMultiplier || 1.0;
    }

    /**
     * @returns {string}
     */
    getBadge() {
        return this.config.label;
    }

    reset() {
        this.elapsed = 0;
    }
}

