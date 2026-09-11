export class UIRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    clear(ctx) {
        ctx.clearRect(0, 0, this.renderer.width, this.renderer.height);
    }

    renderHUD(ctx, score, highScore, tier) {
        this.clear(ctx);
        const w = this.renderer.width;
        
        ctx.font = 'bold 48px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(Math.floor(score).toString(), w / 2, 60);

        ctx.font = 'bold 24px Fredoka, sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`BEST: ${Math.floor(highScore)}`, w / 2, 90);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Fredoka, sans-serif';
        ctx.fillText(`Tier: ${tier}`, 20, 50);
    }

    renderIdle(ctx) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, w, h);

        ctx.font = 'bold 48px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Stand in front of the camera!', w / 2, h / 2 - 40);

        // Bouncing arrow
        const time = Date.now() / 1000;
        const offset = Math.sin(time * 5) * 10;
        ctx.font = 'bold 64px Fredoka, sans-serif';
        ctx.fillText('⬇️', w / 2, h / 2 + 30 + offset);
    }

    renderDetected(ctx) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        const time = Date.now() / 1000;
        const scale = 1 + Math.sin(time * 8) * 0.1;

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        
        ctx.font = 'bold 64px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText('Get Ready!', 0, 0);
        ctx.restore();
    }

    renderCalibrating(ctx, progress, tooClose) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = 80;

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#2ECC71';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.stroke();

        ctx.font = 'bold 32px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = tooClose ? '#E74C3C' : '#FFFFFF';
        ctx.fillText(tooClose ? 'Step back a little!' : 'Calibrating...', cx, cy + 130);
    }

    renderCountdown(ctx, number) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.font = 'bold 120px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        
        if (number > 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(number.toString(), w / 2, h / 2);
        } else if (number === 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('GO!', w / 2, h / 2);
        }
        
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'alphabetic';
    }

    renderPaused(ctx) {
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        ctx.font = 'bold 64px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Come back! 👋', w / 2, h / 2);
    }

    renderGameOver(ctx, score, highScore, isNewHighScore) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);

        const cardW = 500;
        const cardH = 300;
        const cardX = (w - cardW) / 2;
        const cardY = (h - cardH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 48px Fredoka, sans-serif';
        ctx.fillStyle = '#E74C3C';
        ctx.fillText('Game Over', w / 2, cardY + 70);

        ctx.font = 'bold 64px Fredoka, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(Math.floor(score).toString(), w / 2, cardY + 150);

        if (isNewHighScore) {
            ctx.font = 'bold 32px Fredoka, sans-serif';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('⭐ NEW BEST! ⭐', w / 2, cardY + 200);
        } else {
            ctx.font = 'bold 24px Fredoka, sans-serif';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText(`Best: ${Math.floor(highScore)}`, w / 2, cardY + 200);
        }

        ctx.font = '20px Fredoka, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Walk away and come back to play again!', w / 2, cardY + 260);
    }

    renderCameraError(ctx, errorType) {
        this.clear(ctx);
        const w = this.renderer.width;
        const h = this.renderer.height;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Fredoka, sans-serif';
        ctx.fillStyle = '#E74C3C';
        
        let msg = 'Camera Error';
        if (errorType === 'denied') msg = 'Please allow camera access to play!';
        if (errorType === 'in-use') msg = 'Camera is in use by another app.';
        if (errorType === 'not-found') msg = 'No camera found!';

        ctx.fillText(msg, w / 2, h / 2);
    }

    renderLowLight(ctx) {
        const w = this.renderer.width;
        const h = this.renderer.height;
        
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px Fredoka, sans-serif';
        ctx.fillStyle = '#F1C40F';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('💡 Can\'t see you clearly — try better light!', w / 2, 40);
        ctx.shadowBlur = 0;
    }
}
