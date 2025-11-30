import { FaceLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";

const videoBlendShapes = document.getElementById("video-blend-shapes");
let faceLandmarker;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoWidth = 480;

let leftEyeOpen = 0;
let leftEyeClosed = 0;
let rightEyeOpen = 0;
let rightEyeClosed = 0;

// Background processing variables
let processingInterval = null;
let isPageVisible = true;
const FRAME_INTERVAL = 16; // ~60fps - full speed in background

// Audio context for preventing browser throttling in background
let audioContext = null;
let silentAudioNode = null;

// Create silent audio context to keep browser awake
function createKeepAliveAudio() {
  if (audioContext) return;
  
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a silent oscillator
    silentAudioNode = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set gain to 0 (completely silent)
    gainNode.gain.value = 0;
    
    // Connect oscillator -> gain -> destination
    silentAudioNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start the silent oscillator
    silentAudioNode.start();
    
    console.log("Keep-alive audio started for background processing");
  } catch (e) {
    console.warn("Could not create keep-alive audio context:", e);
  }
}

// Clean up audio context
function destroyKeepAliveAudio() {
  if (silentAudioNode) {
    try {
      silentAudioNode.stop();
      silentAudioNode.disconnect();
    } catch (e) {}
    silentAudioNode = null;
  }
  if (audioContext) {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
  console.log("Keep-alive audio stopped");
}

// Function to retrieve and parse stored data
function getStoredEyeBlinkData() {
  const serializedData = localStorage.getItem('eyeBlinkData');
  return JSON.parse(serializedData) || [];
}

// Retrieve initial data for chart
const eyeBlinkData = getStoredEyeBlinkData();
const labels = eyeBlinkData.map(data => new Date(data.timestamp));
const dataPoints = eyeBlinkData.map(data => ({
  time: new Date(data.timestamp),
  leftEyeOpen: data.leftEye.open,
  leftEyeClosed: data.leftEye.closed,
  rightEyeOpen: data.rightEye.open,
  rightEyeClosed: data.rightEye.closed,
}));

const ctx = document.getElementById('eyeBlinkChart').getContext('2d');

const eyeBlinkChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'Left Eye Blink',
        stack: 'Stack 1',
        data: dataPoints.map(point => point.leftEyeClosed / (point.leftEyeClosed + point.leftEyeOpen)),
        backgroundColor: function(context) {
          const value = context.dataset.data[context.dataIndex];
          return getColorBasedOnRatio(value);
        },
      },
      {
        label: 'Right Eye Blink',
        stack: 'Stack 2',
        data: dataPoints.map(point => point.rightEyeClosed / (point.rightEyeClosed + point.rightEyeOpen)),
        backgroundColor: function(context) {
          const value = context.dataset.data[context.dataIndex];
          return getColorBasedOnRatio(value);
        },
      },
    ]
  },
  options: {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute'
        }
      },
      y: {
        beginAtZero: true,
        stacked: true
      }
    }
  }
});

// Function to get color based on ratio value
function getColorBasedOnRatio(value) {
  // Convert ratio to a value between 0 and 1
  const normalizedValue = Math.min(Math.max(value, 0), 1);

  // Define thresholds and corresponding colors
  const thresholdRed = 0.1;
  const thresholdYellow = 0.2;
  const thresholdGreen = 0.3;
  const hueRed = 0; // Red color
  const hueYellow = 60; // Yellow color
  const hueGreen = 120; // Green color

  // Interpolate color based on thresholds
  if (normalizedValue <= thresholdRed) {
    return `hsl(${hueRed}, 100%, 50%)`; // Red color
  } else if (normalizedValue <= thresholdYellow) {
    // Interpolate between red and yellow
    const interpolatedHue = (normalizedValue - thresholdRed) / (thresholdYellow - thresholdRed) * (hueYellow - hueRed) + hueRed;
    return `hsl(${interpolatedHue}, 100%, 50%)`; // Interpolated color between red and yellow
  } else if (normalizedValue <= thresholdGreen) {
    // Interpolate between yellow and green
    const interpolatedHue = (normalizedValue - thresholdYellow) / (thresholdGreen - thresholdYellow) * (hueGreen - hueYellow) + hueYellow;
    return `hsl(${interpolatedHue}, 100%, 50%)`; // Interpolated color between yellow and green
  } else {
    return `hsl(${hueGreen}, 100%, 50%)`; // Green color
  }
}

// Function to initialize and create the FaceLandmarker
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
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
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Start Tracking";
    stopBackgroundProcessing();
    destroyKeepAliveAudio();
    video.srcObject.getTracks().forEach(track => track.stop());
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Stop Tracking";
    
    // Start keep-alive audio to prevent browser throttling
    createKeepAliveAudio();
    
    const constraints = {
      video: true
    };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", () => {
        // Start with appropriate method based on visibility
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

// Handle page visibility changes to keep tracking in background
document.addEventListener("visibilitychange", () => {
  isPageVisible = !document.hidden;
  if (webcamRunning) {
    if (document.hidden) {
      // Tab is hidden - switch to setInterval for background processing
      startBackgroundProcessing();
    } else {
      // Tab is visible - switch back to requestAnimationFrame
      stopBackgroundProcessing();
      predictWebcam();
    }
  }
});

