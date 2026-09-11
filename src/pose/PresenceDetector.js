/**
 * Detects whether a player is in frame
 */
export class PresenceDetector {
  constructor() {
    this.reset();
  }

  /**
   * Reset all state
   */
  reset() {
    this.isPresent = false;
    this.isAbsent = true;
    this.justDetected = false;
    this.justLeft = false;
    this.isLowConfidence = false;

    this.presenceTime = 0;
    this.absenceTime = 0;
    
    this.lastTime = performance.now();
  }

  /**
   * Update presence status
   * @param {Array|null} landmarks array of 33 NormalizedLandmark or null
   */
  update(landmarks) {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.justDetected = false;
    this.justLeft = false;

    if (!landmarks) {
      this.handleAbsence(dt);
      this.isLowConfidence = false;
      return;
    }

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Player present if nose OR shoulders OR hips are visible (>0.3)
    const noseVisible = nose && (nose.visibility === undefined || nose.visibility > 0.3);
    const shouldersVisible = (leftShoulder && leftShoulder.visibility > 0.3) || (rightShoulder && rightShoulder.visibility > 0.3);
    const hipsVisible = (leftHip && leftHip.visibility > 0.3) || (rightHip && rightHip.visibility > 0.3);

    const isVisible = noseVisible || shouldersVisible || hipsVisible;
    const allVisible = noseVisible && shouldersVisible && hipsVisible;

    this.isLowConfidence = !allVisible && isVisible;

    if (isVisible) {
      this.handlePresence(dt);
    } else {
      this.handleAbsence(dt);
    }
  }

  /**
   * @private
   */
  handlePresence(dt) {
    this.absenceTime = 0;
    this.presenceTime += dt;

    if (!this.isPresent && this.presenceTime >= 400) { // 0.4s stabilization
      this.isPresent = true;
      this.isAbsent = false;
      this.justDetected = true;
    }
  }

  /**
   * @private
   */
  handleAbsence(dt) {
    this.presenceTime = 0;
    this.absenceTime += dt;

    if (!this.isAbsent && this.absenceTime >= 3500) { // 3.5s grace period for kid movement
      this.isAbsent = true;
      this.isPresent = false;
      this.justLeft = true;
    }
  }
}
