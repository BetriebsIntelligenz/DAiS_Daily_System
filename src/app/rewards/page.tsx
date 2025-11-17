import { RewardsGrid } from "@/components/rewards-grid";
import { MobileShell } from "@/components/mobile-shell";

export default function RewardsPage() {
  return (
    <MobileShell
      title="Belohnungen"
      description="XP eintauschen, Verlauf einsehen und Motivation hochhalten."
    >
      <RewardsGrid />
    </MobileShell>
  );
}
