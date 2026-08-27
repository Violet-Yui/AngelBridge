"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, MapPin, Sparkles } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { DiscoverDetail, TsqApiError } from "@/lib/tsq/types";
import { tsqApi } from "@/lib/tsq/api";

export default function DiscoverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>();
  const [detail, setDetail] = useState<DiscoverDetail>();
  const [error, setError] = useState<string>();

  useEffect(() => { params.then(({ id: nextId }) => setId(nextId)); }, [params]);
  useEffect(() => {
    if (!id) return;
    tsqApi.getDiscoverDetail(id).then(setDetail).catch((cause: TsqApiError) => setError(cause.message));
  }, [id]);

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-4 pb-3 pt-2">
        <Link href="/discover" aria-label="返回发现" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="text-[20px] font-bold">发现详情</h1>
      </header>
      {!id || (!detail && !error) ? <DetailSkeleton /> : error ? <StateCard message={error} onRetry={() => setId(undefined)} /> : detail ? <DetailContent detail={detail} /> : null}
    </AppShell>
  );
}

function DetailSkeleton() { return <div className="space-y-3 px-4" aria-label="加载中"><div className="h-44 animate-pulse rounded-[24px] bg-[#e8f2e4]" /><div className="h-6 w-2/3 animate-pulse rounded bg-[#edf1eb]" /><div className="h-24 animate-pulse rounded-[20px] bg-[#edf1eb]" /></div>; }

function StateCard({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mx-4 rounded-[22px] border border-dashed border-[color:var(--border)] bg-white p-8 text-center"><p className="text-sm text-muted-foreground">{message}</p><button onClick={onRetry} className="mt-4 rounded-full bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white">重试</button></div>; }

function DetailContent({ detail }: { detail: DiscoverDetail }) {
  return <div className="space-y-4 px-4 pb-4">
    <section className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white shadow-[var(--brand-shadow-sm)]">
      <div className="grid h-44 place-items-center bg-gradient-to-br from-[#eaf6e5] to-[#dcefd2] text-6xl">{detail.emoji}</div>
      <div className="p-4"><span className="rounded-full bg-[color:var(--soft)] px-2.5 py-1 text-xs text-[color:var(--deep)]">{detail.badge}</span><h2 className="mt-3 text-[21px] font-bold leading-snug">{detail.title}</h2><p className="mt-2 text-sm leading-relaxed text-neutral-600">{detail.desc}</p><div className="mt-3 flex items-center gap-3 text-xs text-neutral-500"><span><MapPin className="mr-1 inline h-3.5 w-3.5" />{detail.place}</span><span><Heart className="mr-1 inline h-3.5 w-3.5" />{detail.likes}</span></div></div>
    </section>
    <Info title="为什么适合你" icon={<Sparkles className="h-4 w-4" />} items={detail.reasons} />
    <Info title="可以交换的资源" items={detail.resources} />
    <Info title="对方正在寻找" items={detail.needs} />
    <button className="w-full rounded-full bg-[color:var(--primary)] py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_18px_rgba(88,169,66,0.28)]">发起桥约</button>
  </div>;
}

function Info({ title, icon, items }: { title: string; icon?: React.ReactNode; items: string[] }) { return <section className="rounded-[20px] border border-[color:var(--border)] bg-white p-4"><h3 className="flex items-center gap-1.5 text-[16px] font-semibold">{icon}{title}</h3><div className="mt-2 space-y-2">{items.map((item) => <p key={item} className="rounded-xl bg-[color:var(--bg-canvas)] px-3 py-2.5 text-sm text-neutral-700">{item}</p>)}</div></section>; }
