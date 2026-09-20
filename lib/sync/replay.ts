import {
  createPayment,
  createSalesInvoice,
  issueReturnInvoice,
} from "@/module/invoices/api";
import {
  confirmStockTransfer,
  createStockTransfer,
  receiveStockTransfer,
  rejectStockTransfer,
} from "@/module/warehouse-requests/api";
import {
  createCustomer,
  updateCustomer,
  updateRepWorkDays,
} from "@/module/customers/api";
import {
  acceptCustomerRequest,
  rejectCustomerRequest,
} from "@/module/orders/api";
import type { OutboxItem } from "@/lib/db/outbox";

/**
 * Maps an outbox item's `kind` back to the API call that originally created
 * it, replayed with the same Idempotency-Key (`item.id`) where the endpoint
 * takes one, so a retry after a partial failure can't double-create the
 * underlying record.
 *
 * Every kind here is queued by the matching mutation hook (see runOrQueue in
 * lib/sync/queue-on-offline.ts) — keep the two in step when adding one.
 * Return-invoice creation is deliberately absent: it is a two-step flow that
 * can't be completed offline, so it is never queued.
 */
export async function replayOutboxItem(item: OutboxItem): Promise<void> {
  switch (item.kind) {
    case "create_sales_invoice":
      await createSalesInvoice(
        item.payload as Parameters<typeof createSalesInvoice>[0],
        item.id,
      );
      return;

    case "create_payment":
      await createPayment(
        item.payload as Parameters<typeof createPayment>[0],
        item.id,
      );
      return;

    case "issue_return_invoice": {
      const { id, payload } = item.payload as {
        id: number;
        payload?: Parameters<typeof issueReturnInvoice>[1];
      };
      await issueReturnInvoice(id, payload, item.id);
      return;
    }

    case "create_stock_transfer":
      await createStockTransfer(
        item.payload as Parameters<typeof createStockTransfer>[0],
        item.id,
      );
      return;

    case "receive_stock_transfer": {
      const { transferId } = item.payload as { transferId: number };
      await receiveStockTransfer(transferId, item.id);
      return;
    }

    case "confirm_stock_transfer": {
      const { transferId } = item.payload as { transferId: number };
      await confirmStockTransfer(transferId);
      return;
    }

    case "reject_stock_transfer": {
      const { transferId } = item.payload as { transferId: number };
      await rejectStockTransfer(transferId);
      return;
    }

    case "update_customer": {
      const { customerId, data } = item.payload as {
        customerId: number;
        data: Parameters<typeof updateCustomer>[1];
      };
      await updateCustomer(customerId, data);
      return;
    }

    case "update_rep_work_days":
      await updateRepWorkDays(
        item.payload as Parameters<typeof updateRepWorkDays>[0],
      );
      return;

    case "create_customer":
      await createCustomer(
        item.payload as Parameters<typeof createCustomer>[0],
        item.id,
      );
      return;

    case "accept_customer_request": {
      const { requestId } = item.payload as { requestId: number };
      await acceptCustomerRequest(requestId, item.id);
      return;
    }

    case "reject_customer_request": {
      const { requestId, payload } = item.payload as {
        requestId: number;
        payload?: Parameters<typeof rejectCustomerRequest>[1];
      };
      await rejectCustomerRequest(requestId, payload, item.id);
      return;
    }

    default:
      throw new Error(`Unknown outbox item kind: ${item.kind}`);
  }
}
