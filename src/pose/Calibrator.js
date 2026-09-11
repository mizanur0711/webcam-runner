/**
 * Handles calibration phase (2-3 second still-pose capture)
 */
export class Calibrator {
  constructor() {
    this.maxRetries = 2;
    this.resetState();
  }

  /**
   * @private
   */
  resetState() {
    this.isCalibrating = false;
    this.isComplete = false;
    this.isFailed = false;
    this.tooClose = false;
    this.progress = 0;
    this.result = null;

    this.retries = 0;
    this.samples = [];
    this.calibrationTime = 0;
    this.targetDuration = 1000; // 1 second fast capture
  }

  /**
   * Begins calibration, resets data
   */
  start() {
    this.isCalibrating = true;
    this.isComplete = false;
    this.isFailed = false;
    this.tooClose = false;
    this.progress = 0;
    this.result = null;
    this.samples = [];
    this.calibrationTime = 0;
  }

  /**
   * Feeds landmark data each frame during calibration
   * @param {Array} landmarks 
   * @param {number} dt delta time in ms
   */
  update(landmarks, dt) {
    if (!this.isCalibrating) return;
    if (!landmarks) return;

    this.calibrationTime += dt;
    this.progress = Math.min(this.calibrationTime / this.targetDuration, 1.0);

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const nose = landmarks[0];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipX = (leftHip.x + rightHip.x) / 2;
    const centerX = (shoulderX + hipX) / 2;

    let bboxHeight = 0;
    if (leftAnkle && rightAnkle && leftAnkle.visibility > 0.5 && rightAnkle.visibility > 0.5) {
      const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
      bboxHeight = ankleY - nose.y;
    } else {
      bboxHeight = hipY - nose.y;
    }

    this.samples.push({ shoulderY, hipY, centerX, bboxHeight });

    // Detects player too close (bbox > 90% of frame)
    if (bboxHeight > 0.9) {
      this.tooClose = true;
      this.retryCalibration();
      return;
    } else {
      this.tooClose = false;
    }

    if (this.calibrationTime >= this.targetDuration) {
      this.finalizeCalibration();
    }
  }

  /**
   * @private
   */
  retryCalibration() {
    this.retries++;
    if (this.retries > this.maxRetries) {
      this.setFallbackDefaults();
    } else {
      this.isCalibrating = true;
      this.samples = [];
      this.calibrationTime = 0;
      this.progress = 0;
    }
  }

  /**
   * @private
   */
  finalizeCalibration() {
    const avgShoulderY = this.getAverage(this.samples.map(s => s.shoulderY));
    const avgHipY = this.getAverage(this.samples.map(s => s.hipY));
    const avgCenterX = this.getAverage(this.samples.map(s => s.centerX));
    const avgBboxHeight = this.getAverage(this.samples.map(s => s.bboxHeight));

    const varShoulderY = this.getVariance(this.samples.map(s => s.shoulderY), avgShoulderY);
    const varCenterX = this.getVariance(this.samples.map(s => s.centerX), avgCenterX);

    // Detect excessive movement (variance in positions)
    if (varShoulderY > 0.08 || varCenterX > 0.08) {
      this.retryCalibration();
      return;
    }

    const torsoHeight = Math.max(avgHipY - avgShoulderY, 0.15);
    let heightTier = 'Medium';
    if (avgBboxHeight < 0.45) heightTier = 'Small';
    else if (avgBboxHeight > 0.65) heightTier = 'Tall';

    this.result = {
      baselineShoulderY: avgShoulderY,
      baselineHipY: avgHipY,
      baselineCenterX: avgCenterX,
      heightTier: heightTier,
      torsoHeight: torsoHeight
    };

    this.isCalibrating = false;
    this.isComplete = true;
  }

  /**
   * @private
   */
  setFallbackDefaults() {
    this.isCalibrating = false;
    this.isFailed = true;
    this.isComplete = true;
    
    // Fall back to loose defaults
    this.result = {
      baselineShoulderY: 0.3,
      baselineHipY: 0.6,
      baselineCenterX: 0.5,
      heightTier: 'Medium',
      torsoHeight: 0.3
    };
  }

  /**
   * @private
   */
  getAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * @private
   */
  getVariance(arr, mean) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  }
}
