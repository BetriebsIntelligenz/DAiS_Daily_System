import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Auth logout failed", error);
    return NextResponse.json({ error: "Logout fehlgeschlagen." }, { status: 500 });
  }
}
