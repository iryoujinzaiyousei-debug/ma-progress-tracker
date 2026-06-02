import Link from "next/link";
import { notFound } from "next/navigation";
import { getDealById, getDealHistory } from "@/lib/deals";
import { getDealDocuments } from "@/lib/documents";
import { SUMMARY_CATEGORY } from "@/lib/constants";
import { DocumentsPanel } from "@/components/deals/documents-panel";
import { SummaryPanel } from "@/components/deals/summary-panel";
import { StatusBadge } from "@/components/deals/status-badge";
import { DealProgressBar } from "@/components/deals/deal-progress-bar";
import { TypeBadge } from "@/components/deals/type-badge";
import { WarningBadges } from "@/components/deals/warning-badges";
import { FlowDiagram } from "@/components/deals/flow-diagram";
import { StatusTimeline } from "@/components/deals/status-timeline";
import { SharePanel } from "@/components/deals/share-panel";
import { DeleteDealButton } from "@/components/deals/delete-deal-button";
import { Button } from "@/components/ui/button";
import { formatYen, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function CompanyLink({ name }: { name: string | null }) {
  if (!name) return <span className="text-slate-400">—</span>;
  return (
    <Link
      href={`/customers/${encodeURIComponent(name)}`}
      className="text-slate-800 underline-offset-4 hover:text-slate-950 hover:underline"
    >
      {name}
    </Link>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deal, history, documents] = await Promise.all([
    getDealById(id),
    getDealHistory(id),
    getDealDocuments(id),
  ]);

  if (!deal) notFound();

  const primary = deal.assignees.find((a) => a.is_primary);
  const summaryDocs = documents.filter((d) => d.category === SUMMARY_CATEGORY);
  const otherDocs = documents.filter((d) => d.category !== SUMMARY_CATEGORY);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ヘッダ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/deals"
            className="text-xs text-slate-500 underline-offset-4 hover:underline"
          >
            ← 案件一覧
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {deal.deal_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={deal.deal_type} />
            <StatusBadge status={deal.current_status} />
            <WarningBadges deal={deal} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={`/deals/${deal.id}/edit`} />}
            variant="outline"
            size="sm"
          >
            編集
          </Button>
          <DeleteDealButton dealId={deal.id} dealName={deal.deal_name} />
        </div>
      </div>

      {/* 進捗バー（横軸可視化） */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <DealProgressBar status={deal.current_status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* 概要書（商流の上） */}
          <Panel title="概要書">
            <SummaryPanel dealId={deal.id} documents={summaryDocs} />
          </Panel>

          {/* 商流 */}
          <Panel title="商流">
            <FlowDiagram
              referrer={deal.referrer_company}
              referred={deal.referred_company}
            />
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Field label="売主社名">
                <CompanyLink name={deal.seller_company} />
              </Field>
              <Field label="買主社名">
                <CompanyLink name={deal.buyer_company} />
              </Field>
            </dl>
          </Panel>

          {/* 進捗 */}
          <Panel title="進捗">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="次回アクション">
                {deal.next_action ?? (
                  <span className="text-yellow-700">未記入</span>
                )}
              </Field>
              <Field label="予定日">{formatDate(deal.scheduled_date)}</Field>
            </dl>
          </Panel>

          {/* 金額 */}
          <Panel title="金額（顧客共有対象）">
            <dl className="grid grid-cols-3 gap-4">
              <Field label="譲渡価格">
                <span className="tabular-nums">
                  {formatYen(deal.transfer_price)}
                </span>
              </Field>
              <Field label="着手金">
                <span className="tabular-nums">
                  {formatYen(deal.retainer_fee)}
                </span>
              </Field>
              <Field label="成功報酬">
                <span className="tabular-nums">
                  {formatYen(deal.success_fee)}
                </span>
              </Field>
            </dl>
          </Panel>

          {/* 備考 */}
          <Panel title="備考">
            <div className="space-y-4">
              <Field label="社内用メモ（顧客非表示）">
                <p className="whitespace-pre-wrap">
                  {deal.remarks_internal ?? "—"}
                </p>
              </Field>
              <Field label="顧客共有用メモ">
                <p className="whitespace-pre-wrap">
                  {deal.remarks_shared ?? "—"}
                </p>
              </Field>
            </div>
          </Panel>

          {/* 資料・書類 */}
          <Panel title="資料・書類">
            <DocumentsPanel dealId={deal.id} documents={otherDocs} />
          </Panel>

          {/* 進捗履歴 */}
          <Panel title="進捗履歴">
            <StatusTimeline history={history} />
          </Panel>
        </div>

        {/* サイド */}
        <div className="space-y-5">
          <Panel title="担当者">
            {deal.assignees.length === 0 ? (
              <p className="text-sm text-slate-500">未割当</p>
            ) : (
              <ul className="space-y-2">
                {deal.assignees.map((a) => (
                  <li
                    key={a.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-800">{a.name}</span>
                    {a.is_primary && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        主担当
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {primary && (
              <p className="mt-3 text-xs text-slate-400">
                主担当：{primary.name}
              </p>
            )}
          </Panel>

          <Panel title="共有設定">
            <SharePanel
              dealId={deal.id}
              shareToken={deal.share_token}
              initialEnabled={deal.share_enabled}
            />
          </Panel>

          <Panel title="情報">
            <dl className="space-y-3">
              <Field label="登録日">{formatDate(deal.created_at)}</Field>
              <Field label="最終更新">{formatDate(deal.updated_at)}</Field>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
