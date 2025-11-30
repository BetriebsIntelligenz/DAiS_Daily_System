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
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-3xl bg-white/80 px-5 py-4 shadow-[0_12px_35px_rgba(234,196,94,0.25)] backdrop-blur">
          {categories.map((category) => {
            return (
              <a
                key={category.id}
                href={`/programs?category=${category.id}`}
                className="group flex min-w-[120px] flex-col items-center gap-2 rounded-2xl bg-gradient-to-r from-daisy-200 to-daisy-400 px-4 py-3 text-center text-amber-900 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-amber-900 shadow-inner">
                  {iconMap[category.id]}
                </span>
                <span className="text-sm font-semibold tracking-wide">
                  {category.title}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
      {programStacks.length > 0 && (
        <section className="mb-6 rounded-3xl bg-white/80 p-6">
          <header className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Programms</h2>
            <p className="text-sm text-gray-500">
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
                  accent="from-daisy-300 to-daisy-600"
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
