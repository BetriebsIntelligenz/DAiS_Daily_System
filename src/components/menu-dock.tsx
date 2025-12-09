"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart2,
  CalendarDays,
  ListChecks,
  Gift,
  BookOpen,
  Shield
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Menu", icon: Home },
  { href: "/score", label: "Score", icon: BarChart2 },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/requirements", label: "Anforderungen", icon: ListChecks },
  { href: "/rewards", label: "Belohnungen", icon: Gift },
  { href: "/journals", label: "Journale", icon: BookOpen },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function MenuDock() {
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";

  return (
    <nav className="flex w-full justify-center text-white">
      <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-[32px] bg-white/5 px-4 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "group inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                active
                  ? "bg-white px-5 py-2 text-[#0d4bff] shadow-[0_14px_30px_rgba(13,75,255,0.35)]"
                  : "h-14 w-14 bg-white/15 text-white/90 hover:bg-white/25"
              )}
            >
              <Icon className="h-5 w-5" />
              <span
                aria-hidden="true"
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                  active
                    ? "ml-2 max-w-[160px] opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}
