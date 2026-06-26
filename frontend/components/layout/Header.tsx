"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";

const ALL_NAV_ITEMS = [
  { href: "/", label: "새 요청" },
  { href: "/requests", label: "요청 이력" },
];

export default function Header({ email }: { email: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin } = useUserRole();
  const navItems = isAdmin ? ALL_NAV_ITEMS.filter((item) => item.href !== "/") : ALL_NAV_ITEMS;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6">
      <div className="flex items-center gap-8">
        <span className="py-4 text-sm font-bold text-gray-900">AI 기획 자동화</span>
        <nav className="flex h-full gap-6">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`-mb-px flex items-center border-b-2 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {email && <span className="text-sm text-gray-500">{email}</span>}
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          로그아웃
        </button>
      </div>
    </header>
  );
}
