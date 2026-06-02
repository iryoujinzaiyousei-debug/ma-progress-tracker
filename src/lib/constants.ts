import type { Database } from "@/lib/types";

export type DealStatus = Database["public"]["Enums"]["deal_status"];
export type DealType = Database["public"]["Enums"]["deal_type"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type DocumentCategory =
  Database["public"]["Enums"]["document_category"];
export type BuyerStatus = Database["public"]["Enums"]["buyer_status"];

/** 進行順（カンバンの列順 / 並べ替えに使用） */
export const STATUS_ORDER: DealStatus[] = [
  "proposing",
  "inquiry",
  "materials_received",
  "nda",
  "meeting_scheduling",
  "meeting_done",
  "basic_agreement",
  "due_diligence",
  "contract_drafting",
  "contract_signed",
  "settlement_prep",
  "closed_won",
  "handover",
  "lost",
  "on_hold",
];

/** 進行ラインから外れる「分岐」ステータス（顧客共有・進捗バーのパイプライン対象外） */
export const BRANCH_STATUSES: DealStatus[] = ["lost", "on_hold"];

/**
 * 進行パイプライン（提案中..引渡）。分岐（失注・保留）を除いた順序。
 * 顧客共有ページ・進捗バー・進捗履歴生成で共通利用する。
 */
export const PIPELINE_STATUSES: DealStatus[] = STATUS_ORDER.filter(
  (s) => !BRANCH_STATUSES.includes(s),
);

export const STATUS_LABEL: Record<DealStatus, string> = {
  proposing: "提案中",
  inquiry: "問い合わせ",
  materials_received: "資料受領",
  nda: "秘密保持契約（NDA）",
  meeting_scheduling: "面談調整中",
  meeting_done: "面談実施",
  basic_agreement: "基本合意",
  due_diligence: "DD",
  contract_drafting: "契約書作成中",
  contract_signed: "契約締結",
  settlement_prep: "決済準備",
  closed_won: "成約",
  handover: "引渡",
  lost: "失注",
  on_hold: "保留",
};

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  ma_business: "M&A（事業譲渡）",
  interior: "内装譲渡",
  corporate: "法人格譲渡",
};

export const DEAL_TYPE_ORDER: DealType[] = [
  "ma_business",
  "interior",
  "corporate",
];

/**
 * ステータスごとの色（Tailwind クラス）。
 * カンバン列ヘッダ・バッジで共通利用する。終端/分岐は性質ごとに色分け。
 */
export const STATUS_COLOR: Record<
  DealStatus,
  { badge: string; dot: string; column: string }
> = {
  proposing: {
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    dot: "bg-stone-400",
    column: "border-t-stone-300",
  },
  inquiry: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    column: "border-t-slate-300",
  },
  materials_received: {
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    dot: "bg-sky-400",
    column: "border-t-sky-300",
  },
  nda: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-400",
    column: "border-t-cyan-300",
  },
  meeting_scheduling: {
    badge: "bg-teal-100 text-teal-700 border-teal-200",
    dot: "bg-teal-400",
    column: "border-t-teal-300",
  },
  meeting_done: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
    column: "border-t-emerald-300",
  },
  basic_agreement: {
    badge: "bg-lime-100 text-lime-700 border-lime-200",
    dot: "bg-lime-500",
    column: "border-t-lime-300",
  },
  due_diligence: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    column: "border-t-amber-300",
  },
  contract_drafting: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    column: "border-t-orange-300",
  },
  contract_signed: {
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    column: "border-t-violet-300",
  },
  settlement_prep: {
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    column: "border-t-indigo-300",
  },
  closed_won: {
    badge: "bg-green-100 text-green-800 border-green-300",
    dot: "bg-green-600",
    column: "border-t-green-400",
  },
  handover: {
    badge: "bg-green-200 text-green-900 border-green-400",
    dot: "bg-green-700",
    column: "border-t-green-500",
  },
  lost: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    column: "border-t-rose-300",
  },
  on_hold: {
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
    column: "border-t-zinc-300",
  },
};

export const DEAL_TYPE_COLOR: Record<DealType, string> = {
  ma_business: "bg-blue-100 text-blue-700 border-blue-200",
  interior: "bg-purple-100 text-purple-700 border-purple-200",
  corporate: "bg-pink-100 text-pink-700 border-pink-200",
};

/** 終端・分岐ステータス（停滞/期限/未記入の警告対象外） */
export const TERMINAL_STATUSES: DealStatus[] = [
  "closed_won",
  "handover",
  "lost",
  "on_hold",
];

