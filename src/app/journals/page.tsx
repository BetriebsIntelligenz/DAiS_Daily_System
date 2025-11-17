import { JournalBoard } from "@/components/journal-board";
import { MobileShell } from "@/components/mobile-shell";

export default function JournalsPage() {
  return (
    <MobileShell
      title="Journale"
      description="Lern-, Erfolgs- und Dankbarkeitsjournal führen."
    >
      <JournalBoard />
    </MobileShell>
  );
}
