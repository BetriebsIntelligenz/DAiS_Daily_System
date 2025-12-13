import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

const JOURNAL_ID = "journal-wake-up";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({
    where: { journalId: JOURNAL_ID },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.contentHtml) {
    return NextResponse.json({ error: "contentHtml required" }, { status: 400 });
  }

  const user = await getOrCreateDemoUser({
    email: body.userEmail,
    name: body.userName
  });

  const journal = await prisma.journal.upsert({
    where: { id: JOURNAL_ID },
    update: {},
    create: {
      id: JOURNAL_ID,
      name: "Wake Up Verlauf",
      type: "success",
      userId: user.id
    }
  });

  const entry = await prisma.journalEntry.create({
    data: {
      journalId: journal.id,
      userId: user.id,
      contentHtml: body.contentHtml as string,
      createdAt: new Date()
    }
  });

  return NextResponse.json(entry, { status: 201 });
}
