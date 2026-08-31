import type { StaticImageData } from "next/image";
import salesEmptyImg from "@/public/illustration/empty-invoices.png";
import warehouseEmptyImg from "@/public/illustration/empty-products.png";
import storesEmptyImg from "@/public/illustration/empty-customers.png";
import requestsEmptyImg from "@/public/illustration/empty-orders.png";

export type EmptyStateVariant = "sales" | "warehouse" | "stores" | "requests";

export interface EmptyStatePreset {
  image: string | StaticImageData;
  alt: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export const emptyStatePresets: Record<EmptyStateVariant, EmptyStatePreset> = {
  sales: {
    image: salesEmptyImg,
    alt: "لا توجد مبيعات",
    title: "لا توجد مبيعات ضمن هذه الفترة",
    description: "لم يتم تسجيل أي فاتورة مبيعات خلال الفترة الزمنية المحددة.",
  },
  warehouse: {
    image: warehouseEmptyImg,
    alt: "مستودع فارغ",
    title: "المستودع فارغ حاليًا",
    description: "لا توجد منتجات مسجّلة في مستودع سيارتك في الوقت الحالي.",
  },
  stores: {
    image: storesEmptyImg,
    alt: "لا توجد محلات",
    title: "لا توجد محلات مسجّلة بعد",
    description: "ستظهر هنا المحلات التي يتم تخصيصها لحسابك.",
  },
  requests: {
    image: requestsEmptyImg,
    alt: "لا توجد طلبات",
    title: "لا توجد طلبات سابقة",
    description: "لم يُسجَّل أي طلب لهذا المحل حتى الآن.",
  },
};
