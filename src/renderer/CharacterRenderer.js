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
        
        // Ground shadow
        const shadowP = this.renderer.project(character.x, 0, character.z);
        const shadowY = (shadowP.screenY - screenY) | 0;
        const shadowScale = Math.max(0.1, 1 - (character.y / 150));
        
        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
        ctx.beginPath();
        ctx.ellipse(0, shadowY, 40 * scale * shadowScale, 15 * scale * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tilt for lane switching
        ctx.rotate(character.tilt || 0);

        // Apply scale/squash based on state
        let scaleX = 1;
        let scaleY = 1;
        if (character.state === 'JUMPING') {
            scaleX = 0.9;
            scaleY = 1.15;
        } else if (character.state === 'DUCKING') {
            scaleX = 1.3;
            scaleY = 0.55;
        }
        
        ctx.scale(scale * scaleX, scale * scaleY);

        const animFrame = character.animFrame || 0;
        const legOffset = Math.sin(animFrame * Math.PI * 2) * 15;

        if (character.tier === 'CUB') {
            this.drawCub(ctx, legOffset, character.state);
        } else if (character.tier === 'SCOUT') {
            this.drawScout(ctx, legOffset, character.state);
        } else if (character.tier === 'RANGER') {
            this.drawRanger(ctx, legOffset, character.state);
        }

        ctx.restore();
    }

    drawCub(ctx, legOffset, state) {
        // Legs
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-15, -10 + legOffset, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, -10 - legOffset, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(0, -40, 30, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -35, 20, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(-30, -40 - legOffset, 8, 15, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, -40 + legOffset, 8, 15, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();

        // Head
        const headY = state === 'DUCKING' ? -60 : -80;
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(0, headY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.arc(-15, headY - 20, 8, 0, Math.PI * 2);
        ctx.arc(15, headY - 20, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8, headY - 5, 3, 0, Math.PI * 2);
        ctx.arc(8, headY - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawScout(ctx, legOffset, state) {
        // Legs
        ctx.fillStyle = '#1E8449';
        ctx.beginPath();
        ctx.ellipse(-15, -15 + legOffset, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, -15 - legOffset, 8, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#2ECC71';
        ctx.beginPath();
        ctx.ellipse(0, -50, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vest
        ctx.fillStyle = '#27AE60';
        ctx.fillRect(-25, -70, 50, 30);

        // Head
        const headY = state === 'DUCKING' ? -70 : -95;
        ctx.fillStyle = '#2ECC71';
        ctx.beginPath();
        ctx.arc(0, headY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hat
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(0, headY - 35);
        ctx.lineTo(-20, headY - 15);
        ctx.lineTo(20, headY - 15);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-8, headY - 2, 4, 0, Math.PI * 2);
        ctx.arc(8, headY - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-8, headY - 2, 2, 0, Math.PI * 2);
        ctx.arc(8, headY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRanger(ctx, legOffset, state) {
        // Legs
        ctx.fillStyle = '#922B21';
        ctx.beginPath();
        ctx.ellipse(-15, -20 + legOffset * 1.2, 6, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, -20 - legOffset * 1.2, 6, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.ellipse(0, -60, 20, 45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trim
        ctx.fillStyle = '#F1C40F';
        ctx.fillRect(-20, -70, 40, 5);
        ctx.fillRect(-20, -40, 40, 5);

        // Head
        const headY = state === 'DUCKING' ? -80 : -115;
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.arc(0, headY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Antlers/Ears
        ctx.fillStyle = '#D35400';
        ctx.beginPath();
        ctx.moveTo(-10, headY - 15);
        ctx.lineTo(-25, headY - 40);
        ctx.lineTo(-15, headY - 15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, headY - 15);
        ctx.lineTo(25, headY - 40);
        ctx.lineTo(15, headY - 15);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-7, headY - 2, 3, 0, Math.PI * 2);
        ctx.arc(7, headY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
