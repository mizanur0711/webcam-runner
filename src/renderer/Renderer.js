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

    drawPiP(videoElement) {
        if (!this.pipCtx || !videoElement || videoElement.readyState < 2) return;
        try {
            this.pipCtx.save();
            this.pipCtx.clearRect(0, 0, this.pipCanvas.width, this.pipCanvas.height);
            this.pipCtx.scale(-1, 1);
            this.pipCtx.drawImage(videoElement, -this.pipCanvas.width, 0, this.pipCanvas.width, this.pipCanvas.height);
            this.pipCtx.restore();
        } catch (e) {
            // Ignore video draw errors during stream changes
        }
    }
}
