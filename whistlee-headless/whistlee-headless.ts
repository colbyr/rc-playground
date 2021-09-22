import { fromMicrophone, makeRelativeMelodyMatcher } from "../octavious";
import { setHueLightState } from "../whistlee/HueApi";

const LIGHT_ID = 1;

const matchers = [
  makeRelativeMelodyMatcher({
    pattern: ["c", "e", "g"],
    trigger: () => {
      setHueLightState(LIGHT_ID, { on: true, bri: 254 });
      console.info("💡 turn on the lights!");
    },
  }),
  makeRelativeMelodyMatcher({
    pattern: ["g", "e", "c"],
    trigger: () => {
      setHueLightState(LIGHT_ID, { on: false });
      console.info("💤 turn off the lights!");
    },
  }),
];

fromMicrophone().subscribe((note) => {
  if (!note || note.loudness < 128) {
    matchers.forEach((m) => m(null));
    return;
  }
  matchers.forEach((m) => m(note.number));
});

export {};
