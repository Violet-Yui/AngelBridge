"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, MessageCircle } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { tsqApi } from "@/lib/tsq/api";
import type { BridgeDetail } from "@/lib/tsq/types";

export default function BridgeDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const [detail, setDetail] = useState<BridgeDetail>(); const [error, setError] = useState<string>();
  useEffect(() => { params.then(({ id }) => tsqApi.getBridgeDetail(id).then(setDetail).catch((e) => setError(e.message))); }, [params]);
  return <FlowShell title="一座桥" right="none"><Link href="/bridge" className="mb-3 inline-flex items-center gap-1 text-sm text-[color:var(--deep)]"><ArrowLeft className="h-4 w-4" />返回桥约</Link>{error ? <State text={error} /> : !detail ? <div className="h-48 animate-pulse rounded-[24px] bg-white/70" /> : <><section className="rounded-[24px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]"><div className="flex items-center justify-between">{detail.participants.map((p) => <div key={p.id} className="text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[color:var(--soft)] text-xl">{p.name.slice(0, 1)}</span><b className="mt-2 block text-sm">{p.name}</b><p className="text-xs text-muted-foreground">{p.role}</p></div>)}<span className="text-2xl text-[#23a56f]">⇄</span></div><div className="mt-4 grid grid-cols-2 gap-2">{detail.exchange.map((x) => <div key={x.ownerId} className="rounded-2xl bg-[color:var(--bg-canvas)] p-3"><p className="text-xs text-muted-foreground">{x.label}</p><p className="mt-1 text-sm font-medium">{x.description}</p></div>)}</div></section><Info title="为什么适合" items={detail.reasons} /><Info title="待确认 / 未知项" items={detail.unknowns} /><p className="rounded-2xl bg-[#eaf7ef] p-3 text-sm text-[#196c42]"><MessageCircle className="mr-1 inline h-4 w-4" />{detail.nextAction}</p><p className="text-center text-xs text-muted-foreground"><Lock className="mr-1 inline h-3.5 w-3.5" />双方同意前仅展示必要信息</p><Link href={`/bridge/${detail.id}/confirm`} className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 font-semibold text-white"><CheckCircle2 className="h-4 w-4" />我愿意了解对方</Link></>}</FlowShell>;
}
function Info({ title, items }: { title: string; items: string[] }) { return <section className="mt-3 rounded-[22px] bg-white/86 p-4"><h2 className="mb-2 text-[17px] font-bold">{title}</h2>{items.map((x) => <p key={x} className="border-b border-[#f1f2ec] py-2 text-sm last:border-0">{x}</p>)}</section>; }
function State({ text }: { text: string }) { return <div className="rounded-2xl bg-white p-6 text-center text-sm text-muted-foreground">{text}</div>; }
