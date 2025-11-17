import { notFound } from "next/navigation";

import { MobileShell } from "@/components/mobile-shell";
import { ProgramForm } from "@/components/program-form";
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

  return (
    <MobileShell
      title={`${program.code} — ${program.name}`}
      description={`${program.summary} (${program.durationMinutes} Minuten | +${program.xpReward} XP)`}
    >
      <ProgramForm program={program} />
    </MobileShell>
  );
}
