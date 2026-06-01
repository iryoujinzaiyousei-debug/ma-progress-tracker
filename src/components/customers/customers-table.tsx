import Link from "next/link";
import type { CustomerSummary, CustomerRole } from "@/lib/customers";
import { formatYenShort, formatRelativeDays } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_HEADER: Record<CustomerRole, string> = {
  seller: "売主としての案件",
  buyer: "買主としての案件",
};

export function CustomersTable({
  customers,
  role,
}: {
  customers: CustomerSummary[];
  role: CustomerRole;
}) {
  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">
          {role === "seller" ? "売主" : "買主"}
          として登録された案件がありません。
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="min-w-48">顧客名</TableHead>
            <TableHead className="text-right">案件数</TableHead>
            <TableHead className="text-right">進行中</TableHead>
            <TableHead className="text-right">成約</TableHead>
            <TableHead className="text-right">失注</TableHead>
            <TableHead className="text-right">譲渡価格合計</TableHead>
            <TableHead>最終更新</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.name} className="cursor-pointer">
              <TableCell className="font-medium">
                <Link
                  href={`/customers/${encodeURIComponent(c.name)}`}
                  className="block hover:underline"
                  title={ROLE_HEADER[role]}
                >
                  {c.name}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {c.dealCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-slate-600">
                {c.activeCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700">
                {c.wonCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-rose-600">
                {c.lostCount || ""}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {formatYenShort(c.totalTransferPrice || null)}
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {formatRelativeDays(c.lastUpdated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
