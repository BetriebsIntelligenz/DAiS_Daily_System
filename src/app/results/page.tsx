import { ResultsBoard } from "@/components/results-board";
import { MobileShell } from "@/components/mobile-shell";

export default function ResultsPage() {
  return (
    <MobileShell
      title="Results"
      description="Verwalte Result-Objekte, öffne strukturierte Detail-Popups und verfolge Änderungen automatisch im Log."
    >
      <ResultsBoard />
    </MobileShell>
  );
}
