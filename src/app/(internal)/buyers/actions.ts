"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import {
  DEAL_TYPE_ORDER,
  BUYER_STATUS_ORDER,
  type DealType,
  type BuyerStatus,
} from "@/lib/constants";
import type { BuyerInsert } from "@/lib/types";

export type BuyerFormState = { error: string | null };

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

function schemes(form: FormData): DealType[] {
  return form
    .getAll("desired_schemes")
    .map(String)
    .filter((v): v is DealType => DEAL_TYPE_ORDER.includes(v as DealType));
}

function areas(form: FormData): string[] {
  const raw = String(form.get("areas") ?? "");
  const parts = raw
    .split(/[,，\n、]/) // カンマ・読点・改行で分割
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

function statusOf(form: FormData): BuyerStatus {
  const v = String(form.get("status") ?? "active");
  return BUYER_STATUS_ORDER.includes(v as BuyerStatus)
    ? (v as BuyerStatus)
    : "active";
}

function readFields(form: FormData) {
  return {
    company_name: str(form, "company_name"),
    contact_name: str(form, "contact_name"),
    contact_email: str(form, "contact_email"),
    contact_phone: str(form, "contact_phone"),
    desired_schemes: schemes(form),
    budget_min: money(form, "budget_min"),
    budget_max: money(form, "budget_max"),
    areas: areas(form),
    industries: str(form, "industries"),
    notes: str(form, "notes"),
    status: statusOf(form),
  };
}

export async function createBuyer(
  _prev: BuyerFormState,
  form: FormData,
): Promise<BuyerFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。再ログインしてください。" };

  const fields = readFields(form);
  if (!fields.company_name) return { error: "社名（名義）は必須です。" };

  if (PREVIEW_MODE) {
    const id = previewStore.createBuyer({
      ...fields,
      company_name: fields.company_name,
      created_by: user.authId,
    });
    revalidatePath("/customers");
    redirect(`/buyers/${id}`);
  }

  const supabase = await createClient();
  const insert: BuyerInsert = {
    ...fields,
    company_name: fields.company_name,
    created_by: user.authId,
  };
  const { data, error } = await supabase
    .from("buyers")
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) {
    return { error: `登録に失敗しました：${error?.message ?? "不明なエラー"}` };
  }

  revalidatePath("/customers");
  redirect(`/buyers/${data.id}`);
}

export async function updateBuyer(
  buyerId: string,
  _prev: BuyerFormState,
  form: FormData,
): Promise<BuyerFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。再ログインしてください。" };

  const fields = readFields(form);
  if (!fields.company_name) return { error: "社名（名義）は必須です。" };

  if (PREVIEW_MODE) {
    previewStore.updateBuyer(buyerId, {
      ...fields,
      company_name: fields.company_name,
    });
    revalidatePath("/customers");
    revalidatePath(`/buyers/${buyerId}`);
    redirect(`/buyers/${buyerId}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("buyers")
    .update({ ...fields, company_name: fields.company_name })
    .eq("id", buyerId);

  if (error) return { error: `更新に失敗しました：${error.message}` };

  revalidatePath("/customers");
  revalidatePath(`/buyers/${buyerId}`);
  redirect(`/buyers/${buyerId}`);
}

export async function deleteBuyer(buyerId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。" };

  if (PREVIEW_MODE) {
    previewStore.removeBuyer(buyerId);
    revalidatePath("/customers");
    redirect("/customers");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("buyers").delete().eq("id", buyerId);
  if (error) return { error: error.message };

  revalidatePath("/customers");
  redirect("/customers");
}
