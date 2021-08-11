import { useEffect, useMemo, useRef } from "react";

export default function Whistlee() {
  const session = `${Math.random()}`;
  const audioRef = useRef<HTMLAudioElement>(null);
  const context = useMemo(
    () => global.AudioContext && new AudioContext(),
    [session]
  );

  const analyser = useMemo(() => {
    if (!context) {
      return null;
    }
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    return analyser;
  }, [context]);

  const dataArray = useMemo(
    () => analyser && new Uint8Array(analyser.frequencyBinCount),
    [analyser]
  );

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !analyser) {
      return;
    }

    const source = context.createMediaElementSource(audioElement);
    source.connect(analyser);
    source.connect(context.destination);
  }, [context, analyser]);

  return (
    <div>
      <header style={{ padding: "1rem" }}>
        <h1>Whistlee</h1>
      </header>
      <main
        style={{
          display: "flex",

          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <audio key={session} controls={true} src="/song.mp3" ref={audioRef} />
        <button
          onClick={() => {
            console.info(context.state);
            if (context.state === "suspended") {
              console.info("resume");
              context.resume();
            }

            const audioElement = audioRef.current;
            if (!audioElement || !dataArray || !analyser) {
              console.info("no audio element");
              return;
            }

            if (audioElement.paused) {
              let canvas = document.getElementById("canvas");
              let ctx = canvas.getContext("2d");
              let width = canvas.width;
              let height = canvas.height;
              console.info(width);
              console.info(height);

              audioElement.play();
              const draw = () => {
                analyser.getByteFrequencyData(dataArray);
                //console.info(dataArray);
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

                if (!audioRef.current?.paused) {
                  requestAnimationFrame(draw);
                }
              };
              draw();
              return;
            }

            audioElement.pause();
          }}
        >
          Play/Pause
        </button>
        <p style={{ textAlign: "center" }}>
          <a href="https://freemusicarchive.org/music/Doctor_Turtle/the-mountains-dont-care-about-you/the-void-says-hi">
            The Void Says Hi
          </a>{" "}
          by Doctor Turtle
          <br />
          <br />
          <a rel="license" href="https://creativecommons.org/licenses/by/4.0">
            <img
              alt="Creative Commons Attribution 4.0 International"
              src="https://licensebuttons.net/l/by/4.0/88x31.png"
            />
          </a>
        </p>
        <canvas id="canvas" />
      </main>
      <footer></footer>
    </div>
  );
}
