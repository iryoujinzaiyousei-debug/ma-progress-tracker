"use client";

import { useMemo, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** まとめテキストの対象案件（共有URL生成に必要な最小情報） */
export type BuyerDealShare = {
  dealName: string;
  shareToken: string | null;
  shareEnabled: boolean;
};

const HEADER = "現在ご提案中の案件は下記の通りです。";

/** 共有がONでトークンのある案件だけを、案件名＋共有URLのテキストに整形する。 */
function buildText(deals: BuyerDealShare[], origin: string): string {
  const blocks = deals
    .filter((d) => d.shareEnabled && d.shareToken)
    .map((d) => `■ ${d.dealName}\n${origin}/share/${d.shareToken}`);

  if (blocks.length === 0) return "";
  return `${HEADER}\n\n${blocks.join("\n\n")}`;
}

/**
 * 買主に紐づく案件名と共有URLを、コピー用のテキストにまとめて表示する。
 * origin はサーバーでは空文字、クライアントでは実 origin を返し hydration ミスマッチを避ける。
 */
export function BuyerDealsText({ deals }: { deals: BuyerDealShare[] }) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const shareableCount = useMemo(
    () => deals.filter((d) => d.shareEnabled && d.shareToken).length,
    [deals],
  );

  const text = useMemo(() => buildText(deals, origin), [deals, origin]);

  if (shareableCount === 0) {
    return (
      <p className="text-sm text-slate-500">
        共有URLが発行済み（顧客共有ON）の案件がありません。
        <br />
        各案件の詳細ページで「顧客共有」をONにすると、ここにまとめテキストが表示されます。
      </p>
    );
  }

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("案件まとめをコピーしました");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          顧客共有ONの {shareableCount} 件をまとめています。
        </p>
        {/* origin はクライアントでのみ確定するため、それまでコピーは無効化 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          disabled={!origin}
        >
          コピー
        </Button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={Math.min(3 + shareableCount * 3, 18)}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-700"
      />
    </div>
  );
}
