/**
 * プレビューモード（ログイン不要・Supabase不要でUIを確認するためのフラグ）。
 *
 * `.env.local` に `NEXT_PUBLIC_PREVIEW_MODE=true` を設定すると有効になる。
 * 有効時は認証をバイパスし、メモリ内のモックデータで全画面が動作する。
 * 本番では必ず false（または未設定）にすること。
 */
export const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";
