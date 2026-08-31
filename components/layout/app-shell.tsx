"use client";

import type { ReactNode } from "react";
import AppHeader from "./app-header";

export default function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div dir="rtl" className="min-h-[100svh] bg-background">
      <AppHeader title={title} subtitle={subtitle} action={action} />
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  );
}
