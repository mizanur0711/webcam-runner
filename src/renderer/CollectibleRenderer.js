import { Renderer } from './Renderer.js';

export class CollectibleRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    render(ctx, item) {
        if (!item || item.z <= 10) return;

        const p = this.renderer.project(item.x, item.y, item.z);
        if (!p.visible) return;

        const { screenX, screenY, scale } = p;
        const outerR = Math.max(10, 32 * scale);
        const innerR = outerR * 0.45;
        const spinScale = Math.max(0.18, Math.abs(Math.cos(item.rotation || 0)));

        ctx.save();
        ctx.translate(screenX | 0, screenY | 0);

        // Ground shadow beneath floating star
        const pGround = this.renderer.project(item.x, 0, item.z);
        const shadowY = (pGround.screenY - screenY) | 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, shadowY, outerR * 0.75, Math.max(2, outerR * 0.25), 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Spinning Star with Golden Glow
        ctx.scale(spinScale, 1.0);

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = Math.max(6, 16 * scale);

        // Outer Star Polygon (5-point star)
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Safe Gold Radial Gradient Fill (r1 < r2 guaranteed to prevent DOMException)
        const r1 = Math.max(0.1, outerR * 0.05);
        const r2 = Math.max(0.2, outerR);
        const starGrad = ctx.createRadialGradient(-outerR * 0.2, -outerR * 0.2, r1, 0, 0, r2);
        starGrad.addColorStop(0, '#FFFFFF');
        starGrad.addColorStop(0.35, '#FFE066');
        starGrad.addColorStop(0.8, '#FFB300');
        starGrad.addColorStop(1, '#FF8F00');

        ctx.fillStyle = starGrad;
        ctx.fill();
        ctx.strokeStyle = '#B78103';
        ctx.lineWidth = Math.max(1.2, 2.5 * scale);
        ctx.stroke();

        // Shiny Center Sparkle Dot
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, innerR * 0.4), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

