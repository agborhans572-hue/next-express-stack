import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Truck,
  PlaneTakeoff,
  LogIn,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "News", href: "/news" },
  { label: "Track Order", href: "/track" },
];

export function PublicNavbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const ctaHref = user ? "/dashboard" : "/login?tab=register";
  const CtaIcon = user ? LayoutDashboard : LogIn;
  const ctaLabel = user ? "Dashboard" : "Get Started";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm"
          : "bg-white border-b border-gray-100"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-gray-900 shrink-0"
          data-testid="nav-logo"
        >
          <div
            className="relative flex items-center justify-center rounded-xl shrink-0 glow-olive-sm"
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #9CA763 0%, #7a8750 100%)",
            }}
          >
            <Truck
              style={{
                position: "absolute",
                bottom: 5,
                left: 4,
                width: 18,
                height: 18,
                color: "#fff",
              }}
            />
            <PlaneTakeoff
              style={{
                position: "absolute",
                top: 4,
                right: 3,
                width: 11,
                height: 11,
                color: "rgba(255,255,255,0.85)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background:
                  "linear-gradient(135deg, transparent 52%, rgba(255,255,255,0.08) 52%)",
              }}
            />
          </div>
          ShipRion<span className="text-olive-500">.</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? location === "/"
                : location.startsWith(link.href.split("#")[0]) &&
                  link.href.split("#")[0] !== "/";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-olive-600 bg-olive-500/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
                data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href="/calculator"
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                location.startsWith("/calculator")
                  ? "text-olive-600 bg-olive-500/10"
                  : "text-olive-500 hover:text-olive-600 hover:bg-olive-500/10"
              }`}
              data-testid="nav-link-request-quote"
            >
              Request Quote
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <Link
              href="/login"
              className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              Sign In
            </Link>
          )}
          <Link href={ctaHref} className="hidden md:flex">
            <Button
              size="sm"
              className="bg-olive-500 hover:bg-olive-400 text-white gap-1.5 glow-olive-sm"
              data-testid="nav-login-button"
            >
              <CtaIcon className="h-4 w-4" />
              {ctaLabel}
            </Button>
          </Link>

          <button
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? location === "/"
                : location.startsWith(link.href.split("#")[0]) &&
                  link.href.split("#")[0] !== "/";
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-olive-600 bg-olive-500/10"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href="/calculator"
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                location.startsWith("/calculator")
                  ? "text-olive-600 bg-olive-500/10"
                  : "text-olive-500 hover:text-olive-600 hover:bg-olive-500/10"
              }`}
            >
              Request Quote
            </Link>
          )}
          <div className="pt-2 border-t border-gray-200">
            <Link
              href={ctaHref}
              className="block"
              onClick={() => setMobileOpen(false)}
            >
              <Button
                size="sm"
                className="w-full bg-olive-500 hover:bg-olive-400 text-white gap-1.5"
              >
                <CtaIcon className="h-4 w-4" />
                {ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
