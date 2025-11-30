import { notFound } from "next/navigation";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MobileShell } from "@/components/mobile-shell";
import { ProgramContent } from "@/components/program-content";
import { programDefinitions } from "@/lib/data";

interface ProgramPageProps {
  params: { slug: string };
}

export default function ProgramPage({ params }: ProgramPageProps) {
  const program = programDefinitions.find(
    (candidate) => candidate.slug === params.slug
  );

  if (!program) {
    return notFound();
  }

  const categoryBackLink = `/programs?category=${program.category}`;

  return (
    <MobileShell
      title={`${program.code} — ${program.name}`}
      description={`${program.summary} (${program.durationMinutes} Minuten | +${program.xpReward} XP)`}
    >
      <div className="mb-4">
        <Link
          href={categoryBackLink}
          className="inline-flex items-center gap-2 rounded-full border border-daisy-200 bg-white/80 px-4 py-2 text-sm font-semibold text-daisy-700 shadow-sm transition hover:-translate-x-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
      </div>
      <ProgramContent program={program} />
    </MobileShell>
  );
}
