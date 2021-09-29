import { createMeydaAnalyzer } from "meyda";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { zip } from "lodash";

const bufferSize = 1024;

function rotate2DArray(input: number[][]) {
  return zip(...input) as number[][];
}

type Analysis = {
  amplitudeSpectrum: number[][];
  rms: number[];
  spectralSpread: Array<number | null>;
};

const makeAnalysis = (): Analysis => ({
  amplitudeSpectrum: [],
  rms: [],
  spectralSpread: [],
});

export const AudioAnalyzer = () => {
  const [audioFile, setAudioFile] = useState<null | File>(null);
  const [analysis, setAnalysis] = useState<null | Analysis>(null);
  const audioContext = useMemo(() => new AudioContext(), []);

  useEffect(() => {
    if (!audioFile) {
      return;
    }

    setAnalysis(null);
    const url = URL.createObjectURL(audioFile);
    const audio = new Audio(url);
    const source = audioContext.createMediaElementSource(audio);
    source.connect(audioContext.destination);
    const result: Analysis = makeAnalysis();

    const analyzer = createMeydaAnalyzer({
      sampleRate: audioContext.sampleRate,
      audioContext,
      source,
      bufferSize,
      featureExtractors: ["amplitudeSpectrum", "rms", "spectralSpread"],
      callback: (analysisFrame) => {
        result.amplitudeSpectrum.push(
          (analysisFrame.amplitudeSpectrum as unknown as number[]) || []
        );
        result.rms.push(analysisFrame.rms || 0);
        result.spectralSpread.push(analysisFrame.spectralSpread || null);
      },
    });
    audioContext.resume();
    analyzer.start();
    audio.play();

    const onEnd = () => {
      analyzer.stop();
      setAnalysis(result);
    };
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      analyzer.stop();
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioContext, audioFile]);

  console.info(analysis);
  console.info(analysis && rotate2DArray(analysis.amplitudeSpectrum));
  return (
    <div style={{ padding: "1rem" }}>
      <input
        type="file"
        accept="wav"
        onChange={(evt) => {
          const files = evt.target.files;
          if (files) {
            setAudioFile(files[0]);
          }
        }}
      />
      <main style={{ marginTop: "1rem" }}>
        {!analysis && audioFile && <div>analyzing {audioFile.name}...</div>}
        {analysis && (
          <>
            <Plot
              data={[{ y: analysis.rms }]}
              layout={{ title: "Root Mean Square" }}
            />
            <Plot
              data={[{ y: analysis.spectralSpread }]}
              layout={{ title: "Spectral Spread" }}
            />
            <Plot
              data={[
                {
                  z: rotate2DArray(analysis.amplitudeSpectrum),
                  type: "heatmap",
                },
              ]}
              layout={{ title: "Amplitude Spectrum" }}
            />
          </>
        )}
      </main>
    </div>
  );
};
