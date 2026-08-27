"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Heart, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import {
  DISCOVER_CARDS,
  DISCOVER_FILTERS,
  type PersonCard,
  type DiscoverFilter,
} from "@/lib/tsq/data";
import { cn } from "@/utils/utils";
import Link from "next/link";

const BADGE_STYLE: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

const COVER_STYLE: Record<string, string> = {
  green: "from-[#eaf6e5] to-[#dcefd2]",
  warm: "from-[#fff5df] to-[#ffe9c2]",
  purple: "from-[#f0ebfd] to-[#e5dcfa]",
};

export default function DiscoverPage() {
  const [active, setActive] = useState<DiscoverFilter>("全部");

  // 瀑布流：奇偶列
  const left = DISCOVER_CARDS.filter((_, i) => i % 2 === 0);
  const right = DISCOVER_CARDS.filter((_, i) => i % 2 === 1);

  return (
    <AppShell>
      <TopNav activeChannel="找人" />

      {/* 筛选条 */}
      <div className="tsq-noscroll mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        {DISCOVER_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            data-el={`discover-filter-${f}`}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm active:scale-95",
              active === f
                ? "bg-[color:var(--soft)] font-semibold text-[color:var(--deep)]"
                : "bg-white text-neutral-600 border border-[color:var(--border)]",
            )}
          >
            {f}
          </button>
        ))}
        <button className="ml-auto shrink-0 rounded-full border border-[color:var(--border)] bg-white p-2 text-neutral-500">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 双列瀑布流 */}
      <div className="mt-3 grid grid-cols-2 gap-3 px-4">
        <div className="flex flex-col gap-3">
          {left.map((c) => (
            <FeedCard key={c.id} card={c} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {right.map((c) => (
            <FeedCard key={c.id} card={c} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function FeedCard({ card }: { card: PersonCard }) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const openMsg = t("tsq.discover.openCard");
  return (
    <Link href={`/discover/${card.id}`}>
    <article
      data-el="discover-card"
      onClick={() => toast(openMsg, { description: card.title })}
      className="overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-white shadow-[0_8px_20px_rgba(55,95,42,0.06)] active:scale-[0.99]"
    >
      <div
        className={cn(
          "relative grid place-items-center bg-gradient-to-br",
          COVER_STYLE[card.kind],
          card.tall ? "h-40" : "h-28",
        )}
      >
        <span className="text-5xl opacity-90" aria-hidden>
          {card.emoji}
        </span>
        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[12px] font-medium",
            BADGE_STYLE[card.kind],
          )}
        >
          {card.badge}
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-[15px] font-semibold leading-snug">{card.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {card.desc}
        </p>
        <p className="mt-2 text-[12px] text-neutral-500">{card.place}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] text-neutral-600">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--soft)] text-[11px]">
              {card.author.slice(0, 1)}
            </span>
            {card.author}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked((v) => !v);
            }}
            className="flex items-center gap-1 text-[13px] text-neutral-500 active:scale-90"
          >
            <Heart
              className={cn("h-4 w-4", liked && "fill-[color:var(--warm)] text-[color:var(--warm)]")}
            />
            {card.likes + (liked ? 1 : 0)}
          </button>
        </div>
      </div>
    </article>
    </Link>
  );
}
