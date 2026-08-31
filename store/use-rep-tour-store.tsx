"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_COMPANY_INVOICES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_REP_ORDERS,
  INITIAL_SALES,
  INITIAL_STOCK,
  type AppNotification,
  type CompanyInvoice,
  type RepOrder,
  type Sale,
  type ShopOrder,
  type ShopOrderStatus,
  type StockItem,
} from "@/lib/rep-tour-data";

type RepTourState = {
  stock: StockItem[];
  orders: ShopOrder[];
  repOrders: RepOrder[];
  companyInvoices: CompanyInvoice[];
  sales: Sale[];
  notifications: AppNotification[];
  setOrderStatus: (id: string, status: ShopOrderStatus) => void;
  addRepOrder: (o: RepOrder) => void;
  receiveRepOrder: (id: string) => void;
  markNotificationsRead: () => void;
};

export const useRepTourStore = create<RepTourState>()(
  persist(
    (set, get) => ({
      stock: INITIAL_STOCK,
      orders: INITIAL_ORDERS,
      repOrders: INITIAL_REP_ORDERS,
      companyInvoices: INITIAL_COMPANY_INVOICES,
      sales: INITIAL_SALES,
      notifications: INITIAL_NOTIFICATIONS,

      setOrderStatus: (id, status) =>
        set({ orders: get().orders.map((o) => (o.id === id ? { ...o, status } : o)) }),

      addRepOrder: (o) => set({ repOrders: [o, ...get().repOrders] }),

      receiveRepOrder: (id) => {
        const order = get().repOrders.find((o) => o.id === id);
        if (!order) return;
        const stock = [...get().stock];
        order.items.forEach((it) => {
          const idx = stock.findIndex((x) => x.id === it.id);
          if (idx >= 0) stock[idx] = { ...stock[idx]!, qty: stock[idx]!.qty + it.qty };
          else stock.push({ id: it.id, name: it.name, unit: "قطعة", qty: it.qty, price: it.price });
        });
        set({
          stock,
          repOrders: get().repOrders.map((o) =>
            o.id === id ? { ...o, status: "delivered" as const } : o,
          ),
        });
      },

      markNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
    }),
    { name: "tredro-rep-tour" },
  ),
);
