"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { onlineManager } from "@tanstack/react-query";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { isNativeApp } from "@/lib/native";
import { cacheStatus } from "@/lib/db/query-persister";
import { outboxCounts } from "@/lib/db/outbox";
import { dbStatus, describeError, getDb, runSerialized } from "@/lib/db/sqlite";
import { flushOutbox } from "@/lib/sync/flush-outbox";

type Row = { label: string; value: string; ok: boolean | null };

function ago(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.round((Date.now() - ms) / 1000);
  return s < 60 ? `قبل ${s} ث` : `قبل ${Math.round(s / 60)} د`;
}

/**
 * Shows, on the device itself, which layer of offline mode works and which
 * doesn't — so a failure can be pinpointed from a screenshot instead of
 * guessed at.
 */
export function OfflineDiagnosticsView() {
  const router = useRouter();
  const network = useNetworkStatus();
  const [rows, setRows] = useState<Row[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const collect = useCallback(async () => {
    const counts = await outboxCounts();
    const restore = cacheStatus.lastRestore;
    const next: Row[] = [
      {
        label: "داخل التطبيق الأصلي (Capacitor)",
        value: `${isNativeApp() ? "نعم" : "لا — وضع الويب: الميزة معطّلة"} (${Capacitor.getPlatform()})`,
        ok: isNativeApp(),
      },
      {
        label: "حالة الشبكة (Capacitor Network)",
        value: `${network.connected ? "متصل" : "غير متصل"} — ${network.connectionType}`,
        ok: null,
      },
      {
        label: "React Query يعتبر الجهاز",
        value: onlineManager.isOnline() ? "متصل" : "غير متصل",
        ok: null,
      },
      {
        label: "قاعدة SQLite",
        value:
          dbStatus.state === "failed"
            ? `فشل: ${dbStatus.error}`
            : dbStatus.state === "open"
              ? "مفتوحة"
              : dbStatus.state === "opening"
                ? "جارٍ الفتح…"
                : "لم تُفتح بعد",
        ok: dbStatus.state === "open" ? true : dbStatus.state === "failed" ? false : null,
      },
      {
        label: "الكاش — آخر استرجاع عند الفتح",
        value: restore
          ? `${restore.source} — ${restore.queries} استعلام${restore.error ? ` — خطأ: ${restore.error}` : ""}`
          : "لم يحدث",
        ok: restore ? restore.queries > 0 : null,
      },
      {
        label: "الكاش — آخر حفظ",
        value: cacheStatus.lastSaveAt
          ? `${ago(cacheStatus.lastSaveAt)} — ${Math.round((cacheStatus.lastSaveBytes ?? 0) / 1024)} KB → ${cacheStatus.lastSaveTarget ?? "؟"}${cacheStatus.lastSaveError ? ` — خطأ: ${cacheStatus.lastSaveError}` : ""}`
          : "لم يُحفظ شيء بعد",
        ok: cacheStatus.lastSaveAt ? !cacheStatus.lastSaveError : null,
      },
      {
        label: "العمليات المعلّقة (outbox)",
        value: `SQLite: ${counts.sqlite} — localStorage: ${counts.localStorage}`,
        ok: null,
      },
    ];
    setRows(next);
  }, [network]);

  useEffect(() => {
    const first = setTimeout(() => void collect(), 0);
    const interval = setInterval(() => void collect(), 2000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [collect]);

  const runSqliteTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const db = await getDb();
      if (!db) throw new Error(dbStatus.error ?? "لا يمكن فتح قاعدة البيانات");
      const value = String(Date.now());
      const read = await runSerialized(async () => {
        await db.execute(
          "CREATE TABLE IF NOT EXISTS diag_test (k TEXT PRIMARY KEY, v TEXT)",
        );
        await db.run("INSERT OR REPLACE INTO diag_test (k, v) VALUES (?, ?)", ["t", value]);
        const result = await db.query("SELECT v FROM diag_test WHERE k = ?", ["t"]);
        await db.run("DELETE FROM diag_test WHERE k = ?", ["t"]);
        return (result.values?.[0] as { v?: string } | undefined)?.v;
      });
      setTestResult(
        read === value
          ? "✅ SQLite يعمل: كتابة وقراءة ناجحتان"
          : `❌ القراءة لم تطابق الكتابة (${read})`,
      );
    } catch (error) {
      setTestResult(`❌ فشل اختبار SQLite: ${describeError(error)}`);
    } finally {
      setBusy(false);
      void collect();
    }
  };

  const runFlush = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      const synced = await flushOutbox();
      setTestResult(`تمت مزامنة ${synced} عنصر`);
    } catch (error) {
      setTestResult(`❌ فشلت المزامنة: ${describeError(error)}`);
    } finally {
      setBusy(false);
      void collect();
    }
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="رجوع"
          className="grid size-9 shrink-0 place-items-center rounded-2xl bg-secondary text-primary active:scale-95"
        >
          <IconRenderer name="arrow_right_outlined" className="size-4" />
        </button>
        <h1 className="text-base font-extrabold">حالة وضع عدم الاتصال</h1>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3"
          >
            <span className="text-[11px] font-bold text-muted-foreground">
              {row.label}
            </span>
            <span
              className={`break-words text-sm font-bold ${
                row.ok === true
                  ? "text-success-foreground"
                  : row.ok === false
                    ? "text-destructive"
                    : ""
              }`}
              dir="auto"
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={runSqliteTest}>
          اختبار SQLite
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={runFlush}>
          مزامنة الآن
        </Button>
      </div>

      {testResult && (
        <p className="break-words rounded-2xl bg-muted p-3 text-xs font-bold" dir="auto">
          {testResult}
        </p>
      )}
    </div>
  );
}
