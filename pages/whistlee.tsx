export default function Whistlee() {
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
        <audio controls={true} src="/song.mp3" />
        <p style={{ textAlign: "center" }}>
          <a href="https://freemusicarchive.org/music/Doctor_Turtle/the-mountains-dont-care-about-you/the-void-says-hi">
            The Void Says Hi
          </a>
          by Doctor Turtle
          <br />
          <br />
          <a rel="license" href="https://creativecommons.org/licenses/by/4.0">
            <img src="https://licensebuttons.net/l/by/4.0/88x31.png" />
          </a>
        </p>
      </main>
      <footer></footer>
    </div>
  );
}
