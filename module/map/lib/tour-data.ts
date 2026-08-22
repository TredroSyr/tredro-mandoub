export type DayKey = "sat" | "sun" | "mon" | "tue" | "wed" | "thu";

export type Order = {
  id: string;
  item: string;
  qty: number;
};

export type Invoice = {
  id: string;
  no: string;
  date: string;
  amount: number;
  paid: boolean;
};

export type Payment = {
  id: string;
  date: string;
  amount: number;
};

export type Shop = {
  type: "branch";
  id: string;
  name: string;
  address: string;
  phone: string;
  day: DayKey;
  lat: number;
  lng: number;
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
};

export const ALEPPO_CENTER: [number, number] = [36.2021, 37.1343];

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "sat", label: "السبت", short: "SAT" },
  { key: "sun", label: "الأحد", short: "SUN" },
  { key: "mon", label: "الاثنين", short: "MON" },
  { key: "tue", label: "الثلاثاء", short: "TUE" },
  { key: "wed", label: "الأربعاء", short: "WED" },
  { key: "thu", label: "الخميس", short: "THU" },
];

export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function formatMoney(n: number) {
  return `${n.toLocaleString("ar-SY")} ل.س`;
}

/** ---- Dummy / mock data for local testing (no backend, no store) ---- */
export const INITIAL_SHOPS: Shop[] = [
  {
    type: "branch",
    id: "shop-1",
    name: "بقالية الشهباء",
    address: "حي الجميلية، شارع بارون",
    phone: "963900000001",
    day: "sat",
    lat: 36.2012,
    lng: 37.1591,
    orders: [
      { id: "o1", item: "زيت ذرة 1 لتر", qty: 24 },
      { id: "o2", item: "سكر أبيض 1 كغ", qty: 40 },
    ],
    invoices: [
      { id: "i1", no: "INV-1042", date: "2026-08-15", amount: 185000, paid: true },
      { id: "i2", no: "INV-1071", date: "2026-08-20", amount: 92000, paid: false },
    ],
    payments: [{ id: "p1", date: "2026-08-16", amount: 185000 }],
  },
  {
    type: "branch",
    id: "shop-2",
    name: "سوبرماركت النور",
    address: "حي الفرقان، طريق النيرب",
    phone: "963900000002",
    day: "sat",
    lat: 36.1974,
    lng: 37.1822,
    orders: [{ id: "o3", item: "معجون طماطم 800غ", qty: 60 }],
    invoices: [
      { id: "i3", no: "INV-1055", date: "2026-08-18", amount: 310000, paid: false },
    ],
    payments: [],
  },
  {
    type: "branch",
    id: "shop-3",
    name: "محلات الأمانة",
    address: "حي الميدان، السوق القديم",
    phone: "963900000003",
    day: "sun",
    lat: 36.1898,
    lng: 37.148,
    orders: [
      { id: "o4", item: "أرز بسمتي 5 كغ", qty: 15 },
      { id: "o5", item: "شاي أحمر 100 كيس", qty: 20 },
    ],
    invoices: [
      { id: "i4", no: "INV-0998", date: "2026-08-10", amount: 275000, paid: true },
    ],
    payments: [{ id: "p2", date: "2026-08-11", amount: 275000 }],
  },
  {
    type: "branch",
    id: "shop-4",
    name: "بقالية الأصيل",
    address: "حي صلاح الدين، الشارع الرئيسي",
    phone: "963900000004",
    day: "sun",
    lat: 36.2137,
    lng: 37.1211,
    orders: [],
    invoices: [],
    payments: [],
  },
  {
    type: "branch",
    id: "shop-5",
    name: "تموينات الفردوس",
    address: "حي السليمانية، قرب الجامعة",
    phone: "963900000005",
    day: "mon",
    lat: 36.2245,
    lng: 37.1367,
    orders: [{ id: "o6", item: "مسحوق غسيل 3 كغ", qty: 12 }],
    invoices: [
      { id: "i5", no: "INV-1063", date: "2026-08-19", amount: 145000, paid: false },
    ],
    payments: [],
  },
  {
    type: "branch",
    id: "shop-6",
    name: "محلات الياسمين",
    address: "حي الحمدانية، جادة الأمل",
    phone: "963900000006",
    day: "tue",
    lat: 36.1802,
    lng: 37.1259,
    orders: [
      { id: "o7", item: "عصير برتقال 1 لتر", qty: 30 },
      { id: "o8", item: "بسكويت شاي", qty: 50 },
    ],
    invoices: [
      { id: "i6", no: "INV-1030", date: "2026-08-14", amount: 210000, paid: true },
    ],
    payments: [{ id: "p3", date: "2026-08-14", amount: 210000 }],
  },
];
