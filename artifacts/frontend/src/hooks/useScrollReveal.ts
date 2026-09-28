import { useEffect } from "react";

const SELECTOR = ".rv, .rv-left, .rv-right, .rv-scale, .rv-flip";

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" },
    );

    document.querySelectorAll(SELECTOR).forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}
