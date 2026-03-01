import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const user = verifySessionToken(token);
    if (!user) {
      cookies().set({
        name: SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
        expires: new Date(0)
      });
      return NextResponse.json({ error: "Session ungültig." }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Auth session check failed", error);
    return NextResponse.json({ error: "Sessionprüfung fehlgeschlagen." }, { status: 500 });
  }
}
