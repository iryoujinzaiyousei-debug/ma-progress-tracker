-- ============================================
-- 既存DBへの追加マイグレーション：概要書カテゴリ
-- 「概要書（summary）」を document_category enum に追加する。
-- 本番 Supabase の SQL Editor で一度だけ実行してください。
-- （新規セットアップでは documents.sql / setup_all.sql に既に含まれます）
-- ============================================

-- enum へ値を追加（存在しない場合のみ）。冪等に実行できる。
alter type document_category add value if not exists 'summary';

-- 既存のテーブル定義・RLS・Storage バケットは変更不要。
-- 概要書も既存の deal_documents / deal-documents バケットをそのまま利用する。
