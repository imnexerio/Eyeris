import { FaceLandmarker, FilesetResolver, DrawingUtils } from "./lib/mediapipe/vision_bundle.mjs";

// Detect if running in Tauri (native app)
const isTauri = window.__TAURI__ !== undefined;
console.log(`Eyeris running in ${isTauri ? 'Tauri (native)' : 'Web Browser'} mode`);

// Register Service Worker for offline support (web only)
if ('serviceWorker' in navigator && !isTauri) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available! Refresh to update.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

const videoBlendShapes = document.getElementById("video-blend-shapes");
let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

let leftEyeOpen = 0;
let leftEyeClosed = 0;
let rightEyeOpen = 0;
let rightEyeClosed = 0;

// Real-time tracking data
let realtimeData = [];
const MAX_REALTIME_POINTS = 60;
let sessionStartTime = null;
let frameCount = 0;
let lastFpsUpdate = 0;

// Eye health tracking
let blinkCount = 0;
let lastBlinkState = { left: false, right: false };
let blinkRateHistory = []; // Will store {rate, label} objects
let breaksTaken = 0;
let lastBreakTime = null;
const BREAK_INTERVAL = 20 * 60 * 1000; // 20 minutes in ms
const HEALTHY_BLINK_RATE_MIN = 15;
const HEALTHY_BLINK_RATE_MAX = 20;

// Strain level tracking
let currentStrainLevel = 'Low';
let strainScore = 0;

// Comfort/Attention tracking
let comfortHistory = []; // Will store {score, label} objects
let strainHistory = []; // Will store {score, label} objects
const MAX_HISTORY_POINTS = 30;

// Background processing variables
let processingInterval = null;
let isPageVisible = true;
const FRAME_INTERVAL = 16;

// Audio context for background processing
let audioContext = null;
let silentAudioNode = null;

// Chart.js default styling
Chart.defaults.color = '#71717a';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";

// Break modal elements
const breakModal = document.getElementById('breakModal');
const breakCountdown = document.getElementById('breakCountdown');
const startBreakBtn = document.getElementById('startBreakBtn');
const skipBreakBtn = document.getElementById('skipBreakBtn');

// Audio context functions (web browser workaround only)
function createKeepAliveAudio() {
  if (audioContext || isTauri) return; // Tauri doesn't need this workaround
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    silentAudioNode = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    silentAudioNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    silentAudioNode.start();
  } catch (e) {
    console.warn("Could not create keep-alive audio:", e);
  }
}

function destroyKeepAliveAudio() {
  if (silentAudioNode) {
    try { silentAudioNode.stop(); silentAudioNode.disconnect(); } catch (e) {}
    silentAudioNode = null;
  }
  if (audioContext) {
    try { audioContext.close(); } catch (e) {}
    audioContext = null;
  }
}

// Break reminder functions
function showBreakReminder() {
  if (breakModal) {
    breakModal.classList.add('active');
    // Play notification sound (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+fnp2dm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/');
      audio.volume = 0.3;
      audio.play();
    } catch (e) {}
  }
}

function hideBreakReminder() {
  if (breakModal) {
    breakModal.classList.remove('active');
  }
}

function startBreakTimer() {
  let countdown = 20;
  breakCountdown.textContent = countdown;
  startBreakBtn.disabled = true;
  startBreakBtn.textContent = 'Looking away...';
  
  const timer = setInterval(() => {
    countdown--;
    breakCountdown.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(timer);
      breaksTaken++;
      lastBreakTime = Date.now();
      document.getElementById('breaksTaken').textContent = breaksTaken;
      hideBreakReminder();
      startBreakBtn.disabled = false;
      startBreakBtn.textContent = 'Start 20s Timer';
      updateHealthStatus('good', 'Great job!', 'Break completed. Your eyes thank you!');
    }
  }, 1000);
}

// Event listeners for break modal
if (startBreakBtn) {
  startBreakBtn.addEventListener('click', startBreakTimer);
}
if (skipBreakBtn) {
  skipBreakBtn.addEventListener('click', () => {
    hideBreakReminder();
    lastBreakTime = Date.now(); // Reset timer anyway
  });
}

