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
