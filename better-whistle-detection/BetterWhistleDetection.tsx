import { animationFrames, map } from "rxjs";
import React, { useCallback, useEffect, useMemo } from "react";
import { ObservableCanvas } from "../observable-canvas/ObservableCanvas";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  getMicrophoneSource,
  makeRollingMode,
  makeRollingMean,
  makeSampler,
} from "../octavious";
import { quantile } from "simple-statistics";

const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_SMOOTHING_CONSTANT = 0;

const styles = {
  canvas: {
    marginBottom: "1rem",
    display: "flex",
    flex: 1,
  },
};

export const BetterWhistleDetection = () => {
  const $frames = useMemo(() => animationFrames(), []);
  const $micSource = useMemo(() => getMicrophoneSource(), []);

  const $sampler = useMemo(
    () =>
      makeSampler($frames, $micSource, (source) => {
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
        console.info({
          sampleRate: analyser.context.sampleRate,
          frequencyBinCount: analyser.frequencyBinCount,
        });
        bandpass.connect(analyser);
        // only sample the first 2048 frequency bins of the spectrum
        const sample = new Uint8Array(2048);
        return [analyser, sample];
      }).pipe(
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
      ),
    [$frames, $micSource]
  );

  useEffect(() => {
    const smoothNote = makeRollingMode<number>({
      defaultValue: 0,
      bufferSize: 24,
    });
    const referencePitch = 441;
    const toNote = new FrequencyToNoteConverter(referencePitch);
    const sampleRate = new AudioContext().sampleRate;
    const frequencyBinCount = DEFAULT_FFT_SIZE / 2;
    const frequencyByBin = getFrequenciesByBin(sampleRate, frequencyBinCount);
    const subscription = $sampler.subscribe((sample) => {
      const inputLoudestBin = findLoudest(sample)?.bin || null;
      if (!inputLoudestBin) return;
      const loudestBin = smoothNote(inputLoudestBin);
      if (loudestBin) {
        const currentFrequency = frequencyByBin[loudestBin];
        console.info(
          toNote.number(currentFrequency),
          toNote.name(currentFrequency)
        );
      } else {
        console.info(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [$sampler]);

  const draw = useCallback(
    ({ context, value: freqs, rect: { width, height }, style }) => {
      const freqCount = freqs.length;
      const freqWidth = width / freqCount;
      context.fillStyle = style.backgroundColor || "white";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "black";
      for (let i = 0; i < freqCount; i++) {
        const volume = freqs[i];
        context.fillRect(
          i * freqWidth,
          height - height * (volume / 255),
          freqWidth,
          height
        );
      }
    },
    []
  );

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        padding: "1rem",
      }}
    >
      <ObservableCanvas
        draw={draw}
        $value={$sampler}
        style={{
          ...styles.canvas,
          backgroundColor: "green",
        }}
      />
    </main>
  );
};
