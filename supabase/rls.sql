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
