export class RoadRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.segments = 35;
        this.segmentDepth = 80;
        this.laneWidth = 180;
        this.roadWidth = 270;
        
        this.themes = {
            'Forest': { 
                light: '#4a3b2c', dark: '#3d3023', 
                curbLight: '#e67e22', curbDark: '#d35400',
                curbTopLight: '#f39c12', curbTopDark: '#e67e22',
                grassLight: '#27ae60', grassDark: '#1e8449',
                dividerColor: '#ffffff', fogColor: '230, 245, 230'
            },
            'City': { 
                light: '#34495e', dark: '#2c3e50', 
                curbLight: '#ecf0f1', curbDark: '#c0392b',
                curbTopLight: '#ffffff', curbTopDark: '#e74c3c',
                grassLight: '#2c3e50', grassDark: '#1a252f',
                dividerColor: '#f1c40f', fogColor: '200, 210, 230'
            },
            'Space': { 
                light: '#2c1445', dark: '#1f0d33', 
                curbLight: '#00f0ff', curbDark: '#7000ff',
                curbTopLight: '#80f8ff', curbTopDark: '#a033ff',
                grassLight: '#12072b', grassDark: '#0a031c',
                dividerColor: '#00ffff', fogColor: '50, 10, 80'
            },
            'Candy': { 
                light: '#8e24aa', dark: '#6a1b9a', 
                curbLight: '#ff80ab', curbDark: '#ff4081',
                curbTopLight: '#ffb2dd', curbTopDark: '#ff80ab',
                grassLight: '#d81b60', grassDark: '#ad1457',
                dividerColor: '#fff59d', fogColor: '255, 220, 240'
            }
        };
    }

    render(ctx, scrollOffset, themeName) {
        const themeKey = themeName ? themeName.charAt(0).toUpperCase() + themeName.slice(1).toLowerCase() : 'Forest';
        const theme = this.themes[themeKey] || this.themes['Forest'];
        const curbWidthVal = 1.8 * this.laneWidth;
        const curbHeight = 14; // world units high for 3D curb step
        
        // Draw from back to front
        for (let i = this.segments - 1; i >= 0; i--) {
            const z1 = i * this.segmentDepth - (scrollOffset % this.segmentDepth) + 10;
            const z2 = (i + 1) * this.segmentDepth - (scrollOffset % this.segmentDepth) + 10;
            
            if (z1 <= 10) continue;
            
            // Ground points
            const p1L = this.renderer.project(-this.roadWidth, 0, z1);
            const p1R = this.renderer.project(this.roadWidth, 0, z1);
            const p2L = this.renderer.project(-this.roadWidth, 0, z2);
            const p2R = this.renderer.project(this.roadWidth, 0, z2);
            
            if (!p1L.visible || !p2L.visible) continue;
            
            const absoluteSegment = Math.floor((scrollOffset + z1) / this.segmentDepth);
            const isEven = absoluteSegment % 2 === 0;
            
            // Outer grass/terrain points
            const t1L = this.renderer.project(-1200, 0, z1);
            const t1R = this.renderer.project(1200, 0, z1);
            const t2L = this.renderer.project(-1200, 0, z2);
            const t2R = this.renderer.project(1200, 0, z2);

            // Outer curb ground & top points
            const c1L = this.renderer.project(-curbWidthVal, 0, z1);
            const c1R = this.renderer.project(curbWidthVal, 0, z1);
            const c2L = this.renderer.project(-curbWidthVal, 0, z2);
            const c2R = this.renderer.project(curbWidthVal, 0, z2);

            const ct1L = this.renderer.project(-curbWidthVal, curbHeight, z1);
            const ct1R = this.renderer.project(curbWidthVal, curbHeight, z1);
            const ct2L = this.renderer.project(-curbWidthVal, curbHeight, z2);
            const ct2R = this.renderer.project(curbWidthVal, curbHeight, z2);

            const pt1L = this.renderer.project(-this.roadWidth, curbHeight, z1);
            const pt1R = this.renderer.project(this.roadWidth, curbHeight, z1);
            const pt2L = this.renderer.project(-this.roadWidth, curbHeight, z2);
            const pt2R = this.renderer.project(this.roadWidth, curbHeight, z2);

            // 1. Draw outer terrain strips (Left & Right)
            ctx.fillStyle = isEven ? theme.grassLight : theme.grassDark;
            
            // Left terrain
            ctx.beginPath();
            ctx.moveTo(t1L.screenX | 0, t1L.screenY | 0);
            ctx.lineTo(c1L.screenX | 0, c1L.screenY | 0);
            ctx.lineTo(c2L.screenX | 0, c2L.screenY | 0);
            ctx.lineTo(t2L.screenX | 0, t2L.screenY | 0);
            ctx.fill();

            // Right terrain
            ctx.beginPath();
            ctx.moveTo(c1R.screenX | 0, c1R.screenY | 0);
            ctx.lineTo(t1R.screenX | 0, t1R.screenY | 0);
            ctx.lineTo(t2R.screenX | 0, t2R.screenY | 0);
            ctx.lineTo(c2R.screenX | 0, c2R.screenY | 0);
            ctx.fill();

            // 2. Draw central road quad
            ctx.fillStyle = isEven ? theme.light : theme.dark;
            ctx.beginPath();
            ctx.moveTo(p1L.screenX | 0, p1L.screenY | 0);
            ctx.lineTo(p1R.screenX | 0, p1R.screenY | 0);
            ctx.lineTo(p2R.screenX | 0, p2R.screenY | 0);
            ctx.lineTo(p2L.screenX | 0, p2L.screenY | 0);
            ctx.fill();

            // 3. Draw 3D Volumetric Curbs
            // Left curb top face
            ctx.fillStyle = isEven ? theme.curbTopLight : theme.curbTopDark;
            ctx.beginPath();
            ctx.moveTo(ct1L.screenX | 0, ct1L.screenY | 0);
            ctx.lineTo(pt1L.screenX | 0, pt1L.screenY | 0);
            ctx.lineTo(pt2L.screenX | 0, pt2L.screenY | 0);
            ctx.lineTo(ct2L.screenX | 0, ct2L.screenY | 0);
            ctx.fill();

            // Left curb inner face (facing track)
            ctx.fillStyle = isEven ? theme.curbLight : theme.curbDark;
            ctx.beginPath();
            ctx.moveTo(pt1L.screenX | 0, pt1L.screenY | 0);
            ctx.lineTo(p1L.screenX | 0, p1L.screenY | 0);
            ctx.lineTo(p2L.screenX | 0, p2L.screenY | 0);
            ctx.lineTo(pt2L.screenX | 0, pt2L.screenY | 0);
            ctx.fill();

            // Right curb top face
            ctx.fillStyle = isEven ? theme.curbTopLight : theme.curbTopDark;
            ctx.beginPath();
            ctx.moveTo(pt1R.screenX | 0, pt1R.screenY | 0);
            ctx.lineTo(ct1R.screenX | 0, ct1R.screenY | 0);
            ctx.lineTo(ct2R.screenX | 0, ct2R.screenY | 0);
            ctx.lineTo(pt2R.screenX | 0, pt2R.screenY | 0);
            ctx.fill();

            // Right curb inner face (facing track)
            ctx.fillStyle = isEven ? theme.curbLight : theme.curbDark;
            ctx.beginPath();
            ctx.moveTo(p1R.screenX | 0, p1R.screenY | 0);
            ctx.lineTo(pt1R.screenX | 0, pt1R.screenY | 0);
            ctx.lineTo(pt2R.screenX | 0, pt2R.screenY | 0);
            ctx.lineTo(p2R.screenX | 0, p2R.screenY | 0);
            ctx.fill();

            // 4. Draw high-contrast dashed lane dividers on even segments
            if (isEven) {
                ctx.fillStyle = theme.dividerColor;
                const strokeW = Math.max(1, 6 * p1L.scale);
                [-this.laneWidth / 2, this.laneWidth / 2].forEach(laneX => {
                    const l1L = this.renderer.project(laneX - 6, 0, z1);
                    const l1R = this.renderer.project(laneX + 6, 0, z1);
                    const l2L = this.renderer.project(laneX - 6, 0, z2);
                    const l2R = this.renderer.project(laneX + 6, 0, z2);
                    
                    ctx.beginPath();
                    ctx.moveTo(l1L.screenX | 0, l1L.screenY | 0);
                    ctx.lineTo(l1R.screenX | 0, l1R.screenY | 0);
                    ctx.lineTo(l2R.screenX | 0, l2R.screenY | 0);
                    ctx.lineTo(l2L.screenX | 0, l2L.screenY | 0);
                    ctx.fill();
                });
            }

            // 5. Distance Atmospheric Fog Overlay
            const fogAlpha = (typeof this.renderer.constructor.getFogAlpha === 'function')
                ? this.renderer.constructor.getFogAlpha(z1)
                : 0;

            if (fogAlpha > 0.02) {
                ctx.fillStyle = `rgba(${theme.fogColor}, ${fogAlpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.moveTo(t1L.screenX | 0, t1L.screenY | 0);
                ctx.lineTo(t1R.screenX | 0, t1R.screenY | 0);
                ctx.lineTo(t2R.screenX | 0, t2R.screenY | 0);
                ctx.lineTo(t2L.screenX | 0, t2L.screenY | 0);
                ctx.fill();
            }
        }
    }
}

