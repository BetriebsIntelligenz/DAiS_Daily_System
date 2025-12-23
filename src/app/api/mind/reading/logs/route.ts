import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { createProgramRun } from "@/server/program-run-service";

const PROGRAM_ID = "mind-reading-tracker";
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
      normalized.includes("mindreadinglog") ||
      normalized.includes("mindreadingbook") ||
      normalized.includes("mind_reading")
    );
  }
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookFilter = searchParams.get("bookId");
  const limitParam = Number(searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(100, Math.round(limitParam)))
    : 25;

  try {
    const logs = await prisma.mindReadingLog.findMany({
      where: bookFilter ? { bookId: bookFilter } : undefined,
      include: { book: true },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        bookId: log.bookId,
        bookTitle: log.book?.title ?? "Unbekanntes Buch",
        pages: log.pages,
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    console.error("Mind Reading Logs konnten nicht geladen werden.", error);
    if (isReadingTableError(error)) {
      return NextResponse.json(
        { logs: [], error: MIGRATION_HINT },
        {
          status: 500,
          headers: { "x-dais-migration-hint": MIGRATION_HINT }
        }
      );
    }
    return NextResponse.json(
      { error: "Leselog konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const bookId = String(body.bookId ?? "").trim();
  const rawPages = Number(body.pages ?? 0);
  const pages = Number.isFinite(rawPages) ? Math.max(1, Math.round(rawPages)) : 0;

  if (!bookId || pages <= 0) {
    return NextResponse.json(
      { error: "Buch und Seitenzahl werden benötigt." },
      { status: 400 }
    );
  }

  try {
    const book = await prisma.mindReadingBook.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: "Buch nicht gefunden." }, { status: 404 });
    }
    if (!book.isActive) {
      return NextResponse.json(
        { error: "Buch ist deaktiviert." },
        { status: 400 }
      );
    }

    const user = await getOrCreateDemoUser({
      email: body.userEmail,
      name: body.userName
    });

    const log = await prisma.mindReadingLog.create({
      data: {
        bookId,
        userId: user.id,
        pages
      },
      include: {
        book: true
      }
    });

    const payload = {
      bookId,
      bookTitle: book.title,
      pages,
      runner: { completed: true },
      quality: { customRulePassed: true }
    };

    const run = await createProgramRun({
      programId: PROGRAM_ID,
      payload,
      userEmail: user.email,
      userName: user.name
    });

    return NextResponse.json(
      {
        log: {
          id: log.id,
          bookId: log.bookId,
          bookTitle: log.book?.title ?? book.title,
          pages: log.pages,
          createdAt: log.createdAt
        },
        xpEarned: run.xpEarned
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Mind Reading Log konnte nicht gespeichert werden.", error);
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
      { error: "Leselog konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
