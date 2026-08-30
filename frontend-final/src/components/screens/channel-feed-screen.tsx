"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import {
  itemsByChannel,
  CHANNEL_FILTERS,
  CHANNEL_META,
  type ChannelKey,
  type FeedItem,
} from "@/lib/tsq/channels";
import { cn } from "@/utils/utils";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";

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

// 四大频道统一使用双列大图瀑布流（与「找人」一致）
const LAYOUT: Record<ChannelKey, "masonry" | "list"> = {
  thing: "masonry",
  idle: "masonry",
  job: "masonry",
  exp: "masonry",
};

export function ChannelFeedScreen({
  channel,
  activeChannel,
}: {
  channel: ChannelKey;
  activeChannel: string;
}) {
  const filters = CHANNEL_FILTERS[channel];
  const [active, setActive] = useState<string>(filters[0]);
  const all = useMemo(() => isMatureShowcaseSession() ? itemsByChannel(channel) : [], [channel]);

  const filtered = useMemo(() => {
    if (active === "全部" || active === "更多") return all;
    return all.filter((i) => i.category === active);
  }, [all, active]);

  const layout = LAYOUT[channel];
  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 === 1);

  return (
    <AppShell>
      <TopNav activeChannel={activeChannel} />

      {/* 筛选条 */}
      <div className="tsq-noscroll mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            data-el={`channel-filter-${f}`}
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

      {filtered.length === 0 ? (
        <div className="mt-16 px-4 text-center text-sm text-muted-foreground">
          {CHANNEL_META[channel].placeholder}
        </div>
      ) : layout === "masonry" ? (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          <div className="flex min-w-0 flex-col gap-3">
            {left.map((it) => (
              <MasonryCard key={it.id} item={it} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            {right.map((it) => (
              <MasonryCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 px-4">
          {filtered.map((it) => (
            <ListCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Stats({ item }: { item: FeedItem }) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-neutral-500">
      <span className="flex items-center gap-0.5 text-[12px]">
        <MessageCircle className="h-3.5 w-3.5" />
        {item.comments.length}
      </span>
      <span className="flex items-center gap-0.5 text-[12px]">
        <Heart className="h-3.5 w-3.5" />
        {item.likes}
      </span>
    </div>
  );
}

function MasonryCard({ item }: { item: FeedItem }) {
  return (
    <Link
      href={`/channel/${item.id}`}
      data-el="channel-card"
      className="block overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-white shadow-[0_8px_20px_rgba(55,95,42,0.06)] active:scale-[0.99]"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br",
          COVER_STYLE[item.kind],
          item.tall ? "h-40" : "h-28",
        )}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl opacity-90" aria-hidden>
            {item.emoji}
          </span>
        )}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm",
            BADGE_STYLE[item.kind],
          )}
        >
          {item.category}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{item.title}</h3>
        {item.facts[0] && (
          <p className="mt-1.5 text-[13px] font-medium text-[color:var(--deep)]">
            {item.facts[0].value}
          </p>
        )}
        <p className="mt-2 truncate text-[12px] text-neutral-500">{item.place}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-neutral-600">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[11px]">
              {item.author.slice(0, 1)}
            </span>
            <span className="truncate">{item.author}</span>
          </span>
          <Stats item={item} />
        </div>
      </div>
    </Link>
  );
}

function ListCard({ item }: { item: FeedItem }) {
  return (
    <Link
      href={`/channel/${item.id}`}
      data-el="channel-card"
      className="flex gap-3 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-3 shadow-[var(--brand-shadow-sm)] active:scale-[0.99]"
    >
      <div
        className={cn(
          "grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-3xl",
          COVER_STYLE[item.kind],
        )}
      >
        {item.emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-semibold leading-snug">
            {item.title}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              BADGE_STYLE[item.kind],
            )}
          >
            {item.category}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {item.facts.slice(0, 2).map((f) => (
            <span
              key={f.label}
              className="rounded-md bg-[color:var(--soft)]/60 px-1.5 py-0.5 text-[11px] text-[color:var(--deep)]"
            >
              {f.value}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="truncate text-[12px] text-neutral-500">
            {item.author} · {item.place}
          </span>
          <Stats item={item} />
        </div>
      </div>
    </Link>
  );
}
