"use client";

import { useEffect, useState } from "react";
import AuthFlow, { type AuthFlowResult } from "@/components/auth/AuthFlow";
import OnboardingWizard, { type OnboardingProfile } from "@/components/auth/OnboardingWizard";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { clearSession, getSession, getToken, type AngelBridgeSession } from "@/lib/angelbridge-session";
import { toast } from "sonner";

type Phase = "login" | "onboarding" | "letter-loading" | "app";

/**
 * 一打开网页即弹出：开屏动画常驻背景（中上部）→ 稍后浮现注册/登录浮窗（中下部）
 * → 新人引导 → 进入首页。视频在用户正式进首页前一直循环播放。
 * 纯前端原型：完成态记录在 sessionStorage，刷新标签页会重新演示。
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("login");
  const [ready, setReady] = useState(false);
  // 稍作停顿后让温馨提示浮现，避免首帧生硬
  const [authVisible, setAuthVisible] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{ phone: string; code: string } | null>(null);
  const [letterPending, setLetterPending] = useState(false);
  const [session, setSession] = useState<AngelBridgeSession | null>(null);

  useEffect(() => {
    const restore = async () => {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const restored = await angelbridgeApi.getAccount();
        setSession(restored);
        setPhase(restored.demographicsComplete ? "app" : "onboarding");
      } catch {
        clearSession();
      } finally {
        setReady(true);
      }
    };
    void restore();
    const timer = window.setTimeout(() => setAuthVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  function handleAuth(result: AuthFlowResult) {
    if (result.kind === "register") {
      setPendingRegistration({ phone: result.phone, code: result.code });
      setLetterPending(true);
      setPhase("onboarding");
      return;
    }
    setSession(result.session);
    setLetterPending(result.session.accountKind === "showcase" && !result.session.demographicsComplete);
    setPhase(result.session.demographicsComplete ? "app" : "onboarding");
  }

  async function finish(profile: OnboardingProfile) {
    try {
      const firstRegistration = Boolean(pendingRegistration) || letterPending;
      let activeSession = session;
      if (pendingRegistration) {
        activeSession = await angelbridgeApi.register(
          pendingRegistration.phone,
          pendingRegistration.code,
          profile.nickname,
        );
      }
      if (!activeSession) throw new Error("登录状态已失效，请重新登录");
      let avatarUrl: string | undefined;
      if (profile.avatarFile) avatarUrl = (await angelbridgeApi.uploadImage(profile.avatarFile)).url;
      const gender = profile.gender === "男" ? "m" : profile.gender === "女" ? "f" : undefined;
      const updated = await angelbridgeApi.updateAccount({
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(gender ? { gender } : {}),
        birthDate: profile.birthday,
        city: profile.city,
        profileIntro: profile.bio,
        interestTags: profile.interests,
      });
      setSession(updated);
      setPendingRegistration(null);
      setLetterPending(false);
      if (firstRegistration) {
        setPhase("letter-loading");
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => window.location.replace("/letter/angelbridge_letter.html"));
        });
      } else {
        setPhase("app");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "资料保存失败，请重试");
    }
  }

  // 首帧未确定状态前不闪现首页
  if (!ready) return null;

  const overlay = phase !== "app";

  return (
    <>
      {children}
      {overlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            overflowY: "auto",
            background: phase === "letter-loading" ? "#F3F8EE" : "linear-gradient(180deg,#eef7e6 0%,#dff0c8 100%)",
          }}
        >
          {/* 注册登录 / 引导浮窗 */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              minHeight: "100%",
              opacity: authVisible ? 1 : 0,
              transform: authVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity .45s ease, transform .45s ease",
            }}
          >
            {phase === "login" && (
              <AuthFlow videoBg onComplete={handleAuth} />
            )}
            {phase === "onboarding" && <OnboardingWizard onDone={finish} initialNickname={session?.nickname ?? ""} />}
          </div>
        </div>
      )}
    </>
  );
}
