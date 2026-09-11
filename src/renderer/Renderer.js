export class Renderer {
    constructor({ bgCanvas, gameCanvas, uiCanvas, pipCanvas }) {
        this.bgCanvas = bgCanvas;
        this.gameCanvas = gameCanvas;
        this.uiCanvas = uiCanvas;
        this.pipCanvas = pipCanvas;
        this.width = 960;
        this.height = 540;
    }

    init() {
        if (this.bgCanvas) this.bgCtx = this.bgCanvas.getContext('2d');
        if (this.gameCanvas) this.gameCtx = this.gameCanvas.getContext('2d');
        if (this.uiCanvas) this.uiCtx = this.uiCanvas.getContext('2d');
        if (this.pipCanvas) this.pipCtx = this.pipCanvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = 960;
        this.height = 540;

        const canvases = [this.bgCanvas, this.gameCanvas, this.uiCanvas];
        canvases.forEach(canvas => {
            if (canvas) {
                canvas.width = this.width;
                canvas.height = this.height;
            }
        });

        if (this.pipCanvas) {
            this.pipCanvas.width = 180;
            this.pipCanvas.height = 135;
        }
    }

    /**
     * Projects world coordinates to screen coordinates.
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {number} worldZ 
     * @returns {{ screenX: number, screenY: number, scale: number, visible: boolean }}
     */
    project(worldX, worldY, worldZ) {
        if (worldZ <= 10) {
            return { screenX: 0, screenY: 0, scale: 0, visible: false };
        }

        const cameraX = 0;
        const cameraY = 220;
        const focalDepth = 350;

        const scale = focalDepth / worldZ;
        const vpX = this.width / 2;
        const vpY = this.height * 0.38;

        const screenX = vpX + (worldX - cameraX) * scale;
        const screenY = vpY + (cameraY - worldY) * scale;

        return {
            screenX,
            screenY,
            scale,
            visible: true
        };
    }

    drawPiP(videoElement, landmarks, calibration, currentGesture) {
        if (!this.pipCtx || !videoElement || videoElement.readyState < 2) return;
        const w = this.pipCanvas.width;
        const h = this.pipCanvas.height;

        try {
            this.pipCtx.save();
            this.pipCtx.clearRect(0, 0, w, h);
            
            // Draw mirrored video
            this.pipCtx.scale(-1, 1);
            this.pipCtx.drawImage(videoElement, -w, 0, w, h);
            this.pipCtx.restore();

            // Draw visible detection mechanism overlay (skeleton, baselines, gesture badge)
            this.drawDetectionOverlay(this.pipCtx, w, h, landmarks, calibration, currentGesture);
        } catch (e) {
            // Ignore video draw errors during stream changes
        }
    }

    drawDetectionOverlay(ctx, w, h, landmarks, calibration, currentGesture) {
        ctx.save();

        // 1. Draw calibration baseline guides if available
        if (calibration) {
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);

            // Shoulder & Nose baseline Y
            if (calibration.baselineShoulderY !== undefined) {
                const sy = calibration.baselineShoulderY * h;
                ctx.strokeStyle = 'rgba(46, 204, 113, 0.7)';
                ctx.beginPath();
                ctx.moveTo(0, sy);
                ctx.lineTo(w, sy);
                ctx.stroke();
            }

            if (calibration.baselineNoseY !== undefined) {
                const ny = calibration.baselineNoseY * h;
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
                ctx.beginPath();
                ctx.moveTo(0, ny);
                ctx.lineTo(w, ny);
                ctx.stroke();
            }

            // Center baseline X & Zone boundaries
            if (calibration.baselineCenterX !== undefined) {
                const cx = (1 - calibration.baselineCenterX) * w;
                const zoneOffset = 0.10 * w; // 10% zone width offset

                // Center guide line
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
                ctx.beginPath();
                ctx.moveTo(cx, 0);
                ctx.lineTo(cx, h);
                ctx.stroke();

                // Left zone boundary line (screen right when mirrored)
                ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
                ctx.beginPath();
                ctx.moveTo(cx - zoneOffset, 0);
                ctx.lineTo(cx - zoneOffset, h);
                ctx.stroke();

                // Right zone boundary line (screen left when mirrored)
                ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
                ctx.beginPath();
                ctx.moveTo(cx + zoneOffset, 0);
                ctx.lineTo(cx + zoneOffset, h);
                ctx.stroke();
            }

            ctx.setLineDash([]);
        }

        // 2. Draw pose skeleton if landmarks present
        if (landmarks && landmarks.length > 0) {
            const getPt = (idx) => {
                const lm = landmarks[idx];
                if (!lm || (lm.visibility !== undefined && lm.visibility < 0.25)) return null;
                return { x: (1 - lm.x) * w, y: lm.y * h };
            };

            const connections = [
                [0, 11], [0, 12],   // Nose to shoulders
                [11, 12],           // Shoulder line
                [11, 23], [12, 24], // Torso sides
                [23, 24],           // Hip line
                [11, 13], [13, 15], // Left arm
                [12, 14], [14, 16]  // Right arm
            ];

            // Draw skeleton lines
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00FFCC';
            ctx.shadowColor = '#00FFCC';
            ctx.shadowBlur = 4;

            connections.forEach(([i, j]) => {
                const p1 = getPt(i);
                const p2 = getPt(j);
                if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // Draw keypoint dots (upper body only: head, shoulders, elbows, wrists/hands, hips)
            const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
            keyJoints.forEach(idx => {
                const pt = getPt(idx);
                if (pt) {
                    ctx.fillStyle = (idx === 0) ? '#FFD700' : '#00FFCC';
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, (idx === 0) ? 4 : 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.shadowBlur = 0;
        }

        // 3. Draw active gesture badge
        if (currentGesture) {
            const gestureMap = {
                'JUMP': { text: '⬆️ JUMP!', color: '#2ECC71' },
                'DUCK': { text: '⬇️ DUCK!', color: '#E67E22' },
                'SLIDE_LEFT': { text: '⬅️ LEFT!', color: '#3498DB' },
                'SLIDE_RIGHT': { text: '➡️ RIGHT!', color: '#3498DB' }
            };
            const gInfo = gestureMap[currentGesture];
            if (gInfo) {
                ctx.fillStyle = gInfo.color;
                ctx.beginPath();
                ctx.roundRect(w / 2 - 42, 6, 84, 22, 11);
                ctx.fill();

                ctx.font = 'bold 11px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(gInfo.text, w / 2, 21);
            }
        }

        ctx.restore();
    }
}
