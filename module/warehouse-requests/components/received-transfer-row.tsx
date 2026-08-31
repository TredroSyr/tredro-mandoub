import { StockTransfer } from "../types";
import { formatTransferDate, formatTransferMoney } from "../lib/utils";

export function ReceivedTransferRow({ transfer }: { transfer: StockTransfer }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="min-w-0">
        <p className="truncate font-mono text-[11px] font-bold">{transfer.number}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {formatTransferDate(transfer.received_at ?? transfer.requested_at)}
        </p>
      </div>
      <span className="font-mono text-[11px]">{formatTransferMoney(transfer.estimated_total)}</span>
    </div>
  );
}
