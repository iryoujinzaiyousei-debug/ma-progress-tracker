import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-6 py-5">
          <Link href="/dashboard" className="block">
            <span className="text-base font-semibold tracking-tight text-slate-900">
              M&amp;A 進捗管理
            </span>
          </Link>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-slate-200 p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-slate-800">
              {profile.name}
            </p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
            <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {profile.role === "admin" ? "管理者" : "担当者"}
            </span>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full"
            >
              ログアウト
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* モバイル用ヘッダ */}
        <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <MobileNav profile={profile} logoutAction={logoutAction} />
          <span className="text-sm font-semibold">M&amp;A 進捗管理</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
