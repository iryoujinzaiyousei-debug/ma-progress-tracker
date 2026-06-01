"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import type { DealDocument } from "@/lib/documents";
import {
  uploadDocument,
  addDocumentLink,
  deleteDocument,
  type DocFormState,
} from "@/app/(internal)/deals/[id]/documents-actions";
import {
  DOCUMENT_CATEGORY_ORDER,
  DOCUMENT_CATEGORY_LABEL,
  isImageMime,
  isPdfMime,
  isPreviewable,
} from "@/lib/constants";
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

function CategorySelect({ id }: { id: string }) {
  return (
    <select
      id={id}
      name="category"
      defaultValue="materials"
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
    >
      {DOCUMENT_CATEGORY_ORDER.map((c) => (
        <option key={c} value={c}>
          {DOCUMENT_CATEGORY_LABEL[c]}
        </option>
      ))}
    </select>
  );
}

function DocGlyph({ doc }: { doc: DealDocument }) {
  const label =
    doc.kind === "link"
      ? "URL"
      : isImageMime(doc.mime_type)
        ? "IMG"
        : isPdfMime(doc.mime_type)
          ? "PDF"
          : "FILE";
  const color =
    doc.kind === "link"
      ? "bg-blue-50 text-blue-600"
      : isImageMime(doc.mime_type)
        ? "bg-emerald-50 text-emerald-600"
        : isPdfMime(doc.mime_type)
          ? "bg-rose-50 text-rose-600"
          : "bg-slate-100 text-slate-500";
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${color}`}
    >
      {label}
    </span>
  );
}

export function DocumentsPanel({
  dealId,
  documents,
}: {
  dealId: string;
  documents: DealDocument[];
}) {
  const [tab, setTab] = useState<"file" | "link">("file");
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [, startDelete] = useTransition();

  const fileFormRef = useRef<HTMLFormElement>(null);
  const linkFormRef = useRef<HTMLFormElement>(null);

  const [upState, upAction, upPending] = useActionState(
    uploadDocument.bind(null, dealId),
    initial,
  );
  const [linkState, linkAction, linkPending] = useActionState(
    addDocumentLink.bind(null, dealId),
    initial,
  );

  useEffect(() => {
    if (upState.ok) {
      toast.success("ファイルを追加しました");
      fileFormRef.current?.reset();
    }
  }, [upState]);

  useEffect(() => {
    if (linkState.ok) {
      toast.success("リンクを追加しました");
      linkFormRef.current?.reset();
    }
  }, [linkState]);

  function onDelete(doc: DealDocument) {
    startDelete(async () => {
      const res = await deleteDocument(dealId, doc.id);
      if (res?.error) toast.error(`削除に失敗しました：${res.error}`);
      else toast.success("削除しました");
    });
  }

  return (
    <>
      {/* 一覧（カテゴリ別） */}
      {documents.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          まだ資料・書類がありません。下から追加してください。
        </p>
      ) : (
        <div className="mb-5 space-y-4">
          {DOCUMENT_CATEGORY_ORDER.map((cat) => {
            const items = documents.filter((d) => d.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">
                  {DOCUMENT_CATEGORY_LABEL[cat]}（{items.length}）
                </p>
                <ul className="space-y-2">
                  {items.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <DocGlyph doc={doc} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {doc.kind === "link"
                            ? "外部リンク"
                            : formatBytes(doc.size_bytes)}
                          {" ・ "}
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {doc.kind === "file" &&
                          isPreviewable(doc.mime_type) &&
                          doc.preview_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              プレビュー
                            </Button>
                          )}
                        {doc.kind === "file" &&
                          !isPreviewable(doc.mime_type) &&
                          doc.preview_url && (
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
                        {doc.kind === "link" && doc.external_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <a
                                href={doc.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            }
                          >
                            開く
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
              </div>
            );
          })}
        </div>
      )}

      {/* 追加エリア */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-3 inline-flex rounded-md border border-slate-200 bg-white p-0.5">
          {(
            [
              ["file", "ファイル"],
              ["link", "URLリンク"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              className={[
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                tab === v
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "file" ? (
          <form ref={fileFormRef} action={upAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="doc-file-category">カテゴリ</Label>
                <CategorySelect id="doc-file-category" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-file-name">表示名（任意）</Label>
                <Input
                  id="doc-file-name"
                  name="name"
                  placeholder="未入力ならファイル名を使用"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-file">ファイル（上限25MB）</Label>
              <Input id="doc-file" name="file" type="file" required />
              <p className="text-xs text-slate-400">
                画像・PDFはこの画面でプレビューできます。重い財務資料はURLリンクで登録を。
              </p>
            </div>
            {upState.error && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {upState.error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={upPending}>
                {upPending ? "アップロード中…" : "アップロード"}
              </Button>
            </div>
          </form>
        ) : (
          <form ref={linkFormRef} action={linkAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="doc-link-category">カテゴリ</Label>
                <CategorySelect id="doc-link-category" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doc-link-name">表示名（任意）</Label>
                <Input
                  id="doc-link-name"
                  name="name"
                  placeholder="例：詳細財務資料フォルダ"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-link-url">URL（Googleドライブ等）</Label>
              <Input
                id="doc-link-url"
                name="url"
                type="url"
                required
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
            {linkState.error && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {linkState.error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={linkPending}>
                {linkPending ? "追加中…" : "リンクを追加"}
              </Button>
            </div>
          </form>
        )}
      </div>

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
            <div className="mt-2">
              {isImageMime(previewDoc.mime_type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.preview_url}
                  alt={previewDoc.name}
                  className="mx-auto max-h-[70vh] w-auto rounded-md"
                />
              ) : isPdfMime(previewDoc.mime_type) ? (
                <iframe
                  src={previewDoc.preview_url}
                  title={previewDoc.name}
                  className="h-[70vh] w-full rounded-md border border-slate-200"
                />
              ) : (
                <a
                  href={previewDoc.preview_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-700 underline"
                >
                  ファイルを開く
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
