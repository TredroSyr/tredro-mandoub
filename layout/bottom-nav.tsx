"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { IconRenderer } from "@/assets/icons/iconRenderer";

type Tab = {
  to: string;
  label: string;
  filled: iconName;
  outlined: iconName;
};

const TABS: Tab[] = [
  {
    to: "/home",
    label: "الرئيسية",
    filled: "home_filled",
    outlined: "home_outlined",
  },
  {
    to: "/map",
    label: "الخريطة",
    filled: "location_filled",
    outlined: "location_outlined",
  },
  {
    to: "/stores",
    label: "المحلات",
    filled: "store_filled",
    outlined: "store_outlined",
  },
  {
    to: "/orders",
    label: "الطلبات",
    filled: "receipt_filled",
    outlined: "receipt_outlined",
  },
  {
    to: "/my-orders",
    label: "طلباتي",
    filled: "history_filled",
    outlined: "history_outlined",
  },
];

const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      dir="rtl"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed inset-x-0 bottom-0 z-2100  pt-1.5"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between gap-1 border border-border bg-card px-1.5 py-3 shadow-(--shadow-raised)">
        {TABS.map(({ to, label, filled, outlined }) => {
          const active =
            to === "/" ? pathname === "/" : pathname?.startsWith(to);
          return (
            <motion.li layout transition={SPRING} key={to} className="relative">
              <Link
                href={to}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
              >
                <motion.span
                  layout
                  transition={SPRING}
                  whileTap={{ scale: 0.94 }}
                  className={`flex h-11 items-center justify-center rounded-full ${
                    active
                      ? "gap-2 bg-primary px-4 text-primary-foreground"
                      : "w-11 text-muted-foreground"
                  }`}
                >
                  <motion.span
                    key={active ? filled : outlined}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex items-center justify-center"
                  >
                    <IconRenderer
                      name={active ? filled : outlined}
                      width={19}
                      height={19}
                    />
                  </motion.span>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="overflow-hidden text-sm font-medium whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

// Single source of truth also consumed by drawers (e.g. ShopListDrawer's
// `bottomNavHeight` prop) so they stop exactly above this bar.
export const NAV_H = "var(--bottom-nav-height)";
