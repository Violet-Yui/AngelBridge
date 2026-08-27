"use client";

import { TabBar } from "./tab-bar";
import { Pet } from "./pet";

// 移动端应用外壳：安全区 + 底部 Tab + 常驻灵宠
export function AppShell({
  children,
  bare = false,
  topInset = "default",
}: {
  children: React.ReactNode;
  bare?: boolean; // bare=true 时用于沉浸式首页（自带背景），去掉画布底色
  topInset?: "default" | "compact" | "none";
}) {
  const paddingTop =
    bare || topInset === "none"
      ? undefined
      : topInset === "compact"
        ? "max(16px, env(safe-area-inset-top, 0px))"
        : "max(56px, env(safe-area-inset-top, 0px))";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-[color:var(--bg-canvas)] md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[32px] md:border md:border-[color:var(--border)] md:shadow-[var(--brand-shadow-md)]">
      <div
        className="relative"
        style={{
          paddingTop,
          paddingBottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 80px)",
        }}
      >
        {children}
      </div>
      <Pet />
      <TabBar />
    </div>
  );
}
