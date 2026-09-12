/**
 * 7-state machine orchestrating the full game flow.
 * States: IDLE → DETECTED → CALIBRATING → COUNTDOWN → PLAYING ⇄ PAUSED → GAME_OVER → IDLE
 */
import { GestureDetector } from '../pose/GestureDetector.js';

export class GameStateMachine {
  /**
   * @param {Object} systems - All game subsystems
   */
  constructor({ presenceDetector, calibrator, obstacleManager, collisionDetector, scoreManager, difficultyManager, audioManager, renderer, uiRenderer, characterRenderer, obstacleRenderer, roadRenderer, backgroundRenderer, collectibleManager, collectibleRenderer, particleManager, particleRenderer }) {
    this.sys = { presenceDetector, calibrator, obstacleManager, collisionDetector, scoreManager, difficultyManager, audioManager, renderer, uiRenderer, characterRenderer, obstacleRenderer, roadRenderer, backgroundRenderer, collectibleManager, collectibleRenderer, particleManager, particleRenderer };
    if (this.sys.obstacleManager && this.sys.difficultyManager) {
      this.sys.obstacleManager.init(this.sys.difficultyManager);
    }

    /** @type {GestureDetector|null} */
    this.gestureDetector = null;

    this.currentState = 'IDLE';
    this.stateData = {};

    // Player state
    this.player = {
      lane: 0,
      y: 0,
      vy: 0,
      isJumping: false,
      isDucking: false,
      duckTimer: 0,
      animFrame: 0,
      visualX: 0,
      tilt: 0,
      z: 320,
      baseWidth: 85,
      depth: 40,
      tier: 'MEDIUM',
      state: 'RUNNING'
    };

    this.physics = {
      jumpForce: 720,
      gravity: 1800,
      duckDuration: 0.55,
      laneWidth: 180,
      responsiveness: 16
    };

    this.theme = 'Forest';
    this.onStateChange = null;
  }

