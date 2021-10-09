import { createMeydaAnalyzer } from "meyda";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { range, zip } from "lodash";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  makeRollingMode,
  noteFullName,
  NoteNames,
} from "../octavious";

const bufferSize = 2048;

function rotate2DArray(input: number[][]) {
  return zip(...input) as number[][];
}

type Analysis = {
  duration: number;
  sampleCount: number;
  sampleRate: number;
  smoothingFactor: number;
  bufferSize: number;
  maxSpread: number;
  amplitudeSpectrum: number[][];
  chroma: number[][];
  rms: number[];
  spectralCentroid: Array<number | null>;
  spectralFlatness: Array<number | null>;
  spectralSpread: Array<number | null>;
};

type Processed = {
  loudestNotes: Array<number | null>;
  spreadFilter: Array<number | null>;
  notesMode: Array<number | null>;
  doubleMode: Array<number | null>;
  smoothedAndFiltered: Array<number | null>;
};

const notesYAxis = (notes: number[]) =>
  notes.map((n) => `${n} (${noteFullName(n)})`);

function process({
  amplitudeSpectrum,
  spectralSpread,
  sampleRate,
  bufferSize,
  maxSpread,
  smoothingFactor,
}: Analysis): Processed {
  const binToFreq = getFrequenciesByBin(sampleRate, bufferSize / 2);
  const toNote = new FrequencyToNoteConverter(440);
  const loudestNotes: Array<null | number> = amplitudeSpectrum.map((sample) => {
    const loudest = findLoudest(sample || []);
    return loudest && toNote.number(binToFreq[loudest.bin]);
  });
  const smoothNote = makeRollingMode<number | null>({
    defaultValue: null,
    bufferSize: smoothingFactor,
  });
  const doubleSmooth = makeRollingMode<number | null>({
    defaultValue: null,
    bufferSize: smoothingFactor,
  });
  const spreadFilter = loudestNotes.map((note, index) => {
    const spread = spectralSpread[index] || 0;
    if (spread > maxSpread) {
      return null;
    }
    return note;
  });
  const notesMode = loudestNotes.map(smoothNote);
  return {
    loudestNotes,
    spreadFilter,
    notesMode,
    doubleMode: notesMode.map(doubleSmooth),
    smoothedAndFiltered: spreadFilter.map(smoothNote),
  };
}

const makeAnalysis = ({
  bufferSize,
  duration,
  maxSpread,
  sampleRate,
  smoothingFactor,
}: {
  bufferSize: number;
  duration: number;
  maxSpread: number;
  sampleRate: number;
  smoothingFactor: number;
}): Analysis => ({
  duration,
  maxSpread,
  bufferSize,
  sampleCount: 0,
  sampleRate,
  smoothingFactor,
  amplitudeSpectrum: [],
  chroma: [],
  rms: [],
  spectralCentroid: [],
  spectralFlatness: [],
  spectralSpread: [],
});

export const AudioAnalyzer = () => {
  const [audioFile, setAudioFile] = useState<null | File>(null);
  const [{ analysis, processed }, setResult] = useState<
    | { analysis: null; processed: null }
    | { analysis: Analysis; processed: Processed }
  >({ analysis: null, processed: null });
  const [maxSpread, setMaxSpread] = useState(120);

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
      smoothingFactor: 24,
      bufferSize,
      duration: audio.duration,
      maxSpread,
      sampleRate: audioContext.sampleRate,
    });

    const analyzer = createMeydaAnalyzer({
      sampleRate: audioContext.sampleRate,
      audioContext,
      source,
      bufferSize,
      featureExtractors: [
        "amplitudeSpectrum",
        "chroma",
        "rms",
        "spectralCentroid",
        "spectralFlatness",
        "spectralSpread",
      ],
      callback: (analysisFrame) => {
        analysis.sampleCount++;
        analysis.amplitudeSpectrum.push(
          (analysisFrame.amplitudeSpectrum as unknown as number[]) || []
        );
        analysis.chroma.push(analysisFrame.chroma || []);
        analysis.rms.push(analysisFrame.rms || 0);
        analysis.spectralCentroid.push(analysisFrame.spectralCentroid || null);
        analysis.spectralFlatness.push(analysisFrame.spectralFlatness || null);
        analysis.spectralSpread.push(analysisFrame.spectralSpread || null);
      },
    });
    const startTime = audioContext.currentTime;
    audioContext.resume();
    analyzer.start();
    audio.play();

    const onEnd = () => {
      analyzer.stop();
      setResult({
        analysis: {
          ...analysis,
          duration: audioContext.currentTime - startTime,
        },
        processed: process(analysis),
      });
    };
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      analyzer.stop();
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioContext, audioFile, maxSpread]);

  console.info({ analysis, processed });
  const x = analysis
    ? range(0, analysis.duration, analysis.duration / analysis.sampleCount)
    : [];

  const noteRange = range(0, 100).map((num) => noteFullName(num));
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
            <table
              // @ts-expect-error
              border={1}
              style={{ border: "1px", marginBottom: "1rem", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>Buffer Size</th>
                  <th>Sample Rate</th>
                  <th>Max Spread</th>
                  <th>Smoothing factor</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: "right" }}>
                  <td>{analysis.bufferSize}</td>
                  <td>{analysis.sampleRate}</td>
                  <td>{analysis.maxSpread}</td>
                  <td>{analysis.smoothingFactor}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: "flex", overflowX: "scroll" }}>
              <Plot
                data={[
                  {
                    y: NoteNames,
                    x,
                    z: rotate2DArray(analysis.chroma),
                    type: "heatmap",
                  },
                ]}
                layout={{
                  title: "Choma",
                  width: 520,
                  xaxis: { title: "Seconds" },
                }}
              />
              <Plot
                data={[{ x, y: analysis.spectralCentroid }]}
                layout={{ title: "Spectral Centroid", width: 520 }}
              />
              <Plot
                data={[{ x, y: analysis.spectralFlatness }]}
                layout={{ title: "Spectral Flatness", width: 520 }}
              />
              <Plot
                data={[{ x, y: analysis.spectralSpread }]}
                layout={{ title: "Spectral Spread", width: 520 }}
              />
              <Plot
                data={[
                  {
                    x,
                    z: rotate2DArray(analysis.amplitudeSpectrum),
                    type: "heatmap",
                  },
                ]}
                layout={{
                  title: "Amplitude Spectrum",
                  width: 520,
                  xaxis: { title: "Seconds" },
                }}
              />
              <Plot
                data={[{ x, y: analysis.rms }]}
                layout={{ title: "Root Mean Square", width: 520 }}
              />
            </div>
            <Plot
              data={[
                {
                  x,
                  y: notesYAxis(processed?.loudestNotes),
                  name: "Loudest notes",
                },
                {
                  x,
                  y: notesYAxis(processed?.spreadFilter),
                  name: "Spectral Spread Filter",
                },
                { x, y: notesYAxis(processed?.notesMode), name: "Notes mode" },
                {
                  x,
                  y: notesYAxis(processed?.doubleMode),
                  name: "Double mode",
                },
              ]}
              layout={{
                title: "Notes",
                xaxis: { title: "Seconds" },
              }}
            />
            <div>
              <Plot
                data={[
                  { x, y: processed?.smoothedAndFiltered, type: "scatter" },
                ]}
                layout={{
                  title: "Result",
                  xaxis: { title: "Seconds" },
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};
