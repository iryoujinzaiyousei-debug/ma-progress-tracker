"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { DealDocument } from "@/lib/documents";
import {
  uploadDocument,
  deleteDocument,
  type DocFormState,
} from "@/app/(internal)/deals/[id]/documents-actions";
import { SUMMARY_CATEGORY, isPdfMime } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const initial: DocFormState = { error: null, ok: false };

/**
 * 概要書セクション。商流の上部に置く主要資料（案件概要書）の専用パネル。
 * 既存の deal_documents（category='summary'）を利用し、PDFのアップロード・
 * プレビュー・削除を行う。一般の「資料・書類」一覧とは分離している。
 */
export function SummaryPanel({
  dealId,
  documents,
}: {
  dealId: string;
  documents: DealDocument[];
}) {
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [upState, upAction, upPending] = useActionState(
    uploadDocument.bind(null, dealId),
    initial,
  );

  useEffect(() => {
    if (upState.ok) {
      toast.success("概要書を追加しました");
      formRef.current?.reset();
    }
  }, [upState]);

  function onDelete(doc: DealDocument) {
    startDelete(async () => {
      const res = await deleteDocument(dealId, doc.id);
      if (res?.error) toast.error(`削除に失敗しました：${res.error}`);
      else toast.success("削除しました");
    });
  }

  return (
    <>
      {/* 登録済みの概要書 */}
      {documents.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          まだ概要書がありません。下からPDFをアップロードしてください。
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-50 text-[10px] font-bold text-rose-600">
                {isPdfMime(doc.mime_type) ? "PDF" : "FILE"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {doc.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatBytes(doc.size_bytes)}
                  {" ・ "}
                  {formatDate(doc.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {doc.preview_url && isPdfMime(doc.mime_type) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    プレビュー
                  </Button>
                )}
                {doc.preview_url && !isPdfMime(doc.mime_type) && (
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <a
                        href={doc.preview_url}
                        download={doc.name}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    ダウンロード
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-slate-400 hover:text-rose-600"
                  onClick={() => onDelete(doc)}
                  aria-label="削除"
                >
                  ×
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* アップロード（PDF・category=summary 固定） */}
      <form ref={formRef} action={upAction} className="space-y-3">
        <input type="hidden" name="category" value={SUMMARY_CATEGORY} />
        <div className="space-y-1.5">
          <Label htmlFor="summary-name">表示名（任意）</Label>
          <Input
            id="summary-name"
            name="name"
            placeholder="未入力ならファイル名を使用（例：案件概要書）"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary-file">概要書PDF（上限25MB）</Label>
          <Input
            id="summary-file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
          />
          <p className="text-xs text-slate-400">
            PDFをアップロードすると、この画面でプレビューできます。
          </p>
        </div>
        {upState.error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {upState.error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={upPending}>
            {upPending ? "アップロード中…" : "概要書をアップロード"}
          </Button>
        </div>
      </form>

      {/* プレビュー */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          {previewDoc?.preview_url && (
            <iframe
              src={previewDoc.preview_url}
              title={previewDoc.name}
              className="mt-2 h-[70vh] w-full rounded-md border border-slate-200"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