// Update health status banner
function updateHealthStatus(level, title, message) {
  const banner = document.getElementById('healthBanner');
  const icon = document.getElementById('statusIcon');
  const titleEl = document.getElementById('statusTitle');
  const msgEl = document.getElementById('statusMessage');
  
  banner.classList.remove('warning', 'danger');
  
  if (level === 'warning') {
    banner.classList.add('warning');
    icon.textContent = '⚠️';
  } else if (level === 'danger') {
    banner.classList.add('danger');
    icon.textContent = '🔴';
  } else {
    icon.textContent = '✅';
  }
  
  titleEl.textContent = title;
  msgEl.textContent = message;
}

// Calculate strain level based on blink rate
function calculateStrainLevel(blinkRate) {
  if (blinkRate < 10) {
    strainScore = Math.min(strainScore + 2, 100);
    return 'High';
  } else if (blinkRate < HEALTHY_BLINK_RATE_MIN) {
    strainScore = Math.min(strainScore + 1, 100);
    return 'Moderate';
  } else if (blinkRate <= HEALTHY_BLINK_RATE_MAX) {
    strainScore = Math.max(strainScore - 1, 0);
    return 'Low';
  } else {
    strainScore = Math.max(strainScore - 0.5, 0);
    return 'Low';
  }
}

// Get stored data
function getStoredEyeBlinkData() {
  const serializedData = localStorage.getItem('eyeBlinkData');
  return JSON.parse(serializedData) || [];
}

const eyeBlinkData = getStoredEyeBlinkData();
const labels = eyeBlinkData.map(data => new Date(data.timestamp));
const dataPoints = eyeBlinkData.map(data => ({
  time: new Date(data.timestamp),
  leftEyeOpen: data.leftEye.open,
  leftEyeClosed: data.leftEye.closed,
  rightEyeOpen: data.rightEye.open,
  rightEyeClosed: data.rightEye.closed,
}));

// Main Blink Rate Chart
const ctx = document.getElementById('eyeBlinkChart').getContext('2d');
const eyeBlinkChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Blink Rate (per min)',
      data: [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#10b981',
      pointHoverRadius: 6,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1f23',
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: () => 'Blink Rate',
          label: (ctx) => `${ctx.parsed.y} blinks/min`
        }
      }
    },
    scales: {
      x: { 
        display: true,
        grid: { display: false },
        ticks: { 
          display: true,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 9 },
          color: '#71717a'
        }
      },
      y: { 
        beginAtZero: true,
        suggestedMax: 30,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { 
          stepSize: 10,
          callback: v => v,
          font: { size: 10 }
        }
      }
    }
  }
});

// Real-time Eye Openness Chart
const realtimeCtx = document.getElementById('realtimeChart').getContext('2d');
const realtimeChart = new Chart(realtimeCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Left Eye',
        data: [],
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Right Eye',
        data: [],
        borderColor: '#06b6d4',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { display: false } }
    }
  }
});

// Blink Distribution Chart
const blinkDistCtx = document.getElementById('blinkDistChart').getContext('2d');
const blinkDistChart = new Chart(blinkDistCtx, {
  type: 'doughnut',
  data: {
    labels: ['Left Eye', 'Right Eye'],
    datasets: [{
      data: [50, 50],
      backgroundColor: ['#8b5cf6', '#06b6d4'],
      borderColor: '#1f1f23',
      borderWidth: 3,
      hoverOffset: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 12 } }
    }
  }
});

// Eye Comfort Score Chart
const attentionCtx = document.getElementById('attentionChart').getContext('2d');
const attentionChart = new Chart(attentionCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Comfort',
      data: [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        display: true, 
        grid: { display: false },
        ticks: { 
          display: true,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 9 },
          color: '#71717a'
        }
      },
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } }
    }
  }
});

