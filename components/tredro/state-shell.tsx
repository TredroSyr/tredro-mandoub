import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

export function IllustrationHalo({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const resolvedSrc = typeof src === "string" ? src : src.src;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        aria-hidden
        className="absolute inset-[8%] rounded-[46%_54%_42%_58%/52%_44%_56%_48%] bg-primary/10 blur-2xl dark:bg-primary/20"
      />
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        className={cn(
          "relative w-full max-w-full select-none object-contain drop-shadow-[0_18px_35px_color-mix(in_oklab,var(--primary)_18%,transparent)]",
          imgClassName,
        )}
      />
    </div>
  );
}

export function StateActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const stateButtonStyles = {
  primary: cn(base, "bg-primary text-primary-foreground hover:bg-primary/90"),
  ghost: cn(
    base,
    "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
  ),
};
