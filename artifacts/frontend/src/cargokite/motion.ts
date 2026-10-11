import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initializeMap } from "./map";
import type { CargoKitePage } from "./CargoKite";

gsap.registerPlugin(ScrollTrigger);

export function initializeMotion(root: HTMLElement, page: CargoKitePage) {
  const wrapper = root.querySelector<HTMLElement>(".wrapper")!;
  const mobile = matchMedia("(max-width: 767px)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroller = mobile ? wrapper : window;
  const lenis = new Lenis({
    wrapper: scroller,
    content: wrapper,
    autoRaf: true,
    smoothWheel: !reduced,
    syncTouch: false,
    anchors: false,
  });
  lenis.on("scroll", ScrollTrigger.update);
  const header = root.querySelector<HTMLElement>(".header")!;
  const getY = () => (mobile ? wrapper.scrollTop : window.scrollY);
  const onScroll = () => {
    const y = getY();
    header.classList.toggle("on-scroll", y > 90);
    const dark = Array.from(
      root.querySelectorAll<HTMLElement>("[data-logo-main=dark]"),
    ).some((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top < 70 && rect.bottom > 70;
    });
    header.classList.toggle(
      "dark-mode",
      dark || (page === "home" && y < innerHeight * 0.7),
    );
  };
  scroller.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const options = { scroller: mobile ? wrapper : undefined };
  const context = gsap.context(() => {
    if (!reduced) {
      const heading = root.querySelector(".main h1");
      if (heading)
        gsap.from(heading, {
          opacity: 0,
          y: 35,
          duration: 0.9,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
      const hero = root.querySelector(".home-hero__wrap");
      if (hero && !mobile)
        gsap.to(".home-hero__bg-wrap-inner", {
          yPercent: 22,
          scale: 1.12,
          ease: "none",
          scrollTrigger: {
            ...options,
            trigger: hero,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      const fleet = root.querySelector(".home-shift__main");
      if (fleet) {
        const bigText = root.querySelector(".home-shift__main-part--big-txt");
        const smallText = root.querySelector(
          ".home-shift__main-part--small-txt",
        );
        gsap.set(smallText, { autoAlpha: 0 });
        const tl = gsap.timeline({
          scrollTrigger: {
            ...options,
            trigger: fleet,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
        tl.to(bigText, { autoAlpha: 0, duration: 0.8 }, 0.8)
          .to(
            ".home-shift__main-part--big-ship .home-shift__img-wrap",
            { x: () => -innerWidth * 2.5, duration: 3, ease: "none" },
            0.5,
          )
          .to(smallText, { autoAlpha: 1, duration: 0.6 }, 3)
          .to(smallText, { autoAlpha: 0, duration: 0.6 }, 4)
          .to(
            ".home-shift__main-part--small-ship .home-shift__img-wrap",
            { x: () => -innerWidth * 3.8, duration: 3, ease: "none" },
            4,
          );
      }
      const shipImages = root.querySelectorAll(".home-tech__ship-img");
      if (shipImages.length === 2)
        gsap.fromTo(
          shipImages[1],
          { opacity: 0 },
          {
            opacity: 1,
            scrollTrigger: {
              ...options,
              trigger: ".home-tech",
              start: "top 30%",
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
      const milestones = root.querySelector<HTMLElement>(
        ".abt-mil__main-inner",
      );
      if (milestones) {
        gsap.to(milestones, {
          y: () => -milestones.scrollHeight + innerHeight * 0.65,
          ease: "none",
          scrollTrigger: {
            ...options,
            trigger: ".abt-mil",
            pin: ".abt-mil__wrap",
            start: "top top",
            end: () => `+=${milestones.scrollHeight}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        gsap.to(".abt-mil__progress-dot", {
          y: "18rem",
          ease: "none",
          scrollTrigger: {
            ...options,
            trigger: ".abt-mil",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });
      }
      if (root.querySelector(".tech-vid")) {
        gsap.to(".tech-vid__main-inner", {
          width: "100%",
          marginRight: 0,
          ease: "none",
          scrollTrigger: {
            ...options,
            trigger: ".tech-vid",
            start: "top 70%",
            end: "top 10%",
            scrub: true,
          },
        });
      }
    }
    const demo = root.querySelector<HTMLElement>(".tech-demo__main-outer");
    if (demo) {
      root.dataset.vesselProgress = "0";
      root.dataset.vesselPhase = "0";
    }
    if (demo && !reduced) {
      const items = Array.from(
        root.querySelectorAll<HTMLElement>(".tech-demo__main-item"),
      );
      ScrollTrigger.create({
        ...options,
        trigger: demo,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          root.dataset.vesselProgress = String(self.progress);
          const stage = Math.min(
            items.length - 1,
            Math.floor(self.progress * items.length),
          );
          root.dataset.vesselPhase = String(stage);
          items.forEach((item, i) => {
            item.classList.toggle("active", i === stage);
            if (!mobile)
              item.style.transform = `translateY(${-stage * innerHeight}px)`;
          });
        },
      });
      items[0]?.classList.add("active");
    }
    // Section reveal stays subtle; all content is visible with reduced motion.
    if (!reduced)
      root
        .querySelectorAll<HTMLElement>(
          ".home-intro__label,.home-prob__item,.home-why__item,.home-part__logo",
        )
        .forEach((item) => {
          gsap.from(item, {
            y: 25,
            opacity: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              ...options,
              trigger: item,
              start: "top 95%",
              once: true,
            },
          });
        });
  }, root);
  let disposed = false;
  const map = initializeMap(root, mobile);
  let refreshFrame = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => {
      lenis.resize();
      ScrollTrigger.refresh();
      map.refresh();
    });
  };
  // Images and fonts can change scroll distances after the initial render.
  root
    .querySelectorAll("img")
    .forEach((image) => image.addEventListener("load", refresh));
  void document.fonts.ready.then(() => {
    if (!disposed) refresh();
  });
  window.addEventListener("resize", refresh);
  const transition = document.createElement("div");
  transition.className = "ck-transition";
  transition.setAttribute("aria-hidden", "true");
  transition.innerHTML = "<div></div>".repeat(5);
  document.body.append(transition);
  if (!reduced) {
    gsap.set(transition.children, { scaleY: 1, transformOrigin: "top" });
    gsap.to(transition.children, {
      scaleY: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: "power2.inOut",
    });
  }
  const scrollTo = (hash: string, immediate = false) => {
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    let target = document.getElementById(id);
    if (target && !root.contains(target)) target = null;
    if (hash === "#job" && target?.classList.contains("hidden"))
      target = root.querySelector(".abt-team");
    if (target)
      requestAnimationFrame(() =>
        lenis.scrollTo(target!, {
          offset: -65,
          immediate: immediate || reduced,
          force: true,
        }),
      );
  };
  refresh();
  return {
    scrollTo,
    refresh,
    pause: () => lenis.stop(),
    resume: () => lenis.start(),
    gallery: (button: HTMLElement) => {
      const gallery = root.querySelector<HTMLElement>(
        ".abt-info__swiper .swiper-wrapper",
      );
      if (!gallery) return;
      const slides = gallery.children.length;
      const current = Number(gallery.dataset.slide ?? 0);
      const next =
        (current + (button.className.includes("left") ? -1 : 1) + slides) %
        slides;
      gallery.dataset.slide = String(next);
      gsap.to(gallery, { yPercent: -100 * next, duration: reduced ? 0 : 0.6 });
    },
    transition: (complete: () => void) => {
      if (reduced) {
        complete();
        return;
      }
      gsap.killTweensOf(transition.children);
      gsap.set(transition.children, { transformOrigin: "bottom" });
      gsap.to(transition.children, {
        scaleY: 1,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.inOut",
        onComplete: complete,
      });
    },
    destroy: () => {
      disposed = true;
      map.destroy();
      root
        .querySelectorAll<HTMLElement>(".tech-demo__main-item")
        .forEach((item) => {
          item.style.removeProperty("transform");
          item.classList.remove("active");
        });
      context.revert();
      gsap.killTweensOf(transition.children);
      transition.remove();
      lenis.destroy();
      cancelAnimationFrame(refreshFrame);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", refresh);
      root
        .querySelectorAll("img")
        .forEach((image) => image.removeEventListener("load", refresh));
      window.scrollTo(0, 0);
    },
  };
}
