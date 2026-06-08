import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import {
  MAX_UPLOAD_BYTES,
  SUMMARY_CATEGORY,
  type DocumentCategory,
} from "@/lib/constants";

export const DOCUMENTS_BUCKET = "deal-documents";
const SIGNED_URL_TTL = 60 * 60; // 1時間

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

/**
 * 1ファイルを Storage に保存し deal_documents に登録する（本番）。
 * プレビュー時は data URL にして previewStore へ追加する。
 * uploadDocument（書類パネル）と createDeal（新規登録時の概要書）で共用。
 * revalidatePath は呼び出し側で行う。
 */
export async function saveDealFile(params: {
  dealId: string;
  file: File;
  category: DocumentCategory;
  displayName?: string | null;
  uploadedBy: string;
}): Promise<{ error: string | null }> {
  const { dealId, file, category, uploadedBy } = params;
  const displayName = (params.displayName ?? "").trim() || file.name;

  if (file.size === 0) return { error: "ファイルを選択してください。" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error:
        "ファイルが大きすぎます（上限25MB）。重い資料はGoogleドライブのURLで登録してください。",
    };
  }

  if (PREVIEW_MODE) {
    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${buf.toString("base64")}`;
    previewStore.addFile(dealId, {
      category,
      name: displayName,
      mime: file.type || null,
      size: file.size,
      dataUrl,
    });
    return { error: null };
  }

  const supabase = await createClient();
  const path = `${dealId}/${Date.now()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    return { error: `アップロードに失敗しました：${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("deal_documents").insert({
    deal_id: dealId,
    category,
    kind: "file",
    name: displayName,
    file_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: uploadedBy,
  });

  if (insertError) {
    // 行作成に失敗したらアップロード済みファイルを片付ける
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return { error: `登録に失敗しました：${insertError.message}` };
  }

  return { error: null };
}

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

/**
 * 共有ページ用：指定案件の概要書（category='summary'）のみを取得する。
 * 顧客共有ページは未認証なので service role（RLSバイパス）で読み、
 * file は署名URLを解決して返す。getDealDocuments と違い概要書だけに絞る。
 */
export async function getSummaryDocumentsForShare(
  dealId: string,
): Promise<DealDocument[]> {
  if (PREVIEW_MODE) {
    return previewStore
      .listDocuments(dealId)
      .filter((d) => d.category === SUMMARY_CATEGORY);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("deal_documents")
    .select("*")
    .eq("deal_id", dealId)
    .eq("category", SUMMARY_CATEGORY)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const result: DealDocument[] = [];

  for (const row of data) {
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