// Strain Risk Chart
const fatigueCtx = document.getElementById('fatigueChart').getContext('2d');
const fatigueChart = new Chart(fatigueCtx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Strain Risk',
      data: [],
      backgroundColor: function(context) {
        const value = context.dataset.data[context.dataIndex];
        if (value > 60) return 'rgba(239, 68, 68, 0.8)';
        if (value > 30) return 'rgba(245, 158, 11, 0.8)';
        return 'rgba(16, 185, 129, 0.8)';
      },
      borderRadius: 4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        display: true, 
        grid: { display: false },
        ticks: { 
          display: true,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 9 },
          color: '#71717a'
        }
      },
      y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' } }
    }
  }
});

// Initialize FaceLandmarker
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks("./lib/mediapipe");
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: "./assets/face_landmarker.task",
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
}
createFaceLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
}

// Mini player elements
const miniWebcam = document.getElementById('miniWebcam');
const miniBlinkRate = document.getElementById('miniBlinkRate');
const miniSessionTime = document.getElementById('miniSessionTime');
const miniStrainLevel = document.getElementById('miniStrainLevel');

// Update mini player when tracking state changes
function updateMiniPlayerStream() {
  if (miniWebcam && video.srcObject) {
    miniWebcam.srcObject = video.srcObject;
  }
}

// Update mini player stats
function updateMiniPlayerStats(blinkRate, sessionTime, strainLevel) {
  if (miniBlinkRate) miniBlinkRate.textContent = blinkRate;
  if (miniSessionTime) miniSessionTime.textContent = sessionTime;
  if (miniStrainLevel) miniStrainLevel.textContent = strainLevel;
}

function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    window.isWebcamTracking = false;
    enableWebcamButton.innerText = "Start Monitoring";
    stopBackgroundProcessing();
    destroyKeepAliveAudio();
    video.srcObject.getTracks().forEach(track => track.stop());
    if (miniWebcam) miniWebcam.srcObject = null;
    // Update SPA router
    if (window.spaRouter) window.spaRouter.updateMiniPlayer();
  } else {
    webcamRunning = true;
    window.isWebcamTracking = true;
    sessionStartTime = Date.now();
    lastBreakTime = Date.now();
    enableWebcamButton.innerText = "Stop Monitoring";
    createKeepAliveAudio();
    updateHealthStatus('good', 'Monitoring Active', 'Tracking your eye health in real-time');
    
    const constraints = { video: true };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      // Share stream with mini player
      updateMiniPlayerStream();
      // Update SPA router
      if (window.spaRouter) window.spaRouter.updateMiniPlayer();
      
      video.addEventListener("loadeddata", () => {
        if (document.hidden) {
          startBackgroundProcessing();
        } else {
          predictWebcam();
        }
      });
    });
  }
}

let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);

// In Tauri, we don't need special background handling - it runs natively
// For web browsers, switch to interval-based processing when tab is hidden
document.addEventListener("visibilitychange", () => {
  isPageVisible = !document.hidden;
  if (webcamRunning && !isTauri) {
    if (document.hidden) {
      startBackgroundProcessing();
    } else {
      stopBackgroundProcessing();
      predictWebcam();
    }
  }
});

function startBackgroundProcessing() {
  if (processingInterval || isTauri) return; // Tauri doesn't need this workaround
  processingInterval = setInterval(() => {
    if (webcamRunning) processFrame();
  }, FRAME_INTERVAL);
}

function stopBackgroundProcessing() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

