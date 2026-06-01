import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

/** ブラウザ（Client Component）用の Supabase クライアント。anon キーを使用。 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
