import { categories, programDefinitions } from "@/lib/data";
import { MenuCard } from "@/components/menu-card";
import { MobileShell } from "@/components/mobile-shell";

export default function HomePage() {
  return (
    <MobileShell
      title="Programme Menü"
      description="Wähle eine Kategorie (Mind, Body, Human, Environment, Business) um mit dem nächsten Flow zu starten."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => {
          const programs = programDefinitions.filter(
            (program) => program.category === category.id
          );
          return (
            <MenuCard
              key={category.id}
              title={category.title}
              description={`${programs.length} Programme`}
              href={`/programs?category=${category.id}`}
              accent={`from-daisy-200 to-daisy-500`}
              chips={programs.slice(0, 3).map((program) => program.code)}
            />
          );
        })}
      </section>
    </MobileShell>
  );
}
