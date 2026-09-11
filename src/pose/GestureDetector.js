/**
 * Interprets landmarks into game gestures relative to calibration baseline
 * Uses a Zone Discrete Transition model for unambiguous, glitch-free control.
 */
export class GestureDetector {
  /**
   * @param {Object} calibrationResult result from Calibrator
   * @param {string} tier 'Small', 'Medium', or 'Tall'
   */
  constructor(calibrationResult, tier) {
    this.calibration = calibrationResult;
    this.tier = tier || 'Medium';

    this.currentGesture = null;
    this.hasNewGesture = false;

    // Cooldown timers for vertical actions
    this.jumpCooldown = 0;
    this.duckCooldown = 0;

    // Lateral zone state: 'CENTER', 'LEFT', 'RIGHT'
    this.currentZone = 'CENTER';

    // Thresholds by tier
    const xThreshMap = { Small: 0.05, Medium: 0.06, Tall: 0.07 };
    const yThreshMap = { Small: 0.14, Medium: 0.18, Tall: 0.22 };

    this.xThresh = xThreshMap[this.tier] || 0.06;
    this.yThresh = (yThreshMap[this.tier] || 0.18) * Math.max(this.calibration.torsoHeight || 0.3, 0.15);
  }

  /**
   * Clear state and reset to center zone
   */
  reset() {
    this.jumpCooldown = 0;
    this.duckCooldown = 0;
    this.currentZone = 'CENTER';
    this.currentGesture = null;
    this.hasNewGesture = false;
  }

  /**
   * Processes landmarks, detects gestures
   * @param {Array} landmarks 
   * @param {number} dt delta time in ms
   */
  update(landmarks, dt) {
    this.hasNewGesture = false;

    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;
    if (this.duckCooldown > 0) this.duckCooldown -= dt;

    if (!landmarks) {
      this.currentGesture = null;
      return;
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftShoulder || !rightShoulder) {
      this.currentGesture = null;
      return;
    }

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip && rightHip) ? (leftHip.y + rightHip.y) / 2 : avgShoulderY + 0.3;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipX = (leftHip && rightHip) ? (leftHip.x + rightHip.x) / 2 : shoulderX;
    const centerX = (shoulderX + hipX) / 2;

    const { baselineShoulderY, baselineHipY, baselineCenterX } = this.calibration;
    const dx = centerX - baselineCenterX;

    let triggeredGesture = null;

    // ----- 1. LATERAL ZONE DISCRETE TRANSITION LOGIC -----
    let newZone = this.currentZone;
    const buffer = 0.015; // Hysteresis buffer to prevent chattering at zone boundary

    if (this.currentZone === 'CENTER') {
      if (dx > this.xThresh) newZone = 'LEFT';         // Stepped left in real life
      else if (dx < -this.xThresh) newZone = 'RIGHT';   // Stepped right in real life
    } else if (this.currentZone === 'LEFT') {
      if (dx < this.xThresh - buffer) newZone = 'CENTER';
    } else if (this.currentZone === 'RIGHT') {
      if (dx > -this.xThresh + buffer) newZone = 'CENTER';
    }

    if (newZone !== this.currentZone) {
      // Determine discrete lateral action
      if (this.currentZone === 'CENTER' && newZone === 'LEFT') triggeredGesture = 'SLIDE_LEFT';
      else if (this.currentZone === 'RIGHT' && newZone === 'CENTER') triggeredGesture = 'SLIDE_LEFT';
      else if (this.currentZone === 'RIGHT' && newZone === 'LEFT') triggeredGesture = 'SLIDE_LEFT';
      else if (this.currentZone === 'CENTER' && newZone === 'RIGHT') triggeredGesture = 'SLIDE_RIGHT';
      else if (this.currentZone === 'LEFT' && newZone === 'CENTER') triggeredGesture = 'SLIDE_RIGHT';
      else if (this.currentZone === 'LEFT' && newZone === 'RIGHT') triggeredGesture = 'SLIDE_RIGHT';

      this.currentZone = newZone;
    }

    // ----- 2. VERTICAL TRANSIENT ACTIONS (JUMP & DUCK) -----
    if (!triggeredGesture) {
      // Jump: upper body moves upward relative to baseline
      if (this.jumpCooldown <= 0 && (avgShoulderY < baselineShoulderY - this.yThresh || avgHipY < baselineHipY - this.yThresh)) {
        triggeredGesture = 'JUMP';
        this.jumpCooldown = 450; // 450ms jump action cooldown
      }
      // Duck: shoulders/chest drop relative to baseline
      else if (this.duckCooldown <= 0 && avgShoulderY > baselineShoulderY + this.yThresh) {
        triggeredGesture = 'DUCK';
        this.duckCooldown = 450; // 450ms duck action cooldown
      }
    }

    if (triggeredGesture) {
      this.currentGesture = triggeredGesture;
      this.hasNewGesture = true;
    } else {
      this.currentGesture = null;
    }
  }
}
