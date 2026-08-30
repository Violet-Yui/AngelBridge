"use client";

import Link from "next/link";
import { CheckCircle2, Lock, MessageCircle } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { BRIDGE_DETAIL } from "@/lib/tsq/xiaotian-flow";

export default function BridgeDetailPage() {
  return (
    <FlowShell title="一座桥" right="none">
      <div data-el="bridge-people" className="mb-3 flex items-center justify-between px-2">
        <Person name="你" desc="空间使用者" tag="你分享：空间" />
        <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-md">💗</div>
        <Person name="品牌摄影师阿杰" desc="创意团队" tag="他分享：拍摄" other />
      </div>

      <section className="rounded-[24px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
        <h2 className="mb-3 text-[17px] font-bold text-[#071D3A]">这座桥的交换 🌱</h2>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          {BRIDGE_DETAIL.exchange.map((x, i) => {
            const Icon = x.icon;
            return (
              <>
                <div key={x.label} className={`rounded-2xl border p-4 text-center ${i === 0 ? "border-[#bde7cb] bg-[#f2fbf5] text-[#23a56f]" : "border-[#f3d59a] bg-[#fff8ea] text-[#f2a93b]"}`}>
                  <p className="text-[13px] font-semibold">{x.label}</p>
                  <Icon className="mx-auto mt-3 h-8 w-8" />
                  <b className="mt-2 block text-[14px] leading-snug text-[#071D3A]">{x.title}</b>
                </div>
                {i === 0 && <div className="grid place-items-center text-2xl text-[#23a56f]">⇄</div>}
              </>
            );
          })}
        </div>
      </section>

      <InfoCard title="为什么适合 🌱" items={BRIDGE_DETAIL.reasons} check />
      <InfoCard title="待确认 / 未知项 🌱" items={BRIDGE_DETAIL.unknowns} />
      <section className="mt-3 rounded-[20px] bg-[#eaf7ef] p-3 text-[#196c42]"><MessageCircle className="mr-2 inline h-4 w-4" />建议的第一步：{BRIDGE_DETAIL.next}</section>
      <p className="mt-3 text-center text-[13px] text-[#58708c]"><Lock className="mr-1 inline h-4 w-4 text-[#f2a93b]" />隐私保护：在你同意了解对方前，仅展示必要信息。</p>
      <Link href="/bridge/confirm" className="mt-3 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#23a56f] to-[#4fc98f] py-3.5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(35,165,111,.28)]">我愿意了解对方 🌱</Link>
    </FlowShell>
  );
}

function Person({ name, desc, tag, other }: { name: string; desc: string; tag: string; other?: boolean }) {
  return <div className={`flex w-[38%] items-center gap-2 ${other ? "justify-end text-right" : ""}`}><XiaotianAvatar size={44} /><div><b className="text-[14px]">{name}</b><p className="text-[11px] text-[#58708c]">{desc}</p><span className={`rounded-md px-1.5 py-0.5 text-[11px] ${other ? "bg-[#fff4df] text-[#ef6d30]" : "bg-[color:var(--soft)] text-[color:var(--deep)]"}`}>{tag}</span></div></div>;
}

function InfoCard({ title, items, check }: { title: string; items: string[]; check?: boolean }) {
  return <section className="mt-3 rounded-[22px] bg-white/86 p-4 shadow-[var(--brand-shadow-sm)]"><h2 className="mb-2 text-[17px] font-bold text-[#071D3A]">{title}</h2><div className="rounded-2xl border border-[color:var(--border)] bg-white/70 p-2.5">{items.map((item) => <p key={item} className="border-b border-[#f1f2ec] py-1.5 text-[13px] text-[#243b5a] last:border-b-0">{check && <CheckCircle2 className="mr-1 inline h-4 w-4 text-[#58A942]" />}{item}</p>)}</div></section>;
}
