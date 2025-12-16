import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export const HOUSEHOLD_JOURNAL_ID = "journal-household";

export async function getHouseholdLogs(limit = 20) {
  return prisma.journalEntry.findMany({
    where: { journalId: HOUSEHOLD_JOURNAL_ID },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

interface AppendLogOptions {
  contentHtml: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  createdAt?: Date;
}

export async function appendHouseholdLog(options: AppendLogOptions) {
  let user =
    options.userId &&
    (await prisma.user.findUnique({
      where: { id: options.userId }
    }));

  if (!user) {
    user = await getOrCreateDemoUser({
      email: options.userEmail,
      name: options.userName
    });
  }

  const journal = await prisma.journal.upsert({
    where: { id: HOUSEHOLD_JOURNAL_ID },
    update: {},
    create: {
      id: HOUSEHOLD_JOURNAL_ID,
      name: "Haushalt Verlauf",
      type: "success",
      userId: user.id
    }
  });

  return prisma.journalEntry.create({
    data: {
      journalId: journal.id,
      userId: user.id,
      contentHtml: options.contentHtml,
      createdAt: options.createdAt ?? new Date()
    }
  });
}
