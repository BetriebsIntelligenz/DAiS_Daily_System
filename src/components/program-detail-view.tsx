"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { ProgramContent } from "@/components/program-content";
import { Button } from "@/components/ui/button";
import { ProgramCardsSidebar, type ProgramCardsSection } from "@/components/program-cards-sidebar";
import type { ProgramDefinition } from "@/lib/types";

const PROGRAM_CARD_SECTIONS: Record<string, ProgramCardsSection[]> = {
  visualisierungstraining: ["visuals"],
  "performance-checklist": ["performance"],
  lesen: ["reading"],
  "household-cards": ["household"],
  "ziele-smart": ["goals"],
  "brain-training": ["brain"],
  "higher-thinking": ["learning"],
  "emotion-training": ["emotion"],
  meditation: ["meditation"]
};

interface ProgramDetailViewProps {
  program: ProgramDefinition;
  backLink: string;
}

export function ProgramDetailView({ program, backLink }: ProgramDetailViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sections = useMemo(
    () => PROGRAM_CARD_SECTIONS[program.slug] ?? [],
    [program.slug]
  );
  const hasCards = sections.length > 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2 text-xs font-arcade uppercase tracking-[0.35em] text-[#0b1230] shadow-arcade transition hover:-translate-x-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        {hasCards && (
          <Button variant="outline" type="button" onClick={() => setSidebarOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
      <ProgramContent program={program} />
      {hasCards && (
        <ProgramCardsSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sections={sections}
          title={`${program.code} Einstellungen`}
        />
      )}
    </>
  );
}
