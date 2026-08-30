"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Lock, MapPin, ShieldCheck, User } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { CONFIRM_INFO } from "@/lib/tsq/xiaotian-flow";

export default function BridgeConfirmPage() {
  const [otherConfirmed, setOtherConfirmed] = useState(false);
  const [declined, setDeclined] = useState(false);
  return (
    <FlowShell title="双方确认" right="none">
      <section data-el="confirm-status" className="space-y-5">
        <ConfirmPerson mine confirmed />
        <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-white shadow-[0_8px_18px_rgba(35,165,111,.28)] ${otherConfirmed ? "bg-[#3fc17e]" : "bg-[#f2a93b]"}`}>
          {otherConfirmed ? <CheckCircle2 className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
        </div>
        <ConfirmPerson confirmed={otherConfirmed} declined={declined} onConfirm={() => setOtherConfirmed(true)} onDecline={() => setDeclined(true)} />
      </section>

      <section className="mt-5 rounded-[22px] border border-[#f3d59a] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
        <h2 className="mb-3 flex items-center gap-1.5 text-[17px] font-bold text-[#071D3A]">🌱 将开放的信息</h2>
        <div className="space-y-2">
          {CONFIRM_INFO.opened.map(([label, value], i) => (
            <InfoLine key={label} icon={i === 0 ? MapPin : User} label={label} value={value} />
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
        我们将严格保护你的隐私，信息仅在双方同意后按最小必要原则开放。双方确认成功后，小天会把履行安排放进“桥约”。
      </p>
      {declined ? (
        <div className="mt-4 rounded-2xl bg-[#fff4df] p-3 text-[13px] leading-relaxed text-[#8a5a14]">
          对方暂未确认意向，本次搭桥不会进入履行安排。你可以回到桥约的“等待对方确认”继续查看，或重新调整邀请内容。
        </div>
      ) : (
        <Link
          href={otherConfirmed ? "/bridge/schedule?from=confirmed" : "#"}
          aria-disabled={!otherConfirmed}
          onClick={(e) => { if (!otherConfirmed) e.preventDefault(); }}
          data-el="confirm-continue"
          className={`mt-4 flex w-full items-center justify-center rounded-full py-3.5 text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(88,169,66,.28)] ${otherConfirmed ? "bg-gradient-to-r from-[#58A942] to-[#7ccf68] active:scale-[.98]" : "cursor-not-allowed bg-neutral-300"}`}
        >
          {otherConfirmed ? "生成履行安排并放入桥约 🌱" : "等待对方确认意向"}
        </Link>
      )}
    </FlowShell>
  );
}

function ConfirmPerson({ mine, confirmed, declined, onConfirm, onDecline }: { mine?: boolean; confirmed?: boolean; declined?: boolean; onConfirm?: () => void; onDecline?: () => void }) {
  return (
    <article className="rounded-[22px] border border-[#bde7cb] bg-white/82 p-4 shadow-[var(--brand-shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <b className="text-[17px] text-[#071D3A]">{mine ? "你" : "品牌摄影师阿杰"}</b>
          <div className="mt-2"><XiaotianAvatar size={58} /></div>
        </div>
        <div className="text-right">
          <p className={`flex items-center justify-end gap-1 text-[18px] font-bold ${confirmed ? "text-[#23a56f]" : "text-[#d08a18]"}`}>
            {confirmed ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
            {mine ? "你已确认意向" : declined ? "对方暂不确认" : confirmed ? "对方已确认意向" : "等待对方确认"}
          </p>
          {!mine && !confirmed && !declined && (
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={onDecline} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#58708c] ring-1 ring-[#dfe7ee] active:scale-95">
                演示对方否
              </button>
              <button onClick={onConfirm} className="rounded-full bg-[#fff4df] px-3 py-1.5 text-[12px] font-bold text-[#bd7c10] active:scale-95">
                演示对方确认
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="grid grid-cols-[24px_1fr_1fr] items-center border-b border-[#f1f2ec] py-2 text-[14px] last:border-b-0"><Icon className="h-4 w-4 text-[#23a56f]" /><span className="text-[#58708c]">{label}</span><b className="text-right text-[#243b5a]">{value}</b></div>;
}
