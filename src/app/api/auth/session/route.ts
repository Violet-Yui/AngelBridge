import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/standalone";
export async function GET(request: Request) { const token = request.headers.get("cookie")?.match(/(?:^|; )ab_session=([^;]+)/)?.[1]; return NextResponse.json({ user: getSession(token) ?? null }); }
