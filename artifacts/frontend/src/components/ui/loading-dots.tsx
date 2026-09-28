import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  text?: string;
  className?: string;
  dotClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingDots({
  text,
  className,
  dotClassName,
  size = "md",
}: LoadingDotsProps) {
  const dotSize =
    size === "sm" ? "w-1 h-1" : size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5";

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {text && <span>{text}</span>}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "inline-block rounded-full bg-current animate-wave-dot",
            dotSize,
            dotClassName,
          )}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}
