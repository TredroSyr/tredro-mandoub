import { StockTransferLine } from "../types";
import { formatTransferQuantity, translateUnitName } from "../lib/utils";

// dir="rtl" يجعل الكمية الأصلية على اليمين والمعدّلة على اليسار، فيتجه السهم من الأصل إلى المعدّل.
export function QuantityChange({
  line,
  className,
}: {
  line: StockTransferLine;
  className?: string;
}) {
  return (
    <span
      dir="rtl"
      className={`inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono font-bold text-primary ${className ?? ""}`}
    >
      <span dir="ltr">{formatTransferQuantity(line.requested_qty)}</span>
      <span aria-hidden>←</span>
      <span dir="ltr">{formatTransferQuantity(line.effective_qty)}</span>
      <span>{translateUnitName(line.unit_name)}</span>
    </span>
  );
}
