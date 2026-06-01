import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";

/** 円金額を整形（null は「—」）。例: 12000000 → "¥12,000,000" */
export function formatYen(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `¥${value.toLocaleString("ja-JP")}`;
}

/** 億・万を使った短縮表記。例: 120000000 → "1.2億円" */
export function formatYenShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toLocaleString("ja-JP", {
      maximumFractionDigits: 2,
    })}億円`;
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toLocaleString("ja-JP", {
      maximumFractionDigits: 1,
    })}万円`;
  }
  return `${value.toLocaleString("ja-JP")}円`;
}

/** ISO日付文字列を "yyyy/MM/dd" に整形 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  return format(d, "yyyy/MM/dd", { locale: ja });
}

/** ISO日時を "M月d日 HH:mm" に整形 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  return format(d, "M月d日 HH:mm", { locale: ja });
}

/** 希望価格帯を整形。例: (10000000, 50000000) → "1,000万円 〜 5,000万円" */
export function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return "—";
  if (hasMin && hasMax) return `${formatYenShort(min)} 〜 ${formatYenShort(max)}`;
  if (hasMin) return `${formatYenShort(min)} 〜`;
  return `〜 ${formatYenShort(max)}`;
}

/** バイト数を人間可読に整形。例: 1536000 → "1.5 MB" */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/** 「3日前」など相対表記（簡易） */
export function formatRelativeDays(value: string | null | undefined): string {
  if (!value) return "—";
  const d = parseISO(value);
  if (!isValid(d)) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  return `${days}日前`;
}
