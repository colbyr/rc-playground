import { makeArrayMatcher, makePartialArrayMatcher } from "../whistlee/melody";
import { NoteName, NoteNumberByName } from "./note";
import { makeRollingMode } from "./smoothing";

export const makeMatcher = <T>(pattern: T[], trigger: () => void) => {
  const isMatch = makeArrayMatcher(pattern);
  const isPartialMatch = makePartialArrayMatcher(pattern);
  let patternSoFar: T[] = [];

  return (entry: T) => {
    patternSoFar.push(entry);

    if (patternSoFar.length > pattern.length) {
      patternSoFar.shift();
    }

    if (isMatch(patternSoFar)) {
      patternSoFar = [];
      trigger();
      return true;
    }

    while (patternSoFar.length > 1) {
      if (isPartialMatch(patternSoFar)) {
        return false;
      }

      patternSoFar.shift();
    }

    return false;
  };
};

function diffNotes(prev: number | null, current: number | null) {
  if (prev === current) {
    return 0;
  }
  if (prev === null) {
    return Infinity;
  }
  if (current === null) {
    return -Infinity;
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
  bufferSize = 32,
}: {
  pattern: NoteName[];
  trigger: () => void;
  bufferSize?: number;
}) => {
  if (pattern.length < 3) {
    throw new Error("Relative pattern must be 3 or more notes");
  }

  const relativePattern = getRelativePattern(pattern);
  const match = makeMatcher(relativePattern, trigger);
  const smoothNoteNumber = makeRollingMode<number | null>({
    defaultValue: null,
    bufferSize,
  });

  let prevNote: number | null = null;
  let prevDiff = 0;
  return (rawNote: number | null) => {
    const currentNote = smoothNoteNumber(rawNote);

    if (prevNote === currentNote) {
      return;
    }

    const diff = diffNotes(prevNote, currentNote);
    // console.info(prevNote, "-", currentNote, "=", diff);
    prevNote = currentNote;
    prevDiff = diff;
    match(diff);
  };
};
