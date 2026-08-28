"use client";

import Image from "next/image";
import { ShoppingBag, Heart, Leaf, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/tsq/app-shell";
import { ProfileHeader } from "@/components/tsq/profile-header";
import { ME } from "@/lib/tsq/data";
import { getZodiacPet, ZODIAC_PETS } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { tsqApi } from "@/lib/tsq/api";
import type { ProfileAssets } from "@/lib/tsq/types";

const KIND_TAG: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

export default function MePage() {
  const { t } = useTranslation();
  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const activePet = getZodiacPet(selectedPetId);
  const [assets, setAssets] = useState<ProfileAssets>();
  useEffect(() => { void tsqApi.getProfileAssets().then(setAssets); }, []);
  const resources = assets?.resources ?? ME.resources.map((item, index) => ({ id: `resource-${index}`, ...item, source: "user" as const }));
  const needs = assets?.needs ?? ME.needs.map((title, index) => ({ id: `need-${index}`, title, source: "user" as const }));
  return (
    <AppShell topInset="none">
      <ProfileHeader />

        <div className="space-y-5 px-4 pt-5">
          <Link
            data-el="me-pet-entry"
            href="/me/pets"
            className="flex items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-white p-3.5 shadow-[var(--brand-shadow-sm)] active:scale-[.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[color:var(--soft)]">
              <Image src={activePet.image} alt={activePet.name} width={40} height={40} className="h-full w-full object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <small className="block text-[12px] text-[color:var(--deep)]">{t("tsq.me.petAgent")}</small>
              <b className="mt-0.5 block text-[16px]">
                {t("tsq.me.petAgentSub")}
              </b>
            </span>
            <span className="flex -space-x-2" aria-hidden>
              {ZODIAC_PETS.slice(0, 4).map((pet) => (
                <Image
                  key={pet.id}
                  src={pet.image}
                  alt=""
                  width={34}
                  height={34}
                  className="h-9 w-9 rounded-full border-2 border-white bg-[color:var(--soft)] object-contain"
                />
              ))}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
          </Link>

          {/* 我的资源（拥有） */}
        <section data-el="me-resources">
          <SectionTitle
            icon={<ShoppingBag className="h-4 w-4" />}
            title={t("tsq.me.resources")}
            sub={t("tsq.me.resourcesSub")}
            tone="green"
            action={<Link href="/me/assets" className="ml-auto text-xs text-[color:var(--deep)]">{t("tsq.me.manageAssets")}</Link>}
          />
          <div className="rounded-[20px] border border-[color:var(--border)] bg-white p-3.5 shadow-[var(--brand-shadow-sm)]">
            <div className="flex flex-wrap gap-2">
              {resources.map((r) => (
                <Link
                  href={`/me/resources/${encodeURIComponent(r.id)}`}
                  key={r.label}
                  className={cn(
                    "rounded-2xl px-3 py-2 text-left",
                    KIND_TAG[r.kind],
                  )}
                >
                  <p className="text-[13px] font-semibold leading-none">{r.label}</p>
                  <p className="mt-1 text-[12px] opacity-80">{r.value}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 我的需求（心愿） */}
        <section data-el="me-needs">
          <SectionTitle
            icon={<Heart className="h-4 w-4" />}
            title={t("tsq.me.needs")}
            sub={t("tsq.me.needsSub")}
            tone="warm"
          />
          <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white shadow-[var(--brand-shadow-sm)]">
            {needs.map((n, i) => (
              <Link
                href={`/me/needs/${encodeURIComponent(n.id)}`}
                key={n.id}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-3",
                  i < ME.needs.length - 1 && "border-b border-[#f1f2ec]",
                )}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--purple)]" />
      <span className="flex-1 text-[14px]">{n.title}</span>
                <ChevronRight className="h-4 w-4 text-neutral-300" />
              </Link>
            ))}
          </div>
        </section>

        {/* 经验值 · 成长 */}
        <section data-el="me-growth">
          <SectionTitle
            icon={<Leaf className="h-4 w-4" />}
            title={t("tsq.me.growth")}
            sub={t("tsq.me.growthSub")}
            tone="green"
          />
          <div className="rounded-[20px] border border-[color:var(--border)] bg-white p-3.5 shadow-[var(--brand-shadow-sm)]">
            {/* 成长进度 */}
            <div className="mb-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted-foreground">
                  {t("tsq.me.toNext", { lv: ME.level + 1, n: 220 })}
                </span>
                <span className="text-[13px] font-semibold text-[color:var(--deep)]">
                  {ME.growth} / 1500
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[color:var(--soft)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6cc653] to-[#48a63e]"
                  style={{ width: `${(ME.growth / 1500) * 100}%` }}
                />
              </div>
            </div>

            {/* 成长记录 */}
            <div className="space-y-2.5 border-t border-[#f1f2ec] pt-3">
              {ME.growthLog.map((g) => (
                <div key={g.title} className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--soft)] text-[color:var(--deep)]">
                    <Leaf className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[14px] leading-tight">{g.title}</p>
                    <p className="text-[12px] text-muted-foreground">{g.date}</p>
                  </div>
                  <span className="text-[14px] font-semibold text-[color:var(--deep)]">
                    +{g.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SectionTitle({
  icon,
  title,
  sub,
  tone,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "green" | "warm";
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-lg",
          tone === "green"
            ? "bg-[color:var(--soft)] text-[color:var(--deep)]"
            : "bg-[#fff4d9] text-[#bd7c10]",
        )}
      >
        {icon}
      </span>
      <h2 className="text-[17px] font-semibold">{title}</h2>
      <span className="text-[13px] text-muted-foreground">{sub}</span>
      {action}
    </div>
  );
}
