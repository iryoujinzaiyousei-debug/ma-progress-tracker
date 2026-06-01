import { NextResponse } from "next/server";
import { getSharedDealByToken } from "@/lib/share";

/**
 * 顧客共有データを JSON で返す API。
 * service role でトークン照合し、share_enabled = true の案件のみ返す。
 * （共有ページ自体はサーバーコンポーネントで lib を直接利用するが、
 *  外部連携やクライアント取得用にAPIも用意している）
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await getSharedDealByToken(token);

  if (!result) {
    return NextResponse.json(
      { error: "not_found", message: "案件が見つからないか、共有が無効です。" },
      { status: 404 },
    );
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
