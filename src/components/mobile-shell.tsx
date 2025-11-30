import Link from "next/link";
import {
  Home,
  BarChart2,
  Gift,
  BookOpen,
  Shield,
  CalendarDays,
  ListChecks
} from "lucide-react";
import { SuccessToast } from "./success-toast";
import { UserMenu } from "./user-menu";

export function MobileShell({
  title,
  description,
  children,
  successMessage
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  successMessage?: string;
}) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="relative isolate mx-auto max-w-4xl px-5 pb-16 pt-10">

        <div className="space-y-5">
          {successMessage && (
            <div className="flex justify-center">
              <SuccessToast message={successMessage} />
            </div>
          )}
          <div className="rounded-[26px] bg-gradient-to-b from-daisy-400 via-daisy-300 to-daisy-200 p-6 text-white shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/80">
                  DAiS ☼ MOBILE
                </p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-white/90">{description}</p>
              </div>
              <UserMenu />
            </div>
          </div>
      <nav className="rounded-[24px] bg-black/85 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-around gap-4 text-white">
          <NavLink href="/" label="Menu" icon={<Home className="h-6 w-6" />} />
          <NavLink
            href="/score"
            label="Score"
            icon={<BarChart2 className="h-6 w-6" />}
          />
          <NavLink
            href="/timeline"
            label="Timeline"
            icon={<CalendarDays className="h-6 w-6" />}
          />
          <NavLink
            href="/requirements"
            label="Anforderungen"
            icon={<ListChecks className="h-6 w-6" />}
          />
          <NavLink
            href="/rewards"
            label="Belohnungen"
            icon={<Gift className="h-6 w-6" />}
          />
          <NavLink
            href="/journals"
            label="Journale"
            icon={<BookOpen className="h-6 w-6" />}
          />
          <NavLink
            href="/admin"
            label="Admin"
            icon={<Shield className="h-6 w-6" />}
          />
        </div>
      </nav>
        </div>

        <main className="mt-6 space-y-6 rounded-[22px] bg-white/95 p-6 shadow-card">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
      aria-label={label}
      title={label}
    >
      <span className="text-white">{icon}</span>
    </Link>
  );
}
