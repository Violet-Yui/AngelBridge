"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Sun, Leaf, Info } from "lucide-react";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import { ME } from "@/lib/tsq/data";
import Link from "next/link";

// 盛放生命树 Hero：占据首屏上半屏的第一视觉焦点
export function LifeTreeHero() {
  const { t } = useTranslation();
  return (
    <section data-el="home-life-tree" aria-labelledby="life-tree-title" className="relative">
      {/* 沉浸式背景：盛放的手绘水彩生命树 */}
      <div className="tsq-hero-scrim pointer-events-none absolute inset-x-0 top-0 h-[74vh] overflow-hidden">
        <Image
          src={TSQ_ASSETS.heroBg}
          alt={t("tsq.home.tree")}
          fill
          priority
          sizes="430px"
          className="object-cover object-top brightness-[1.04] saturate-[1.03]"
          style={{ objectPosition: "center top" }}
        />
        {/* 阳光光点 */}
        <span className="tsq-spark absolute left-[62%] top-[22%] h-1.5 w-1.5 rounded-full bg-[color:var(--warm)] shadow-[0_0_12px_#f2a93b]" />
        <span
          className="tsq-spark absolute left-[40%] top-[36%] h-1.5 w-1.5 rounded-full bg-[color:var(--warm)] shadow-[0_0_12px_#f2a93b]"
          style={{ animationDelay: "-2.4s" }}
        />
        <span
          className="tsq-spark absolute right-[20%] top-[30%] h-1.5 w-1.5 rounded-full bg-[color:var(--warm)] shadow-[0_0_12px_#f2a93b]"
          style={{ animationDelay: "-3.2s" }}
        />
      </div>

      {/* Hero 内容：成长数据浮层 */}
      <div className="relative z-[1] px-4 pt-[46vh]">
        <div className="tsq-glass relative overflow-hidden rounded-[32px] p-[18px] shadow-[var(--brand-shadow-md)]">
          <div className="flex items-start justify-between">
            <h1 id="life-tree-title" className="flex items-center gap-1.5 text-[22px] font-bold leading-tight">
              {t("tsq.home.tree")}
              <Info className="h-4 w-4 text-muted-foreground" />
            </h1>
            <Link href="/growth" className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1 text-[13px] text-[color:var(--deep)]">
              {t("tsq.home.growthRecord")} ›
            </Link>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div className="text-[color:var(--deep)]">
              <p className="mb-0.5 text-[13px] text-muted-foreground">{t("tsq.home.growth")}</p>
              <div className="flex items-baseline gap-1">
                <strong className="text-[34px] font-bold leading-none">
                  {ME.growth}
                </strong>
                <span className="text-lg">↑</span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t("tsq.home.vsYesterday")} +{ME.growthDelta}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-full border-2 border-[color:var(--warm)] shadow-[0_0_0_8px_rgba(242,169,59,0.12)]">
                  <Sun className="h-4 w-4 text-[color:var(--warm)]" />
                </span>
                <p className="mt-2 text-sm font-semibold">{ME.followers}</p>
                <p className="text-[11px] text-muted-foreground">{t("tsq.home.followedYou")}</p>
              </div>
              <div className="text-center">
                <Leaf className="mx-auto h-6 w-6 text-[color:var(--primary)]" />
                <p className="mt-2 text-sm font-semibold">3</p>
                <p className="text-[11px] text-muted-foreground">{t("tsq.home.newGrowth")}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 inline-flex rounded-xl border border-[color:var(--border)] bg-white px-3 py-1.5 text-[13px] shadow-[0_8px_16px_rgba(70,110,50,0.08)]">
            {t("tsq.home.todayStatus")}：{ME.stage} 🌿
          </div>
        </div>
      </div>
    </section>
  );
}
