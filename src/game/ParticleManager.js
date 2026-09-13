/**
 * Manages 3D particle systems (running footstep dust, jump landing burst,
 * star collection sparkles, and celebratory confetti showers).
 */
export class ParticleManager {
    constructor() {
        this.POOL_SIZE = 120;
        this.pool = [];
        for (let i = 0; i < this.POOL_SIZE; i++) {
            this.pool.push({
                active: false,
                type: 'DUST', // DUST, SPARKLE, CONFETTI, RING
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                size: 5,
                color: '#fff',
                life: 0,
                maxLife: 1.0,
                rotation: 0,
                vRot: 0
            });
        }
        this.dustTimer = 0;
    }

    init() {
        this.reset();
    }

    /**
     * Update active particles physics
     * @param {number} dt 
     * @param {number} speed 
     */
    update(dt, speed) {
        const zMovement = speed * 60 * dt;

        for (const p of this.pool) {
            if (p.active) {
                p.life -= dt;
                if (p.life <= 0) {
                    p.active = false;
                    continue;
                }

                // Physics movement
                p.x += p.vx * dt * 60;
                p.y += p.vy * dt * 60;
                p.z += (p.vz - speed * 0.4) * dt * 60;
                p.rotation += p.vRot * dt;

                // Specific particle type behavior
                if (p.type === 'DUST') {
                    p.vy += 0.8 * dt; // float upward slightly
                    p.size += dt * 8; // expand
                } else if (p.type === 'SPARKLE') {
                    p.vy -= 1.5 * dt; // gravity
                    p.size = Math.max(0.5, p.size - dt * 10);
                } else if (p.type === 'CONFETTI') {
                    p.vy -= 4.0 * dt; // falling gravity
                    p.vx += Math.sin(Date.now() / 150 + p.z) * 0.5 * dt; // fluttering drift
                } else if (p.type === 'RING') {
                    p.size += dt * 45; // rapid ring expansion
                }
            }
        }
    }

    /**
     * Emit running footstep dust at character's feet
     * @param {number} worldX 
     * @param {number} worldZ 
     */
    emitFootstepDust(worldX, worldZ) {
        for (let i = 0; i < 2; i++) {
            const p = this.getFreeParticle();
            if (!p) break;

            p.active = true;
            p.type = 'DUST';
            p.x = worldX + (Math.random() * 20 - 10);
            p.y = 2;
            p.z = worldZ + (Math.random() * 15 - 7);
            p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = 0.5 + Math.random() * 1.0;
            p.vz = -1 + Math.random() * 0.5;
            p.size = 8 + Math.random() * 6;
            p.color = 'rgba(230, 230, 230, 0.45)';
            p.life = 0.35 + Math.random() * 0.2;
            p.maxLife = p.life;
        }
    }

    /**
     * Emit landing impact ring and dust burst
     * @param {number} worldX 
     * @param {number} worldZ 
     */
    emitLandingBurst(worldX, worldZ) {
        // Landing Ring
        const ring = this.getFreeParticle();
        if (ring) {
            ring.active = true;
            ring.type = 'RING';
            ring.x = worldX;
            ring.y = 2;
            ring.z = worldZ;
            ring.vx = 0; ring.vy = 0; ring.vz = 0;
            ring.size = 12;
            ring.color = 'rgba(255, 255, 255, 0.7)';
            ring.life = 0.25;
            ring.maxLife = 0.25;
        }

        // Landing Dust Burst
        for (let i = 0; i < 8; i++) {
            const p = this.getFreeParticle();
            if (!p) break;

            const angle = (i / 8) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;

            p.active = true;
            p.type = 'DUST';
            p.x = worldX;
            p.y = 3;
            p.z = worldZ;
            p.vx = Math.cos(angle) * speed;
            p.vy = 1.0 + Math.random() * 1.5;
            p.vz = Math.sin(angle) * speed;
            p.size = 10 + Math.random() * 8;
            p.color = 'rgba(240, 240, 240, 0.55)';
            p.life = 0.4 + Math.random() * 0.25;
            p.maxLife = p.life;
        }
    }

    /**
     * Emit golden star pickup sparkles
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {number} worldZ 
     */
    emitStarSparkles(worldX, worldY, worldZ) {
        const colors = ['#FFE066', '#FFD700', '#FFB300', '#FFFFFF', '#FF8F00'];
        for (let i = 0; i < 14; i++) {
            const p = this.getFreeParticle();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 5;

            p.active = true;
            p.type = 'SPARKLE';
            p.x = worldX;
            p.y = worldY;
            p.z = worldZ;
            p.vx = Math.cos(angle) * spd;
            p.vy = (Math.random() - 0.2) * spd;
            p.vz = Math.sin(angle) * spd;
            p.size = 12 + Math.random() * 10;
            p.color = colors[Math.floor(Math.random() * colors.length)];
            p.life = 0.4 + Math.random() * 0.3;
            p.maxLife = p.life;
        }
    }

    /**
     * Emit celebratory high score confetti shower
     */
    emitConfettiShower() {
        const colors = ['#FF4081', '#00E5FF', '#FFEB3B', '#76FF03', '#7C4DFF', '#FF9100'];
        for (let i = 0; i < 60; i++) {
            const p = this.getFreeParticle();
            if (!p) break;

            p.active = true;
            p.type = 'CONFETTI';
            p.x = (Math.random() - 0.5) * 550;
            p.y = 220 + Math.random() * 120; // Above camera
            p.z = 250 + Math.random() * 300;
            p.vx = (Math.random() - 0.5) * 2.5;
            p.vy = -1 - Math.random() * 2.5;
            p.vz = (Math.random() - 0.5) * 1.5;
            p.size = 8 + Math.random() * 6;
            p.color = colors[Math.floor(Math.random() * colors.length)];
            p.rotation = Math.random() * Math.PI * 2;
            p.vRot = (Math.random() - 0.5) * 8;
            p.life = 1.8 + Math.random() * 1.2;
            p.maxLife = p.life;
        }
    }

    getFreeParticle() {
        return this.pool.find(p => !p.active);
    }

    getActiveParticles() {
        return this.pool.filter(p => p.active);
    }

    reset() {
        for (const p of this.pool) {
            p.active = false;
        }
        this.dustTimer = 0;
    }
}
