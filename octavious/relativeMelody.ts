import { makeMatcher } from "../whistlee/melody";
import { NoteName, NoteNumberByName } from "./note";
import { makeRollingMode } from "./smoothing";

const smoothNoteNumber = makeRollingMode<number | null>({
  defaultValue: null,
  bufferSize: 16,
});

function diffNotes(prev: number | null, current: number | null) {
  if (prev === current) {
    return 0;
  }
  if (prev === null) {
    return -Infinity;
  }
  if (current === null) {
    return Infinity;
  }
  return (current - prev) / 2;
}

function getRelativePattern(pattern: NoteName[]) {
  const relativePattern = [];
  for (let i = 1; i < pattern.length; i++) {
    const prev = pattern[i - 1];
    const current = pattern[i];
    const diff = diffNotes(NoteNumberByName[prev], NoteNumberByName[current]);
    relativePattern.push(diff);
  }
  return relativePattern;
}

export const makeRelativeMelodyMatcher = ({
  pattern,
  trigger,
}: {
  pattern: NoteName[];
  trigger: () => void;
}) => {
  if (pattern.length < 3) {
    throw new Error("Relative pattern must be 3 or more notes");
  }

  const relativePattern = getRelativePattern(pattern);
  const match = makeMatcher(relativePattern, trigger);
  let prevNote: number | null = null;
  let prevDiff = 0;
  console.info(pattern, "=>", relativePattern);
  return (rawNote: number | null) => {
    const currentNote = smoothNoteNumber(rawNote);
    if (prevNote === currentNote) {
      match(prevDiff);
      return;
    }

    const diff = diffNotes(prevNote, currentNote);
    prevNote = currentNote;
    prevDiff = diff;
    match(diff);
  };
};
