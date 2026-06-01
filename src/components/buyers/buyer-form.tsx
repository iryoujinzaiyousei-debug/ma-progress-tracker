"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BuyerFormState } from "@/app/(internal)/buyers/actions";
import type { BuyerRow } from "@/lib/types";
import {
  DEAL_TYPE_ORDER,
  DEAL_TYPE_LABEL,
  BUYER_STATUS_ORDER,
  BUYER_STATUS_LABEL,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = (
  prev: BuyerFormState,
  form: FormData,
) => Promise<BuyerFormState>;

const initial: BuyerFormState = { error: null };

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

export function BuyerForm({
  action,
  buyer,
}: {
  action: Action;
  buyer?: BuyerRow;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-5">
      {/* 基本情報 */}
      <Section title="基本情報">
        <div className="space-y-1.5">
          <Label htmlFor="company_name">
            社名 / 名義 <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="company_name"
            name="company_name"
            required
            defaultValue={buyer?.company_name ?? ""}
            placeholder="例：株式会社○○ / 個人投資家 △△様"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact_name">担当者名</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={buyer?.contact_name ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">メール</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={buyer?.contact_email ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">電話</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              defaultValue={buyer?.contact_phone ?? ""}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">ステータス</Label>
          <select
            id="status"
            name="status"
            defaultValue={buyer?.status ?? "active"}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:border-slate-900 focus:outline-none sm:w-48"
          >
            {BUYER_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {BUYER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* 買いニーズ */}
      <Section
        title="買いニーズ"
        description="希望する譲渡スキーム・価格帯・エリア・業種を登録します。"
      >
        <div className="space-y-1.5">
          <Label>希望する譲渡スキーム（複数可）</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {DEAL_TYPE_ORDER.map((t) => (
              <label
                key={t}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="desired_schemes"
                  value={t}
                  defaultChecked={buyer?.desired_schemes?.includes(t) ?? false}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {DEAL_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="budget_min">希望価格 下限（円）</Label>
            <Input
              id="budget_min"
              name="budget_min"
              inputMode="numeric"
              defaultValue={buyer?.budget_min ?? ""}
              placeholder="例：10000000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget_max">希望価格 上限（円）</Label>
            <Input
              id="budget_max"
              name="budget_max"
              inputMode="numeric"
              defaultValue={buyer?.budget_max ?? ""}
              placeholder="例：100000000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="areas">希望エリア（カンマ区切りで複数）</Label>
          <Input
            id="areas"
            name="areas"
            defaultValue={buyer?.areas?.join("、") ?? ""}
            placeholder="例：東京都、神奈川県、全国"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industries">希望業種・事業領域</Label>
          <Input
            id="industries"
            name="industries"
            defaultValue={buyer?.industries ?? ""}
            placeholder="例：飲食・サービス業、IT・SaaS など"
          />
        </div>
      </Section>

      {/* 備考 */}
      <Section title="備考・条件メモ">
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={buyer?.notes ?? ""}
          placeholder="重視する条件・除外条件・温度感などを記載"
        />
      </Section>

      {state.error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          render={<Link href={buyer ? `/buyers/${buyer.id}` : "/customers"} />}
          variant="ghost"
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "保存中…" : buyer ? "変更を保存" : "買い顧客を登録"}
        </Button>
      </div>
    </form>
  );
}
