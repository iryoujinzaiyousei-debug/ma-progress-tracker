import Link from "next/link";
import { getDashboardStats } from "@/lib/deals";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/deals/status-badge";
import {
  STATUS_ORDER,
  DEAL_TYPE_ORDER,
  DEAL_TYPE_LABEL,
  STATUS_LABEL,
  WARNING_LABEL,
  isTerminalStatus,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const { stats } = await getDashboardStats();
  const activeStatuses = STATUS_ORDER.filter((s) => !isTerminalStatus(s));
  const terminalStatuses = STATUS_ORDER.filter((s) => isTerminalStatus(s));
  const maxAssignee = Math.max(1, ...stats.byAssignee.map((a) => a.count));

  return (
    <>
      <PageHeader
        title="ダッシュボード"
        description="種別別・担当者別・ステータス別の件数と、棚卸しの起点になる警告サマリ。"
        action={
          <Button render={<Link href="/deals" />} variant="outline">
            案件一覧へ
          </Button>
        }
      />

      {/* 警告サマリ */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="総案件数" value={stats.total} accent="text-slate-900" />
        <SummaryCard
          label={`停滞（${WARNING_LABEL.stale}）`}
          value={stats.warnings.stale}
          accent="text-yellow-600"
        />
        <SummaryCard
          label={`期限超過（${WARNING_LABEL.overdue}）`}
          value={stats.warnings.overdue}
          accent="text-rose-600"
        />
        <SummaryCard
          label={`未記入（${WARNING_LABEL.incomplete}）`}
          value={stats.warnings.incomplete}
          accent="text-slate-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* 種別別 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            案件種別別
          </h2>
          <ul className="space-y-3">
            {DEAL_TYPE_ORDER.map((t) => {
              const count = stats.byType[t];
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <li key={t}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{DEAL_TYPE_LABEL[t]}</span>
                    <span className="tabular-nums text-slate-500">{count}件</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-800"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 担当者別 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            担当者別
          </h2>
          {stats.byAssignee.length === 0 ? (
            <p className="text-sm text-slate-500">担当者の割当がありません。</p>
          ) : (
            <ul className="space-y-3">
              {stats.byAssignee.map((a) => (
                <li key={a.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{a.name}</span>
                    <span className="tabular-nums text-slate-500">
                      {a.count}件
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${(a.count / maxAssignee) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ステータス別（進行中） */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            ステータス別
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...activeStatuses, ...terminalStatuses].map((s) => (
              <div
                key={s}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <StatusBadge status={s} />
                <span className="tabular-nums text-sm font-medium text-slate-700">
                  {stats.byStatus[s]}
                </span>
              </div>
            ))}
          </div>
          <p className="sr-only">
            {STATUS_LABEL.inquiry}から{STATUS_LABEL.handover}までの件数集計
          </p>
        </section>
      </div>
    </>
  );
}
