-- ============================================
-- M&A進捗管理アプリ — Supabase スキーマ
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行してください。
-- （schema.sql → rls.sql の順に実行）
-- ============================================

-- ============================================
-- 0. 拡張機能
-- ============================================
create extension if not exists "pgcrypto";

-- ============================================
-- 1. ENUM 型
-- ============================================
create type deal_type as enum (
  'ma_business',   -- M&A（事業譲渡）
  'interior',      -- 内装譲渡
  'corporate'      -- 法人格譲渡
);

create type deal_status as enum (
  'proposing',           -- 提案中
  'inquiry',             -- 問い合わせ
  'materials_received',  -- 資料受領
  'nda',                 -- 秘密保持契約（NDA）
  'meeting_scheduling',  -- 面談調整中
  'meeting_done',        -- 面談実施
  'basic_agreement',     -- 基本合意
  'due_diligence',       -- DD
  'contract_drafting',   -- 契約書作成中
  'contract_signed',     -- 契約締結
  'settlement_prep',     -- 決済準備
  'closed_won',          -- 成約
  'handover',            -- 引渡
  'lost',                -- 失注
  'on_hold'              -- 保留
);

create type user_role as enum ('admin', 'staff');

-- ============================================
-- 2. 社内ユーザー
--    Supabase Auth の auth.users と 1:1 で紐づくプロフィール
-- ============================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        user_role not null default 'staff',
  created_at  timestamptz not null default now()
);

-- ============================================
-- 3. 案件
-- ============================================
create table public.deals (
  id                uuid primary key default gen_random_uuid(),
  deal_name         text not null,                       -- 案件名
  deal_type         deal_type not null,                  -- 案件種別
  seller_company    text,                                -- 売主社名
  buyer_company     text,                                -- 買主社名
  referrer_company  text,                                -- 紹介元（任意）
  referred_company  text,                                -- 紹介先（任意）
  current_status    deal_status not null default 'inquiry',
  next_action       text,                                -- 次回アクション
  scheduled_date    date,                                -- 予定日
  -- 金額（単位：円）
  transfer_price    bigint,                              -- 譲渡価格
  retainer_fee      bigint,                              -- 着手金
  success_fee       bigint,                              -- 成功報酬
  -- 備考（社内用と顧客共有用を分離）
  remarks_internal  text,                                -- 社内用（顧客非表示）
  remarks_shared    text,                                -- 顧客共有用
  -- 顧客共有トークン（推測困難なランダム文字列）
  share_token       text unique default encode(gen_random_bytes(24), 'hex'),
  share_enabled     boolean not null default false,      -- 共有ON/OFF
  created_by        uuid references public.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_deals_status on public.deals(current_status);
create index idx_deals_type on public.deals(deal_type);
create index idx_deals_share_token on public.deals(share_token);

-- ============================================
-- 4. 案件 ↔ 担当者（多対多）
-- ============================================
create table public.deal_assignees (
  deal_id     uuid not null references public.deals(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  is_primary  boolean not null default false,            -- 主担当フラグ
  primary key (deal_id, user_id)
);

-- ============================================
-- 5. 進捗履歴（顧客向けタイムライン兼 監査ログ）
-- ============================================
create table public.deal_status_history (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  from_status deal_status,
  to_status   deal_status not null,
  note        text,
  changed_by  uuid references public.users(id),
  changed_at  timestamptz not null default now()
);

create index idx_history_deal on public.deal_status_history(deal_id, changed_at desc);

-- ============================================
-- 6. updated_at 自動更新トリガ
-- ============================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ============================================
-- 7. ステータス変更時に履歴を自動記録
-- ============================================
create or replace function public.log_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.deal_status_history(deal_id, from_status, to_status, changed_by)
    values (new.id, null, new.current_status, new.created_by);
  elsif (new.current_status is distinct from old.current_status) then
    insert into public.deal_status_history(deal_id, from_status, to_status, changed_by)
    values (new.id, old.current_status, new.current_status, new.created_by);
  end if;
  return new;
end; $$;

create trigger trg_deals_status_log
  after insert or update on public.deals
  for each row execute function public.log_status_change();
-- ============================================
-- M&A進捗管理アプリ — RLS（行レベルセキュリティ）
-- schema.sql の後に SQL Editor で実行してください。
--
-- 方針：社内ユーザー（authenticated）は全件操作可。
-- 顧客向け共有はトークン照合のためサーバー側（service role）で処理し、
-- ブラウザからは直接 deals を読ませない。
-- ============================================

-- RLS 有効化
alter table public.users enable row level security;
alter table public.deals enable row level security;
alter table public.deal_assignees enable row level security;
alter table public.deal_status_history enable row level security;

-- ログイン済み社内ユーザーは自分のプロフィールを読める
create policy "users read own profile"
  on public.users for select
  using (auth.uid() = id);

-- 社内ユーザーは users 全件を読める（担当者選択などで必要）
create policy "staff read all users"
  on public.users for select
  using (auth.role() = 'authenticated');

-- 自分のプロフィールを作成・更新できる（初回登録用）
create policy "users upsert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 社内ユーザー（authenticated）は案件を全件操作できる
create policy "staff full access deals"
  on public.deals for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "staff full access assignees"
  on public.deal_assignees for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "staff full access history"
  on public.deal_status_history for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 注意：
-- 顧客向け共有ページは share_token で1件だけ取得する。
-- これは Next.js のサーバー側（route handler / server action）で
-- SUPABASE_SERVICE_ROLE_KEY を使い、share_enabled = true の案件のみ返す。
-- anon キーでは deals テーブルを読めないため、トークン漏洩以外で顧客データは露出しない。
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
-- ============================================
-- 買い顧客マスタ（買いニーズの登録・管理）
-- schema.sql / rls.sql の後に SQL Editor で実行してください。
-- ============================================

-- 買い顧客のステータス
create type buyer_status as enum (
  'active',  -- 対応中
  'paused',  -- 保留
  'closed'   -- クローズ
);

create table public.buyers (
  id              uuid primary key default gen_random_uuid(),
  company_name    text not null,                 -- 社名 / 名義
  contact_name    text,                          -- 担当者名
  contact_email   text,
  contact_phone   text,
  -- 買いニーズ
  desired_schemes deal_type[] not null default '{}', -- 希望する譲渡スキーム（案件種別、複数可）
  budget_min      bigint,                        -- 希望価格 下限（円）
  budget_max      bigint,                        -- 希望価格 上限（円）
  areas           text[] not null default '{}',  -- 希望エリア（複数）
  industries      text,                          -- 希望業種・事業領域（自由記述）
  notes           text,                          -- 備考・条件メモ
  status          buyer_status not null default 'active',
  created_by      uuid references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_buyers_status on public.buyers(status);
create index idx_buyers_company on public.buyers(company_name);

-- updated_at 自動更新（schema.sql の set_updated_at を再利用）
create trigger trg_buyers_updated_at
  before update on public.buyers
  for each row execute function public.set_updated_at();

alter table public.buyers enable row level security;

create policy "staff full access buyers"
  on public.buyers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
