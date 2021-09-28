import { animationFrames } from "rxjs";
import React, { useCallback, useMemo } from "react";
import { ObservableCanvas } from "../observable-canvas/ObservableCanvas";
import { getMicrophoneSource, makeSampler } from "../octavious";
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

export const AudioFilters = () => {
  const $frames = useMemo(() => animationFrames(), []);
  const $micSource = useMemo(() => getMicrophoneSource(), []);

  const $rawSampler = useMemo(
    () =>
      makeSampler($frames, $micSource, (source) => {
        const analyser = source.context.createAnalyser();
        analyser.fftSize = DEFAULT_FFT_SIZE;
        analyser.smoothingTimeConstant = DEFAULT_SMOOTHING_CONSTANT;
        source.connect(analyser);
        const sample = new Uint8Array(analyser.frequencyBinCount);
        return [analyser, sample];
      }),
    [$frames, $micSource]
  );

  const $bandpassSampler = useMemo(
    () =>
      makeSampler($frames, $micSource, (source) => {
        const filter = new BiquadFilterNode(source.context, {
          type: "bandpass",
          Q: 0.4,
          frequency: 1000,
        });
        const bandpass = source.connect(filter);
        const analyser = source.context.createAnalyser();
        analyser.fftSize = DEFAULT_FFT_SIZE;
        analyser.smoothingTimeConstant = DEFAULT_SMOOTHING_CONSTANT;
        bandpass.connect(analyser);
        const sample = new Uint8Array(analyser.frequencyBinCount);
        return [analyser, sample];
      }),
    [$frames, $micSource]
  );

  const $compressorSampler = useMemo(
    () =>
      makeSampler($frames, $micSource, (source) => {
        const compressor = new DynamicsCompressorNode(source.context, {
          threshold: -50,
          knee: 40,
          ratio: 12,
          attack: 0,
          release: 0.25,
        });
        source.connect(compressor);
        const analyser = source.context.createAnalyser();
        analyser.fftSize = DEFAULT_FFT_SIZE;
        analyser.smoothingTimeConstant = DEFAULT_SMOOTHING_CONSTANT;
        compressor.connect(analyser);
        const sample = new Uint8Array(analyser.frequencyBinCount);
        return [analyser, sample];
      }),
    [$frames, $micSource]
  );

  const draw = useCallback(
    ({ context, value: freqs, rect: { width, height }, style }) => {
      const freqCount = 2048;
      const freqWidth = width / freqCount;
      context.fillStyle = style.backgroundColor || "white";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "black";
      for (let i = 0; i < freqCount; i++) {
        const volume = Math.max(freqs[i], 1);
        context.fillRect(
          i * freqWidth,
          height - height * (volume / 255),
          freqWidth,
          height
        );
      }

      const p9999 = quantile(freqs.slice(0, 2048), 0.9999);
      const p9999Y = (height * p9999) / 255;
      context.fillRect(0, height - p9999Y, width, 1);

      const p99 = quantile(freqs.slice(0, 2048), 0.99);
      const p99Y = (height * p99) / 255;
      context.fillRect(0, height - p99Y, width, 1);

      const p90 = quantile(freqs.slice(0, 2048), 0.9);
      const p90Y = (height * p90) / 255;
      context.fillRect(0, height - p90Y, width, 1);

      const p50 = quantile(freqs.slice(0, 2048), 0.5);
      const p50Y = (height * p50) / 255;
      context.fillRect(0, height - p50Y, width, 1);
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
      <h2>Raw</h2>
      <ObservableCanvas
        draw={draw}
        $value={$rawSampler}
        style={{
          ...styles.canvas,
          backgroundColor: "red",
        }}
      />
      <h2>Bandpass Filter</h2>
      <ObservableCanvas
        draw={draw}
        $value={$bandpassSampler}
        style={{
          ...styles.canvas,
          backgroundColor: "green",
        }}
      />
      <h2>Compressor</h2>
      <ObservableCanvas
        draw={draw}
        $value={$compressorSampler}
        style={{
          ...styles.canvas,
          backgroundColor: "blue",
        }}
      />
    </main>
  );
};
