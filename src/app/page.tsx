import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import { LifeTreeHero } from "@/components/tsq/life-tree-hero";
import { HomeSections } from "@/components/tsq/home-sections";

// 人生树首页（天使桥）· 茂盛盛放版
export default function HomePage() {
  return (
    <AppShell bare>
      <div
        className="relative"
        style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}
      >
        <TopNav activeChannel="人生树" onCanvas showLang />
        <LifeTreeHero />
        <HomeSections />
      </div>
    </AppShell>
  );
}