async function processFrame() {
  if (!faceLandmarker || !webcamRunning) return;
  
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceLandmarker.setOptions({ runningMode: runningMode });
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = await faceLandmarker.detectForVideo(video, startTimeMs);
  }

  // Update session time and break timer
  if (sessionStartTime && isPageVisible) {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('sessionTime').textContent = `${mins}:${secs}`;
    
    // Update break timer
    if (lastBreakTime) {
      const timeSinceBreak = Date.now() - lastBreakTime;
      const timeUntilBreak = Math.max(0, BREAK_INTERVAL - timeSinceBreak);
      const breakMins = Math.floor(timeUntilBreak / 60000);
      const breakSecs = Math.floor((timeUntilBreak % 60000) / 1000);
      document.getElementById('breakTimer').textContent = 
        `${breakMins.toString().padStart(2, '0')}:${breakSecs.toString().padStart(2, '0')}`;
      
      // Show break reminder
      if (timeUntilBreak === 0 && !breakModal.classList.contains('active')) {
        showBreakReminder();
      }
    }
  }

  if (isPageVisible) {
    // Get video dimensions
    const videoRect = video.getBoundingClientRect();
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;
    
    // Set canvas to match video display size exactly
    canvasElement.style.width = displayWidth + "px";
    canvasElement.style.height = displayHeight + "px";
    
    // Set canvas internal resolution to match video source
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    
    // Clear and draw
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    if (results && results.faceLandmarks) {
      for (const landmarks of results.faceLandmarks) {
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#8b5cf620", lineWidth: 1 });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#8b5cf6" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#8b5cf6" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#06b6d4" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#06b6d4" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#71717a40" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#71717a40" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#8b5cf6" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#06b6d4" });
      }
    }
    
    if (results && results.faceBlendshapes) {
      updateBlendShapesUI(videoBlendShapes, results.faceBlendshapes);
      updateRealtimeChart(results.faceBlendshapes);
    }
  }
  
  if (results && results.faceBlendshapes) {
    processBlinkData(results.faceBlendshapes);
  }
}

function processBlinkData(blendShapes) {
  if (!blendShapes.length) return;
  
  let leftBlinkScore = 0, rightBlinkScore = 0;
  
  blendShapes[0].categories.forEach((shape) => {
    if (shape.categoryName === "eyeBlinkLeft") {
      leftBlinkScore = shape.score;
      if (shape.score >= 0.4) {
        leftEyeClosed++;
      } else {
        leftEyeOpen++;
      }
    } else if (shape.categoryName === "eyeBlinkRight") {
      rightBlinkScore = shape.score;
      if (shape.score >= 0.4) {
        rightEyeClosed++;
      } else {
        rightEyeOpen++;
      }
    }
  });
  
  // Detect actual blinks (transition from open to closed)
  const leftBlink = leftBlinkScore >= 0.5;
  const rightBlink = rightBlinkScore >= 0.5;
  
  if ((leftBlink && !lastBlinkState.left) || (rightBlink && !lastBlinkState.right)) {
    blinkCount++;
  }
  
  lastBlinkState = { left: leftBlink, right: rightBlink };
}

function updateRealtimeChart(blendShapes) {
  if (!blendShapes.length) return;
  
  let leftScore = 0, rightScore = 0;
  blendShapes[0].categories.forEach((shape) => {
    if (shape.categoryName === "eyeBlinkLeft") leftScore = 1 - shape.score;
    if (shape.categoryName === "eyeBlinkRight") rightScore = 1 - shape.score;
  });
  
  realtimeData.push({ left: leftScore, right: rightScore, time: Date.now() });
  if (realtimeData.length > MAX_REALTIME_POINTS) realtimeData.shift();
  
  realtimeChart.data.labels = realtimeData.map((_, i) => i);
  realtimeChart.data.datasets[0].data = realtimeData.map(d => d.left);
  realtimeChart.data.datasets[1].data = realtimeData.map(d => d.right);
  realtimeChart.update('none');
  
  document.getElementById('leftEyeMetric').textContent = (leftScore * 100).toFixed(0) + '%';
  document.getElementById('rightEyeMetric').textContent = (rightScore * 100).toFixed(0) + '%';
  
  // Calculate comfort score
  const comfortScore = ((leftScore + rightScore) / 2) * 100;
  const now = new Date();
  const comfortTimeLabel = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  comfortHistory.push({ score: comfortScore, label: comfortTimeLabel });
  if (comfortHistory.length > MAX_HISTORY_POINTS) comfortHistory.shift();
  
  if (realtimeData.length % 10 === 0) {
    attentionChart.data.labels = comfortHistory.map(d => d.label);
    attentionChart.data.datasets[0].data = comfortHistory.map(d => d.score);
    attentionChart.update('none');
  }
}

