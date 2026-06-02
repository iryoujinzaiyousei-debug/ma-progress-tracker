import {
  PIPELINE_STATUSES,
  STATUS_LABEL,
  type DealStatus,
} from "@/lib/constants";

// 顧客共有ページと同じ「進行パイプライン」（分岐 lost/on_hold を除く）
const PIPELINE = PIPELINE_STATUSES; // 提案中..引渡

/**
 * 案件の進捗を横軸で可視化するプログレスバー。
 * 進行中はセグメント（完了＝緑 / 現在＝濃色 / 未到達＝薄灰）、
 * 失注・保留は「分岐」として専用表示にする。
 */
export function DealProgressBar({ status }: { status: DealStatus }) {
  const idx = PIPELINE.indexOf(status);
  const isBranch = idx === -1; // lost / on_hold

  if (isBranch) {
    const isLost = status === "lost";
    return (
      <div className="space-y-2">
        <div
          className={`h-2 w-full rounded-full ${isLost ? "bg-rose-400" : "bg-zinc-300"}`}
          role="img"
          aria-label={`進捗：${STATUS_LABEL[status]}`}
        />
        <div className="flex items-center justify-between text-xs">
          <span
            className={`font-medium ${isLost ? "text-rose-600" : "text-zinc-500"}`}
          >
            {STATUS_LABEL[status]}
          </span>
          <span className="text-slate-400">進行ラインから分岐</span>
        </div>
      </div>
    );
  }

  const total = PIPELINE.length;
  const step = idx + 1;
  const next = idx < total - 1 ? PIPELINE[idx + 1] : null;
  const isComplete = status === "handover";

  return (
    <div className="space-y-2">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`進捗：${STATUS_LABEL[status]}（${step}/${total}）`}
      >
        {PIPELINE.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div
              key={s}
              title={STATUS_LABEL[s]}
              className={[
                "h-2 flex-1 rounded-full transition-colors",
                done
                  ? "bg-emerald-500"
                  : current
                    ? isComplete
                      ? "bg-emerald-600"
                      : "bg-slate-900"
                    : "bg-slate-200",
              ].join(" ")}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">
          {STATUS_LABEL[status]}
          <span className="ml-1 text-slate-400">
            （{step}/{total}）
          </span>
        </span>
        {next ? (
          <span className="text-slate-400">次：{STATUS_LABEL[next]}</span>
        ) : (
          <span className="font-medium text-emerald-600">完了</span>
        )}
      </div>
    </div>
  );
}
