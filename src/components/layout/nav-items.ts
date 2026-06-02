export const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/deals", label: "案件一覧" },
  { href: "/customers", label: "顧客一覧" },
  { href: "/deals/new", label: "新規案件" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/deals" ? pathname === "/deals" : pathname.startsWith(href);
}
