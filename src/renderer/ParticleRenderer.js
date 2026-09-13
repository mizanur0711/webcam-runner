import { Renderer } from './Renderer.js';

export class ParticleRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    render(ctx, particle) {
        if (!particle || particle.z <= 10) return;

        const p = this.renderer.project(particle.x, particle.y, particle.z);
        if (!p.visible) return;

        const { screenX, screenY, scale } = p;
        const size = Math.max(1, particle.size * scale);
        const alpha = Math.max(0, particle.life / particle.maxLife);

        ctx.save();
        ctx.translate(screenX | 0, screenY | 0);

        if (particle.type === 'DUST') {
            // Soft fading dust circle
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = alpha * 0.55;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (particle.type === 'RING') {
            // Expanding impact ring on road ground
            ctx.strokeStyle = particle.color;
            ctx.globalAlpha = alpha * 0.7;
            ctx.lineWidth = Math.max(1, 3 * scale);
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();

        } else if (particle.type === 'SPARKLE') {
            // Glowing 4-point star sparkle
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = Math.max(4, 10 * scale);

            const r = size;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.25, -r * 0.25);
            ctx.lineTo(r, 0);
            ctx.lineTo(r * 0.25, r * 0.25);
            ctx.lineTo(0, r);
            ctx.lineTo(-r * 0.25, r * 0.25);
            ctx.lineTo(-r, 0);
            ctx.lineTo(-r * 0.25, -r * 0.25);
            ctx.closePath();
            ctx.fill();

        } else if (particle.type === 'CONFETTI') {
            // Rotating rectangular confetti ribbon
            ctx.globalAlpha = alpha;
            ctx.rotate(particle.rotation || 0);
            ctx.fillStyle = particle.color;
            ctx.fillRect(-size / 2, -size / 4, size, size / 2);
        }

        ctx.restore();
    }
}
