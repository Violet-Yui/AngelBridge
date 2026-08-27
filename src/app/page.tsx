"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/tsq/app-shell";
import { TopNav } from "@/components/tsq/top-nav";
import { LifeTreeHero } from "@/components/tsq/life-tree-hero";
import { HomeSections } from "@/components/tsq/home-sections";
import { tsqApi, type HomeOverview } from "@/lib/tsq/api";
import { useTranslation } from "react-i18next";

// 人生树首页（天使桥）· 茂盛盛放版
export default function HomePage() {
  const { t } = useTranslation();
  const [home, setHome] = useState<HomeOverview | null>(null);
  const [error, setError] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const loadHome = useCallback(() => {
    setHome(null);
    setError(false);
    setLoadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    tsqApi.getHome()
      .then((nextHome) => {
        if (!active) return;
        setHome(nextHome);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [loadKey]);

  return (
    <AppShell bare>
      <div
        className="relative"
        style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}
      >
        <TopNav activeChannel="人生树" onCanvas showLang />
        {home ? (
          <>
            <LifeTreeHero profile={home.profile} />
            <HomeSections matches={home.matches} initialTodos={home.todos} />
          </>
        ) : error ? (
          <div data-el="home-load-error" className="px-4 pt-12 text-center">
            <p className="text-sm text-muted-foreground">{t("errors.generic.description")}</p>
            <button
              type="button"
              data-el="home-load-retry"
              onClick={loadHome}
              className="mt-4 rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white active:scale-95"
            >
              {t("errors.generic.tryAgain")}
            </button>
          </div>
        ) : (
          <HomeLoading loadingLabel={t("common.loading")} />
        )}
      </div>
    </AppShell>
  );
}

function HomeLoading({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div data-el="home-loading" aria-label={loadingLabel} className="animate-pulse">
      <div className="h-[74vh] bg-muted/60" />
      <div className="relative z-[1] -mt-48 px-4">
        <div className="h-52 rounded-[32px] bg-muted" />
      </div>
      <div className="space-y-6 px-4 pt-8">
        <div className="h-28 rounded-[22px] bg-muted" />
        <div className="h-40 rounded-[22px] bg-muted" />
        <div className="h-64 rounded-[22px] bg-muted" />
      </div>
    </div>
  );
}
