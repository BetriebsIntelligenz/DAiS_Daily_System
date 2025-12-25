"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Gamepad2, Sparkles } from "lucide-react";

import { programDefinitions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MobileShell } from "@/components/mobile-shell";

export default function ProgramsPage() {
  const searchParams = useSearchParams();
  const category = searchParams?.get("category") ?? null;

  const programs = useMemo(() => {
    if (!category) return programDefinitions;
    return programDefinitions.filter((program) => program.category === category);
  }, [category]);

  return (
    <MobileShell
      title="Programme"
      description="Alle konfigurierten Flows aus den DAiS Dokumenten."
    >
      <div className="grid gap-6">
        {programs.map((program) => {
          const xpReward = program.xpReward ?? 0;
          const xpFill = Math.min(100, Math.max(15, Math.round((xpReward / 1500) * 100)));
          const modeLabel = "Play";

          return (
            <Link key={program.id} href={`/programs/${program.slug}`}>
              <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#fff8de] via-[#ffd4f4] to-[#b7e9ff] p-4 sm:p-5 shadow-arcade transition hover:-translate-y-1.5">
                <div className="pointer-events-none absolute inset-0 opacity-50">
                  <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#ff9edc]/40 blur-3xl" />
                  <div className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-[#8fe9ff]/70 blur-2xl" />
                  <div className="absolute inset-3 rounded-[26px] border border-white/60" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{program.category}</Badge>
                    <span className="relative inline-flex items-center justify-center rounded-full p-[1px]">
                      <span className="game-glow pointer-events-none absolute inset-[-10px] rounded-full bg-gradient-to-r from-[#ffdf8f] via-[#ff9edc] to-[#8fe9ff] opacity-70 blur-2xl" />
                      <span className="pointer-events-none absolute inset-[-4px] rounded-full bg-gradient-to-r from-white/50 via-transparent to-white/30 opacity-80" />
                      <span className="relative inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-semibold text-[#0b1230] shadow-inner shadow-[#ff9edc]/40">
                        <Gamepad2 className="h-3.5 w-3.5" />
                        {modeLabel}
                      </span>
                    </span>
                  </div>
                  <div>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[#0b1230] leading-tight">
                      <span className="uppercase tracking-widest opacity-70 text-xs sm:text-base">{program.code}</span>
                      <span className="hidden sm:inline">—</span>
                      <span>{program.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm text-[#4b5685] mt-1">
                      {program.summary}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f78aa]">
                    <span className="flex items-center gap-1 rounded-full border-2 border-white/70 bg-white/70 px-3 py-1 text-[#0b1230]">
                      <Sparkles className="h-3.5 w-3.5" />+{xpReward} XP
                    </span>
                  </div>
                  <div className="space-y-2 rounded-2xl border-2 border-white/70 bg-white/70 p-3 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6f78aa]">
                      <span>XP Power</span>
                      <span>+{xpReward}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#ffe8fb]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ff9edc] to-[#6bd8ff]"
                        style={{ width: `${xpFill}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </MobileShell>
  );
}
