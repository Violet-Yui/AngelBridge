"use client";

import Link from "next/link";
import { CheckCircle2, Plus, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";

export default function CreateSuccessPage() { return <AppShell><div className="flex min-h-[65dvh] flex-col items-center justify-center px-6 text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--primary)]"><CheckCircle2 className="h-11 w-11" /></span><h1 className="mt-5 text-[25px] font-bold">发布成功</h1><p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">你的内容已经发布，正在等待合适的桥约机会。</p><div className="mt-8 flex w-full flex-col gap-3"><Link href="/discover" className="flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-[16px] font-semibold text-white">去发现伙伴 <ArrowRight className="h-4 w-4" /></Link><Link href="/create" className="flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-white py-3.5 text-[16px] font-semibold text-neutral-700"><Plus className="h-4 w-4" />继续发布</Link></div></div></AppShell>; }
