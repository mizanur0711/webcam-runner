/**
 * Interprets landmarks into game gestures relative to calibration baseline
 * Uses a Zone Discrete Transition model + Direct Positional Lane mapping
 * for unambiguous, glitch-free control tailored for young kids.
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

    // Cooldown & Lockout timers for vertical actions
    this.jumpCooldown = 0;
    this.duckCooldown = 0;
    this.landingLockout = 0; // Lockout DUCK immediately after jumping/landing

    // Lateral zone state: 'CENTER', 'LEFT', 'RIGHT'
    this.currentZone = 'CENTER';
    this.targetLane = 0; // -1: LEFT, 0: CENTER, 1: RIGHT

    // Tier-adjusted thresholds
    const xThreshMap = { Small: 0.05, Medium: 0.06, Tall: 0.07 };
    this.xThresh = xThreshMap[this.tier] || 0.06;

    // Vertical thresholds tailored to torso height for kids
    const torsoH = Math.max(this.calibration.torsoHeight || 0.3, 0.15);
    this.jumpThresh = Math.max(0.035, 0.11 * torsoH);
    this.duckThresh = Math.max(0.075, 0.20 * torsoH); // Higher threshold to eliminate accidental ducks
  }

  /**
   * Clear state and reset to center zone
   */
  reset() {
    this.jumpCooldown = 0;
    this.duckCooldown = 0;
    this.landingLockout = 0;
    this.currentZone = 'CENTER';
    this.targetLane = 0;
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
    if (this.landingLockout > 0) this.landingLockout -= dt;

    if (!landmarks) {
      this.currentGesture = null;
      return;
    }

    const nose = landmarks[0];
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
    const noseY = nose ? nose.y : avgShoulderY - 0.12;

    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipX = (leftHip && rightHip) ? (leftHip.x + rightHip.x) / 2 : shoulderX;
    const centerX = (shoulderX + hipX) / 2;

    const { baselineShoulderY, baselineHipY, baselineCenterX, baselineNoseY } = this.calibration;
    const dx = centerX - baselineCenterX;

    let triggeredGesture = null;

    // ----- 1. LATERAL ZONE DISCRETE TRANSITION & DIRECT POSITIONAL MAPPING -----
    let newZone = this.currentZone;
    const buffer = 0.018; // Hysteresis buffer to prevent jitter at zone boundary

    if (this.currentZone === 'CENTER') {
      if (dx > this.xThresh) newZone = 'LEFT';         // Stepped left physically (screen right in mirrored view)
      else if (dx < -this.xThresh) newZone = 'RIGHT';   // Stepped right physically
    } else if (this.currentZone === 'LEFT') {
      if (dx < this.xThresh - buffer) newZone = 'CENTER';
    } else if (this.currentZone === 'RIGHT') {
      if (dx > -this.xThresh + buffer) newZone = 'CENTER';
    }

    if (newZone !== this.currentZone) {
      if (newZone === 'LEFT') {
        triggeredGesture = 'SLIDE_LEFT';
        this.targetLane = -1;
      } else if (newZone === 'RIGHT') {
        triggeredGesture = 'SLIDE_RIGHT';
        this.targetLane = 1;
      } else if (newZone === 'CENTER') {
        // Transition back to center
        triggeredGesture = (this.currentZone === 'LEFT') ? 'SLIDE_RIGHT' : 'SLIDE_LEFT';
        this.targetLane = 0;
      }
      this.currentZone = newZone;
    }

    // ----- 2. VERTICAL TRANSIENT ACTIONS (JUMP & DUCK) -----
    // Use upper body combined Y (nose + shoulders) for stable elevation tracking
    const currentUpperY = (noseY * 0.4) + (avgShoulderY * 0.6);
    const baseNoseY = baselineNoseY !== undefined ? baselineNoseY : baselineShoulderY - 0.12;
    const baseUpperY = (baseNoseY * 0.4) + (baselineShoulderY * 0.6);

    const verticalDelta = baseUpperY - currentUpperY; // Positive = UP (jump), Negative = DOWN (duck)

    // Robust DUCK filtering checks
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const isLeaning = shoulderTilt > 0.035; // Player is tilting/leaning sideways
    const isMovingLaterally = Math.abs(dx) > this.xThresh * 0.5;

    const bothShouldersDropped = (leftShoulder.y > baselineShoulderY + this.duckThresh * 0.6) &&
                                 (rightShoulder.y > baselineShoulderY + this.duckThresh * 0.6);
    const noseDropped = nose ? (nose.y > baseNoseY + this.duckThresh * 0.6) : true;

    const effDuckThresh = isMovingLaterally ? this.duckThresh * 1.5 : this.duckThresh;

    if (!triggeredGesture) {
      // JUMP: Upper body moves upward
      if (this.jumpCooldown <= 0 && verticalDelta > this.jumpThresh) {
        triggeredGesture = 'JUMP';
        this.jumpCooldown = 500;    // 500ms jump cooldown
        this.landingLockout = 700;  // 700ms landing lockout to prevent crouching crouch-duck on landing
      }
      // DUCK: Both shoulders and head drop significantly, body is upright (not tilted)
      else if (
        this.duckCooldown <= 0 &&
        this.landingLockout <= 0 &&
        !isLeaning &&
        bothShouldersDropped &&
        noseDropped &&
        verticalDelta < -effDuckThresh
      ) {
        triggeredGesture = 'DUCK';
        this.duckCooldown = 450;    // 450ms duck cooldown
      }
    }

    // ----- 3. ADAPTIVE BASELINE SMOOTHING -----
    // When standing steadily in center zone without active gestures, slowly adapt baseline
    if (this.currentZone === 'CENTER' && !triggeredGesture && this.jumpCooldown <= 0 && this.duckCooldown <= 0) {
      this.calibration.baselineShoulderY += (avgShoulderY - this.calibration.baselineShoulderY) * 0.002;
      this.calibration.baselineCenterX += (centerX - this.calibration.baselineCenterX) * 0.002;
      if (nose) {
        this.calibration.baselineNoseY = (this.calibration.baselineNoseY || nose.y) + (nose.y - (this.calibration.baselineNoseY || nose.y)) * 0.002;
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
