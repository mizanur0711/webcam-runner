/**
 * Manages game score and persistence.
 */
export class ScoreManager {
    constructor() {
        this.STORAGE_KEY = 'runnerGame_highScore';
        this.currentScore = 0;
        this.highScore = 0;
        this.starsCollected = 0;
        this.isNewHighScore = false;
    }

    init() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.highScore = stored ? parseInt(stored, 10) : 0;
            if (isNaN(this.highScore)) this.highScore = 0;
        } catch (e) {
            console.warn("Could not access localStorage for high score", e);
            this.highScore = 0;
        }
        this.reset();
    }

    /**
     * @param {number} dt 
     * @param {number} speed 
     * @param {number} [multiplier=1.0]
     */
    update(dt, speed, multiplier = 1.0) {
        this.currentScore += dt * speed * 10 * multiplier;
        if (this.currentScore > this.highScore) {
            this.isNewHighScore = true;
        }
    }

    /**
     * Add collected stars and bonus score
     * @param {number} [count=1] 
     */
    addStar(count = 1) {
        this.starsCollected += count;
        this.currentScore += count * 50; // +50 bonus score points
        if (this.currentScore > this.highScore) {
            this.isNewHighScore = true;
        }
    }

    finalizeRun() {
        const finalScore = Math.floor(this.currentScore);
        if (this.isNewHighScore || finalScore > this.highScore) {
            this.highScore = finalScore;
            try {
                localStorage.setItem(this.STORAGE_KEY, this.highScore.toString());
            } catch (e) {
                console.warn("Could not save high score to localStorage", e);
            }
        }
    }

    reset() {
        this.currentScore = 0;
        this.starsCollected = 0;
        this.isNewHighScore = false;
    }
}

