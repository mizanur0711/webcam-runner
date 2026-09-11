/**
 * Handles lane-based collision detection with near-miss tolerance.
 */
export class CollisionDetector {
    /**
     * @param {object} player { lane, y, isJumping, isDucking, z, baseWidth, depth }
     * @param {Array<object>} obstacles 
     * @returns {object|null}
     */
    check(player, obstacles) {
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
                    // Y / state logic
                    if (obs.type === 'LOW') {
                        if (player.y <= obs.baseHeight * 0.65) {
                            return obs;
                        }
                    } else if (obs.type === 'HIGH') {
                        if (!player.isDucking) {
                            return obs;
                        }
                    } else if (obs.type === 'SIDE') {
                        return obs; // Must switch lanes
                    }
                }
            }
        }
        return null;
    }
}
