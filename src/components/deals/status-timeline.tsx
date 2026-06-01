import { STATUS_LABEL, STATUS_COLOR } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { DealStatusHistoryRow } from "@/lib/types";

type HistoryItem = DealStatusHistoryRow & { changed_by_name: string | null };

/**
 * 進捗タイムライン。`showActor` を false にすると担当者名を伏せる
 * （顧客共有ページ用）。
 */
export function StatusTimeline({
  history,
  showActor = true,
}: {
  history: HistoryItem[];
  showActor?: boolean;
}) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">履歴はまだありません。</p>;
  }

  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {history.map((h) => {
        const c = STATUS_COLOR[h.to_status];
        return (
          <li key={h.id} className="relative">
            <span
              className={`absolute -left-[1.46rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${c.dot}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-800">
                {STATUS_LABEL[h.to_status]}
              </span>
              {h.from_status && (
                <span className="text-xs text-slate-400">
                  （{STATUS_LABEL[h.from_status]} から）
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateTime(h.changed_at)}
              {showActor && h.changed_by_name && ` ・ ${h.changed_by_name}`}
            </p>
            {h.note && (
              <p className="mt-1 text-sm text-slate-600">{h.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
