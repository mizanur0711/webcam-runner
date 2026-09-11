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

    const keypoints = [nose, leftShoulder, rightShoulder, leftHip, rightHip];
    const allVisible = keypoints.every(kp => kp && kp.visibility > 0.5);
    const anyVisible = keypoints.some(kp => kp && kp.visibility > 0.2);

    this.isLowConfidence = !allVisible && anyVisible;

    if (allVisible) {
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

    if (!this.isPresent && this.presenceTime >= 1000) { // 1 second stabilization
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

    if (!this.isAbsent && this.absenceTime >= 2000) { // 2 seconds for pause
      this.isAbsent = true;
      this.isPresent = false;
      this.justLeft = true;
    }
  }
}
