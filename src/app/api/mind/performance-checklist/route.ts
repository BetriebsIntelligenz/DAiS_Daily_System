import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { performanceChecklistSeeds } from "@/lib/mind-data";

type PrismaPerformanceClient = typeof prisma & {
  performanceChecklistItem?: Prisma.PerformanceChecklistItemDelegate;
};

const PERFORMANCE_CHECKLIST_HINT =
  "Führe `npx prisma generate --schema src/pages/schema.prisma` und anschließend `docker compose exec web npx prisma migrate deploy --schema src/pages/schema.prisma` aus.";

const FALLBACK_ITEMS = performanceChecklistSeeds.map((item, index) => {
  const timestamp = new Date().toISOString();
  return {
    id: item.id,
    label: item.label,
    summary: item.summary ?? null,
    order: typeof item.order === "number" ? item.order : index,
    createdAt: timestamp,
    updatedAt: timestamp
  };
});

function isMissingTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2023" || error.code === "P2022")
  );
}

function missingTableResponse(status = 200, message?: string) {
  const response = NextResponse.json(
    message
      ? { error: message, fallback: FALLBACK_ITEMS }
      : FALLBACK_ITEMS,
    { status }
  );
  response.headers.set("x-dais-performance-warning", PERFORMANCE_CHECKLIST_HINT);
  return response;
}

function missingTableError(message?: string) {
  return missingTableResponse(
    503,
    message ??
    "Performance Checklist steht noch nicht in der Datenbank zur Verfügung."
  );
}

export async function GET() {
  try {
    const client = prisma as PrismaPerformanceClient;
    const delegate = client.performanceChecklistItem;
    if (!delegate) {
      return missingTableResponse();
    }
    const items = await delegate.findMany({
      orderBy: { order: "asc" }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Performance checklist GET failed", error);
    if (isMissingTableError(error)) {
      return missingTableResponse();
    }
    return NextResponse.json(
      { error: "Checklist konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const label = String(body.label ?? "").trim();
  const summary =
    typeof body.summary === "string" ? body.summary.trim() : undefined;

  if (!label) {
    return NextResponse.json(
      { error: "Label ist erforderlich." },
      { status: 400 }
    );
  }

  const lastOrder = await prisma.performanceChecklistItem.aggregate({
    _max: { order: true }
  });
  const nextOrder = (lastOrder._max.order ?? -1) + 1;

  try {
    const client = prisma as PrismaPerformanceClient;
    const delegate = client.performanceChecklistItem;
    if (!delegate) {
      return missingTableError("Checklist konnte nicht gespeichert werden – Client noch nicht generiert.");
    }
    const item = await delegate.create({
      data: {
        label,
        summary,
        order: nextOrder
      }
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Performance checklist create failed", error);
    if (isMissingTableError(error)) {
      return missingTableError("Checklist konnte nicht gespeichert werden – Tabelle fehlt.");
    }
    return NextResponse.json(
      { error: "Checklist konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const label =
    typeof body.label === "string" ? body.label.trim() : undefined;
  const summary =
    typeof body.summary === "string" ? body.summary.trim() : undefined;
  const order =
    typeof body.order === "number" && Number.isFinite(body.order)
      ? body.order
      : undefined;

  if (!id) {
    return NextResponse.json(
      { error: "ID wird benötigt." },
      { status: 400 }
    );
  }

  const data: Prisma.PerformanceChecklistItemUpdateInput = {};
  if (label !== undefined) {
    if (!label) {
      return NextResponse.json(
        { error: "Label darf nicht leer sein." },
        { status: 400 }
      );
    }
    data.label = label;
  }
  if (summary !== undefined) {
    data.summary = summary;
  }
  if (order !== undefined) {
    data.order = order;
  }

  try {
    const client = prisma as PrismaPerformanceClient;
    const delegate = client.performanceChecklistItem;
    if (!delegate) {
      return missingTableError("Eintrag konnte nicht aktualisiert werden – Client noch nicht generiert.");
    }
    const item = await delegate.update({
      where: { id },
      data
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Performance checklist update failed", error);
    if (isMissingTableError(error)) {
      return missingTableError("Eintrag konnte nicht aktualisiert werden – Tabelle fehlt.");
    }
    return NextResponse.json(
      { error: "Eintrag konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const order = Array.isArray(body.order) ? body.order : null;
  if (!order || order.length === 0) {
    return NextResponse.json(
      { error: "Reihenfolge ist erforderlich." },
      { status: 400 }
    );
  }
  try {
    const client = prisma as PrismaPerformanceClient;
    const delegate = client.performanceChecklistItem;
    if (!delegate) {
      return missingTableError("Reihenfolge konnte nicht gespeichert werden – Client noch nicht generiert.");
    }
    const updates = order.map((id: string, index: number) =>
      delegate.update({
        where: { id },
        data: { order: index }
      })
    );
    await prisma.$transaction(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Performance checklist reorder failed", error);
    if (isMissingTableError(error)) {
      return missingTableError("Reihenfolge konnte nicht gespeichert werden – Tabelle fehlt.");
    }
    return NextResponse.json(
      { error: "Reihenfolge konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "ID wird benötigt." },
      { status: 400 }
    );
  }
  try {
    const client = prisma as PrismaPerformanceClient;
    const delegate = client.performanceChecklistItem;
    if (!delegate) {
      return missingTableError("Eintrag konnte nicht gelöscht werden – Client noch nicht generiert.");
    }
    await delegate.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Performance checklist delete failed", error);
    if (isMissingTableError(error)) {
      return missingTableError("Eintrag konnte nicht gelöscht werden – Tabelle fehlt.");
    }
    return NextResponse.json(
      { error: "Eintrag konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}
