const { Essentia, EssentiaWASM } = require("essentia.js");
const mic = require("mic");
const fs = require("fs");

const essentia = new Essentia(EssentiaWASM);

console.log("ess version:", essentia.version);

console.log(essentia.algorithmNames);

var micInstance = mic({
  rate: "16000",
  channels: "1",
  // debug: true,
  // exitOnSilence: 6
});
var micInputStream = micInstance.getAudioStream();

micInputStream.on("data", function (data) {
  console.log("Recieved Input Stream: " + data.length);
  const vectorInput = essentia.arrayToVector(data);
  const pitch = essentia.PitchMelodia(vectorInput).pitch;
  console.log(essentia.vectorToArray(pitch));
});

micInputStream.on("error", function (err) {
  cosole.log("Error in Input Stream: " + err);
});

micInstance.start();
