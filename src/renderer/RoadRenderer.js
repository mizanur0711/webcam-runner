export class RoadRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.segments = 35;
        this.segmentDepth = 80;
        this.laneWidth = 180;
        this.roadWidth = 270;
        
        this.themes = {
            'Forest': { light: '#5a4a3a', dark: '#4d4035', curbLight: '#8B4513', curbDark: '#5C4033' },
            'City': { light: '#3a3a44', dark: '#32323c', curbLight: '#DDDDDD', curbDark: '#AA0000' },
            'Space': { light: '#2a2a5a', dark: '#222250', curbLight: '#00FFFF', curbDark: '#000088' },
            'Candy': { light: '#8a3a6a', dark: '#7a3060', curbLight: '#FFB6C1', curbDark: '#FF69B4' }
        };
    }

    render(ctx, scrollOffset, themeName) {
        const theme = this.themes[themeName] || this.themes['Forest'];
        
        // Draw from back to front
        for (let i = this.segments - 1; i >= 0; i--) {
            const z1 = i * this.segmentDepth - (scrollOffset % this.segmentDepth) + 10;
            const z2 = (i + 1) * this.segmentDepth - (scrollOffset % this.segmentDepth) + 10;
            
            if (z1 <= 10) continue;
            
            const p1L = this.renderer.project(-this.roadWidth, 0, z1);
            const p1R = this.renderer.project(this.roadWidth, 0, z1);
            const p2L = this.renderer.project(-this.roadWidth, 0, z2);
            const p2R = this.renderer.project(this.roadWidth, 0, z2);
            
            if (!p1L.visible || !p2L.visible) continue;
            
            // Check even or odd segment for movement illusion
            // Need absolute segment index based on scroll offset
            const absoluteSegment = Math.floor((scrollOffset + z1) / this.segmentDepth);
            const isEven = absoluteSegment % 2 === 0;
            
            // Draw road
            ctx.fillStyle = isEven ? theme.light : theme.dark;
            ctx.beginPath();
            ctx.moveTo(p1L.screenX | 0, p1L.screenY | 0);
            ctx.lineTo(p1R.screenX | 0, p1R.screenY | 0);
            ctx.lineTo(p2R.screenX | 0, p2R.screenY | 0);
            ctx.lineTo(p2L.screenX | 0, p2L.screenY | 0);
            ctx.fill();
            
            // Draw curb/rumble strips
            const curbWidth1 = 1.8 * this.laneWidth;
            const c1L = this.renderer.project(-curbWidth1, 0, z1);
            const c1R = this.renderer.project(curbWidth1, 0, z1);
            const c2L = this.renderer.project(-curbWidth1, 0, z2);
            const c2R = this.renderer.project(curbWidth1, 0, z2);
            
            ctx.fillStyle = isEven ? theme.curbLight : theme.curbDark;
            
            // Left curb
            ctx.beginPath();
            ctx.moveTo(c1L.screenX | 0, c1L.screenY | 0);
            ctx.lineTo(p1L.screenX | 0, p1L.screenY | 0);
            ctx.lineTo(p2L.screenX | 0, p2L.screenY | 0);
            ctx.lineTo(c2L.screenX | 0, c2L.screenY | 0);
            ctx.fill();
            
            // Right curb
            ctx.beginPath();
            ctx.moveTo(p1R.screenX | 0, p1R.screenY | 0);
            ctx.lineTo(c1R.screenX | 0, c1R.screenY | 0);
            ctx.lineTo(c2R.screenX | 0, c2R.screenY | 0);
            ctx.lineTo(p2R.screenX | 0, p2R.screenY | 0);
            ctx.fill();
            
            // Draw dashed lane dividers on even segments
            if (isEven) {
                ctx.fillStyle = '#FFFFFF';
                [-this.laneWidth / 2, this.laneWidth / 2].forEach(laneX => {
                    const l1L = this.renderer.project(laneX - 5, 0, z1);
                    const l1R = this.renderer.project(laneX + 5, 0, z1);
                    const l2L = this.renderer.project(laneX - 5, 0, z2);
                    const l2R = this.renderer.project(laneX + 5, 0, z2);
                    
                    ctx.beginPath();
                    ctx.moveTo(l1L.screenX | 0, l1L.screenY | 0);
                    ctx.lineTo(l1R.screenX | 0, l1R.screenY | 0);
                    ctx.lineTo(l2R.screenX | 0, l2R.screenY | 0);
                    ctx.lineTo(l2L.screenX | 0, l2L.screenY | 0);
                    ctx.fill();
                });
            }
        }
    }
}
