// const startButton = document.getElementById("start")!;

(async () => {
  const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule("./white-noise.js");
  await audioContext.audioWorklet.addModule("./essentia-worklet.js");
  const source = audioContext.createMediaStreamSource(micStream);
  const essentiaNode = new AudioWorkletNode(audioContext, "essentia-worklet");
  source.connect(essentiaNode);
})();

export {};
