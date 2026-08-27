import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ ok: true, queued: false, message: "通知已记录" }); }
