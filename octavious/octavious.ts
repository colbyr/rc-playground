import {
  combineLatestWith,
  from,
  map,
  mergeMap,
  Observable,
  share,
} from "rxjs";
import { FrequencyToNoteConverter, NoteName } from "./note";
import { DefaultReferencePitchHz, getFrequenciesByBin } from "./frequency";

export function findLoudest(sample: Uint8Array) {
  let loudestBinSoFar = -1;
  let loudestSoFar = 0;

  for (let i = 0; i <= sample.length; i++) {
    const loudness = sample[i];
    if (loudness > loudestSoFar) {
      loudestSoFar = loudness;
      loudestBinSoFar = i;
    }
    if (loudness === 255) {
      break;
    }
  }

  if (loudestSoFar === 0) {
    return null;
  }

  return { loudness: loudestSoFar, bin: loudestBinSoFar };
}

export type OctaviousOptions = {
  fftSize: number;
  referencePitchHz: number;
  smoothingConstant: number;
  cancelFrame: typeof cancelAnimationFrame;
  requestFrame: typeof requestAnimationFrame;
};

const DEFAULT_FFT_SIZE = Math.pow(2, 15);
const DEFAULT_SMOOTHING_CONSTANT = 0.8;

export type NoteDescriptor = {
  frequency: number;
  loudness: number;
  number: number;
  name: NoteName;
  octave: number;
  timestamp: number;
};

export function fromAudioSource(
  audioSource: AudioNode,
  {
    fftSize = DEFAULT_FFT_SIZE,
    referencePitchHz = DefaultReferencePitchHz,
    smoothingConstant = DEFAULT_SMOOTHING_CONSTANT,
    cancelFrame = cancelAnimationFrame,
    requestFrame = requestAnimationFrame,
  }: Partial<OctaviousOptions> = {}
): Observable<NoteDescriptor | null> {
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

  return new Observable((subscriber) => {
    const toNote = new FrequencyToNoteConverter(referencePitchHz);
    let nextFrameId: number;

    const run = () => {
      analyzer.getByteFrequencyData(analyserSample);

      const loudest = findLoudest(analyserSample);

      if (!loudest) {
        subscriber.next(null);
      } else {
        const currentFrequency = frequencyByBin[loudest.bin];
        subscriber.next({
          frequency: currentFrequency,
          loudness: loudest.loudness,
          number: toNote.number(currentFrequency),
          name: toNote.name(currentFrequency),
          octave: toNote.octave(currentFrequency),
          timestamp: Date.now(),
        });
      }

      nextFrameId = requestFrame(run);
    };

    run();

    return () => cancelFrame(nextFrameId);
  });
}

export function makeSampler(
  $frames: Observable<any>,
  $source: Observable<AudioNode>,
  makeAnalyser: (source: AudioNode) => [AnalyserNode, Uint8Array]
) {
  return $frames.pipe(
    combineLatestWith($source.pipe(map(makeAnalyser), share())),
    map(([_, [analyser, sample]]) => {
      analyser.getByteFrequencyData(sample);
      return sample;
    }),
    share()
  );
}

export function getMicrophoneStream(): Observable<MediaStream> {
  return new Observable<MediaStream>((subscribe) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((microphoneStream) => {
        subscribe.next(microphoneStream);
      })
      .finally(() => subscribe.complete());
  });
}

export function getMicrophoneSource(): Observable<MediaStreamAudioSourceNode> {
  return getMicrophoneStream().pipe(
    map((micStream) => {
      console.info("get mic source");
      const audioContext = new AudioContext({
        latencyHint: "interactive",
      });

      const source = audioContext.createMediaStreamSource(micStream);
      Observable;
      return source;
    }),
    share()
  );
}

export function fromMicrophone(opts?: Partial<OctaviousOptions>) {
  return getMicrophoneSource().pipe(
    mergeMap((source) => fromAudioSource(source, opts))
  );
}
