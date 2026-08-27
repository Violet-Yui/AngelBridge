"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, ChevronRight, Lock, ScrollText } from "lucide-react";
import { FlowShell } from "@/components/tsq/flow-shell";
import { SCHEDULE_ITEMS } from "@/lib/tsq/xiaotian-flow";
import { cn } from "@/utils/utils";

const toneCls = {
  green: "bg-[#eaf7ef] text-[#23a56f]",
  blue: "bg-[#e8f2ff] text-[#2679ff]",
  warm: "bg-[#fff4df] text-[#f28a2e]",
  purple: "bg-[#f0ebfd] text-[color:var(--purple)]",
  danger: "bg-[#fff0f0] text-[#ef5b5b]",
};

export default function BridgeSchedulePage() {
  const [saved, setSaved] = useState(false);
  return (
    <FlowShell title="桥约" right="bell">
      <section className="rounded-[24px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff4df] text-[#f2a93b]"><ScrollText className="h-8 w-8" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[21px] font-bold text-[#071D3A]">桥约草稿 <span className="text-sm font-medium text-[#58708c]">by 小天</span></h2>
            <p className="mt-1 text-[14px] text-[#243b5a]">我们已达成初步共识，确认后即生效</p>
          </div>
          <span className="rounded-lg bg-[#d7efc5] px-2 py-1 text-[13px] text-[#2F7D32]">草稿</span>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[22px] bg-white/88 shadow-[var(--brand-shadow-sm)]">
        {SCHEDULE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.title} className="flex w-full items-center gap-3 border-b border-[#f1f2ec] p-3.5 text-left last:border-b-0 active:bg-[#f7fbf4]">
              <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", toneCls[item.tone as keyof typeof toneCls])}><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><b className="text-[16px] text-[#071D3A]">{item.title}</b><p className="mt-0.5 text-[13px] leading-snug text-[#243b5a]">{item.desc}</p></div>
              <ChevronRight className="h-5 w-5 text-[#9aa8b6]" />
            </button>
          );
        })}
      </section>

      <button
        data-el="schedule-confirm"
        onClick={() => {
          setSaved(true);
          toast("已收入日程，桥约正式开始 🌱");
        }}
        className={cn("mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(38,121,255,.28)] active:scale-[.98]", saved ? "bg-[#58A942]" : "bg-gradient-to-r from-[#2679ff] to-[#38c7f4]")}
      >
        <CalendarCheck className="h-5 w-5" /> {saved ? "已收入日程" : "确认桥约，开始第一步"}
      </button>
      <p className="mt-3 text-center text-[13px] text-[#58708c]"><Lock className="mr-1 inline h-4 w-4" />确认后双方将收到通知，桥约生效</p>
    </FlowShell>
  );
}
