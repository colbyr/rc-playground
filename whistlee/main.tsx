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
  analyser.fftSize = 4096;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  navigator.mediaDevices.getUserMedia({ audio: true }).then(
    (microphoneStream) => {
      console.info("subscribe to mic");
      const source = context.createMediaStreamSource(microphoneStream);
      source.connect(analyser);
      let ctx = canvas.getContext("2d")!;
      let width = canvas.width;
      let height = canvas.height;
      console.info(width);
      console.info(height);
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.beginPath();

        let bufferLength = analyser.frequencyBinCount;
        const displayLength = bufferLength / 8;
        var sliceWidth = (width * 1.0) / displayLength;
        var x = 0;
        for (var i = 0; i < displayLength; i++) {
          var v = (Math.max(128.0, dataArray[i] * 1.0) - 128.0) / 128.0;
          var y = v * height;
          // var y = rawY < height / 2 ? 0 : rawY;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
        ctx.stroke();

        requestAnimationFrame(draw);
      };
      draw();
    },
    (err) => {
      console.error(err);
    }
  );
}
