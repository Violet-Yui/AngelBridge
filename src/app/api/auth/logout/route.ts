import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/standalone";
export async function POST(request: Request) { const token = request.headers.get("cookie")?.match(/(?:^|; )ab_session=([^;]+)/)?.[1]; deleteSession(token); const response = NextResponse.json({ ok: true }); response.cookies.set("ab_session", "", { httpOnly: true, expires: new Date(0), path: "/" }); return response; }
