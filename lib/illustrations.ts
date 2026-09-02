import type { iconName } from "@/assets/icons/iconRenderer/types";

export type EmptyStateVariant = "sales" | "warehouse" | "stores" | "requests";

export interface EmptyStatePreset {
  icon: iconName;
  title: string;
  description: string;
  actionLabel?: string;
}

export const emptyStatePresets: Record<EmptyStateVariant, EmptyStatePreset> = {
  sales: {
    icon: "receipt_outlined",
    title: "لا توجد مبيعات ضمن هذه الفترة",
    description: "لم يتم تسجيل أي فاتورة مبيعات خلال الفترة الزمنية المحددة.",
  },
  warehouse: {
    icon: "cart_outlined",
    title: "المستودع فارغ حاليًا",
    description: "لا توجد منتجات مسجّلة في مستودع سيارتك في الوقت الحالي.",
  },
  stores: {
    icon: "store_outlined",
    title: "لا توجد محلات مسجّلة بعد",
    description: "ستظهر هنا المحلات التي يتم تخصيصها لحسابك.",
  },
  requests: {
    icon: "cart_outlined",
    title: "لا توجد طلبات سابقة",
    description: "لم يُسجَّل أي طلب لهذا المحل حتى الآن.",
  },
};
