import { mergeMap, Observable } from "rxjs";
import { FrequencyToNoteConverter } from "./note";
import { DefaultReferencePitchHz, getFrequenciesByBin } from "./frequency";

export type OctaviousOptions = {
  bufferSize: number;
  fftSize: number;
  minLoudness: number;
  referencePitchHz: number;
  smoothingConstant: number;
};

const DEFAULT_BUFFER_SIZE = 1;
const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_MIN_LOUDNESS = 64;
const DEFAULT_SMOOTHING_CONSTANT = 0.8;

export type NoteDescriptor = {
  frequency: number;
  number: number;
  name: string;
  octave: number;
  timestamp: number;
};

export function fromAudioSource(
  audioSource: AudioNode,
  {
    bufferSize = DEFAULT_BUFFER_SIZE,
    fftSize = DEFAULT_FFT_SIZE,
    minLoudness = DEFAULT_MIN_LOUDNESS,
    referencePitchHz = DefaultReferencePitchHz,
    smoothingConstant = DEFAULT_SMOOTHING_CONSTANT,
  }: Partial<OctaviousOptions> = {}
): Observable<NoteDescriptor> {
  const analyzer = audioSource.context.createAnalyser();
  analyzer.fftSize = fftSize;
  analyzer.smoothingTimeConstant = smoothingConstant;
  audioSource.connect(analyzer);

  const frequencyBinCount = analyzer.frequencyBinCount;
  const frequencyByBin = getFrequenciesByBin(
    audioSource.context.sampleRate,
    analyzer.frequencyBinCount
  );
  const analyserSample = new Uint8Array(frequencyBinCount);
  // const smoothFrequency = makeRollingMode({ bufferSize, defaultValue: -1 });

  return new Observable((subscriber) => {
    const toNote = new FrequencyToNoteConverter(referencePitchHz);
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

      const currentFrequency = frequencyByBin[loudestBin];
      subscriber.next({
        frequency: currentFrequency,
        number: toNote.number(currentFrequency),
        name: toNote.name(currentFrequency),
        octave: toNote.octave(currentFrequency),
        timestamp: Date.now(),
      });

      nextFrameId = requestAnimationFrame(run);
    };

    run();

    return () => cancelAnimationFrame(nextFrameId);
  });
}

export function fromMicrophone(opts?: Partial<OctaviousOptions>) {
  return new Observable<MediaStream>((subscribe) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((microphoneStream) => {
        subscribe.next(microphoneStream);
      })
      .finally(() => subscribe.complete());
  }).pipe(
    mergeMap((micStream) => {
      const audioContext = new AudioContext({
        latencyHint: "interactive",
      });

      const source: MediaStreamAudioSourceNode =
        audioContext.createMediaStreamSource(micStream);
      return fromAudioSource(source, opts);
    })
  );
}
