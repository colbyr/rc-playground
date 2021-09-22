import {
  combineLatest,
  animationFrames,
  map,
  mergeMap,
  share,
  combineLatestWith,
  Observable,
} from "rxjs";
import React, { useCallback, useMemo } from "react";
import {} from "module";
import {
  ObservableCanvas,
  ObservableCanvasDrawProp,
} from "../observable-canvas/ObservableCanvas";
import { getMicrophoneSource } from "../octavious";

const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_SMOOTHING_CONSTANT = 0.1;

const styles = {
  canvas: {
    marginBottom: "1rem",
    display: "flex",
    flex: 1,
  },
};

function makeSampler(
  $frames: Observable<any>,
  $source: Observable<AudioNode>,
  makeAnalyser: (source: AudioNode) => [AnalyserNode, Uint8Array]
) {
  return $frames.pipe(
    combineLatestWith(
      $source.pipe(
        map((source): [AnalyserNode, Uint8Array] => {
          return makeAnalyser(source);
        }),
        share()
      )
    ),
    map(([_, [analyser, sample]]) => {
      analyser.getByteFrequencyData(sample);
      return sample;
    }),
    share()
  );
}

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
          Q: 3,
          frequency: 1024,
          gain: 3,
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
