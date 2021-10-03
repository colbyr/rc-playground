import { once } from "lodash";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  makeRelativeMelodyMatcher,
  makeRollingMean,
  NoteName,
} from "../octavious";
import { Patterns, send } from "./comms";
import { createMeydaAnalyzer } from "meyda";
import { now, Synth } from "tone";

const DEFAULT_FFT_SIZE = Math.pow(2, 11);
const MODE_SIZE = 24;

const getSynth = once(() => new Synth().toDestination());

const matchers = (
  Object.entries(Patterns) as unknown as [
    string,
    { name: string; pattern: NoteName[] }
  ][]
).map(([key, { name, pattern }]) =>
  makeRelativeMelodyMatcher({
    pattern,
    trigger: () => {
      send(key);
      const currentTime = now();
      pattern.forEach((note, offset) => {
        const playNote = `${note}4`;
        const duration = 0.5;
        const start = currentTime + duration * offset;
        getSynth().triggerAttackRelease(playNote, duration, start);
      });
    },
    bufferSize: MODE_SIZE,
  })
);

const getAverageSpread = makeRollingMean({
  defaultValue: 100,
  bufferSize: 512,
});
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

      const avgSpread = getAverageSpread(spectralSpread);
      const loudest = findLoudest(amplitudeSpectrum);

      const note =
        loudest && spectralSpread < avgSpread
          ? toNote.number(frequencyByBin[loudest.bin])
          : null;

      matchers.forEach((matcher) => matcher(note));
    },
  });
});

export {};
