"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft, HelpCircle, Home, Leaf, TreePine, HeartHandshake } from "lucide-react";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import { cn } from "@/utils/utils";

export function XiaotianAvatar({ size = 48 }: { size?: number }) {
  return (
    <span className="grid place-items-center overflow-hidden rounded-full border border-white bg-white shadow-[0_8px_18px_rgba(55,95,42,.14)]" style={{ width: size, height: size }}>
      <Image src={TSQ_ASSETS.pet} alt="小天" width={size} height={size} className="h-full w-full object-cover" />
    </span>
  );
}

export function FlowShell({
  title,
  subtitle,
  children,
  right = "bell",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: "bell" | "help" | "none";
}) {
  const router = useRouter();
  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[color:var(--bg-canvas)] text-[#071D3A]">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[245px] bg-gradient-to-b from-[#dff7ff] via-[#f3fbef] to-[color:var(--bg-canvas)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[95px] h-[150px] opacity-80">
        <div className="absolute left-[-20px] right-[-20px] top-20 h-28 rounded-[50%] bg-[#d9edc2]" />
        <div className="absolute left-1/2 top-10 h-16 w-44 -translate-x-1/2 rounded-t-full border-[10px] border-[#d8b98e] border-b-0 opacity-75" />
        <Leaf className="absolute left-4 top-3 h-8 w-8 rotate-[-28deg] text-[#72b957]" />
        <Leaf className="absolute right-7 top-28 h-9 w-9 rotate-12 text-[#8bc86a]" />
        <div className="absolute bottom-0 left-0 h-16 w-28 rounded-tr-full bg-[#b9de8d]/70" />
        <div className="absolute bottom-0 right-0 h-16 w-28 rounded-tl-full bg-[#b9de8d]/70" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col" style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))", paddingBottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 76px)" }}>
        <header data-el="flow-header" className="px-4 pb-4">
          <div className="flex h-9 items-center justify-between">
            <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-[#071D3A] active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-[13px] font-medium text-[#33506f]">{subtitle}</p>}
            </div>
            {right === "none" ? <span className="h-9 w-9" /> : (
              <button className="relative grid h-9 w-9 place-items-center rounded-full bg-white/60 active:scale-95">
                {right === "help" ? <HelpCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                {right === "bell" && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />}
              </button>
            )}
          </div>
        </header>
        <div className="relative z-10 flex-1 px-4">{children}</div>
      </div>
      <FlowTabBar />
    </main>
  );
}

function FlowTabBar() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "此刻", icon: Home },
    { href: "/", label: "生命树", icon: TreePine },
    { href: "/bridge", label: "我的桥", icon: HeartHandshake },
    { href: "/xiaotian/chat", label: "小天", icon: null },
  ];
  return (
    <nav data-el="flow-tabbar" className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 rounded-t-[26px] border border-[color:var(--border)] bg-white/95 px-5 pt-2 shadow-[0_-8px_26px_rgba(55,95,42,.08)] backdrop-blur-xl" style={{ height: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 66px)", paddingBottom: "max(34px, env(safe-area-inset-bottom, 0px))" }}>
      {items.map((item) => {
        const active = item.href !== "/" && pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={cn("grid place-items-center text-[12px] leading-none", active ? "text-[#2679ff] font-semibold" : "text-[#4d5666]")}>
            {Icon ? <Icon className="h-6 w-6" /> : <XiaotianAvatar size={28} />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
