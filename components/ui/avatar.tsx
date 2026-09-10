"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

import { IconRenderer } from "@/assets/icons/iconRenderer";
import { cn } from "@/lib/utils";

// Base URL used only for resolving relative asset paths (images) returned
// by the API. Strips a trailing "/api" since static files are usually
// served from the root domain, not under "/api".
const ASSET_BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(
  /\/api\/?$/,
  "",
);

/**
 * Resolves an image src coming from the API into a fully qualified URL.
 * - Leaves absolute URLs (http/https), data URIs, and blob URLs untouched.
 * - Prepends ASSET_BASE_URL to relative paths (e.g. "/uploads/x.png").
 */
function resolveImageSrc(src: string | null | undefined): string | undefined {
  if (!src) return undefined;

  if (
    /^(https?:)?\/\//.test(src) ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  const cleanPath = src.startsWith("/") ? src : `/${src}`;
  return `${ASSET_BASE_URL}${cleanPath}`;
}

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  onLoadingStatusChange,
  ...props
}: AvatarPrimitive.Image.Props) {
  // Resolve relative API paths ("/uploads/x.png") into full URLs.
  // Absolute URLs, data URIs, and blob URLs pass through unchanged.
  const resolvedSrc = resolveImageSrc(src as string | null | undefined);

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={resolvedSrc}
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className,
      )}
      onLoadingStatusChange={onLoadingStatusChange}
      {...props}
    />
  );
}

const FALLBACK_ICON_SIZE = {
  sm: 12,
  default: 16,
  lg: 20,
} as const;

function AvatarFallback({
  className,
  children,
  size = "default",
  ...props
}: AvatarPrimitive.Fallback.Props & {
  size?: "default" | "sm" | "lg";
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-gradient-to-l from-primary/30 to-primary/10 text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className,
      )}
      {...props}
    >
      {children ?? (
        <IconRenderer
          name="no_image_filled"
          className="text-primary/50"
          width={FALLBACK_ICON_SIZE[size]}
          height={FALLBACK_ICON_SIZE[size]}
        />
      )}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
};
