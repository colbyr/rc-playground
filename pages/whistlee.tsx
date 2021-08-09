import { useEffect, useMemo, useRef } from "react";

export default function Whistlee() {
  const session = `${Math.random()}`;
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioElement = audioRef.current;
  const context = useMemo(
    () => global.AudioContext && new AudioContext(),
    [session]
  );

  useEffect(() => {
    if (!audioElement) {
      return;
    }

    const track = context.createMediaElementSource(audioElement);
    track.connect(context.destination);
  }, [context]);

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
            if (context.state === "suspended") {
              context.resume();
            }

            if (!audioElement) {
              return;
            }

            if (audioElement.paused) {
              audioElement.play();
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
      </main>
      <footer></footer>
    </div>
  );
}
