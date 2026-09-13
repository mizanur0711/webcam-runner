import { Renderer } from './Renderer.js';

export class ObstacleRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    render(ctx, obstacle, themeName) {
        if (!obstacle || obstacle.z <= 10) return;

        const pCenter = this.renderer.project(obstacle.x, obstacle.y, obstacle.z);
        if (!pCenter.visible) return;

        const theme = (themeName || 'forest').toLowerCase();
        const depth = obstacle.baseDepth || 60;
        const w = obstacle.baseWidth;
        const h = obstacle.baseHeight;
        const x = obstacle.x;
        const y = obstacle.y;
        const z = obstacle.z;

        // 1. Draw radial ground shadow
        this.drawGroundShadow(ctx, x, z, w, depth);

        // 2. Proximity warning glow when approaching (z < 600)
        ctx.save();
        if (z < 600) {
            const pulse = (Math.sin(Date.now() / 100) + 1) / 2;
            ctx.shadowColor = theme === 'space' ? '#00ffff' : (theme === 'candy' ? '#ff007f' : '#ff3300');
            ctx.shadowBlur = 12 + pulse * 18;
        }

        // 3. Draw 3D shape by obstacle type
        if (obstacle.type === 'LOW') {
            const colors = this.getLowColors(theme);
            this.draw3DBox(ctx, x, y, z, w, h, depth, colors);
        } else if (obstacle.type === 'HIGH') {
            const colors = this.getHighColors(theme);
            this.drawHighObstacle(ctx, x, y, z, w, h, depth, colors);
        } else if (obstacle.type === 'SIDE') {
            const colors = this.getSideColors(theme);
            this.draw3DBox(ctx, x, y, z, w, h, depth, colors);
        }

