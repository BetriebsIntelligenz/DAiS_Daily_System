import type { NextResponse } from "next/server";

import type { MindMeditationFlow } from "@/lib/types";
import { meditationFlowSeeds } from "@/lib/mind-data";
import { prisma } from "@/lib/prisma";

type PrismaMeditationClient = typeof prisma & {
  mindMeditationFlow?: unknown;
  mindMeditationStep?: unknown;
};

export const MEDITATION_MIGRATION_HINT =
  "Run `npx prisma generate --schema src/pages/schema.prisma` und anschließend `docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma`.";

export function prismaSupportsMeditations() {
  const client = prisma as PrismaMeditationClient;
  return (
    typeof client.mindMeditationFlow !== "undefined" &&
    typeof client.mindMeditationStep !== "undefined"
  );
}

export function buildFallbackMeditationFlows(): MindMeditationFlow[] {
  const timestamp = new Date().toISOString();
  return meditationFlowSeeds.map((flow) => ({
    id: flow.id,
    title: flow.title,
    subtitle: flow.subtitle ?? null,
    summary: flow.summary ?? null,
    order: typeof flow.order === "number" ? flow.order : 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    steps: flow.steps.map((step) => ({
      id: step.id,
      flowId: flow.id,
      title: step.title,
      description: (step as any).description ?? null,
      order: typeof step.order === "number" ? step.order : 0,
      createdAt: timestamp
    }))
  }));
}

export function withMigrationHintHeaders(response: Response | NextResponse) {
  response.headers.set("x-dais-meditations-warning", MEDITATION_MIGRATION_HINT);
  return response;
}
