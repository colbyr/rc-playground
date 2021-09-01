import React, { useMemo } from "react";
import { Observable } from "rxjs";
import { fromMicrophone, NoteDescriptor } from "../octavious";
import {
  ObservableCanvas,
  ObservableCanvasDrawProp,
} from "../observable-canvas/ObservableCanvas";
import { makeRelativeMelodyMatcher } from "../octavious";
import { setHueLightState } from "../whistlee/HueApi";

const LIGHT_ID = 1;

let subsequent: number[] = [];
const getSubsequent = (n: number) => {
  if (subsequent[0] === n) {
    subsequent.push(n);
  } else {
    subsequent = [n];
  }
  return subsequent.length - 1;
};

const matchers = [
  // makeMatcher(["c♯", "g♯", "c♯"], () => console.info("lights off 😴")),
  // makeMatcher(["c♯", "g♯", "c♯"], () => console.info("lights on 💡")),
  makeRelativeMelodyMatcher({
    pattern: ["c", "e", "g"],
    trigger: () => {
      window.alert("lights on 💡");
      setHueLightState(LIGHT_ID, { on: true, bri: 254 });
    },
  }),
  makeRelativeMelodyMatcher({
    pattern: ["c", "e", "c"],
    trigger: () => {
      window.alert("lights off 😴");
      setHueLightState(LIGHT_ID, { on: false });
    },
  }),
];

type Value = NoteDescriptor | null;

const drawBackground: ObservableCanvasDrawProp<Value> = ({
  context,
  rect,
  value: note,
}) => {
  context.fillStyle = "white";
  context.fillRect(0, 0, rect.width, rect.height);

  if (!note) {
    return;
  }

  const inARow = getSubsequent(note.number);
  const pitchNumber = note.number % 12;
  const hue = Math.abs((pitchNumber / 12) * 360 - 360);
  const maxRadius = Math.min(rect.height, rect.width) / 2;
  const gradient = context.createRadialGradient(
    rect.width / 2,
    rect.height / 2,
    0,
    rect.width / 2,
    rect.height / 2,
    Math.max(((inARow - 1) / 100) * maxRadius, 0)
  );
  const lightness = 100 - (note.loudness / 255) * 50;
  gradient.addColorStop(0, `hsl(${hue}, 100%, ${lightness}%)`);
  gradient.addColorStop(1, "#FFF");
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  context.font = "30px monospace";
  context.textAlign = "center";
  context.fillStyle = "black";
  context.fillText(note.name, rect.width / 2, rect.height / 2 + 10);
};

export const WhistleLog = () => {
  const $micInput: Observable<Value> = useMemo(() => fromMicrophone(), []);

  return (
    <>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          minWidth: "100vw",
          padding: "1rem",
        }}
      >
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Whistlee MK2</h1>
        <ObservableCanvas
          draw={({ value: note, ...opts }) => {
            if (!note || note.loudness < 128) {
              drawBackground({ ...opts, value: null });
              matchers.forEach((m) => m(null));
              return;
            }

            drawBackground({ ...opts, value: note });
            const logNumber = note && note.loudness > 128 ? note.number : null;
            matchers.forEach((m) => m(logNumber));
          }}
          $value={$micInput}
          style={{
            position: "fixed",
            zIndex: -1,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
          }}
        />
      </main>
    </>
  );
};
