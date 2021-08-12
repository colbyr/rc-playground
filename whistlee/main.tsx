export {};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth * 0.75;
canvas.height = window.innerHeight * 0.25;
const startButton = document.getElementById("start") as HTMLButtonElement;

startButton.addEventListener("click", () => {
  startListening();
});

function startListening() {
  startButton.parentElement?.removeChild(startButton);
  const context = new AudioContext();

  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  navigator.mediaDevices.getUserMedia({ audio: true }).then(
    (microphoneStream) => {
      const source = context.createMediaStreamSource(microphoneStream);
      // https://en.wikipedia.org/wiki/Band-pass_filter
      const filter = new BiquadFilterNode(context, {
        type: "bandpass",
        Q: 10,
        frequency: 1000,
      });
      source.connect(filter);
      filter.connect(analyser);
      // source.connect(analyser);
      let ctx = canvas.getContext("2d")!;
      let width = canvas.width;
      let height = canvas.height;
      const borderHeight = Math.round(height * 0.05);
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "hsl(0, 0%, 100%)";
        ctx.beginPath();

        let bufferLength = analyser.frequencyBinCount;
        const displayLength = bufferLength / 8;
        var sliceWidth = Math.floor((width * 1.0) / displayLength);
        var x = 0;
        let loudestI = -1;
        for (var i = 0; i < displayLength; i++) {
          // var v = (Math.max(128.0, dataArray[i] * 1.0) - 128.0) / 128.0;
          const magnitude = dataArray[i];
          if (magnitude > 64 && magnitude > (dataArray[loudestI] || 0)) {
            loudestI = i;
          }
          const v = (magnitude + 1) / 256;

          const lightness = Math.abs(v * 50);
          const hue = Math.abs((i / displayLength) * 360 - 360);
          ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;

          var y = v * (height - borderHeight);
          const rectHeight = v * (height / 10);
          ctx.fillRect(x, y - rectHeight, sliceWidth, rectHeight);

          x += sliceWidth;
        }

        const borderHue = Math.abs((loudestI / displayLength) * 360 - 360);
        const loudestV = dataArray[loudestI] / 256;
        ctx.fillStyle = `hsl(${borderHue}, 100%, 50%, ${loudestV})`;
        ctx.fillRect(0, height - borderHeight, width, borderHeight);

        requestAnimationFrame(draw);
      };
      draw();
    },
    (err) => {
      console.error(err);
    }
  );
}
