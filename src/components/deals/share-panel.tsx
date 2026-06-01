"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { toggleShare } from "@/app/(internal)/deals/actions";
import { Button } from "@/components/ui/button";

export function SharePanel({
  dealId,
  shareToken,
  initialEnabled,
}: {
  dealId: string;
  shareToken: string | null;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  // サーバーでは "" を、クライアントでは実際の origin を返す（hydration ミスマッチなし）。
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const shareUrl =
    shareToken && origin ? `${origin}/share/${shareToken}` : "";

  function onToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const res = await toggleShare(dealId, next);
      if (res?.error) {
        setEnabled(!next);
        toast.error(`共有設定の更新に失敗しました：${res.error}`);
      } else {
        toast.success(next ? "顧客共有をONにしました" : "顧客共有をOFFにしました");
      }
    });
  }

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("共有URLをコピーしました");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">顧客共有</p>
          <p className="text-xs text-slate-500">
            ログイン不要のトークンURLで進捗を共有します。
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          role="switch"
          aria-checked={enabled}
          className={[
            "relative h-6 w-11 rounded-full transition-colors",
            enabled ? "bg-emerald-500" : "bg-slate-300",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
      </div>

      {enabled && shareUrl && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="h-9 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 text-xs text-slate-600"
          />
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            コピー
          </Button>
        </div>
      )}
      {enabled && !shareToken && (
        <p className="text-xs text-rose-600">
          共有トークンが未生成です。DBスキーマの share_token 既定値をご確認ください。
        </p>
      )}
    </div>
  );
}
