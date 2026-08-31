/**
 * Local demo data for the rep-tour flow (home, orders, my-orders, notifications).
 * There is no backend module for these yet — this mirrors the shape of the
 * eventual API responses so pages can be swapped over without a rewrite.
 */

export type OrderItem = { id: string; name: string; qty: number; price: number };

export type StockItem = { id: string; name: string; unit: string; qty: number; price: number };

export type ShopOrderStatus = "pending" | "accepted" | "rejected" | "delivered";

/** طلب وارد من محل الى المندوب */
export type ShopOrder = {
  id: string;
  shopName: string;
  shopAddress: string;
  date: string;
  status: ShopOrderStatus;
  items: OrderItem[];
};

export const ORDER_STATUS: Record<ShopOrderStatus, { label: string; tone: string }> = {
  pending: { label: "بانتظار الموافقة", tone: "bg-warning/20 text-warning-foreground" },
  accepted: { label: "مقبول", tone: "bg-primary/15 text-primary" },
  rejected: { label: "مرفوض", tone: "bg-destructive/15 text-destructive" },
  delivered: { label: "تم التسليم", tone: "bg-success/15 text-success" },
};

export type RepOrderStatus = "pending" | "accepted" | "delivered" | "expired";

/** طلب بضاعة من المندوب لأمين المستودع */
export type RepOrder = {
  id: string;
  createdAt: string;
  /** مهلة الاستلام بالساعات */
  pickupHours: number;
  /** آخر وقت للموافقة (ISO) */
  deadline: string;
  status: RepOrderStatus;
  items: OrderItem[];
};

export const REP_ORDER_STATUS: Record<RepOrderStatus, { label: string; tone: string }> = {
  pending: { label: "قيد الانتظار", tone: "bg-warning/20 text-warning-foreground" },
  accepted: { label: "مقبول", tone: "bg-primary/15 text-primary" },
  delivered: { label: "تم التسليم", tone: "bg-success/15 text-success" },
  expired: { label: "غير موافَق عليها", tone: "bg-destructive/15 text-destructive" },
};

/** فاتورة تحميل من الشركة */
export type CompanyInvoice = {
  id: string;
  no: string;
  date: string;
  amount: number;
  items: OrderItem[];
};

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

export const INITIAL_STOCK: StockItem[] = [
  { id: "p1", name: "كرتونة بسكويت شاي", unit: "كرتونة", qty: 10, price: 85000 },
  { id: "p2", name: "زيت دوار الشمس ١ ل", unit: "عبوة", qty: 48, price: 32000 },
  { id: "p3", name: "سكر ١ كغ", unit: "كيس", qty: 60, price: 12000 },
  { id: "p4", name: "رز مصري ٥ كغ", unit: "كيس", qty: 18, price: 74000 },
  { id: "p5", name: "شاي أسود ٤٠٠غ", unit: "علبة", qty: 30, price: 46000 },
  { id: "p6", name: "معلبات فول ٤٠٠غ", unit: "علبة", qty: 72, price: 9000 },
  { id: "p7", name: "مناديل ورقية", unit: "ربطة", qty: 40, price: 15000 },
  { id: "p8", name: "شيبس عائلي", unit: "كرتونة", qty: 12, price: 68000 },
];

export const INITIAL_ORDERS: ShopOrder[] = [
  {
    id: "so1",
    shopName: "سوبرماركت الجميلية",
    shopAddress: "الجميلية، مقابل الحديقة العامة",
    date: toISODate(new Date()),
    status: "pending",
    items: [
      { id: "p1", name: "كرتونة بسكويت شاي", qty: 3, price: 85000 },
      { id: "p6", name: "معلبات فول ٤٠٠غ", qty: 24, price: 9000 },
    ],
  },
  {
    id: "so2",
    shopName: "بقالية الشهباء",
    shopAddress: "شارع النيل، الفرقان، حلب",
    date: toISODate(new Date()),
    status: "accepted",
    items: [{ id: "p2", name: "زيت دوار الشمس ١ ل", qty: 12, price: 32000 }],
  },
  {
    id: "so3",
    shopName: "محل أبو عمار للمواد الغذائية",
    shopAddress: "السليمانية، شارع الحمام",
    date: daysAgoISO(2),
    status: "delivered",
    items: [
      { id: "p4", name: "رز مصري ٥ كغ", qty: 6, price: 74000 },
      { id: "p5", name: "شاي أسود ٤٠٠غ", qty: 10, price: 46000 },
    ],
  },
  {
    id: "so4",
    shopName: "بقالية الهلك",
    shopAddress: "الهلك، الشارع الرئيسي",
    date: daysAgoISO(5),
    status: "rejected",
    items: [{ id: "p8", name: "شيبس عائلي", qty: 2, price: 68000 }],
  },
];

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

export const INITIAL_REP_ORDERS: RepOrder[] = [
  {
    id: "ro1",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupHours: 3,
    deadline: new Date(Date.now() + 1 * 3600000).toISOString(),
    status: "accepted",
    items: [{ id: "p2", name: "زيت دوار الشمس ١ ل", qty: 24, price: 32000 }],
  },
  {
    id: "ro2",
    createdAt: daysAgoISOTime(3),
    pickupHours: 2,
    deadline: daysAgoISOTime(3),
    status: "delivered",
    items: [
      { id: "p3", name: "سكر ١ كغ", qty: 40, price: 12000 },
      { id: "p6", name: "معلبات فول ٤٠٠غ", qty: 30, price: 9000 },
    ],
  },
];

export const INITIAL_COMPANY_INVOICES: CompanyInvoice[] = [
  {
    id: "ci1",
    no: "LD-5501",
    date: toISODate(new Date()),
    amount: 1248000,
    items: [
      { id: "p2", name: "زيت دوار الشمس ١ ل", qty: 24, price: 32000 },
      { id: "p4", name: "رز مصري ٥ كغ", qty: 6, price: 74000 },
    ],
  },
  {
    id: "ci2",
    no: "LD-5488",
    date: daysAgoISO(3),
    amount: 750000,
    items: [{ id: "p3", name: "سكر ١ كغ", qty: 40, price: 12000 }],
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

export function formatMoney(v: number) {
  return formatNum(v) + " ل.س";
}

export function toISODate(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  return toISODate(new Date(Date.now() - days * 86400000));
}

function daysAgoISOTime(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function orderTotal(o: { items: OrderItem[] }) {
  return o.items.reduce((t, i) => t + i.qty * i.price, 0);
}

/** حالة طلب المندوب مع احتساب انتهاء المهلة دون تعديل البيانات المخزّنة */
export function repOrderDisplayStatus(o: RepOrder): RepOrderStatus {
  if (o.status === "pending" && new Date(o.deadline).getTime() < Date.now()) return "expired";
  return o.status;
}

export function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
