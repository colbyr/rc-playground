import { bufferSize, processFile } from "../whistlee-meyda/backend";
import path from "path";
import {
  findLoudest,
  FrequencyToNoteConverter,
  getFrequenciesByBin,
  makeRelativeMelodyMatcher,
  makeRollingMode,
  NoteName,
} from "../octavious";
import { plot } from "nodeplotlib";

const maxSpread = 120;
const sampleRate = 44100;

const freqByBin = getFrequenciesByBin(sampleRate, bufferSize / 2);
const toNote = new FrequencyToNoteConverter(441);

const processor = ({
  amplitudeSpectrum,
  spectralSpread,
}: {
  amplitudeSpectrum: Float32Array;
  spectralSpread: number;
}) => {
  if (spectralSpread > maxSpread) {
    return null;
  }
  const loudest = findLoudest(amplitudeSpectrum);
  if (!loudest) {
    return null;
  }
  const { bin } = loudest;
  const freq = freqByBin[bin];
  return toNote.number(freq);
};

const testFiles = [
  // ["nothing.wav", false],
  // ["podcast.wav", false],
  // ["podcast-whistle.wav", true],
  ["02-whistle-on-success.wav", true],
  // ["whistle.wav", true],
  // ["05-tone-on-success.wav", true],
] as [string, boolean][];

testFiles.forEach(([fileName, shouldMatch]) => {
  test(fileName, () => {
    const trigger = jest.fn();
    const smoothNoteNumber = makeRollingMode<null | number>({
      defaultValue: null,
      bufferSize: 32,
    });
    const pattern = ["c", "e", "g"] as NoteName[];
    const matcher = makeRelativeMelodyMatcher({
      pattern,
      trigger,
    });

    const result = processFile(
      processor,
      path.join(__dirname, "audio", fileName)
    );

    const smoothedResult = result.map((n) => smoothNoteNumber(n));

    result.forEach((n) => matcher(n));
    const didTrigger = trigger.mock.calls.length > 0;

    if ((shouldMatch && !didTrigger) || (!shouldMatch && didTrigger)) {
      plot(
        [
          {
            title: {
              text: "Notes",
            },
            y: result,
            type: "scatter",
          },
          {
            title: {
              text: "Smoothed Notes",
            },
            y: smoothedResult,
            type: "scatter",
          },
        ],
        {
          title: `${fileName} should${
            shouldMatch ? " " : " not "
          }match ${pattern.toString()} (FAILED)`,
          yaxis: {},
        }
      );
    }

    if (shouldMatch) {
      expect(trigger).toHaveBeenCalled();
    } else {
      expect(trigger).not.toHaveBeenCalled();
    }
  });
});
