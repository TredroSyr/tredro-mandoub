/**
 * Maps a notification's event_key (+ payload) to the screen it should open
 * (backend §7). When the payload carries the related record's id, the target
 * list page is asked to open that item's detail drawer directly via a query
 * param instead of just landing on the plain list.
 */

const toId = (value: unknown): number | undefined => {
  const id = Number(value);
  return Number.isFinite(id) ? id : undefined;
};

export const resolveNotificationUrl = (
  eventKey: string | undefined,
  payload?: Record<string, unknown>,
): string => {
  switch (eventKey) {
    case "stock_transfer.requested":
    case "stock_transfer.dispatched":
    case "stock_transfer.modified":
    case "stock_transfer.confirmed":
    case "stock_transfer.received":
    case "stock_transfer.cancelled": {
      const id = toId(payload?.stock_transfer_id);
      return id !== undefined ? `/my-orders?transferId=${id}` : "/my-orders";
    }
    case "customer_request.created":
    case "customer_request.accepted":
    case "customer_request.rejected": {
      const id = toId(payload?.customer_request_id);
      return id !== undefined ? `/orders?requestId=${id}` : "/orders";
    }
    case "sales_invoice.overdue": {
      const id = toId(payload?.sales_invoice_id);
      return id !== undefined ? `/sales/overdue?invoiceId=${id}` : "/sales/overdue";
    }
    default:
      return "/notifications";
  }
};
