import { audioContext, createMeydaAnalyzer } from "meyda";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { context } from "tone";
const bufferSize = 1024;

type Analysis = {
  amplitudeSpectrum: number[][];
  spectralSpread: number[];
};

export const AudioAnalyzer = () => {
  const [audioFile, setAudioFile] = useState<null | File>(null);
  const [analysis, setAnalysis] = useState<null | Analysis>(null);
  const audioContext = useMemo(() => new AudioContext(), []);

  useEffect(() => {
    if (!audioFile) {
      return;
    }

    const url = URL.createObjectURL(audioFile);
    const audio = new Audio(url);
    const source = audioContext.createMediaElementSource(audio);
    source.connect(audioContext.destination);
    const result: Analysis = {
      amplitudeSpectrum: [],
      spectralSpread: [],
    };

    const analyzer = createMeydaAnalyzer({
      sampleRate: audioContext.sampleRate,
      audioContext,
      source,
      bufferSize,
      featureExtractors: ["amplitudeSpectrum", "spectralSpread"],
      callback: (analysisFrame) => {
        result.amplitudeSpectrum.push(analysisFrame.amplitudeSpectrum || []);
        result.spectralSpread.push(analysisFrame.spectralSpread);
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
      analyzer.stop();
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioContext, audioFile]);

  // console.info(analysis);
  return (
    <div>
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
      {analysis && (
        <main>
          <Plot
            data={[{ y: analysis.spectralSpread }]}
            layout={{ title: "Spectral Spread" }}
          />
          <Plot
            data={[
              {
                z: analysis.amplitudeSpectrum,
                type: "heatmap",
              },
            ]}
            layout={{ title: "amplitudeSpectrum" }}
          />
        </main>
      )}
    </div>
  );
};
