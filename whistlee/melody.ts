import { modeFast } from "simple-statistics";

const LOOKAHEAD = 32;
const LOOKBEHIND = 8;

export const getMelodyShape = (freqs: number[]) => {
  if (freqs.length < 2) {
    return freqs;
  }

  return freqs.reduce((acc: number[], n, i) => {
    if (acc.length === 0) {
      acc.push(n);
      return acc;
    }

    const from = Math.max(0, i - LOOKBEHIND);
    const to = Math.min(freqs.length, i + LOOKAHEAD);
    const window = freqs.slice(from, to);
    const currentMode = modeFast(window);
    if (acc[acc.length - 1] !== currentMode) {
      acc.push(currentMode);
    }
    return acc;
  }, []);
};
