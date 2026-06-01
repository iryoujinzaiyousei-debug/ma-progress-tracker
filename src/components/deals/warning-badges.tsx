import {
  WARNING_COLOR,
  WARNING_LABEL,
  getDealWarnings,
  type DealStatus,
  type DealWarning,
} from "@/lib/constants";

type DealLike = {
  current_status: DealStatus;
  updated_at: string;
  scheduled_date: string | null;
  next_action: string | null;
};

export function WarningBadges({
  deal,
  className = "",
}: {
  deal: DealLike;
  className?: string;
}) {
  const warnings = getDealWarnings(deal);
  if (warnings.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {warnings.map((w: DealWarning) => (
        <span
          key={w}
          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${WARNING_COLOR[w]}`}
        >
          {WARNING_LABEL[w]}
        </span>
      ))}
    </div>
  );
}
