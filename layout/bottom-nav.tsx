"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    to: "/map",
    label: "الخريطة",
    filled: "map_filled",
    outlined: "map_outlined",
  },
  {
    to: "/stores",
    label: "المحلات",
    filled: "category_filled",
    outlined: "category_outlined",
  },
  {
    to: "/home",
    label: "الرئيسية",
    filled: "home_filled",
    outlined: "home_outlined",
  },
  {
    to: "/orders",
    label: "الطلبات",
    filled: "checkout_filled",
    outlined: "checkout_outlined",
  },
  {
    to: "/my-orders",
    label: "طلباتي",
    filled: "history_filled",
    outlined: "history_outlined",
  },
  // {
  //   to: "/settings",
  //   label: "الإعدادات",
  //   filled: "settings_filled",
  //   outlined: "settings_outlined",
  // },
];

// Same glass treatment as the Sidebar's ButtonGlassEffect
function NavGlassEffect({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="absolute inset-0 rounded-2xl -z-1 bg-primary shadow-[0_4px_16px_rgba(0,0,0,0.22)]" />
    );
  }

  return (
    <div className="absolute -rotate-18 inset-0 rounded-2xl -z-1">
      <div className="absolute top-0 w-full h-1/2 rounded-t-2xl bg-linear-180 dark:from-gray-400/60 from-white to-transparent via-transparent via-40% dark:via-16% transition-all duration-150 backdrop-blur-sm" />
      <div className="absolute bottom-0 w-full h-1/2 rounded-b-2xl bg-linear-0 dark:from-gray-400/60 from-white to-transparent via-transparent via-40% dark:via-16% transition-all duration-150 backdrop-blur-sm" />
    </div>
  );
}
export default function BottomNav() {
  const pathname = usePathname();

  // Grid columns always match the actual number of tabs,
  // so removing/adding an item never leaves a phantom empty column.
  const gridColsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[TABS.length] ?? "grid-cols-5";

  return (
    <motion.nav
      dir="rtl"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed inset-x-0 bottom-0 z-[2000] pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5"
      style={{
        background: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.18)",
      }}
    >
      <ul className={`mx-auto grid max-w-md ${gridColsClass} px-1.5`}>
        {TABS.map(({ to, label, filled, outlined }) => {
          const active =
            to === "/" ? pathname === "/" : pathname?.startsWith(to);
          return (
            <li key={to} className="relative">
              <Link
                href={to}
                aria-label={label}
                title={label}
                className="flex justify-center py-1"
              >
                <span className="relative grid h-10 w-full max-w-[3.25rem] place-items-center">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active-pill"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      className="absolute inset-0"
                    >
                      <NavGlassEffect isActive />
                    </motion.span>
                  )}
                  <motion.span
                    whileTap={{ scale: 0.85 }}
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className={`relative z-10 grid h-full w-full place-items-center ${
                      active
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-fg-brand-primary"
                    }`}
                  >
                    <IconRenderer name={active ? filled : outlined} size={19} />
                  </motion.span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

export const NAV_H = "calc(4.5rem + env(safe-area-inset-bottom))";
