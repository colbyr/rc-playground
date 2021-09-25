import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  getMicrophoneSource,
  makeRelativeMelodyMatcher,
  makeRollingMode,
  makeSampler,
  NoteName,
} from "../octavious";
import { interval, map } from "rxjs";
import { setHueLightState } from "../whistlee/HueApi";
import { quantile } from "simple-statistics";
import { Patterns, send } from "./comms";

const LIGHT_ID = 1;

const SMOOTHING_CONSTANT = 0;
const MIN_LOUDNESS = 32;
const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_SMOOTHING_CONSTANT = 0;

const matchers = (
  Object.entries(Patterns) as unknown as [
    string,
    { name: string; pattern: NoteName[] }
  ][]
).map(([key, { name, pattern }]) =>
  makeRelativeMelodyMatcher({
    pattern,
    trigger: () => send(key),
  })
);

const smoothNote = makeRollingMode<number>({
  defaultValue: 0,
  bufferSize: 24,
});
const referencePitch = 441;
const toNote = new FrequencyToNoteConverter(referencePitch);
const sampleRate = new AudioContext().sampleRate;
const frequencyBinCount = DEFAULT_FFT_SIZE / 2;
const frequencyByBin = getFrequenciesByBin(sampleRate, frequencyBinCount);

makeSampler(interval(10), getMicrophoneSource(), (source) => {
  const filter = new BiquadFilterNode(source.context, {
    type: "bandpass",
    Q: 3,
    frequency: 1024,
    gain: 3,
  });
  const bandpass = source.connect(filter);
  const analyser = source.context.createAnalyser();
  analyser.fftSize = DEFAULT_FFT_SIZE;
  analyser.smoothingTimeConstant = DEFAULT_SMOOTHING_CONSTANT;
  console.info(
    JSON.stringify({
      sampleRate: analyser.context.sampleRate,
      frequencyBinCount: analyser.frequencyBinCount,
    })
  );
  bandpass.connect(analyser);
  // only sample the first 2048 frequency bins of the spectrum
  const sample = new Uint8Array(2048);
  return [analyser, sample];
})
  .pipe(
    map((freqs: Uint8Array) => {
      const [p99, p9999] = quantile(
        freqs as unknown as number[],
        [0.99, 0.9999]
      );
      const diff = p9999 - p99;

      if (diff < 16) {
        return new Uint8Array(2048).fill(0);
      }
      return freqs.map((freqLevel) => {
        return (Math.max(freqLevel - p99, 0) / diff) * 255;
      });
    })
  )
  .subscribe((sample) => {
    const inputLoudestBin = findLoudest(sample)?.bin || null;
    if (!inputLoudestBin) return;
    const loudestBin = smoothNote(inputLoudestBin);
    const currentFrequency = frequencyByBin[loudestBin];
    const noteNumber = toNote.number(currentFrequency);
    matchers.forEach((m) => m(noteNumber));
  });

export {};
