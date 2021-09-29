import { processFile } from "./index";
import path from "path";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  makeRelativeMelodyMatcher,
} from "../octavious";

const freqByBin = getFrequenciesByBin(44100, 512 / 2);
const toNote = new FrequencyToNoteConverter(441);

const processor = ({ amplitudeSpectrum, energy, spectralSpread }) => {
  if (spectralSpread > 25) {
    return null;
  }
  const { bin } = findLoudest(amplitudeSpectrum);
  const freq = freqByBin[bin];
  return toNote.number(freq);
};

const testFiles = [
  ["nothing.wav", true],
  ["podcast.wav", false],
  ["podcast-whistle.wav", true],
  ["whistle.wav", true],
] as [string, boolean][];

testFiles.forEach(([fileName, shouldMatch]) => {
  test(fileName, () => {
    const trigger = jest.fn();
    const matcher = makeRelativeMelodyMatcher({
      pattern: ["c", "e", "g"],
      trigger,
    });

    const result = processFile(processor, path.join(__dirname, fileName));

    result.forEach((n) => matcher(n));

    if (shouldMatch) {
      expect(trigger).toHaveBeenCalled();
    } else {
      expect(trigger).not.toHaveBeenCalled();
    }
  });
});
