-- ============================================
-- 資料・書類（案件詳細での添付ファイル / 外部URLリンク）
-- schema.sql / rls.sql の後に SQL Editor で実行してください。
-- ============================================

-- 書類カテゴリ
create type document_category as enum (
  'summary',    -- 概要書（案件概要書・ノンネーム等。商流上部に表示する主要資料）
  'materials',  -- 受領資料
  'contract',   -- 契約書類
  'financial',  -- 財務資料
  'other'       -- その他
);

-- 書類テーブル（kind='file' は Storage 添付、kind='link' は外部URL）
create table public.deal_documents (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals(id) on delete cascade,
  category     document_category not null default 'other',
  kind         text not null check (kind in ('file', 'link')),
  name         text not null,                 -- 表示名
  file_path    text,                          -- Storage 上のパス（kind=file）
  mime_type    text,
  size_bytes   bigint,
  external_url text,                          -- 外部URL（kind=link、例: Googleドライブ）
  uploaded_by  uuid references public.users(id),
  created_at   timestamptz not null default now()
);

create index idx_documents_deal
  on public.deal_documents(deal_id, created_at desc);

alter table public.deal_documents enable row level security;

create policy "staff full access documents"
  on public.deal_documents for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================
-- Storage バケット（非公開）。署名URL経由でのみ閲覧する。
-- ============================================
insert into storage.buckets (id, name, public)
values ('deal-documents', 'deal-documents', false)
on conflict (id) do nothing;

create policy "staff read deal documents"
  on storage.objects for select
  using (bucket_id = 'deal-documents' and auth.role() = 'authenticated');

create policy "staff upload deal documents"
  on storage.objects for insert
  with check (bucket_id = 'deal-documents' and auth.role() = 'authenticated');

create policy "staff delete deal documents"
  on storage.objects for delete
  using (bucket_id = 'deal-documents' and auth.role() = 'authenticated');
