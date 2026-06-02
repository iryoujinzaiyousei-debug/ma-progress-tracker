"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { DealFormState } from "@/app/(internal)/deals/actions";
import type { DealWithAssignees } from "@/lib/deals";
import type { UserRow } from "@/lib/types";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  DEAL_TYPE_ORDER,
  DEAL_TYPE_LABEL,
  STATUS_CHECKLIST,
  isTerminalStatus,
  type DealStatus,
  type DealType,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = (
  prev: DealFormState,
  form: FormData,
) => Promise<DealFormState>;

const initial: DealFormState = { error: null };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function DealForm({
  action,
  users,
  buyers,
  deal,
}: {
  action: Action;
  users: UserRow[];
  buyers: { id: string; company_name: string }[];
  deal?: DealWithAssignees;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  const [status, setStatus] = useState<DealStatus>(
    deal?.current_status ?? "inquiry",
  );
  const [buyerCompany, setBuyerCompany] = useState(deal?.buyer_company ?? "");
  const [nextAction, setNextAction] = useState(deal?.next_action ?? "");
  const [scheduledDate, setScheduledDate] = useState(
    deal?.scheduled_date ?? "",
  );
  const [assignees, setAssignees] = useState<string[]>(
    deal?.assignees.map((a) => a.user_id) ?? [],
  );
  const [primary, setPrimary] = useState<string>(
    deal?.assignees.find((a) => a.is_primary)?.user_id ?? "",
  );

  const terminal = isTerminalStatus(status);
  const showIncompleteWarning = !terminal && (!nextAction || !scheduledDate);
  const checklist = STATUS_CHECKLIST[status];

  function toggleAssignee(id: string) {
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* 基本情報 */}
      <Section title="基本情報">
        <div className="space-y-1.5">
          <Label htmlFor="deal_name">
            案件名 <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="deal_name"
            name="deal_name"
            required
            defaultValue={deal?.deal_name ?? ""}
            placeholder="例：飲食店A 事業譲渡"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="deal_type">
              案件種別 <span className="text-rose-500">*</span>
            </Label>
            <select
              id="deal_type"
              name="deal_type"
              required
              defaultValue={deal?.deal_type ?? ""}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="" disabled>
                選択してください
              </option>
              {DEAL_TYPE_ORDER.map((t: DealType) => (
                <option key={t} value={t}>
                  {DEAL_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="current_status">進捗ステータス</Label>
            <select
              id="current_status"
              name="current_status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DealStatus)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {checklist && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-xs font-medium text-amber-800">
              「{STATUS_LABEL[status]}」へ進む前の確認
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* 概要書（新規登録時のみ。編集時は詳細画面の概要書セクションから操作） */}
      {!deal && (
        <Section
          title="概要書（任意）"
          description="案件概要書のPDFを登録できます。あとから詳細画面でも追加・差し替えできます。"
        >
          <div className="space-y-1.5">
            <Label htmlFor="summary_name">表示名（任意）</Label>
            <Input
              id="summary_name"
              name="summary_name"
              placeholder="未入力ならファイル名を使用（例：案件概要書）"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary_file">概要書PDF（上限25MB）</Label>
            <Input
              id="summary_file"
              name="summary_file"
              type="file"
              accept="application/pdf,.pdf"
            />
            <p className="text-xs text-slate-400">
              重いファイルはアップロードに失敗することがあります。その場合は作成後に詳細画面から登録してください。
            </p>
          </div>
        </Section>
      )}

      {/* 商流 */}
      <Section
        title="商流"
        description="紹介元 → 弊社 → 紹介先。後から経路が分かるよう正式社名で（任意）。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seller_company">売主社名</Label>
            <Input
              id="seller_company"
              name="seller_company"
              defaultValue={deal?.seller_company ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buyer_company">買主社名</Label>
            {buyers.length > 0 && (
              <select
                aria-label="買主マスタから選択"
                value=""
                onChange={(e) => {
                  if (e.target.value) setBuyerCompany(e.target.value);
                }}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-600 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="">買主マスタから選択…</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.company_name}>
                    {b.company_name}
                  </option>
                ))}
              </select>
            )}
            <Input
              id="buyer_company"
              name="buyer_company"
              value={buyerCompany}
              onChange={(e) => setBuyerCompany(e.target.value)}
              placeholder="直接入力、または上のマスタから選択"
            />
            {buyers.length > 0 && (
              <p className="text-xs text-slate-400">
                マスタから選ぶと、その買い顧客の関連案件として自動で紐づきます。
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referrer_company">紹介元（任意）</Label>
            <Input
              id="referrer_company"
              name="referrer_company"
              defaultValue={deal?.referrer_company ?? ""}
              placeholder="後から経路が分かるよう正式社名で"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referred_company">紹介先（任意）</Label>
            <Input
              id="referred_company"
              name="referred_company"
              defaultValue={deal?.referred_company ?? ""}
              placeholder="後から経路が分かるよう正式社名で"
            />
          </div>
        </div>
      </Section>

      {/* 進捗管理 */}
      <Section
        title="次回アクション・予定日"
        description="未入力でも保存できますが、画面で「未記入」警告が表示されます（終端ステータスを除く）。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="next_action">次回アクション</Label>
            <Input
              id="next_action"
              name="next_action"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="例：NDA案を先方へ送付"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scheduled_date">予定日</Label>
            <Input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>
        {showIncompleteWarning && (
          <p className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800">
            次回アクション or 予定日が未記入です。このまま保存もできますが、
            一覧で「未記入」として強調されます。
          </p>
        )}
      </Section>

      {/* 金額 */}
      <Section title="金額" description="単位：円。顧客共有ページにも表示されます。">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="transfer_price">譲渡価格</Label>
            <Input
              id="transfer_price"
              name="transfer_price"
              inputMode="numeric"
              defaultValue={deal?.transfer_price ?? ""}
              placeholder="例：12000000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="retainer_fee">着手金</Label>
            <Input
              id="retainer_fee"
              name="retainer_fee"
              inputMode="numeric"
              defaultValue={deal?.retainer_fee ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="success_fee">成功報酬</Label>
            <Input
              id="success_fee"
              name="success_fee"
              inputMode="numeric"
              defaultValue={deal?.success_fee ?? ""}
            />
          </div>
        </div>
      </Section>

      {/* 担当者 */}
      <Section
        title="担当者"
        description="1案件に複数紐づけ可。主担当を1名選べます。"
      >
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">
            社内ユーザーがまだ登録されていません。
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {users.map((u) => {
              const checked = assignees.includes(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="assignee_ids"
                      value={u.id}
                      checked={checked}
                      onChange={() => toggleAssignee(u.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {u.name}
                  </label>
                  {checked && (
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      <input
                        type="radio"
                        name="primary_assignee_id"
                        value={u.id}
                        checked={primary === u.id}
                        onChange={() => setPrimary(u.id)}
                      />
                      主担当
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* 備考 */}
      <Section title="備考">
        <div className="space-y-1.5">
          <Label htmlFor="remarks_internal">
            社内用メモ（顧客非表示）
          </Label>
          <Textarea
            id="remarks_internal"
            name="remarks_internal"
            rows={3}
            defaultValue={deal?.remarks_internal ?? ""}
            placeholder="重要事項・懸念点・条件を記載"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="remarks_shared">顧客共有用メモ</Label>
          <Textarea
            id="remarks_shared"
            name="remarks_shared"
            rows={3}
            defaultValue={deal?.remarks_shared ?? ""}
            placeholder="顧客の進捗ページに表示される説明など"
          />
        </div>
      </Section>

      {/* 顧客共有 */}
      <Section
        title="顧客共有"
        description="ONにすると、案件のトークンURLから顧客が進捗を閲覧できます。"
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="share_enabled"
            defaultChecked={deal?.share_enabled ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          顧客共有を有効にする
        </label>
      </Section>

      {state.error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 border border-rose-200">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          render={<Link href={deal ? `/deals/${deal.id}` : "/deals"} />}
          variant="ghost"
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : deal ? "変更を保存" : "案件を作成"}
        </Button>
      </div>
    </form>
  );
}
