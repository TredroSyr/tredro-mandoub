import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IllustrationHalo, stateButtonStyles } from "./state-shell";
import { emptyStatePresets, EmptyStateVariant } from "@/lib/illustrations";

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  /** Optional CTA. Pass `{ label, onClick }` or a fully custom node via `children`. */
  action?: { label?: string; onClick: () => void };
  children?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function EmptyState({
  variant,
  title,
  description,
  action,
  children,
  size = "md",
  className,
}: EmptyStateProps) {
  const preset = emptyStatePresets[variant];

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl px-6 text-center",
        size === "sm" ? "py-8" : "py-14",
        className,
      )}
    >
      <IllustrationHalo
        src={preset.image}
        alt={preset.alt}
        className={size === "sm" ? "w-36" : "w-56 sm:w-64"}
      />

      <h2
        className={cn(
          "mt-6 font-bold text-foreground",
          size === "sm" ? "text-base" : "text-xl",
        )}
      >
        {title ?? preset.title}
      </h2>
      <p
        className={cn(
          "mt-2 max-w-sm leading-7 text-muted-foreground",
          size === "sm" ? "text-xs leading-6" : "text-sm",
        )}
      >
        {description ?? preset.description}
      </p>

      {children ??
        (action ? (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(stateButtonStyles.primary, "mt-6")}
          >
            {action.label ?? preset.actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
