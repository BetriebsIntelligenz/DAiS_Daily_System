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
              <Card className="relative overflow-hidden border border-blue-100/70 bg-gradient-to-br from-white via-blue-50/80 to-blue-100/60 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
                  <div className="absolute bottom-0 left-6 h-16 w-16 rounded-full bg-blue-100/70 blur-2xl" />
                  <div className="absolute inset-3 rounded-[26px] border border-white/40" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="bg-blue-100/80 text-blue-700">{program.category}</Badge>
                    <span className="relative inline-flex items-center justify-center rounded-full p-[1px]">
                      <span className="game-glow pointer-events-none absolute inset-[-10px] rounded-full bg-gradient-to-r from-blue-400 via-blue-200 to-blue-500 opacity-70 blur-2xl" />
                      <span className="pointer-events-none absolute inset-[-4px] rounded-full bg-gradient-to-r from-blue-500/25 via-transparent to-blue-400/35 opacity-80" />
                      <span className="relative inline-flex items-center gap-1 rounded-full border border-blue-200/70 bg-white/85 px-3 py-1 text-xs font-semibold text-blue-800 shadow-inner shadow-blue-200/60">
                        <Gamepad2 className="h-3.5 w-3.5" />
                        {modeLabel}
                      </span>
                    </span>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      {program.code} — {program.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {program.summary}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-900/70">
                    <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-blue-700">
                      <Sparkles className="h-3.5 w-3.5" />+{xpReward} XP
                    </span>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/50 bg-white/60 p-3 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-900/60">
                      <span>XP Power</span>
                      <span>+{xpReward}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
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
