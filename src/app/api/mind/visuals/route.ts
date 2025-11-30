import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.mindVisualizationAsset.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Visuals GET failed, fallback without order", error);
    // Fallback für Instanzen ohne order-Spalte (Migration noch nicht gelaufen)
    const assets = await prisma.mindVisualizationAsset.findMany({
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(assets);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const imageData = String(body.imageData ?? "").trim();

  if (!title || !imageData) {
    return NextResponse.json(
      { error: "Titel und Bilddaten werden benötigt." },
      { status: 400 }
    );
  }

  try {
    const position = await prisma.mindVisualizationAsset.count();
    const asset = await prisma.mindVisualizationAsset.create({
      data: {
        title,
        imageData,
        order: position
      }
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Visual create with order failed, retry without order", error);
    // Fallback für fehlende order-Spalte
    const asset = await prisma.mindVisualizationAsset.create({
      data: {
        title,
        imageData
      }
    });
    return NextResponse.json(asset, { status: 201 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "ID zum Löschen wird benötigt." },
        { status: 400 }
      );
    }

    await prisma.mindVisualizationAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Visual konnte nicht gelöscht werden", error);
    return NextResponse.json(
      { error: "Visual konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const orderArray = Array.isArray(body.order)
      ? body.order.map((id: unknown) => String(id))
      : [];

    if (orderArray.length === 0) {
      return NextResponse.json(
        { error: "Reihenfolge (order) wird benötigt." },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      orderArray.map((id: string, index: number) =>
        prisma.mindVisualizationAsset.update({
          where: { id },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reihenfolge konnte nicht gespeichert werden", error);
    return NextResponse.json(
      {
        error: "Reihenfolge konnte nicht gespeichert werden. Bitte Migration ausführen.",
        action: "prisma migrate deploy --schema src/pages/schema.prisma"
      },
      { status: 500 }
    );
  }
}
