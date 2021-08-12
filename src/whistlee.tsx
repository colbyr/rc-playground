export {};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const startButton = document.getElementById("start") as HTMLButtonElement;

startButton.addEventListener("click", () => {
  startListening();
});

function startListening() {
  const context = new AudioContext();

  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
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
        // console.info(dataArray);
        ctx.fillStyle = "lightgray";
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.beginPath();

        let bufferLength = analyser.frequencyBinCount;
        var sliceWidth = (width * 1.0) / bufferLength;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {
          var v = dataArray[i] / 128.0;
          var y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
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
