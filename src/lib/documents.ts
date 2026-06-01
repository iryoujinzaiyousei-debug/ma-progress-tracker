import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import type { DocumentCategory } from "@/lib/constants";

export const DOCUMENTS_BUCKET = "deal-documents";
const SIGNED_URL_TTL = 60 * 60; // 1時間

/** UI が扱う、プレビューURLを解決済みの書類型 */
export type DealDocument = {
  id: string;
  deal_id: string;
  category: DocumentCategory;
  kind: "file" | "link";
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  external_url: string | null;
  /** file: 署名URL(本番) or data URL(プレビュー) / link: 外部URL */
  preview_url: string | null;
  created_at: string;
};

/** 案件の書類一覧（新しい順）。file は署名URLを解決して返す。 */
export async function getDealDocuments(
  dealId: string,
): Promise<DealDocument[]> {
  if (PREVIEW_MODE) return previewStore.listDocuments(dealId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_documents")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`書類の取得に失敗しました: ${error.message}`);

  const rows = data ?? [];
  const result: DealDocument[] = [];

  for (const row of rows) {
    let previewUrl: string | null = row.external_url;
    if (row.kind === "file" && row.file_path) {
      const { data: signed } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(row.file_path, SIGNED_URL_TTL);
      previewUrl = signed?.signedUrl ?? null;
    }
    result.push({
      id: row.id,
      deal_id: row.deal_id,
      category: row.category,
      kind: row.kind,
      name: row.name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      external_url: row.external_url,
      preview_url: previewUrl,
      created_at: row.created_at,
    });
  }

  return result;
}