export function isTerminalStatus(status: DealStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** 各ステータスへ進む前の確認チェックリスト（任意確認用） */
export const STATUS_CHECKLIST: Partial<Record<DealStatus, string[]>> = {
  nda: ["相手方の実在性を確認済み"],
  meeting_scheduling: ["NDAに双方署名・捺印済み", "詳細資料の開示準備完了"],
  basic_agreement: ["価格・スキーム・スケジュールの大枠合意"],
  due_diligence: ["基本合意書を締結済み", "DD範囲・資料リストを確定"],
  contract_drafting: ["DD完了、発見事項を整理済み", "ディールブレーカーなし"],
  contract_signed: ["最終契約書の条文合意", "社内承認（取締役会決議等）取得"],
  settlement_prep: ["クロージング前提条件を整理", "代金決済方法を確定"],
  closed_won: ["前提条件をすべて充足", "譲渡代金の着金を確認"],
  handover: ["代金決済完了", "名義変更・引継ぎの準備完了"],
};

// ============================================
// 資料・書類（案件詳細の添付ファイル / 外部URLリンク）
// ============================================

/**
 * 概要書カテゴリ。商流の上部に専用セクションで表示する主要資料（案件概要書・ノンネーム等）。
 * 一般の「資料・書類」一覧（DOCUMENT_CATEGORY_ORDER）とは分けて扱う。
 */
export const SUMMARY_CATEGORY: DocumentCategory = "summary";

/** 一般の「資料・書類」一覧で表示・選択できるカテゴリ（概要書は含めない） */
export const DOCUMENT_CATEGORY_ORDER: DocumentCategory[] = [
  "materials",
  "contract",
  "financial",
  "other",
];

/** バリデーション用：enum の全カテゴリ（概要書を含む） */
export const ALL_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  SUMMARY_CATEGORY,
  ...DOCUMENT_CATEGORY_ORDER,
];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  summary: "概要書",
  materials: "受領資料",
  contract: "契約書類",
  financial: "財務資料",
  other: "その他",
};

export const DOCUMENT_CATEGORY_COLOR: Record<DocumentCategory, string> = {
  summary: "bg-amber-100 text-amber-700 border-amber-200",
  materials: "bg-sky-100 text-sky-700 border-sky-200",
  contract: "bg-violet-100 text-violet-700 border-violet-200",
  financial: "bg-emerald-100 text-emerald-700 border-emerald-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

/** アップロード上限（Server Action のボディ上限と整合させる） */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

export function isPdfMime(mime: string | null | undefined): boolean {
  return mime === "application/pdf";
}

/** インラインプレビュー可能か（画像 or PDF） */
export function isPreviewable(mime: string | null | undefined): boolean {
  return isImageMime(mime) || isPdfMime(mime);
}

// ============================================
// 買い顧客（買いニーズの登録・管理）
// ============================================

export const BUYER_STATUS_ORDER: BuyerStatus[] = ["active", "paused", "closed"];

export const BUYER_STATUS_LABEL: Record<BuyerStatus, string> = {
  active: "対応中",
  paused: "保留",
  closed: "クローズ",
};

export const BUYER_STATUS_COLOR: Record<BuyerStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

// ============================================
// 運用ルールの警告判定（8.5節：警告表示のみ・保存はブロックしない）
// ============================================

/** 最終更新からこの日数以上動きがなければ「停滞」 */
export const STALE_DAYS = 3;

export type DealWarning = "stale" | "overdue" | "incomplete";

export const WARNING_LABEL: Record<DealWarning, string> = {
  stale: "停滞",
  overdue: "期限超過",
  incomplete: "未記入",
};

export const WARNING_COLOR: Record<DealWarning, string> = {
  stale: "bg-yellow-100 text-yellow-800 border-yellow-300",
  overdue: "bg-red-100 text-red-700 border-red-300",
  incomplete: "bg-gray-100 text-gray-600 border-gray-300",
};

/**
 * 案件の警告（停滞・期限超過・未記入）を算出する。
 * 終端/分岐ステータスは対象外。`now` を渡せるようにしてテスト可能にしている。
 */
export function getDealWarnings(
  deal: {
    current_status: DealStatus;
    updated_at: string;
    scheduled_date: string | null;
    next_action: string | null;
  },
  now: Date = new Date(),
): DealWarning[] {
  const warnings: DealWarning[] = [];
  if (isTerminalStatus(deal.current_status)) return warnings;

  const daysSinceUpdate =
    (now.getTime() - new Date(deal.updated_at).getTime()) / 86_400_000;
  if (daysSinceUpdate >= STALE_DAYS) warnings.push("stale");

  if (deal.scheduled_date && new Date(deal.scheduled_date) < now) {
    warnings.push("overdue");
  }

  if (!deal.next_action || !deal.scheduled_date) {
    warnings.push("incomplete");
  }

  return warnings;
}
