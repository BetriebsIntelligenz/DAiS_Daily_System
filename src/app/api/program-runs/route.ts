import { NextResponse } from "next/server";

import { createProgramRun } from "@/server/program-run-service";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const result = await createProgramRun({
      programId: body.programId,
      payload: body.payload ?? {},
      userEmail: body.userEmail,
      userName: body.userName
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Programm konnte nicht gebucht werden";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
