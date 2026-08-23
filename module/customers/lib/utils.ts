import { Customer, RepAssignment } from "../types";
import { Shop, DayKey } from "@/module/map/lib/tour-data";

const DAY_KEY_TO_API: Record<DayKey, string> = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  sat: "saturday",
};

const API_DAY_TO_KEY: Record<string, DayKey> = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  saturday: "sat",
};

export function customerToShop(customer: Customer): Shop | null {
  // Skip customers without valid coordinates
  if (customer.latitude == null || customer.longitude == null) {
    return null;
  }

  const repAssignment = customer.assigned_reps_details?.[0];
  const workDays = repAssignment?.work_days ?? [];
  const primaryDay = workDays.length > 0
    ? API_DAY_TO_KEY[workDays[0]] ?? "sun"
    : "sun";

  return {
    type: "branch",
    id: `customer-${customer.id}`,
    name: customer.name,
    address: ``,
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
    c.assigned_reps_details?.[0]?.work_days?.includes(apiDay)
  );
}

export function getCustomerWorkDays(customer: Customer): string[] {
  return customer.assigned_reps_details?.[0]?.work_days ?? [];
}
