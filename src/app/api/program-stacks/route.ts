import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { programDefinitions } from "@/lib/data";

const validProgramSlugs = new Set(programDefinitions.map((program) => program.slug));

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function GET() {
  try {
    const stacks = await prisma.programStack.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(stacks);
  } catch (error) {
    console.error("Program stacks GET failed", error);
    return NextResponse.json(
      { error: "Programms konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const programSlugs = Array.isArray(body.programSlugs)
    ? body.programSlugs.map((entry: unknown) => String(entry))
    : [];

  if (!title || programSlugs.length === 0) {
    return NextResponse.json(
      { error: "Titel und mindestens ein Programmschritt werden benötigt." },
      { status: 400 }
    );
  }

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
        programSlugs
      }
    });

    return NextResponse.json(stack, { status: 201 });
  } catch (error) {
    console.error("Program stack konnte nicht erstellt werden", error);
    return NextResponse.json(
      { error: "Programm konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const programSlugs = Array.isArray(body.programSlugs)
    ? body.programSlugs.map((entry: unknown) => String(entry))
    : [];

  if (!id || !title || programSlugs.length === 0) {
    return NextResponse.json(
      { error: "ID, Titel und Programmschritte werden benötigt." },
      { status: 400 }
    );
  }

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
        programSlugs
      }
    });

    return NextResponse.json(stack, { status: 200 });
  } catch (error) {
    console.error("Program stack konnte nicht aktualisiert werden", error);
    return NextResponse.json(
      { error: "Programm konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
