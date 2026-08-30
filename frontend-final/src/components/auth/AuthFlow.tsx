"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { angelbridgeApi, AngelBridgeApiError } from "@/lib/angelbridge-api";
import type { AngelBridgeSession } from "@/lib/angelbridge-session";

type Screen = "welcome" | "verify";

const WALLPAPER = "/migrated-assets/auth-wallpaper.png";
const GREETING_VIDEO = "/eazo-assets/att_3dznoeax6q1uxku3-a5d73bdf70-splash-intro.mp4";
const GREETING_POSTER = "/migrated-assets/xiaotian.png";

function Logo({ size = 84 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="ab-brand"
      src="/brand/logo.png"
      alt="天使桥"
      width={size}
      height={size}
    />
  );
}

function GreetingVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("x5-playsinline", "true");

    const tryPlay = () => { void video.play().catch(() => undefined); };
    const retryWhenVisible = () => { if (!document.hidden) tryPlay(); };
    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    document.addEventListener("visibilitychange", retryWhenVisible);
    window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    window.addEventListener("pointerdown", tryPlay, { once: true });
    video.load();
    tryPlay();

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", retryWhenVisible);
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("pointerdown", tryPlay);
    };
  }, []);

  return (
    <video
      ref={ref}
      src={GREETING_VIDEO}
      poster={GREETING_POSTER}
      muted
      playsInline
      autoPlay
      loop
      preload="auto"
    />
  );
}

export type AuthFlowResult =
  | { kind: "login"; session: AngelBridgeSession }
  | { kind: "register"; phone: string; code: string };

