import React, { useEffect, useMemo, useState } from "react";
import { fromMicrophone, makeRollingMode, NoteDescriptor } from "../octavious";
import { ObservableCanvas } from "../observable-canvas/ObservableCanvas";

const smoothNoteNumber = makeRollingMode({ defaultValue: -1, bufferSize: 16 });

export const WhistleLog = () => {
  const $micInput = useMemo(() => fromMicrophone({ minLoudness: 128 }), []);

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
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Whistlee mk. 2</h1>
        <ObservableCanvas
          draw={({ context, rect, value: note }) => {
            context.fillStyle = "white";
            context.fillRect(0, 0, rect.width, rect.height);

            if (!note) {
              return;
            }

            const { number } = note;
            const pitchNumber = number % 12;
            const hue = Math.abs((pitchNumber / 12) * 360 - 360);
            context.fillStyle = `hsl(${hue}, 100%, 50%)`;
            context.fillRect(
              rect.width / 2 - 50,
              rect.height / 2 - 50,
              100,
              100
            );
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