  /**
   * Transition to a new state
   * @param {string} newState
   */
  transition(newState) {
    const exitMethod = `exit_${this.currentState}`;
    if (this[exitMethod]) this[exitMethod]();

    this.previousState = this.currentState;
    this.currentState = newState;

    const enterMethod = `enter_${newState}`;
    if (this[enterMethod]) this[enterMethod]();

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(newState);
    }
  }


  /**
   * @param {number} dt - Delta time in seconds
   * @param {Array|null} landmarks - Array of 33 NormalizedLandmark or null
   */
  update(dt, landmarks) {
    const method = `update_${this.currentState}`;
    if (this[method]) this[method](dt, landmarks);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx - Game canvas
   * @param {CanvasRenderingContext2D} bgCtx - Background canvas
   * @param {CanvasRenderingContext2D} uiCtx - UI canvas
   */
  render(ctx, bgCtx, uiCtx) {
    const method = `render_${this.currentState}`;
    if (this[method]) this[method](ctx, bgCtx, uiCtx);
  }

  // ================================================================
  // IDLE
  // ================================================================
  enter_IDLE() {
    const themes = ['Forest', 'City', 'Space', 'Candy'];
    this.theme = themes[Math.floor(Math.random() * themes.length)];
    this.sys.scoreManager.reset();
    this.sys.obstacleManager.reset();
    this.sys.presenceDetector.reset();
    this.gestureDetector = null;
    this.stateData = { scrollOffset: 0 };
    this.resetPlayer();
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.setTheme(this.theme);
  }

  update_IDLE(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    // Slow scroll for visual appeal
    this.stateData.scrollOffset = (this.stateData.scrollOffset || 0) + 60 * dt;
    if (this.sys.presenceDetector.justDetected) {
      this.transition('DETECTED');
    }
  }

  render_IDLE(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);
    if (this.sys.uiRenderer) this.sys.uiRenderer.renderIdle(uiCtx);
  }

  // ================================================================
  // DETECTED
  // ================================================================
  enter_DETECTED() {
    if (this.sys.audioManager) this.sys.audioManager.playDetected();
    this.stateData.timer = 0.5;
  }

  update_DETECTED(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.presenceDetector.justLeft) {
      this.transition('IDLE');
      return;
    }
    this.stateData.scrollOffset = (this.stateData.scrollOffset || 0) + 60 * dt;
    this.stateData.timer -= dt;
    if (this.stateData.timer <= 0) {
      this.transition('CALIBRATING');
    }
  }

  render_DETECTED(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);
    if (this.sys.uiRenderer) this.sys.uiRenderer.renderDetected(uiCtx);
  }

  // ================================================================
  // CALIBRATING
  // ================================================================
  enter_CALIBRATING() {
    this.sys.calibrator.start();
  }

  update_CALIBRATING(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.presenceDetector.justLeft) {
      this.transition('IDLE');
      return;
    }

    // Calibrator.update takes (landmarks, dt) — note: dt in ms for calibrator
    this.sys.calibrator.update(landmarks, dt * 1000);

    if (this.sys.calibrator.isComplete) {
      const result = this.sys.calibrator.result;
      const tierMap = { 'Small': 'SMALL', 'Medium': 'MEDIUM', 'Tall': 'TALL' };
      const tier = tierMap[result.heightTier] || 'MEDIUM';

      // Create gesture detector with calibration result
      this.gestureDetector = new GestureDetector(result, result.heightTier);

      // Set player tier and base dimensions
      this.player.tier = tier;
      if (tier === 'SMALL') this.player.baseWidth = 80;
      else if (tier === 'TALL') this.player.baseWidth = 90;
      else this.player.baseWidth = 85;

      // Init difficulty for this tier
      this.sys.difficultyManager.init(tier);

      if (this.sys.audioManager) this.sys.audioManager.playCalibrationDone();
      this.transition('TRAINING');
    } else if (this.sys.calibrator.isFailed && !this.sys.calibrator.isComplete) {
      this.transition('IDLE');
    }

    this.stateData.scrollOffset = (this.stateData.scrollOffset || 0) + 60 * dt;
  }

  render_CALIBRATING(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);
    if (this.sys.uiRenderer) {
      this.sys.uiRenderer.renderCalibrating(
        uiCtx,
        this.sys.calibrator.progress,
        this.sys.calibrator.tooClose
      );
    }
  }

  // ================================================================
  // TRAINING (Practice Lobby)
  // ================================================================
  enter_TRAINING() {
    this.resetPlayer();
    this.stateData.practiced = {
      SLIDE_LEFT: false,
      SLIDE_RIGHT: false,
      JUMP: false,
      DUCK: false
    };
    this.stateData.scrollOffset = this.stateData.scrollOffset || 0;
  }

  update_TRAINING(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.presenceDetector.justLeft) {
      this.transition('IDLE');
      return;
    }

    // Scroll road gently
    this.stateData.scrollOffset += 40 * dt;

    // Gesture detection in Training Lobby
    if (this.gestureDetector && landmarks) {
      this.gestureDetector.update(landmarks, dt * 1000);

      // Direct lane sync with zone position
      if (this.gestureDetector.targetLane !== undefined && this.player.lane !== this.gestureDetector.targetLane) {
        this.player.lane = this.gestureDetector.targetLane;
        if (this.sys.audioManager) this.sys.audioManager.playSlide();
      }

      if (this.gestureDetector.hasNewGesture) {
        const gesture = this.gestureDetector.currentGesture;
        if (this.stateData.practiced) {
          this.stateData.practiced[gesture] = true;
        }

        if (gesture === 'JUMP' && !this.player.isJumping) {
          this.player.isJumping = true;
          this.player.vy = this.physics.jumpForce;
          this.player.isDucking = false;
          this.player.duckTimer = 0;
          if (this.sys.audioManager) this.sys.audioManager.playJump();
        }
        if (gesture === 'DUCK' && !this.player.isJumping) {
          this.player.isDucking = true;
          this.player.duckTimer = this.physics.duckDuration;
          if (this.sys.audioManager) this.sys.audioManager.playDuck();
        }
      }
    }

    // Jump physics
    if (this.player.isJumping) {
      this.player.vy -= this.physics.gravity * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.y <= 0) {
        this.player.y = 0;
        this.player.isJumping = false;
        this.player.vy = 0;
      }
    }

    // Duck timer
    if (this.player.isDucking) {
      this.player.duckTimer -= dt;
      if (this.player.duckTimer <= 0) {
        this.player.isDucking = false;
      }
    }

    // Smooth lane switching
    const targetX = this.player.lane * this.physics.laneWidth;
    const prevX = this.player.visualX;
    const decay = 1 - Math.exp(-this.physics.responsiveness * dt);
    this.player.visualX += (targetX - this.player.visualX) * decay;

    // Banking tilt
    const lateralVelocity = (this.player.visualX - prevX) / Math.max(dt, 0.001);
    const maxTilt = 0.22;
    const targetTilt = -(lateralVelocity / 800) * maxTilt;
    this.player.tilt += (targetTilt - this.player.tilt) * (1 - Math.exp(-20 * dt));

    // Player state for rendering
    if (this.player.isJumping) this.player.state = 'JUMPING';
    else if (this.player.isDucking) this.player.state = 'DUCKING';
    else this.player.state = 'RUNNING';

    // Animation frame
    this.player.animFrame += dt * 8;
  }

  render_TRAINING(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);

    // Draw character
    if (this.sys.characterRenderer) {
      this.sys.characterRenderer.render(ctx, {
        ...this.player,
        x: this.player.visualX
      });
    }

    // Draw Training HUD
    if (this.sys.uiRenderer) {
      this.sys.uiRenderer.renderTraining(
        uiCtx,
        this.stateData.practiced,
        this.gestureDetector ? this.gestureDetector.currentGesture : null
      );
    }
  }

  rotateTheme() {
    const themes = ['Forest', 'City', 'Space', 'Candy'];
    const currentIndex = themes.indexOf(this.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.theme = themes[nextIndex];
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.setTheme(this.theme);
  }

  // ================================================================
  // COUNTDOWN
  // ================================================================
  enter_COUNTDOWN() {
    this.rotateTheme();
    this.stateData.counter = 3;
    this.stateData.timer = 0.5;
    this.resetPlayer();
    if (this.sys.audioManager) this.sys.audioManager.playCountdownBeep(3);
  }


  update_COUNTDOWN(dt, landmarks) {
    this.stateData.timer -= dt;
    this.stateData.scrollOffset = (this.stateData.scrollOffset || 0) + 60 * dt;
    if (this.stateData.timer <= 0) {
      this.stateData.counter--;
      if (this.stateData.counter > 0) {
        this.stateData.timer = 0.5;
        if (this.sys.audioManager) this.sys.audioManager.playCountdownBeep(this.stateData.counter);
      } else {
        if (this.sys.audioManager) this.sys.audioManager.playCountdownBeep(0);
        this.transition('PLAYING');
      }
    }
  }

  render_COUNTDOWN(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);
    if (this.sys.characterRenderer) {
      this.sys.characterRenderer.render(ctx, {
        ...this.player,
        x: this.player.visualX,
        state: 'RUNNING'
      });
    }
    if (this.sys.uiRenderer) this.sys.uiRenderer.renderCountdown(uiCtx, this.stateData.counter);
  }

  // ================================================================
  // PLAYING
  // ================================================================
  enter_PLAYING() {
    if (this.previousState !== 'PAUSED') {
      this.sys.obstacleManager.reset();
      if (this.sys.collectibleManager) this.sys.collectibleManager.reset();
      if (this.sys.particleManager) this.sys.particleManager.reset();
      this.sys.scoreManager.reset();
      this.sys.difficultyManager.reset();
    }
    if (this.gestureDetector) this.gestureDetector.reset();
    this.stateData.scrollOffset = this.stateData.scrollOffset || 0;
  }

  update_PLAYING(dt, landmarks) {
    // Check presence
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.presenceDetector.justLeft) {
      this.transition('PAUSED');
      return;
    }

    // Track jump landing for particle emission
    const wasJumping = this.player.isJumping;

    // Gesture detection
    if (this.gestureDetector && landmarks) {
      this.gestureDetector.update(landmarks, dt * 1000);

      // Direct lane sync with zone position
      if (this.gestureDetector.targetLane !== undefined && this.player.lane !== this.gestureDetector.targetLane) {
        this.player.lane = this.gestureDetector.targetLane;
        if (this.sys.audioManager) this.sys.audioManager.playSlide();
      }

      if (this.gestureDetector.hasNewGesture) {
        const gesture = this.gestureDetector.currentGesture;

        if (gesture === 'JUMP' && !this.player.isJumping) {
          this.player.isJumping = true;
          this.player.vy = this.physics.jumpForce;
          this.player.isDucking = false;
          this.player.duckTimer = 0;
          if (this.sys.audioManager) this.sys.audioManager.playJump();
        }
        if (gesture === 'DUCK' && !this.player.isJumping) {
          this.player.isDucking = true;
          this.player.duckTimer = this.physics.duckDuration;
          if (this.sys.audioManager) this.sys.audioManager.playDuck();
        }
      }
    }

    // Jump physics
    if (this.player.isJumping) {
      this.player.vy -= this.physics.gravity * dt;
      this.player.y += this.player.vy * dt;
      if (this.player.y <= 0) {
        this.player.y = 0;
        this.player.isJumping = false;
        this.player.vy = 0;
      }
    }

    // Detect jump landing impact
    if (wasJumping && !this.player.isJumping && this.sys.particleManager) {
      this.sys.particleManager.emitLandingBurst(this.player.visualX, 320);
    }

    // Duck timer
    if (this.player.isDucking) {
      this.player.duckTimer -= dt;
      if (this.player.duckTimer <= 0) {
        this.player.isDucking = false;
      }
    }

    // Smooth lane switching (exponential smoothing)
    const targetX = this.player.lane * this.physics.laneWidth;
    const prevX = this.player.visualX;
    const decay = 1 - Math.exp(-this.physics.responsiveness * dt);
    this.player.visualX += (targetX - this.player.visualX) * decay;

    // Banking tilt
    const lateralVelocity = (this.player.visualX - prevX) / Math.max(dt, 0.001);
    const maxTilt = 0.22;
    const targetTilt = -(lateralVelocity / 800) * maxTilt;
    this.player.tilt += (targetTilt - this.player.tilt) * (1 - Math.exp(-20 * dt));

    // Player state for rendering
    if (this.player.isJumping) this.player.state = 'JUMPING';
    else if (this.player.isDucking) this.player.state = 'DUCKING';
    else this.player.state = 'RUNNING';

    // Difficulty / speed
    this.sys.difficultyManager.update(dt);
    const speed = this.sys.difficultyManager.getCurrentSpeed();

    // Obstacles
    this.sys.obstacleManager.update(dt, speed);

    // Collectibles update & pickup detection
    if (this.sys.collectibleManager) {
      this.sys.collectibleManager.update(dt, speed, this.sys.obstacleManager.getActiveObstacles());
      const starsCaught = this.sys.collectibleManager.checkPickups(this.player);
      if (starsCaught > 0) {
        this.sys.scoreManager.addStar(starsCaught);
        if (this.sys.audioManager) this.sys.audioManager.playStarPickup();
        if (this.sys.particleManager) {
          this.sys.particleManager.emitStarSparkles(this.player.visualX, this.player.y + 40, 320);
        }
      }
    }

    // Particles update & footstep dust
    if (this.sys.particleManager) {
      this.sys.particleManager.update(dt, speed);
      if (!this.player.isJumping && !this.player.isDucking) {
        this.stateData.dustTimer = (this.stateData.dustTimer || 0) + dt;
        if (this.stateData.dustTimer > 0.12) {
          this.sys.particleManager.emitFootstepDust(this.player.visualX, 320);
          this.stateData.dustTimer = 0;
        }
      }
    }

    // Score
    const scoreMult = this.sys.difficultyManager.getScoreMultiplier();
    this.sys.scoreManager.update(dt, speed, scoreMult);

    // Scroll
    this.stateData.scrollOffset += speed * 60 * dt;

    // Collision
    const hit = this.sys.collisionDetector.check(this.player, this.sys.obstacleManager.getActiveObstacles());
    if (hit) {
      this.transition('GAME_OVER');
      return;
    }

    // Animation frame
    this.player.animFrame += dt * speed * 2;
  }

  render_PLAYING(ctx, bgCtx, uiCtx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (this.sys.backgroundRenderer) this.sys.backgroundRenderer.render(bgCtx, this.theme, this.stateData.scrollOffset || 0);
    if (this.sys.roadRenderer) this.sys.roadRenderer.render(ctx, this.stateData.scrollOffset || 0, this.theme);

    // Draw obstacles (back to front for proper layering)
    const obstacles = this.sys.obstacleManager.getActiveObstacles();
    if (this.sys.obstacleRenderer && obstacles.length > 0) {
      const sorted = [...obstacles].sort((a, b) => b.z - a.z);
      for (const obs of sorted) {
        this.sys.obstacleRenderer.render(ctx, obs, this.theme);
      }
    }

    // Draw collectibles
    const collectibles = this.sys.collectibleManager ? this.sys.collectibleManager.getActiveCollectibles() : [];
    if (this.sys.collectibleRenderer && collectibles.length > 0) {
      const sortedItems = [...collectibles].sort((a, b) => b.z - a.z);
      for (const item of sortedItems) {
        this.sys.collectibleRenderer.render(ctx, item);
      }
    }

    // Draw character
    if (this.sys.characterRenderer) {
      this.sys.characterRenderer.render(ctx, {
        ...this.player,
        x: this.player.visualX
      });
    }

    // Draw 3D particles (dust, sparkles, rings, confetti)
    const particles = this.sys.particleManager ? this.sys.particleManager.getActiveParticles() : [];
    if (this.sys.particleRenderer && particles.length > 0) {
      const sortedParticles = [...particles].sort((a, b) => b.z - a.z);
      for (const p of sortedParticles) {
        this.sys.particleRenderer.render(ctx, p);
      }
    }

    // HUD
    if (this.sys.uiRenderer) {
      this.sys.uiRenderer.renderHUD(
        uiCtx,
        Math.floor(this.sys.scoreManager.currentScore),
        this.sys.scoreManager.highScore,
        this.player.tier,
        this.gestureDetector ? this.gestureDetector.currentGesture : null,
        this.sys.difficultyManager ? this.sys.difficultyManager.getBadge() : null,
        this.sys.scoreManager.starsCollected
      );
    }
  }

  // ================================================================
  // PAUSED
  // ================================================================
  enter_PAUSED() {
    this.stateData.pauseTime = Date.now();
  }

  update_PAUSED(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.presenceDetector.justDetected) {
      const pausedDuration = (Date.now() - this.stateData.pauseTime) / 1000;
      if (pausedDuration > 10) {
        // Re-calibrate (possible sibling swap)
        this.transition('CALIBRATING');
      } else {
        // Quick resume
        this.transition('PLAYING');
      }
    }
  }

  render_PAUSED(ctx, bgCtx, uiCtx) {
    // Render frozen game scene
    this.render_PLAYING(ctx, bgCtx, uiCtx);
    // Overlay pause UI
    if (this.sys.uiRenderer) this.sys.uiRenderer.renderPaused(uiCtx);
  }

  // ================================================================
  // GAME_OVER
  // ================================================================
  enter_GAME_OVER() {
    this.sys.scoreManager.finalizeRun();
    if (this.sys.audioManager) {
      this.sys.audioManager.playCollision();
      if (this.sys.scoreManager.isNewHighScore) {
        if (this.sys.particleManager) {
          this.sys.particleManager.emitConfettiShower();
        }
        setTimeout(() => {
          if (this.sys.audioManager) this.sys.audioManager.playHighScore();
        }, 300);
      }
    }
    this.stateData.gameOverTimer = 2.5;
  }

  update_GAME_OVER(dt, landmarks) {
    this.sys.presenceDetector.update(landmarks);
    if (this.sys.particleManager) {
      this.sys.particleManager.update(dt, 0); // Confetti falling animation
    }
    if (this.sys.presenceDetector.justLeft) {
      this.transition('IDLE');
      return;
    }
    this.stateData.gameOverTimer -= dt;
    if (this.stateData.gameOverTimer <= 0) {
      if (this.sys.presenceDetector.isPresent) {
        this.transition('COUNTDOWN');
      } else {
        this.transition('IDLE');
      }
    }
  }

  render_GAME_OVER(ctx, bgCtx, uiCtx) {
    // Render frozen game scene
    this.render_PLAYING(ctx, bgCtx, uiCtx);
    // Overlay game over UI
    if (this.sys.uiRenderer) {
      this.sys.uiRenderer.renderGameOver(
        uiCtx,
        Math.floor(this.sys.scoreManager.currentScore),
        this.sys.scoreManager.highScore,
        this.sys.scoreManager.isNewHighScore,
        this.sys.scoreManager.starsCollected
      );
    }
  }

  // ================================================================

  // Helpers
  // ================================================================
  resetPlayer() {
    this.player.lane = 0;
    this.player.y = 0;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.isDucking = false;
    this.player.duckTimer = 0;
    this.player.animFrame = 0;
    this.player.visualX = 0;
    this.player.tilt = 0;
    this.player.state = 'RUNNING';
  }
}
