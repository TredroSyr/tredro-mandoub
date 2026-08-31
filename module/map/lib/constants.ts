export const BOTTOM_NAV_H_CSS = "var(--bottom-nav-height)";
export const PANEL_WIDTH_CLASS =
  "md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2";
export const OVERLAY_Z = "z-[2600]";

export const NAV_H_ESTIMATE = 64;

/** Minimum on-screen distance (px, at the current zoom) two shop-name labels must keep
 * before the denser one is hidden. Isolated markers always keep their label regardless
 * of zoom; only markers crowding a neighbor within this radius get thinned out. */
export const LABEL_MIN_SPACING_PX = 70;
