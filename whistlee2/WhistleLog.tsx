import React, { useEffect, useState } from "react";
import { fromMicrophone, makeRollingMode, NoteDescriptor } from "../octavious";

const smoothNoteNumber = makeRollingMode({ defaultValue: -1, bufferSize: 16 });

export const WhistleLog = () => {
  const [noteLog, setNoteLog] = useState<NoteDescriptor[]>([]);

  useEffect(() => {
    fromMicrophone().subscribe((nextNote) => {
      setNoteLog((prevLog) => {
        if (!nextNote || prevLog[0]?.number === nextNote.number) {
          return prevLog;
        }
        return [nextNote, ...prevLog].slice(0, 55);
      });
    });
  }, []);

  return (
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
      <pre
        style={{
          backgroundColor: "#ccc",
          display: "flex",
          flexGrow: 1,
          padding: "0.5rem",
        }}
      >
        {noteLog.map((note) => `${note.name}`).join("\n")}
      </pre>
    </main>
  );
};
