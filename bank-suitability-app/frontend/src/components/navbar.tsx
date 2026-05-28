"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/customers/new", label: "顧客登録" },
  { href: "/products", label: "商品一覧" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Mizuho Biz
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            ログアウト
          </Button>
        </div>
      </div>
    </nav>
  );
}
