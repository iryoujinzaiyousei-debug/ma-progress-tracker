"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import { DOCUMENTS_BUCKET } from "@/lib/documents";
import {
  DOCUMENT_CATEGORY_ORDER,
  MAX_UPLOAD_BYTES,
  type DocumentCategory,
} from "@/lib/constants";

export type DocFormState = { error: string | null; ok: boolean };

function categoryOf(form: FormData): DocumentCategory {
  const v = String(form.get("category") ?? "other");
  return DOCUMENT_CATEGORY_ORDER.includes(v as DocumentCategory)
    ? (v as DocumentCategory)
    : "other";
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
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
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error:
        "ファイルが大きすぎます（上限25MB）。重い資料はGoogleドライブのURLで登録してください。",
      ok: false,
    };
  }

  const category = categoryOf(form);
  const displayName = String(form.get("name") ?? "").trim() || file.name;

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
    revalidatePath(`/deals/${dealId}`);
    return { error: null, ok: true };
  }

  const supabase = await createClient();
  const path = `${dealId}/${Date.now()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    return { error: `アップロードに失敗しました：${uploadError.message}`, ok: false };
  }

  const { error: insertError } = await supabase.from("deal_documents").insert({
    deal_id: dealId,
    category,
    kind: "file",
    name: displayName,
    file_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user.authId,
  });

  if (insertError) {
    // 行作成に失敗したらアップロード済みファイルを片付ける
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return { error: `登録に失敗しました：${insertError.message}`, ok: false };
  }

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
