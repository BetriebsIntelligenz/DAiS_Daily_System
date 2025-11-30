import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

interface Params {
  pathId: string;
  milestoneId: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { pathId, milestoneId } = params;
  if (!pathId || !milestoneId) {
    return NextResponse.json({ error: "Pfad oder Milestone fehlt." }, { status: 400 });
  }

  const body = await request.json();
  const completed = Boolean(body.completed);

  const user = await getOrCreateDemoUser({
    email: body.userEmail ?? undefined,
    name: body.userName ?? undefined
  });

  await prisma.learningMilestoneProgress.upsert({
    where: {
      milestoneId_userId: {
        milestoneId,
        userId: user.id
      }
    },
    create: {
      milestoneId,
      userId: user.id,
      completed
    },
    update: {
      completed
    }
  });

  const updatedPath = await prisma.learningPath.findUnique({
    where: { id: pathId },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId: user.id }
          }
        }
      }
    }
  });

  if (!updatedPath) {
    return NextResponse.json({ error: "Learning Path nicht gefunden." }, { status: 404 });
  }

  const milestones = updatedPath.milestones.map((milestone) => {
    const progressEntries = Array.isArray(milestone.progress)
      ? milestone.progress
      : [];
    const completedEntry = progressEntries.find((entry) => entry.completed);
    const { progress: _unused, ...cleanMilestone } = milestone;
    return {
      ...cleanMilestone,
      completed: Boolean(completedEntry),
      updatedAt: completedEntry?.updatedAt ?? null
    };
  });

  const completedCount = milestones.filter((milestone) => milestone.completed).length;
  const total = milestones.length || 1;

  const { milestones: _m, ...cleanPath } = updatedPath;

  return NextResponse.json({
    ...cleanPath,
    milestones,
    progressPercent: Math.round((completedCount / total) * 100)
  });
}
