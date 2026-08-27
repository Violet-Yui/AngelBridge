"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { TreePine, MessageCircle, Plus, HeartHandshake, User } from "lucide-react";
import { isTabActive } from "@/lib/tsq/navigation";
import { cn } from "@/utils/utils";

type TabDef = {
  href: string;
  key: string;
  icon: typeof TreePine;
  center?: boolean;
};

const TABS: TabDef[] = [
  { href: "/", key: "home", icon: TreePine },
  { href: "/messages", key: "messages", icon: MessageCircle },
  { href: "/create", key: "create", icon: Plus, center: true },
  { href: "/bridge", key: "bridge", icon: HeartHandshake },
  { href: "/me", key: "me", icon: User },
];

// 固定底部五 Tab 导航
export function TabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      data-el="tab-bar"
      className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 gap-0.5 border-t border-[color:var(--border)] bg-white/95 px-5 pt-2 backdrop-blur-xl"
      style={{
        height: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 66px)",
        paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab.href);
        const Icon = tab.icon;
        const label = t(`tsq.tabs.${tab.key}`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-el={`nav-${tab.key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-start gap-0.5 text-[12px] leading-none outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2",
              active ? "font-medium text-[color:var(--deep)]" : "text-neutral-500",
            )}
          >
            {tab.center ? (
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-b from-[#6cc653] to-[#48a63e] text-white shadow-[0_8px_18px_rgba(88,169,66,0.32)]">
                <Icon className="h-6 w-6" strokeWidth={2.4} />
              </span>
            ) : (
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-2xl transition-colors",
                  active && "bg-[color:var(--soft)]",
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
              </span>
            )}
            <span className={cn(tab.center && "mt-0.5")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
