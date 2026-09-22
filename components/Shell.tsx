"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Languages, MessageSquare, Printer, Users } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";

const nav = [
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/groups", label: "Guruhlar", icon: Users },
  { href: "/files", label: "Fayllar", icon: FileText },
  { href: "/vocabulary", label: "Lug'at", icon: Languages },
  { href: "/print", label: "Print", icon: Printer },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { teacher, teachers, setTeacherId, loading, error } = useCurrentUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-brand-dark text-white md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <BookOpen className="h-5 w-5 text-amber" aria-hidden />
          <span className="text-base font-semibold">Cosmos AI</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0" aria-label="Asosiy menyu">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-white/15 font-medium" : "text-white/75 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-4 py-4 md:absolute md:bottom-0 md:block md:w-56">
          <label className="mb-1 block text-xs text-white/60" htmlFor="dev-teacher">Test o'qituvchi (dev)</label>
          {loading ? (
            <p className="text-xs text-white/50">Yuklanmoqda...</p>
          ) : error ? (
            <p className="text-xs text-danger">Xato: {error}</p>
          ) : teachers.length === 0 ? (
            <p className="text-xs text-white/50">teachers_hr jadvalida o'qituvchi topilmadi.</p>
          ) : (
            <select
              id="dev-teacher"
              value={teacher?.id ?? ""}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full !border-white/20 !bg-white/10 !text-white"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="text-ink">{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
