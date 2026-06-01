import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import type { BuyerRow } from "@/lib/types";

/** 買い顧客の一覧（ステータス→更新日時順） */
export async function getBuyers(): Promise<BuyerRow[]> {
  if (PREVIEW_MODE) return previewStore.listBuyers();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buyers")
    .select("*")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`買い顧客の取得に失敗しました: ${error.message}`);
  return data ?? [];
}

/** 買い顧客1件 */
export async function getBuyerById(id: string): Promise<BuyerRow | null> {
  if (PREVIEW_MODE) return previewStore.getBuyer(id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buyers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`買い顧客の取得に失敗しました: ${error.message}`);
  return data;
}
