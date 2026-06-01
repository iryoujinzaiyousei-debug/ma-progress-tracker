import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_MODE } from "@/lib/preview/flag";
import type { Database } from "@/lib/types";

/** 認証不要でアクセスできるパスのプレフィックス */
const PUBLIC_PREFIXES = ["/login", "/share", "/api/share"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * セッションを更新しつつ、未ログインで保護ルートに来たら /login へ、
 * ログイン済みで /login に来たら /deals へリダイレクトする。
 */
export async function updateSession(request: NextRequest) {
  // プレビューモードでは認証チェックをスキップ（ログイン不要で内部を確認）。
  if (PREVIEW_MODE) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() を必ず呼んでトークンを検証・更新する（getSession より安全）。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/deals";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
