import { notFound } from "next/navigation";

import { MobileShell } from "@/components/mobile-shell";
import { ProgramDetailView } from "@/components/program-detail-view";
import { loadProgramBySlug } from "@/lib/programs";

interface ProgramPageProps {
  params: { slug: string };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const program = await loadProgramBySlug(params.slug);

  if (!program) {
    return notFound();
  }

  const categoryBackLink = `/programs?category=${program.category}`;

  return (
    <MobileShell
      title={`${program.code} — ${program.name}`}
      description={`${program.summary} (${program.durationMinutes} Minuten | +${program.xpReward} XP)`}
    >
      <ProgramDetailView program={program} backLink={categoryBackLink} />
    </MobileShell>
  );
}
