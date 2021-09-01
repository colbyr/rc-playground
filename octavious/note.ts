import { DefaultReferencePitchHz } from "./frequency";

export const NoteNames = [
  "c", // 0
  "c♯", // 1
  "d",
  "d♯",
  "e",
  "f",
  "f♯",
  "g",
  "g♯",
  "a", // 9
  "a♯",
  "b",
];

export function noteNumberFromFrequency(
  referencePitchHz: number,
  frequencyHz: number
) {
  if (frequencyHz < 1) {
    return 0;
  }

  const c0Hz = referencePitchHz * Math.pow(2, -4.75);
  return Math.round(12 * Math.log2(frequencyHz / c0Hz));
}

export function noteNameFromFrequency(noteNumber: number) {
  const noteI = noteNumber % 12;
  return NoteNames[noteI];
}

export class FrequencyToNoteConverter {
  private _refHz: number;
  private _numberByFreq = new Map();

  get referenceFrequencyHz() {
    return this._refHz;
  }

  constructor(referenceFrequencyHz: number) {
    this._refHz = referenceFrequencyHz;
  }

  private _getNumberMemo = (frequencyHz: number) => {
    if (!this._numberByFreq.has(frequencyHz)) {
      this._numberByFreq.set(
        frequencyHz,
        noteNumberFromFrequency(this._refHz, frequencyHz)
      );
    }
    return this._numberByFreq.get(frequencyHz)!;
  };

  name(frequencyHz: number) {
    const noteNumber = this._getNumberMemo(frequencyHz);
    const noteI = noteNumber % 12;
    return NoteNames[noteI];
  }

  number(frequencyHz: number) {
    return this._getNumberMemo(frequencyHz);
  }

  octave(frequencyHz: number) {
    const noteNumber = this._getNumberMemo(frequencyHz);
    return Math.floor(noteNumber / 12);
  }
}
