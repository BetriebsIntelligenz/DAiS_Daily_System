import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail") ?? undefined;
  const userName = searchParams.get("userName") ?? undefined;

  const user = userEmail
    ? await getOrCreateDemoUser({ email: userEmail, name: userName ?? undefined })
    : null;

  const milestoneInclude: Prisma.LearningMilestoneInclude | undefined = user
    ? {
        progress: {
          where: { userId: user.id }
        }
      }
    : undefined;

  const paths = await prisma.learningPath.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: milestoneInclude
      }
    }
  });

  const payload = paths.map((path) => {
    const milestones = path.milestones.map((milestone) => {
      const progressEntries = Array.isArray((milestone as any).progress)
        ? ((milestone as any).progress as Array<{ completed?: boolean; updatedAt?: Date }>)
        : [];
      const completedEntry = progressEntries.find((entry) => entry.completed === true);
      const { progress: _unused, ...cleanMilestone } = milestone as typeof milestone & {
        progress?: unknown;
      };
      return {
        ...cleanMilestone,
        completed: Boolean(completedEntry),
        updatedAt: completedEntry?.updatedAt ?? null
      };
    });

    const completedCount = milestones.filter((milestone) => milestone.completed).length;
    const total = milestones.length || 1;

    const { milestones: _m, ...cleanPath } = path;
    return {
      ...cleanPath,
      milestones,
      progressPercent: Math.round((completedCount / total) * 100)
    };
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const theme = String(body.theme ?? "").trim();
  const description = String(body.description ?? "").trim();
  const inputMilestones = Array.isArray(body.milestones)
    ? body.milestones
    : String(body.milestones ?? "")
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean);

  if (!title || !theme || !description || inputMilestones.length === 0) {
    return NextResponse.json(
      { error: "Titel, Thema, Beschreibung und Milestones sind erforderlich." },
      { status: 400 }
    );
  }

  const path = await prisma.learningPath.create({
    data: {
      title,
      theme,
      description,
      milestones: {
        create: inputMilestones.map((label: string, index: number) => ({
          title: label,
          description: label,
          order: index + 1
        }))
      }
    },
    include: {
      milestones: {
        orderBy: { order: "asc" }
      }
    }
  });

  return NextResponse.json(path, { status: 201 });
}
