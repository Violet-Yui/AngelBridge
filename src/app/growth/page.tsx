"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Leaf } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { tsqApi } from "@/lib/tsq/api";

type GrowthLog = Awaited<ReturnType<typeof tsqApi["getGrowthLog"]>>;

export default function GrowthPage() {
  const { t } = useTranslation();
  const [growthLog, setGrowthLog] = useState<GrowthLog | null>(null);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const loadGrowthLog = useCallback(() => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(false);

    void tsqApi.getGrowthLog()
      .then(
        (nextGrowthLog) => {
          if (!isMountedRef.current || requestId !== requestIdRef.current) return;

          setGrowthLog(nextGrowthLog);
        },
        () => {
          if (!isMountedRef.current || requestId !== requestIdRef.current) return;

          setError(true);
        },
      )
      .finally(() => {
        if (!isMountedRef.current || requestId !== requestIdRef.current) return;

        inFlightRef.current = false;
        setIsLoading(false);
      });
  }, []);

  const loadInitialGrowthLog = useEffectEvent(loadGrowthLog);

  useEffect(() => {
    isMountedRef.current = true;
    const initialLoadTimer = window.setTimeout(() => {
      void loadInitialGrowthLog();
    }, 0);

    return () => {
      window.clearTimeout(initialLoadTimer);
      isMountedRef.current = false;
      requestIdRef.current += 1;
      inFlightRef.current = false;
    };
  }, []);

  const progress = growthLog && growthLog.nextLevelGrowth > 0
    ? Math.min((growthLog.growth / growthLog.nextLevelGrowth) * 100, 100)
    : 0;
  const remainingGrowth = growthLog
    ? Math.max(growthLog.nextLevelGrowth - growthLog.growth, 0)
    : 0;

  return (
    <AppShell>
      <header data-el="growth-header" className="flex items-center gap-3 px-4 pb-3 pt-2">
        <Link href="/me" aria-label="返回我的" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold">成长记录</h1>
          <p className="text-xs text-muted-foreground">每一次连接都会让生命树更茂盛</p>
        </div>
      </header>

      <div data-el="growth-page" className="space-y-4 px-4">
        {isLoading && !growthLog && (
          <div data-el="growth-loading" className="h-52 animate-pulse rounded-[22px] bg-white/70" />
        )}

        {error && (
          <button
            data-el="growth-retry"
            type="button"
            onClick={loadGrowthLog}
            disabled={isLoading}
            className="rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("tsq.growth.retry")}
          </button>
        )}

        {growthLog && (
          <>
            <section data-el="growth-summary" className="rounded-[22px] bg-[color:var(--soft)] p-5">
              <p className="text-sm text-[color:var(--deep)]">当前等级 Lv.{growthLog.level}</p>
              <strong className="mt-1 block text-4xl text-[color:var(--deep)]">{growthLog.growth}</strong>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[color:var(--primary)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[color:var(--deep)]">距离下一级还差 {remainingGrowth} 成长值</p>
            </section>

            <section data-el="growth-log" className="rounded-[22px] border border-[color:var(--border)] bg-white p-4">
              <h2 className="text-[17px] font-semibold">全部记录</h2>
              {growthLog.entries.length === 0 ? (
                <p data-el="growth-empty" className="mt-3 text-sm text-muted-foreground">
                  {t("tsq.growth.empty")}
                </p>
              ) : (
                <div className="mt-3 space-y-4">
                  {growthLog.entries.map((entry) => (
                    <div data-el="growth-record" key={`${entry.title}-${entry.date}`} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--soft)] text-[color:var(--deep)]">
                        <Leaf className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.date}</p>
                      </div>
                      <b className="text-sm text-[color:var(--deep)]">+{entry.delta}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
