// const startButton = document.getElementById("start")!;

(async () => {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule("./white-noise.js");
  const whiteNoiseNode = new AudioWorkletNode(
    audioContext,
    "white-noise-processor"
  );
  whiteNoiseNode.connect(audioContext.destination);
})();

export {};
