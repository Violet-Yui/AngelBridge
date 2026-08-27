"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { tsqApi } from "@/lib/tsq/api";
import type { ResourceDetail } from "@/lib/tsq/types";
export default function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<ResourceDetail>(); const [error, setError] = useState("");
  useEffect(() => { params.then(({ id }) => tsqApi.getResourceDetail(id).then(setItem).catch((e: Error) => setError(e.message))); }, [params]);
  return <AppShell><header className="flex items-center gap-3 px-4 pb-3 pt-2"><Link href="/me" aria-label="返回我的" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link><h1 className="text-[22px] font-bold">资源详情</h1></header>{error ? <p className="m-4 rounded-2xl bg-white p-6 text-center text-sm">{error}</p> : !item ? <div className="m-4 h-48 animate-pulse rounded-2xl bg-[#edf1eb]" /> : <div className="space-y-4 px-4"><section className="rounded-[24px] bg-[color:var(--soft)] p-5"><span className="text-sm text-[color:var(--deep)]">{item.kind}</span><h2 className="mt-2 text-2xl font-bold">{item.label}</h2><p className="mt-2 text-sm">{item.value}</p></section><section className="rounded-[22px] border border-[color:var(--border)] bg-white p-4"><h2 className="font-semibold">资源说明</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p></section></div>}</AppShell>;
}
