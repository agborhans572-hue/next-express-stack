import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Home-page specific GSAP animations.
 * New universal mechanics (blur-pop, tilt-card, cascade, etc.) are
 * handled by useEliteAnimations — call both from the Home component.
 *
 * Mobile strategy: scrub-based animations are disabled on touch/small-screen
 * devices; all other scroll reveals run on both mobile and desktop.
 */
export function useGSAPAnimations() {
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    const simplify = isMobile || isTouch;

    // Declare contexts outside timers so the cleanup can reach them.
    let heroCtx: gsap.Context | undefined;
    let ctx: gsap.Context | undefined;

    // ── HERO ENTRANCE TIMELINE ────────────────────────────────────────
    // Fires on the very next tick (0 ms) so the initial `from` states are
    // applied before the first visible paint — eliminates any opacity flash.
    // Runs on ALL devices (mobile + desktop).
    const heroTimer = setTimeout(() => {
      heroCtx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Step 1 — fade in the whole hero section
        tl.fromTo("#hero", { opacity: 0 }, { opacity: 1, duration: 0.35 });

        // Step 2 — badge label, then headline slides up from y:60
        tl.fromTo(
          ".gsap-hero-badge",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55 },
          "-=0.1",
        ).fromTo(
          ".gsap-hero-title",
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75 },
          "-=0.35",
        );

        // Step 3 — subtext with slight delay
        tl.fromTo(
          ".gsap-hero-sub",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65 },
          "-=0.45",
        );

        // Step 4 — CTA buttons staggered
        tl.fromTo(
          ".gsap-hero-cta > *",
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.14 },
          "-=0.42",
        );

        // Step 5 — right-side image / widget cards slide in from x:100
        tl.fromTo(
          ".gsap-hero-widgets",
          { x: 100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.72,
            stagger: 0.16,
            ease: "power3.out",
          },
          "-=0.48",
        );

        // Bottom social-proof badge
        tl.fromTo(
          ".gsap-hero-badge-bottom",
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.38",
        );
      });
    }, 0);

    // ── SCROLL ANIMATIONS ────────────────────────────────────────────
    // Fire after the DOM fully settles. All animations run on mobile too,
    // but scrub-based ones are replaced with lightweight one-shot versions.
    const scrollTimer = setTimeout(() => {
      ctx = gsap.context(() => {
        // ── SCROLL PROGRESS BAR (desktop only — scrub causes mobile jank) ─
        if (!simplify) {
          gsap.to("#gsap-progress-bar", {
            scaleX: 1,
            ease: "none",
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: "body",
              start: "top top",
              end: "bottom bottom",
              scrub: 0.15,
            },
          });
        }

        // ── ABOUT: clip-path wipe on images + slide text ─────────────────
        gsap.from(".gsap-about-text", {
          opacity: 0,
          x: simplify ? 0 : -56,
          y: simplify ? 20 : 0,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "#about",
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        });
        gsap.from(".gsap-about-images img", {
          clipPath: simplify ? undefined : "inset(110% 0 0 0 round 16px)",
          opacity: 0,
          y: 12,
          stagger: 0.16,
          duration: 0.75,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "#about",
            start: "top 68%",
            toggleActions: "play none none reverse",
          },
          onComplete() {
            gsap.set(".gsap-about-images img", { clearProps: "all" });
          },
        });

        // ── SERVICES heading ──────────────────────────────────────────────
        gsap.from(".gsap-services-heading", {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#services",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });

        // ── HOW IT WORKS: heading + connector ────────────────────────────
        gsap.from(".gsap-hiw-heading", {
          opacity: 0,
          y: 26,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#how-it-works",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
        gsap.from(".gsap-hiw-connector-bg", {
          scaleX: 0,
          transformOrigin: "left center",
          ease: "power2.inOut",
          duration: 1.4,
          scrollTrigger: {
            trigger: "#how-it-works",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });
        gsap.from(".gsap-hiw-footer", {
          opacity: 0,
          y: 18,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#how-it-works",
            start: "bottom 88%",
            toggleActions: "play none none reverse",
          },
        });

        // ── RATE ESTIMATOR ────────────────────────────────────────────────
        gsap.from(".gsap-rate-heading", {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#rate-estimator",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
        if (!simplify) {
          gsap.from(".gsap-rate-form", {
            clipPath: "inset(0 100% 0 0 round 16px)",
            opacity: 0,
            duration: 0.85,
            ease: "expo.out",
            scrollTrigger: {
              trigger: "#rate-estimator",
              start: "top 74%",
              toggleActions: "play none none reverse",
            },
            onComplete() {
              gsap.set(".gsap-rate-form", { clearProps: "clipPath,opacity" });
            },
          });
          gsap.from(".gsap-rate-image", {
            clipPath: "inset(0 0 0 100% round 16px)",
            opacity: 0,
            duration: 0.85,
            ease: "expo.out",
            scrollTrigger: {
              trigger: "#rate-estimator",
              start: "top 74%",
              toggleActions: "play none none reverse",
            },
            onComplete() {
              gsap.set(".gsap-rate-image", { clearProps: "clipPath,opacity" });
            },
          });
        } else {
          gsap.from([".gsap-rate-form", ".gsap-rate-image"], {
            opacity: 0,
            y: 24,
            duration: 0.65,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: "#rate-estimator",
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            onComplete() {
              gsap.set([".gsap-rate-form", ".gsap-rate-image"], {
                clearProps: "all",
              });
            },
          });
        }

        // ── TESTIMONIALS ──────────────────────────────────────────────────
        gsap.from(".gsap-testimonials-heading", {
          opacity: 0,
          y: 28,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#testimonials",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });

        gsap.from(".gsap-parallax-content", {
          opacity: 0,
          scale: simplify ? 1 : 0.94,
          y: 36,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: "#parallax-section",
            start: "top 72%",
            toggleActions: "play none none reverse",
          },
        });

        // ── MAP: pin header + stat pop ────────────────────────────────────
        gsap.from(".gsap-map-header", {
          opacity: 0,
          y: -28,
          duration: 0.8,
          ease: "back.out(1.6)",
          scrollTrigger: {
            trigger: "#map-section",
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        });
        // Map stat pop: scrub on desktop, snap on mobile
        if (!simplify) {
          gsap.from(".gsap-map-stat", {
            opacity: 0,
            scale: 0.7,
            y: 12,
            stagger: 0.1,
            duration: 0.6,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: "#map-section",
              start: "top 55%",
              end: "top 20%",
              scrub: 0.5,
            },
          });
        } else {
          gsap.from(".gsap-map-stat", {
            opacity: 0,
            y: 16,
            stagger: 0.08,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: "#map-section",
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          });
        }

        // ── STATS BAR: snap on mobile, scrub on desktop ───────────────────
        if (!simplify) {
          gsap.from(".gsap-stat", {
            opacity: 0,
            y: 36,
            scale: 0.85,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
              trigger: "#stats-bar",
              start: "top 88%",
              end: "top 45%",
              scrub: 0.8,
            },
          });
        } else {
          gsap.from(".gsap-stat", {
            opacity: 0,
            y: 20,
            stagger: 0.08,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: "#stats-bar",
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          });
        }

        // ── TRUSTED BY ────────────────────────────────────────────────────
        gsap.from(".gsap-trusted-heading", {
          opacity: 0,
          y: 18,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#trusted-by",
            start: "top 84%",
            toggleActions: "play none none reverse",
          },
        });

        // ── BLOG heading + CTA ────────────────────────────────────────────
        gsap.from(".gsap-blog-heading", {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#blog",
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
        gsap.from(".gsap-blog-cta", {
          opacity: 0,
          y: 18,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#blog",
            start: "bottom 90%",
            toggleActions: "play none none reverse",
          },
        });

        // ── FOOTER: fade up ───────────────────────────────────────────────
        gsap.from(".gsap-footer-inner", {
          opacity: 0,
          y: 32,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "footer",
            start: "top 93%",
            toggleActions: "play none none reverse",
          },
        });
      });
    }, 80);

    return () => {
      clearTimeout(heroTimer);
      clearTimeout(scrollTimer);
      heroCtx?.revert();
      ctx?.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);
}
