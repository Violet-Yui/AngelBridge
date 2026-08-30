"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2, Search, ShieldCheck, Target,
  MessageCircle, Loader2, Sparkles,
} from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { CANDIDATES } from "@/lib/tsq/xiaotian-flow";
import { HOME_MATCHES } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

const tone: Record<string, string> = {
  blue: "bg-[#e8f2ff] text-[#2679ff]",
  green: "bg-[#eaf7ef] text-[#23a56f]",
  warm: "bg-[#fff4df] text-[#f2a93b]",
};

const STEPS = [
  { label: "识别你的意图", icon: Target },
  { label: "寻找对方资源", icon: Search },
  { label: "检查双方收益", icon: ShieldCheck },
  { label: "生成桥的理由", icon: MessageCircle },
];

export function BridgingScreen() {
  const params = useSearchParams();
  // 定向搭桥：带 target 命中某个确定对象时，走一对一确认，而非多候选推荐
  const directed = HOME_MATCHES.find((m) => m.id === params.get("target")) ?? null;

  // 当前推进到第几步（0..STEPS.length 表示全部完成）
  const [progress, setProgress] = useState(1);
  const [revealed, setRevealed] = useState(0); // 已揭示的候选人数量
  const [helpOpen, setHelpOpen] = useState(false);

  const done = progress >= STEPS.length;

  // 进度分步自动推进
  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setProgress((p) => p + 1), 900);
    return () => window.clearTimeout(timer);
  }, [progress, done]);

  // 全部步骤完成后，候选人逐个出现（定向模式下只有 1 个确定对象）
  const totalReveal = directed ? 1 : CANDIDATES.length;
  useEffect(() => {
    if (!done || revealed >= totalReveal) return;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), 450);
    return () => window.clearTimeout(timer);
  }, [done, revealed, totalReveal]);

  const allReady = done && revealed >= totalReveal;
  const directedPair = getDirectedPair(directed?.id);

  return (
    <FlowShell title="小天搭桥" right="help" onHelp={() => setHelpOpen(true)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-[#071D3A]">
            {directed
              ? (allReady ? "小天已锁定确认对象 🌉" : "小天正在定向搭桥...")
              : (allReady ? "小天为你找到了这些桥 🌉" : "小天正在为你搭桥...")}
          </h2>
          <p className="mt-1 text-[14px] text-[#58708c]">
            {directed
              ? (allReady ? "这次将围绕你已选择的对象继续推进。" : "正在整理你选择的邀约对象与可交换边界，请稍候～")
              : (allReady ? "搭桥成功后进入双方意向确认～" : "正在转达邀请并进行双向匹配，请稍候～")}
          </p>
        </div>
        <XiaotianAvatar size={82} />
      </div>

      {/* 进度条：分步推进 */}
      <section className="rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => {
            const isDone = i < progress;
            const isActive = i === progress && !done;
            const Icon = s.icon;
            return (
              <div key={s.label} className="text-center">
                <span
                  className={cn(
                    "mx-auto grid h-10 w-10 place-items-center rounded-full transition",
                    isDone ? "bg-[#2679ff] text-white"
                      : isActive ? "bg-[#58A942] text-white animate-pulse"
                      : "bg-neutral-100 text-neutral-400",
                  )}
                >
                  {isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                </span>
                <p className="mt-1 text-[11px] leading-tight text-[#243b5a]">{s.label}</p>
              </div>
            );
          })}
        </div>
        {/* 底部细进度条 */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2679ff] to-[#38c7f4] transition-all duration-500"
            style={{ width: `${Math.min(progress, STEPS.length) / STEPS.length * 100}%` }}
          />
        </div>
      </section>

      {/* 搭桥关系示意：定向模式只展示当前这条关系，避免误解为多组随机匹配 */}
      <section className="mt-3 rounded-[22px] bg-white/86 p-4 shadow-[var(--brand-shadow-sm)]">
        <div className="flex items-center justify-center gap-3">
          <RelationPill
            title={directedPair.leftTitle}
            desc={directedPair.leftDesc}
            cls={directedPair.leftCls}
          />
          <span className="text-[22px] font-bold text-[color:var(--primary)]">→</span>
          <RelationPill
            title={directedPair.rightTitle}
            desc={directedPair.rightDesc}
            cls={directedPair.rightCls}
          />
        </div>
      </section>

      {/* 定向模式：一对一确认卡；通用模式：多候选逐个出现 */}
      <section className="mt-3 min-w-0 overflow-hidden rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-2 flex items-center gap-2 text-[17px] font-bold text-[#071D3A]">
          {directed
            ? (done ? "为你定向搭桥的对象" : "正在为你定向搭桥…")
            : (done ? `已匹配到 ${CANDIDATES.length} 个候选资源` : "正在匹配候选资源…")}
          {!done && <Loader2 className="h-4 w-4 animate-spin text-[#58708c]" />}
        </h2>

        {/* —— 定向：一对一确认卡 —— */}
        {directed ? (
          <div className="min-w-0">
            {!done && <SkeletonRow />}
            {done && revealed >= 1 && (
              <div
                className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white"
                style={{ animation: "card-pop .35s cubic-bezier(.2,.8,.2,1) both" }}
              >
                <div className="flex items-center gap-3 p-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[color:var(--soft)]">
                    <Image src={directed.image} alt={directed.title} fill sizes="56px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] text-[#071D3A]">{directed.title}</b>
                    <p className="truncate text-[12px] text-[#58708c]">{directed.tag} · 匹配度 {directed.scoreRange}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-[#eaf7ef] px-2 py-1 text-[12px] font-semibold text-[#23a56f]">
                    定向邀请
                  </span>
                </div>
                <div className="border-t border-[color:var(--border)] bg-[#f5fbf1] px-3 py-2.5">
                  <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-[#24321f]">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />
                    小天已按你的意向锁定这一位对象，将只与 TA 一对一搭桥：{directed.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* —— 通用：多候选推荐 —— */
          <div className="min-w-0 space-y-2">
            {!done && (
              <>
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </>
            )}
            {done && CANDIDATES.slice(0, revealed).map((c) => (
              <Link
                key={c.name}
                href="/bridge/confirm"
                className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-2.5 transition active:scale-[.99]"
                style={{ animation: "card-pop .35s cubic-bezier(.2,.8,.2,1) both" }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--soft)] text-[color:var(--deep)]">
                  {c.name.slice(-3, -1)}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[14px]">{c.name}</b>
                  <p className="truncate text-[12px] text-[#58708c]">{c.desc}</p>
                </div>
                <span className={cn("shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[12px] font-semibold", tone[c.tone])}>
                  匹配度 {c.scoreRange}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="mt-3 text-center text-[13px] text-[#58708c]">
        <CheckCircle2 className="mr-1 inline h-4 w-4 text-[#23a56f]" />
        只会在你允许的边界内匹配，隐私安全有保障
      </p>

      <Link
        href={allReady ? "/bridge/confirm" : "#"}
        aria-disabled={!allReady}
        onClick={(e) => { if (!allReady) e.preventDefault(); }}
        className={cn(
          "mt-3 flex w-full items-center justify-center rounded-full py-3.5 text-[16px] font-bold text-white transition",
          allReady
            ? "bg-gradient-to-r from-[#2679ff] to-[#38c7f4] shadow-[0_10px_24px_rgba(38,121,255,.28)] active:scale-[.98]"
            : "cursor-not-allowed bg-neutral-300",
        )}
      >
        {allReady
          ? (directed ? "确认并进入双方意向" : "进入双方确认")
          : (directed ? "小天正在定向搭桥…" : "小天正在匹配中…")}
      </Link>

      {helpOpen && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-center justify-center bg-black/30 px-5 backdrop-blur-sm" onClick={() => setHelpOpen(false)}>
          <section className="w-full rounded-[28px] border border-white/70 bg-white/92 p-5 shadow-[0_22px_60px_rgba(55,95,42,.20)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-black text-[#071D3A]">小天如何判断这次搭桥？</h3>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-[#45623f]">
              <p>
                定向搭桥不是重新随机推荐多个资源，而是基于你刚刚主动选择并确认邀约的对象，继续推进这一组明确关系。
              </p>
              <p>
                小天会先整理双方的公开信息、需求与资源边界，确认“谁在满足谁的需求”、以及这次连接是否具备双向价值。
              </p>
              <p>
                当你进入下一步「双方确认」时，需要双方分别确认意向。只有双方都同意后，系统才会生成后续履约安排并进入桥约流程。
              </p>
            </div>
            <button onClick={() => setHelpOpen(false)} className="mt-4 w-full rounded-full bg-[color:var(--primary)] py-3 text-[14px] font-bold text-white active:scale-95">
              我知道了
            </button>
          </section>
        </div>
      )}
    </FlowShell>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white p-2.5">
      <span className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />
      <div className="flex-1 space-y-1.5">
        <span className="block h-3 w-24 animate-pulse rounded bg-neutral-100" />
        <span className="block h-2.5 w-40 animate-pulse rounded bg-neutral-100" />
      </div>
      <span className="h-6 w-16 animate-pulse rounded-full bg-neutral-100" />
    </div>
  );
}

function getDirectedPair(id?: string) {
  // m4 是「你的课程正好是对方的心愿」：你去满足对方需求；其余首页推荐先按对方资源满足你的需求表达
  if (id === "m4") {
    return {
      leftTitle: "你的资源",
      leftDesc: "可提供课程 / 服务",
      leftCls: "bg-[#fff4df] text-[#d08a18] ring-[#f4e0ba]",
      rightTitle: "对方需求",
      rightDesc: "正在寻找对应支持",
      rightCls: "bg-[#f0ebfd] text-[color:var(--purple)] ring-[#ddd2f5]",
    };
  }

  return {
    leftTitle: "你的需求",
    leftDesc: "当前想要解决的事项",
    leftCls: "bg-[#e8f2ff] text-[#2679ff] ring-[#cfe0ff]",
    rightTitle: "对方资源",
    rightDesc: "可提供对应支持",
    rightCls: "bg-[#eaf7ef] text-[#23a56f] ring-[#cdebc0]",
  };
}

function RelationPill({ title, desc, cls }: { title: string; desc: string; cls: string }) {
  return (
    <div className={cn("min-h-[74px] flex-1 rounded-[24px] px-4 py-3 text-left ring-1", cls)}>
      <b className="block text-[15px] font-black leading-tight">{title}</b>
      <p className="mt-1 text-[12px] leading-snug opacity-80">{desc}</p>
    </div>
  );
}
