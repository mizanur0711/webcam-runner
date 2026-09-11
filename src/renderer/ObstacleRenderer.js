export class ObstacleRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    render(ctx, obstacle, theme) {
        const p = this.renderer.project(obstacle.x, obstacle.y, obstacle.z);
        if (!p.visible) return;

        const { screenX, screenY, scale } = p;
        const width = obstacle.baseWidth * scale;
        const height = obstacle.baseHeight * scale;

        ctx.save();
        ctx.translate(screenX | 0, screenY | 0);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        const pGround = this.renderer.project(obstacle.x, 0, obstacle.z);
        ctx.ellipse(0, (pGround.screenY - screenY) | 0, width * 0.6, width * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const themeLower = (theme || 'forest').toLowerCase();

        if (obstacle.type === 'LOW') {
            if (themeLower === 'forest') {
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.roundRect(-width/2, -height, width, height, 10 * scale);
                ctx.fill();
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(-width/3, -height, 10 * scale, 0, Math.PI * 2);
                ctx.fill();
            } else if (themeLower === 'city') {
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.moveTo(0, -height);
                ctx.lineTo(width/2, 0);
                ctx.lineTo(-width/2, 0);
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-width/3, -height/2, (width/3)*2, height/4);
            } else if (themeLower === 'space') {
                ctx.fillStyle = '#333333';
                ctx.beginPath();
                ctx.arc(0, -height/2, width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF8C00';
                ctx.beginPath();
                ctx.arc(-width/4, -height/3, width/6, 0, Math.PI * 2);
                ctx.fill();
            } else if (themeLower === 'candy') {
                ctx.fillStyle = '#FF00FF';
                ctx.beginPath();
                ctx.roundRect(-width/2, -height, width, height, 20 * scale);
                ctx.fill();
            }
        } else if (obstacle.type === 'HIGH') {
            const barY = -height/2; // Offset center
            if (themeLower === 'forest') {
                ctx.fillStyle = '#654321';
                ctx.fillRect(-width/2, barY, width, height);
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(0, barY + height, height, 0, Math.PI);
                ctx.fill();
            } else if (themeLower === 'city') {
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(-width/2, barY, width, height);
                ctx.fillStyle = '#000000';
                for(let i = -width/2; i < width/2; i+=20*scale) {
                    ctx.fillRect(i, barY, 10*scale, height);
                }
            } else if (themeLower === 'space') {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillRect(-width/2, barY, width, height);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-width/2, barY + height/3, width, height/3);
            } else if (themeLower === 'candy') {
                ctx.fillStyle = '#000000';
                ctx.fillRect(-width/2, barY, width, height);
                ctx.fillStyle = '#FF0000';
                for(let i = -width/2; i < width/2; i+=15*scale) {
                    ctx.fillRect(i, barY, 7*scale, height);
                }
            }
        } else if (obstacle.type === 'SIDE') {
            if (themeLower === 'forest') {
                ctx.fillStyle = '#5C4033';
                ctx.fillRect(-width/2, -height, width, height);
            } else if (themeLower === 'city') {
                ctx.fillStyle = '#2E8B57';
                ctx.fillRect(-width/2, -height, width, height);
                ctx.fillStyle = '#000000';
                ctx.fillRect(-width/2, -height, width, 5*scale);
            } else if (themeLower === 'space') {
                ctx.fillStyle = '#555555';
                ctx.beginPath();
                ctx.moveTo(0, -height);
                ctx.lineTo(width/2, -height/2);
                ctx.lineTo(width/2, 0);
                ctx.lineTo(-width/2, 0);
                ctx.lineTo(-width/2, -height/2);
                ctx.fill();
            } else if (themeLower === 'candy') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-width/6, -height, width/3, height);
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath();
                ctx.arc(0, -height, width/2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
