import gsap from "gsap";

export function initializeTeam(
  root: HTMLElement,
  motion: { pause: () => void; resume: () => void },
) {
  const panel = root.querySelector<HTMLElement>(".abt-team__main-img");
  if (!panel) return () => {};
  const inner = panel.querySelector<HTMLElement>(".abt-team__main-img-inner")!;
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>(".abt-team__main-item"),
  );
  const photos = Array.from(
    panel.querySelectorAll<HTMLElement>(".abt-team__main-img-item"),
  );
  const closeButton = panel.querySelector<HTMLElement>(
    ".abt-team__main-img-close",
  )!;
  const controller = new AbortController();
  const listeners = { signal: controller.signal };
  const compact = matchMedia("(max-width: 991px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let trigger: HTMLElement | null = null;
  let hovered: number | null = null;
  let focused: number | null = null;
  let pointer: { x: number; y: number } | null = null;
  let inertSiblings: { element: HTMLElement; inert: boolean }[] = [];
  let position = { x: 0, y: 0 };
  let open = false;
  panel.id = "ck-team-profile";
  closeButton.setAttribute("role", "button");
  closeButton.setAttribute("aria-label", "Close team profile");
  closeButton.tabIndex = 0;

  const showPhoto = () => {
    photos.forEach((photo, index) => {
      const active = !compact.matches && index === (focused ?? hovered);
      photo.classList.toggle("active", active);
      photo.setAttribute("aria-hidden", String(!active));
    });
  };
  const close = (restoreFocus = true) => {
    if (!open) return;
    open = false;
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    photos.forEach((photo) => {
      photo.classList.remove("selected");
      photo.setAttribute("aria-hidden", "true");
    });
    inertSiblings.forEach(({ element, inert }) => {
      element.inert = inert;
    });
    inertSiblings = [];
    root.querySelector(".wrapper")?.classList.remove("ck-dialog-open");
    trigger?.setAttribute("aria-expanded", "false");
    motion.resume();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  };
  const setMode = () => {
    close();
    hovered = focused = null;
    pointer = null;
    position = { x: 0, y: 0 };
    photos.forEach((photo) => {
      photo.style.removeProperty("transform");
    });
    panel.inert = true;
    panel.setAttribute("aria-hidden", String(compact.matches));
    if (compact.matches) {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
    } else {
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
    }
    rows.forEach((row) => {
      const name = row.querySelector<HTMLElement>(".abt-team__main-item-name")!;
      if (compact.matches) {
        name.setAttribute("aria-haspopup", "dialog");
        name.setAttribute("aria-controls", panel.id);
        name.setAttribute("aria-expanded", "false");
      } else {
        name.removeAttribute("aria-haspopup");
        name.removeAttribute("aria-controls");
        name.removeAttribute("aria-expanded");
      }
    });
    showPhoto();
  };
  rows.forEach((row, index) => {
    const name = row.querySelector<HTMLElement>(".abt-team__main-item-name")!;
    name.tabIndex = 0;
    name.setAttribute("role", "button");
    photos[index]
      ?.querySelector("img")
      ?.setAttribute("alt", name.textContent?.trim() ?? "Team member");
    row.addEventListener(
      "mouseenter",
      () => {
        hovered = index;
        showPhoto();
      },
      listeners,
    );
    row.addEventListener(
      "mouseleave",
      () => {
        hovered = null;
        showPhoto();
      },
      listeners,
    );
    row.addEventListener(
      "focusin",
      () => {
        focused = index;
        showPhoto();
      },
      listeners,
    );
    row.addEventListener(
      "focusout",
      (event) => {
        if (
          event.relatedTarget instanceof Node &&
          row.contains(event.relatedTarget)
        )
          return;
        focused = null;
        showPhoto();
      },
      listeners,
    );
    row.addEventListener(
      "click",
      (event) => {
        if (!compact.matches || (event.target as Element).closest("a")) return;
        event.preventDefault();
        event.stopPropagation();
        close(false);
        trigger = name;
        open = true;
        const displayName = name.textContent?.trim() ?? "Team member";
        panel.querySelector(".abt-team__main-img-name")!.textContent =
          displayName;
        panel.querySelector(".abt-team__main-img-job")!.textContent =
          row.querySelector(".abt-team__main-item-job")!.textContent;
        const social = panel.querySelector<HTMLAnchorElement>(
          ".abt-team__main-img-icon",
        )!;
        social.setAttribute(
          "href",
          row
            .querySelector(".abt-team__main-item-icon")
            ?.getAttribute("href") ?? "#",
        );
        social.target = "_blank";
        social.rel = "noopener noreferrer";
        social.setAttribute("aria-label", `${displayName} on LinkedIn`);
        panel.setAttribute("aria-label", `${displayName} — team profile`);
        photos.forEach((photo, i) => {
          photo.classList.toggle("selected", i === index);
          photo.setAttribute("aria-hidden", String(i !== index));
        });
        let branch: HTMLElement = panel;
        while (branch !== root && branch.parentElement) {
          Array.from(branch.parentElement.children).forEach((sibling) => {
            if (sibling !== branch && sibling instanceof HTMLElement) {
              inertSiblings.push({ element: sibling, inert: sibling.inert });
              sibling.inert = true;
            }
          });
          branch = branch.parentElement;
        }
        panel.inert = false;
        panel.setAttribute("aria-hidden", "false");
        panel.classList.add("active");
        name.setAttribute("aria-expanded", "true");
        root.querySelector(".wrapper")?.classList.add("ck-dialog-open");
        motion.pause();
        if (!reduced)
          gsap.fromTo(
            inner,
            { y: 5 },
            { y: 0, duration: 0.3, clearProps: "transform" },
          );
        closeButton.focus({ preventScroll: true });
      },
      listeners,
    );
  });
  closeButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      close();
    },
    listeners,
  );
  panel.addEventListener(
    "click",
    (event) => {
      if (event.target === panel) close();
    },
    listeners,
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      } else if (event.key === "Tab") {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>('a[href], [tabindex="0"]'),
        ).filter(
          (item) =>
            item.getClientRects().length &&
            getComputedStyle(item).visibility !== "hidden",
        );
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    },
    { ...listeners, capture: true },
  );
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
    },
    listeners,
  );
  const followPointer = () => {
    if (compact.matches || reduced || !pointer || hovered === null) return;
    const rect = inner.getBoundingClientRect();
    const x = (pointer.x / innerWidth - 0.5) * 2 * rect.width * 0.2;
    const y = pointer.y - rect.top - 0.1 * rect.height;
    const factor = 1 - Math.pow(0.99, gsap.ticker.deltaRatio());
    position.x += (x - position.x) * factor;
    position.y += (y - position.y) * factor;
    gsap.set(photos, { x: position.x, y: position.y });
  };
  gsap.ticker.add(followPointer);
  compact.addEventListener("change", setMode, listeners);
  setMode();
  return () => {
    close(false);
    controller.abort();
    gsap.ticker.remove(followPointer);
    gsap.killTweensOf(inner);
    gsap.killTweensOf(photos);
    inner.style.removeProperty("transform");
    photos.forEach((photo) => photo.style.removeProperty("transform"));
  };
}
