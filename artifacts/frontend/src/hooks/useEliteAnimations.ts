import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Elite-tier scroll animation system — 10 distinct reveal mechanics.
 * Apply CSS classes to DOM elements; this hook drives them all via GSAP ScrollTrigger.
 *
 * Class reference:
 *  1. .gsap-clip-wipe          – diagonal clip-path wipe left→right
 *  2. .gsap-cascade (parent)   – staggered cascade parent
 *     .gsap-cascade-item       – staggered cascade children (elastic easing)
 *  3. .gsap-blur-pop           – scale+blur punch-in  [data-delay="0.1"]
 *  4. .gsap-split-heading (parent) – parallax split heading
 *     .gsap-split-top / .gsap-split-bottom
 *  5. ScrambleText component   – character scramble (separate component)
 *  6. .gsap-draw-path          – SVG stroke self-draws on scrub
 *  7. .gsap-tilt-card          – 3D rotationX/Y on enter (desktop only)
 *  8. MagneticElement component – cursor magnetic (separate component)
 *  9. .gsap-scrub-counter      – counter ticks with scroll position
 *     [data-target] [data-decimals] [data-suffix] [data-prefix]
 * 10. .gsap-exit-section       – plays IN on enter, reverses on exit
 *
 * Mobile strategy: detect touch/small-screen devices and use lightweight
 * opacity+translateY alternatives. No blur, no 3D, no scrub on mobile.
 */
