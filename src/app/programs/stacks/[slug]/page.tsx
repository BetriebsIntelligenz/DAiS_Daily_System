import { notFound } from "next/navigation";

import { MobileShell } from "@/components/mobile-shell";
import { ProgramStackRunner } from "@/components/program-stack-runner";
import { prisma } from "@/lib/prisma";
import { programDefinitions } from "@/lib/data";
import type { ProgramDefinition } from "@/lib/types";

interface ProgramStackPageProps {
  params: { slug: string };
}

export default async function ProgramStackPage({ params }: ProgramStackPageProps) {
  type StackRecord = Awaited<
    ReturnType<typeof prisma.programStack.findUnique>
  >;
  let stack: StackRecord = null;
  try {
    stack = await prisma.programStack.findUnique({
      where: { slug: params.slug }
    });
  } catch (error) {
    console.error("Programm Stack konnte nicht geladen werden", error);
  }

  if (!stack) {
    return notFound();
  }

  const programs = stack.programSlugs
    .map((slug) => programDefinitions.find((program) => program.slug === slug))
    .filter(Boolean) as ProgramDefinition[];

  if (programs.length === 0) {
    return notFound();
  }

  return (
    <MobileShell
      title={`Programm ${stack.title}`}
      description={`${stack.summary} · ${programs.length} Module`}
    >
      <ProgramStackRunner stack={stack} programs={programs} />
    </MobileShell>
  );
}
