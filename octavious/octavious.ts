import { range } from "lodash";
import { first, flatMap, from, map, Observable } from "rxjs";
import { modeFast } from "simple-statistics";
import { NoteNames } from "./notes";

type OctaviousOptions = {
  bufferSize: number;
  fftSize: number;
  minLoudness: number;
  referencePitchHz: number;
  smoothingConstant: number;
};

const DEFAULT_BUFFER_SIZE = 1;
const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_MIN_LOUDNESS = 64;
const DEFAULT_REFERENCE_PITCH = 441;
const DEFAULT_SMOOTHING_CONSTANT = 0.8;

const makeSmoother = (bufferSize: number) => {
  const buffer = new Array(bufferSize).fill(-1);
  return (frequency: number) => {
    buffer.push(frequency);
    buffer.shift();
    return modeFast(buffer);
  };
};

type NoteDescriptor = {
  frequency: number;
  num: number;
  name: string;
  octave: number;
};

export function fromAudioSource(
  audioSource: AudioNode,
  {
    bufferSize = DEFAULT_BUFFER_SIZE,
    fftSize = DEFAULT_FFT_SIZE,
    minLoudness = DEFAULT_MIN_LOUDNESS,
    referencePitchHz = DEFAULT_REFERENCE_PITCH,
    smoothingConstant = DEFAULT_SMOOTHING_CONSTANT,
  }: Partial<OctaviousOptions> = {}
): Observable<NoteDescriptor> {
  const analyzer = audioSource.context.createAnalyser();
  analyzer.fftSize = fftSize;
  analyzer.smoothingTimeConstant = smoothingConstant;
  audioSource.connect(analyzer);

  const freqSampleRateHz = audioSource.context.sampleRate;
  const freqCount = analyzer.frequencyBinCount;
  const freqMaxHz = freqSampleRateHz / 2;
  const freqStepHz = freqMaxHz / freqCount;
  const freqRange = range(0, freqCount).map(
    (n) => n * freqStepHz + freqStepHz / 2
  );
  const c0Hz = referencePitchHz * Math.pow(2, -4.75);
  const analyserSample = new Uint8Array(freqCount);
  const smoothFreq = makeSmoother(bufferSize);

  return new Observable((subscriber) => {
    console.info({
      freqRange,
    });

    console.table([
      {
        freqSampleRateHz,
        freqCount,
        freqMaxHz,
        freqStepHz,
      },
    ]);

    let nextFrameId: number;

    const run = () => {
      analyzer.getByteFrequencyData(analyserSample);

      const loudestBin = analyserSample.reduce(
        (loudestBinSoFar: number, loudness, i, sample) => {
          if (loudness > minLoudness && loudness > sample[loudestBinSoFar]) {
            return i;
          }
          return loudestBinSoFar;
        },
        0
      );

      const frequency = freqRange[loudestBin];
      const noteNumber = smoothFreq(
        Math.round(12 * Math.log2(frequency / c0Hz))
      );

      if (frequency && noteNumber > 0) {
        const octave = Math.floor(noteNumber / 12);
        const noteI = noteNumber % 12;
        const noteName = NoteNames[noteI];
        subscriber.next({ frequency, num: noteNumber, name: noteName, octave });
      }

      nextFrameId = requestAnimationFrame(run);
    };

    run();

    return () => cancelAnimationFrame(nextFrameId);
  });
}

export function fromMicrophone() {
  return new Observable<MediaStream>((subscribe) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((microphoneStream) => {
        subscribe.next(microphoneStream);
      })
      .finally(() => subscribe.complete());
  }).pipe(
    flatMap((micStream) => {
      const audioContext = new AudioContext({
        latencyHint: "interactive",
      });

      const source: MediaStreamAudioSourceNode =
        audioContext.createMediaStreamSource(micStream);
      return fromAudioSource(source);
    })
  );
}
