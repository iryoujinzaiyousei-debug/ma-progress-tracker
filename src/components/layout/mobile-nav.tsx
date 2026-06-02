"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NAV_ITEMS, isNavActive } from "./nav-items";

type MobileNavProps = {
  profile: {
    name: string;
    email: string;
    role: "admin" | "staff" | string;
  };
  logoutAction: () => Promise<void>;
};

export function MobileNav({ profile, logoutAction }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // ルート遷移時にドロワーを閉じる
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label="メニューを開く" />
        }
      >
        <MenuIcon />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-white shadow-xl duration-200 outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex items-center justify-between px-6 py-5">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-slate-900">
              M&amp;A 進捗管理
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="閉じる" />
              }
            >
              <XIcon />
            </DialogPrimitive.Close>
          </div>

          <nav
            className="flex flex-col gap-1 px-3"
            aria-label="メインナビゲーション"
          >
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

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
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
