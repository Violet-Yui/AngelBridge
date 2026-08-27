import { NextResponse } from "next/server";
export type User = { id: string; email?: string; name?: string; avatarUrl?: string };
export type AuthResult = { ok: true; user: User } | { ok: false; response: NextResponse };
export function requireAuth(request: Request): AuthResult { void request; return { ok: true, user: { id: "guest", name: "林一叶", email: "guest@tianshiqiao.local" } }; }
