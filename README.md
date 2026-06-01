# M&A 進捗管理アプリ（ma-deal-tracker）

M&A・事業譲渡の案件進捗を社内で一元管理し、顧客にはトークンURLで安全に進捗を共有するためのアプリです。

- **フレームワーク**: Next.js 16（App Router）+ TypeScript
- **バックエンド / DB / 認証**: Supabase（PostgreSQL + Auth + RLS）
- **UI**: Tailwind CSS v4 + shadcn/ui（Base UI ベース）
- **一覧**: テーブル / カンバン 切替（カンバンは dnd-kit でドラッグ→ステータス更新）
- **顧客共有**: トークンURL方式（ログイン不要・案件ごとに発行・service role で照合）
- **資料・書類**: 案件詳細でファイル添付＋インラインプレビュー（画像/PDF）。重い財務資料はGoogleドライブ等のURLリンクで登録（Supabase Storage 非公開バケット＋署名URL）
- **顧客管理**: 顧客一覧を「売主（案件から集約）」「買主（買い顧客マスタ）」のタブで管理。買い顧客は**買いニーズ**（譲渡スキーム・希望価格帯・希望エリア・希望業種）を登録でき、社名一致で関連案件を自動表示

---

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. Supabase プロジェクトを作成し、スキーマを適用

Supabase ダッシュボードの **SQL Editor** で、以下を順に実行します。

1. `supabase/schema.sql`（ENUM・テーブル・トリガ）
2. `supabase/rls.sql`（行レベルセキュリティ）
3. `supabase/documents.sql`（資料・書類テーブル ＋ Storage バケット `deal-documents` ＋ RLS）
4. `supabase/buyers.sql`（買い顧客マスタ ＋ 買いニーズ ＋ RLS）

### 3. 環境変数

`.env.local` を作成し（`.env.example` をコピー）、Supabase の Settings > API から値を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# サーバー側でのみ使用（顧客共有のトークン照合）。クライアントに絶対露出させない。
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4.（任意）型を再生成

手書きの `src/lib/types.ts` を、実DBから生成し直せます（shape は同一）。

```bash
npx supabase gen types typescript --project-id <project-ref> > src/lib/types.ts
```

### 5. 起動

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
```

最初のアクセスで `/login` から **新規登録**して社内ユーザーを作成してください
（プロフィール行 `public.users` は初回ログイン時に自動作成されます）。

---

## ⚠️ このプロジェクト固有の注意（重要）

このリポジトリは Windows + OneDrive 上の日本語パスに置かれているため、ツールの都合で
通常と異なる設定をしています。**移設しない限り、以下は変更しないでください。**

1. **ビルド/開発は webpack 固定**（`package.json` の `next dev/build --webpack`）。
   Next.js 16 既定の Turbopack は、パスに含まれる日本語（`デスクトップ`）でクラッシュするため。
   ASCII のみのパスへ移設すれば `--webpack` は外して Turbopack を使えます。
2. **パスに `&` を含めない**。npm スクリプトは内部で cmd.exe を使い、`&` でコマンドが
   分割され実行に失敗します（当初の親フォルダ `M&A_Progress Tracker` がこれに該当したため、
   `AI/projects/ma-deal-tracker` に配置しています）。
3. `next.config.ts` の `outputFileTracingRoot` は、親階層の別 lockfile 誤検出を防ぐための固定です。

---

## ディレクトリ構成

```
src/
├─ app/
│  ├─ (internal)/                 # 社内向け（要ログイン・認証ガード付き）
│  │  ├─ layout.tsx               # 認証ガード + サイドバー
│  │  ├─ dashboard/page.tsx       # 集計ダッシュボード（種別/担当/ステータス + 警告サマリ）
│  │  └─ deals/
│  │     ├─ page.tsx              # 一覧（テーブル/カンバン切替）
│  │     ├─ actions.ts            # 案件のサーバーアクション（CRUD・ステータス・共有）
│  │     ├─ new/page.tsx          # 新規作成
│  │     └─ [id]/page.tsx         # 案件詳細
│  │        └─ edit/page.tsx      # 編集
│  ├─ share/[token]/page.tsx      # 顧客向け進捗ページ（ログイン不要）
│  ├─ login/                      # ログイン・新規登録
│  └─ api/share/[token]/route.ts  # service role でトークン照合（JSON API）
├─ components/
│  ├─ deals/                      # テーブル・カンバン・フォーム・バッジ・共有パネル 等
│  ├─ layout/                     # サイドバー・ページヘッダ
│  └─ ui/                         # shadcn/ui
├─ lib/
│  ├─ supabase/{client,server,admin,middleware}.ts
│  ├─ constants.ts                # ★ステータス・種別の唯一の真実（ラベル/色/順序/警告判定）
│  ├─ deals.ts                    # データアクセス（読み取り・集計）
│  ├─ share.ts                    # 顧客共有データ取得（service role）
│  ├─ format.ts                   # 金額・日付の整形
│  ├─ auth.ts                     # 認証ヘルパ
│  └─ types.ts                    # DB型定義
└─ proxy.ts                       # 認証リダイレクト（旧 middleware）
```

---

## 運用ルール（警告表示のみ・保存はブロックしない）

`lib/constants.ts` の `getDealWarnings()` が、終端ステータス以外の案件に対して次を判定します。

- **stale（停滞）**: 最終更新から3日以上経過
- **overdue（期限超過）**: 予定日を過ぎている
- **incomplete（未記入）**: 次回アクション or 予定日が未入力

これらは一覧・カンバンのカード、ダッシュボードのサマリに表示されますが、**保存は妨げません**。
