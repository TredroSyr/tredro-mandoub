import { StockTransferStatus } from "../types";
import { TRANSFER_STATUS_META } from "../lib/utils";

export function TransferStatusBadge({ status }: { status: StockTransferStatus }) {
  const meta = TRANSFER_STATUS_META[status];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span>;
}
