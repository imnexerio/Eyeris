self.onmessage = async function(e) {

    let runningMode = "IMAGE";
    let enableWebcamButton;
    let webcamRunning = false;
    const videoWidth = 480;
    let lastVideoTime = -1;
    console.log('Message received in worker:', e.data);

    const { faceLandmarker,frame } = e.data;
    // const video = document.getElementById("webcam");
    async function predictWebcam() {
      const radio = frame.videoHeight / frame.videoWidth;
      frame.style.width = videoWidth + "px";
      frame.style.height = videoWidth * radio + "px";
  
      if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await faceLandmarker.setOptions({ runningMode: runningMode });
      }
  
      let startTimeMs = performance.now();
      if (lastVideoTime !== frame.currentTime) {
        lastVideoTime = frame.currentTime;
        const results = await faceLandmarker.detectForVideo(frame, startTimeMs);
        self.postMessage({ results, timestamp: Date().toString() });
      }
  
      if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
      }
    }
  
    predictWebcam();
  };