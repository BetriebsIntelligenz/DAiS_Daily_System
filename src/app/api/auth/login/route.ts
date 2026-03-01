import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  authenticateByCredentials,
  authenticateByEnterCode,
  createSessionToken
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      username?: unknown;
      password?: unknown;
      enterCode?: unknown;
    };

    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    const enterCode = typeof body.enterCode === "string" ? body.enterCode : "";

    const user = enterCode
      ? authenticateByEnterCode(enterCode)
      : authenticateByCredentials({ username, password });

    if (!user) {
      return NextResponse.json({ error: "Ungültige Zugangsdaten." }, { status: 401 });
    }

    const token = createSessionToken(user);

    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth login failed", error);
    return NextResponse.json({ error: "Login fehlgeschlagen." }, { status: 500 });
  }
}
