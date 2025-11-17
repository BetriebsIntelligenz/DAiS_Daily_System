import { ScoreCards } from "@/components/score-cards";
import { MobileShell } from "@/components/mobile-shell";

export default function ScorePage() {
  const categoryXp = {
    Mind: 4200,
    Body: 2300,
    Human: 1800,
    Environment: 1600,
    Business: 3400
  };

  return (
    <MobileShell
      title="Score Dashboard"
      description="XP Überblick, Aktivitäten und Kategorie-Splits."
    >
      <ScoreCards totalXp={13300} categoryXp={categoryXp} />
    </MobileShell>
  );
}
