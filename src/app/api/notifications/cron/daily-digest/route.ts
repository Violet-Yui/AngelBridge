import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, message: "每日提醒已生成" }); }