export function useEliteAnimations() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Detect devices where heavy animations cause jank
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const isTouch = window.matchMedia("(hover: none)").matches;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const simplify = isMobile || isTouch || prefersReduced;

      const ctx = gsap.context(() => {
        // ─── 1. CLIP-PATH DIAGONAL WIPE ──────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-clip-wipe").forEach((el) => {
          if (simplify) {
            gsap.fromTo(
              el,
              { opacity: 0, y: 24 },
              {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              },
            );
            return;
          }
          gsap.fromTo(
            el,
            { clipPath: "polygon(0 0, 0 0, 0% 100%, 0% 100%)" },
            {
              clipPath: "polygon(0 0, 110% 0, 110% 100%, 0 100%)",
              duration: 1.05,
              ease: "expo.out",
              scrollTrigger: {
                trigger: el,
                start: "top 84%",
                toggleActions: "play none none reverse",
              },
              onComplete() {
                gsap.set(el, { clipPath: "none" });
              },
            },
          );
        });

        // ─── 2. STAGGERED CASCADE ────────────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-cascade").forEach((parent) => {
          const items = gsap.utils.toArray<HTMLElement>(
            ".gsap-cascade-item",
            parent,
          );
          if (!items.length) return;

          if (simplify) {
            // Mobile: simple fade-up, no 3D transforms
            gsap.fromTo(
              items,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                stagger: { each: 0.08 },
                duration: 0.65,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: parent,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              },
            );
            return;
          }

          gsap.fromTo(
            items,
            {
              opacity: 0,
              y: 85,
              scale: 0.86,
              rotationX: 16,
              transformPerspective: 900,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotationX: 0,
              stagger: { each: 0.11, ease: "power2.inOut" },
              duration: 0.95,
              ease: "back.out(1.55)",
              scrollTrigger: {
                trigger: parent,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
              onComplete() {
                gsap.set(items, {
                  clearProps: "rotationX,transformPerspective",
                });
              },
            },
          );
        });

        // ─── 3. SCALE + BLUR POP ─────────────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-blur-pop").forEach((el) => {
          const delay = parseFloat(el.dataset.delay || "0");

          if (simplify) {
            // Mobile: no blur (too expensive), simple scale fade-up
            gsap.fromTo(
              el,
              { opacity: 0, y: 28, scale: 0.96 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.6,
                delay: Math.min(delay, 0.1), // cap mobile stagger delay
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  toggleActions: "play none none reverse",
                },
              },
            );
            return;
          }

          gsap.fromTo(
            el,
            { scale: 0.62, filter: "blur(18px)", opacity: 0, y: 22 },
            {
              scale: 1,
              filter: "blur(0px)",
              opacity: 1,
              y: 0,
              duration: 0.88,
              delay,
              ease: "power4.out",
              scrollTrigger: {
                trigger: el,
                start: "top 87%",
                toggleActions: "play none none reverse",
              },
              onComplete() {
                gsap.set(el, { filter: "none" });
              },
            },
          );
        });

        // ─── 4. PARALLAX SPLIT HEADING ───────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-split-heading").forEach((el) => {
          const top = el.querySelector<HTMLElement>(".gsap-split-top");
          const bot = el.querySelector<HTMLElement>(".gsap-split-bottom");
          if (!top || !bot) return;

          if (simplify) {
            gsap.fromTo(
              [top, bot],
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.65,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              },
            );
            return;
          }

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          });
          tl.fromTo(
            top,
            { y: -52, opacity: 0, clipPath: "inset(0 0 100% 0)" },
            {
              y: 0,
              opacity: 1,
              clipPath: "inset(0 0 0% 0)",
              duration: 1.0,
              ease: "expo.out",
            },
            0,
          ).fromTo(
            bot,
            { y: 52, opacity: 0, clipPath: "inset(100% 0 0 0)" },
            {
              y: 0,
              opacity: 1,
              clipPath: "inset(0% 0 0 0)",
              duration: 1.0,
              ease: "expo.out",
            },
            0,
          );
        });

        // ─── 6. SVG LINE DRAW ────────────────────────────────────────────
        gsap.utils
          .toArray<SVGGeometryElement>(".gsap-draw-path")
          .forEach((path) => {
            let length = 800;
            try {
              length = path.getTotalLength();
            } catch {}
            gsap.set(path, {
              strokeDasharray: length,
              strokeDashoffset: length,
              opacity: 1,
            });

            if (simplify) {
              // Mobile: snap to drawn on enter, no scrub
              gsap.to(path, {
                strokeDashoffset: 0,
                duration: 0.9,
                ease: "power2.inOut",
                scrollTrigger: {
                  trigger: path,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              });
              return;
            }

            gsap.to(path, {
              strokeDashoffset: 0,
              ease: "power2.inOut",
              scrollTrigger: {
                trigger: path,
                start: "top 85%",
                end: "bottom 25%",
                scrub: 1.5,
              },
            });
          });

        // ─── 7. 3D PERSPECTIVE TILT ──────────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-tilt-card").forEach((el, i) => {
          if (simplify) {
            // Mobile: simple fade-up, no 3D rotation (avoids GPU compositing jank)
            gsap.fromTo(
              el,
              { opacity: 0, y: 32 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 90%",
                  toggleActions: "play none none reverse",
                },
              },
            );
            return;
          }

          const dir = i % 2 === 0 ? 1 : -1;
          gsap.fromTo(
            el,
            {
              rotationX: 20 * dir,
              rotationY: 15 * dir,
              transformPerspective: 1200,
              transformOrigin: "center center",
              opacity: 0,
              y: 65,
              scale: 0.92,
            },
            {
              rotationX: 0,
              rotationY: 0,
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1.15,
              ease: "expo.out",
              scrollTrigger: {
                trigger: el,
                start: "top 86%",
                toggleActions: "play none none reverse",
              },
              onComplete() {
                gsap.set(el, {
                  clearProps:
                    "rotationX,rotationY,transformPerspective,transformOrigin",
                });
              },
            },
          );
        });

        // ─── 9. SCROLL-SCRUBBED COUNTER ──────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-scrub-counter").forEach((el) => {
          const target = parseFloat(el.dataset.target || "0");
          const decimals = parseInt(el.dataset.decimals || "0");
          const suffix = el.dataset.suffix || "";
          const prefix = el.dataset.prefix || "";
          const obj = { val: 0 };
          el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;

          if (simplify) {
            // Mobile: snap-count on enter (no scrub competing with scroll)
            gsap.to(obj, {
              val: target,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none reverse",
              },
              onUpdate() {
                el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
              },
              onReverseComplete() {
                obj.val = 0;
                el.textContent = `${prefix}${(0).toFixed(decimals)}${suffix}`;
              },
            });
            return;
          }

          gsap.to(obj, {
            val: target,
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              end: "top 20%",
              scrub: 1.2,
            },
            onUpdate() {
              el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
            },
          });
        });

        // ─── 10. EXIT ANIMATIONS ─────────────────────────────────────────
        gsap.utils.toArray<HTMLElement>(".gsap-exit-section").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: simplify ? 24 : 52 },
            {
              opacity: 1,
              y: 0,
              duration: simplify ? 0.6 : 0.92,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 86%",
                end: "bottom 6%",
                toggleActions: "play none none reverse",
              },
            },
          );
        });
      });

      return () => ctx.revert();
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, []);
}
