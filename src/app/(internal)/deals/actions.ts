"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import { STATUS_ORDER, DEAL_TYPE_ORDER } from "@/lib/constants";
import type { DealStatus, DealType } from "@/lib/constants";
import type { DealInsert, DealUpdate } from "@/lib/types";

export type DealFormState = { error: string | null };

// ---- パースユーティリティ ----------------------------------

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function money(form: FormData, key: string): number | null {
  const raw = str(form, key);
  if (raw === null) return null;
  const n = Number(raw.replace(/[,，\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function dealTypeOrThrow(form: FormData): DealType {
  const v = String(form.get("deal_type") ?? "");
  if (!DEAL_TYPE_ORDER.includes(v as DealType)) {
    throw new Error("案件種別が不正です。");
  }
  return v as DealType;
}

function statusOrDefault(form: FormData): DealStatus {
  const v = String(form.get("current_status") ?? "inquiry");
  return STATUS_ORDER.includes(v as DealStatus)
    ? (v as DealStatus)
    : "inquiry";
}

/** フォームから案件の共通フィールドを取り出す */
function readDealFields(form: FormData) {
  return {
    deal_name: str(form, "deal_name"),
    deal_type: dealTypeOrThrow(form),
    seller_company: str(form, "seller_company"),
    buyer_company: str(form, "buyer_company"),
    referrer_company: str(form, "referrer_company"),
    referred_company: str(form, "referred_company"),
    current_status: statusOrDefault(form),
    next_action: str(form, "next_action"),
    scheduled_date: str(form, "scheduled_date"),
    transfer_price: money(form, "transfer_price"),
    retainer_fee: money(form, "retainer_fee"),
    success_fee: money(form, "success_fee"),
    remarks_internal: str(form, "remarks_internal"),
    remarks_shared: str(form, "remarks_shared"),
    share_enabled: form.get("share_enabled") === "on",
  };
}

/** 担当者の置き換え（全削除 → 再挿入） */
async function replaceAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealId: string,
  assigneeIds: string[],
  primaryId: string | null,
) {
  await supabase.from("deal_assignees").delete().eq("deal_id", dealId);
  if (assigneeIds.length === 0) return;

  const rows = assigneeIds.map((user_id) => ({
    deal_id: dealId,
    user_id,
    is_primary: user_id === primaryId,
  }));
  await supabase.from("deal_assignees").insert(rows);
}

// ---- 作成 --------------------------------------------------

export async function createDeal(
  _prev: DealFormState,
  form: FormData,
): Promise<DealFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。再ログインしてください。" };

  const fields = readDealFields(form);
  if (!fields.deal_name) return { error: "案件名は必須です。" };

  const assigneeIds = form.getAll("assignee_ids").map(String);
  const primaryId = str(form, "primary_assignee_id");

  if (PREVIEW_MODE) {
    const id = previewStore.create(
      { ...fields, deal_name: fields.deal_name, created_by: user.authId },
      assigneeIds,
      primaryId,
    );
    revalidatePath("/deals");
    revalidatePath("/dashboard");
    redirect(`/deals/${id}`);
  }

  const supabase = await createClient();
  const insert: DealInsert = {
    ...fields,
    deal_name: fields.deal_name,
    created_by: user.authId,
  };

  const { data, error } = await supabase
    .from("deals")
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) {
    return { error: `作成に失敗しました：${error?.message ?? "不明なエラー"}` };
  }

  await replaceAssignees(supabase, data.id, assigneeIds, primaryId);

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  redirect(`/deals/${data.id}`);
}

// ---- 更新 --------------------------------------------------

export async function updateDeal(
  dealId: string,
  _prev: DealFormState,
  form: FormData,
): Promise<DealFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。再ログインしてください。" };

  const fields = readDealFields(form);
  if (!fields.deal_name) return { error: "案件名は必須です。" };

  const assigneeIds = form.getAll("assignee_ids").map(String);
  const primaryId = str(form, "primary_assignee_id");

  if (PREVIEW_MODE) {
    previewStore.update(
      dealId,
      { ...fields, deal_name: fields.deal_name },
      assigneeIds,
      primaryId,
    );
    revalidatePath("/deals");
    revalidatePath(`/deals/${dealId}`);
    revalidatePath("/dashboard");
    redirect(`/deals/${dealId}`);
  }

  const supabase = await createClient();
  const update: DealUpdate = { ...fields, deal_name: fields.deal_name };

  const { error } = await supabase
    .from("deals")
    .update(update)
    .eq("id", dealId);

  if (error) return { error: `更新に失敗しました：${error.message}` };

  await replaceAssignees(supabase, dealId, assigneeIds, primaryId);

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  redirect(`/deals/${dealId}`);
}

// ---- ステータス変更（カンバンのドラッグ用） ----------------

export async function updateDealStatus(dealId: string, status: DealStatus) {
  if (!STATUS_ORDER.includes(status)) {
    return { error: "不正なステータスです。" };
  }
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。" };

  if (PREVIEW_MODE) {
    previewStore.setStatus(dealId, status);
    revalidatePath("/deals");
    revalidatePath(`/deals/${dealId}`);
    revalidatePath("/dashboard");
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ current_status: status })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

// ---- 顧客共有 ON/OFF --------------------------------------

export async function toggleShare(dealId: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。" };

  if (PREVIEW_MODE) {
    previewStore.setShare(dealId, enabled);
    revalidatePath(`/deals/${dealId}`);
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ share_enabled: enabled })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  return { error: null };
}

// ---- 削除 --------------------------------------------------

export async function deleteDeal(dealId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。" };

  if (PREVIEW_MODE) {
    previewStore.remove(dealId);
    revalidatePath("/deals");
    revalidatePath("/dashboard");
    redirect("/deals");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("deals").delete().eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  redirect("/deals");
}
