"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/tsq/app-shell";
import { DEFAULT_ZODIAC_PET_ID, getZodiacPet, ZODIAC_PETS } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";

export default function PetCollectionPage() {
  const { t } = useTranslation();
  const selectedPetId = usePetStore((state) => state.selectedPetId);
  const setSelectedPetId = usePetStore((state) => state.setSelectedPetId);
  const [selectedId, setSelectedId] = useState(selectedPetId || DEFAULT_ZODIAC_PET_ID);
  const selected = getZodiacPet(selectedId);

  function handleSelect(id: string) {
    setSelectedId(id);
    setSelectedPetId(id);
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-4 pb-3 pt-2">
        <Link href="/me" aria-label={t("tsq.pets.backToMe")} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link>
        <div><h1 className="text-[20px] font-bold">{t("tsq.pets.title")}</h1><p className="text-[12px] text-muted-foreground">{t("tsq.pets.subtitle")}</p></div>
      </header>
      <main data-el="pet-collection" className="space-y-4 px-4 pb-5">
        <section className="flex items-center gap-4 rounded-[22px] border border-[color:var(--border)] bg-white p-4 shadow-[var(--brand-shadow-sm)]">
          <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-[20px] bg-[color:var(--soft)]"><Image src={selected.image} alt={selected.name} width={80} height={80} className="h-full w-full object-contain" /></span>
          <div className="min-w-0 flex-1"><p className="text-[12px] text-muted-foreground">{t("tsq.pets.current")}</p><h2 className="mt-1 text-[22px] font-bold">{selected.name}</h2><p className="mt-1 text-[13px] text-[color:var(--deep)]">{selected.trait}</p></div>
          <Sparkles className="h-5 w-5 text-[#f2a93b]" />
        </section>
        <section>
          <h2 className="mb-2.5 text-[17px] font-semibold">{t("tsq.pets.choose")}</h2>
          <div className="grid grid-cols-3 gap-3">
            {ZODIAC_PETS.map((pet) => {
              const active = pet.id === selectedId;
              return <button key={pet.id} data-el="pet-choice" type="button" onClick={() => handleSelect(pet.id)} aria-pressed={active} className={`relative overflow-hidden rounded-[20px] border bg-white p-2.5 text-left shadow-[var(--brand-shadow-sm)] active:scale-[.98] ${active ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20" : "border-[color:var(--border)]"}`}>
                <Image src={pet.image} alt={pet.name} width={96} height={96} className="mx-auto h-20 w-20 object-contain" />
                <b className="mt-1 block text-center text-[14px]">{pet.name}</b><span className="block text-center text-[11px] text-muted-foreground">{pet.trait}</span>
                {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--primary)] text-white"><Check className="h-3.5 w-3.5" /></span>}
              </button>;
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
