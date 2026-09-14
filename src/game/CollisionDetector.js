/**
 * Handles lane-based collision detection with near-miss tolerance.
 */
export class CollisionDetector {
    /**
     * @param {object} player { lane, y, isJumping, isDucking, z, baseWidth, depth }
     * @param {Array<object>} obstacles 
     * @param {import('./PowerUpManager.js').PowerUpManager|null} [powerUpManager=null]
     * @returns {object|null}
     */
    check(player, obstacles, powerUpManager = null) {
        if (powerUpManager) {
            const activeType = powerUpManager.getActiveType();
            if (activeType === 'ROCKET') {
                return null; // Invincible hyper-speed flight
            }
        }

        for (const obs of obstacles) {
            if (!obs.active) continue;

            // Z-proximity
            const zDistance = Math.abs(obs.z - player.z);
            const zThreshold = (player.depth + obs.depth) / 2;
            
            // Anti-tunneling
            const crossed = (obs.prevZ >= player.z && obs.z <= player.z);

            if (zDistance <= zThreshold || crossed) {
                // X/Lane equality
                if (player.lane === obs.lane) {
                    let hit = false;
                    // Y / state logic
                    if (obs.type === 'LOW') {
                        if (player.y <= obs.baseHeight * 0.65) {
                            hit = true;
                        }
                    } else if (obs.type === 'HIGH') {
                        if (!player.isDucking) {
                            hit = true;
                        }
                    } else if (obs.type === 'SIDE') {
                        hit = true; // Must switch lanes
                    }

                    if (hit) {
                        // Shield absorption check
                        if (powerUpManager && powerUpManager.consumeShield()) {
                            obs.active = false; // Destroy obstacle on shield impact
                            obs.shieldAbsorbed = true; // Flag for particle/audio trigger
                            return null; // Hit absorbed safely!
                        }
                        return obs;
                    }
                }
            }
        }
        return null;
    }
}
