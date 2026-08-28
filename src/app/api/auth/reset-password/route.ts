import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/standalone";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.email !== "string" || typeof body.code !== "string" || typeof body.password !== "string" || body.password.length < 8) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try { resetPassword(body); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "INVALID_RESET_CODE" }, { status: 400 }); }
}
