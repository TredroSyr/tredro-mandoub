import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";

export type StoreDetailTab = "requests" | "invoices" | "payments" | "returns";

const TABS: { key: StoreDetailTab; label: string; icon: iconName }[] = [
  { key: "requests", label: "الطلبات", icon: "re_order_filled" },
  { key: "invoices", label: "الفواتير", icon: "card_filled" },
  { key: "payments", label: "الدفعات", icon: "money_filled" },
  { key: "returns", label: "المرتجعات", icon: "undo_filled" },
];

export interface StoreDetailTabsProps {
  value: StoreDetailTab;
  onChange: (tab: StoreDetailTab) => void;
}

export function StoreDetailTabs({ value, onChange }: StoreDetailTabsProps) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
      {TABS.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-bold transition-colors ${
            value === key ? "bg-card text-primary shadow-float" : "text-muted-foreground"
          }`}
        >
          <IconRenderer name={icon} className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
