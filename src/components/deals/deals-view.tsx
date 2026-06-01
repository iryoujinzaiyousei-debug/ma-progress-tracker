"use client";

import { useEffect, useState } from "react";
import type { DealWithAssignees } from "@/lib/deals";
import { DealsTable } from "./deals-table";
import { DealsKanban } from "./deals-kanban";

type View = "table" | "kanban";
const STORAGE_KEY = "deals-view";

export function DealsView({ deals }: { deals: DealWithAssignees[] }) {
  const [view, setView] = useState<View>("table");

  // マウント後に保存済みの表示設定を一度だけ復元する（localStorage はクライアント専用）。
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as View | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "table" || saved === "kanban") setView(saved);
  }, []);

  function change(v: View) {
    setView(v);
    localStorage.setItem(STORAGE_KEY, v);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          {(
            [
              ["table", "テーブル"],
              ["kanban", "カンバン"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => change(v)}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                view === v
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <DealsTable deals={deals} />
      ) : (
        <DealsKanban deals={deals} />
      )}
    </div>
  );
}
