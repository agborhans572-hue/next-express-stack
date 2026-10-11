import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initializeSupporters(root: HTMLElement, lenis: Lenis) {
  const section = root.querySelector<HTMLElement>(".home-part");
  const container = section?.querySelector<HTMLElement>(".container");
  if (!section || !container) return () => {};

  const sizeTiles = () => {
    const style = getComputedStyle(container);
    const width =
      container.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const columns = matchMedia("(max-width: 767px)").matches
      ? 3
      : matchMedia("(max-width: 991px)").matches
        ? 5
        : 6;
    section.style.setProperty("--ck-supporter-width", `${width / columns}px`);
  };
  sizeTiles();
  const resize = new ResizeObserver(sizeTiles);
  resize.observe(container);

  const media = gsap.matchMedia(root);
  media.add(
    {
      phone: "(max-width: 767px)",
      tablet: "(min-width: 768px) and (max-width: 991px)",
      desktop: "(min-width: 992px)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      sizeTiles();
      if (context.conditions?.reduced) return;
      const phone = Boolean(context.conditions?.phone);
      const duration = phone ? 20 : context.conditions?.tablet ? 30 : 40;
      const options = {
        scroller: phone
          ? root.querySelector<HTMLElement>(".wrapper")!
          : undefined,
        start: "top 65%",
        once: true,
      };
      const copies: HTMLElement[] = [];
      const rows = Array.from(
        section.querySelectorAll<HTMLElement>(".home-part__marquee-wrapper"),
      );
      rows.forEach((row) => {
        const original = row.firstElementChild as HTMLElement;
        const copy = original.cloneNode(true) as HTMLElement;
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        row.append(copy);
        copies.push(copy);
      });

      const label = SplitText.create(
        section.querySelector(".home-part__label"),
        {
          type: "chars,words",
        },
      );
      const titleElement =
        section.querySelector<HTMLElement>(".home-part__title")!;
      const accessibleTitle = titleElement.innerText
        .replace(/\s+/g, " ")
        .trim();
      const title = SplitText.create(titleElement, { type: "words" });
      // SplitText's textContent label omits the space between the two <br> lines.
      titleElement.setAttribute("aria-label", accessibleTitle);
      gsap
        .timeline({
          defaults: { ease: "power2.out", duration: 0.4 },
          scrollTrigger: {
            ...options,
            trigger: section.querySelector(".home-part__head"),
          },
          onComplete: () => {
            label.revert();
            title.revert();
          },
        })
        .from(label.chars, { yPercent: 60, autoAlpha: 0, stagger: 0.02 })
        .from(
          title.words,
          { yPercent: 60, autoAlpha: 0, stagger: 0.02 },
          "<0.2",
        )
        .from(
          section.querySelector(".home-part__btn"),
          { yPercent: 60, autoAlpha: 0 },
          "<0.2",
        );

      const loop = gsap.timeline({ repeat: -1, paused: true });
      loop
        .to(rows[0].children, { xPercent: -100, duration, ease: "none" }, 0)
        .to(rows[1].children, { xPercent: 100, duration, ease: "none" }, 0)
        // Start far into the loop so upward scrolling can reverse through its seam.
        .totalTime(duration * 1000, true);
      ScrollTrigger.create({
        ...options,
        trigger: section,
        start: "top bottom",
        onEnter: () => {
          loop.play();
        },
      });
      const removeScroll = lenis.on("scroll", (scroll) => {
        gsap.to(loop, {
          timeScale:
            (scroll.direction >= 0 ? 1 : -1) *
            Math.min(Math.max(scroll.velocity / 2, 1), 4),
          duration: 0.1,
          ease: "none",
          overwrite: true,
        });
      });

      const logos = gsap.timeline({
        scrollTrigger: {
          ...options,
          trigger: section.querySelector(".home-part__main-supporters"),
        },
      });
      rows.forEach((row) => {
        logos.from(
          row.querySelectorAll(".home-part__main-item"),
          {
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.04,
            clearProps: "opacity,visibility",
          },
          0,
        );
      });
      gsap.from(section.querySelector(".home-part__investor-title"), {
        yPercent: 60,
        autoAlpha: 0,
        duration: 0.4,
        ease: "none",
        clearProps: "transform,opacity,visibility",
        scrollTrigger: {
          ...options,
          trigger: section.querySelector(".home-part__investor"),
        },
      });
      gsap.from(
        section.querySelectorAll(
          ".home-part__main-investors .home-part__main-item",
        ),
        {
          yPercent: 25,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.04,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: {
            ...options,
            trigger: section.querySelector(".home-part__main-investors"),
          },
        },
      );

      return () => {
        removeScroll();
        gsap.killTweensOf(loop);
        if (label.isSplit) label.revert();
        if (title.isSplit) title.revert();
        copies.forEach((copy) => copy.remove());
      };
    },
  );
  return () => {
    resize.disconnect();
    media.revert();
    section.style.removeProperty("--ck-supporter-width");
  };
}
