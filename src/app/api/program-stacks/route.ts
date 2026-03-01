import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { programDefinitions } from "@/lib/data";
import { loadPrograms } from "@/lib/programs";
const staticProgramSlugs = new Set(programDefinitions.map((program) => program.slug));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function resolveValidProgramSlugs() {
  try {
    const programs = await loadPrograms();
    return new Set([
      ...staticProgramSlugs,
      ...programs.map((program) => program.slug)
    ]);
  } catch (error) {
    console.error("Valid Program Slugs konnten nicht aus der DB geladen werden", error);
    return staticProgramSlugs;
  }
}

export async function GET() {
  console.log("API: GET /api/program-stacks called");
  try {
    const stacks = await prisma.programStack.findMany({
      orderBy: { createdAt: "desc" }
    });
    console.log(`API: GET success, found ${stacks.length} stacks`);
    return NextResponse.json(stacks);
  } catch (error) {
    console.error("API: GET failed with error:", error);
    return NextResponse.json(
      { error: "Programms konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

// POST Handler Fix
export async function POST(request: Request) {
  console.log("API: POST /api/program-stacks called");
  let body;
  try {
    body = await request.json();
    console.log("API: POST body parsed:", JSON.stringify(body, null, 2));
  } catch (e) {
    console.error("API: POST JSON parsing failed", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const weekdays = Array.isArray(body.weekdays) ? body.weekdays.map(Number) : [];
  const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  const startTime = body.startTime ? String(body.startTime).trim() : null;
  const startTimes = body.startTimes && typeof body.startTimes === "object" ? body.startTimes : null;
  const programSlugs = Array.isArray(body.programSlugs)
    ? body.programSlugs.map((entry: unknown) => String(entry))
    : [];

  if (!title || programSlugs.length === 0) {
    return NextResponse.json(
      { error: "Titel und mindestens ein Programmschritt werden benötigt." },
      { status: 400 }
    );
  }

  const validProgramSlugs = await resolveValidProgramSlugs();
  const invalidSlugs = programSlugs.filter((slug: string) => !validProgramSlugs.has(slug));
  if (invalidSlugs.length > 0) {
    return NextResponse.json(
      {
        error: "Ungültige Programmslugs vorhanden.",
        details: invalidSlugs
      },
      { status: 400 }
    );
  }

  try {
    const stack = await prisma.programStack.create({
      data: {
        title,
        summary,
        slug: slugify(title) || slugify(`${title}-${Date.now()}`),
        programSlugs,
        weekdays,
        durationMinutes,
        startTime,
        startTimes
      }
    });

    return NextResponse.json(stack, { status: 201 });
  } catch (error) {
    console.error("API: POST failed with error:", error);
    return NextResponse.json(
      { error: "Programmstack konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  console.log("API: PUT /api/program-stacks called");
  let body;
  try {
    body = await request.json();
    console.log("API: PUT body parsed:", JSON.stringify(body, null, 2));
  } catch (e) {
    console.error("API: PUT JSON parsing failed", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = String(body.id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const weekdays = Array.isArray(body.weekdays) ? body.weekdays.map(Number) : [];
  const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  const startTime = body.startTime ? String(body.startTime).trim() : null;
  const startTimes = body.startTimes && typeof body.startTimes === "object" ? body.startTimes : null;
  const programSlugs = Array.isArray(body.programSlugs)
    ? body.programSlugs.map((entry: unknown) => String(entry))
    : [];

  if (!id || !title || programSlugs.length === 0) {
    return NextResponse.json(
      { error: "ID, Titel und Programmschritte werden benötigt." },
      { status: 400 }
    );
  }

  const validProgramSlugs = await resolveValidProgramSlugs();
  const invalidSlugs = programSlugs.filter((slug: string) => !validProgramSlugs.has(slug));
  if (invalidSlugs.length > 0) {
    return NextResponse.json(
      {
        error: "Ungültige Programmslugs vorhanden.",
        details: invalidSlugs
      },
      { status: 400 }
    );
  }

  try {
    const stack = await prisma.programStack.update({
      where: { id },
      data: {
        title,
        summary,
        slug: slugify(title) || slugify(`${title}-${Date.now()}`),
        programSlugs,
        weekdays,
        durationMinutes,
        startTime,
        startTimes
      }
    });

    return NextResponse.json(stack, { status: 200 });
  } catch (error) {
    console.error("API: PUT failed with error:", error);
    return NextResponse.json(
      { error: "Programmstack konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
