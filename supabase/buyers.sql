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
