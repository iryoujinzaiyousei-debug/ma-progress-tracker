import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuyerById } from "@/lib/buyers";
import { getCustomerDetail } from "@/lib/customers";
import { TypeBadge } from "@/components/deals/type-badge";
import { DealsTable } from "@/components/deals/deals-table";
import { BuyerStatusBadge } from "@/components/buyers/buyers-table";
import { DeleteBuyerButton } from "@/components/buyers/delete-buyer-button";
import { Button } from "@/components/ui/button";
import { formatBudgetRange, formatDate } from "@/lib/format";

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

export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyerById(id);
  if (!buyer) notFound();

  // 社名が一致する案件（買主として関与）を紐づけ表示
  const related = await getCustomerDetail(buyer.company_name);
  const relatedDeals = related?.asBuyer ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ヘッダ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href="/customers"
            className="text-xs text-slate-500 underline-offset-4 hover:underline"
          >
            ← 顧客一覧（買主）
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {buyer.company_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <BuyerStatusBadge status={buyer.status} />
            {buyer.desired_schemes.map((s) => (
              <TypeBadge key={s} type={s} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={`/buyers/${buyer.id}/edit`} />}
            variant="outline"
            size="sm"
          >
            編集
          </Button>
          <DeleteBuyerButton buyerId={buyer.id} name={buyer.company_name} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* 買いニーズ */}
          <Panel title="買いニーズ">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="希望する譲渡スキーム">
                {buyer.desired_schemes.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {buyer.desired_schemes.map((s) => (
                      <TypeBadge key={s} type={s} />
                    ))}
                  </div>
                )}
              </Field>
              <Field label="希望価格帯">
                <span className="tabular-nums">
                  {formatBudgetRange(buyer.budget_min, buyer.budget_max)}
                </span>
              </Field>
              <Field label="希望エリア">
                {buyer.areas.length > 0 ? buyer.areas.join("、") : "—"}
              </Field>
              <Field label="希望業種・事業領域">
                {buyer.industries ?? "—"}
              </Field>
            </dl>
          </Panel>

          {/* 備考 */}
          <Panel title="備考・条件メモ">
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {buyer.notes ?? "—"}
            </p>
          </Panel>

          {/* 紐づく案件 */}
          <Panel title={`関連案件（買主として ${relatedDeals.length} 件）`}>
            {relatedDeals.length === 0 ? (
              <p className="text-sm text-slate-500">
                この買い顧客が買主として登録された案件はまだありません。
                <br />
                案件の「買主社名」を「{buyer.company_name}
                」にすると、ここに表示されます。
              </p>
            ) : (
              <DealsTable deals={relatedDeals} />
            )}
          </Panel>
        </div>

        {/* サイド */}
        <div className="space-y-5">
          <Panel title="連絡先">
            <dl className="space-y-3">
              <Field label="担当者名">{buyer.contact_name ?? "—"}</Field>
              <Field label="メール">
                {buyer.contact_email ? (
                  <a
                    href={`mailto:${buyer.contact_email}`}
                    className="text-slate-800 underline-offset-4 hover:underline"
                  >
                    {buyer.contact_email}
                  </a>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="電話">{buyer.contact_phone ?? "—"}</Field>
            </dl>
          </Panel>

          <Panel title="情報">
            <dl className="space-y-3">
              <Field label="登録日">{formatDate(buyer.created_at)}</Field>
              <Field label="最終更新">{formatDate(buyer.updated_at)}</Field>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
