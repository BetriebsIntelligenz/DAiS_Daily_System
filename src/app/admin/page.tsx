import { AdminPanels } from "@/components/admin-panels";
import { MobileShell } from "@/components/mobile-shell";

export default function AdminPage() {
  return (
    <MobileShell
      title="Admin Dashboard"
      description="Programme, Rewards und XP-Konfiguration pflegen."
    >
      <AdminPanels />
    </MobileShell>
  );
}
