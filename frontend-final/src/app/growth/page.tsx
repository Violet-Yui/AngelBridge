"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Leaf, Trophy, Sprout, Handshake, AlertTriangle, ChevronDown, Sparkles, Gift, Flower2 } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { ME } from "@/lib/tsq/data";
import { useProfileStore } from "@/stores/profile-store";
import { cn } from "@/utils/utils";

const dynamics = [
  { title: "获得雯雯、小尘、婷婷、一鸣感谢", desc: "得 2 枚草莓，成长分 +10", delta: 10, icon: Gift, tone: "orange" },
  { title: "和小雨完成一次交换", desc: "开出一朵小红花，成长分 +5", delta: 5, icon: Flower2, tone: "green" },
  { title: "帮助小王修改简历", desc: "一次有效帮助被对方确认，成长分 +12", delta: 12, icon: Handshake, tone: "blue" },
  { title: "完成一次英语陪练", desc: "约定闭环完成，成长分 +8", delta: 8, icon: Trophy, tone: "purple" },
  { title: "新增一条清晰需求", desc: "人生树长出新叶，成长分 +3", delta: 3, icon: Leaf, tone: "green" },
];

const rules = [
  "注册登录，树苗得基础成长分100分",
  "完成人生树资料：树苗获得匹配成长分值，并根据拥有的东西长出对应果实",
  "发布有效需求：长出一片叶子",
  "完成一次交换：开一朵花",
  "获得对方感谢：结一枚果实",
  "连续帮助他人：树冠扩大",
  "失约或被投诉：出现枯叶，并进入修复机制",
];

const examples = ["3月12日：帮助小王修改简历", "3月15日：完成一次英语陪练", "3月20日：获得一枚感谢果实"];

const toneCls: Record<string, string> = {
  orange: "bg-[#fff2d8]/80 text-[#f28a2e] ring-[#ffe0aa]",
  green: "bg-[#e8f7ed]/80 text-[#23a56f] ring-[#cdebc0]",
  blue: "bg-[#eaf3ff]/80 text-[#2679ff] ring-[#cfe0ff]",
  purple: "bg-[#f2edff]/80 text-[color:var(--purple)] ring-[#ddd2f5]",
};

