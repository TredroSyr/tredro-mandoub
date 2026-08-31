import { Customer } from "../types";
import { Shop, DayKey } from "@/module/map/lib/tour-data";

export const DAY_KEY_TO_API: Record<DayKey, string> = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  sat: "saturday",
};

export const API_DAY_TO_KEY: Record<string, DayKey> = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  saturday: "sat",
};

export const WORK_DAYS_LABELS: Record<string, string> = {
  sunday: "الأحد",
  monday: "الاثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
  saturday: "السبت",
};

/**
 * Customer for list display - includes ALL customers regardless of coordinates
 * Used for: DaySelector counts, ShopListDrawer lists
 */
export interface CustomerListItem {
  id: string;
  customerId: number;
  name: string;
  phone: string;
  email: string | null;
  day: DayKey;
  workDays: string[];
  hasCoordinates: boolean;
  lat?: number;
  lng?: number;
  isActive: boolean;
}

/**
 * Convert a customer to a list item (works even without coordinates)
 */
export function customerToListItem(customer: Customer): CustomerListItem {
  const workDays = customer.work_days ?? customer.assigned_reps_details?.[0]?.work_days ?? [];
  const primaryDay = workDays.length > 0
    ? API_DAY_TO_KEY[workDays[0]] ?? "sun"
    : "sun";

  return {
    id: `customer-${customer.id}`,
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    day: primaryDay,
    workDays: workDays,
    hasCoordinates: customer.latitude != null && customer.longitude != null,
    lat: customer.latitude ?? undefined,
    lng: customer.longitude ?? undefined,
    isActive: customer.is_active,
  };
}

export function customersToListItems(customers: Customer[]): CustomerListItem[] {
  return customers.map(customerToListItem);
}

/**
 * Convert customer to Shop (for map display) - only works with coordinates
 */
export function customerToShop(customer: Customer): Shop | null {
  // Skip customers without valid coordinates for the map
  if (customer.latitude == null || customer.longitude == null) {
    return null;
  }

  const workDays = customer.work_days ?? customer.assigned_reps_details?.[0]?.work_days ?? [];
  const primaryDay = workDays.length > 0
    ? API_DAY_TO_KEY[workDays[0]] ?? "sun"
    : "sun";

  return {
    type: "branch",
    id: `customer-${customer.id}`,
    name: customer.name,
    address: customer.address,
    phone: customer.phone,
    day: primaryDay,
    lat: customer.latitude,
    lng: customer.longitude,
    orders: [],
    invoices: [],
    payments: [],
  };
}

export function customersToShops(customers: Customer[]): Shop[] {
  return customers.map(customerToShop).filter((shop): shop is Shop => shop !== null);
}

export function filterCustomersByDay(
  customers: Customer[],
  day: DayKey
): Customer[] {
  const apiDay = DAY_KEY_TO_API[day];
  return customers.filter((c) =>
    (c.work_days ?? c.assigned_reps_details?.[0]?.work_days)?.includes(apiDay)
  );
}

export function filterListItemsByDay(
  items: CustomerListItem[],
  day: DayKey
): CustomerListItem[] {
  const apiDay = DAY_KEY_TO_API[day];
  return items.filter((item) =>
    item.workDays.includes(apiDay)
  );
}

export function getCustomerWorkDays(customer: Customer): string[] {
  return customer.work_days ?? customer.assigned_reps_details?.[0]?.work_days ?? [];
}

/** يعرض قيمة نقدية بصيغة string ثابتة الدقة من الـ API كنص عربي منسّق */
export function formatCurrency(value: string | number) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${(Number.isFinite(n) ? n : 0).toLocaleString("ar-SY")} ل.س`;
}
