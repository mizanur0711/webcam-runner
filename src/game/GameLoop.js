/**
 * Dual-rate game loop.
 * - Render loop: 60fps via requestAnimationFrame
 * - Pose inference: ~15fps (every ~66ms)
 * - Game logic: fixed timestep, capped dt
 */
export class GameLoop {
  /**
   * @param {Object} params
   * @param {import('./GameStateMachine.js').GameStateMachine} params.stateMachine
   * @param {import('../pose/PoseDetector.js').poseDetector} params.poseDetector
   * @param {import('../renderer/Renderer.js').Renderer} params.renderer
   * @param {HTMLVideoElement} params.videoElement
   */
  constructor({ stateMachine, poseDetector, renderer, videoElement }) {
    this.stateMachine = stateMachine;
    this.poseDetector = poseDetector;
    this.renderer = renderer;
    this.videoElement = videoElement;

    this._isPaused = false;
    this.lastTime = 0;
    this.lastPoseTime = 0;
    this.rafId = null;

    /** @type {Array|null} Raw landmarks array (33 NormalizedLandmark) or null */
    this.landmarks = null;

    // Bind the loop once to avoid creating new function references
    this._boundLoop = this._loop.bind(this);

    // Page visibility handling — pause loop when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._isPaused = true;
      } else {
        this._isPaused = false;
        this.lastTime = performance.now();
      }
    });
  }

  get isPaused() {
    return this._isPaused;
  }

  /** Start the game loop */
  start() {
    this.lastTime = performance.now();
    this.lastPoseTime = 0;
    this.rafId = requestAnimationFrame(this._boundLoop);
  }

  /** Stop the game loop */
  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Main loop callback
   * @param {number} timestamp - High-res timestamp from requestAnimationFrame
   * @private
   */
  _loop(timestamp) {
    if (this._isPaused) {
      this.rafId = requestAnimationFrame(this._boundLoop);
      return;
    }

    try {
      // Delta time in seconds, capped to prevent massive jumps on lag
      let dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      if (dt > 0.1) dt = 0.1;
      if (dt <= 0) dt = 1 / 60;

      // ----- Pose inference at ~15fps (every ~66ms) -----
      if (timestamp - this.lastPoseTime > 66 && this.poseDetector) {
        this.lastPoseTime = timestamp;
        if (this.videoElement && this.videoElement.readyState >= 2) {
          try {
            const result = this.poseDetector.detect(this.videoElement, timestamp);
            this.landmarks = result ? result.landmarks : null;
          } catch (e) {
            console.warn('Pose detection error:', e);
          }
        }
      }

      // ----- Game logic update -----
      if (this.stateMachine) {
        this.stateMachine.update(dt, this.landmarks);
      }

      // ----- Render -----
      if (this.renderer && this.stateMachine) {
        this.stateMachine.render(this.renderer.gameCtx, this.renderer.bgCtx, this.renderer.uiCtx);

        // Update PiP webcam overlay with skeleton detection & gesture feedback
        if (this.videoElement) {
          const calibration = this.stateMachine.gestureDetector ? this.stateMachine.gestureDetector.calibration : null;
          const currentGesture = this.stateMachine.gestureDetector ? this.stateMachine.gestureDetector.currentGesture : null;
          this.renderer.drawPiP(this.videoElement, this.landmarks, calibration, currentGesture);
        }
      }
    } catch (loopError) {
      console.error('Error inside GameLoop:', loopError);
    } finally {
      this.rafId = requestAnimationFrame(this._boundLoop);
    }
  }
}
