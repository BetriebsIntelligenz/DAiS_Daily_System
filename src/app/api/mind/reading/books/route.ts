import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const MIGRATION_HINT =
  "Mind Reading Tabellen fehlen. Bitte `prisma migrate deploy --schema src/pages/schema.prisma` ausführen (siehe .ssh/Konzept/Anleitungen/DB_Integration_VPS_Migration.md).";

function isReadingTableError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { code, message } = error as { code?: string; message?: string };
  if (code && ["P2010", "P2013", "P2021", "P2022"].includes(code)) {
    return true;
  }
  if (typeof message === "string") {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("mindreadingbook") ||
      normalized.includes("\"MindReadingBook\"".toLowerCase()) ||
      normalized.includes("mind_reading_book")
    );
  }
  return false;
}

export async function GET() {
  try {
    const books = await prisma.mindReadingBook.findMany({
      orderBy: [{ isActive: "desc" }, { title: "asc" }, { createdAt: "asc" }]
    });
    return NextResponse.json({ books });
  } catch (error) {
    console.error("Mind Reading Bücher konnten nicht geladen werden.", error);
    if (isReadingTableError(error)) {
      return NextResponse.json(
        { books: [], error: MIGRATION_HINT },
        {
          status: 500,
          headers: { "x-dais-migration-hint": MIGRATION_HINT }
        }
      );
    }
    return NextResponse.json(
      { error: "Bücher konnten nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const author = String(body.author ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Titel wird benötigt." }, { status: 400 });
  }

  try {
    const book = await prisma.mindReadingBook.create({
      data: {
        title,
        author: author || null
      }
    });
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Mind Reading Buch konnte nicht erstellt werden.", error);
    if (isReadingTableError(error)) {
      return NextResponse.json(
        { error: MIGRATION_HINT },
        {
          status: 500,
          headers: { "x-dais-migration-hint": MIGRATION_HINT }
        }
      );
    }
    return NextResponse.json(
      { error: "Buch konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (!id || !title) {
    return NextResponse.json(
      { error: "ID und Titel werden benötigt." },
      { status: 400 }
    );
  }

  try {
    const book = await prisma.mindReadingBook.update({
      where: { id },
      data: {
        title,
        author: author || null,
        ...(typeof isActive === "boolean" ? { isActive } : {})
      }
    });
    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error("Mind Reading Buch konnte nicht aktualisiert werden.", error);
    if (isReadingTableError(error)) {
      return NextResponse.json(
        { error: MIGRATION_HINT },
        {
          status: 500,
          headers: { "x-dais-migration-hint": MIGRATION_HINT }
        }
      );
    }
    return NextResponse.json(
      { error: "Buch konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { error: "ID wird benötigt." },
      { status: 400 }
    );
  }

  try {
    await prisma.mindReadingBook.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mind Reading Buch konnte nicht gelöscht werden.", error);
    if (isReadingTableError(error)) {
      return NextResponse.json(
        { error: MIGRATION_HINT },
        {
          status: 500,
          headers: { "x-dais-migration-hint": MIGRATION_HINT }
        }
      );
    }
    return NextResponse.json(
      { error: "Buch konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}
