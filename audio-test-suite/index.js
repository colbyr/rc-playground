const fs = require("fs");
const Meyda = require("meyda");
const wav = require("node-wav");
const { range } = require("lodash");
const { plot } = require("nodeplotlib");

const filename = process.argv[2];
console.info("FILENAME", filename);

const buffer = fs.readFileSync(filename);
const wavFile = wav.decode(buffer);

console.log(wavFile.sampleRate);
const channel1 = wavFile.channelData[0];

Meyda.sampleRate = wavFile.sampleRate;

const bufferSize = 512;

const extractor = "spectralSpread";

const features = range(0, channel1.length / bufferSize).map((chunkI) => {
  const prevChunk = channel1.slice(
    (chunkI - 1) * bufferSize,
    chunkI * bufferSize
  );
  const chunk = channel1.slice(chunkI * bufferSize, (chunkI + 1) * bufferSize);
  return Meyda.extract(extractor, chunk, prevChunk);
});
plot(
  [
    {
      y: features,
      title: extractor,
    },
  ],
  {
    title: `${filename} (${extractor})`,
  }
);
