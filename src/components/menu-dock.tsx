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
  { href: "/", label: "Home", icon: Home, accent: "from-[#c2f5ff] to-[#6ad7ff]" },
  { href: "/score", label: "Score", icon: BarChart2, accent: "from-[#ffe7c4] to-[#ffb77f]" },
  { href: "/timeline", label: "Timeline", icon: CalendarDays, accent: "from-[#fce0ff] to-[#ff9edc]" },
  { href: "/requirements", label: "Tasks", icon: ListChecks, accent: "from-[#d7ffe6] to-[#6bf2a0]" },
  { href: "/rewards", label: "Rewards", icon: Gift, accent: "from-[#ffe0f1] to-[#ff9ad1]" },
  { href: "/journals", label: "Journal", icon: BookOpen, accent: "from-[#e8e4ff] to-[#b2a3ff]" },
  { href: "/admin", label: "Admin", icon: Shield, accent: "from-[#d9f3ff] to-[#9ad7ff]" }
];

export function MenuDock() {
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";

  return (
    <nav className="flex w-full justify-center text-white">
      <div className="grid w-full max-w-5xl grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4 rounded-[32px] bg-white/10 px-4 py-5 sm:px-10 backdrop-blur">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "group flex h-24 sm:h-28 flex-col items-center justify-center gap-2 sm:gap-3 rounded-[26px] p-2 sm:px-4 sm:py-4 text-center text-[9px] font-arcade uppercase tracking-[0.2em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                active
                  ? "bg-white/90 text-black shadow-[0_12px_0_rgba(10,19,29,0.6)]"
                  : "bg-transparent text-black/60 hover:bg-white/10 hover:-translate-y-1.5"
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-[#04142b] shadow-[0_5px_0_rgba(6,20,43,0.45)]",
                  "bg-gradient-to-br",
                  accent,
                  active ? "border-2 border-white/70" : "border border-white/30"
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="whitespace-nowrap text-[0.6rem] sm:text-[9px]">{label}</span>
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
