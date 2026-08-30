import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import { LifeTreeHero } from "@/components/tsq/life-tree-hero";
import { HomeSections } from "@/components/tsq/home-sections";
import AuthGate from "@/components/auth/AuthGate";

// 人生树首页（天使桥）· 茂盛盛放版
export default function HomePage() {
  return (
    <AuthGate>
      <AppShell bare>
        <div className="relative">
          {/* 顶部导航浮在生命树之上，让树背景直达屏幕顶部、露出主干 */}
          <div
            className="absolute inset-x-0 top-0 z-20"
            style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}
          >
            <TopNav activeChannel="人生树" onCanvas showLang />
          </div>
          <LifeTreeHero />
          <HomeSections />
        </div>
      </AppShell>
    </AuthGate>
  );
}
