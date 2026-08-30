"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Heart, SlidersHorizontal, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import {
  DISCOVER_CARDS,
  DISCOVER_FILTERS,
  badgeOf,
  type PersonCard,
  type DiscoverFilter,
} from "@/lib/tsq/data";
import { cn } from "@/utils/utils";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import { getPublicationVisual } from "@/lib/tsq/publication-visual";
import type { PublicationDetail } from "@/lib/angelbridge-types";

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
  const [cards, setCards] = useState<PersonCard[]>(() => isMatureShowcaseSession() ? DISCOVER_CARDS : []);

  useEffect(() => {
    if (isMatureShowcaseSession()) return;
    let activeRequest = true;
    angelbridgeApi.getDiscoverPublications().then((publications) => {
      if (activeRequest) setCards(publications.map(toPersonCard));
    }).catch((error) => console.error("读取公开帖子失败", error));
    return () => { activeRequest = false; };
  }, []);

  // 按顶部标签栏筛选：全部/更多 显示所有；其余按帖子归属分类过滤
  const filtered = useMemo(() => {
    if (active === "全部" || active === "更多") return cards;
    return cards.filter((c) => c.category === active);
  }, [active, cards]);

  // 瀑布流：奇偶列
  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 === 1);

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
      {filtered.length === 0 ? (
        <div className="mt-16 px-4 text-center text-sm text-muted-foreground">
          该分类下暂时还没有帖子，换个标签看看吧～
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          <div className="flex min-w-0 flex-col gap-3">
            {left.map((c) => (
              <FeedCard key={c.id} card={c} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            {right.map((c) => (
              <FeedCard key={c.id} card={c} />
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function toPersonCard(publication: PublicationDetail, index: number): PersonCard {
  const visual = getPublicationVisual(publication);
  return {
    id: publication.publicationId,
    kind: visual.kind,
    category: "合作伙伴" as PersonCard["category"],
    title: publication.title,
    desc: publication.content,
    place: publication.locationLabel,
    author: publication.author.displayName,
    authorHandle: publication.author.accountId,
    authorBio: publication.author.stageLabel ?? publication.authorBio,
    likes: 0,
    favorites: 0,
    tall: index % 2 === 0,
    emoji: visual.emoji,
    image: publication.images[0]?.url,
    time: publication.publishedAt ? new Date(publication.publishedAt).toLocaleDateString("zh-CN") : "刚刚",
    comments: [],
  };
}

function FeedCard({ card }: { card: PersonCard }) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  return (
    <Link
      href={`/discover/${card.id}`}
      data-el="discover-card"
      className="block overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-white shadow-[0_8px_20px_rgba(55,95,42,0.06)] active:scale-[0.99]"
    >
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br",
          COVER_STYLE[card.kind],
          card.tall ? "h-44" : "h-32",
        )}
      >
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl opacity-90" aria-hidden>
            {card.emoji}
          </span>
        )}
        {/* 左上角标签 = 归属的顶部分类 */}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm",
            BADGE_STYLE[card.kind],
          )}
        >
          {badgeOf(card)}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">{card.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {card.desc}
        </p>
        <p className="mt-2 truncate text-[12px] text-neutral-500">{card.place}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-neutral-600">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[11px]">
              {card.author.slice(0, 1)}
            </span>
            <span className="truncate">{card.author}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2 text-neutral-500">
            <span className="flex items-center gap-0.5 text-[12px]">
              <MessageCircle className="h-3.5 w-3.5" />
              {card.comments.length}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                setLiked((v) => !v);
              }}
              aria-label={t("tsq.discover.like")}
              className="-m-1 flex items-center gap-1 p-1 text-[13px] active:scale-90"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  liked && "fill-[color:var(--warm)] text-[color:var(--warm)]",
                )}
              />
              {card.likes + (liked ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
