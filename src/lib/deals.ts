import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import type {
  DealRow,
  UserRow,
  DealStatusHistoryRow,
} from "@/lib/types";
import type { DealStatus, DealType } from "@/lib/constants";

/** 一覧/カンバンで使う、担当者を含んだ案件型 */
export type DealAssigneeInfo = {
  user_id: string;
  is_primary: boolean;
  name: string;
};

export type DealWithAssignees = DealRow & {
  assignees: DealAssigneeInfo[];
};

type RawAssignee = {
  user_id: string;
  is_primary: boolean;
  users: { id: string; name: string } | null;
};

const DEAL_SELECT = `
  *,
  deal_assignees (
    user_id,
    is_primary,
    users ( id, name )
  )
` as const;

function mapAssignees(raw: unknown): DealAssigneeInfo[] {
  const arr = (raw as RawAssignee[] | null) ?? [];
  return arr.map((a) => ({
    user_id: a.user_id,
    is_primary: a.is_primary,
    name: a.users?.name ?? "（不明）",
  }));
}

/** 案件一覧を取得（更新日時の新しい順） */
export async function getDeals(): Promise<DealWithAssignees[]> {
  if (PREVIEW_MODE) return previewStore.listDeals();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`案件の取得に失敗しました: ${error.message}`);

  return (data ?? []).map((d) => {
    const { deal_assignees, ...deal } = d as DealRow & {
      deal_assignees: unknown;
    };
    return { ...(deal as DealRow), assignees: mapAssignees(deal_assignees) };
  });
}

/** 案件1件を担当者込みで取得 */
export async function getDealById(
  id: string,
): Promise<DealWithAssignees | null> {
  if (PREVIEW_MODE) return previewStore.getDeal(id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`案件の取得に失敗しました: ${error.message}`);
  if (!data) return null;

  const { deal_assignees, ...deal } = data as DealRow & {
    deal_assignees: unknown;
  };
  return { ...(deal as DealRow), assignees: mapAssignees(deal_assignees) };
}

/** 案件の進捗履歴（新しい順）を取得 */
export async function getDealHistory(
  dealId: string,
): Promise<(DealStatusHistoryRow & { changed_by_name: string | null })[]> {
  if (PREVIEW_MODE) return previewStore.getHistory(dealId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_status_history")
    .select(`*, users:changed_by ( name )`)
    .eq("deal_id", dealId)
    .order("changed_at", { ascending: false });

  if (error) throw new Error(`履歴の取得に失敗しました: ${error.message}`);

  return (data ?? []).map((h) => {
    const { users, ...rest } = h as unknown as DealStatusHistoryRow & {
      users: { name: string } | null;
    };
    return {
      ...(rest as DealStatusHistoryRow),
      changed_by_name: users?.name ?? null,
    };
  });
}

/** 社内ユーザー一覧（担当者選択用） */
export async function getUsers(): Promise<UserRow[]> {
  if (PREVIEW_MODE) return previewStore.listUsers();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`ユーザーの取得に失敗しました: ${error.message}`);
  return data ?? [];
}

// ============================================
// ダッシュボード集計
// ============================================

export type DashboardStats = {
  total: number;
  byStatus: Record<DealStatus, number>;
  byType: Record<DealType, number>;
  byAssignee: { name: string; count: number }[];
  warnings: { stale: number; overdue: number; incomplete: number };
};

/** ダッシュボード集計（一覧を1回取得して集計する） */
export async function getDashboardStats(): Promise<{
  stats: DashboardStats;
  deals: DealWithAssignees[];
}> {
  const { STATUS_ORDER, DEAL_TYPE_ORDER, getDealWarnings } = await import(
    "@/lib/constants"
  );
  const deals = await getDeals();

  const byStatus = Object.fromEntries(
    STATUS_ORDER.map((s) => [s, 0]),
  ) as Record<DealStatus, number>;
  const byType = Object.fromEntries(
    DEAL_TYPE_ORDER.map((t) => [t, 0]),
  ) as Record<DealType, number>;
  const assigneeCount = new Map<string, number>();
  const warnings = { stale: 0, overdue: 0, incomplete: 0 };

  for (const deal of deals) {
    byStatus[deal.current_status] += 1;
    byType[deal.deal_type] += 1;

    for (const a of deal.assignees) {
      assigneeCount.set(a.name, (assigneeCount.get(a.name) ?? 0) + 1);
    }

    for (const w of getDealWarnings(deal)) warnings[w] += 1;
  }

  const byAssignee = [...assigneeCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    stats: { total: deals.length, byStatus, byType, byAssignee, warnings },
    deals,
  };
}
