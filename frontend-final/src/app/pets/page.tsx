"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Palette, Save, Sparkles } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { usePetStore } from "@/stores/pet-store";
import { ZODIAC_PETS as zodiacPets } from "@/lib/tsq/pets";
import { cn } from "@/utils/utils";

const outfits = ["森林围巾", "阳光斗篷", "星星帽子", "云朵睡衣"];

export default function PetsPage() {
  const selected = usePetStore((s) => s.selectedPet);
  const setSelectedPet = usePetStore((s) => s.setSelectedPet);
  const name = usePetStore((s) => s.petName);
  const setPetName = usePetStore((s) => s.setPetName);
  const appliedPet = usePetStore((s) => s.appliedPet);
  const appliedPetName = usePetStore((s) => s.appliedPetName);
  const applyPet = usePetStore((s) => s.applyPet);
  const [outfit, setOutfit] = useState(outfits[0]);
  const [guardian, setGuardian] = useState(false);
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const activePet = zodiacPets.find((pet) => pet.name === selected) ?? zodiacPets[3];
  const currentAppliedPet = zodiacPets.find((pet) => pet.name === appliedPet) ?? zodiacPets[3];

  function saveSettings() {
    if (guardian && (!contact.trim() || !/^1\d{10}$/.test(phone.trim()))) {
      setError("开启守护模式后，请填写紧急联系人和 11 位手机号码。");
      setSaved(false);
      return;
    }
    setError("");
    // 保存后把所选灵宠形象与昵称同步到全产品所有展示位
    applyPet(selected, name);
    setSaved(true);
  }

  return (
    <AppShell>
      <main data-el="pets-page" className="px-4">
        <header className="mb-4 flex items-center justify-between">
          <Link href="/" aria-label="返回人生树" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 shadow-[var(--brand-shadow-sm)]"><ChevronLeft className="h-5 w-5" /></Link>
          <div className="text-center"><h1 className="text-[22px] font-bold text-[color:var(--deep)]">灵宠合集</h1><p className="text-[13px] text-muted-foreground">选择并配置你的十二生肖灵宠</p></div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fff4d9] text-[#bd7c10]"><Sparkles className="h-5 w-5" /></span>
        </header>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[13px] text-muted-foreground">当前已应用灵宠</p><h2 className="text-[20px] font-bold text-[color:var(--deep)]">{currentAppliedPet.name} · {appliedPetName}</h2><p className="mt-1 text-[12px] text-muted-foreground">选择新形象或昵称后，点击保存即可全局同步</p></div><span className="rounded-full bg-[color:var(--deep)] px-2 py-1 text-[10px] font-bold text-white">AI</span></div>
          <div className="grid grid-cols-3 gap-2.5">{zodiacPets.map((pet) => { const active = selected === pet.name; return <button key={pet.name} onClick={() => { setSelectedPet(pet.name); setSaved(false); }} className={cn("relative rounded-[22px] border p-1.5 transition-all active:scale-[.98]", active ? "border-[color:var(--primary)] bg-[color:var(--soft)] shadow-[0_10px_22px_rgba(88,169,66,.18)]" : "border-[color:var(--border)] bg-white")}>{active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--primary)] text-white"><Check className="h-3.5 w-3.5" /></span>}{pet.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.image} alt={pet.name} loading="lazy" className="mx-auto aspect-square w-full object-contain" />
          ) : (
            <span className="text-[30px]">{pet.emoji}</span>
          )}</button>; })}</div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[color:var(--border)] bg-white/90 p-4 shadow-[var(--brand-shadow-sm)]">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[19px] font-bold text-[color:var(--deep)]">设置灵宠</h2><p className="text-[12px] text-muted-foreground">让小伙伴更像你想要的样子</p></div><Palette className="h-5 w-5 text-[color:var(--warm)]" /></div>
          <label className="mb-3 flex items-center justify-between border-b border-[#f0f1ec] py-3"><span className="font-medium">灵宠昵称</span><input value={name} onChange={(event) => setPetName(event.target.value)} maxLength={12} className="w-32 rounded-xl border border-[color:var(--border)] px-3 py-2 text-right text-sm outline-none focus:border-[color:var(--primary)]" /></label>
          <label className="mb-3 flex items-center justify-between border-b border-[#f0f1ec] py-3"><span className="font-medium">灵宠装扮</span><select value={outfit} onChange={(event) => setOutfit(event.target.value)} className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none">{outfits.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="border-b border-[#f0f1ec] py-3"><div className="flex items-center justify-between"><div><p className="font-medium">视频通话是否开启守护模式</p><p className="mt-1 text-[12px] text-muted-foreground">遇到风险时，小天会提醒你并联系指定联系人</p></div><button type="button" role="switch" aria-checked={guardian} onClick={() => { setGuardian((value) => !value); setError(""); setSaved(false); }} className={cn("relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors", guardian ? "bg-[#f2a93b]" : "bg-[#d8ddd5]")}><span className={cn("absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform", guardian ? "translate-x-5" : "translate-x-0")} /></button></div>
          {guardian && <div className="mt-4 space-y-3 rounded-2xl bg-[#fff8ea] p-3"><p className="text-[13px] font-semibold text-[#bd7c10]">开启后请填写紧急联系人</p><input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="紧急联系人姓名" className="w-full rounded-xl border border-[#e8d3a5] bg-white px-3 py-2.5 text-sm outline-none" /><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))} inputMode="numeric" placeholder="联系电话" className="w-full rounded-xl border border-[#e8d3a5] bg-white px-3 py-2.5 text-sm outline-none" /></div>}</div>
          {error && <p role="alert" className="mb-3 rounded-xl bg-[#fff0ed] px-3 py-2 text-xs text-[#c45c45]">{error}</p>}
          <button onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(88,169,66,.22)] active:scale-[.98]"><Save className="h-4 w-4" />{saved ? "已保存设置" : "保存灵宠设置"}</button>
        </section>
        <Link href="/xiaotian/chat" className="my-4 flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--deep)]"><span>想让小天帮你进一步配置？</span><ChevronRight className="h-4 w-4" /></Link>
      </main>
    </AppShell>
  );
}
