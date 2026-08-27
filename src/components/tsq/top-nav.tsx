"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { CHANNELS } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

const CHANNEL_HREF: Record<string, string> = {
  人生树: "/",
  找人: "/discover",
};

// 顶部一级导航（关注/此刻）+ 二级频道横滑
export function TopNav({
  activeChannel,
  onCanvas = false,
  showLang = false,
}: {
  activeChannel: string;
  onCanvas?: boolean; // true 时置于沉浸式背景上，文字更深
  showLang?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <header data-el="top-nav" className="relative z-10 px-4 pb-2">
      {showLang && (
        <div className="absolute right-4 top-0 z-10">
          <LanguageSwitcher />
        </div>
      )}
      <nav className="flex h-[34px] items-center justify-center gap-10 pr-24 text-[18px]">
        <span className={cn(onCanvas ? "text-neutral-600" : "text-neutral-500")}>
          {t("tsq.nav.follow")}
        </span>
        <span className="relative font-bold text-[color:var(--text)]">
          {t("tsq.nav.now")}
          <span className="absolute -bottom-2 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[color:var(--primary)]" />
        </span>
      </nav>
      <div className="relative -mx-4 mt-[22px]">
        <div
          data-el="channel-nav"
          className="tsq-noscroll flex snap-x gap-6 overflow-x-auto scroll-px-4 px-4 pr-10 whitespace-nowrap text-[16px]"
        >
          {CHANNELS.map((ch) => {
            const active = ch === activeChannel;
            const href = CHANNEL_HREF[ch] ?? "/discover";
            return (
              <Link
                key={ch}
                href={href}
                data-el={`channel-${ch}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative shrink-0 snap-start pb-1 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2",
                  active
                    ? "font-semibold text-[color:var(--deep)]"
                    : "text-neutral-700",
                )}
              >
                {ch}
                {active && (
                  <span className="absolute inset-x-1 -bottom-1 h-[3px] rounded-full bg-[color:var(--primary)]" />
                )}
              </Link>
            );
          })}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[color:var(--bg-canvas)] to-transparent"
        />
      </div>
    </header>
  );
}
