-- ============================================
-- 既存DBへの追加マイグレーション：提案中ステータス
-- 「提案中（proposing）」を deal_status enum の「問い合わせ（inquiry）」の前に追加する。
-- 本番 Supabase の SQL Editor で一度だけ実行してください。
-- （新規セットアップでは schema.sql / setup_all.sql に既に含まれます）
-- ============================================

-- enum へ値を追加（存在しない場合のみ、inquiry の直前に挿入）。冪等に実行できる。
alter type deal_status add value if not exists 'proposing' before 'inquiry';

-- 既存のテーブル定義・RLS は変更不要。
-- deals.current_status の既定値は 'inquiry' のまま（新規案件の初期値は変更しない）。
