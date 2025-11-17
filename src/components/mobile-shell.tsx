import Link from "next/link";
import {
  Home,
  BarChart2,
  Gift,
  BookOpen,
  Shield,
  CalendarDays
} from "lucide-react";

export function MobileShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="relative isolate mx-auto max-w-4xl px-5 pb-16 pt-10">

        <div className="space-y-5">
          <div className="rounded-[36px] bg-gradient-to-b from-daisy-400 via-daisy-300 to-daisy-200 p-6 text-white shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">
                  DAiS ☼ MOBILE
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-white/90">{description}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur" />
            </div>
          </div>
          <nav className="rounded-[30px] bg-black/80 p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-around gap-3 text-sm font-semibold text-white">
              <NavLink href="/" icon={<Home className="h-4 w-4" />}>
                Menu
              </NavLink>
              <NavLink href="/score" icon={<BarChart2 className="h-4 w-4" />}>
                Score
              </NavLink>
              <NavLink href="/timeline" icon={<CalendarDays className="h-4 w-4" />}>
                Timeline
              </NavLink>
              <NavLink href="/rewards" icon={<Gift className="h-4 w-4" />}>
                Belohnungen
              </NavLink>
              <NavLink href="/journals" icon={<BookOpen className="h-4 w-4" />}>
                Journale
              </NavLink>
              <NavLink href="/admin" icon={<Shield className="h-4 w-4" />}>
                Admin
              </NavLink>
            </div>
          </nav>
        </div>

        <main className="mt-6 space-y-6 rounded-[34px] bg-white/95 p-6 shadow-card">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-[24px] bg-white/5 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.4em] text-white"
    >
      <span className="text-white">{icon}</span>
      {children}
    </Link>
  );
}
