import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSummaryDocumentsForShare, type DealDocument } from "@/lib/documents";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import type { DealRow, DealStatusHistoryRow } from "@/lib/types";

/** 顧客に見せてよいフィールドだけを抜き出した型 */
export type SharedDeal = Pick<
  DealRow,
  | "deal_name"
  | "deal_type"
  | "current_status"
  | "scheduled_date"
  | "next_action"
  | "transfer_price"
  | "retainer_fee"
  | "success_fee"
  | "remarks_shared"
  | "updated_at"
>;

export type SharedHistoryItem = Pick<
  DealStatusHistoryRow,
  "id" | "from_status" | "to_status" | "changed_at"
>;

/**
 * トークンで共有案件を取得する。service role を使い、
 * share_enabled = true の案件のみ返す。担当者名や社内メモは返さない。
 * トークンが無効 or 共有OFFなら null。
 */
export async function getSharedDealByToken(
  token: string,
): Promise<{
  deal: SharedDeal;
  history: SharedHistoryItem[];
  summaryDocs: DealDocument[];
} | null> {
  if (PREVIEW_MODE) {
    const d = previewStore.getByToken(token);
    if (!d) return null;
    const deal: SharedDeal = {
      deal_name: d.deal_name,
      deal_type: d.deal_type,
      current_status: d.current_status,
      scheduled_date: d.scheduled_date,
      next_action: d.next_action,
      transfer_price: d.transfer_price,
      retainer_fee: d.retainer_fee,
      success_fee: d.success_fee,
      remarks_shared: d.remarks_shared,
      updated_at: d.updated_at,
    };
    const history: SharedHistoryItem[] = previewStore
      .getHistory(d.id)
      .map((h) => ({
        id: h.id,
        from_status: h.from_status,
        to_status: h.to_status,
        changed_at: h.changed_at,
      }));
    const summaryDocs = await getSummaryDocumentsForShare(d.id);
    return { deal, history, summaryDocs };
  }

  const supabase = createAdminClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      "id, deal_name, deal_type, current_status, scheduled_date, next_action, transfer_price, retainer_fee, success_fee, remarks_shared, updated_at, share_enabled",
    )
    .eq("share_token", token)
    .eq("share_enabled", true)
    .maybeSingle();

  if (error || !deal) return null;

  const { data: history } = await supabase
    .from("deal_status_history")
    .select("id, from_status, to_status, changed_at")
    .eq("deal_id", (deal as { id: string }).id)
    .order("changed_at", { ascending: false });

  const dealId = (deal as { id: string }).id;
  const summaryDocs = await getSummaryDocumentsForShare(dealId);

  // share_enabled / id を取り除いて返す
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: _id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    share_enabled: _enabled,
    ...shared
  } = deal as SharedDeal & { id: string; share_enabled: boolean };

  return {
    deal: shared as SharedDeal,
    history: (history ?? []) as SharedHistoryItem[],
    summaryDocs,
  };
}
