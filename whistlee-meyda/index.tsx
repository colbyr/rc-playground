import circularBuffer from "@stdlib/utils-circular-buffer";
import Meyda from "meyda";
import { FrequencyToNoteConverter, NoteName } from "../octavious/note";
import { makeRelativeMelodyMatcher } from "../octavious/relativeMelody";
import { findLoudest } from "../octavious/octavious";
import { getFrequenciesByBin } from "../octavious/frequency";
import { modeFast } from "simple-statistics";
import { Patterns } from "../whistlee-headless/comms";

const bufferSize = Math.pow(2, 9);
const binCount = bufferSize / 2;
const minEnergy = bufferSize * 0.001;
const maxSpectralSpread = binCount * 0.05;

console.info("settings", {
  bufferSize,
  binCount,
  minEnergy,
  maxSpectralSpread,
});

const startButton = document.getElementById("start")!;

const matchers = (
  Object.entries(Patterns) as unknown as [
    string,
    { name: string; pattern: NoteName[] }
  ][]
).map(([key, { name, pattern }]) =>
  makeRelativeMelodyMatcher({
    pattern,
    trigger: () => console.info("match", { key, name, pattern }),
    bufferSize: 16,
  })
);

startButton.addEventListener("click", () => {
  console.info("start!");
  const toNote = new FrequencyToNoteConverter(440);
  const notes = circularBuffer(32);
  navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
    console.info("got mic", micStream);
    const context = new AudioContext();
    const micSource = context.createMediaStreamSource(micStream);
    const frequencyByBin = getFrequenciesByBin(context.sampleRate, binCount);
    const analyzer = Meyda.createMeydaAnalyzer({
      audioContext: context,
      source: micSource,
      bufferSize,
      featureExtractors: [
        "chroma",
        "amplitudeSpectrum",
        "powerSpectrum",
        "rms",
        "energy",
        "spectralCentroid",
        "spectralSpread",
      ],
      callback: ({
        amplitudeSpectrum,
        energy,
        spectralSpread,
        powerSpectrum,
        rms,
      }) => {
        if (!spectralSpread || !amplitudeSpectrum || !energy) {
          return;
        }
        // if (energy < 10 || spectralSpread > 32) {
        // console.info({energy, spectralSpread})
        const { bin, loudness } = findLoudest(amplitudeSpectrum);
        if (loudness < 24 || spectralSpread > maxSpectralSpread) {
          notes.push(null);
          matchers.forEach((m) => m(null));
          return;
        }
        console.info(loudness, spectralSpread, energy);

        const freq = frequencyByBin[bin];
        const noteNumber = toNote.number(freq);
        notes.push(noteNumber);
        // const noteMode = modeFast(notes._buffer)
        // noteModes.push(noteMode)
        matchers.forEach((m) => m(noteNumber));
      },
    });
    setInterval(() => console.info(notes._buffer), 1000);
    analyzer.start();
  });
});
