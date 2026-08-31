import { CustomerRequestStatus } from "../types";
import { REQUEST_STATUS_META } from "../lib/utils";

export function RequestStatusBadge({ status }: { status: CustomerRequestStatus }) {
  const meta = REQUEST_STATUS_META[status];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span>;
}
