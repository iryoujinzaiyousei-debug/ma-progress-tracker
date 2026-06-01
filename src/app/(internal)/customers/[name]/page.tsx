import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/customers";
import { DealsTable } from "@/components/deals/deals-table";
import { formatYenShort } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const detail = await getCustomerDetail(name);

  if (!detail) notFound();
  const { summary, asSeller, asBuyer } = detail;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/customers"
          className="text-xs text-slate-500 underline-offset-4 hover:underline"
        >
          ← 顧客一覧
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {name}
        </h1>
        <p className="text-sm text-slate-500">
          この顧客が売主・買主として関わる案件
        </p>
      </div>

      {/* 集計 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label="案件数" value={summary.dealCount} />
        <Stat label="進行中" value={summary.activeCount} />
        <Stat label="成約" value={summary.wonCount} />
        <Stat label="失注" value={summary.lostCount} />
        <Stat
          label="譲渡価格合計"
          value={formatYenShort(summary.totalTransferPrice || null)}
        />
      </div>

      {/* 売主としての案件 */}
      {asSeller.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">
            売主としての案件（{asSeller.length}）
          </h2>
          <DealsTable deals={asSeller} />
        </section>
      )}

      {/* 買主としての案件 */}
      {asBuyer.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">
            買主としての案件（{asBuyer.length}）
          </h2>
          <DealsTable deals={asBuyer} />
        </section>
      )}
    </div>
  );
}
