"use client";

import { TabBar } from "./tab-bar";
import { Pet } from "./pet";
import { cn } from "@/utils/utils";

// 移动端应用外壳：安全区 + 底部 Tab + 常驻灵宠
export function AppShell({
  children,
  bare = false,
  hidePet = false,
  className,
}: {
  children: React.ReactNode;
  bare?: boolean; // bare=true 时用于沉浸式首页（自带背景），去掉画布底色
  hidePet?: boolean; // hidePet=true 时隐藏常驻悬浮灵宠（如与小天的聊天页）
  className?: string; // 覆盖外壳背景（如聊天页纯白毛玻璃背景）
}) {
  return (
    <div
      className={cn(
        "tsq-app-frame relative mx-auto min-h-dvh overflow-x-hidden bg-[color:var(--bg-canvas)]",
        className,
      )}
    >
      <div
        className="relative"
        style={{
          paddingTop: bare ? undefined : "max(56px, env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 80px)",
        }}
      >
        {children}
      </div>
      {!hidePet && <Pet />}
      <TabBar />
    </div>
  );
}
