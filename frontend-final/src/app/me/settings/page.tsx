"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, ChevronLeft, IdCard, Lock, LogOut, MapPin, UserRound } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { useProfileStore } from "@/stores/profile-store";
import { WorldLocationPicker } from "@/components/tsq/world-location-picker";
import { WORLD_LOCATIONS, locationValue } from "@/lib/tsq/world-locations";
import { clearSession } from "@/lib/angelbridge-session";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { INTEREST_TAGS } from "@/components/auth/OnboardingWizard";
import { clearDashboardCache } from "@/hooks/use-dashboard";

export default function MeSettingsPage() {
  const router = useRouter();
  const persona = useProfileStore((s) => s.persona);
  const setPersona = useProfileStore((s) => s.setPersona);
  const [nickname, setNickname] = useState(persona?.nickname ?? "小天");
  const [city, setCity] = useState(persona?.city ?? locationValue(WORLD_LOCATIONS[0], WORLD_LOCATIONS[0].cities[0]));
  const [realName, setRealName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [verified, setVerified] = useState(false);
  const [profileIntro, setProfileIntro] = useState("");
  const [interestTags, setInterestTags] = useState<string[]>([]);

  useEffect(() => {
    angelbridgeApi.getAccount().then((account) => {
      setNickname(account.nickname);
      setCity(account.city ?? "");
      setProfileIntro(account.profileIntro);
      setInterestTags(account.interestTags);
    }).catch((error) => toast.error(error instanceof Error ? error.message : "读取资料失败"));
  }, []);

  function toggleInterest(tag: string) {
    setInterestTags((current) => current.includes(tag)
      ? current.filter((item) => item !== tag)
      : current.length < 5 ? [...current, tag] : current);
  }

  async function submit() {
    try {
      await angelbridgeApi.updateAccount({
        city: city.trim(),
        profileIntro: profileIntro.trim(),
        interestTags,
      });
      setPersona({
        ...(persona ?? {}),
        nickname: nickname.trim() || "小天",
        city: city.trim(),
        bio: profileIntro.trim(),
        interests: interestTags,
      });
      clearDashboardCache();
      if (realName.trim() && idNumber.trim()) setVerified(true);
      toast("设置已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存设置失败");
    }
  }

  function logout() {
    clearSession();
    toast("已退出登录");
    router.replace("/auth");
  }

  return (
    <AppShell>
      <header className="tsq-page-pad sticky top-0 z-20 flex items-center gap-2 bg-[color:var(--bg-canvas)]/90 py-2 backdrop-blur">
        <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full active:scale-90">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#071D3A]">个人设置</h1>
          <p className="text-[12px] text-muted-foreground">管理公开信息与实名认证</p>
        </div>
      </header>

      <main className="tsq-page-pad space-y-4 pt-4">
        <section className="rounded-[24px] border border-[#dbeed0] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
          <h2 className="mb-3 flex items-center gap-1.5 text-[16px] font-bold text-[#071D3A]">
            <UserRound className="h-4.5 w-4.5 text-[color:var(--primary)]" /> 对外展示信息
          </h2>
          <label className="mb-3 block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[#45623f]"><UserRound className="h-3.5 w-3.5" />昵称</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="请输入昵称"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[#fbfcf8] px-3 py-3 text-[14px] outline-none focus:border-[color:var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-[#45623f]"><MapPin className="h-3.5 w-3.5" />所在地（城市）</span>
            <WorldLocationPicker value={city} onChange={setCity} />
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#45623f]">个人简介</span>
            <textarea value={profileIntro} onChange={(event) => setProfileIntro(event.target.value)} maxLength={120} placeholder="用一句话介绍自己" className="w-full resize-none rounded-2xl border border-[color:var(--border)] bg-[#fbfcf8] px-3 py-3 text-[14px] outline-none focus:border-[color:var(--primary)]" />
          </label>
          <div className="mt-3">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#45623f]">画像关键词（最多 5 个）</span>
            <div className="flex flex-wrap gap-2">{INTEREST_TAGS.map((tag) => <button type="button" key={tag} onClick={() => toggleInterest(tag)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${interestTags.includes(tag) ? "bg-[#62A75C] text-white" : "bg-[#eef8e6] text-[#45623f]"}`}>{tag}</button>)}</div>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#dbeed0] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
          <h2 className="mb-2 flex items-center gap-1.5 text-[16px] font-bold text-[#071D3A]">
            <IdCard className="h-4.5 w-4.5 text-[color:var(--primary)]" /> 实名认证
          </h2>
          <p className="mb-3 rounded-2xl bg-[#f7fbf4] px-3 py-2 text-[12px] leading-relaxed text-[#45623f]">
            <Lock className="mr-1 inline h-3.5 w-3.5" />实名认证信息属于受保护信息，不会在双方确认时对外开放。
          </p>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#45623f]">真实姓名</span>
            <input
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="请输入真实姓名"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[#fbfcf8] px-3 py-3 text-[14px] outline-none focus:border-[color:var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[#45623f]">证件号码</span>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="请输入身份证件号码"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[#fbfcf8] px-3 py-3 text-[14px] outline-none focus:border-[color:var(--primary)]"
            />
          </label>
          {verified && (
            <div className="mt-3 flex items-center gap-1.5 rounded-2xl bg-[#eaf7ef] px-3 py-2 text-[13px] font-semibold text-[#23a56f]">
              <BadgeCheck className="h-4 w-4" /> 已提交实名认证信息
            </div>
          )}
        </section>

        <button
          onClick={submit}
          className="w-full rounded-full bg-[color:var(--primary)] py-3.5 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(88,169,66,.28)] active:scale-[.98]"
        >
          保存设置
        </button>

        <button
          onClick={logout}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#ffd9d6] bg-white/90 py-3.5 text-[15px] font-bold text-[#d75b52] shadow-[0_10px_22px_rgba(180,80,70,.08)] active:scale-[.98]"
        >
          <LogOut className="h-4.5 w-4.5" /> 退出登录
        </button>
      </main>
    </AppShell>
  );
}
