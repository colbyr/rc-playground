import {
  fromAudioSource,
  fromMicrophone,
  getMicrophoneSource,
  makeRelativeMelodyMatcher,
} from "../octavious";
import { map, mergeMap, share } from "rxjs";
import { setHueLightState } from "../whistlee/HueApi";

const LIGHT_ID = 1;

const SMOOTHING_CONSTANT = 0.1;
const MIN_LOUDNESS = 32;

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

getMicrophoneSource()
  .pipe(
    map((source) => {
      const filter = new BiquadFilterNode(source.context, {
        type: "bandpass",
        Q: 3,
        frequency: 1024,
        gain: 3,
      });
      return source.connect(filter);
    }),
    mergeMap((source) => {
      return fromAudioSource(source, { smoothingConstant: SMOOTHING_CONSTANT });
    }),
    share()
  )
  .subscribe((note) => {
    if (!note || note.loudness < MIN_LOUDNESS) {
      matchers.forEach((m) => m(null));
      return;
    }
    matchers.forEach((m) => m(note.number));
  });

export {};
