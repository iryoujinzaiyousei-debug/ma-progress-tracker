import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 では従来の middleware が "proxy" に名称変更された。
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 以下を除く全パスにマッチ:
     * - _next/static, _next/image（静的アセット）
     * - favicon.ico, 画像/フォント等の静的ファイル
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
