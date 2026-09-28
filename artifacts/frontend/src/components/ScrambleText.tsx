import { useRef, useEffect } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?";

interface ScrambleTextProps {
  text: string;
  className?: string;
  /** Milliseconds per frame — lower = faster scramble */
  speed?: number;
  /** How many scramble cycles per character before it resolves */
  cycles?: number;
  /** IntersectionObserver threshold to trigger (0-1) */
  threshold?: number;
  /** Whether to repeat on every intersection */
  once?: boolean;
}

/**
 * Characters randomise then resolve into real text when the element scrolls into view.
 * Uses IntersectionObserver — no external libraries.
 */
export function ScrambleText({
  text,
  className,
  speed = 36,
  cycles = 8,
  threshold = 0.35,
  once = true,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const observed = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (once && observed.current) return;
        observed.current = true;
        if (once) observer.disconnect();
        startScramble(el, text, speed, cycles);
      },
      { threshold },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, cycles, threshold, once]);

  function startScramble(
    el: HTMLSpanElement,
    target: string,
    spd: number,
    cyc: number,
  ) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const totalFrames = target.length * cyc;
    let frame = 0;
    intervalRef.current = setInterval(() => {
      const resolved = Math.floor(frame / cyc);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (i < resolved) {
          out += target[i];
        } else if (target[i] === " ") {
          out += " ";
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      el.textContent = out;
      frame++;
      if (frame > totalFrames) {
        clearInterval(intervalRef.current!);
        el.textContent = target;
      }
    }, spd);
  }

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
