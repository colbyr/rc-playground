import { createMeydaAnalyzer } from "meyda";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { zip } from "lodash";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  makeRollingMode,
} from "../octavious";

const bufferSize = 2048;

function rotate2DArray(input: number[][]) {
  return zip(...input) as number[][];
}

type Analysis = {
  sampleRate: number;
  bufferSize: number;
  amplitudeSpectrum: number[][];
  rms: number[];
  spectralSpread: Array<number | null>;
};

type Processed = {
  loudestNotes: Array<number | null>;
  spreadFilter: Array<number | null>;
  notesMode: Array<number | null>;
  smoothedAndFiltered: Array<number | null>;
};

function process({
  amplitudeSpectrum,
  spectralSpread,
  sampleRate,
  bufferSize,
}: Analysis): Processed {
  const binToFreq = getFrequenciesByBin(sampleRate, bufferSize / 2);
  const toNote = new FrequencyToNoteConverter(440);
  const loudestNotes: Array<null | number> = amplitudeSpectrum.map((sample) => {
    const loudest = findLoudest(sample || []);
    return loudest && toNote.number(binToFreq[loudest.bin]);
  });
  const smoothNote = makeRollingMode<number | null>({
    defaultValue: null,
    bufferSize: 24,
  });
  const spreadFilter = loudestNotes.map((note, index) => {
    const spread = spectralSpread[index] || 0;
    if (spread > 120) {
      return null;
    }
    return note;
  });
  return {
    loudestNotes,
    spreadFilter,
    notesMode: loudestNotes.map(smoothNote),
    smoothedAndFiltered: spreadFilter.map(smoothNote),
  };
}

const makeAnalysis = ({
  bufferSize,
  sampleRate,
}: {
  bufferSize: number;
  sampleRate: number;
}): Analysis => ({
  bufferSize,
  sampleRate,
  amplitudeSpectrum: [],
  rms: [],
  spectralSpread: [],
});

export const AudioAnalyzer = () => {
  const [audioFile, setAudioFile] = useState<null | File>(null);
  const [{ analysis, processed }, setResult] = useState<
    | { analysis: null; processed: null }
    | { analysis: Analysis; processed: Processed }
  >({ analysis: null, processed: null });

  const audioContext = useMemo(() => new AudioContext(), []);

  useEffect(() => {
    if (!audioFile) {
      return;
    }

    setResult({ analysis: null, processed: null });
    const url = URL.createObjectURL(audioFile);
    const audio = new Audio(url);
    const source = audioContext.createMediaElementSource(audio);
    source.connect(audioContext.destination);
    const analysis: Analysis = makeAnalysis({
      bufferSize,
      sampleRate: audioContext.sampleRate,
    });

    const analyzer = createMeydaAnalyzer({
      sampleRate: audioContext.sampleRate,
      audioContext,
      source,
      bufferSize,
      featureExtractors: ["amplitudeSpectrum", "rms", "spectralSpread"],
      callback: (analysisFrame) => {
        analysis.amplitudeSpectrum.push(
          (analysisFrame.amplitudeSpectrum as unknown as number[]) || []
        );
        analysis.rms.push(analysisFrame.rms || 0);
        analysis.spectralSpread.push(analysisFrame.spectralSpread || null);
      },
    });
    audioContext.resume();
    analyzer.start();
    audio.play();

    const onEnd = () => {
      analyzer.stop();
      setResult({
        analysis,
        processed: process(analysis),
      });
    };
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      analyzer.stop();
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioContext, audioFile]);

  console.info({ analysis, processed });
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
            <h2>Analysis</h2>
            <div style={{ display: "flex", overflowX: "scroll" }}>
              <Plot
                data={[{ y: analysis.rms }]}
                layout={{ title: "Root Mean Square", width: 520 }}
              />
              <Plot
                data={[{ y: analysis.spectralSpread }]}
                layout={{ title: "Spectral Spread", width: 520 }}
              />
              <Plot
                data={[
                  {
                    z: rotate2DArray(analysis.amplitudeSpectrum),
                    type: "heatmap",
                  },
                ]}
                layout={{ title: "Amplitude Spectrum", width: 520 }}
              />
            </div>
            <h2>Notes</h2>
            <div style={{ display: "flex", overflowX: "scroll" }}>
              <Plot
                data={[{ y: processed?.loudestNotes }]}
                layout={{
                  title: "Loudest notes",
                  width: 520,
                }}
              />
              <Plot
                data={[{ y: processed?.spreadFilter }]}
                layout={{
                  title: "Spread filter",
                  width: 520,
                }}
              />
              <Plot
                data={[{ y: processed?.notesMode }]}
                layout={{
                  title: "Notes Mode",
                  width: 520,
                }}
              />
            </div>
            <h2>Result</h2>
            <Plot
              data={[{ y: processed?.smoothedAndFiltered }]}
              layout={{
                title: "Result",
              }}
            />
          </>
        )}
      </main>
    </div>
  );
};
