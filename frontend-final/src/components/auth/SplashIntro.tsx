"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/eazo-assets/att_3dznoeax6q1uxku3-a5d73bdf70-splash-intro.mp4";
// 与画布同色，用于把视频四周“吃”进背景，实现无方框的边缘消融
const CANVAS = "#FFF6F1";

/**
 * 常驻开屏动画氛围背景：视频居中留白呈现于上半部。
 * 移动端安全做法——不在 <video> 上用 mix-blend-mode / mask-image（iOS/微信内核易整块不渲染），
 * 改为在视频上层叠一个同色径向渐变遮罩 div 实现“边缘消融、去方框”，并对视频本身零合成负担。
 * 另加移动端自动播放兜底（ref.play() 重试 + 首次触摸兜底）。
 */
export default function SplashIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // 尝试自动播放；被拦截时挂一次性首触发/滚动兜底
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();

    const onFirstInteract = () => {
      tryPlay();
      window.removeEventListener("touchstart", onFirstInteract);
      window.removeEventListener("pointerdown", onFirstInteract);
    };
    window.addEventListener("touchstart", onFirstInteract, { once: true, passive: true });
    window.addEventListener("pointerdown", onFirstInteract, { once: true });

    return () => {
      window.removeEventListener("touchstart", onFirstInteract);
      window.removeEventListener("pointerdown", onFirstInteract);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 视频：居中留白、偏上摆放。不加混合模式/遮罩，保证移动端稳定渲染 */}
      <div className="absolute inset-x-0 top-0 flex h-[60%] items-start justify-center">
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            className="h-full w-full object-contain px-1 pt-0 [object-position:center_62%] [transform:translateY(-7%)]"
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
          />
          {/* 边缘消融遮罩：同色径向渐变，中心透明、四周渐变为画布色，去掉方框感 */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(88% 84% at 50% 48%, rgba(255,246,241,0) 62%, rgba(255,246,241,.16) 86%, ${CANVAS} 100%)`,
            }}
          />
        </div>
      </div>

      {/* 全屏柔和暖色雾化：统一氛围，弱化视频与浮窗的边界感 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(122% 88% at 50% 30%, rgba(255,246,241,0) 0%, rgba(255,246,241,.10) 62%, rgba(255,246,241,.42) 100%)",
        }}
      />
    </div>
  );
}
