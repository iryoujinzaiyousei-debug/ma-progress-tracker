"use client";

import Link from "next/link";
import type { DealWithAssignees } from "@/lib/deals";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";
import { WarningBadges } from "./warning-badges";
import { getDealWarnings } from "@/lib/constants";
import { formatYenShort, formatDate, formatRelativeDays } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DealsTable({ deals }: { deals: DealWithAssignees[] }) {
  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">案件がありません。</p>
        <Link
          href="/deals/new"
          className="mt-2 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          新規案件を作成する
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="min-w-48">案件名</TableHead>
            <TableHead>種別</TableHead>
            <TableHead>売主</TableHead>
            <TableHead>買主</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>担当</TableHead>
            <TableHead className="text-right">譲渡価格</TableHead>
            <TableHead>次回アクション</TableHead>
            <TableHead>予定日</TableHead>
            <TableHead>最終更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const warnings = getDealWarnings(deal);
            const stale = warnings.includes("stale");
            const primary =
              deal.assignees.find((a) => a.is_primary) ?? deal.assignees[0];
            return (
              <TableRow
                key={deal.id}
                className={`cursor-pointer ${stale ? "bg-yellow-50/60" : ""}`}
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="block hover:underline"
                  >
                    {deal.deal_name}
                  </Link>
                  <WarningBadges deal={deal} className="mt-1" />
                </TableCell>
                <TableCell>
                  <TypeBadge type={deal.deal_type} />
                </TableCell>
                <TableCell className="max-w-40 truncate text-sm text-slate-600">
                  {deal.seller_company ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-40 truncate text-sm text-slate-600">
                  {deal.buyer_company ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={deal.current_status} />
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {primary ? (
                    <span>
                      {primary.name}
                      {deal.assignees.length > 1 && (
                        <span className="text-slate-400">
                          {" "}
                          +{deal.assignees.length - 1}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatYenShort(deal.transfer_price)}
                </TableCell>
                <TableCell className="max-w-48 truncate text-sm text-slate-600">
                  {deal.next_action ?? (
                    <span className="text-slate-400">未記入</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {formatDate(deal.scheduled_date)}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {formatRelativeDays(deal.updated_at)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
