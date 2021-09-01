import { entries } from "lodash";
import React, { HTMLAttributes, useEffect, useMemo, useRef } from "react";
import { Observable } from "rxjs";

export type ObservableCanvasDrawProp<T> = (opts: {
  context: CanvasRenderingContext2D;
  rect: DOMRect;
  value: T;
}) => void;

type PropTypes<T> = {
  $value: Observable<T>;
  draw: ObservableCanvasDrawProp<T>;
};

export function ObservableCanvas<I = number>({
  draw,
  $value,
  ...props
}: PropTypes<I> & HTMLAttributes<HTMLCanvasElement>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const resize = new ResizeObserver(([canvasEntry]) => {
      const { width, height } = canvasEntry.contentRect;
      const canvasElement = canvasEntry.target as HTMLCanvasElement;
      canvasElement.width = width;
      canvasElement.height = height;
    });
    resize.observe(canvasElement);
    return () => resize.disconnect();
  }, [canvasRef]);

  useEffect(
    () => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }
      const context = canvasElement.getContext("2d")!;
      const subscription = $value.subscribe({
        next: (value) => {
          draw({ value, context, rect: canvasElement.getBoundingClientRect() });
        },
        error: (error) => {
          console.error("ObservableCanvas", error);
          subscription.unsubscribe();
        },
      });
      return () => subscription.unsubscribe();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [$value]
  );

  return <canvas {...props} ref={canvasRef} />;
}
