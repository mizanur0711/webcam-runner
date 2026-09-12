export class BackgroundRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.themeName = 'Forest';
        this.elements = [];
        this.clouds = [];
    }

    setTheme(themeName) {
        const themeKey = themeName ? themeName.charAt(0).toUpperCase() + themeName.slice(1).toLowerCase() : 'Forest';
        this.themeName = themeKey;
        this.elements = [];
        this.clouds = [];
        
        let seed = 12345;
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // Clouds for atmospheric depth
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: random() * this.renderer.width * 2 - this.renderer.width / 2,
                y: 30 + random() * 70,
                scale: 0.6 + random() * 0.8,
                speed: 0.15 + random() * 0.25
            });
        }

        if (themeKey === 'Forest') {
            for (let i = 0; i < 18; i++) {
                this.elements.push({
                    type: 'mountain',
                    x: random() * this.renderer.width * 2 - this.renderer.width / 2,
                    y: this.renderer.height * 0.38,
                    radius: 110 + random() * 180,
                    parallax: 0.08
                });
                this.elements.push({
                    type: 'tree',
                    x: random() * this.renderer.width * 1.6 - this.renderer.width / 3,
                    y: this.renderer.height * 0.38 + 5,
                    size: 30 + random() * 45,
                    parallax: 0.25
                });
            }
        } else if (themeKey === 'City') {
            for (let i = 0; i < 28; i++) {
                this.elements.push({
                    type: 'building',
                    x: i * 45 - 200,
                    y: this.renderer.height * 0.38,
                    width: 32 + random() * 48,
                    height: 60 + random() * 160,
                    windows: Math.floor(2 + random() * 3),
                    color: i % 2 === 0 ? '#1f2937' : '#111827',
                    windowColor: i % 3 === 0 ? '#fbbf24' : '#60a5fa',
                    parallax: 0.12
                });
            }
        } else if (themeKey === 'Space') {
            for (let i = 0; i < 60; i++) {
                this.elements.push({
                    type: 'star',
                    x: random() * this.renderer.width,
                    y: random() * this.renderer.height * 0.4,
                    size: 1 + random() * 2.5,
                    phase: random() * Math.PI * 2,
                    parallax: 0.02
                });
            }
            this.elements.push({ type: 'planet', x: this.renderer.width * 0.2, y: this.renderer.height * 0.11, radius: 45, color1: '#ff5555', color2: '#880000', parallax: 0.04 });
            this.elements.push({ type: 'planet', x: this.renderer.width * 0.78, y: this.renderer.height * 0.18, radius: 28, color1: '#00e5ff', color2: '#0033aa', parallax: 0.07 });
        } else if (themeKey === 'Candy') {
            for (let i = 0; i < 16; i++) {
                this.elements.push({
                    type: 'hill',
                    x: random() * this.renderer.width * 1.5 - this.renderer.width * 0.25,
                    y: this.renderer.height * 0.38,
                    radius: 85 + random() * 125,
                    color1: i % 2 === 0 ? '#f472b6' : '#c084fc',
                    color2: i % 2 === 0 ? '#db2777' : '#9333ea',
                    parallax: 0.09
                });
                this.elements.push({
                    type: 'lollipop',
                    x: random() * this.renderer.width * 1.5 - this.renderer.width * 0.25,
                    y: this.renderer.height * 0.38,
                    size: 32 + random() * 22,
                    parallax: 0.22
                });
            }
        }
    }

    render(ctx, themeName, scrollOffset) {
        const themeKey = themeName ? themeName.charAt(0).toUpperCase() + themeName.slice(1).toLowerCase() : 'Forest';
        if (this.themeName !== themeKey) {
            this.setTheme(themeKey);
        }

        const width = this.renderer.width;
        const height = this.renderer.height;
        const horizon = height * 0.38;
        const now = Date.now();

        // 1. Draw Sky Gradient
        const skyGradients = {
            'Forest': ['#38bdf8', '#818cf8', '#a7f3d0'],
            'City': ['#0f172a', '#1e1b4b', '#312e81'],
            'Space': ['#030712', '#090d16', '#1e1b4b'],
            'Candy': ['#f472b6', '#f43f5e', '#fed7aa']
        };

        const colors = skyGradients[themeKey] || skyGradients['Forest'];
        const gradient = ctx.createLinearGradient(0, 0, 0, horizon + 40);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.6, colors[1]);
        gradient.addColorStop(1, colors[2]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. Draw Drifting Clouds (Forest/City/Candy)
        if (themeKey !== 'Space') {
            ctx.fillStyle = themeKey === 'City' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.55)';
            this.clouds.forEach(c => {
                const cx = (c.x + (now * 0.02 * c.speed)) % (width * 1.4) - width * 0.2;
                ctx.beginPath();
                ctx.arc(cx, c.y, 20 * c.scale, 0, Math.PI * 2);
                ctx.arc(cx + 15 * c.scale, c.y - 10 * c.scale, 25 * c.scale, 0, Math.PI * 2);
                ctx.arc(cx + 35 * c.scale, c.y, 18 * c.scale, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 3. Draw Parallax Background Elements
        this.elements.sort((a, b) => a.parallax - b.parallax);

        this.elements.forEach(el => {
            const offsetX = el.x - (scrollOffset * el.parallax) % width;
            [-width, 0, width].forEach(wrapOffset => {
                const drawX = offsetX + wrapOffset;
                
                if (el.type === 'mountain') {
                    const mGrad = ctx.createLinearGradient(drawX, el.y - el.radius, drawX, el.y);
                    mGrad.addColorStop(0, '#34d399');
                    mGrad.addColorStop(0.5, '#059669');
                    mGrad.addColorStop(1, '#064e3b');
                    ctx.fillStyle = mGrad;
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, Math.PI, 0);
                    ctx.fill();

                    // Snow cap
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, Math.PI * 0.65, Math.PI * 0.35, true);
                    ctx.fill();
                } else if (el.type === 'tree') {
                    const tGrad = ctx.createLinearGradient(drawX, el.y - el.size, drawX, el.y);
                    tGrad.addColorStop(0, '#10b981');
                    tGrad.addColorStop(1, '#047857');
                    ctx.fillStyle = tGrad;
                    ctx.beginPath();
                    ctx.moveTo(drawX, el.y - el.size);
                    ctx.lineTo(drawX - el.size/2, el.y);
                    ctx.lineTo(drawX + el.size/2, el.y);
                    ctx.closePath();
                    ctx.fill();
                } else if (el.type === 'building') {
                    ctx.fillStyle = el.color;
                    ctx.fillRect(drawX, el.y - el.height, el.width, el.height);
                    
                    // Roof border
                    ctx.fillStyle = '#374151';
                    ctx.fillRect(drawX - 2, el.y - el.height, el.width + 4, 4);

                    // Windows
                    ctx.fillStyle = el.windowColor;
                    for(let w = 0; w < el.windows; w++) {
                        for(let h = 0; h < el.height/22 - 1; h++) {
                            ctx.fillRect(drawX + 6 + w * 14, el.y - el.height + 12 + h * 20, 6, 9);
                        }
                    }
                } else if (el.type === 'star') {
                    const twinkle = Math.sin(now / 200 + el.phase) * 0.4 + 0.6;
                    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle.toFixed(2)})`;
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.size * twinkle, 0, Math.PI * 2);
                    ctx.fill();
                } else if (el.type === 'planet') {
                    const rGradient = ctx.createRadialGradient(drawX - el.radius/3, el.y - el.radius/3, el.radius/10, drawX, el.y, el.radius);
                    rGradient.addColorStop(0, el.color1);
                    rGradient.addColorStop(1, el.color2);
                    ctx.fillStyle = rGradient;
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, 0, Math.PI * 2);
                    ctx.fill();
                } else if (el.type === 'hill') {
                    const hGrad = ctx.createLinearGradient(drawX, el.y - el.radius, drawX, el.y);
                    hGrad.addColorStop(0, el.color1);
                    hGrad.addColorStop(1, el.color2);
                    ctx.fillStyle = hGrad;
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, Math.PI, 0);
                    ctx.fill();
                } else if (el.type === 'lollipop') {
                    // Stick
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(drawX - 3, el.y - el.size * 1.6, 6, el.size * 1.6);
                    // Top
                    const lGrad = ctx.createRadialGradient(drawX - el.size/4, el.y - el.size * 1.6 - el.size/4, 2, drawX, el.y - el.size * 1.6, el.size/2);
                    lGrad.addColorStop(0, '#f472b6');
                    lGrad.addColorStop(1, '#db2777');
                    ctx.fillStyle = lGrad;
                    ctx.beginPath();
                    ctx.arc(drawX, el.y - el.size * 1.6, el.size/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });

        // 4. Horizon Atmospheric Fog Gradient Overlay
        const fogGrad = ctx.createLinearGradient(0, horizon - 25, 0, horizon + 45);
        const fogThemeColors = {
            'Forest': ['rgba(255, 255, 255, 0)', 'rgba(209, 250, 229, 0.75)', 'rgba(255, 255, 255, 0)'],
            'City': ['rgba(15, 23, 42, 0)', 'rgba(49, 46, 129, 0.65)', 'rgba(15, 23, 42, 0)'],
            'Space': ['rgba(3, 7, 18, 0)', 'rgba(30, 27, 75, 0.70)', 'rgba(3, 7, 18, 0)'],
            'Candy': ['rgba(255, 255, 255, 0)', 'rgba(251, 207, 232, 0.75)', 'rgba(255, 255, 255, 0)']
        };
        const fogCols = fogThemeColors[themeKey] || fogThemeColors['Forest'];
        fogGrad.addColorStop(0, fogCols[0]);
        fogGrad.addColorStop(0.5, fogCols[1]);
        fogGrad.addColorStop(1, fogCols[2]);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, horizon - 25, width, 70);
    }
}

