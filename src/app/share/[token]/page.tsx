import { notFound } from "next/navigation";
import { getSharedDealByToken } from "@/lib/share";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  STATUS_COLOR,
  DEAL_TYPE_LABEL,
  isTerminalStatus,
} from "@/lib/constants";
import { formatYen, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

// 顧客向けに見せる進捗パイプライン（分岐 lost/on_hold を除く）
const PIPELINE = STATUS_ORDER.slice(0, 12);

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSharedDealByToken(token);

  if (!result) notFound();
  const { deal, history } = result;

  const currentIndex = PIPELINE.indexOf(deal.current_status);
  const isBranch =
    isTerminalStatus(deal.current_status) && currentIndex === -1; // lost / on_hold

  return (
    <main className="min-h-dvh bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* ヘッダ */}
        <header className="mb-8">
          <p className="text-xs font-medium tracking-widest text-slate-400">
            進捗状況のご共有
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {deal.deal_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {DEAL_TYPE_LABEL[deal.deal_type]}
          </p>
        </header>

        {/* 現在のステータス */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-400">現在のステータス</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${STATUS_COLOR[deal.current_status].dot}`}
            />
            <span className="text-lg font-semibold text-slate-900">
              {STATUS_LABEL[deal.current_status]}
            </span>
          </div>

          {!isBranch && (
            <div className="mt-6">
              {/* 進捗ステッパー */}
              <ol className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {PIPELINE.map((s, i) => {
                  const done = i < currentIndex;
                  const current = i === currentIndex;
                  return (
                    <li key={s} className="flex items-center gap-2">
                      <span
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          done
                            ? "bg-emerald-500 text-white"
                            : current
                              ? "bg-slate-900 text-white"
                              : "bg-slate-200 text-slate-400",
                        ].join(" ")}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span
                        className={[
                          "text-xs",
                          current
                            ? "font-semibold text-slate-900"
                            : done
                              ? "text-slate-600"
                              : "text-slate-400",
                        ].join(" ")}
                      >
                        {STATUS_LABEL[s]}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {isBranch && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              本案件は現在「{STATUS_LABEL[deal.current_status]}」の状態です。
            </p>
          )}

          {deal.next_action && (
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  次のステップ
                </p>
                <p className="mt-0.5 text-sm text-slate-800">
                  {deal.next_action}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">予定日</p>
                <p className="mt-0.5 text-sm text-slate-800">
                  {formatDate(deal.scheduled_date)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 金額 */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            お見積り・金額
          </h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["譲渡価格", deal.transfer_price],
              ["着手金", deal.retainer_fee],
              ["成功報酬", deal.success_fee],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="rounded-lg bg-slate-50 px-4 py-3"
              >
                <dt className="text-xs text-slate-500">{label as string}</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                  {formatYen(value as number | null)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 共有メモ */}
        {deal.remarks_shared && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              ご連絡事項
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {deal.remarks_shared}
            </p>
          </section>
        )}

        {/* タイムライン（担当者名は非表示） */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            これまでの経緯
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">記録はまだありません。</p>
          ) : (
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    className={`absolute -left-[1.46rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${STATUS_COLOR[h.to_status].dot}`}
                  />
                  <p className="text-sm font-medium text-slate-800">
                    {STATUS_LABEL[h.to_status]}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(h.changed_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-slate-400">
          最終更新：{formatDate(deal.updated_at)}
        </footer>
      </div>
    </main>
  );
}
