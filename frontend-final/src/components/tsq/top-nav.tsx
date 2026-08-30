"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { CHANNELS } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

const CHANNEL_HREF: Record<string, string> = {
  人生树: "/",
  找人: "/discover",
  找物: "/things",
  找工作: "/jobs",
  闲置: "/idle",
  经验: "/experience",
};

// 顶部一级导航（关注/此刻）+ 二级频道横滑
export function TopNav({
  activeChannel,
  onCanvas = false,
  showLang = false,
  primaryActive = "now",
  compactChannels = false,
}: {
  activeChannel: string;
  onCanvas?: boolean; // true 时置于沉浸式背景上，文字更深
  showLang?: boolean;
  primaryActive?: "follow" | "now";
  compactChannels?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <header data-el="top-nav" className="tsq-page-pad relative z-10 pb-2">
      {showLang && (
        <div className="absolute right-[var(--page-gutter)] top-0 z-10">
          <LanguageSwitcher />
        </div>
      )}
      <nav className="flex h-[34px] items-center justify-center gap-10 text-[18px]">
        <Link href="/follow" className={cn("relative", primaryActive === "follow" ? "font-bold text-[color:var(--text)]" : onCanvas ? "text-neutral-600" : "text-neutral-500")}>
          {t("tsq.nav.follow")}
          {primaryActive === "follow" && (
            <span className="absolute -bottom-2 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[color:var(--primary)]" />
          )}
        </Link>
        <Link href="/" className={cn("relative", primaryActive === "now" ? "font-bold text-[color:var(--text)]" : onCanvas ? "text-neutral-600" : "text-neutral-500")}>
          {t("tsq.nav.now")}
          {primaryActive === "now" && (
            <span className="absolute -bottom-2 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[color:var(--primary)]" />
          )}
        </Link>
      </nav>
      {!compactChannels && (
        <div className="tsq-noscroll mt-[22px] flex gap-6 overflow-x-auto whitespace-nowrap text-[16px]">
        {CHANNELS.map((ch) => {
          const active = ch === activeChannel;
          const href = CHANNEL_HREF[ch] ?? "/discover";
          return (
            <Link
              key={ch}
              href={href}
              data-el={`channel-${ch}`}
              className={cn(
                "relative shrink-0 pb-1",
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
      )}
    </header>
  );
}
