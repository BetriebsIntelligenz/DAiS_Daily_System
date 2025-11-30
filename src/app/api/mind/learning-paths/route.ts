import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail") ?? undefined;
  const userName = searchParams.get("userName") ?? undefined;

  const user = userEmail
    ? await getOrCreateDemoUser({ email: userEmail, name: userName ?? undefined })
    : null;

  const paths = await prisma.learningPath.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: user
          ? {
              progress: {
                where: { userId: user.id }
              }
            }
          : false
      }
    }
  });

  const payload = paths.map((path) => {
    const milestones = path.milestones.map((milestone) => {
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
