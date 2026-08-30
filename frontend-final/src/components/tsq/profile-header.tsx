"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, MapPin, PenLine, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { useProfileStore } from "@/stores/profile-store";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { AngelBridgeSession } from "@/lib/angelbridge-session";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import { useDashboard } from "@/hooks/use-dashboard";

function calcAge(value?: string) {
  const raw = value?.trim();
  if (!raw) return "16";
  const match = raw.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!match) return raw.replace(/岁$/, "");
  const birth = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const passed = now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!passed) age -= 1;
  return String(Math.max(0, age));
}

export function ProfileHeader() {
  const persona = useProfileStore((s) => s.persona);
  const setPersona = useProfileStore((s) => s.setPersona);
  const { dashboard } = useDashboard();
  const [account, setAccount] = useState<AngelBridgeSession | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    angelbridgeApi.getAccount().then(setAccount).catch(() => undefined);
  }, []);

  const avatar = account?.avatarUrl || persona?.avatar || "🌳";
  const previewAvatar = pendingAvatar ?? avatar;
  const isImg = previewAvatar.startsWith("http") || previewAvatar.startsWith("/api/media/") || previewAvatar.startsWith("blob:") || previewAvatar.startsWith("data:");
  const name = account?.nickname || persona?.nickname || "";
  const matureShowcase = isMatureShowcaseSession(account);
  const showcaseProfile = account?.nickname === "摄影师小林"
    ? { following: "86", followers: "1.1k", bridges: 8, intro: "用影像记录真实价值，也寻找长期共创伙伴。" }
    : { following: "128", followers: "2.4k", bridges: 12, intro: "让设计、空间和真实需求彼此连接。" };
  const signature = account?.profileIntro || persona?.bio || (matureShowcase ? showcaseProfile.intro : "");
  const genderSymbol = account?.gender === "f" ? "♀" : account?.gender === "m" ? "♂" : "☼";
  const age = calcAge(account?.birthDate ?? persona?.ageRange);
  const ip = account?.city ?? persona?.city ?? "";
  const completedCount = dashboard?.stats.completedPacts ?? 0;

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setPendingAvatarFile(file);
    setPendingAvatar(URL.createObjectURL(file));
  }

  async function saveAvatar() {
    if (!pendingAvatarFile || savingAvatar) return;
    setSavingAvatar(true);
    try {
      const uploaded = await angelbridgeApi.uploadImage(pendingAvatarFile);
      const updated = await angelbridgeApi.updateAccount({ avatarUrl: uploaded.url });
      setAccount(updated);
      setPersona({ ...(persona ?? {}), avatar: uploaded.url });
      setPendingAvatar(null);
      setPendingAvatarFile(null);
      toast.success("头像已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "头像保存失败");
    } finally {
      setSavingAvatar(false);
    }
  }

  return (
    <section data-el="profile-header" className="relative overflow-visible rounded-b-[32px] bg-gradient-to-b from-[color:var(--soft)] to-[color:var(--bg-canvas)] px-5 pb-4 pt-5">
      <Link href="/me/settings" aria-label="设置" className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-white/85 bg-white/82 text-[#758274] shadow-[0_8px_22px_rgba(55,95,42,0.12)] backdrop-blur-xl active:scale-95"><Settings className="h-5 w-5" /></Link>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleAvatarChange} />

      <div className="relative rounded-[30px] border border-white/72 bg-white/46 px-4 pb-4 pt-4 shadow-[0_18px_46px_rgba(55,95,42,0.10)] backdrop-blur-xl">
        <div className="flex items-center gap-3.5 pr-10">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="拍摄或上传头像" className="group relative h-[78px] w-[78px] shrink-0 overflow-visible active:scale-95">
            <span className="grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-full border-[3px] border-white bg-white text-3xl shadow-[0_10px_24px_rgba(55,95,42,0.12)]">
              {isImg ? <img src={previewAvatar} alt={name} className="h-full w-full object-cover" /> : previewAvatar}
            </span>
            <span className="absolute bottom-1 right-1 z-20 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#62A75C] text-white shadow-[0_4px_10px_rgba(55,95,42,.25)]"><Camera className="h-4 w-4" /></span>
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[20px] font-black leading-tight tracking-tight text-[#20351d]">{name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-medium text-[#758274]">
              <span>{age}岁</span><span>{genderSymbol}</span><span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />IP：{ip}</span>
            </div>
          </div>
        </div>

        <Link href="/me/settings" className="mt-3 flex items-center rounded-2xl border border-[#dce8d6] bg-white/42 px-3 py-2 active:scale-[.99]">
          <p className={`min-w-0 truncate text-[15px] leading-6 ${signature ? "text-[#758274]" : "text-[#a7afa5]"}`}>{signature || "点击添加介绍，让大家认识你..."}</p>
          <PenLine className="ml-1.5 h-4 w-4 shrink-0 text-[#8d968b]" />
        </Link>

        <div className="mt-3 flex h-[68px] items-center justify-around rounded-[24px] border border-white/68 bg-white/46 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.72)]">
          <Stat value={matureShowcase ? showcaseProfile.following : "0"} label="关注" />
          <Divider />
          <Stat value={matureShowcase ? showcaseProfile.followers : "0"} label="粉丝" />
          <Divider />
          <Link href="/me/bridges" className="flex flex-1 flex-col items-center justify-center active:scale-95"><b className="text-[16px] leading-none text-[#20351d]">{matureShowcase ? showcaseProfile.bridges + completedCount : completedCount}</b><span className="mt-2 text-[12px] font-medium text-[#758274]">搭桥</span></Link>
        </div>
      </div>

      {pendingAvatar && <div className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[var(--app-max-width)] items-end bg-black/30 px-4 pb-[max(18px,env(safe-area-inset-bottom,0px))]"><div className="w-full rounded-[28px] border border-white/70 bg-white p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,.18)]"><div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border-[4px] border-[#edf6e6] bg-white shadow-[0_10px_24px_rgba(55,95,42,.14)]"><img src={pendingAvatar} alt="新头像预览" className="h-full w-full object-cover" /></div><h2 className="mt-4 text-[18px] font-black text-[#20351d]">保存这张头像吗？</h2><p className="mt-1 text-[13px] leading-relaxed text-[#758274]">保存后，个人主页会立即使用这张新头像。</p><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={savingAvatar} onClick={() => { setPendingAvatar(null); setPendingAvatarFile(null); }} className="flex items-center justify-center gap-1.5 rounded-full border border-[#dce8d6] bg-white py-3 text-[14px] font-bold text-[#758274] active:scale-95 disabled:opacity-50"><X className="h-4 w-4" />取消</button><button type="button" disabled={savingAvatar} onClick={() => void saveAvatar()} className="flex items-center justify-center gap-1.5 rounded-full bg-[#62A75C] py-3 text-[14px] font-bold text-white shadow-[0_10px_22px_rgba(98,167,92,.24)] active:scale-95 disabled:opacity-50"><Check className="h-4 w-4" />{savingAvatar ? "保存中…" : "保存头像"}</button></div></div></div>}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="flex flex-1 flex-col items-center justify-center"><b className="text-[16px] leading-none text-[#20351d]">{value}</b><span className="mt-2 text-[12px] font-medium text-[#758274]">{label}</span></div>; }
function Divider() { return <span className="h-8 w-px bg-[#dce8d6]" aria-hidden="true" />; }
