import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import {
  subscribeNewsletter,
  submitContact,
  ApiError,
} from "@workspace/api-client-react";
import { initializeMotion } from "./motion";
import { initializeTeam } from "./team";
import CookieConsent from "./CookieConsent";
import home from "./content/home.html?raw";
import about from "./content/about.html?raw";
import tech from "./content/tech.html?raw";
import news from "./content/news.html?raw";
import privacy from "./content/privacy.html?raw";
import legal from "./content/legal.html?raw";
import "./content/reference.css";
import "./replica.css";

const Vessel = lazy(() => import("./Vessel"));
const templates = { home, about, tech, news, privacy, legal };
export type ShiprionPage = keyof typeof templates;
const titles: Record<ShiprionPage, string> = {
  home: "Shiprion — Wind-powered shipping",
  about: "About us — Shiprion",
  tech: "Technology — Shiprion",
  news: "News & Media — Shiprion",
  privacy: "Privacy policy — Shiprion",
  legal: "Legal notice — Shiprion",
};

export default function Shiprion({ page }: { page: ShiprionPage }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [modelHost, setModelHost] = useState<HTMLElement | null>(null);
  const [heroHost, setHeroHost] = useState<HTMLElement | null>(null);
  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width: 767px)").matches,
  );
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const markup = useMemo(
    () => (
      <div
        ref={rootRef}
        className={`shiprion-root ck-page-${page}`}
        dangerouslySetInnerHTML={{ __html: templates[page] }}
      />
    ),
    [page],
  );
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const controller = new AbortController();
    document.documentElement.classList.add("shiprion-document");
    document.body.classList.add("shiprion-document");
    const wrapper = root.querySelector<HTMLElement>(".wrapper")!;
    const header = root.querySelector<HTMLElement>(".header")!;
    const main = root.querySelector<HTMLElement>(".main")!;
    const footer = root.querySelector<HTMLElement>("footer")!;
    const pageContent = [main, footer, header].filter(
      (element): element is HTMLElement => Boolean(element),
    );
    const motion = initializeMotion(root, page);
    const destroyTeam = initializeTeam(root, motion);
    let activeDialog: HTMLElement | null = null;
    let returnFocus: HTMLElement | null = null;
    let activeDetail: HTMLElement | null = null;
    let detailTrigger: HTMLElement | null = null;
    const pending = new Set<HTMLFormElement>();
    const listeners = { signal: controller.signal };
    root
      .querySelectorAll<HTMLElement>(".popup__main-submit-inner-success")
      .forEach((element) => {
        element.inert = true;
      });
    const focusable = (element: HTMLElement) =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), input:not([type="hidden"]), textarea, [tabindex="0"]',
        ),
      ).filter(
        (item) => item.getClientRects().length && !item.closest(".hidden"),
      );
    const closeDetail = () => {
      if (!activeDetail) return;
      activeDetail.classList.remove("active");
      activeDetail.setAttribute("aria-hidden", "true");
      activeDetail.inert = true;
      activeDetail = null;
      detailTrigger?.setAttribute("aria-expanded", "false");
      detailTrigger?.focus({ preventScroll: true });
    };
    const closeDialog = () => {
      if (!activeDialog) return;
      activeDialog.classList.remove("active");
      activeDialog.setAttribute("aria-hidden", "true");
      activeDialog.inert = true;
      activeDialog = null;
      pageContent.forEach((element) => {
        element.inert = false;
      });
      wrapper.classList.remove("ck-dialog-open");
      motion.resume();
      returnFocus?.focus({ preventScroll: true });
    };
    const openDialog = (name: string, trigger: HTMLElement) => {
      const popup = root.querySelector<HTMLElement>(`.${name}.popup`);
      if (!popup) return;
      closeDetail();
      closeDialog();
      returnFocus = trigger.closest(".header__nav")
        ? header.querySelector<HTMLElement>(".header__toggle")
        : trigger;
      activeDialog = popup;
      header.classList.remove("open-nav");
      header.querySelector<HTMLElement>(".header__nav")!.inert = true;
      header
        .querySelector(".header__toggle")!
        .setAttribute("aria-expanded", "false");
      popup.inert = false;
      popup.classList.add("active");
      popup.setAttribute("aria-hidden", "false");
      pageContent.forEach((element) => {
        element.inert = true;
      });
      wrapper.classList.add("ck-dialog-open");
      motion.pause();
      (focusable(popup)[0] ?? popup).focus({ preventScroll: true });
    };

    // Make the original semantic markup accessible without changing its layout.
    root
      .querySelectorAll<HTMLElement>(".faq-item__head")
      .forEach((head, index) => {
        head.setAttribute("role", "button");
        head.setAttribute("aria-expanded", "false");
        const body = head.nextElementSibling!;
        body.id = `ck-faq-${index}`;
        head.setAttribute("aria-controls", body.id);
      });
    const nav = root.querySelector<HTMLElement>(".header__nav")!;
    nav.inert = true;
    nav.id = "ck-navigation";
    const toggle = root.querySelector<HTMLElement>(".header__toggle")!;
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    root
      .querySelectorAll<HTMLElement>(".tech-demo__popup-item")
      .forEach((item, index) => {
        item.id = `ck-tech-detail-${index}`;
        item.setAttribute("role", "dialog");
        item.setAttribute("aria-modal", "false");
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
        item.setAttribute(
          "aria-label",
          item
            .querySelector(".tech-demo__popup-item-title")
            ?.textContent?.trim() ?? "Technology details",
        );
        item.inert = true;
        const trigger = root.querySelectorAll<HTMLElement>(
          ".tech-demo__main-item-toggle",
        )[index];
        trigger?.setAttribute("aria-controls", item.id);
        trigger?.setAttribute("aria-expanded", "false");
      });
    const mediaErrors = new WeakMap<HTMLVideoElement, () => void>();
    const playback = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (
            entry.isIntersecting &&
            !matchMedia("(prefers-reduced-motion: reduce)").matches &&
            !video.error
          )
            void video.play().catch((error: DOMException) => {
              if (error.name !== "AbortError") mediaErrors.get(video)?.();
            });
          else video.pause();
        });
      },
      { root: mobile ? wrapper : null, threshold: 0.01 },
    );
    root.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      video.muted = video.hasAttribute("muted");
      video.playsInline = true;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.autoplay = false;
        video.pause();
      } else if (video.autoplay) {
        video.pause();
        playback.observe(video);
      }
      const unavailable = () => {
        video.classList.add("ck-media-unavailable");
        const section = video.closest<HTMLElement>(".tech-vid");
        if (section) {
          section.classList.remove("ck-playing");
          if (!section.querySelector(".ck-video-status")) {
            const status = document.createElement("p");
            status.className = "ck-video-status txt txt-14";
            status.setAttribute("role", "status");
            status.textContent =
              "Video is unavailable. Please try again later.";
            section.querySelector(".container")?.append(status);
          }
        }
      };
      video.addEventListener("error", unavailable, listeners);
      video
        .querySelectorAll("source")
        .forEach((source) =>
          source.addEventListener("error", unavailable, listeners),
        );
      mediaErrors.set(video, unavailable);
      if (
        video.error ||
        video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      )
        unavailable();
    });
    const articles = Array.from(
      root.querySelectorAll<HTMLElement>(".news-hero__main-item"),
    );
    const logos = Array.from(
      root.querySelectorAll<HTMLElement>(".news-hero__logo-ex-item"),
    );
    const defaultLogo = root.querySelector<HTMLElement>(
      ".news-hero__logo-default",
    );
    articles.forEach((article, index) => {
      const show = () => {
        logos.forEach((logo, i) =>
          logo.classList.toggle("active", i === index),
        );
        if (defaultLogo) defaultLogo.style.opacity = "0";
      };
      const hide = () => {
        logos.forEach((logo) => logo.classList.remove("active"));
        if (defaultLogo) defaultLogo.style.opacity = "1";
      };
      article.addEventListener("mouseenter", show, listeners);
      article.addEventListener("mouseleave", hide, listeners);
      article.addEventListener("focus", show, listeners);
      article.addEventListener("blur", hide, listeners);
    });
    setModelHost(root.querySelector<HTMLElement>(".tech-demo__canvas-inner"));
    setHeroHost(root.querySelector<HTMLElement>(".home-hero__canvas"));
    root
      .querySelectorAll(
        ".tech-demo__canvas-inner > canvas, .home-hero__canvas > canvas",
      )
      .forEach((canvas) => canvas.remove());

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(
        "a,button,.popup__overlay",
      );
      if (!target || !root.contains(target)) return;
      if (target.dataset.popup) {
        event.preventDefault();
        if (target.dataset.popup === "close") closeDialog();
        else openDialog(target.dataset.popup, target);
        return;
      }
      if (target.classList.contains("popup__overlay")) {
        closeDialog();
        return;
      }
      if (target.classList.contains("header__toggle")) {
        event.preventDefault();
        const open = header.classList.toggle("open-nav");
        nav.inert = !open;
        toggle.setAttribute("aria-expanded", String(open));
        if (open) {
          motion.pause();
          focusable(nav)[0]?.focus();
        } else motion.resume();
        return;
      }
      if (target.classList.contains("faq-item__head")) {
        event.preventDefault();
        const open = target.parentElement!.classList.toggle("active");
        target.setAttribute("aria-expanded", String(open));
        motion.refresh();
        return;
      }
      if (target.classList.contains("news-hero__load-btn")) {
        event.preventDefault();
        const hidden = Array.from(
          root.querySelectorAll<HTMLElement>(".news-hero__main-item.hidden"),
        );
        hidden.slice(0, 3).forEach((item) => item.classList.remove("hidden"));
        if (hidden.length <= 3) target.classList.add("hidden");
        motion.refresh();
        return;
      }
      if (target.classList.contains("tech-vid__play-btn")) {
        event.preventDefault();
        const section = target.closest<HTMLElement>(".tech-vid")!;
        const video = section.querySelector<HTMLVideoElement>(
          ".tech-vid__main-vid video",
        )!;
        section.classList.add("ck-playing");
        video.classList.remove("ck-media-unavailable");
        if (video.error) video.load();
        video.controls = true;
        if (video.paused)
          void video.play().catch(() => {
            video.classList.add("ck-media-unavailable");
            section.classList.remove("ck-playing");
          });
        else video.pause();
        return;
      }
      const detail = target.closest<HTMLElement>(
        ".tech-demo__main-item-toggle",
      );
      if (detail) {
        event.preventDefault();
        closeDetail();
        const index = Array.from(
          root.querySelectorAll(".tech-demo__main-item-toggle"),
        ).indexOf(detail);
        activeDetail = root.querySelectorAll<HTMLElement>(
          ".tech-demo__popup-item",
        )[index];
        detailTrigger = detail;
        if (activeDetail) {
          activeDetail.classList.add("active");
          activeDetail.inert = false;
          activeDetail.setAttribute("aria-hidden", "false");
          detail.setAttribute("aria-expanded", "true");
          activeDetail.focus({ preventScroll: true });
        }
        return;
      }
      if (target.classList.contains("tech-demo__popup-close")) {
        event.preventDefault();
        closeDetail();
        return;
      }
      if (target.matches(".swiper-nav-btn")) {
        event.preventDefault();
        motion.gallery(target);
        return;
      }
      const href = target.getAttribute("href");
      if (
        !href ||
        target.getAttribute("target") === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (href.startsWith("#")) {
        event.preventDefault();
        if (href.length > 1) {
          history.replaceState(null, "", href);
          motion.scrollTo(href);
        }
        return;
      }
      if (href.startsWith("/") && !href.startsWith("//")) {
        event.preventDefault();
        nav.inert = true;
        motion.transition(() => navigate(href));
      }
    };
    root.addEventListener("click", onClick, listeners);
    document.addEventListener(
      "keydown",
      (event) => {
        const target = event.target as HTMLElement;
        if (
          (event.key === " " || event.key === "Enter") &&
          target.getAttribute("role") === "button"
        ) {
          event.preventDefault();
          target.click();
        }
        if (event.key === "Escape") {
          const menuWasOpen = header.classList.contains("open-nav");
          closeDetail();
          closeDialog();
          header.classList.remove("open-nav");
          nav.inert = true;
          toggle.setAttribute("aria-expanded", "false");
          if (menuWasOpen) toggle.focus({ preventScroll: true });
          motion.resume();
        }
        const focusRoot =
          activeDialog ??
          activeDetail ??
          (header.classList.contains("open-nav") ? header : null);
        if (event.key === "Tab" && focusRoot) {
          const items = focusable(focusRoot);
          const first = items[0],
            last = items[items.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === focusRoot)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      },
      listeners,
    );
    root.addEventListener(
      "submit",
      async (event) => {
        const form = event.target as HTMLFormElement;
        const kind = form.dataset.ckForm;
        if (!kind) return;
        event.preventDefault();
        if (
          pending.has(form) ||
          form.dataset.submitted ||
          !form.reportValidity()
        )
          return;
        const values = new FormData(form);
        if (values.get("blablabla")) return;
        pending.add(form);
        const button = form.querySelector<HTMLButtonElement>(
          'button[type="submit"],button',
        )!;
        button.disabled = true;
        form.setAttribute("aria-busy", "true");
        let status = form.querySelector<HTMLElement>(".ck-form-status");
        if (!status) {
          status = document.createElement("p");
          status.className = "ck-form-status txt txt-16";
          status.setAttribute("role", "status");
          status.setAttribute("aria-live", "polite");
          form.append(status);
        }
        status.textContent = "Sending…";
        try {
          const email = String(values.get("email") ?? "")
            .trim()
            .toLowerCase();
          if (kind === "newsletter") {
            const result = await subscribeNewsletter(
              { email },
              { signal: controller.signal },
            );
            if (!result.subscribed)
              throw new Error("Subscription did not complete.");
            form.dataset.submitted = "true";
            status.textContent =
              "Thank you! You’re subscribed to Shiprion’s newsletter.";
            button.textContent = "Subscribed";
          } else {
            const name = String(values.get("name") ?? "").trim();
            const message = String(values.get("message") ?? "").trim();
            await submitContact(
              {
                name,
                email,
                message:
                  kind === "study"
                    ? `[Shiprion custom study enquiry]\n${message}`
                    : message,
              },
              { signal: controller.signal },
            );
            form.dataset.submitted = "true";
            form
              .querySelector(".popup__main-form-inner")
              ?.classList.add("hidden");
            form
              .querySelector(".popup__main-form-success")
              ?.classList.remove("hidden");
            const thankName =
              form.querySelector<HTMLElement>("[data-form-name]");
            if (thankName) thankName.textContent = name;
            button.classList.add("success");
            button.type = "button";
            button.dataset.popup = "close";
            button.setAttribute("aria-label", "Close the modal");
            button.disabled = false;
            button.focus();
            status.textContent = "";
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          status.textContent =
            error instanceof ApiError && error.status === 429
              ? "Too many attempts. Please try again later."
              : "We couldn’t send this right now. Please try again. Your details have been kept.";
        } finally {
          pending.delete(form);
          form.removeAttribute("aria-busy");
          if (!form.dataset.submitted) button.disabled = false;
        }
      },
      listeners,
    );
    const followHash = () => {
      if (location.hash === "#study")
        openDialog(
          "download",
          header.querySelector<HTMLElement>(".header__btn")!,
        );
      else if (location.hash) motion.scrollTo(location.hash, true);
    };
    window.addEventListener("hashchange", followHash, listeners);
    followHash();
    return () => {
      closeDetail();
      closeDialog();
      destroyTeam();
      controller.abort();
      playback.disconnect();
      root
        .querySelectorAll<HTMLVideoElement>("video")
        .forEach((video) => video.pause());
      header.classList.remove("open-nav");
      motion.destroy();
      document.documentElement.classList.remove("shiprion-document");
      document.body.classList.remove("shiprion-document");
    };
  }, [page, navigate, mobile, reduced]);

  return (
    <>
      <Helmet>
        <title>{titles[page]}</title>
        <link rel="icon" type="image/svg+xml" href="/shiprion/brand-icon.svg" />
        <meta
          name="description"
          content="Shiprion is developing small, autonomous, wind-powered cargo ships for sustainable and economically viable commercial shipping."
        />
        <meta property="og:title" content={titles[page]} />
        <meta name="twitter:title" content={titles[page]} />
        <link
          rel="canonical"
          href={`https://www.shiprion.com${page === "home" ? "/" : page === "tech" ? "/tech" : `/${page}`}`}
        />
      </Helmet>
      {markup}
      <div className="shiprion-root">
        <CookieConsent
          onContact={() =>
            rootRef.current?.querySelector<HTMLElement>(".header__btn")?.click()
          }
        />
      </div>
      {modelHost &&
        page === "tech" &&
        createPortal(
          <Suspense fallback={null}>
            <Vessel mode="technology" />
          </Suspense>,
          modelHost,
        )}
      {heroHost &&
        page === "home" &&
        createPortal(
          <Suspense fallback={null}>
            <Vessel mode="hero" />
          </Suspense>,
          heroHost,
        )}
    </>
  );
}
