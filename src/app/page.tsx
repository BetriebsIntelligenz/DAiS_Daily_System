import type { JSX } from "react";

import { categories, programDefinitions } from "@/lib/data";
import { MenuCard } from "@/components/menu-card";
import { MobileShell } from "@/components/mobile-shell";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Brain,
  Briefcase,
  Leaf,
  Users2
} from "lucide-react";

export default async function HomePage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const completedProgram = searchParams?.programCompleted;
  const successMessage =
    typeof completedProgram === "string"
      ? `${completedProgram} erfolgreich abgeschlossen! XP gutgeschrieben.`
      : undefined;

  const iconMap: Record<string, JSX.Element> = {
    mind: <Brain className="h-7 w-7" />,
    body: <Activity className="h-7 w-7" />,
    human: <Users2 className="h-7 w-7" />,
    environment: <Leaf className="h-7 w-7" />,
    business: <Briefcase className="h-7 w-7" />
  };

  type ProgramStackRecord = Awaited<
    ReturnType<typeof prisma.programStack.findMany>
  >;
  let programStacks: ProgramStackRecord = [];
  try {
    programStacks = await prisma.programStack.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Programms konnten nicht geladen werden", error);
  }

  return (
    <MobileShell
      title="Programme Menü"
      description="Wähle eine Kategorie (Mind, Body, Human, Environment, Business) um mit dem nächsten Flow zu starten."
      successMessage={successMessage}
    >
      <nav className="mb-8 flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-6 rounded-[32px] border-4 border-white/60 bg-white/20 px-6 py-6 text-[#08102b] backdrop-blur">
          {categories.map((category) => {
            return (
              <a
                key={category.id}
                href={`/programs?category=${category.id}`}
                className="menu-token group flex h-32 w-32 flex-col items-center justify-center gap-4 px-6 py-6 text-center text-xs font-arcade uppercase tracking-[0.45em] text-[#3b1d00] transition hover:-translate-y-1.5 hover:shadow-arcade"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] border-2 border-white/60 bg-white/55 text-[#08143f] shadow-[0_6px_0_rgba(0,0,0,0.15)]">
                  {iconMap[category.id]}
                </span>
                <span className="text-[20px] tracking-[0.6em]">
                  {category.title.charAt(0)}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
      {programStacks.length > 0 && (
        <section className="mb-6 rounded-[36px] border-4 border-white/70 bg-white/90 p-6 text-[#0a1435] shadow-arcade">
          <header className="flex flex-col gap-1">
            <h2 className="font-arcade text-base uppercase tracking-[0.3em]">
              Program Stacks
            </h2>
            <p className="text-sm text-[#3a466d]">
              Vorkonfigurierte Routinen mit {programStacks.length} verfügbaren Flows.
            </p>
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {programStacks.map((stack) => {
              const modules = stack.programSlugs
                .map((slug) =>
                  programDefinitions.find((program) => program.slug === slug)
                )
                .filter(Boolean);
              return (
                <MenuCard
                  key={stack.id}
                  title={stack.title}
                  description={`${modules.length} Module`}
                  href={`/programs/stacks/${stack.slug}`}
                  chips={modules.slice(0, 3).map((program) => program!.code)}
                />
              );
            })}
          </div>
        </section>
      )}
    </MobileShell>
  );
}
