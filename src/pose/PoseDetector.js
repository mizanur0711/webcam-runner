import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * Wraps MediaPipe Tasks Vision Pose Landmarker
 */
class PoseDetector {
  constructor() {
    this.poseLandmarker = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the PoseLandmarker
   */
  async init() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to load PoseLandmarker model:", error);
      throw error;
    }
  }

  /**
   * Sets up the webcam and attaches it to the provided video element.
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<void>} Resolves when video is playing
   */
  async setupCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API is not available in this browser");
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      videoElement.srcObject = stream;
      
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });
    } catch (error) {
      console.error("Camera setup failed:", error);
      if (error.name === 'NotAllowedError') {
        throw new Error("Camera permission denied.");
      } else if (error.name === 'NotReadableError') {
        throw new Error("Camera is already in use by another application.");
      }
      throw error;
    }
  }

  /**
   * Detects pose from video frame
   * @param {HTMLVideoElement} videoElement 
   * @param {number} timestamp 
   * @returns {{landmarks: import('@mediapipe/tasks-vision').NormalizedLandmark[], confidence: number}|null}
   */
  detect(videoElement, timestamp) {
    if (!this.isInitialized || !this.poseLandmarker) return null;
    
    const result = this.poseLandmarker.detectForVideo(videoElement, timestamp);
    if (result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0]; // numPoses is 1
        // Calculate average visibility as a pseudo-confidence score
        const confidence = landmarks.reduce((sum, lm) => sum + (lm.visibility || 0), 0) / landmarks.length;
        return { landmarks, confidence };
    }
    return null;
  }

  /**
   * Clean up
   */
  close() {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }
}

export const poseDetector = new PoseDetector();
