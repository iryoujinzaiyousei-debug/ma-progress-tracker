import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/") ? redirect : "/deals";

  return (
    <main className="flex min-h-dvh">
      {/* 左：ブランド面（editorial 寄りの落ち着いたダーク） */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-slate-100 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(60rem 60rem at 80% -10%, rgba(56,189,248,0.25), transparent), radial-gradient(40rem 40rem at -10% 110%, rgba(16,185,129,0.2), transparent)",
          }}
        />
        <div className="relative">
          <span className="text-sm font-medium tracking-widest text-slate-400">
            M&amp;A DEAL TRACKER
          </span>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-snug">
            案件の今を、
            <br />
            誰が見ても分かる状態に。
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            問い合わせから引渡まで、進捗・金額・商流・担当を一元管理。
            顧客にはトークンURLで安全に進捗を共有できます。
          </p>
        </div>
        <div className="relative text-xs text-slate-500">
          Next.js · Supabase · Tailwind
        </div>
      </aside>

      {/* 右：フォーム面 */}
      <section className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <LoginForm redirectTo={redirectTo} />
      </section>
    </main>
  );
}
