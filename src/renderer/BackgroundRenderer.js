export class BackgroundRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.themeName = 'Forest';
        this.elements = [];
        this.skyGradient = null;
    }

    setTheme(themeName) {
        this.themeName = themeName;
        this.elements = [];
        
        // Seed random heights for consistency within a theme run
        let seed = 12345;
        const random = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        if (themeName === 'Forest') {
            for (let i = 0; i < 20; i++) {
                this.elements.push({
                    type: 'mountain',
                    x: random() * this.renderer.width * 2 - this.renderer.width / 2,
                    y: this.renderer.height * 0.4 - random() * 100,
                    radius: 100 + random() * 200,
                    parallax: 0.1
                });
                this.elements.push({
                    type: 'tree',
                    x: random() * this.renderer.width * 1.5 - this.renderer.width / 4,
                    y: this.renderer.height * 0.38 + random() * 20,
                    size: 20 + random() * 40,
                    parallax: 0.3
                });
            }
        } else if (themeName === 'City') {
            for (let i = 0; i < 30; i++) {
                this.elements.push({
                    type: 'building',
                    x: i * 50 - 200,
                    y: this.renderer.height * 0.38,
                    width: 30 + random() * 50,
                    height: 50 + random() * 150,
                    windows: Math.floor(2 + random() * 3),
                    parallax: 0.15
                });
            }
        } else if (themeName === 'Space') {
            for (let i = 0; i < 50; i++) {
                this.elements.push({
                    type: 'star',
                    x: random() * this.renderer.width,
                    y: random() * this.renderer.height * 0.4,
                    size: random() * 3,
                    parallax: 0.02
                });
            }
            this.elements.push({ type: 'planet', x: this.renderer.width * 0.2, y: this.renderer.height * 0.1, radius: 40, color1: '#ff5555', color2: '#aa0000', parallax: 0.05 });
            this.elements.push({ type: 'planet', x: this.renderer.width * 0.8, y: this.renderer.height * 0.2, radius: 25, color1: '#5555ff', color2: '#0000aa', parallax: 0.08 });
        } else if (themeName === 'Candy') {
            for (let i = 0; i < 15; i++) {
                this.elements.push({
                    type: 'hill',
                    x: random() * this.renderer.width * 1.5 - this.renderer.width * 0.25,
                    y: this.renderer.height * 0.4,
                    radius: 80 + random() * 120,
                    parallax: 0.1
                });
                this.elements.push({
                    type: 'lollipop',
                    x: random() * this.renderer.width * 1.5 - this.renderer.width * 0.25,
                    y: this.renderer.height * 0.38,
                    size: 30 + random() * 20,
                    parallax: 0.2
                });
            }
        }
    }

    render(ctx, themeName, scrollOffset) {
        if (this.themeName !== themeName) {
            this.setTheme(themeName);
        }

        const width = this.renderer.width;
        const height = this.renderer.height;
        const horizon = height * 0.38;

        // Draw Sky
        if (!this.skyGradient) {
            this.skyGradient = ctx.createLinearGradient(0, 0, 0, horizon);
        }
        
        const skyGradients = {
            'Forest': ['#87CEEB', '#4a9e4a'],
            'City': ['#1a1a2e', '#16213e'],
            'Space': ['#0a0a2e', '#1a0a3e'],
            'Candy': ['#ffb6c1', '#dda0dd']
        };

        const colors = skyGradients[themeName] || skyGradients['Forest'];
        const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height); // Fill full screen just in case

        // Draw elements with parallax
        this.elements.sort((a, b) => a.parallax - b.parallax);

        this.elements.forEach(el => {
            const offsetX = el.x - (scrollOffset * el.parallax) % width;
            // Draw multiple times to wrap around screen
            [-width, 0, width].forEach(wrapOffset => {
                const drawX = offsetX + wrapOffset;
                
                if (el.type === 'mountain') {
                    ctx.fillStyle = '#228B22';
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, Math.PI, 0);
                    ctx.fill();
                } else if (el.type === 'tree') {
                    ctx.fillStyle = '#006400';
                    ctx.beginPath();
                    ctx.moveTo(drawX, el.y);
                    ctx.lineTo(drawX - el.size/2, el.y);
                    ctx.lineTo(drawX, el.y - el.size);
                    ctx.lineTo(drawX + el.size/2, el.y);
                    ctx.fill();
                } else if (el.type === 'building') {
                    ctx.fillStyle = '#2c3e50';
                    ctx.fillRect(drawX, el.y - el.height, el.width, el.height);
                    // Windows
                    ctx.fillStyle = '#f1c40f';
                    for(let w=0; w<el.windows; w++) {
                        for(let h=0; h<el.height/20 - 1; h++) {
                            ctx.fillRect(drawX + 5 + w*15, el.y - el.height + 10 + h*20, 5, 8);
                        }
                    }
                } else if (el.type === 'star') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.size, 0, Math.PI * 2);
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
                    ctx.fillStyle = '#ff69b4';
                    ctx.beginPath();
                    ctx.arc(drawX, el.y, el.radius, Math.PI, 0);
                    ctx.fill();
                } else if (el.type === 'lollipop') {
                    // Stick
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(drawX - 2, el.y - el.size*1.5, 4, el.size*1.5);
                    // Top
                    ctx.fillStyle = '#ff1493';
                    ctx.beginPath();
                    ctx.arc(drawX, el.y - el.size*1.5, el.size/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }
}
