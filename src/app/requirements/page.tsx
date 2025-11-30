import { RequirementsBoard } from "@/components/requirements-board";
import { MobileShell } from "@/components/mobile-shell";
import type { RequirementRecord } from "@/lib/types";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

export default async function RequirementsPage() {
  let requirements: RequirementRecord[] = [];
  try {
    const user = await getOrCreateDemoUser();
    const records = await prisma.requirement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });
    requirements = records.map((item) => ({
      ...item,
      targetDate: item.targetDate ? item.targetDate.toISOString() : "",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error("Anforderungen konnten nicht geladen werden", error);
  }

  return (
    <MobileShell
      title="Anforderungen"
      description="Erfasse neue Anforderungen, verteile sie auf das Kanban-Board und halte Status & Prioritäten aktuell."
    >
      <RequirementsBoard initialRequirements={requirements} />
    </MobileShell>
  );
}