export default function GrowthPage() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const growthBonus = useProfileStore((s) => s.growthBonus);
  const vitalityBonus = useProfileStore((s) => s.vitalityBonus);
  const bridgeCompletions = useProfileStore((s) => s.bridgeCompletions);
  const growthLogs = useProfileStore((s) => s.growthLogs);
  const allDynamics = [
    ...growthLogs.map((log) => ({ ...log, desc: `桥约闭环完成，成长分 +${log.delta} · 生命值 +10`, icon: Trophy, tone: "green" })),
    ...dynamics,
  ];
  const visibleDynamics = showAll ? allDynamics : allDynamics.slice(0, 2);
  const score = ME.growth + growthBonus;
  const life = ME.luck + vitalityBonus;
  const percent = Math.min(100, Math.round((score / 1500) * 100));

  return (
    <AppShell hidePet>
      <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#f1ffe7_0%,#f7fbf1_42%,#ffffff_100%)]">
        <div className="pointer-events-none absolute -left-16 top-20 h-44 w-44 rounded-full bg-[#bdf080]/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-56 h-56 w-56 rounded-full bg-[#fff0a8]/45 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-5 top-20 h-[380px] rounded-[48px] bg-white/20 backdrop-blur-2xl" />

        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/60 bg-white/45 px-4 py-3 shadow-[0_8px_26px_rgba(55,95,42,0.06)] backdrop-blur-2xl">
          <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-[#45623f] shadow-sm active:scale-90">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[16px] font-black text-[#20351d]">人生树成长体系</h1>
            <p className="text-[11px] text-[#6b7b66]">真实互助会让人生树持续生长</p>
          </div>
        </header>

        <main className="relative z-10 px-5 py-5 text-[#1f2a1f]">
          <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/42 p-5 shadow-[0_22px_60px_rgba(88,169,66,0.16)] backdrop-blur-2xl">
            <div className="absolute right-4 top-4 rounded-full bg-[#eaf7df]/80 px-3 py-1 text-[12px] font-bold text-[#6fab00] ring-1 ring-white/70">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />优秀
            </div>
            <div className="flex flex-col items-center pt-7 text-center">
              <p className="max-w-[210px] text-[22px] font-black leading-tight text-[#20351d]">你的树正在稳定生长</p>
              <p className="mt-2 max-w-[250px] text-[13px] leading-relaxed text-[#4d6548]">资料、互助、履约和被感谢记录共同构成成长分，越真实、越闭环，成长越明显。</p>
              <div className="mt-5 grid h-[148px] w-[148px] place-items-center rounded-full bg-[conic-gradient(from_180deg,#6fbd19_0deg,#c8ec76_calc(var(--p)*3.6deg),rgba(255,255,255,.42)_calc(var(--p)*3.6deg),rgba(255,255,255,.42)_360deg)] p-1.5 shadow-[0_16px_40px_rgba(117,188,0,0.18)]" style={{ "--p": percent } as React.CSSProperties}>
                <div className="grid h-full w-full place-items-center rounded-full border border-white/80 bg-white/72 shadow-inner backdrop-blur-xl">
                  <div className="text-center">
                    <strong className="block text-[40px] font-black leading-none text-[#75bc00] tabular-nums">{score}</strong>
                    <span className="mt-2 block text-[14px] font-semibold text-[#48544a]">成长分</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid w-full max-w-[230px] grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-white/62 px-2 py-2 ring-1 ring-white/70">
                  <b className="block text-[17px] text-[#58A942]">+{growthBonus}</b>
                  <span className="text-[11px] text-[#6b7b66]">桥约经验</span>
                </div>
                <div className="rounded-2xl bg-white/62 px-2 py-2 ring-1 ring-white/70">
                  <b className="block text-[17px] text-[#f2a93b]">{life}</b>
                  <span className="text-[11px] text-[#6b7b66]">当前生命值</span>
                </div>
              </div>
              <p className="mt-2 text-[12px] font-semibold text-[#58A942]">已完成 {bridgeCompletions} 次桥约闭环</p>
              <div className="mt-3 h-2 w-full max-w-[230px] overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-gradient-to-r from-[#75bc00] to-[#b7e65d]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[30px] border border-white/70 bg-white/50 p-4 shadow-[0_18px_45px_rgba(55,95,42,0.10)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-black text-[#ff8a00]">动态</h2>
                <p className="mt-0.5 text-[12px] text-[#7a8a73]">最近获得的成长积分</p>
              </div>
              <button onClick={() => setShowAll((v) => !v)} className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-3 py-1.5 text-[12px] font-bold text-[#2F7D32] ring-1 ring-[#dbeed0] active:scale-95">
                {showAll ? "收起" : "查看全部"}<ChevronDown className={cn("h-3.5 w-3.5 transition", showAll && "rotate-180")} />
              </button>
            </div>
            <div className="space-y-2.5">
              {visibleDynamics.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="flex items-center gap-3 rounded-[22px] border border-white/70 bg-white/56 p-3 shadow-[0_8px_22px_rgba(55,95,42,0.06)] backdrop-blur-xl">
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1", toneCls[item.tone])}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13px] font-black text-[#23321f]">{item.title}</h3>
                      <p className="mt-0.5 text-[12px] text-[#6b7b66]">{item.desc}</p>
                    </div>
                    <b className="shrink-0 rounded-full bg-[#eaf7df]/90 px-2.5 py-1 text-[12px] text-[#58A942] ring-1 ring-white/80">+{item.delta}</b>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-[30px] border border-white/70 bg-white/50 p-4 shadow-[0_18px_45px_rgba(55,95,42,0.10)] backdrop-blur-2xl">
            <h2 className="mb-4 text-[17px] font-black text-[#0e1c3b]">人生树成长规则</h2>
            <div className="space-y-3">
              {rules.map((rule, index) => {
                const Icon = index === 0 ? Sprout : index === 3 ? Handshake : index === 4 ? Trophy : index === 6 ? AlertTriangle : Leaf;
                return (
                  <div key={rule} className="flex gap-3 rounded-[22px] bg-white/54 p-3 ring-1 ring-white/70 backdrop-blur-xl">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef8e6]/90 text-[#58A942] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-[13px] leading-relaxed text-[#263238]">{rule}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,.65),rgba(255,251,234,.72))] p-4 text-[14px] leading-relaxed text-[#263238] shadow-[0_16px_38px_rgba(55,95,42,0.08)] backdrop-blur-2xl">
            <p className="font-black text-[#1f3d1a]">成长不能只奖励“活跃”，而是奖励真实、有帮助、完成闭环的行为。</p>
            <p className="mt-3 font-semibold text-[#45623f]">例如：</p>
            <div className="mt-1 space-y-1 text-[#45623f]">
              {examples.map((item) => <p key={item}>{item}</p>)}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
