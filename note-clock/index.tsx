import { FMSynth, Loop, Transport } from "tone";
const startButton = document.getElementById("start")!;

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

startButton.addEventListener("click", () => {
  console.info("start");

  const hoursSynth = new FMSynth().toDestination();
  const minutesSynth = new FMSynth().toDestination();
  const secondsSynth = new FMSynth().toDestination();

  new Loop((time) => {
    const hours = new Date().getHours();
    const hourNoteI = hours % 12;
    const hourOctave = Math.floor(hours / 12) + 1;
    const hourNote = `${notes[hourNoteI]}${hourOctave}`;
    hoursSynth.triggerAttackRelease(hourNote, 3_600, time);

    const minutes = new Date().getMinutes();
    const minuteNoteI = (minutes + hourNoteI) % 12;
    const minuteOctave = Math.floor((minutes + hourNoteI) / 12) + 1;
    const minuteNote = `${notes[minuteNoteI]}${minuteOctave}`;
    minutesSynth.triggerAttackRelease(minuteNote, 60, time);

    const seconds = new Date().getSeconds();
    const secondNoteI = (seconds + minuteNoteI) % 12;
    const secondOctave = Math.floor((seconds + minuteNoteI) / 12) + 1;
    const secondNote = `${notes[secondNoteI]}${secondOctave}`;

    console.log({ hour: hourNote, minute: minuteNote, second: secondNote });
    secondsSynth.triggerAttackRelease(secondNote, 1, time);
  }, 1).start(0);

  Transport.start();
});
