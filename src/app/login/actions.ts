"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";

export type AuthState = { error: string | null };

/** メール+パスワードでログイン */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/deals");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "ログインに失敗しました。入力内容をご確認ください。" };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo.startsWith("/") ? redirectTo : "/deals");
}

/** 新規社内ユーザー登録（メール確認が有効な場合は確認後にログイン可） */
export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "氏名・メールアドレス・パスワードを入力してください。" };
  }
  if (password.length < 8) {
    return { error: "パスワードは8文字以上にしてください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: `登録に失敗しました：${error.message}` };
  }

  // メール確認が無効ならそのままセッションが張られる。
  revalidatePath("/", "layout");
  redirect("/deals");
}

/** ログアウト */
export async function logoutAction() {
  if (!PREVIEW_MODE) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect(PREVIEW_MODE ? "/dashboard" : "/login");
}
