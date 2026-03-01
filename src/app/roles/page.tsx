import { MobileShell } from "@/components/mobile-shell";
import { RolesBoard } from "@/components/roles-board";

export default function RolesPage() {
  return (
    <MobileShell
      title="Roles"
      description="Rollen definieren, mit Cards verknüpfen und SC State Tracking pro Rolle steuern."
    >
      <RolesBoard />
    </MobileShell>
  );
}
