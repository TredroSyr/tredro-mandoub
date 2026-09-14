import {
  createPayment,
  createReturnInvoice,
  createSalesInvoice,
  issueReturnInvoice,
} from "@/module/invoices/api";
import {
  createStockTransfer,
  receiveStockTransfer,
} from "@/module/warehouse-requests/api";
import { createCustomer } from "@/module/customers/api";
import {
  acceptCustomerRequest,
  rejectCustomerRequest,
} from "@/module/orders/api";
import type { OutboxItem } from "@/lib/db/outbox";

/**
 * Maps an outbox item's `kind` back to the API call that originally created
 * it, replayed with the exact same Idempotency-Key (`item.id`) so a retry
 * after a partial failure can never double-create the underlying record.
 *
 * Only "create_sales_invoice" is wired end-to-end from a mutation hook today
 * (see module/invoices/hooks's useCreateSalesInvoiceMutation) — the other
 * kinds are defined here ready to extend the same way, one hook at a time.
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

    case "create_return_invoice":
      await createReturnInvoice(
        item.payload as Parameters<typeof createReturnInvoice>[0],
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
