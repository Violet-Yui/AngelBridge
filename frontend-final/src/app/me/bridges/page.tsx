"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, HeartHandshake, Star } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { useProfileStore } from "@/stores/profile-store";

const DEFAULT_DONE = [
  { title: "周末工作室 ↔ 品牌照片", partner: "品牌摄影师阿杰", time: "今天完成", result: "交付 12 张精选照片，双方已确认闭环", score: "+20" },
  { title: "设计建议 ↔ 课程名额", partner: "设计小站", time: "本周完成", result: "完成一次线上复盘，桥约评价优秀", score: "+20" },
  { title: "多肉盆栽 ↔ 设计课程", partner: "植物研究所", time: "上周完成", result: "线下交换完成，双方确认无遗留事项", score: "+15" },
];

export default function MeBridgesPage() {
  const bridgeCompletions = useProfileStore((s) => s.bridgeCompletions);
  const logs = useProfileStore((s) => s.growthLogs).filter((item) => item.title.includes("桥约"));
  const items = logs.length ? logs.map((log, index) => ({ title: log.title, partner: `桥约伙伴 ${index + 1}`, time: log.date, result: "双方已完成确认，形成一次闭环行动", score: `+${log.delta}` })) : DEFAULT_DONE;
  const total = Math.max(bridgeCompletions, items.length);

  return (
    <AppShell>
      <main className="min-h-dvh bg-[linear-gradient(180deg,#f1ffe7_0%,#ffffff_100%)] px-4 pt-4">
        <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-[#f1ffe7]/90 px-4 py-3 backdrop-blur">
          <Link href="/me" aria-label="返回我的主页" className="grid h-10 w-10 place-items-center rounded-full bg-white/82 text-[#20351d] shadow-sm"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-[20px] font-black text-[#20351d]">完成的桥约</h1><p className="text-[12px] text-[#758274]">我参与并完成闭环的行动记录</p></div>
        </header>
        <section className="mt-3 rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_18px_46px_rgba(55,95,42,0.10)] backdrop-blur-xl">
          <div className="flex items-center justify-between"><div><p className="text-[13px] text-[#758274]">累计闭环</p><b className="mt-1 block text-[32px] leading-none text-[#20351d]">{total}</b></div><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f5dc] text-[#1f7a3a]"><HeartHandshake className="h-7 w-7" /></span></div>
        </section>
        <div className="mt-4 space-y-3 pb-28">
          {items.map((item) => <article key={`${item.title}-${item.time}`} className="rounded-[24px] border border-[#e1ead1] bg-white/92 p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eaf7ef] text-[#1f7a3a]"><CheckCircle2 className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="text-[16px] font-black leading-snug text-[#20351d]">{item.title}</h2><span className="shrink-0 rounded-full bg-[#fff4df] px-2 py-1 text-[12px] font-bold text-[#bd7c10]"><Star className="mr-1 inline h-3 w-3" />{item.score}</span></div><p className="mt-1 text-[12px] font-semibold text-[#62A75C]">{item.partner} · {item.time}</p><p className="mt-2 text-[13px] leading-relaxed text-[#5f7159]">{item.result}</p></div></div></article>)}
        </div>
      </main>
    </AppShell>
  );
}
