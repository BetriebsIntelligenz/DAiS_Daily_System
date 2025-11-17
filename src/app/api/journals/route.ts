import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { journalDefinitions } from "@/lib/data";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const userEmail = body.userEmail ?? "demo@dais.app";
  const user =
    (await prisma.user.findUnique({ where: { email: userEmail } })) ??
    (await prisma.user.create({
      data: {
        email: userEmail,
        password: "changeme",
        name: body.userName ?? "DAiS Demo"
      }
    }));

  const journalDefinition =
    journalDefinitions.find((definition) => definition.id === body.journalId) ??
    journalDefinitions[0];

  const journal = await prisma.journal.upsert({
    where: { id: body.journalId },
    update: {},
    create: {
      id: body.journalId,
      name: journalDefinition?.name ?? body.journalId,
      type: journalDefinition?.type ?? "learn",
      userId: user.id
    }
  });

  const entry = await prisma.journalEntry.create({
    data: {
      journalId: journal.id,
      userId: user.id,
      contentHtml: body.content,
      createdAt: new Date()
    }
  });

  return NextResponse.json(entry, { status: 201 });
}
