import { forwardRef, type CSSProperties } from "react";
import { formatDate } from "@/lib/format";
import { formatInvoiceMoney, formatInvoiceQuantity } from "../lib/utils";
import type { SalesInvoiceDetail } from "../types";

const STATUS_LABEL: Record<string, string> = {
  fully_paid: "مدفوعة بالكامل",
  partially_paid: "مدفوعة جزئياً",
  deferred: "آجلة",
};

/**
 * Off-screen print layout captured by html2canvas for PDF export — kept as plain HTML/CSS
 * (no app chrome, fixed print width) so the rasterized page reads cleanly at any zoom.
 */
export const InvoicePrintTemplate = forwardRef<HTMLDivElement, { invoice: SalesInvoiceDetail }>(
  function InvoicePrintTemplate({ invoice }, ref) {
    return (
      <div
        ref={ref}
        dir="rtl"
        style={{ width: 760, padding: 32, backgroundColor: "#ffffff", color: "#111827", fontFamily: "sans-serif" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111827", paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{invoice.company_name}</div>
            {invoice.tax_registration_no && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                الرقم الضريبي: {invoice.tax_registration_no}
              </div>
            )}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>فاتورة مبيعات</div>
            <div style={{ fontSize: 13, marginTop: 4, direction: "ltr" }}>{invoice.number}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{formatDate(invoice.date)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 13 }}>
          <div>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>العميل</div>
            <div style={{ fontWeight: 700 }}>{invoice.customer_name}</div>
            <div style={{ direction: "ltr", textAlign: "right", color: "#374151" }}>{invoice.customer_phone}</div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>الحالة</div>
            <div style={{ fontWeight: 700 }}>{STATUS_LABEL[invoice.status] ?? invoice.status}</div>
          </div>
        </div>

        <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={cellStyle("right")}>المنتج</th>
              <th style={cellStyle("center")}>الكمية</th>
              <th style={cellStyle("center")}>سعر الوحدة</th>
              <th style={cellStyle("left")}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={cellStyle("right")}>{line.product_name}</td>
                <td style={cellStyle("center")}>{formatInvoiceQuantity(line.quantity)}</td>
                <td style={cellStyle("center")}>{formatInvoiceMoney(line.unit_price)}</td>
                <td style={cellStyle("left")}>{formatInvoiceMoney(line.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoice.payments.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>الدفعات المحصَّلة</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={cellStyle("right")}>التاريخ</th>
                  <th style={cellStyle("right")}>ملاحظة</th>
                  <th style={cellStyle("left")}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={cellStyle("right")}>{formatDate(payment.collected_at)}</td>
                    <td style={cellStyle("right")}>{payment.note || "—"}</td>
                    <td style={cellStyle("left")}>{formatInvoiceMoney(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 24, marginRight: "auto", width: 280 }}>
          <SummaryRow label="الإجمالي" value={formatInvoiceMoney(invoice.total_amount)} />
          <SummaryRow label="المحصَّل" value={formatInvoiceMoney(invoice.paid_amount)} />
          {Number(invoice.returned_amount) > 0 && (
            <SummaryRow label="المرتجعات" value={formatInvoiceMoney(invoice.returned_amount)} />
          )}
          <SummaryRow label="المتبقي" value={formatInvoiceMoney(invoice.balance_due)} strong />
        </div>

        {invoice.notes && (
          <div style={{ marginTop: 20, fontSize: 12, color: "#374151" }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>ملاحظات</div>
            {invoice.notes}
          </div>
        )}

        <div style={{ marginTop: 32, borderTop: "1px solid #e5e7eb", paddingTop: 12, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>
          صدرت هذه الفاتورة عبر تطبيق تريدرو للمندوبين
        </div>
      </div>
    );
  },
);

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 10px",
        fontSize: strong ? 14 : 12,
        fontWeight: strong ? 800 : 600,
        backgroundColor: strong ? "#111827" : "transparent",
        color: strong ? "#ffffff" : "#111827",
        borderRadius: strong ? 8 : 0,
        marginTop: strong ? 6 : 0,
      }}
    >
      <span>{label}</span>
      <span style={{ direction: "ltr" }}>{value}</span>
    </div>
  );
}

function cellStyle(align: "right" | "center" | "left"): CSSProperties {
  return { padding: "8px 6px", textAlign: align };
}
