import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { MotionConfig } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowUpRight, Mail, Menu, X } from "lucide-react";
import { subscribeNewsletter, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import CookieConsent from "./CookieConsent";
import { accountLinks, footerGroups, shippingLinks } from "./navigation";
import "./content/reference.css";
import "./replica.css";
import "./tools.css";

gsap.registerPlugin(ScrollTrigger);
const navLinks = [
  ["Home", "/"],
  ["About", "/about"],
  ["Technology", "/tech"],
  ["Services", "/services"],
  ["News & Media", "/news"],
  ...shippingLinks,
] as const;

function ToolFooter() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const pending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return (
    <footer className="tool-footer">
      <div className="tool-footer-grid" data-reveal>
        <section className="tool-newsletter">
          <Mail size={56} strokeWidth={1} aria-hidden="true" />
          <h2>
            Subscribe to
            <br />
            Newsletters
          </h2>
          <p>
            Want to stay up to date?
            <br />
            Sign up for Shiprion’s biannual update.
          </p>
          <form
            aria-busy={busy}
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending.current || subscribed) return;
              const form = event.currentTarget;
              const email = String(new FormData(form).get("email") ?? "")
                .trim()
                .toLowerCase();
              pending.current = true;
              setBusy(true);
              setStatus("Sending…");
              controller.current = new AbortController();
              try {
                const result = await subscribeNewsletter(
                  { email },
                  { signal: controller.current.signal },
                );
                if (!result.subscribed)
                  throw new Error("Subscription did not complete.");
                setSubscribed(true);
                setStatus(
                  "Thank you! You’re subscribed to Shiprion’s newsletter.",
                );
              } catch (error) {
                if (controller.current.signal.aborted) return;
                setStatus(
                  error instanceof ApiError && error.status === 429
                    ? "Too many attempts. Please try again later."
                    : "We couldn’t send this right now. Please try again. Your details have been kept.",
                );
              } finally {
                pending.current = false;
                if (!controller.current.signal.aborted) setBusy(false);
              }
            }}
          >
            <input
              aria-label="Email address for newsletter"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="Enter your email"
              autoComplete="email"
            />
            <button type="submit" disabled={busy || subscribed}>
              {subscribed ? "Subscribed" : busy ? "Sending…" : "Subscribe"}
              <ArrowUpRight size={20} />
            </button>
            <p role="status" aria-live="polite">
              {status}
            </p>
          </form>
          <small>Don’t worry about spam. We hate it too!</small>
        </section>
        <div className="tool-footer-main">
          <div className="tool-footer-links">
            {footerGroups.map(({ title, links }) => (
              <div key={title}>
                <h3>{title}</h3>
                {links.map(([label, href]) => (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="tool-footer-contact">
            <div>
              <h3>Main Office</h3>
              <p>
                Shiprion
                <br />
                123 Logistics Way
                <br />
                New York, NY 10001
                <br />
                United States
              </p>
            </div>
            <div>
              <small>Email</small>
              <a href="mailto:support@shiprion.com">support@shiprion.com</a>
              <small>Phone</small>
              <a href="tel:+18007948374">+1 (800) 794-8374</a>
            </div>
          </div>
          <div className="tool-footer-bottom">
            <span>© {new Date().getFullYear()} Shiprion</span>
            <a href="/contact">Contact Shiprion ↗</a>
          </div>
        </div>
      </div>
      <a
        className="tool-marquee"
        href="/contact"
        aria-label="Get in touch with Shiprion"
      >
        <span>Get in touch. ↗ Get in touch. ↗&nbsp;</span>
        <span aria-hidden="true">Get in touch. ↗ Get in touch. ↗&nbsp;</span>
      </a>
    </footer>
  );
}

export default function ToolLayout({
  children,
  page,
}: {
  children: ReactNode;
  page: "track" | "calculator" | "contact";
}) {
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const motion = useRef<{
    transition: (complete: () => void) => void;
    pause: () => void;
    resume: () => void;
  } | null>(null);

  useLayoutEffect(() => {
    const element = root.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.add("shiprion-tools-document");
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: !reduced,
      syncTouch: false,
      anchors: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const onScroll = () => setCollapsed(window.scrollY > 90);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const transition = element.querySelector<HTMLElement>(".tool-transition")!;
    const context = gsap.context(() => {
      if (reduced) return;
      gsap.from(".tool-hero h1", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "all",
      });
      element.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => {
        gsap.from(item, {
          y: 32,
          opacity: 0,
          duration: 0.8,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: item, start: "top 95%", once: true },
        });
      });
      gsap.fromTo(
        transition.children,
        { scaleY: 1, transformOrigin: "top" },
        { scaleY: 0, duration: 0.5, stagger: 0.06, ease: "power2.inOut" },
      );
    }, element);
    motion.current = {
      pause: () => lenis.stop(),
      resume: () => lenis.start(),
      transition: (complete) => {
        if (reduced) return complete();
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
    };
    const refresh = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(content.current!);
    void document.fonts.ready.then(() => {
      if (element.isConnected) refresh();
    });
    return () => {
      observer.disconnect();
      context.revert();
      gsap.killTweensOf(transition.children);
      lenis.destroy();
      motion.current = null;
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("shiprion-tools-document");
      window.scrollTo(0, 0);
    };
  }, []);

  useLayoutEffect(() => {
    menu.current!.inert = !open;
    content.current!.inert = open;
    if (open) {
      motion.current?.pause();
      toggle.current?.focus();
    } else motion.current?.resume();
  }, [open]);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`shiprion-tools tool-page-${page}`}
        ref={root}
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
            "a[href]",
          );
          if (
            !link ||
            event.defaultPrevented ||
            event.button ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            link.target ||
            link.hasAttribute("download")
          )
            return;
          const href = link.getAttribute("href")!;
          if (!href.startsWith("/") || href.startsWith("//")) return;
          event.preventDefault();
          setOpen(false);
          motion.current?.transition(() => navigate(href));
        }}
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
          if (event.key !== "Tab") return;
          const items = [
            toggle.current!,
            ...Array.from(
              menu.current!.querySelectorAll<HTMLElement>("a[href]"),
            ),
          ];
          if (event.shiftKey && document.activeElement === items[0]) {
            event.preventDefault();
            items.at(-1)?.focus();
          } else if (
            !event.shiftKey &&
            document.activeElement === items.at(-1)
          ) {
            event.preventDefault();
            items[0].focus();
          }
        }}
      >
        <Helmet>
          <link
            rel="icon"
            type="image/svg+xml"
            href="/shiprion/brand-icon.svg"
          />
        </Helmet>
        <header
          className={`tool-header${collapsed ? " is-collapsed" : ""}${open ? " is-open" : ""}`}
        >
          <a className="tool-brand" href="/" aria-label="Shiprion home">
            <img src="/shiprion/brand-icon.svg" width={36} height={36} alt="" />
            <span>Shiprion</span>
          </a>
          <nav className="tool-desktop-nav" aria-label="Main navigation">
            {navLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                aria-current={href === `/${page}` ? "page" : undefined}
              >
                {label}.
              </a>
            ))}
          </nav>
          <nav className="tool-account-links" aria-label="Account navigation">
            {user ? (
              <a
                className="tool-signup-link"
                href={user.role === "customer" ? "/dashboard" : "/admin"}
              >
                My dashboard
              </a>
            ) : (
              accountLinks.map(([label, href]) => (
                <a
                  key={href}
                  className={
                    label === "Sign up" ? "tool-signup-link" : undefined
                  }
                  href={href}
                >
                  {label}
                </a>
              ))
            )}
          </nav>
          <a className="tool-contact-link" href="/contact">
            Get in touch
          </a>
          <button
            className="tool-menu-toggle"
            ref={toggle}
            aria-label={open ? "Close navigation" : "Toggle navigation"}
            aria-expanded={open}
            aria-controls="tool-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <nav
            ref={menu}
            id="tool-navigation"
            className="tool-menu"
            aria-label="Expanded navigation"
            aria-hidden={!open}
            data-lenis-prevent
          >
            {navLinks.map(([label, href]) => (
              <a key={href} href={href}>
                {label}.<ArrowUpRight />
              </a>
            ))}
            {user ? (
              <a href={user.role === "customer" ? "/dashboard" : "/admin"}>
                My dashboard.
                <ArrowUpRight />
              </a>
            ) : (
              accountLinks.map(([label, href]) => (
                <a key={href} href={href}>
                  {label}.<ArrowUpRight />
                </a>
              ))
            )}
            <a href="/about#job">
              Career.
              <ArrowUpRight />
            </a>
            <a href="/about#event">
              Event.
              <ArrowUpRight />
            </a>
            <a className="tool-menu-contact" href="/contact">
              Get in touch
              <ArrowUpRight />
            </a>
          </nav>
        </header>
        <div className="wrapper" ref={content}>
          <main>{children}</main>
          <ToolFooter />
        </div>
        <div className="tool-transition" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} />
          ))}
        </div>
        <div className="shiprion-root tool-cookie">
          <CookieConsent onContact={() => navigate("/contact")} />
        </div>
      </div>
    </MotionConfig>
  );
}

export function ToolHero({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="tool-hero">
      <div className="tool-shell">
        <p className="tool-eyebrow">
          {label}
          <span>Shiprion / Global Logistics</span>
        </p>
        <div className="tool-hero-grid">
          <h1>{title}</h1>
          <div className="tool-hero-copy">
            <ArrowUpRight className="tool-hero-arrow" strokeWidth={1} />
            <p>{description}</p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
