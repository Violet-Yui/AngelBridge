"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HOME_MATCHES, type Match } from "@/lib/tsq/data";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import type { MatchView, PublicationDetail } from "@/lib/angelbridge-types";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/utils/utils";
import { getPublicationVisual } from "@/lib/tsq/publication-visual";

const KIND_STYLE: Record<string, string> = {
  green: "text-[#2f6f2b] before:bg-[#80bd45]",
  warm: "text-[#8b6a1f] before:bg-[#e2ad3f]",
  purple: "text-[#6651a8] before:bg-[#9a87dc]",
};

export function HomeSections() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dashboard } = useDashboard();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    let active = true;
    const recommendations = dashboard?.recommendations ?? [];
    if (recommendations.length === 0 && isMatureShowcaseSession()) {
      Promise.resolve().then(() => {
        if (active) setMatches(HOME_MATCHES);
      });
      return () => { active = false; };
    }
    Promise.all(recommendations.map(async (match, index) => {
      let publication: PublicationDetail | null = null;
      if (match.counterpartPublicationId) {
        try {
          publication = await angelbridgeApi.getPublication(match.counterpartPublicationId);
        } catch (error) {
          console.error("读取匹配帖子失败", error);
        }
      }
      return toMatchCard(match, publication, index);
    })).then((cards) => {
      if (active) setMatches(cards);
    });
    return () => { active = false; };
  }, [dashboard?.recommendations]);


  return (
    <div className="tsq-page-pad relative z-[4] -mt-8">
      <div className="mb-2.5 flex items-center justify-between gap-3 px-0.5 text-[12px] font-bold">
        <Link href="/growth" className="relative shrink-0 rounded-full bg-white/52 px-3.5 py-1.5 pr-8 text-[#1f6f3a] shadow-[0_8px_22px_rgba(70,104,43,0.12)] ring-1 ring-white/70 backdrop-blur-sm active:scale-95">
          成长分：{dashboard?.account.growthScore ?? 100}
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#ffcf48] to-[#ff7b2f] text-[11px] shadow-[0_4px_10px_rgba(255,123,47,.28)] ring-2 ring-white">
            ✨
          </span>
        </Link>
        <span className="shrink-0 rounded-full bg-white/38 px-3.5 py-1.5 text-[#1d1d1b] shadow-[0_6px_18px_rgba(70,104,43,0.08)] ring-1 ring-white/55 backdrop-blur-sm">
          {(dashboard?.account.growthScore ?? 100) < 500 ? "青苗期：探索阶段" : "壮年期：扎根积累"}
        </span>
      </div>
      {/* 三色资源入口（可点击弹窗） */}
      <div
        data-el="home-stats"
        className="tsq-card-gap grid grid-cols-3"
      >
        <StatCell kind="green" value={dashboard?.lifeTree?.offers.filter((tag) => tag.visible).length ?? 0} title={t("tsq.home.own")} onClick={() => router.push("/tree/edit?focus=have")} />
        <StatCell kind="warm" value={dashboard?.lifeTree?.needs.filter((tag) => tag.visible).length ?? 0} title={t("tsq.home.wish")} onClick={() => router.push("/tree/edit?focus=want")} />
        <StatCell kind="purple" value={dashboard?.lifeTree?.explorations.length ?? 0} title="成长探索" onClick={() => router.push("/tree/edit?focus=explore")} />
      </div>

      <SectionTitle title={t("tsq.home.matchTitle")} href="/discover" cta={t("tsq.home.seeAll")} />
      <div className="tsq-noscroll tsq-bleed-x flex snap-x snap-mandatory gap-[var(--card-gap)] overflow-x-auto pb-2">
        {matches.map((m) => (
          <MatchCard key={m.id} m={m} interestedLabel={t("tsq.home.alsoInterested")} />
        ))}
      </div>


    </div>
  );
}

function toMatchCard(match: MatchView, publication: PublicationDetail | null, index: number): Match {
  const image = publication?.images[0]?.url ?? (publication ? "/brand/home-logo.png" : "");
  const visual = publication ? getPublicationVisual(publication) : null;
  const kinds: Match["kind"][] = ["green", "warm", "purple"];
  return {
    id: match.matchId,
    kind: visual?.kind ?? kinds[index % kinds.length],
    tag: match.primaryPattern ?? "匹配机会",
    scoreRange: `${Math.round(match.bridgeIndex)}%`,
    image,
    visualEmoji: visual?.emoji ?? "🤝",
    title: match.counterpartPublicationTitle ?? match.counterpartDisplayName,
    reason: match.matchReasons[0]?.text ?? match.valueToYou[0] ?? "双方需求与资源具有连接价值",
    interested: 0,
  };
}


function StatCell({
  kind,
  value,
  title,
  onClick,
}: {
  kind: string;
  value: number;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[clamp(16px,4.8vw,22px)] bg-white/58 px-1.5 py-[clamp(10px,3.4vw,15px)] text-center shadow-[0_8px_20px_rgba(63,94,40,0.08)] ring-1 ring-white/70 backdrop-blur-sm transition-transform before:absolute before:inset-x-4 before:top-0 before:h-[3px] before:rounded-full active:scale-95",
        KIND_STYLE[kind],
      )}
    >
      <span className="block truncate text-[clamp(12px,3.3vw,14px)] font-black leading-none tracking-[0.08em] text-[#24321f]">{title}</span>
      <strong className="mt-2.5 block text-[clamp(21px,6.2vw,27px)] font-black leading-none tracking-[-0.04em]">{value}</strong>
    </button>
  );
}

function SectionTitle({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between gap-2">
      <h2 className="min-w-0 truncate text-[19px] font-semibold leading-tight">{title}</h2>
      <Link href={href} className="shrink-0 text-sm text-[color:var(--deep)]">{cta} ›</Link>
    </div>
  );
}

function MatchCard({ m, interestedLabel }: { m: Match; interestedLabel: string }) {
  return (
    <Link href={`/xiaotian/recommend/${m.id}`} data-el="home-match-card" className="flex min-h-[clamp(198px,54vw,238px)] w-[clamp(250px,72%,340px)] shrink-0 snap-start flex-col overflow-hidden rounded-[clamp(22px,6vw,28px)] border border-[color:var(--border)] bg-white shadow-[0_12px_28px_rgba(55,95,42,0.10)] transition active:scale-[0.98]">
      <div className="relative h-[clamp(124px,34vw,154px)] w-full overflow-hidden bg-[color:var(--soft)]">
        {m.image ? <Image src={m.image} alt={m.title} fill sizes="(max-width: 480px) 72vw, 340px" className="object-cover object-top" /> : <span className="grid h-full w-full place-items-center text-7xl opacity-90" aria-hidden>{m.visualEmoji ?? "🤝"}</span>}
        <span className={cn("absolute left-2 top-2 inline-block rounded-full px-2 py-1 text-[11px] font-semibold shadow-sm", KIND_STYLE[m.kind])}>{m.tag}</span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <strong className="text-[19px] leading-none text-[color:var(--deep)]">{m.scoreRange}</strong>
        <p className="mt-1.5 line-clamp-2 text-[14px] font-bold leading-snug text-neutral-800">{m.title}</p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{m.reason}</p>
        <p className="mt-auto pt-2 text-[11px] text-muted-foreground">{m.interested} {interestedLabel}</p>
      </div>
    </Link>
  );
}