export default function AuthFlow({ onComplete, videoBg = false }: { onComplete?: (result: AuthFlowResult) => void; videoBg?: boolean }) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [modalOpen, setModalOpen] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // verify screen
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [purpose, setPurpose] = useState<"register" | "login" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cdRef.current) clearInterval(cdRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1400);
  }

  function go(s: Screen) {
    setScreen(s);
  }

  function handleAgree() {
    setModalOpen(false);
    setAgreed(false);
  }

  function handleStart() {
    if (!agreed) {
      setShake(true);
      showToast("请先勾选协议");
      setTimeout(() => setShake(false), 360);
      return;
    }
    go("verify");
  }

  async function sendCode() {
    if (countdown > 0) return;
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      showToast("请输入正确的11位手机号");
      return;
    }
    try {
      const result = await angelbridgeApi.sendSmsCode(phone.trim());
      setPurpose(result.purpose);
      setCountdown(result.resendAfterSeconds || 60);
      cdRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (cdRef.current) clearInterval(cdRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      showToast("验证码已发送");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "验证码发送失败");
    }
  }

  async function forward() {
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      showToast("请输入正确的11位手机号");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      showToast("请输入6位验证码");
      return;
    }
    if (!purpose) {
      showToast("请先获取验证码");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (purpose === "login") {
        const session = await angelbridgeApi.login(phone.trim(), code.trim());
        onComplete?.({ kind: "login", session });
      } else {
        onComplete?.({ kind: "register", phone: phone.trim(), code: code.trim() });
      }
    } catch (error) {
      showToast(error instanceof AngelBridgeApiError ? error.message : "登录失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`ab-shell${videoBg ? " ab-shell--video" : ""}`}>
      <style>{CSS}</style>

      {!videoBg && (
        <div className="ab-wallpaper" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WALLPAPER} alt="" />
          <span className="ab-orb one" />
          <span className="ab-orb two" />
          <span className="ab-orb three" />
        </div>
      )}

      <div className="ab-phone">
        <section className="ab-stage">
          {/* ===== 登录前温馨提示（豆包式版式 + 手绘树背景） ===== */}
          {modalOpen && (
            <div className="db-tips">
              {/* 手绘水彩花树背景 */}
              <div className="db-tips-bg" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/eazo-assets/watercolor-tree-cutout.png"
                  alt=""
                />
              </div>

              {/* 顶栏：居中标题 */}
              <div className="db-top">
                <span className="db-top-title">登录前温馨提示</span>
              </div>

              {/* 圆形浅底 + 半身挥手数字人 */}
              <div className="db-avatar">
                <GreetingVideo />
              </div>

              {/* 欢迎语：多行逐字淡入 */}
              <h1 className="db-hello" aria-label="你好，我是小天，欢迎来到天使桥！">
                {["你好，我是小天", "欢迎来到天使桥！"].map((line, lineIndex) => (
                  <span className="db-hello-line" key={line}>
                    {line.split("").map((ch, i) => {
                      const delayIndex = lineIndex * 8 + i;
                      return (
                        <span className="db-char" key={`${ch}-${i}`} style={{ animationDelay: `${delayIndex * 0.06}s` }}>
                          {ch === " " ? "\u00A0" : ch}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h1>

              {/* 提示文字 + 按钮：统一放进带背景与边框的卡片 */}
              <div className="db-panel">
                <p className="db-tips-body">
                  我们依据相关法律制定了
                  <Link className="legal-link" href="/terms/user-agreement">《用户协议》</Link>
                  和
                  <Link className="legal-link" href="/terms/privacy-policy">《隐私政策》</Link>
                  ，请您在点击同意之前仔细阅读并充分理解相关条款，其中的重点条款已为您标注。为方便您了解自己的权利，我们提供了
                  <Link className="legal-link" href="/terms/privacy-summary">《隐私政策概要》</Link>
                  向您简要介绍我们的个人信息使用情况。
                </p>
                <div className="db-actions">
                  <button className="db-btn db-btn-primary" onClick={handleAgree}>
                    同意
                  </button>
                  <button
                    className="db-skip"
                    onClick={() => showToast("演示中保留在当前页面")}
                  >
                    不同意并退出APP
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== 主登录页：延续温馨提示页的圆形小天 + 下方悬浮窗布局 ===== */}
          <div className={`ab-screen ${screen === "welcome" && !modalOpen ? "active" : ""}`}>
            <div className="login-greeting">
              <div className="db-avatar login-avatar">
                {screen === "welcome" && !modalOpen && <GreetingVideo />}
              </div>

              <div className="login-panel">
                <h1>欢迎来到天使桥</h1>
                <p className="ab-sub">
                  AI 人生价值交换与互助平台
                  <br />
                  在这里我们做彼此的天使
                </p>
                <button
                  className="login-cta"
                  onClick={handleStart}
                >
                  注册 / 登录
                </button>
                <label
                  className={`login-agree ${agreed ? "on" : ""} ${shake ? "ab-shake" : ""}`}
                  onClick={() => setAgreed((v) => !v)}
                >
                  <span className={`ab-radio ${shake ? "ab-dot-shake" : ""}`} />
                  <span>
                    我已认真阅读、理解并同意
                    <Link className="legal-link" href="/terms/user-agreement" onClick={(event) => event.stopPropagation()}>用户协议</Link>
                    和
                    <Link className="legal-link" href="/terms/privacy-policy" onClick={(event) => event.stopPropagation()}>隐私政策</Link>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ===== 验证码注册/登录页 ===== */}
          <div className={`ab-screen ${screen === "verify" ? "active" : ""}`}>
            <div className="ab-card ab-form">
              <img className="ab-form-logo" src="/brand/home-logo.png" alt="天使桥" />
              <div className="ab-field">
                <input
                  className="ab-line-input"
                  placeholder="手机号"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <div className="ab-micro">未注册手机号将跳转到注册界面</div>
              </div>
              <div className="ab-otp-row">
                <input
                  className="ab-line-input"
                  placeholder="在此输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className={`ab-send ${countdown > 0 ? "sent" : ""}`}
                  onClick={sendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `已发送 ${countdown}s` : "获取验证码"}
                </button>
              </div>
              <button className="ab-forward" onClick={forward} disabled={submitting}>
                验证并登录
              </button>
            </div>
          </div>

        </section>
      </div>

      <div className={`ab-toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

const CSS = `
.ab-shell{--bg:#FFD4B8;--orange:#FF7A45;--lav:#9B59B6;--ink:#1A1A1A;--muted:#8b7470;--green:#37C76D;--surface:rgba(255,255,255,.72);--border:rgba(26,26,26,.08);--shadow:0 22px 60px rgba(95,45,30,.14);--ease:cubic-bezier(.2,.8,.2,1);
min-height:100vh;padding-top:max(56px,env(safe-area-inset-top,0px));padding-bottom:max(34px,env(safe-area-inset-bottom,0px));display:grid;place-items:center;position:relative;overflow:hidden;background:var(--bg);font-family:'PingFang SC','PingFang TC',-apple-system,BlinkMacSystemFont,'Noto Sans SC',system-ui,sans-serif;color:var(--ink);line-height:1.2;letter-spacing:-.01em}
.ab-shell *{box-sizing:border-box}
/* 视频背景模式：外壳透明让上层视频透出；内容居中悬浮，卡片更简约通透 */
.ab-shell--video{background:transparent}
.ab-shell--video .ab-phone{align-content:center;min-height:100dvh;padding-top:0}
.ab-shell--video .ab-stage{min-height:auto;width:100%}
.ab-shell--video .ab-card{background:rgba(255,255,255,.6);border-color:rgba(255,255,255,.7);box-shadow:0 20px 50px rgba(95,45,30,.14);backdrop-filter:blur(20px) saturate(1.1)}
.ab-shell--video .ab-hero{background:rgba(248,255,250,.58)}
.ab-shell--video .ab-modal{background:transparent;backdrop-filter:none}
.ab-shell--video .ab-modal .ab-card{background:rgba(255,255,255,.78);box-shadow:0 22px 55px rgba(95,45,30,.18)}
.ab-shell--video .ab-micro{display:none}
.ab-shell--video .ab-field{margin-bottom:6px}
.ab-shell--video .ab-hint{opacity:.7}
.ab-shell button,.ab-shell input{font:inherit}
.ab-shell button{border:0;cursor:pointer;color:inherit;background:transparent}
.ab-wallpaper{position:absolute;inset:0;overflow:hidden}
.ab-wallpaper img{width:100%;height:100%;object-fit:cover;filter:saturate(1.04);transform:scale(1.02)}
.ab-wallpaper::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,248,244,.28) 52%,rgba(255,244,238,.62));pointer-events:none}
.ab-orb{position:absolute;border-radius:999px;filter:blur(20px);opacity:.55;animation:ab-float 8s var(--ease) infinite alternate}
.ab-orb.one{width:160px;height:160px;background:#ff8b4f;left:-46px;top:13%}
.ab-orb.two{width:120px;height:120px;background:#b78cff;right:-34px;top:28%;animation-delay:-2s}
.ab-orb.three{width:110px;height:110px;background:#c9d9f6;left:58%;bottom:8%;animation-delay:-4s}
@keyframes ab-float{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(18px,-20px,0) scale(1.08)}}
.ab-phone{width:min(100%,390px);min-height:min(812px,100vh);padding:0 22px;position:relative;display:grid;align-content:center;z-index:1}
.ab-stage{min-height:650px;position:relative;display:grid;align-items:center}
.ab-screen{display:none;animation:ab-rise .45s var(--ease) both}
.ab-screen.active{display:block}
@keyframes ab-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.ab-card{background:var(--surface);border:1px solid var(--border);border-radius:28px;box-shadow:var(--shadow);backdrop-filter:blur(18px);padding:28px 24px}
/* 携程风格：登录卡片图层范围扩大——占满宽度、更大更饱满 */
.ab-form{width:100%;max-width:100%;border-radius:30px;padding:42px 26px;margin:0 auto;aspect-ratio:1/1.618;display:flex;flex-direction:column;justify-content:flex-start;gap:8px}
.ab-form-logo{display:block;width:96px;height:96px;margin:0 auto 44px;border-radius:24px;object-fit:cover;box-shadow:0 12px 28px rgba(55,95,42,.16)}
.ab-form .ab-field{margin-bottom:0}
.ab-form .ab-line-input{height:48px;font-size:17px}
.ab-form .ab-otp-row{gap:12px;margin-top:20px}
.ab-form .ab-forward{width:100%;height:52px;margin:36px auto 0;font-size:17px}
.ab-hero{text-align:center;padding:34px 24px 24px}
/* 数字人打招呼样式（仿豆包：圆形浅底 + 半身挥手视频 + 你好我是小天）——独立悬浮在浮窗上方 */
.ab-greet{display:flex;flex-direction:column;align-items:center;margin:0 0 20px}
.ab-greet-avatar{width:150px;height:150px;border-radius:50%;overflow:hidden;background:linear-gradient(180deg,#dbeafe 0%,#eaf4ff 100%);display:grid;place-items:center;box-shadow:0 16px 34px rgba(60,110,160,.2)}
.ab-greet-avatar video{width:100%;height:100%;object-fit:cover;object-position:center 42%}
.ab-greet-title{display:flex;align-items:center;gap:10px;margin:18px 0 0;font-size:24px;font-weight:800;letter-spacing:-.01em;color:var(--ink)}
.ab-greet-title b{font-weight:800}
.ab-greet-dot{width:12px;height:12px;border-radius:50%;background:#37C76D;box-shadow:0 0 0 4px rgba(55,199,109,.18)}
/* ===== 豆包式登录排布复刻 ===== */
.db-login,.db-tips{position:fixed;inset:0;z-index:10;width:100%;max-width:430px;margin:0 auto;display:flex;flex-direction:column;align-items:center;background:#fff;padding:calc(env(safe-area-inset-top,0px) + 14px) 22px calc(env(safe-area-inset-bottom,0px) + 18px);text-align:center;overflow-y:auto}
.db-tips{justify-content:center;background:linear-gradient(180deg,#eef7e6 0%,#dff0c8 100%);padding-top:calc(env(safe-area-inset-top,0px) + 10px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 14px)}
.db-tips-bg{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.db-tips-bg img{position:absolute;left:50%;top:50%;width:108%;max-width:420px;transform:translate(-50%,-50%);opacity:.22;-webkit-mask-image:radial-gradient(68% 62% at 50% 42%,#000 0%,#000 54%,transparent 100%);mask-image:radial-gradient(68% 62% at 50% 42%,#000 0%,#000 54%,transparent 100%)}
.db-tips .db-top,.db-tips .db-avatar,.db-tips .db-hello,.db-tips .db-panel{position:relative;z-index:1}
.db-panel{margin-top:18px;width:100%;background:#fff;border:1px solid rgba(255,152,0,.24);border-radius:24px;box-shadow:0 16px 38px rgba(70,110,50,.18);padding:20px 18px 18px}
.db-tips-body{font-size:14.5px;line-height:1.8;color:#4a5a3a;margin:0 0 16px;text-align:left}
.legal-link{color:#1F7A3A;font-weight:800;text-decoration:none;text-underline-offset:3px;cursor:pointer}
.legal-link:active{text-decoration:underline}
.db-top{position:relative;width:100%;height:40px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.db-top-title{font-size:16px;font-weight:700;color:#1a1a1a}
.db-close{position:absolute;right:0;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.06);color:#8a8a8a;font-size:20px;line-height:1;display:grid;place-items:center}
.db-avatar{width:188px;height:188px;flex:0 0 auto;border-radius:50%;overflow:hidden;background:radial-gradient(48% 44% at 50% 48%,rgba(234,243,255,.22),rgba(214,232,251,.08) 70%,rgba(214,232,251,0) 100%);margin:10px 0 0;display:grid;place-items:center;box-shadow:0 6px 14px rgba(60,110,160,.08);transform:translateZ(0)}
.db-avatar video{width:126%;height:126%;object-fit:cover;object-position:center 42%;transform:translateY(-7%);filter:saturate(.99) contrast(1)}
.db-hello{display:flex;flex:0 0 auto;flex-direction:column;align-items:center;justify-content:center;gap:4px;margin:12px 0 0;max-width:350px;font-family:'PingFang SC','PingFang TC',-apple-system,BlinkMacSystemFont,'Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;font-size:24px;font-weight:950;letter-spacing:-.02em;line-height:1.24;color:#f7fff6;text-align:center;text-shadow:0 2px 4px rgba(9,83,34,.86),0 1px 0 rgba(0,54,20,.72)}
.db-hello-line{display:flex;width:9.2em;max-width:100%;justify-content:space-between;white-space:nowrap;text-align:justify}
.db-hello-line:first-child{width:8.72em}
.db-hello-line:nth-child(2){transform:translateX(10px)}
.db-char{display:inline-block;opacity:0;animation:db-char-in .42s ease forwards}
@keyframes db-char-in{from{opacity:0;transform:translateY(8px);filter:blur(4px)}to{opacity:1;transform:none;filter:blur(0)}}
.db-hello b{font-weight:800}
.db-hello-dot{width:16px;height:16px;border-radius:50%;background:#8a8a8a}
.db-actions{width:100%;display:flex;flex-direction:column;gap:10px}
.db-btn{width:100%;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px;font-weight:700;position:relative}
.db-btn svg{position:absolute;left:22px;top:50%;transform:translateY(-50%)}
.db-btn-primary{background:linear-gradient(180deg,#2E9B50 0%,#1F7A3A 100%);color:#fff;box-shadow:0 10px 22px rgba(31,122,58,.28)}
.db-btn-primary:active{transform:scale(.99)}
.db-btn-ghost{background:#fff;color:#1a1a1a;border:1px solid #ececec;box-shadow:0 2px 8px rgba(0,0,0,.03)}
.db-foot{width:100%;margin-top:22px;display:flex;flex-direction:column;align-items:center;gap:14px}
.db-agree{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.5;color:#9a9a9a;text-align:left;cursor:pointer}
.db-agree b{font-weight:600;color:#5a5a5a}
.db-radio{flex:0 0 auto;margin-top:1px;width:18px;height:18px;border-radius:50%;border:1.5px solid #cfcfcf;position:relative}
.db-agree.on .db-radio{border-color:#37C76D;background:#37C76D}
.db-agree.on .db-radio::after{content:"";position:absolute;left:5px;top:2px;width:5px;height:9px;border:2px solid #fff;border-top:0;border-left:0;transform:rotate(45deg)}
.db-skip{font-size:15px;font-weight:600;color:#2f6bff}
/* 主登录页：延续圆形小天 + 下方悬浮窗 */
.login-greeting{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(206px * 0.09);padding:calc((100dvh - 500px) * 0.26) 0 calc((100dvh - 500px) * 0.74)}
.login-avatar{width:206px;height:206px;margin:0 0 18px;z-index:2}
.login-panel{position:relative;z-index:1;width:100%;border-radius:24px;background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.75);box-shadow:0 20px 50px rgba(70,110,50,.16);backdrop-filter:blur(16px);padding:30px 24px 22px;text-align:center}
.login-logo-wrap{width:78px;height:78px;margin:0 auto 14px;border-radius:22px;background:linear-gradient(135deg,#5fd972,#27bf6b);display:grid;place-items:center;box-shadow:0 16px 28px rgba(55,199,109,.28)}
.login-logo-wrap .ab-brand{width:54px;height:54px;object-fit:contain;margin:0}
.login-panel h1{color:#1a9b4d;font-size:25px;font-weight:800;margin:0 0 8px;line-height:1.15}
.login-cta{width:100%;height:52px;border-radius:18px;background:#fff;color:#222;font-weight:700;box-shadow:0 16px 35px rgba(55,199,109,.18);transition:.18s var(--ease);margin-top:30px}
.login-cta:active{transform:scale(.97)}
.login-agree{display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;line-height:1.45;color:#8a7772;margin-top:28px;cursor:pointer}
.login-agree .legal-link{color:#1a9b4d;font-weight:800}
.login-agree .ab-radio{border-color:#b7aaa6;background:transparent}
.login-agree.on .ab-radio{background:#1a9b4d;border-color:#1a9b4d}
.ab-logo{width:58px;height:36px;margin:0 auto 28px;position:relative}
.ab-face{position:absolute;width:32px;height:32px;border:4px solid #ff9800;border-radius:50%;background:#fff8ee}
.ab-face:first-child{left:0}.ab-face:last-child{right:0}
.ab-face::before,.ab-face::after{content:"";position:absolute;top:8px;width:3px;height:3px;background:#ff9800;border-radius:50%}
.ab-face::before{left:8px}.ab-face::after{right:8px}
.ab-smile{position:absolute;left:11px;top:16px;width:8px;height:4px;border-bottom:2px solid #ff9800;border-radius:0 0 10px 10px}
.ab-eyebrow{position:absolute;right:6px;top:5px;width:6px;height:2px;background:#ff9800;transform:rotate(35deg);border-radius:4px}
.ab-shell h1{font-size:28px;line-height:1.12;margin:0 0 10px;font-weight:700;letter-spacing:-.02em}
.ab-shell h2{font-size:20px;text-align:center;margin:8px 0 16px;font-weight:700}
.ab-shell p{margin:0}
.ab-sub{font-size:15px;line-height:1.55;color:#55423f}
.ab-cta{width:100%;height:52px;border-radius:18px;background:var(--orange);color:#fff;font-weight:700;box-shadow:0 14px 30px rgba(255,122,69,.28);transition:.18s var(--ease);margin-top:34px}
.ab-cta:active{transform:scale(.97)}
.ab-narrow{width:150px;margin:0 auto;display:block}
.ab-ghost{display:inline-block;margin-top:34px;text-decoration:underline;color:#5a4744;font-weight:600}
.ab-hint{font-size:12px;color:#a28d88;margin-top:4px}
.ab-agree{display:flex;gap:8px;align-items:flex-start;text-align:left;font-size:12px;line-height:1.45;color:#8a7772;margin-top:34px;cursor:pointer}
.ab-agree b{color:var(--orange);font-weight:600}
.ab-radio{width:14px;height:14px;border:1px solid #8d817e;border-radius:50%;flex:0 0 auto;margin-top:1px}
.ab-agree.on .ab-radio{border:4px solid var(--orange)}
.ab-shake{animation:ab-shake .34s linear}
.ab-dot-shake{animation:ab-shake .34s linear}
@keyframes ab-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.ab-topbar{display:flex;align-items:center;justify-content:center;margin-bottom:60px;position:relative}
.ab-profile .ab-topbar{margin-bottom:24px}
.ab-back{position:absolute;left:0;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.45);font-size:24px;line-height:1}
.ab-title{font-size:17px;font-weight:700}
.ab-field{margin-bottom:28px}
.ab-line-input{width:100%;height:42px;border:0;border-bottom:2px solid var(--green);background:transparent;text-align:center;outline:0;color:var(--ink);font-weight:600}
.ab-line-input.ab-left{text-align:left}
.ab-line-input::placeholder{color:#b5aaa7;font-weight:500}
.ab-otp-row{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:8px;align-items:end}
.ab-send{height:38px;border:1.5px solid #65A85A!important;border-radius:999px;background:rgba(255,255,255,.62);color:#2F7D32;font-weight:700;transition:.2s}
.ab-send.sent{border-color:#65A85A!important;background:rgba(101,168,90,.12);color:#2F7D32}
.ab-forward{width:138px;height:46px;display:block;margin:60px auto 0;border:1.5px solid #65A85A!important;border-radius:18px;background:rgba(255,255,255,.62);color:#20351d;font-weight:700}
.ab-micro{text-align:center;color:#b19f9a;font-size:12px;margin-top:5px}
.ab-switch{display:flex;justify-content:space-between;margin-top:24px;font-size:13px}
.ab-linkgreen{color:#19a43d;font-weight:700}
.ab-linkgreen.ab-center{display:block;margin:36px auto 0}
.ab-avatar{width:72px;height:72px;border-radius:22px;margin:18px auto 0;border:1px solid rgba(26,26,26,.22);display:grid;place-items:center;background:#fff;color:#999;transition:.2s}
.ab-avatar.picked{background:linear-gradient(135deg,#ffd4b8,#c9d9f6);color:var(--orange);transform:rotate(-2deg)}
.ab-avatar svg{width:42px}
.ab-name{text-align:center;margin:22px 0 22px}
.ab-gender{display:flex;align-items:center;justify-content:space-between;margin:0 12px 22px}
.ab-choice{width:38px;height:38px;border-radius:50%;border:1px solid rgba(26,26,26,.28);background:rgba(255,255,255,.54);font-weight:700}
.ab-choice.sel{border-color:var(--orange);color:var(--orange);box-shadow:0 0 0 5px rgba(255,122,69,.12)}
.ab-picker{margin:8px 6px 24px;height:96px;display:grid;grid-template-columns:1fr 1fr 1fr;position:relative}
.ab-picker::before,.ab-picker::after{content:"";position:absolute;left:0;right:0;height:1px;background:rgba(26,26,26,.18)}
.ab-picker::before{top:34px}.ab-picker::after{bottom:34px}
.ab-wheel{height:96px;overflow-y:auto;scroll-snap-type:y mandatory;text-align:center;z-index:1;scrollbar-width:none;padding:32px 0}
.ab-wheel::-webkit-scrollbar{display:none}
.ab-wheel div{height:32px;scroll-snap-align:center;color:#9f928f;font-weight:600;line-height:32px}
.ab-wheel div.mid{color:var(--ink);font-size:17px}
.ab-tree{width:150px;height:150px;margin:24px auto 18px;position:relative}
.ab-tree .crown{position:absolute;inset:8px 0 auto;width:150px;height:96px;background:#4CAF65;border-radius:55% 45% 50% 50%;box-shadow:24px 10px 0 #5EB976,-20px 16px 0 #64BA72}
.ab-tree .trunk{position:absolute;left:67px;bottom:0;width:18px;height:62px;background:#80411f;border-radius:12px 12px 4px 4px}
.ab-score{font-weight:800;color:#35a852}
.ab-modal{position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:rgba(255,238,227,.64);z-index:5}
.ab-modal .ab-card{background:rgba(255,255,255,.92)}
.ab-modal-body{font-size:14px;line-height:1.6;color:#433634}
.ab-modal-body b{color:var(--orange);font-weight:600}
.ab-modal-green{background:rgba(223,244,228,.72)}
.ab-modal-green .ab-card{background:rgba(248,255,250,.94);border-color:rgba(30,120,60,.14)}
.ab-modal-green h2{color:#1e8a44}
.ab-modal-green .ab-modal-body b{color:#1e8a44}
.ab-cta-green{background:#37C76D;box-shadow:0 14px 30px rgba(55,199,109,.30)}
.ab-brand{display:block;width:84px;height:84px;margin:0 auto 22px;border-radius:22px;object-fit:cover;box-shadow:0 12px 28px rgba(30,120,60,.24)}
.ab-hero-green{background:linear-gradient(180deg,rgba(230,250,236,.82),rgba(248,255,250,.82));border-color:rgba(30,120,60,.14)}
.ab-hero-green h1{color:#1e8a44}
.ab-hero-green .ab-agree.on .ab-radio{border-color:#1e8a44}
.ab-hero-green .ab-agree b{color:#1e8a44}
.ab-exit{width:100%;height:42px;color:#777;text-decoration:underline;margin-top:8px}
.ab-toast{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.96);opacity:0;background:rgba(32,21,21,.92);color:#fff;border-radius:999px;padding:11px 18px;font-size:13px;transition:.25s;z-index:60;white-space:nowrap;pointer-events:none;box-shadow:0 12px 30px rgba(0,0,0,.18)}
.ab-toast.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (prefers-reduced-motion:reduce){.ab-shell *,.ab-shell *::before,.ab-shell *::after{animation:none!important;transition:none!important}}
`;
