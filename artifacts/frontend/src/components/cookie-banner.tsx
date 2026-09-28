import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "cookieChoice";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = window.setTimeout(() => {
      try {
        const choice = window.localStorage.getItem(COOKIE_KEY);
        if (!choice) setVisible(true);
      } catch {
        setVisible(false);
      }
    }, 10000);
    return () => window.clearTimeout(timer);
  }, []);

  const saveChoice = (choice: "accepted" | "rejected") => {
    try {
      window.localStorage.setItem(COOKIE_KEY, choice);
    } finally {
      setVisible(false);
    }
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center px-0 sm:px-2 pointer-events-none animate-cookie-fade-in">
      <div className="pointer-events-auto w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-[#0a0f1a]/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-olive-500/10 via-transparent to-blue-500/10" />
          <div className="relative flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-olive-500/15 border border-olive-500/20 text-olive-400">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    We use cookies
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-olive-500/20 bg-olive-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-400">
                    <ShieldCheck className="h-3 w-3" /> Privacy
                  </span>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-400">
                  We use cookies to improve your experience, keep you signed in,
                  and understand how Shiprion is used. You can accept all
                  cookies or reject non-essential ones.
                </p>
                <Link
                  href="/cookies"
                  className="inline-flex text-xs font-medium text-olive-400 transition-colors hover:text-olive-300"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08] hover:text-white"
                onClick={() => saveChoice("rejected")}
              >
                Reject
              </Button>
              <Button
                type="button"
                className="bg-olive-500 text-white hover:bg-olive-400 glow-olive-sm"
                onClick={() => saveChoice("accepted")}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
