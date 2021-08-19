import { modeFast } from "simple-statistics";

const LOOKAHEAD = 16;
const LOOKBEHIND = 4;

export const getMelodyShape = (freqs: number[]) => {
  if (freqs.length < LOOKAHEAD + LOOKBEHIND) {
    return [];
  }

  return freqs.reduce((acc: number[], n, i) => {
    if (acc.length < 0) {
      acc.push(n);
      return acc;
    }

    const from = i - LOOKBEHIND;
    const to = i + LOOKAHEAD;
    if (from < 0 || to >= freqs.length) {
      return acc;
    }

    const window = freqs.slice(from, to);
    const currentMode = modeFast(window);
    if (acc[acc.length - 1] !== currentMode) {
      acc.push(currentMode);
    }
    return acc;
  }, []);
};

const makeArrayMatcher = (pattern: number[]) => (arr: number[]) => {
  if (pattern.length !== arr.length) {
    return false;
  }

  return arr.every((n, i) => n === pattern[i]);
};

const makePartialArrayMatcher = (pattern: number[]) => (arr: number[]) => {
  if (arr.length === 0) {
    return true;
  }

  return arr.every((n, i) => n === pattern[i]);
};

export const makeMatcher = (pattern: number[], trigger: () => void) => {
  const buffer = new Array(LOOKAHEAD + LOOKBEHIND).fill(-1);
  const isMatch = makeArrayMatcher(pattern);
  const isPartialMatch = makePartialArrayMatcher(pattern);
  let patternSoFar: number[] = [];

  return (frequency: number) => {
    buffer.push(frequency);
    buffer.shift();

    const nextEntry = modeFast(buffer);
    if (nextEntry !== patternSoFar[patternSoFar.length - 1]) {
      patternSoFar.push(nextEntry);
    }

    if (patternSoFar.length > pattern.length) {
      patternSoFar.shift();
    }

    if (isMatch(patternSoFar)) {
      console.info("MATCH 😅", "=>", pattern);
      patternSoFar = [];
      trigger();
      return true;
    }

    while (patternSoFar.length) {
      if (isPartialMatch(patternSoFar)) {
        return false;
      }

      if (patternSoFar.length > 1) {
        console.info(
          "no match",
          pattern.toString(),
          "!=",
          patternSoFar.toString()
        );
      }

      patternSoFar.shift();
    }

    return false;
  };
};