function startBackgroundProcessing() {
  if (processingInterval) return;
  processingInterval = setInterval(() => {
    if (webcamRunning) {
      processFrame();
    }
  }, FRAME_INTERVAL);
}

function stopBackgroundProcessing() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

// Core frame processing logic (shared between foreground and background)
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

  // Only draw when page is visible (skip all rendering in background)
  if (isPageVisible) {
    // Set canvas dimensions
    const radio = video.videoHeight / video.videoWidth;
    video.style.width = videoWidth + "px";
    video.style.height = videoWidth * radio + "px";
    canvasElement.style.width = videoWidth + "px";
    canvasElement.style.height = videoWidth * radio + "px";
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    
    if (results && results.faceLandmarks) {
      for (const landmarks of results.faceLandmarks) {
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#ff3333" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: "#ff3333" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#ff3333" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: "#ff3333" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#ff3333" });
        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#ff3333" });
      }
    }
    
    // Only update blend shapes UI when visible
    if (results && results.faceBlendshapes) {
      updateBlendShapesUI(videoBlendShapes, results.faceBlendshapes);
    }
  }
  
  // ALWAYS process blink tracking (even in background)
  if (results && results.faceBlendshapes) {
    processBlinkData(results.faceBlendshapes);
  }
}

// Separate function for processing blink data (runs in background)
function processBlinkData(blendShapes) {
  if (!blendShapes.length) return;
  
  blendShapes[0].categories.forEach((shape) => {
    if (shape.categoryName === "eyeBlinkLeft") {
      if (shape.score >= 0.4) {
        leftEyeClosed++;
      } else {
        leftEyeOpen++;
      }
    } else if (shape.categoryName === "eyeBlinkRight") {
      if (shape.score >= 0.4) {
        rightEyeClosed++;
      } else {
        rightEyeOpen++;
      }
    }
  });
}

// Separate function for updating UI (only when visible)
function updateBlendShapesUI(el, blendShapes) {
  if (!blendShapes.length) return;
  
  let htmlMaker = "";
  blendShapes[0].categories.forEach((shape) => {
    if (shape.categoryName === "eyeBlinkLeft") {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">Left Eye</span>
          <span class="blend-shapes-value" style="width: calc(${+shape.score * 100}% - 120px)">${(+shape.score).toFixed(4)}</span>
        </li>
      `;
    } else if (shape.categoryName === "eyeBlinkRight") {
      htmlMaker += `
        <li class="blend-shapes-item">
          <span class="blend-shapes-label">Right Eye</span>
          <span class="blend-shapes-value" style="width: calc(${+shape.score * 100}% - 120px)">${(+shape.score).toFixed(4)}</span>
        </li>
      `;
    }
  });
  el.innerHTML = htmlMaker;
}

async function predictWebcam() {
  if (!webcamRunning) return;
  
  await processFrame();

  // Only use requestAnimationFrame when page is visible
  if (webcamRunning && isPageVisible) {
    window.requestAnimationFrame(predictWebcam);
  }
}

setInterval(() => {
  if (results && results.faceBlendshapes) {
    // cxsa

    // Calculate average score for left and right eye blinks
    // for (const shape of results.faceBlendshapes[0].categories) {
    //   if (shape.categoryName === "eyeBlinkLeft") {
    //     leftEyeScore += shape.score;
    //   } else if (shape.categoryName === "eyeBlinkRight") {
    //     rightEyeScore += shape.score;
    //   }
    // }

    // const leftEyeCount = results.faceBlendshapes[0].categories.filter(shape => shape.categoryName === "eyeBlinkLeft").length;
    // const rightEyeCount = results.faceBlendshapes[0].categories.filter(shape => shape.categoryName === "eyeBlinkRight").length;

    // leftEyeScore /= leftEyeCount || 1;
    // rightEyeScore /= rightEyeCount || 1;

    // Update counters
    // if (leftEyeScore >= 0.3) {
    //   leftEyeClosed++;
    // } else {
    //   leftEyeOpen++;
    // }

    // if (rightEyeScore >= 0.3) {
    //   rightEyeClosed++;
    // } else {
    //   rightEyeOpen++;
    // }

    const record = {
      leftEye: { open: leftEyeOpen, closed: leftEyeClosed },
      rightEye: { open: rightEyeOpen, closed: rightEyeClosed },
      timestamp: new Date().toISOString()
    };

    eyeBlinkData.push(record);

    // Store data
    localStorage.setItem('eyeBlinkData', JSON.stringify(eyeBlinkData));

    // Update chart
    eyeBlinkChart.data.labels.push(new Date(record.timestamp));
    eyeBlinkChart.data.datasets[0].data.push(record.leftEye.closed / (record.leftEye.closed + record.leftEye.open));
    eyeBlinkChart.data.datasets[1].data.push(record.rightEye.closed / (record.rightEye.closed + record.rightEye.open));
    eyeBlinkChart.update();

    // Reset counters
    leftEyeOpen = 0;
    leftEyeClosed = 0;
    rightEyeOpen = 0;
    rightEyeClosed = 0;
  }
}, 10000); // Run every 10 seconds

// Legacy function removed - functionality split into:
// - processBlinkData() for tracking (runs always)
// - updateBlendShapesUI() for display (runs when visible)
