/**
 * Renders 3D rotating power-up items on track and active aura/shield/rocket visual effects around player.
 */
export class PowerUpRenderer {
  /**
   * @param {import('./Renderer.js').Renderer} renderer 
   */
  constructor(renderer) {
    this.renderer = renderer;
    this.animTime = 0;
  }

  /**
   * Renders a power-up item on the road
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} item 
   */
  renderItem(ctx, item) {
    const p = this.renderer.project(item.x, item.y, item.z);
    if (!p.visible) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const scale = p.scale;
    const baseRadius = 32 * scale;

    // Glowing background aura
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;
    const glowR = baseRadius * 1.5 * pulse;

    const typeColors = {
      'MAGNET': { main: '#00D2FF', glow: 'rgba(0, 210, 255, 0.4)', icon: '🧲' },
      'SHIELD': { main: '#00FFCC', glow: 'rgba(0, 255, 204, 0.4)', icon: '🛡️' },
      'ROCKET': { main: '#FF6B00', glow: 'rgba(255, 107, 0, 0.4)', icon: '🚀' }
    };

    const style = typeColors[item.type] || typeColors['MAGNET'];

    // Outer glow
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, glowR), 0, Math.PI * 2);
    ctx.fillStyle = style.glow;
    ctx.fill();

    // 3D Capsule / Diamond container
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, baseRadius), 0, Math.PI * 2);
    ctx.fillStyle = '#1A1D24';
    ctx.strokeStyle = style.main;
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.shadowColor = style.main;
    ctx.shadowBlur = 12 * scale;
    ctx.fill();
    ctx.stroke();

    // Icon emoji centered
    const fontSize = Math.max(12, Math.floor(34 * scale));
    ctx.font = `${fontSize}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(style.icon, 0, 2 * scale);

    ctx.restore();
  }

  /**
   * Render active player aura / shield / rocket effects
   * @param {CanvasRenderingContext2D} ctx 
   * @param {object} player 
   * @param {string|null} activeType 
   * @param {number} remainingTime 
   */
  renderActiveAura(ctx, player, activeType, remainingTime = 0) {
    if (!activeType) return;

    const p = this.renderer.project(player.visualX, player.y, player.z || 320);
    if (!p.visible) return;

    this.animTime += 0.05;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (activeType === 'SHIELD') {
      // 3D Translucent Energy Shield Bubble around player
      const r = Math.max(20, (player.baseWidth || 85) * p.scale * 1.15);
      const glowPulse = Math.sin(Date.now() / 100) * 0.1;

      ctx.beginPath();
      ctx.arc(0, -r * 0.5, r * (1 + glowPulse), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 204, 0.22)';
      ctx.strokeStyle = '#00FFCC';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00FFCC';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.stroke();

      // Energy sheen highlight ring
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.7, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

    } else if (activeType === 'MAGNET') {
      // Pulsing Blue Magnetic Attraction Waves around feet
      const waveR = Math.max(15, 75 * p.scale * (1 + (this.animTime % 1.5)));
      const alpha = Math.max(0, 1 - (this.animTime % 1.5) / 1.5);

      ctx.beginPath();
      ctx.ellipse(0, 0, waveR * 1.4, waveR * 0.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (activeType === 'ROCKET') {
      // Hyper Rocket Thruster Flame trail beneath feet
      const flameH = Math.max(15, 60 * p.scale * (0.8 + Math.random() * 0.4));
      const flameW = Math.max(8, 30 * p.scale);

      ctx.beginPath();
      ctx.moveTo(-flameW / 2, 0);
      ctx.lineTo(0, flameH);
      ctx.lineTo(flameW / 2, 0);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, flameH);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, '#FFD700');
      grad.addColorStop(0.7, '#FF6B00');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#FF6B00';
      ctx.shadowBlur = 20;
      ctx.fill();
    }

    ctx.restore();
  }
}
