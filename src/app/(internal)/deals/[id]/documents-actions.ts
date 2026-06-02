"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import { DOCUMENTS_BUCKET, saveDealFile } from "@/lib/documents";
import {
  ALL_DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/lib/constants";

export type DocFormState = { error: string | null; ok: boolean };

function categoryOf(form: FormData): DocumentCategory {
  const v = String(form.get("category") ?? "other");
  return ALL_DOCUMENT_CATEGORIES.includes(v as DocumentCategory)
    ? (v as DocumentCategory)
    : "other";
}

// ---- ファイルアップロード -----------------------------------

export async function uploadDocument(
  dealId: string,
  _prev: DocFormState,
  form: FormData,
): Promise<DocFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。", ok: false };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ファイルを選択してください。", ok: false };
  }

  const { error } = await saveDealFile({
    dealId,
    file,
    category: categoryOf(form),
    displayName: String(form.get("name") ?? ""),
    uploadedBy: user.authId,
  });

  if (error) return { error, ok: false };

  revalidatePath(`/deals/${dealId}`);
  return { error: null, ok: true };
}

// ---- 外部URLリンク追加 -------------------------------------

export async function addDocumentLink(
  dealId: string,
  _prev: DocFormState,
  form: FormData,
): Promise<DocFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。", ok: false };

  const url = String(form.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return { error: "http(s):// で始まるURLを入力してください。", ok: false };
  }
  const category = categoryOf(form);
  const name = String(form.get("name") ?? "").trim() || url;

  if (PREVIEW_MODE) {
    previewStore.addLink(dealId, { category, name, url });
    revalidatePath(`/deals/${dealId}`);
    return { error: null, ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("deal_documents").insert({
    deal_id: dealId,
    category,
    kind: "link",
    name,
    external_url: url,
    uploaded_by: user.authId,
  });

  if (error) return { error: `登録に失敗しました：${error.message}`, ok: false };

  revalidatePath(`/deals/${dealId}`);
  return { error: null, ok: true };
}

// ---- 削除 --------------------------------------------------

export async function deleteDocument(dealId: string, docId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "認証が切れています。" };

  if (PREVIEW_MODE) {
    previewStore.removeDocument(docId);
    revalidatePath(`/deals/${dealId}`);
    return { error: null };
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("deal_documents")
    .select("file_path, kind")
    .eq("id", docId)
    .maybeSingle();

  if (row?.kind === "file" && row.file_path) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([row.file_path]);
  }

  const { error } = await supabase
    .from("deal_documents")
    .delete()
    .eq("id", docId);

  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  return { error: null };
}
