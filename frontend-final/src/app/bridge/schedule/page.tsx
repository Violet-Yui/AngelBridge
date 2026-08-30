"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, CheckCircle2, Clock3, Lock, PackageCheck, RotateCcw, ScrollText, XCircle } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { SCHEDULE_ITEMS } from "@/lib/tsq/xiaotian-flow";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { PactDetail, PactView } from "@/lib/angelbridge-types";
import { cn } from "@/utils/utils";

const toneCls = {
  green: "bg-[#eaf7ef] text-[#23a56f]", blue: "bg-[#e8f2ff] text-[#2679ff]",
  warm: "bg-[#fff4df] text-[#f28a2e]", purple: "bg-[#f0ebfd] text-[color:var(--purple)]",
  danger: "bg-[#fff0f0] text-[#ef5b5b]",
};

export default function BridgeSchedulePage() {
  const router = useRouter();
  const matchId = useSearchParams().get("matchId") ?? "";
  const [paused, setPaused] = useState(false);
  const [pact, setPact] = useState<PactView | null>(null);
  const [detail, setDetail] = useState<PactDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!matchId) return;
    const [pacts, pactDetail] = await Promise.all([angelbridgeApi.getPacts(), angelbridgeApi.getPact(matchId)]);
    setPact(pacts.find((item) => item.matchId === matchId) ?? null);
    setDetail(pactDetail);
  }, [matchId]);

  useEffect(() => { void load().catch((error) => toast.error(error instanceof Error ? error.message : "桥约读取失败")); }, [load]);

  const started = pact?.status === "active" || pact?.status === "waiting_completion" || pact?.status === "completed";
  const completed = pact?.status === "completed";
  const descriptions = useMemo(() => [detail?.title, detail?.firstAction, detail?.completionCriteria, detail?.exitRule, detail?.otherNotes].filter((value): value is string => Boolean(value)), [detail]);

  async function confirmStart() {
    if (!matchId || pact?.yourStartConfirmed || submitting) return;
    setSubmitting(true);
    try { await angelbridgeApi.confirmPactStart(matchId); await load(); toast("你已确认开始履约"); }
    finally { setSubmitting(false); }
  }

  async function confirmCompletion() {
    if (!matchId || pact?.yourCompletionConfirmed || submitting) return;
    setSubmitting(true);
    try {
      const result = await angelbridgeApi.confirmPactCompletion(matchId);
      if (result.status === "completed") { router.push(`/bridge/complete?matchId=${encodeURIComponent(matchId)}`); return; }
      await load();
      toast("你已确认履约完成，等待对方确认");
    } finally { setSubmitting(false); }
  }

  return (
    <FlowShell title="桥约" right="bell">
      <section className="rounded-[24px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff4df] text-[#f2a93b]"><ScrollText className="h-8 w-8" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[21px] font-bold text-[#071D3A]">桥约履行安排 <span className="text-sm font-medium text-[#58708c]">by 小天</span></h2><p className="mt-1 text-[14px] text-[#243b5a]">双方意向已确认，小天已把履行安排放进桥约</p></div>
          <span className="rounded-lg bg-[#d7efc5] px-2 py-1 text-[13px] text-[#2F7D32]">{completed ? "已完成" : started ? "进行中" : "待开始"}</span>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[22px] bg-white/88 shadow-[var(--brand-shadow-sm)]">
        {SCHEDULE_ITEMS.map((item, index) => { const Icon = item.icon; return (
          <button key={item.title} className="flex w-full items-center gap-3 border-b border-[#f1f2ec] p-3.5 text-left last:border-b-0 active:bg-[#f7fbf4]">
            <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", toneCls[item.tone as keyof typeof toneCls])}><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><b className="text-[16px] text-[#071D3A]">{item.title}</b><p className="mt-0.5 text-[13px] leading-snug text-[#243b5a]">{descriptions[index] ?? item.desc}</p></div>
          </button>
        ); })}
      </section>

      <section className="mt-4 rounded-[22px] border border-[#dbeed0] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-3 flex items-center gap-1.5 text-[17px] font-bold text-[#071D3A]"><PackageCheck className="h-5 w-5 text-[#23a56f]" />开始履约需双方确认</h2>
        <ConfirmLine role="你" ask="是否已确认本阶段约定事项已准备就绪？" done={Boolean(pact?.yourStartConfirmed)} disabled={submitting || completed} onConfirm={() => void confirmStart()} />
        <ConfirmLine role="对方" ask="对方是否已确认本阶段约定事项已准备就绪？" done={Boolean(pact?.counterpartStartConfirmed)} disabled readOnly onConfirm={() => undefined} />
        {!started && <p className="mt-2 text-[12px] text-[#58708c]">双方都确认后，桥约才会从“已确认”进入“进行中”。</p>}
      </section>

      <section className="mt-3 rounded-[22px] border border-[#dbeed0] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-3 flex items-center gap-1.5 text-[17px] font-bold text-[#071D3A]"><RotateCcw className="h-5 w-5 text-[#2679ff]" />履约完成需双方确认</h2>
        <ConfirmLine role="你" ask="是否已确认本阶段约定事项已经完成？" done={Boolean(pact?.yourCompletionConfirmed)} disabled={!started || submitting} onConfirm={() => void confirmCompletion()} />
        <ConfirmLine role="对方" ask="对方是否已确认本阶段约定事项已经完成？" done={Boolean(pact?.counterpartCompletionConfirmed)} disabled readOnly onConfirm={() => undefined} />
        {!started && <p className="mt-2 text-[12px] text-[#8a5a14]">请先完成开始履约的双方确认。</p>}
      </section>

      {paused ? <div className="mt-5 rounded-2xl bg-[#fff4df] p-3 text-[13px] leading-relaxed text-[#8a5a14]">已暂不推进履约。桥约会保留在当前状态，等待双方后续确认。</div> : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button data-el="schedule-pause" onClick={() => { setPaused(true); toast("已暂不推进，可稍后再确认"); }} className="flex items-center justify-center gap-1 rounded-full bg-white py-3 text-[14px] font-bold text-[#58708c] ring-1 ring-[#dfe7ee] active:scale-[.98]"><XCircle className="h-4 w-4" /> 暂不推进</button>
          <button data-el="schedule-confirm" disabled={!completed} onClick={() => router.push(`/bridge/complete?matchId=${encodeURIComponent(matchId)}`)} className={cn("flex items-center justify-center gap-1 rounded-full py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(38,121,255,.28)] active:scale-[.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none", completed ? "bg-[#58A942]" : "bg-neutral-300")}><CalendarCheck className="h-4 w-4" /> 双方确认完成</button>
        </div>
      )}
      <p className="mt-3 text-center text-[13px] text-[#58708c]"><Lock className="mr-1 inline h-4 w-4" />只有双方完成对应确认，桥约状态才会推进</p>
    </FlowShell>
  );
}

function ConfirmLine({ role, ask, done, disabled, readOnly, onConfirm }: { role: string; ask: string; done: boolean; disabled?: boolean; readOnly?: boolean; onConfirm: () => void }) {
  return <div className="mb-2 last:mb-0 rounded-2xl bg-[#f7fbf4] p-3 ring-1 ring-[#edf1e8]"><div className="flex items-start gap-2">
    <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", done ? "bg-[#23a56f] text-white" : disabled ? "bg-neutral-200 text-neutral-400" : "bg-[#fff4df] text-[#d08a18]")}>{done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</span>
    <div className="min-w-0 flex-1"><b className="text-[14px] text-[#071D3A]">{role}</b><p className="mt-0.5 text-[13px] leading-snug text-[#58708c]">{ask}</p></div>
    <button disabled={done || disabled} onClick={onConfirm} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#2679ff] ring-1 ring-[#cfe0ff] active:scale-95 disabled:text-neutral-400 disabled:ring-neutral-200">{done ? "已确认" : readOnly ? "待确认" : "确认"}</button>
  </div></div>;
}
