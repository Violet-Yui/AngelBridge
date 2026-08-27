"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { tsqApi } from "@/lib/tsq/api";

export default function BridgeScheduleRoute({ params }: { params: Promise<{ id: string }> }) { const [id, setId] = useState<string>(); const [saved, setSaved] = useState(false); useEffect(() => { params.then(({ id: nextId }) => setId(nextId)); }, [params]); return <FlowShell title="安排桥约" right="none"><Link href={id ? `/bridge/${id}/confirm` : "/bridge"} className="mb-3 inline-flex items-center gap-1 text-sm text-[color:var(--deep)]"><ArrowLeft className="h-4 w-4" />返回确认</Link><section className="rounded-[24px] bg-white/88 p-4"><h2 className="text-xl font-bold">选择第一步行动</h2><p className="mt-1 text-sm text-muted-foreground">先把一个小而明确的动作收入日程。</p><button className="mt-4 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-canvas)] p-3 text-left"><b>今晚 20:00 · 互发参考图</b><p className="mt-1 text-xs text-muted-foreground">明天中午确认排期</p></button></section><button disabled={!id || saved} onClick={async () => { if (!id) return; await tsqApi.scheduleBridge(id, { slot: "今晚 20:00" }); setSaved(true); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2679ff] py-3.5 font-semibold text-white disabled:opacity-70"><CalendarCheck className="h-4 w-4" />{saved ? "已收入日程" : "确认桥约，开始第一步"}</button>{saved && id && <Link href={`/bridge/${id}/result`} className="mt-3 block text-center text-sm text-[color:var(--deep)]">查看桥约结果 ›</Link>}</FlowShell>; }
