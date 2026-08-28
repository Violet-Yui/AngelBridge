"use client";

import { TrendingUp, Award, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ME } from "@/lib/tsq/data";
import { usePetStore } from "@/stores/pet-store";
import Link from "next/link";
import { SettingsEntry } from "@/components/tsq/settings-entry";

// 「我」页头部：个人画像 + 成长值 + 生命树缩影
export function ProfileHeader() {
  const { t } = useTranslation();
  const openPet = usePetStore((s) => s.toggle);

  return (
    <section
      data-el="profile-header"
      className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-b from-[color:var(--soft)] to-[color:var(--bg-canvas)] px-4 pb-5 pt-10"
    >
      <div className="absolute right-4 top-8 z-10">
        <SettingsEntry label={t("tsq.me.openSettings")} />
      </div>
      <div className="flex items-center gap-3.5">
        <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-white text-3xl shadow-[0_8px_20px_rgba(55,95,42,0.14)]">
          🌳
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href="/profile/edit" className="text-[22px] font-bold leading-tight">{ME.name}</Link>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[12px] text-[color:var(--deep)]">
              {ME.handle}
            </span>
          </div>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[13px] text-[color:var(--deep)]">
            <Sparkles className="h-3 w-3" /> {ME.stage}
          </p>
        </div>
      </div>

      {/* 成长数据条 */}
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white shadow-[var(--brand-shadow-sm)]">
        <div className="border-r border-[#f0f1ec] py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[color:var(--deep)]">
            <strong className="text-2xl leading-none">{ME.growth}</strong>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {t("tsq.me.growthValue")} +{ME.growthDelta}
          </p>
        </div>
        <div className="border-r border-[#f0f1ec] py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[color:var(--deep)]">
            <Award className="h-4 w-4" />
            <strong className="text-2xl leading-none">Lv.{ME.level}</strong>
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">{t("tsq.me.level")}</p>
        </div>
        <button onClick={openPet} className="py-3 text-center active:scale-95">
          <strong className="text-2xl leading-none text-[color:var(--warm)]">
            {ME.luck}
          </strong>
          <p className="mt-1 text-[12px] text-muted-foreground">{t("tsq.me.luck")}{ME.mood}</p>
        </button>
      </div>
    </section>
  );
}
