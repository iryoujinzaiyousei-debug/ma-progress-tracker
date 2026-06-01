"use client";

import { useState } from "react";
import Link from "next/link";
import type { CustomerSummary } from "@/lib/customers";
import type { BuyerRow } from "@/lib/types";
import { CustomersTable } from "./customers-table";
import { BuyersTable } from "@/components/buyers/buyers-table";
import { Button } from "@/components/ui/button";

type Role = "seller" | "buyer";

export function CustomersTabs({
  sellers,
  buyers,
}: {
  sellers: CustomerSummary[];
  buyers: BuyerRow[];
}) {
  const [role, setRole] = useState<Role>("seller");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm"
          role="tablist"
          aria-label="顧客の役割"
        >
          {(
            [
              ["seller", "売主", sellers.length],
              ["buyer", "買主", buyers.length],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={role === value}
              onClick={() => setRole(value)}
              className={[
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                role === value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
              <span
                className={
                  role === value
                    ? "ml-1.5 text-slate-300"
                    : "ml-1.5 text-slate-400"
                }
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {role === "buyer" && (
          <Button render={<Link href="/buyers/new" />} size="sm">
            買いニーズを登録
          </Button>
        )}
      </div>

      {role === "seller" ? (
        <>
          <p className="text-xs text-slate-500">
            案件の売主社名から集約した売り手の取引先一覧です。
          </p>
          <CustomersTable customers={sellers} role="seller" />
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            登録済みの買い顧客と買いニーズ（譲渡スキーム・価格帯・エリア・業種）の一覧です。
          </p>
          {buyers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-sm text-slate-500">
                買い顧客がまだ登録されていません。
              </p>
              <Link
                href="/buyers/new"
                className="mt-2 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
              >
                買いニーズを登録する
              </Link>
            </div>
          ) : (
            <BuyersTable buyers={buyers} />
          )}
        </>
      )}
    </div>
  );
}
