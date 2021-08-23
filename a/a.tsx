const FFT_SIZE = Math.pow(2, 14);
const DECIBLE_MIN = 32;
const PITCH_HZ = 441;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = window.innerWidth;
const startButton = document.getElementById("start") as HTMLButtonElement;
startButton.addEventListener("click", () => {
  startListening();
  startButton.parentElement?.removeChild(startButton);
});

function startListening() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((microphoneStream) => {
      const audioContext = new AudioContext({
        latencyHint: "balanced",
      });

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.5;

      const freqSampleRateHz = audioContext.sampleRate;
      const freqCount = analyser.frequencyBinCount;
      const freqMaxHz = freqSampleRateHz / 2;
      const freqRangeHz = [0, freqMaxHz];
      const freqStepHz = freqMaxHz / freqCount;

      console.table([
        {
          freqSampleRateHz,
          freqCount,
          freqMaxHz,
          freqStepHz,
        },
      ]);

      const analyserSample = new Uint8Array(freqCount);
      const source = audioContext.createMediaStreamSource(microphoneStream);
      source.connect(analyser);
      const canvasContext = canvas.getContext("2d")!;

      function draw() {
        analyser.getByteFrequencyData(analyserSample);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const columnWidth = canvasWidth / analyser.frequencyBinCount;

        canvasContext.fillStyle = "#000";
        canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

        let nextPitch = PITCH_HZ;
        while (nextPitch < freqMaxHz) {
          const aIndex = Math.round(nextPitch / freqStepHz);
          canvasContext.fillStyle = "#ff000075";
          canvasContext.fillRect(
            aIndex * columnWidth - 1,
            0,
            columnWidth + 2,
            canvasHeight
          );
          nextPitch = nextPitch * 2;
        }

        let prevPitch = PITCH_HZ / 2;
        while (prevPitch > 1) {
          const aIndex = Math.round(prevPitch / freqStepHz);
          canvasContext.fillStyle = "#ff000075";
          canvasContext.fillRect(
            aIndex * columnWidth - 1,
            0,
            columnWidth + 2,
            canvasHeight
          );
          prevPitch = prevPitch / 2;
        }

        let loudestI = 0;
        for (let i = 0; i < analyserSample.length; i++) {
          const loudness = analyserSample[i];
          if (loudness > analyserSample[loudestI]) {
            loudestI = i;
          }
          canvasContext.fillStyle = "#FFFFFF75";
          const width = columnWidth;
          const height = Math.round((loudness / 256) * canvasHeight);
          const x = i * columnWidth;
          const y = canvasHeight - height;
          canvasContext.fillRect(x, y, width, height);
        }

        if (loudestI > -1 && analyserSample[loudestI] > DECIBLE_MIN) {
          canvasContext.fillStyle = "#00FF00";
          const width = 1;
          const height = canvasHeight;
          const x = loudestI * columnWidth - 1;
          const y = 0;
          canvasContext.fillRect(x, y, width + 2, height);
        }

        requestAnimationFrame(draw);
      }

      requestAnimationFrame(draw);
    });
}

export {};
