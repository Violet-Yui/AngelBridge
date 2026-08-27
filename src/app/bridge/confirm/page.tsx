"use client";

import Link from "next/link";
import { CheckCircle2, Lock, MapPin, ShieldCheck, User, Phone } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { CONFIRM_INFO } from "@/lib/tsq/xiaotian-flow";

export default function BridgeConfirmPage() {
  return (
    <FlowShell title="双方确认" subtitle="双方需分别确认是否继续，达成一致后将开启更多信息。" right="bell">
      <section data-el="confirm-status" className="space-y-5">
        <ConfirmPerson mine />
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#3fc17e] text-white shadow-[0_8px_18px_rgba(35,165,111,.28)]">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <ConfirmPerson />
      </section>

      <section className="mt-5 rounded-[22px] border border-[#f3d59a] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-3 flex items-center gap-1.5 text-[17px] font-bold text-[#071D3A]">🌱 将开放的信息</h2>
        <div className="space-y-2">
          {CONFIRM_INFO.opened.map(([label, value], i) => (
            <InfoLine key={label} icon={i === 0 ? MapPin : i === 1 ? User : Phone} label={label} value={value} />
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-2 flex items-center gap-1.5 text-[17px] font-bold text-[#071D3A]"><ShieldCheck className="h-5 w-5 text-[#23a56f]" />仍受保护的信息</h2>
        {CONFIRM_INFO.protected.map((item) => (
          <p key={item} className="rounded-2xl bg-[#f7fbf4] px-3 py-2 text-[13px] text-[#243b5a]"><Lock className="mr-1 inline h-4 w-4 text-[#23a56f]" />{item}</p>
        ))}
      </section>

      <p className="mt-3 rounded-2xl bg-white/70 p-3 text-[13px] leading-relaxed text-[#58708c]">
        我们将严格保护你的隐私，信息仅在双方同意后按最小必要原则开放。
      </p>
      <Link href="/bridge/schedule" data-el="confirm-continue" className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#58A942] to-[#7ccf68] py-3.5 text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(88,169,66,.28)]">继续生成桥约 🌱</Link>
    </FlowShell>
  );
}

function ConfirmPerson({ mine }: { mine?: boolean }) {
  return (
    <article className="rounded-[22px] border border-[#bde7cb] bg-white/82 p-4 shadow-[var(--brand-shadow-sm)]">
      <div className="flex items-center justify-between">
        <div>
          <b className="text-[17px] text-[#071D3A]">{mine ? "你" : "品牌摄影师阿杰"}</b>
          <div className="mt-2"><XiaotianAvatar size={58} /></div>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[18px] font-bold text-[#23a56f]"><CheckCircle2 className="h-5 w-5" />{mine ? "你已同意搭桥" : "对方正在确认中..."}</p>
          <p className="mt-2 text-[13px] text-[#58708c]">{mine ? "已同意" : "待确认"}</p>
          <p className="text-[13px] text-[#58708c]">今天 {mine ? "10:02" : "10:03"}</p>
        </div>
      </div>
    </article>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="grid grid-cols-[24px_1fr_1fr] items-center border-b border-[#f1f2ec] py-2 text-[14px] last:border-b-0"><Icon className="h-4 w-4 text-[#23a56f]" /><span className="text-[#58708c]">{label}</span><b className="text-right text-[#243b5a]">{value}</b></div>;
}
