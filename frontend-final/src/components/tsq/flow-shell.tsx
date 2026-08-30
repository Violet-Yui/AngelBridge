"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, HelpCircle, Leaf } from "lucide-react";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import { getPetVisual } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { TabBar } from "@/components/tsq/tab-bar";

export function XiaotianAvatar({ size = 48 }: { size?: number }) {
  const appliedPet = usePetStore((s) => s.appliedPet);
  const appliedPetName = usePetStore((s) => s.appliedPetName);
  const visual = getPetVisual(appliedPet);

  return (
    <span className="relative inline-grid" style={{ width: size, height: size }}>
      <span className="grid place-items-center overflow-hidden rounded-full border border-white bg-white shadow-[0_8px_18px_rgba(55,95,42,.14)]" style={{ width: size, height: size }}>
        {visual.type === "image" ? (
          <Image src={visual.src} alt={appliedPetName} width={size} height={size} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[1.7rem] leading-none" aria-label={appliedPetName}>{visual.emoji}</span>
        )}
      </span>
      <span className="absolute -right-1 -top-1 rounded-full bg-[color:var(--deep)] px-1 py-0.5 text-[8px] font-bold leading-none text-white">AI</span>
    </span>
  );
}

export function FlowShell({
  title,
  subtitle,
  children,
  right = "bell",
  onHelp,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: "bell" | "help" | "none";
  onHelp?: () => void;
}) {
  const router = useRouter();
  return (
    <main className="tsq-app-frame relative mx-auto h-dvh overflow-y-auto overflow-x-hidden bg-[color:var(--bg-canvas)] text-[#071D3A] overscroll-contain [-webkit-overflow-scrolling:touch]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[245px] bg-gradient-to-b from-[#dff7ff] via-[#f3fbef] to-[color:var(--bg-canvas)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[95px] h-[150px] opacity-80">
        <div className="absolute left-[-20px] right-[-20px] top-20 h-28 rounded-[50%] bg-[#d9edc2]" />
        <div className="absolute left-1/2 top-10 h-16 w-44 -translate-x-1/2 rounded-t-full border-[10px] border-[#d8b98e] border-b-0 opacity-75" />
        <Leaf className="absolute left-4 top-3 h-8 w-8 rotate-[-28deg] text-[#72b957]" />
        <Leaf className="absolute right-7 top-28 h-9 w-9 rotate-12 text-[#8bc86a]" />
        <div className="absolute bottom-0 left-0 h-16 w-28 rounded-tr-full bg-[#b9de8d]/70" />
        <div className="absolute bottom-0 right-0 h-16 w-28 rounded-tl-full bg-[#b9de8d]/70" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col" style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))", paddingBottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 104px)" }}>
        <header data-el="flow-header" className="tsq-page-pad shrink-0 pb-4">
          <div className="flex h-9 items-center justify-between">
            <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-[#071D3A] active:scale-95">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-[13px] font-medium text-[#33506f]">{subtitle}</p>}
            </div>
            {right === "none" ? <span className="h-9 w-9" /> : (
              <button onClick={right === "help" ? onHelp : undefined} className="relative grid h-9 w-9 place-items-center rounded-full bg-white/60 active:scale-95">
                {right === "help" ? <HelpCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </button>
            )}
          </div>
        </header>
        <div className="tsq-page-pad relative z-10 flex-1 pb-4">{children}</div>
      </div>
      <TabBar />
    </main>
  );
}
