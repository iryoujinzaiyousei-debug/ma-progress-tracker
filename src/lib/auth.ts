import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import { previewStore } from "@/lib/preview/store";
import type { UserRow } from "@/lib/types";

/**
 * 現在ログイン中の社内ユーザー（auth + プロフィール）を取得する。
 * プロフィール行（public.users）が無ければ、auth情報から自動作成する。
 * 未ログインなら null を返す。
 */
export async function getCurrentUser(): Promise<{
  authId: string;
  email: string;
  profile: UserRow;
} | null> {
  if (PREVIEW_MODE) return previewStore.previewUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return { authId: user.id, email: user.email ?? "", profile };
  }

  // プロフィール未作成 → auth のメタdata から作成
  const fallbackName =
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "ユーザー";

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      id: user.id,
      email: user.email ?? "",
      name: fallbackName,
    })
    .select("*")
    .single();

  if (error || !created) return null;

  return { authId: user.id, email: user.email ?? "", profile: created };
}

/**
 * 認証必須ページ用。未ログインなら /login にリダイレクトする。
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
