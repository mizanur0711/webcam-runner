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
        const outerR = Math.max(8, 30 * scale);
        const innerR = outerR * 0.45;
        const spinScale = Math.abs(Math.cos(item.rotation || 0));

        ctx.save();
        ctx.translate(screenX | 0, screenY | 0);

        // Ground shadow beneath floating star
        const pGround = this.renderer.project(item.x, 0, item.z);
        const shadowY = (pGround.screenY - screenY) | 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, shadowY, outerR * 0.8, outerR * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Spinning Star with Golden Glow
        ctx.scale(spinScale, 1.0); // 3D spin effect

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

        // Gold Radial Gradient Fill
        const starGrad = ctx.createRadialGradient(-outerR * 0.2, -outerR * 0.2, 2, 0, 0, outerR);
        starGrad.addColorStop(0, '#FFFFFF');
        starGrad.addColorStop(0.35, '#FFE066');
        starGrad.addColorStop(0.8, '#FFB300');
        starGrad.addColorStop(1, '#FF8F00');

        ctx.fillStyle = starGrad;
        ctx.fill();
        ctx.strokeStyle = '#B78103';
        ctx.lineWidth = Math.max(1, 2.5 * scale);
        ctx.stroke();

        // Shiny Center Sparkle Dot
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
