import { range } from "lodash";

const FFT_SIZE = Math.pow(2, 15);
const MIN_LOUDNESS = 64;
const REF_PITCH_HZ = 441;
const SMOOTHING_CONSTANT = 0;
const GR = 1.61803398875;

console.table({
  FFT_SIZE,
  MIN_LOUDNESS,
  REF_PITCH_HZ,
  SMOOTHING_CONSTANT,
});

const noteNames = [
  "c", // 0
  "c♯", // 1
  "d",
  "d♯",
  "e",
  "f",
  "f♯",
  "g",
  "g♯",
  "a", // 9
  "a♯",
  "b",
];

const whiteKeys = 2 + 7 + 7 + 7 + 7 + 7 + 7 + 7 + 1;
const blackKeys = 1 + 5 + 5 + 5 + 5 + 5 + 5 + 5;
const keys = range(0, 88)
  .map((n) => n + 9)
  .map((n) => noteNames[n % 12]);

const offsets = [0];
for (let i = 1; i < keys.length; i++) {
  const key = keys[i];
  const prev = offsets[offsets.length - 1];
  if (key.length === 1) {
    offsets.push(prev + 1);
  } else {
    offsets.push(prev);
  }
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const canvasContext = canvas.getContext("2d")!;
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = window.innerWidth;

const numberEl = document.getElementById("number")!;
const noteEl = document.getElementById("note")!;
const octaveEl = document.getElementById("octave")!;
const frequencyEl = document.getElementById("frequency")!;

const startButton = document.getElementById("start") as HTMLButtonElement;
startButton.addEventListener("click", () => {
  startListening();
  startButton.parentElement?.removeChild(startButton);
});

function drawKeys(canvasContext: CanvasRenderingContext2D) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const whiteKeyWidth = canvasWidth / whiteKeys;
  const whiteKeyFont = `${Math.round(whiteKeyWidth / 2)}px monospace`;

  const blackKeyWidth = whiteKeyWidth / GR;
  const blackKeyOffset = blackKeyWidth / 2;
  const blackKeyFont = `${Math.round(blackKeyWidth / 2)}px monospace`;

  canvasContext.fillStyle = "#fff";
  canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

  let whiteKeyN = 0;
  keys.forEach((key, n) => {
    // natural keys
    const octave = Math.floor((n + 9) / 12);
    if (key.length === 1) {
      canvasContext.fillStyle = "#999";
      const x = whiteKeyN * whiteKeyWidth;
      canvasContext.fillRect(x, 0, whiteKeyWidth, canvasHeight);

      canvasContext.fillStyle = "#fff";
      canvasContext.fillRect(
        whiteKeyN * whiteKeyWidth + 1,
        1,
        whiteKeyWidth - 2,
        canvasHeight - 2
      );

      canvasContext.fillStyle = "#000";
      canvasContext.font = whiteKeyFont;
      canvasContext.textAlign = "center";

      canvasContext.fillText(
        `${key}${octave}`,
        x + whiteKeyWidth / 2,
        canvasHeight - whiteKeyWidth / 4
      );

      whiteKeyN++;
    }
  });

  let intersection = 0;
  keys.forEach((key, n) => {
    if (key.length === 1) {
      intersection++;
      return;
    }

    const octave = Math.floor((n + 9) / 12);

    const x = intersection * whiteKeyWidth - blackKeyOffset;
    const height = canvasHeight / 2;
    canvasContext.fillStyle = "#000";
    canvasContext.fillRect(x, 0, blackKeyWidth, height);

    canvasContext.fillStyle = "#fff";
    canvasContext.font = blackKeyFont;
    canvasContext.textAlign = "center";
    canvasContext.fillText(
      `${key}${octave}`,
      x + blackKeyWidth / 2,
      height - blackKeyWidth / 4
    );
  });
}

drawKeys(canvasContext);

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

      function draw() {
        analyser.getByteFrequencyData(analyserSample);

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const whiteKeyWidth = canvasWidth / whiteKeys;
        const blackKeyWidth = whiteKeyWidth / GR;

        drawKeys(canvasContext);

        const loudestI = analyserSample.reduce(
          (loudestISoFar: number, loudness, i, sample) => {
            if (loudness > MIN_LOUDNESS && loudness > sample[loudestISoFar]) {
              return i;
            }
            return loudestISoFar;
          },
          0
        );

        const freq = freqRange[loudestI];
        if (freq && freq > 0) {
          const c0 = REF_PITCH_HZ * Math.pow(2, -4.75);
          const h = Math.round(12 * Math.log2(freq / c0));
          const octave = Math.floor(h / 12);
          const n = h % 12;
          const noteName = noteNames[n];
          numberEl.innerHTML = `${h}`;
          noteEl.innerHTML = noteName;
          octaveEl.innerHTML = `${octave}`;
          frequencyEl.innerHTML = `${freq}`;

          const keyI = h - 9;
          const offset = offsets[keyI];
          if (noteName.length === 1) {
            const indicatorWidth = whiteKeyWidth / GR;
            canvasContext.fillStyle = "#FF0000";
            canvasContext.fillRect(
              offset * whiteKeyWidth + (whiteKeyWidth - indicatorWidth) / 2,
              canvasHeight / GR,
              indicatorWidth,
              indicatorWidth * GR * GR
            );
          } else {
            const indicatorWidth = blackKeyWidth / GR;
            canvasContext.fillStyle = "#FF0000";
            canvasContext.fillRect(
              (offset + 1) * whiteKeyWidth - indicatorWidth / 2,
              canvasHeight / 2 / GR,
              indicatorWidth,
              indicatorWidth * GR * GR
            );
          }
        }

        requestAnimationFrame(draw);
      }

      requestAnimationFrame(draw);
    });
}

export {};
