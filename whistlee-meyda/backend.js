const fs = require("fs");
const Meyda = require("meyda");
const wav = require("node-wav");
const { range } = require("lodash");

export const bufferSize = 2048;

function* makeMeydaAnalyzer(channel) {
  const chunks = range(0, channel.length / bufferSize);
  let prevChunk = [];
  while (chunks.length) {
    const chunkI = chunks.shift();
    const chunk = channel.slice(chunkI * bufferSize, (chunkI + 1) * bufferSize);
    const result = Meyda.extract(
      ["amplitudeSpectrum", "energy", "spectralSpread"],
      chunk,
      prevChunk
    );
    prevChunk = chunk;
    yield result;
  }
}

function processFile(processFrame, fileName) {
  const buffer = fs.readFileSync(fileName);
  const wavFile = wav.decode(buffer);
  Meyda.sampleRate = wavFile.sampleRate;
  const analyzer = makeMeydaAnalyzer(wavFile.channelData[0]);

  const frames = [];
  for (const analysis of analyzer) {
    frames.push(processFrame(analysis));
  }
  return frames;
}

module.exports = { processFile };
