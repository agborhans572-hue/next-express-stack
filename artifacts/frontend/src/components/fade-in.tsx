import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

/* ─── shared easing ─── */
const EASE = [0.22, 1, 0.36, 1] as const;
const EASE_SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;

/* ─────────────────────────── FadeIn ─────────────────────────── */
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  once?: boolean;
  blur?: boolean;
  distance?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
  blur = false,
  distance = 36,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-60px" });

  const axis =
    direction === "left" || direction === "right"
      ? "x"
      : direction === "none"
        ? null
        : "y";
  const sign = direction === "right" || direction === "down" ? -1 : 1;

  const initial: Record<string, number | string> = { opacity: 0 };
  if (axis) initial[axis] = sign * distance;
  if (blur) initial["filter"] = "blur(8px)";

  const animate: Record<string, number | string> = { opacity: 1 };
  if (axis) animate[axis] = 0;
  if (blur) animate["filter"] = "blur(0px)";

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{ duration, delay, ease: EASE }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── ScaleIn ─────────────────────────── */
interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  from?: number;
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.55,
  once = true,
  from = 0.88,
}: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: from }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: from }}
      transition={{ duration, delay, ease: EASE }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── SlideReveal (clip-path) ─────────────────────────── */
interface SlideRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function SlideReveal({
  children,
  className,
  delay = 0,
  duration = 0.7,
  once = true,
}: SlideRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
      animate={
        inView
          ? { clipPath: "inset(0 0% 0 0)", opacity: 1 }
          : { clipPath: "inset(0 100% 0 0)", opacity: 0 }
      }
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── CountUp ─────────────────────────── */
interface CountUpProps {
  end: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({
  end,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [current, setCurrent] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;

    const start = performance.now();
    const ms = duration * 1000;

    function frame(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ms, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * end);
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ─────────────────────────── StaggerList ─────────────────────────── */
export function StaggerList({
  children,
  className,
  stagger = 0.1,
  delayStart = 0,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayStart?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delayStart,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── StaggerItem ─────────────────────────── */
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "scale" | "left" | "right";
}

export function StaggerItem({
  children,
  className,
  variant = "up",
}: StaggerItemProps) {
  const variants = {
    up: {
      hidden: { opacity: 0, y: 28 },
      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.88 },
      show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
    },
    left: {
      hidden: { opacity: 0, x: -28 },
      show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
    },
    right: {
      hidden: { opacity: 0, x: 28 },
      show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
    },
  };

  return (
    <motion.div
      className={className}
      style={{ willChange: "transform, opacity" }}
      variants={variants[variant]}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── FloatIn (spring bounce) ─────────────────────────── */
interface FloatInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function FloatIn({
  children,
  className,
  delay = 0,
  once = true,
}: FloatInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50, scale: 0.92 }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 50, scale: 0.92 }
      }
      transition={{ ...EASE_SPRING, delay }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}
