"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Image as ImageIcon,
  Gift,
  MapPin,
  ShieldCheck,
  Users,
  Zap,
  Star,
  Edit3,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { cn } from "@/utils/utils";

type Tone = "blue" | "green" | "warm" | "purple";
type Item = { id: string; title: string; desc?: string };
type Block = {
  no: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  items: Item[];
};

const toneMap: Record<Tone, string> = {
  blue: "border-[#b8d8ff] bg-white text-[#2679ff]",
  green: "border-[#bde7cb] bg-white text-[#23a56f]",
  warm: "border-[#f3d59a] bg-white text-[#f2a93b]",
  purple: "border-[#d6c9f6] bg-white text-[color:var(--purple)]",
};
const badgeMap: Record<Tone, string> = {
  blue: "bg-[#e8f2ff] text-[#2679ff]",
  green: "bg-[#e5f6ec] text-[#23a56f]",
  warm: "bg-[#fdf1de] text-[#f2a93b]",
  purple: "bg-[#efe9fb] text-[color:var(--purple)]",
};

const INITIAL: Block[] = [
  {
    no: 1, title: "我能提供 Offer", subtitle: "你的可交换资源", icon: CalendarDays, tone: "blue",
    items: [{ id: "b1-1", title: "周末工作室", desc: "可用时间：周六 - 周日 10:00 - 18:00" }],
  },
  {
    no: 2, title: "我需要 Need", subtitle: "你想获得的资源", icon: ImageIcon, tone: "green",
    items: [{ id: "b2-1", title: "一组品牌照片 / 基础修图" }],
  },
  {
    no: 3, title: "交换方式 Exchange", subtitle: "优先互换，可视情况补差价", icon: Gift, tone: "warm",
    items: [{ id: "b3-1", title: "优先互换" }, { id: "b3-2", title: "可补差价" }],
  },
  {
    no: 4, title: "条件 Constraints", subtitle: "匹配边界", icon: MapPin, tone: "purple",
    items: [
      { id: "b4-1", title: "地点：温州龙湾" },
      { id: "b4-2", title: "人数：1-3 人" },
      { id: "b4-3", title: "适合拍摄品牌照" },
    ],
  },
  {
    no: 5, title: "边界 Boundary", subtitle: "隐私与开放范围", icon: ShieldCheck, tone: "warm",
    items: [
      { id: "b5-1", title: "匹配阶段仅展示区域" },
      { id: "b5-2", title: "双方确认后开放联系方式" },
    ],
  },
];

const itemIconMap: Record<Tone, LucideIcon> = {
  blue: CalendarDays, green: ImageIcon, warm: Zap, purple: Users,
};

export function IntentScreen() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(INITIAL);
  const [editing, setEditing] = useState<{ blockNo: number; item: Item } | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  function openEditor(blockNo: number, item: Item) {
    setEditing({ blockNo, item });
    setDraftTitle(item.title);
    setDraftDesc(item.desc ?? "");
  }
  function addItem(blockNo: number) {
    const item: Item = { id: `new-${Date.now()}`, title: "" };
    openEditor(blockNo, item);
  }
  function removeItem(blockNo: number, id: string) {
    setBlocks((bs) =>
      bs.map((b) => (b.no === blockNo ? { ...b, items: b.items.filter((i) => i.id !== id) } : b)),
    );
  }
  function saveEditor() {
    if (!editing) return;
    const t = draftTitle.trim();
    if (!t) { setEditing(null); return; }
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.no !== editing.blockNo) return b;
        const exists = b.items.some((i) => i.id === editing.item.id);
        const next: Item = { id: editing.item.id, title: t, desc: draftDesc.trim() || undefined };
        return {
          ...b,
          items: exists ? b.items.map((i) => (i.id === next.id ? next : i)) : [...b.items, next],
        };
      }),
    );
    setEditing(null);
  }

  return (
    <FlowShell title="意图确认" subtitle="确认信息后，小天会去帮你搭桥 🌱" right="bell">
      <div className="mb-3 flex items-end gap-3">
        <XiaotianAvatar size={64} />
        <div className="mb-2 rounded-2xl rounded-bl-sm bg-white/85 px-3 py-2 text-[13px] text-[#243b5a] shadow-sm">
          我把你的想法拆成 5 块，可逐项修改。
        </div>
      </div>

      <div data-el="intent-blocks" className="space-y-3">
        {blocks.map((block) => {
          const ItemIcon = itemIconMap[block.tone];
          return (
            <section
              key={block.no}
              className="rounded-[22px] border border-[color:var(--border)] bg-white/90 p-3.5 shadow-[var(--brand-shadow-sm)] backdrop-blur"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-full text-[15px] font-bold", badgeMap[block.tone])}>
                    {block.no}
                  </span>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#071D3A]">{block.title}</h2>
                    <p className="text-[12px] text-[#58708c]">{block.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => addItem(block.no)}
                  aria-label="新增一项"
                  className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--deep)] active:scale-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {block.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn("flex items-center gap-2 rounded-2xl border px-3 py-2.5", toneMap[block.tone])}
                  >
                    <ItemIcon className="h-4 w-4 shrink-0" />
                    <button
                      onClick={() => openEditor(block.no, item)}
                      className="min-w-0 flex-1 text-left active:opacity-70"
                    >
                      <b className="block truncate text-[14px] text-[#071D3A]">{item.title}</b>
                      {item.desc && <p className="truncate text-[12px] text-[#58708c]">{item.desc}</p>}
                    </button>
                    <Edit3 className="h-4 w-4 shrink-0 opacity-60" />
                    {block.items.length > 1 && (
                      <button
                        onClick={() => removeItem(block.no, item.id)}
                        aria-label="删除"
                        className="shrink-0 text-[#c0392b]/70 active:scale-90"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <button
        onClick={() => router.push("/xiaotian/bridging")}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] py-3.5 text-[15px] font-bold text-white shadow-[0_12px_26px_rgba(88,169,66,.26)] active:scale-[.98]"
      >
        <Sparkles className="h-4 w-4" /> 确认，交给小天搭桥
      </button>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="w-full max-w-[430px] rounded-t-[24px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-bold">编辑内容</h3>
              <button onClick={() => setEditing(null)} aria-label="关闭"><X className="h-5 w-5" /></button>
            </div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[color:var(--deep)]">标题</label>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="填写内容"
              className="mb-4 w-full rounded-xl border border-[color:var(--border)] px-3.5 py-2.5 text-[15px] outline-none focus:border-[color:var(--primary)]"
            />
            <label className="mb-1.5 block text-[13px] font-semibold text-[color:var(--deep)]">补充说明（可选）</label>
            <textarea
              rows={2}
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              className="mb-5 w-full resize-none rounded-xl border border-[color:var(--border)] px-3.5 py-2.5 text-[14px] outline-none focus:border-[color:var(--primary)]"
            />
            <button
              onClick={saveEditor}
              className="w-full rounded-full bg-[color:var(--primary)] py-3 text-[15px] font-bold text-white active:scale-[.98]"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </FlowShell>
  );
}
