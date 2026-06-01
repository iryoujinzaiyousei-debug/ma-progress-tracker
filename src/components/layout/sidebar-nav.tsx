"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/deals", label: "案件一覧" },
  { href: "/customers", label: "顧客一覧" },
  { href: "/deals/new", label: "新規案件" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="メインナビゲーション">
      {NAV.map((item) => {
        const active =
          item.href === "/deals"
            ? pathname === "/deals"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
