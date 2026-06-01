import { STATUS_COLOR, STATUS_LABEL, type DealStatus } from "@/lib/constants";

export function StatusBadge({
  status,
  className = "",
}: {
  status: DealStatus;
  className?: string;
}) {
  const c = STATUS_COLOR[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
