import { cn } from "@/lib/utils";
import { LoadingDots } from "./loading-dots";

interface LoadingOverlayProps {
  text?: string;
  className?: string;
  variant?: "light" | "dark";
  "data-testid"?: string;
}

export function LoadingOverlay({
  text = "Loading",
  className,
  variant = "light",
  "data-testid": testId = "status-loading",
}: LoadingOverlayProps) {
  const isDark = variant === "dark";

  return (
    <div
      data-testid={testId}
      className={cn(
        "min-h-screen w-full flex items-center justify-center relative overflow-hidden",
        isDark ? "bg-[#111318]" : "bg-background",
        className,
      )}
    >
      {/* Animated background grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)"
            : "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glowing horizontal sweep lines */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px animate-glow-sweep"
            style={{
              top: `${30 + i * 20}%`,
              animationDelay: `${i * 0.7}s`,
              background: isDark
                ? "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.5) 50%, transparent 100%)"
                : "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)",
            }}
          />
        ))}
      </div>

      {/* Center card */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-6 px-10 py-8 rounded-2xl border",
          isDark
            ? "bg-white/[0.03] border-white/[0.07] backdrop-blur-sm"
            : "bg-white/80 border-border/60 backdrop-blur-md shadow-lg",
        )}
      >
        {/* Animated logo mark */}
        <div className="relative">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              isDark
                ? "bg-blue-500/10 border border-blue-500/20"
                : "bg-primary/10 border border-primary/20",
            )}
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              className={cn(
                "w-8 h-8 animate-pulse-slow",
                isDark ? "text-blue-400" : "text-primary",
              )}
              aria-hidden="true"
            >
              <rect
                x="2"
                y="10"
                width="28"
                height="18"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 10V7a8 8 0 0116 0v3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="16" cy="19" r="3" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-2xl animate-ping-slow"
            style={{
              border: `1px solid ${isDark ? "rgba(56,189,248,0.3)" : "rgba(59,130,246,0.3)"}`,
            }}
          />
        </div>

        {/* Loading text with dots */}
        <LoadingDots
          text={text}
          className={cn(
            "text-sm font-medium tracking-wide",
            isDark ? "text-slate-400" : "text-muted-foreground",
          )}
        />
      </div>
    </div>
  );
}
