"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "@/components/ui/toast";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import type { OutboxItem } from "@/lib/db/outbox";
import { useAuthStore } from "@/module/auth/store/auth-store";
import { useGetCustomerByIdQuery } from "@/module/customers/hooks";
import type {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from "@/module/customers/types";
import type { CreateCustomerValues } from "@/module/customers/schema";
import { CreateInvoiceDrawer } from "@/module/invoices/components/create-invoice-drawer";
import {
  RecordPaymentDialog,
  type PaymentTarget,
} from "@/module/invoices/components/record-payment-dialog";
import { useGetSalesInvoiceDetailQuery, useIssueReturnInvoiceMutation } from "@/module/invoices/hooks";
import { REFUND_METHOD_OPTIONS } from "@/module/invoices/lib/utils";
import type {
  CreatePaymentPayload,
  CreateSalesInvoicePayload,
  IssueReturnInvoicePayload,
} from "@/module/invoices/types";
import { AddCustomerDrawer } from "@/module/map/components/add-customer-drawer";
import {
  getCurrentPosition,
  GeoInsecureContextError,
  GeoPermissionError,
} from "@/module/map/lib/geo";
import { getGovernorateCenter } from "@/module/map/lib/tour-data";
import { RejectReasonDialog } from "@/module/orders/components/reject-reason-dialog";
import { useRejectCustomerRequestMutation } from "@/module/orders/hooks";
import type { RejectCustomerRequestPayload } from "@/module/orders/types";
import { LocationConfirmDialog } from "@/module/stores/components/detail/location-confirm-dialog";
import { LocationPickerDialog } from "@/module/stores/components/detail/location-picker-dialog";
import { WorkDaysDialog } from "@/module/stores/components/detail/store-detail-header";
import { NewTransferForm } from "@/module/warehouse-requests/components/new-transfer-form";
import type { CreateStockTransferPayload } from "@/module/warehouse-requests/types";

/** Kinds that re-open a real form pre-filled with the queued data. The rest retry as-is. */
const EDITABLE_KINDS = new Set([
  "create_sales_invoice",
  "create_payment",
  "create_stock_transfer",
  "create_customer",
  "update_customer",
  "issue_return_invoice",
  "reject_customer_request",
]);

export function hasOutboxEditor(item: OutboxItem): boolean {
  return EDITABLE_KINDS.has(item.kind);
}

interface EditorProps {
  item: OutboxItem;
  onClose: () => void;
}

/**
 * Re-opens the SAME form the rep originally used, pre-filled with the queued
 * data. Submitting it sends a fresh request (new Idempotency-Key) and — via
 * `replacesOutboxId` — removes the old outbox item once that request is
 * accepted or safely re-queued. Closing it without submitting changes nothing.
 */
export function OutboxItemEditor({ item, onClose }: EditorProps) {
  switch (item.kind) {
    case "create_sales_invoice":
      return <InvoiceEditor item={item} onClose={onClose} />;
    case "create_payment":
      return <PaymentEditor item={item} onClose={onClose} />;
    case "create_stock_transfer":
      return <TransferEditor item={item} onClose={onClose} />;
    case "create_customer":
      return <CustomerCreateEditor item={item} onClose={onClose} />;
    case "update_customer":
      return <CustomerUpdateEditor item={item} onClose={onClose} />;
    case "issue_return_invoice":
      return <ReturnIssueEditor item={item} onClose={onClose} />;
    case "reject_customer_request":
      return <RejectRequestEditor item={item} onClose={onClose} />;
    default:
      return null;
  }
}

/* ───────────────────────────── invoice ───────────────────────────── */

function InvoiceEditor({ item, onClose }: EditorProps) {
  const payload = item.payload as CreateSalesInvoicePayload;
  return (
    <CreateInvoiceDrawer
      open
      onOpenChange={(open) => !open && onClose()}
      customerId={payload.customer_id}
      title="تعديل فاتورة معلّقة"
      replacesOutboxId={item.id}
      initial={{
        lines: payload.lines.map((l) => ({
          product_id: l.product_id,
          quantity: String(l.quantity),
        })),
        paymentAmount: payload.payment_amount,
        notes: payload.notes,
        requestId: payload.fulfils_request_ids?.[0],
      }}
    />
  );
}

/* ───────────────────────────── payment ───────────────────────────── */

function PaymentEditor({ item, onClose }: EditorProps) {
  const payload = item.payload as CreatePaymentPayload;
  const detail = useGetSalesInvoiceDetailQuery(payload.sales_invoice);
  const invoice = detail.data?.data?.invoice;
  // The invoice header is only context; if it can't be loaded (offline) the
  // payment can still be edited and re-sent.
  const target: PaymentTarget = invoice ?? {
    id: payload.sales_invoice,
    number: `#${payload.sales_invoice}`,
    customer_name: "",
    balance_due: "",
  };
  return (
    <RecordPaymentDialog
      invoice={target}
      open
      onOpenChange={(open) => !open && onClose()}
      initialAmount={payload.amount}
      initialNote={payload.note}
      replacesOutboxId={item.id}
    />
  );
}

/* ───────────────────────────── stock transfer ───────────────────────────── */

function TransferEditor({ item, onClose }: EditorProps) {
  const payload = item.payload as CreateStockTransferPayload;
  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader className="flex flex-row items-center justify-between gap-3 px-5">
          <DrawerTitle className="text-base">تعديل طلب بضاعة معلّق</DrawerTitle>
          <DrawerClose>
            <Button variant="secondary" size="icon-sm">
              <IconRenderer name="close_outlined" className="h-3 w-3" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <NewTransferForm
            initial={{
              lines: payload.lines.map((l) => ({
                product_id: l.product_id,
                quantity: String(l.quantity),
              })),
              pickupHours: payload.pickup_within_hours,
            }}
            replacesOutboxId={item.id}
            onDone={onClose}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ───────────────────────────── customers ───────────────────────────── */

/** The add/edit-customer drawer plus the map pickers it needs, wired the way the store screens wire them. */
function CustomerDrawerEditor({
  item,
  onClose,
  customer,
  initialValues,
  initialPoint,
  title,
}: EditorProps & {
  customer?: Customer;
  initialValues?: Partial<CreateCustomerValues>;
  initialPoint: [number, number] | null;
  title: string;
}) {
  const governorate = useAuthStore((s) => s.rep?.company?.governorate);
  const [open, setOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The drawer calls onOpenChange(false) *before* onPickLocation() when the
  // rep goes to pick a point, so "closed" alone can't tell the two apart.
  const pickingRef = useRef(false);
  const [pickedPoint, setPickedPoint] = useState<[number, number] | null>(initialPoint);
  const [locLoading, setLocLoading] = useState(false);

  const useMyLocation = useCallback(() => {
    setLocLoading(true);
    getCurrentPosition()
      .then((pos) => setPickedPoint(pos))
      .catch((error: unknown) => {
        if (error instanceof GeoPermissionError) {
          toast.error("يُرجى السماح بالوصول إلى الموقع لتحديد موقع المحل.");
        } else if (error instanceof GeoInsecureContextError) {
          toast.error("تحديد الموقع متاح فقط عبر اتصال آمن (HTTPS).");
        } else {
          toast.error("تعذّر تحديد الموقع الحالي. يُرجى المحاولة مرة أخرى.");
        }
      })
      .finally(() => setLocLoading(false));
  }, []);

  return (
    <>
      <AddCustomerDrawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Closing to open the map picker must not end the edit.
          if (!next) {
            setTimeout(() => {
              if (!pickingRef.current) onClose();
            }, 0);
          }
        }}
        customer={customer}
        title={title}
        initialValues={initialValues}
        replacesOutboxId={item.id}
        pickedPoint={pickedPoint}
        onPickLocation={() => {
          pickingRef.current = true;
          setPickerOpen(true);
        }}
        onUseMyLocation={useMyLocation}
        isLoadingLocation={locLoading}
        onSuccess={onClose}
      />

      {pickerOpen && (
        <LocationPickerDialog
          open={pickerOpen}
          onOpenChange={(next) => {
            setPickerOpen(next);
            if (!next) {
              pickingRef.current = false;
              setOpen(true);
            }
          }}
          initialPoint={pickedPoint ?? getGovernorateCenter(governorate)}
          onConfirm={(lat, lng) => setPickedPoint([lat, lng])}
        />
      )}
    </>
  );
}

function CustomerCreateEditor({ item, onClose }: EditorProps) {
  const data = item.payload as CreateCustomerRequest;
  const point: [number, number] | null =
    data.latitude != null && data.longitude != null ? [data.latitude, data.longitude] : null;
  return (
    <CustomerDrawerEditor
      item={item}
      onClose={onClose}
      title="تعديل محل معلّق"
      initialPoint={point}
      initialValues={{
        name: data.name,
        phone: data.phone,
        email: data.email ?? "",
        address: data.address ?? "",
        work_days: data.work_days as CreateCustomerValues["work_days"],
      }}
    />
  );
}

function CustomerUpdateEditor({ item, onClose }: EditorProps) {
  const { customerId, data } = item.payload as { customerId: number; data: UpdateCustomerRequest };
  const keys = Object.keys(data);
  const onlyWorkDays = keys.length === 1 && keys[0] === "work_days";
  const onlyLocation =
    keys.length === 2 && data.latitude != null && data.longitude != null;

  if (onlyWorkDays) {
    return (
      <WorkDaysDialog
        open
        onOpenChange={(open) => !open && onClose()}
        customerId={customerId}
        workDays={data.work_days ?? []}
        replacesOutboxId={item.id}
      />
    );
  }

  if (onlyLocation) {
    return (
      <LocationConfirmDialog
        open
        onOpenChange={(open) => !open && onClose()}
        customerId={customerId}
        initialPoint={[data.latitude as number, data.longitude as number]}
        replacesOutboxId={item.id}
      />
    );
  }

  return <CustomerFullUpdateEditor item={item} onClose={onClose} customerId={customerId} data={data} />;
}

function CustomerFullUpdateEditor({
  item,
  onClose,
  customerId,
  data,
}: EditorProps & { customerId: number; data: UpdateCustomerRequest }) {
  const query = useGetCustomerByIdQuery(customerId);
  const server = query.data?.data?.customer;

  if (!server) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المحل</DialogTitle>
            <DialogDescription>
              {query.isError
                ? "تعذّر تحميل بيانات المحل — تحقق من الاتصال وحاول مرة أخرى."
                : "جارٍ تحميل بيانات المحل…"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Keep the server's own location (a customer that already has one can't be
  // moved); only carry the rep's queued address / work days on top of it.
  const merged: Customer = {
    ...server,
    address: data.address ?? server.address,
    work_days: data.work_days ?? server.work_days,
  };
  const serverHasLocation = server.latitude != null && server.longitude != null;
  const point: [number, number] | null = serverHasLocation
    ? [server.latitude as number, server.longitude as number]
    : data.latitude != null && data.longitude != null
      ? [data.latitude, data.longitude]
      : null;

  return (
    <CustomerDrawerEditor
      item={item}
      onClose={onClose}
      customer={merged}
      title="تعديل بيانات المحل"
      initialPoint={point}
    />
  );
}

/* ───────────────────────────── return issue ───────────────────────────── */

function ReturnIssueEditor({ item, onClose }: EditorProps) {
  const { id, payload } = item.payload as { id: number; payload?: IssueReturnInvoicePayload };
  const issue = useIssueReturnInvoiceMutation({
    replacesOutboxId: item.id,
    onSuccess: onClose,
    onQueued: onClose,
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>ترحيل المرتجع رقم {id}</DialogTitle>
          <DialogDescription>
            اختر طريقة استرجاع المبلغ الزائد إن لزم، أو أعد الترحيل كما هو.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {REFUND_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={issue.isPending}
              onClick={() => issue.mutate({ id, payload: { refund_method: option.value } })}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold disabled:opacity-50"
            >
              {option.label}
              {payload?.refund_method === option.value && (
                <IconRenderer name="tick_outlined" className="size-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={issue.isPending}
            onClick={() => issue.mutate({ id, payload })}
          >
            إعادة الترحيل كما هو
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────────── reject request ───────────────────────────── */

function RejectRequestEditor({ item, onClose }: EditorProps) {
  const { requestId, payload } = item.payload as {
    requestId: number;
    payload?: RejectCustomerRequestPayload;
  };
  const reject = useRejectCustomerRequestMutation({
    replacesOutboxId: item.id,
    onSuccess: onClose,
    onQueued: onClose,
  });

  return (
    <RejectReasonDialog
      open
      onOpenChange={(open) => !open && onClose()}
      isPending={reject.isPending}
      initialReason={payload?.reason}
      onConfirm={(reason) => reject.mutate({ requestId, payload: { reason } })}
    />
  );
}