        ctx.restore();
    }

    drawGroundShadow(ctx, worldX, worldZ, worldW, worldD) {
        const pFront = this.renderer.project(worldX, 0, worldZ);
        const pBack  = this.renderer.project(worldX, 0, worldZ + worldD);
        if (!pFront.visible) return;

        const rx = (worldW * pFront.scale * 0.65);
        const ry = Math.max(3, (worldD * pFront.scale * 0.25));

        ctx.save();
        const shadowGrad = ctx.createRadialGradient(
            pFront.screenX, pFront.screenY, 0,
            pFront.screenX, pFront.screenY, rx
        );
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
        shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(pFront.screenX | 0, pFront.screenY | 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    draw3DBox(ctx, x, y, z, w, h, depth, palette) {
        const halfW = w / 2;

        const pFL  = this.renderer.project(x - halfW, y, z);
        const pFR  = this.renderer.project(x + halfW, y, z);
        const pFTL = this.renderer.project(x - halfW, y + h, z);
        const pFTR = this.renderer.project(x + halfW, y + h, z);

        const pBL  = this.renderer.project(x - halfW, y, z + depth);
        const pBR  = this.renderer.project(x + halfW, y, z + depth);
        const pBTL = this.renderer.project(x - halfW, y + h, z + depth);
        const pBTR = this.renderer.project(x + halfW, y + h, z + depth);

        if (!pFL.visible || !pBL.visible) return;

        const faceColors = Renderer.get3DFaceColors(palette.main);
        const strokeW = Math.max(2, 4 * pFL.scale);

        // A. Top face
        ctx.fillStyle = faceColors.top;
        ctx.beginPath();
        ctx.moveTo(pFTL.screenX, pFTL.screenY);
        ctx.lineTo(pFTR.screenX, pFTR.screenY);
        ctx.lineTo(pBTR.screenX, pBTR.screenY);
        ctx.lineTo(pBTL.screenX, pBTL.screenY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = faceColors.dark;
        ctx.lineWidth = strokeW;
        ctx.stroke();

        // B. Side face (Left or Right)
        if (x < 0) {
            ctx.fillStyle = faceColors.side;
            ctx.beginPath();
            ctx.moveTo(pFTR.screenX, pFTR.screenY);
            ctx.lineTo(pFR.screenX, pFR.screenY);
            ctx.lineTo(pBR.screenX, pBR.screenY);
            ctx.lineTo(pBTR.screenX, pBTR.screenY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (x > 0) {
            ctx.fillStyle = faceColors.side;
            ctx.beginPath();
            ctx.moveTo(pFTL.screenX, pFTL.screenY);
            ctx.lineTo(pFL.screenX, pFL.screenY);
            ctx.lineTo(pBL.screenX, pBL.screenY);
            ctx.lineTo(pBTL.screenX, pBTL.screenY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // C. Front face
        ctx.fillStyle = faceColors.front;
        ctx.beginPath();
        ctx.moveTo(pFL.screenX, pFL.screenY);
        ctx.lineTo(pFR.screenX, pFR.screenY);
        ctx.lineTo(pFTR.screenX, pFTR.screenY);
        ctx.lineTo(pFTL.screenX, pFTL.screenY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = faceColors.dark;
        ctx.lineWidth = strokeW;
        ctx.stroke();

        // D. Hazard stripes / Icon overlay
        if (palette.stripeColor) {
            this.drawFrontStripes(ctx, pFL, pFR, pFTR, pFTL, palette.stripeColor, strokeW);
        }
    }

    drawHighObstacle(ctx, x, y, z, w, h, depth, palette) {
        const halfW = w / 2;
        const postW = 22; // width of support posts
        const barH = Math.max(35, h * 0.7);
        const barY = y + (h - barH);

        // 1. Left support post (3D Box)
        this.draw3DBox(ctx, x - halfW + postW/2, y, z, postW, barY - y, depth, { main: palette.postColor });

        // 2. Right support post (3D Box)
        this.draw3DBox(ctx, x + halfW - postW/2, y, z, postW, barY - y, depth, { main: palette.postColor });

        // 3. Overhead Horizontal Beam (3D Box with hazard stripes)
        this.draw3DBox(ctx, x, barY, z, w, barH, depth, palette);
    }

    drawFrontStripes(ctx, pFL, pFR, pFTR, pFTL, stripeColor, strokeW) {
        ctx.save();
        ctx.clip(); // clip to front face polygon
        ctx.fillStyle = stripeColor;

        const steps = 6;
        for (let i = -steps; i < steps * 2; i++) {
            const t1 = i / steps;
            const t2 = (i + 0.5) / steps;

            const x1 = pFL.screenX + (pFR.screenX - pFL.screenX) * t1;
            const y1 = pFL.screenY + (pFR.screenY - pFL.screenY) * t1;
            const x2 = pFL.screenX + (pFR.screenX - pFL.screenX) * t2;
            const y2 = pFL.screenY + (pFR.screenY - pFL.screenY) * t2;

            const xt1 = pFTL.screenX + (pFTR.screenX - pFTL.screenX) * (t1 + 0.3);
            const yt1 = pFTL.screenY + (pFTR.screenY - pFTL.screenY) * (t1 + 0.3);
            const xt2 = pFTL.screenX + (pFTR.screenX - pFTL.screenX) * (t2 + 0.3);
            const yt2 = pFTL.screenY + (pFTR.screenY - pFTL.screenY) * (t2 + 0.3);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(xt2, yt2);
            ctx.lineTo(xt1, yt1);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    getLowColors(theme) {
        switch (theme) {
            case 'city':
                return { main: '#ff5722', stripeColor: '#ffffff' }; // Traffic Cone / Barrier
            case 'space':
                return { main: '#00e5ff', stripeColor: '#d500f9' }; // Glowing Plasma Box
            case 'candy':
                return { main: '#ff4081', stripeColor: '#ffeb3b' }; // Bright Sugar Crate
            case 'forest':
            default:
                return { main: '#e67e22', stripeColor: '#27ae60' }; // Mossy Caution Log
        }
    }

    getHighColors(theme) {
        switch (theme) {
            case 'city':
                return { main: '#ffeb3b', postColor: '#212121', stripeColor: '#212121' }; // Yellow Hazard Gate
            case 'space':
                return { main: '#ff007f', postColor: '#304ffe', stripeColor: '#00ffff' }; // Electric Laser Beam
            case 'candy':
                return { main: '#00e5ff', postColor: '#e91e63', stripeColor: '#ffffff' }; // Candy Cane Arch
            case 'forest':
            default:
                return { main: '#f39c12', postColor: '#5d4037', stripeColor: '#d35400' }; // Caution Branch Gate
        }
    }

    getSideColors(theme) {
        switch (theme) {
            case 'city':
                return { main: '#e91e63', stripeColor: '#00bcd4' }; // Neon City Pillar
            case 'space':
                return { main: '#7c4dff', stripeColor: '#64ffda' }; // Warp Energy Column
            case 'candy':
                return { main: '#00e5ff', stripeColor: '#ff80ab' }; // Sweet Lollipop Tower
            case 'forest':
            default:
                return { main: '#27ae60', stripeColor: '#f1c40f' }; // Totem Tree Pillar
        }
    }
}

