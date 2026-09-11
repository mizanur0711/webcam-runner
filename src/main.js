/**
 * Webcam Runner — Main Entry Point
 * Wires all modules together and starts the game.
 */
import './style.css';

// Pose detection
import { poseDetector } from './pose/PoseDetector.js';
import { PresenceDetector } from './pose/PresenceDetector.js';
import { Calibrator } from './pose/Calibrator.js';

// Renderer
import { Renderer } from './renderer/Renderer.js';
import { RoadRenderer } from './renderer/RoadRenderer.js';
import { BackgroundRenderer } from './renderer/BackgroundRenderer.js';
import { ObstacleRenderer } from './renderer/ObstacleRenderer.js';
import { CharacterRenderer } from './renderer/CharacterRenderer.js';
import { UIRenderer } from './renderer/UIRenderer.js';

// Game logic
import { GameStateMachine } from './game/GameStateMachine.js';
import { GameLoop } from './game/GameLoop.js';
import { ObstacleManager } from './game/ObstacleManager.js';
import { CollisionDetector } from './game/CollisionDetector.js';
import { ScoreManager } from './game/ScoreManager.js';
import { DifficultyManager } from './game/DifficultyManager.js';

// Audio
import { audioManager } from './audio/AudioManager.js';

// ============================================================
// DOM Elements
// ============================================================
const bgCanvas = document.getElementById('bg-canvas');
const gameCanvas = document.getElementById('game-canvas');
const uiCanvas = document.getElementById('ui-canvas');
const pipCanvas = document.getElementById('pip-canvas');
const webcamVideo = document.getElementById('webcam-video');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingStatus = document.getElementById('loading-status');
const cameraOverlay = document.getElementById('camera-overlay');
const cameraBtn = document.getElementById('camera-btn');
const muteBtn = document.getElementById('mute-btn');
const pauseBtn = document.getElementById('pause-btn');

// ============================================================
// Initialize Systems
// ============================================================

/** @type {GameLoop|null} */
let gameLoop = null;

/** @type {GameStateMachine|null} */
let stateMachine = null;

/**
 * Update loading status text
 * @param {string} text
 */
function setStatus(text) {
  if (loadingStatus) loadingStatus.textContent = text;
}

/**
 * Hide loading overlay with fade
 */
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    setTimeout(() => {
      loadingOverlay.style.display = 'none';
    }, 600);
  }
}

/**
 * Show camera permission overlay
 */
function showCameraPrompt() {
  hideLoading();
  if (cameraOverlay) cameraOverlay.style.display = 'flex';
}

/**
 * Hide camera overlay
 */
function hideCameraOverlay() {
  if (cameraOverlay) cameraOverlay.style.display = 'none';
}

/**
 * Main initialization sequence
 */
async function init() {
  try {
    // 1. Set up renderer
    setStatus('Setting up display...');
    const renderer = new Renderer({ bgCanvas, gameCanvas, uiCanvas, pipCanvas });
    renderer.init();

    // 2. Create sub-renderers
    const roadRenderer = new RoadRenderer(renderer);
    const backgroundRenderer = new BackgroundRenderer(renderer);
    const obstacleRenderer = new ObstacleRenderer(renderer);
    const characterRenderer = new CharacterRenderer(renderer);
    const uiRenderer = new UIRenderer(renderer);

    // 3. Create game systems
    const presenceDetector = new PresenceDetector();
    const calibrator = new Calibrator();
    const obstacleManager = new ObstacleManager();
    const collisionDetector = new CollisionDetector();
    const scoreManager = new ScoreManager();
    const difficultyManager = new DifficultyManager();

    // Init managers
    scoreManager.init();
    obstacleManager.init(difficultyManager);

    // 4. Load MediaPipe model
    setStatus('Loading pose detection model...');
    await poseDetector.init();

    // 5. Show camera permission prompt
    showCameraPrompt();

    // 6. Handle camera button click
    cameraBtn.addEventListener('click', async () => {
      try {
        // Init audio on user interaction (Chrome autoplay policy)
        audioManager.init();

        setStatus('Accessing camera...');
        hideCameraOverlay();
        if (loadingOverlay) {
          loadingOverlay.style.display = 'flex';
          loadingOverlay.classList.remove('hidden');
        }

        await poseDetector.setupCamera(webcamVideo);

        // 7. Create state machine with all systems wired up
        stateMachine = new GameStateMachine({
          presenceDetector,
          calibrator,
          obstacleManager,
          collisionDetector,
          scoreManager,
          difficultyManager,
          audioManager,
          renderer,
          uiRenderer,
          characterRenderer,
          obstacleRenderer,
          roadRenderer,
          backgroundRenderer
        });

        // 8. Create and start game loop
        gameLoop = new GameLoop({
          stateMachine,
          poseDetector,
          renderer,
          videoElement: webcamVideo
        });

        // Enter initial IDLE state
        stateMachine.transition('IDLE');

        // Show control buttons
        if (pauseBtn) pauseBtn.style.display = 'flex';
        if (trainingBtn) trainingBtn.style.display = 'flex';

        hideLoading();
        gameLoop.start();

      } catch (cameraError) {
        handleCameraError(cameraError, renderer, uiRenderer);
      }
    });

  } catch (error) {
    console.error('Initialization failed:', error);
    setStatus(`Error: ${error.message}`);
  }
}

/**
 * Handle camera access errors
 * @param {Error} error
 * @param {Renderer} renderer
 * @param {UIRenderer} uiRenderer
 */
function handleCameraError(error, renderer, uiRenderer) {
  console.error('Camera error:', error);
  hideLoading();
  hideCameraOverlay();

  let errorType = 'not-found';
  if (error.message.includes('permission') || error.message.includes('denied')) {
    errorType = 'denied';
  } else if (error.message.includes('in use')) {
    errorType = 'in-use';
  }

  // Render error on UI canvas
  if (uiRenderer && renderer && renderer.uiCtx) {
    renderer.uiCtx.clearRect(0, 0, renderer.width, renderer.height);
    uiRenderer.renderCameraError(renderer.uiCtx, errorType);
  }
}

// ============================================================
// UI Button Handlers
// ============================================================

// Mute button
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    audioManager.init(); // Ensure context exists
    const muted = audioManager.toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });
}

const trainingBtn = document.getElementById('training-btn');

// In camera button handler initialization
// Show pause and training buttons
if (pauseBtn) pauseBtn.style.display = 'flex';
if (trainingBtn) trainingBtn.style.display = 'flex';

// Pause button (manual pause for parents)
if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    if (stateMachine) {
      if (stateMachine.currentState === 'PLAYING') {
        stateMachine.transition('PAUSED');
        pauseBtn.textContent = '▶️';
      } else if (stateMachine.currentState === 'PAUSED') {
        stateMachine.transition('PLAYING');
        pauseBtn.textContent = '⏸️';
      }
    }
  });
}

// Training Lobby button
if (trainingBtn) {
  trainingBtn.addEventListener('click', () => {
    if (stateMachine) {
      if (stateMachine.currentState === 'TRAINING') {
        stateMachine.transition('COUNTDOWN');
        trainingBtn.textContent = '🎓 Practice';
      } else {
        stateMachine.transition('TRAINING');
        trainingBtn.textContent = '🚀 Start Run';
      }
    }
  });
}

// ============================================================
// Start
// ============================================================
init();
