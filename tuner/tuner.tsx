import { range, round } from "lodash";
const FFT_SIZE = Math.pow(2, 15);
const REF_PITCH_HZ = 441;
const SMOOTHING_CONSTANT = 0;
const noteNames = [
  "c",
  "c♯/d♭",
  "d",
  "d♯/e♭",
  "e",
  "f",
  "f♯/g♭",
  "g",
  "g♯/a♭",
  "a",
  "a♯/b♭",
  "b",
];

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = window.innerWidth;
const note = document.getElementById("note")!;
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
        latencyHint: "interactive",
      });

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING_CONSTANT;

      const freqSampleRateHz = audioContext.sampleRate;
      const freqCount = analyser.frequencyBinCount;
      const freqMaxHz = freqSampleRateHz / 2;
      const freqStepHz = freqMaxHz / freqCount;
      const freqRange = range(0, freqCount).map((n) => n * freqStepHz);
      console.info({
        freqRange,
      });

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

        let nextPitch = REF_PITCH_HZ;
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

        let prevPitch = REF_PITCH_HZ / 2;
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

        canvasContext.fillStyle = "#00FF00";
        const width = 1;
        const height = canvasHeight;
        const x = loudestI * columnWidth - 1;
        const y = 0;
        canvasContext.fillRect(x, y, width + 2, height);

        const freq = freqRange[loudestI];
        const c0 = REF_PITCH_HZ * Math.pow(2, -4.75);
        const h = Math.round(12 * Math.log2(freq / c0));
        const octave = Math.floor(h / 12);
        const n = h % 12;
        const noteName = noteNames[n];
        note.innerHTML = `${h} - ${noteName}${octave}`;

        requestAnimationFrame(draw);
      }

      requestAnimationFrame(draw);
    });
}

export {};
