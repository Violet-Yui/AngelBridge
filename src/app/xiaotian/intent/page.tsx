"use client";

import Link from "next/link";
import { Edit3, Sparkles } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { INTENT_BLOCKS } from "@/lib/tsq/xiaotian-flow";
import { cn } from "@/utils/utils";

const toneMap = {
  blue: "border-[#b8d8ff] bg-white text-[#2679ff]",
  green: "border-[#bde7cb] bg-white text-[#23a56f]",
  warm: "border-[#f3d59a] bg-white text-[#f2a93b]",
  purple: "border-[#d6c9f6] bg-white text-[color:var(--purple)]",
};

export default function IntentPage() {
  return (
    <FlowShell title="意图确认" subtitle="确认信息后，小天会去帮你搭桥 🌱" right="bell">
      <div className="mb-2 flex items-end gap-3">
        <XiaotianAvatar size={72} />
        <div className="mb-2 rounded-2xl rounded-bl-sm bg-white/80 px-3 py-2 text-[13px] text-[#243b5a] shadow-sm">
          我把你的想法拆成 5 块，可逐项修改。
        </div>
      </div>
      <div data-el="intent-blocks" className="space-y-3">
        {INTENT_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <section key={block.no} className="rounded-[22px] border border-[color:var(--border)] bg-white/86 p-3.5 shadow-[var(--brand-shadow-sm)] backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full text-[15px] font-bold", toneMap[block.tone])}>{block.no}</span>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#071D3A]">{block.title}</h2>
                    <p className="text-[12px] text-[#58708c]">{block.subtitle}</p>
                  </div>
                </div>
                <Edit3 className="h-4 w-4 text-[#2679ff]" />
              </div>
              <div className="space-y-2">
                {block.children.map((item) => {
                  const ItemIcon = item.icon ?? Icon;
                  return (
                    <div key={item.title} className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2.5", toneMap[block.tone])}>
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <b className="text-[14px] text-[#071D3A]">{item.title}</b>
                        {item.desc && <p className="text-[12px] text-[#58708c]">{item.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <Link href="/xiaotian/bridging" data-el="intent-confirm" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2679ff] to-[#38c7f4] py-3.5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(38,121,255,.28)] active:scale-[0.98]">
        <Sparkles className="h-5 w-5" /> 确认，让小天去搭桥
      </Link>
    </FlowShell>
  );
}
