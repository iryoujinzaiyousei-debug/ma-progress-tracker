"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = { error: null };

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "login" ? "サインイン" : "新規登録"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          M&A進捗管理 — 社内メンバー専用
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirect" value={redirectTo} />

        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">氏名</Label>
            <Input id="name" name="name" placeholder="山田 太郎" required />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="••••••••"
            required
          />
        </div>

        {state.error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 border border-rose-200">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? "処理中…"
            : mode === "login"
              ? "サインイン"
              : "登録してはじめる"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        {mode === "login" ? (
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="font-medium text-slate-700 underline-offset-4 hover:underline"
          >
            社内メンバーの新規登録はこちら
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-medium text-slate-700 underline-offset-4 hover:underline"
          >
            既にアカウントをお持ちの方はサインイン
          </button>
        )}
      </div>
    </div>
  );
}
