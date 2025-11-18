import { ScoreCards } from "@/components/score-cards";
import { MobileShell } from "@/components/mobile-shell";

export default function ScorePage() {
  return (
    <MobileShell
      title="Score Dashboard"
      description="XP Überblick, Aktivitäten und Kategorie-Splits."
    >
      <ScoreCards />
    </MobileShell>
  );
}