function updateBlendShapesUI(el, blendShapes) {
  if (!blendShapes.length) return;
  
  let htmlMaker = "";
  blendShapes[0].categories.forEach((shape) => {
    if (shape.categoryName === "eyeBlinkLeft") {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">Left Eye</span>
          <span class="blend-shapes-value" style="width: calc(${+shape.score * 100}% - 90px)">${(+shape.score).toFixed(3)}</span>
        </li>
      `;
    } else if (shape.categoryName === "eyeBlinkRight") {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">Right Eye</span>
          <span class="blend-shapes-value" style="width: calc(${+shape.score * 100}% - 90px)">${(+shape.score).toFixed(3)}</span>
        </li>
      `;
    }
  });
  el.innerHTML = htmlMaker;
}

async function predictWebcam() {
  if (!webcamRunning) return;
  await processFrame();
  if (webcamRunning && isPageVisible) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// Update stats every 5 seconds for more responsive chart
let statsUpdateCount = 0;
setInterval(() => {
  if (!webcamRunning || !sessionStartTime) return;
  
  statsUpdateCount++;
  
  // Calculate blink rate (blinks per minute)
  const sessionMins = (Date.now() - sessionStartTime) / 60000;
  const blinkRate = sessionMins > 0 ? Math.round(blinkCount / sessionMins) : 0;
  
  document.getElementById('blinkRate').textContent = blinkRate;
  
  // Calculate session time for display
  const elapsed = Date.now() - sessionStartTime;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const sessionTimeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  document.getElementById('sessionTime').textContent = sessionTimeStr;
  
  // Update mini player stats
  updateMiniPlayerStats(blinkRate, sessionTimeStr, currentStrainLevel);
  
  // Add data point with timestamp label
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  blinkRateHistory.push({ rate: blinkRate, label: timeLabel });
  if (blinkRateHistory.length > 20) blinkRateHistory.shift();
  
  // Update blink rate chart
  eyeBlinkChart.data.labels = blinkRateHistory.map(d => d.label);
  eyeBlinkChart.data.datasets[0].data = blinkRateHistory.map(d => d.rate);
  eyeBlinkChart.update('none');
  
  // Calculate and update strain level
  currentStrainLevel = calculateStrainLevel(blinkRate);
  document.getElementById('strainLevel').textContent = currentStrainLevel;
  
  // Update strain chart with time labels
  strainHistory.push({ score: strainScore, label: timeLabel });
  if (strainHistory.length > 20) strainHistory.shift();
  fatigueChart.data.labels = strainHistory.map(d => d.label);
  fatigueChart.data.datasets[0].data = strainHistory.map(d => d.score);
  fatigueChart.update('none');
  
  // Update health status based on strain
  if (currentStrainLevel === 'High') {
    updateHealthStatus('danger', 'High Eye Strain Detected!', 'Your blink rate is too low. Take a break now!');
  } else if (currentStrainLevel === 'Moderate') {
    updateHealthStatus('warning', 'Moderate Eye Strain', 'Try to blink more often. A break is coming soon.');
  } else {
    updateHealthStatus('good', 'Eyes Looking Healthy', `Blink rate: ${blinkRate}/min (healthy range: 15-20)`);
  }
  
  // Update blink distribution
  const totalLeft = leftEyeClosed + 1;
  const totalRight = rightEyeClosed + 1;
  const total = totalLeft + totalRight;
  blinkDistChart.data.datasets[0].data = [
    Math.round((totalLeft / total) * 100),
    Math.round((totalRight / total) * 100)
  ];
  blinkDistChart.update('none');
  
  // Save data every 2 updates (10 seconds)
  if (statsUpdateCount % 2 === 0) {
    const record = {
      leftEye: { open: leftEyeOpen, closed: leftEyeClosed },
      rightEye: { open: rightEyeOpen, closed: rightEyeClosed },
      blinkRate,
      strainLevel: currentStrainLevel,
      timestamp: new Date().toISOString()
    };
    eyeBlinkData.push(record);
    localStorage.setItem('eyeBlinkData', JSON.stringify(eyeBlinkData));
    
    // Reset counters
    leftEyeOpen = 0;
    leftEyeClosed = 0;
    rightEyeOpen = 0;
    rightEyeClosed = 0;
  }
}, 5000);
