"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TreePine, MessageCircle, Plus, HeartHandshake, User } from "lucide-react";
import { cn } from "@/utils/utils";

type TabDef = { href: string; key: string; label: string; icon: typeof TreePine; center?: boolean; img?: string };

const TABS: TabDef[] = [
  { href: "/", key: "home", label: "天使桥", icon: TreePine, img: "/brand/home-logo.png" },
  { href: "/messages", key: "messages", label: "消息", icon: MessageCircle },
  { href: "/create", key: "create", label: "创建", icon: Plus, center: true },
  { href: "/bridge", key: "bridge", label: "桥约", icon: HeartHandshake },
  { href: "/me", key: "me", label: "我", icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav data-el="tab-bar" className="glass-bar tsq-app-frame fixed bottom-0 left-1/2 z-40 grid -translate-x-1/2 grid-cols-5 items-center gap-0.5 border-t px-[var(--page-gutter)]" style={{ height: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 66px)", paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))" }}>
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href} data-el={`nav-${tab.key}`} aria-label={tab.label} title={tab.label} className={cn("flex flex-col items-center justify-center gap-0.5 active:scale-95", active ? "text-[color:var(--deep)]" : "text-neutral-500")}>
            {tab.center ? <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-[#65A85A] to-[#59A950] text-white shadow-[0_8px_18px_rgba(89,169,80,0.30)]"><Icon className="h-5.5 w-5.5" strokeWidth={2.4} /></span> : tab.img ? <img src={tab.img} alt="" className={cn("h-7 w-7 rounded-xl bg-white object-cover transition-opacity", active ? "opacity-100" : "opacity-55")} aria-hidden /> : <Icon className={cn("h-5.5 w-5.5 transition-colors", active ? "fill-[color:var(--primary)] text-[color:var(--primary)]" : "fill-none text-neutral-400")} strokeWidth={active ? 1.6 : 1.8} aria-hidden />}
            <span className={cn("text-[10px] font-semibold leading-none", tab.center && "mt-0.5")}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
