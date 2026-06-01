import Link from "next/link";
import type { BuyerRow } from "@/lib/types";
import { TypeBadge } from "@/components/deals/type-badge";
import {
  BUYER_STATUS_LABEL,
  BUYER_STATUS_COLOR,
} from "@/lib/constants";
import { formatBudgetRange, formatRelativeDays } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BuyerStatusBadge({ status }: { status: BuyerRow["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${BUYER_STATUS_COLOR[status]}`}
    >
      {BUYER_STATUS_LABEL[status]}
    </span>
  );
}

export function BuyersTable({ buyers }: { buyers: BuyerRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="min-w-44">社名 / 名義</TableHead>
            <TableHead>状態</TableHead>
            <TableHead>希望スキーム</TableHead>
            <TableHead>希望価格帯</TableHead>
            <TableHead className="min-w-40">希望エリア</TableHead>
            <TableHead>業種・事業領域</TableHead>
            <TableHead>更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buyers.map((b) => (
            <TableRow key={b.id} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link
                  href={`/buyers/${b.id}`}
                  className="block hover:underline"
                >
                  {b.company_name}
                </Link>
                {b.contact_name && (
                  <span className="text-xs text-slate-400">
                    {b.contact_name}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <BuyerStatusBadge status={b.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {b.desired_schemes.length === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    b.desired_schemes.map((s) => (
                      <TypeBadge key={s} type={s} />
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm tabular-nums text-slate-700">
                {formatBudgetRange(b.budget_min, b.budget_max)}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {b.areas.length > 0 ? b.areas.join("、") : "—"}
              </TableCell>
              <TableCell className="max-w-44 truncate text-sm text-slate-600">
                {b.industries ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {formatRelativeDays(b.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
