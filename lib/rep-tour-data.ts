/**
 * Local demo data for the rep-tour flow (home, notifications).
 * There is no backend module for these yet — this mirrors the shape of the
 * eventual API responses so pages can be swapped over without a rewrite.
 */

/** فاتورة مبيعات لمحل */
export type Sale = {
  id: string;
  no: string;
  date: string;
  amount: number;
  paid: boolean;
  shopName: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
};

export const INITIAL_SALES: Sale[] = [
  {
    id: "sale1",
    no: "INV-2201",
    date: toISODate(new Date()),
    amount: 480000,
    paid: true,
    shopName: "بقالية الشهباء",
  },
  {
    id: "sale2",
    no: "INV-2244",
    date: toISODate(new Date()),
    amount: 315000,
    paid: false,
    shopName: "سوبرماركت الجميلية",
  },
  {
    id: "sale3",
    no: "INV-2255",
    date: daysAgoISO(1),
    amount: 1250000,
    paid: false,
    shopName: "محل أبو عمار للمواد الغذائية",
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "أمين المستودع وافق على طلبك",
    body: "الطلب جاهز للاستلام خلال ٣ ساعات.",
    date: toISODate(new Date()),
    read: false,
  },
  {
    id: "n2",
    title: "طلب جديد من سوبرماركت الجميلية",
    body: "بانتظار موافقتك على الطلب.",
    date: toISODate(new Date()),
    read: false,
  },
  {
    id: "n3",
    title: "تذكير",
    body: "لديك محلات لم تتم زيارتها اليوم ضمن جولتك.",
    date: daysAgoISO(1),
    read: true,
  },
];

/** أرقام إنجليزية دائمًا */
export function formatNum(v: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
}

export function toISODate(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  return toISODate(new Date(Date.now() - days * 86400000));
}

export function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
