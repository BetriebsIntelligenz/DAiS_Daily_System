import { NextResponse } from "next/server";

import { appendHouseholdLog, getHouseholdLogs } from "@/server/household-log-service";

export async function GET() {
  const entries = await getHouseholdLogs();
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const contentHtml = typeof body.contentHtml === "string" ? body.contentHtml : "";
  if (!contentHtml) {
    return NextResponse.json({ error: "contentHtml erforderlich." }, { status: 400 });
  }
  const entry = await appendHouseholdLog({
    contentHtml,
    userEmail: body.userEmail,
    userName: body.userName
  });
  return NextResponse.json(entry, { status: 201 });
}
