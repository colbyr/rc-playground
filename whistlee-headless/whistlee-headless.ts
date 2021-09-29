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
import { Patterns, send } from "./comms";
import { createMeydaAnalyzer } from "meyda";

const LIGHT_ID = 1;

const SMOOTHING_CONSTANT = 0;
const MIN_LOUDNESS = 32;
const DEFAULT_FFT_SIZE = Math.pow(2, 11);
const DEFAULT_SMOOTHING_CONSTANT = 0;
const MODE_SIZE = 24;
const MAX_SPREAD = 120;

const matchers = (
  Object.entries(Patterns) as unknown as [
    string,
    { name: string; pattern: NoteName[] }
  ][]
).map(([key, { name, pattern }]) =>
  makeRelativeMelodyMatcher({
    pattern,
    trigger: () => send(key),
    bufferSize: MODE_SIZE,
  })
);

const referencePitch = 440;
const toNote = new FrequencyToNoteConverter(referencePitch);
const sampleRate = new AudioContext().sampleRate;
const frequencyBinCount = DEFAULT_FFT_SIZE / 2;
const frequencyByBin = getFrequenciesByBin(sampleRate, frequencyBinCount);

navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(micStream);
  createMeydaAnalyzer({
    startImmediately: true,
    sampleRate: audioContext.sampleRate,
    audioContext,
    source,
    bufferSize: DEFAULT_FFT_SIZE,
    featureExtractors: ["amplitudeSpectrum", "spectralSpread"],
    callback: ({ amplitudeSpectrum, spectralSpread }) => {
      if (!amplitudeSpectrum || !spectralSpread) {
        return;
      }

      const loudestNote = findLoudest(amplitudeSpectrum);

      const note =
        loudestNote && spectralSpread < MAX_SPREAD
          ? toNote.number(frequencyByBin[loudestNote.bin])
          : null;

      matchers.forEach((matcher) => matcher(note));
    },
  });
});

export {};
