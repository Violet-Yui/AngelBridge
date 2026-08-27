"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { tsqApi } from "@/lib/tsq/api";
import type { BridgeDetail } from "@/lib/tsq/types";

export default function BridgeConfirmRoute({ params }: { params: Promise<{ id: string }> }) { const [id, setId] = useState<string>(); const [detail, setDetail] = useState<BridgeDetail>(); const [pending, setPending] = useState(false); useEffect(() => { params.then(({ id: nextId }) => { setId(nextId); tsqApi.getBridgeDetail(nextId).then(setDetail); }); }, [params]); return <FlowShell title="双方确认" subtitle="双方需分别确认是否继续" right="none"><Link href={id ? `/bridge/${id}` : "/bridge"} className="mb-3 inline-flex items-center gap-1 text-sm text-[color:var(--deep)]"><ArrowLeft className="h-4 w-4" />返回</Link>{!detail ? <div className="h-40 animate-pulse rounded-2xl bg-white/70" /> : <><section className="rounded-[22px] bg-white/88 p-4"><h2 className="text-lg font-bold">{detail.participants[1]?.name} 正在等待你的确认</h2><p className="mt-2 text-sm text-muted-foreground">确认后会开放更完整的沟通信息，隐私边界仍然受保护。</p><div className="mt-4 rounded-2xl bg-[#f7fbf4] p-3 text-sm"><Lock className="mr-1 inline h-4 w-4 text-[#23a56f]" />详细地址和完整联系方式暂不公开</div></section><button disabled={pending} onClick={async () => { if (!id) return; setPending(true); await tsqApi.confirmBridge(id, { agree: true }); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 font-semibold text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{pending ? "确认中…" : "同意继续了解"}</button>{pending && id && <Link href={`/bridge/${id}/schedule`} className="mt-3 block text-center text-sm text-[color:var(--deep)]">继续安排桥约 ›</Link>}</>}</FlowShell>; }
