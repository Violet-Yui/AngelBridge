"use client";

import Link from "next/link";
import { CheckCircle2, Gift, Megaphone, Search, ShieldCheck, Target, User, MessageCircle, ArrowLeftRight } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { BRIDGE_PROGRESS, CANDIDATES } from "@/lib/tsq/xiaotian-flow";
import { cn } from "@/utils/utils";

const tone = {
  blue: "bg-[#e8f2ff] text-[#2679ff]",
  green: "bg-[#eaf7ef] text-[#23a56f]",
  warm: "bg-[#fff4df] text-[#f2a93b]",
};

export default function BridgingPage() {
  return (
    <FlowShell title="小天搭桥" right="help">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#071D3A]">小天正在为你搭桥...</h2>
          <p className="mt-1 text-[14px] text-[#58708c]">正在进行双向匹配，请稍候～</p>
        </div>
        <XiaotianAvatar size={82} />
      </div>

      <section className="rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
        <div className="grid grid-cols-4 gap-2">
          {BRIDGE_PROGRESS.map((s, i) => (
            <div key={s.label} className="text-center">
              <span className={cn("mx-auto grid h-10 w-10 place-items-center rounded-full", s.done ? "bg-[#2679ff] text-white" : s.active ? "bg-[#58A942] text-white animate-pulse" : "bg-neutral-100 text-neutral-400")}>{i === 0 ? <Target className="h-5 w-5" /> : i === 1 ? <Search className="h-5 w-5" /> : i === 2 ? <ShieldCheck className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}</span>
              <p className="mt-1 text-[11px] leading-tight text-[#243b5a]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[22px] bg-white/86 p-4 shadow-[var(--brand-shadow-sm)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <NeedOffer title="你的 Need" desc="需要品牌拍摄空间" icon={<User className="h-5 w-5" />} cls="bg-[#e8f2ff] text-[#2679ff]" />
          <ArrowLeftRight className="h-7 w-7 text-[#47b679]" />
          <NeedOffer title="对方 Offer" desc="提供空闲拍摄时段" icon={<Gift className="h-5 w-5" />} cls="bg-[#eaf7ef] text-[#23a56f]" />
          <NeedOffer title="你的 Offer" desc="提供品牌推广曝光" icon={<Megaphone className="h-5 w-5" />} cls="bg-[#fff4df] text-[#f2a93b]" />
          <ArrowLeftRight className="h-7 w-7 text-[#f29f56]" />
          <NeedOffer title="对方 Need" desc="需要更多曝光机会" icon={<Gift className="h-5 w-5" />} cls="bg-[#f0ebfd] text-[color:var(--purple)]" />
        </div>
      </section>

      <section className="mt-3 rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-2 text-[17px] font-bold text-[#071D3A]">已匹配到 3 个候选桥</h2>
        <div className="space-y-2">
          {CANDIDATES.map((c, index) => (
            <Link key={c.name} href={`/bridge/i${index + 1}`} className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white p-2.5 active:scale-[.99]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--soft)] text-[color:var(--deep)]">{c.name.slice(-2, -1)}</span>
              <div className="flex-1"><b className="text-[14px]">{c.name}</b><p className="text-[12px] text-[#58708c]">{c.desc}</p></div>
              <span className={cn("rounded-full px-2 py-1 text-[12px] font-semibold", tone[c.tone as keyof typeof tone])}>匹配度 {c.score}%</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-3 text-center text-[13px] text-[#58708c]"><CheckCircle2 className="mr-1 inline h-4 w-4 text-[#23a56f]" />只会在你允许的边界内匹配，隐私安全有保障</p>
      <Link href="/xiaotian/tasks/task-ready" data-el="xiaotian-task-detail" className="mt-3 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2679ff] to-[#38c7f4] py-3.5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(38,121,255,.28)]">查看找到的桥</Link>
    </FlowShell>
  );
}

function NeedOffer({ title, desc, icon, cls }: { title: string; desc: string; icon: React.ReactNode; cls: string }) {
  return <div className={cn("min-h-[76px] rounded-2xl border border-[color:var(--border)] p-2.5", cls)}>{icon}<b className="mt-1 block text-[13px]">{title}</b><p className="text-[12px] opacity-80">{desc}</p></div>;
}
