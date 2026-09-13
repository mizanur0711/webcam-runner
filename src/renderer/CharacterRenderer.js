export class CharacterRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    render(ctx, character) {
        const p = this.renderer.project(character.x, character.y, character.z);
        if (!p.visible) return;

        const { screenX, screenY, scale } = p;
        
        ctx.save();
        ctx.translate(screenX | 0, screenY | 0);
        
        // 1. Dynamic 3D Ground shadow
        const shadowP = this.renderer.project(character.x, 0, character.z);
        const shadowY = (shadowP.screenY - screenY) | 0;
        const shadowScale = Math.max(0.1, 1 - (character.y / 160));
        const shadowW = 45 * scale * shadowScale;
        const shadowH = 16 * scale * shadowScale;
        
        ctx.save();
        const shadowGrad = ctx.createRadialGradient(0, shadowY, 0, 0, shadowY, shadowW);
        shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${0.55 * shadowScale})`);
        shadowGrad.addColorStop(0.6, `rgba(0, 0, 0, ${0.25 * shadowScale})`);
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(0, shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Tilt for lane switching
        ctx.rotate(character.tilt || 0);

        // 3. Apply scale/squash based on state
        let scaleX = 1;
        let scaleY = 1;
        if (character.state === 'JUMPING') {
            scaleX = 0.88;
            scaleY = 1.18;
        } else if (character.state === 'DUCKING') {
            scaleX = 1.32;
            scaleY = 0.55;
        }
        
        ctx.scale(scale * scaleX, scale * scaleY);

        const animFrame = character.animFrame || 0;
        const legOffset = Math.sin(animFrame * Math.PI * 2) * 15;

        const tier = (character.tier || '').toUpperCase();
        if (tier === 'CUB' || tier === 'SMALL') {
            this.drawCub(ctx, legOffset, character.state);
        } else if (tier === 'RANGER' || tier === 'TALL') {
            this.drawRanger(ctx, legOffset, character.state);
        } else {
            this.drawScout(ctx, legOffset, character.state);
        }

        ctx.restore();
    }

    createSphericalGradient(ctx, cx, cy, r, baseHex, lightHex) {
        const grad = ctx.createRadialGradient(
            cx - r * 0.35, cy - r * 0.35, r * 0.1,
            cx, cy, r
        );
        grad.addColorStop(0, lightHex || '#ffffff');
        grad.addColorStop(0.35, baseHex);
        grad.addColorStop(1, this.darkenHex(baseHex, 0.65));
        return grad;
    }

    darkenHex(hex, factor) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        if (isNaN(num)) return hex;
        const r = Math.floor(((num >> 16) & 255) * factor);
        const g = Math.floor(((num >> 8) & 255) * factor);
        const b = Math.floor((num & 255) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawCub(ctx, legOffset, state) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#2d1808';

        // Legs
        ctx.fillStyle = this.createSphericalGradient(ctx, -15, -10 + legOffset, 12, '#8B4513', '#d27d3d');
        ctx.beginPath();
        ctx.ellipse(-15, -10 + legOffset, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 15, -10 - legOffset, 12, '#8B4513', '#d27d3d');
        ctx.beginPath();
        ctx.ellipse(15, -10 - legOffset, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3D Body
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, -40, 30, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.arc(0, -40, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3D Belly
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, -35, 20, '#FFD700', '#ffecb3');
        ctx.beginPath();
        ctx.arc(0, -35, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Arms
        ctx.fillStyle = this.createSphericalGradient(ctx, -30, -40 - legOffset, 12, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.ellipse(-30, -40 - legOffset, 8, 15, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 30, -40 + legOffset, 12, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.ellipse(30, -40 + legOffset, 8, 15, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3D Head
        const headY = state === 'DUCKING' ? -60 : -80;
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, headY, 25, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.arc(0, headY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 3D Ears
        ctx.fillStyle = this.createSphericalGradient(ctx, -15, headY - 20, 9, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.arc(-15, headY - 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 15, headY - 20, 9, '#FF8C00', '#ffcc80');
        ctx.beginPath();
        ctx.arc(15, headY - 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shiny Eyes with catchlights
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-8, headY - 5, 3.5, 0, Math.PI * 2);
        ctx.arc(8, headY - 5, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-9, headY - 6, 1.2, 0, Math.PI * 2);
        ctx.arc(7, headY - 6, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawScout(ctx, legOffset, state) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0d381e';

        // Legs
        ctx.fillStyle = this.createSphericalGradient(ctx, -15, -15 + legOffset, 15, '#1E8449', '#52be80');
        ctx.beginPath();
        ctx.ellipse(-15, -15 + legOffset, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 15, -15 - legOffset, 15, '#1E8449', '#52be80');
        ctx.beginPath();
        ctx.ellipse(15, -15 - legOffset, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3D Body
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, -50, 30, '#2ECC71', '#abebc6');
        ctx.beginPath();
        ctx.ellipse(0, -50, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vest
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, -55, 25, '#27AE60', '#82e0aa');
        ctx.fillRect(-25, -70, 50, 30);
        ctx.strokeRect(-25, -70, 50, 30);

        // 3D Head
        const headY = state === 'DUCKING' ? -70 : -95;
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, headY, 20, '#2ECC71', '#abebc6');
        ctx.beginPath();
        ctx.arc(0, headY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hat
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, headY - 25, 20, '#8B4513', '#d27d3d');
        ctx.beginPath();
        ctx.moveTo(0, headY - 35);
        ctx.lineTo(-20, headY - 15);
        ctx.lineTo(20, headY - 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Eyes with shiny catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-8, headY - 2, 4.5, 0, Math.PI * 2);
        ctx.arc(8, headY - 2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-8, headY - 2, 2.2, 0, Math.PI * 2);
        ctx.arc(8, headY - 2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-9, headY - 3, 1, 0, Math.PI * 2);
        ctx.arc(7, headY - 3, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRanger(ctx, legOffset, state) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#4a0e0e';

        // Legs
        ctx.fillStyle = this.createSphericalGradient(ctx, -15, -20 + legOffset * 1.2, 16, '#922B21', '#ec7063');
        ctx.beginPath();
        ctx.ellipse(-15, -20 + legOffset * 1.2, 6, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 15, -20 - legOffset * 1.2, 16, '#922B21', '#ec7063');
        ctx.beginPath();
        ctx.ellipse(15, -20 - legOffset * 1.2, 6, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3D Body
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, -60, 25, '#C0392B', '#f1948a');
        ctx.beginPath();
        ctx.ellipse(0, -60, 20, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gold Trim
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(-20, -70, 40, 5);
        ctx.fillRect(-20, -40, 40, 5);

        // 3D Head
        const headY = state === 'DUCKING' ? -80 : -115;
        ctx.fillStyle = this.createSphericalGradient(ctx, 0, headY, 18, '#C0392B', '#f1948a');
        ctx.beginPath();
        ctx.arc(0, headY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Antlers
        ctx.fillStyle = this.createSphericalGradient(ctx, -18, headY - 25, 15, '#D35400', '#f39c12');
        ctx.beginPath();
        ctx.moveTo(-10, headY - 15);
        ctx.lineTo(-25, headY - 40);
        ctx.lineTo(-15, headY - 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.createSphericalGradient(ctx, 18, headY - 25, 15, '#D35400', '#f39c12');
        ctx.beginPath();
        ctx.moveTo(10, headY - 15);
        ctx.lineTo(25, headY - 40);
        ctx.lineTo(15, headY - 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shiny Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-7, headY - 2, 3.5, 0, Math.PI * 2);
        ctx.arc(7, headY - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-8, headY - 3, 1.2, 0, Math.PI * 2);
        ctx.arc(6, headY - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

