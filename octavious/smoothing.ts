import { modeFast } from "simple-statistics";

export const makeRollingMode = <I>({
  defaultValue,
  bufferSize,
}: {
  defaultValue: I;
  bufferSize: number;
}) => {
  const buffer = new Array<I>(bufferSize).fill(defaultValue);
  return function rollingMode(item: I): I {
    buffer.push(item);
    buffer.shift();
    return modeFast(buffer);
  };
};
