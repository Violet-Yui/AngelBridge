"use client";

import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";

export default function FollowPage() {
  return (
    <AppShell bare>
      <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#f1ffe7_0%,#f7fbf1_42%,#ffffff_100%)]">
        <div className="pointer-events-none absolute -left-16 top-20 h-44 w-44 rounded-full bg-[#bdf080]/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-48 h-56 w-56 rounded-full bg-[#fff0a8]/40 blur-3xl" />
        <div className="absolute inset-x-0 top-0 z-20" style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}>
          <TopNav activeChannel="人生树" onCanvas primaryActive="follow" compactChannels />
        </div>

        <main className="relative z-10 px-4 pb-[calc(max(34px,env(safe-area-inset-bottom,0px))+92px)] pt-[132px]">
          <section className="grid grid-cols-2 gap-3" />
        </main>
      </div>
    </AppShell>
  );
}
