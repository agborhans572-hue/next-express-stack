import { useRef, useCallback, useMemo, type ReactNode } from "react";

interface MagneticElementProps {
  children: ReactNode;
  /** Pull strength — fraction of the distance to cursor (0–1) */
  strength?: number;
  className?: string;
}

/**
 * Wraps any element with a magnetic cursor effect.
 * The element softly tracks the cursor while hovered,
 * then springs back with an overshoot when the cursor leaves.
 *
 * On touch/mobile devices the magnetic effect is skipped entirely
 * to avoid interfering with scroll and to eliminate the will-change
 * compositor layer cost on low-end GPUs.
 */
export function MagneticElement({
  children,
  strength = 0.38,
  className,
}: MagneticElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect touch/hover-incapable devices once at mount time
  const isTouch = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches,
    [],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouch) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });
    },
    [strength, isTouch],
  );

  const onMouseEnter = useCallback(() => {
    if (isTouch) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (ref.current) ref.current.style.transition = "none";
  }, [isTouch]);

  const onMouseLeave = useCallback(() => {
    if (isTouch) return;
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(rafId.current);
    el.style.transition = "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.transform = "translate(0px, 0px)";
    resetTimer.current = setTimeout(() => {
      if (ref.current) ref.current.style.transition = "";
    }, 580);
  }, [isTouch]);

  return (
    <div
      ref={ref}
      className={className}
      // Only set will-change on pointer devices — on mobile it wastes GPU memory
      style={
        isTouch
          ? { display: "inline-block" }
          : { willChange: "transform", display: "inline-block" }
      }
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
