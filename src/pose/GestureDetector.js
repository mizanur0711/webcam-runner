/**
 * Interprets landmarks into game gestures relative to calibration baseline
 */
export class GestureDetector {
  /**
   * @param {Object} calibrationResult result from Calibrator
   * @param {string} tier 'Small', 'Medium', or 'Tall'
   */
  constructor(calibrationResult, tier) {
    this.calibration = calibrationResult;
    this.tier = tier;
    
    this.currentGesture = null;
    this.hasNewGesture = false;

    this.cooldownTimer = 0;
    
    // Cooldowns by tier
    this.cooldowns = {
      Small: 500,
      Medium: 400,
      Tall: 300
    };

    // Vertical thresholds by tier (% of torso height)
    this.yThresholds = {
      Small: 0.12,
      Medium: 0.20,
      Tall: 0.28
    };

    // Lateral thresholds by tier (% of frame width)
    this.xThresholds = {
      Small: 0.08,
      Medium: 0.10,
      Tall: 0.12
    };

    this.cooldownDuration = this.cooldowns[this.tier] || 400;
    this.yThresh = (this.yThresholds[this.tier] || 0.20) * this.calibration.torsoHeight;
    this.xThresh = (this.xThresholds[this.tier] || 0.10);
  }

  /**
   * Clear cooldowns and reset state
   */
  reset() {
    this.cooldownTimer = 0;
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

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      if (this.cooldownTimer < 0) this.cooldownTimer = 0;
      return; // Waiting for cooldown
    }

    if (!landmarks) {
      this.currentGesture = null;
      return;
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgHipY = (leftHip.y + rightHip.y) / 2;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipX = (leftHip.x + rightHip.x) / 2;
    const centerX = (shoulderX + hipX) / 2;

    const { baselineShoulderY, baselineHipY, baselineCenterX } = this.calibration;

    let newGesture = null;

    // Jumping = lower Y value (Y increases downward in normalized coords)
    if (avgHipY < baselineHipY - this.yThresh) {
      newGesture = 'JUMP';
    } 
    // Ducking = higher Y value (shoulders drop)
    else if (avgShoulderY > baselineShoulderY + this.yThresh) {
      newGesture = 'DUCK';
    }
    // Slide Left: webcam is mirrored, moving left in real life = higher X in normalized
    else if (centerX > baselineCenterX + this.xThresh) {
      newGesture = 'SLIDE_LEFT';
    }
    // Slide Right
    else if (centerX < baselineCenterX - this.xThresh) {
      newGesture = 'SLIDE_RIGHT';
    }

    if (newGesture && newGesture !== this.currentGesture) {
      this.currentGesture = newGesture;
      this.hasNewGesture = true;
      this.cooldownTimer = this.cooldownDuration;
    } else if (!newGesture) {
      this.currentGesture = null;
    }
  }
}
