import { DEAL_TYPE_COLOR, DEAL_TYPE_LABEL, type DealType } from "@/lib/constants";

export function TypeBadge({ type }: { type: DealType }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${DEAL_TYPE_COLOR[type]}`}
    >
      {DEAL_TYPE_LABEL[type]}
    </span>
  );
}
