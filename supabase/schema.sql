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
