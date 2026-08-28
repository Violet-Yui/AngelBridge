import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/standalone";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email)) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  requestPasswordReset(body.email);
  return NextResponse.json({ ok: true });
}
