"use client";

import Image from "next/image";
import { useState } from "react";
import { Briefcase, Eye, EyeClosed, Guitar, Handshake, Heart, HeartPulse, Leaf, Map, UserRound } from "lucide-react";
import { CURRENT_LIFE_TREE_STAGE, LIFE_TREE_ASSETS } from "@/lib/tsq/life-tree-assets";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/utils/utils";

// 树上可点击热点：点击后在上方弹出气泡（自动消失）
function TreeHotspot({
  className,
  style,
  bubble,
  bubbleTone = "green",
  ariaLabel,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  bubble: string;
  bubbleTone?: "green" | "warm";
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collected, setCollected] = useState(false);

  function pop() {
    if (collected) return;
    // 点击瞬间：本体消失 + 弹出气泡，气泡约 1.9s 后淡出
    setCollected(true);
    setOpen(false);
    requestAnimationFrame(() => setOpen(true));
    window.setTimeout(() => setOpen(false), 1900);
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={pop}
      disabled={collected && !open}
      className={cn("pointer-events-auto absolute z-[2] active:scale-90", className)}
      style={style}
    >
      {/* 采集后本体隐藏，仅保留气泡 */}
      <span className={cn("block transition-all duration-200", collected && "pointer-events-none scale-50 opacity-0")}>
        {children}
      </span>
      {open && (
        <span
          role="status"
          className={cn(
            "tsq-bubble-pop pointer-events-none absolute -top-11 left-1/2 z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold shadow-[0_10px_22px_rgba(55,95,42,.2)]",
            bubbleTone === "warm"
              ? "bg-[#fff4d9] text-[#bd7c10]"
              : "bg-white text-[color:var(--deep)]",
          )}
        >
          {bubble}
          <span
            aria-hidden
            className={cn(
              "absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px]",
              bubbleTone === "warm" ? "bg-[#fff4d9]" : "bg-white",
            )}
          />
        </span>
      )}
    </button>
  );
}

// 盛放生命树 Hero：占据首屏上半屏的第一视觉焦点
export function LifeTreeHero() {
  const treeAsset = LIFE_TREE_ASSETS[CURRENT_LIFE_TREE_STAGE];
  const { dashboard } = useDashboard();
  const ownTags = dashboard?.lifeTree?.offers.filter((tag) => tag.visible).map((tag) => tag.label).slice(0, 5) ?? [];
  const needTags = dashboard?.lifeTree?.needs.filter((tag) => tag.visible).map((tag) => tag.label).slice(0, 5) ?? [];
  const [showTags, setShowTags] = useState(false);

  return (
    <section className="relative">
      {/* 沉浸式背景：手绘水彩生命树 */}
      <div className="tsq-hero-scrim pointer-events-none absolute inset-x-0 top-[146px] flex h-[190px] items-start justify-center overflow-visible">
        <div className="relative h-[190px] w-[228px] overflow-hidden">
          <span className="absolute left-1/2 top-[42px] h-[110px] w-[164px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(136,210,101,.16),transparent_70%)] blur-[8px]" />
          <Image
            src={treeAsset.src}
            alt={treeAsset.alt}
            width={228}
            height={190}
            priority
            sizes="228px"
            className="relative z-[1] h-full w-full object-contain opacity-95 drop-shadow-[0_12px_18px_rgba(45,98,34,.12)] saturate-[1.1] contrast-[1.03]"
          />
        </div>
      </div>

      <button
        type="button"
        aria-label={showTags ? "隐藏生命树标签" : "显示生命树标签"}
        aria-pressed={showTags}
        onClick={() => setShowTags((value) => !value)}
        className={cn(
          "absolute left-[20px] top-[198px] z-40 grid h-8 w-8 place-items-center rounded-full bg-white/42 text-[#45623f] shadow-[0_7px_18px_rgba(55,95,42,.12)] ring-1 ring-white/65 backdrop-blur-md transition-all active:scale-95",
          showTags && "bg-white/58 text-[#1f6f3a] shadow-[0_8px_22px_rgba(47,111,43,.16)]",
        )}
      >
        {showTags ? <Eye className="h-4.5 w-4.5" /> : <EyeClosed className="h-4.5 w-4.5" />}
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-[142px] z-20 mx-auto h-[156px] max-w-[var(--app-max-width)] px-3">
        {/* 闭眼时：个人积累的硕果仍挂靠在人生树枝叶上 */}
        <div className={cn("absolute inset-0 transition-all duration-300", showTags ? "scale-90 opacity-0" : "scale-100 opacity-100")}>
          {[
            { left: 190, top: 42, className: "bg-[#ffd85a] shadow-[#d89b20]/25" },
            { left: 224, top: 68, className: "bg-[#ff9d66] shadow-[#c96d32]/22" },
          ].map((fruit, index) => (
            <span
              key={index}
              aria-hidden
              className={cn(
                "absolute h-3.5 w-3.5 rounded-full ring-1 ring-white/70 shadow-[0_5px_10px_var(--tw-shadow-color)] transition-transform duration-300",
                fruit.className,
              )}
              style={{ left: fruit.left, top: fruit.top }}
            >
              <span className="absolute -top-1 left-1/2 h-1.5 w-2 -translate-x-1/2 rounded-[50%] bg-[#6faa45]" />
            </span>
          ))}
        </div>

        {/* 开眼时：左右资源标签显现，硕果转移进入资产标签 */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-200 ease-out",
            showTags ? "scale-100 opacity-100" : "scale-95 opacity-0",
          )}
        >
        <svg
          aria-hidden
          viewBox="0 0 430 156"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="ownBranch" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="rgba(65,137,57,.03)" />
              <stop offset="1" stopColor="rgba(65,137,57,.22)" />
            </linearGradient>
            <linearGradient id="needBranch" x1="1" x2="0" y1="0" y2="0">
              <stop offset="0" stopColor="rgba(202,136,28,.03)" />
              <stop offset="1" stopColor="rgba(202,136,28,.22)" />
            </linearGradient>
          </defs>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" opacity="0.78">
            <path d="M174 50 C165 39 153 27 138 18" stroke="url(#ownBranch)" />
            <path d="M168 70 C151 60 132 49 116 43" stroke="url(#ownBranch)" />
            <path d="M178 89 C161 83 142 76 126 70" stroke="url(#ownBranch)" />
            <path d="M174 106 C153 104 129 100 108 100" stroke="url(#ownBranch)" />
            <path d="M186 109 C166 113 142 117 122 122" stroke="url(#ownBranch)" />
            <path d="M256 50 C267 36 277 24 292 18" stroke="url(#needBranch)" />
            <path d="M262 70 C281 60 298 49 314 43" stroke="url(#needBranch)" />
            <path d="M252 89 C270 84 288 76 304 70" stroke="url(#needBranch)" />
            <path d="M256 106 C277 104 301 100 322 100" stroke="url(#needBranch)" />
            <path d="M244 109 C264 113 286 119 304 126" stroke="url(#needBranch)" />
          </g>
          <g opacity="0.34">
            {([
              [174, 50, "#68ad4d"], [168, 70, "#68ad4d"], [178, 89, "#68ad4d"],
              [174, 106, "#68ad4d"], [186, 109, "#68ad4d"],
              [256, 50, "#d6a13d"], [262, 70, "#d6a13d"], [252, 89, "#d6a13d"],
              [256, 106, "#d6a13d"], [244, 109, "#d6a13d"],
            ] satisfies Array<[number, number, string]>).map(([cx, cy, fill], index) => (
              <circle key={index} cx={cx} cy={cy} r="1.45" fill={fill} />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0">
          {ownTags.map((tag, index) => {
            const pos = [
              { left: 76, top: 8 },
              { left: 48, top: 36 },
              { left: 64, top: 61 },
              { left: 34, top: 92 },
              { left: 58, top: 120 },
            ][index];
            return (
              <span
                key={tag}
                className="absolute flex max-w-[148px] items-center gap-1.5 truncate rounded-full bg-white/30 px-2 py-1 text-[11px] font-bold leading-none tracking-[0.02em] text-[#1d8139] shadow-[0_4px_12px_rgba(43,113,48,.06)] ring-1 ring-white/42 backdrop-blur-sm"
                style={pos}
              >
                {index === 0 && <UserRound className="h-3 w-3 shrink-0 text-[#4b9b4b]" />}
                {index === 1 && <Heart className="h-3 w-3 shrink-0 fill-[#f6a3b4] text-[#d66b83]" />}
                {index === 2 && <HeartPulse className="h-3 w-3 shrink-0 text-[#3ca66b]" />}
                {index === 3 && <span className="relative h-3.5 w-3.5 shrink-0 rounded-full bg-[#ffd85a] shadow-[0_2px_5px_rgba(216,155,32,.28)] ring-1 ring-white/70"><span className="absolute -top-1 left-1/2 h-1.5 w-2 -translate-x-1/2 rounded-[50%] bg-[#6faa45]" /></span>}
                {index === 4 && <span className="relative h-3.5 w-3.5 shrink-0 rounded-full bg-[#ff9d66] shadow-[0_2px_5px_rgba(201,109,50,.26)] ring-1 ring-white/70"><span className="absolute -top-1 left-1/2 h-1.5 w-2 -translate-x-1/2 rounded-[50%] bg-[#78b84d]" /></span>}
                <span className="truncate">{tag}</span>
              </span>
            );
          })}
        </div>
        <div className="absolute inset-0">
          {needTags.map((tag, index) => {
            const pos = [
              { right: 76, top: 8 },
              { right: 48, top: 36 },
              { right: 64, top: 61 },
              { right: 34, top: 92 },
              { right: 52, top: 116 },
            ][index];
            return (
              <span
                key={tag}
                className="absolute flex max-w-[126px] items-center gap-1.5 truncate rounded-full bg-white/30 px-2 py-1 text-[11px] font-bold leading-none tracking-[0.02em] text-[#c17a09] shadow-[0_4px_12px_rgba(184,113,16,.06)] ring-1 ring-white/42 backdrop-blur-sm"
                style={pos}
              >
                {index === 0 && <Map className="h-3 w-3 shrink-0 text-[#d59624]" />}
                {index === 1 && <Heart className="h-3 w-3 shrink-0 fill-[#ffc27b] text-[#d78b21]" />}
                {index === 2 && <Handshake className="h-3 w-3 shrink-0 text-[#c88920]" />}
                {index === 3 && <Briefcase className="h-3 w-3 shrink-0 text-[#c88920]" />}
                {index === 4 && <Guitar className="h-3 w-3 shrink-0 text-[#c88920]" />}
                <span className="truncate">{tag}</span>
              </span>
            );
          })}
        </div>
      </div>
      </div>

      {/* 可交互层：阳光粒子 + 枝干嫩叶 */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-[146px] z-30 h-[190px] scale-[.78] origin-top transition-all duration-200 ease-out",
          showTags ? "opacity-0 scale-[.72]" : "opacity-100 scale-[.78]",
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          {/* 阳光粒子 · 点击提示好友来访 */}
          <TreeHotspot
            className="left-[74%] top-[18%]"
            bubble="有一位好友来访啦～"
            bubbleTone="warm"
            ariaLabel="有一位好友来访啦～"
          >
            <span className="tsq-spark grid h-4 w-4 place-items-center rounded-full bg-[#fff7dd]/80 shadow-[0_0_10px_rgba(242,196,80,.45)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffcf4d]" />
            </span>
          </TreeHotspot>
          <TreeHotspot
            className="left-[16%] top-[34%]"
            bubble="有一位好友来访啦～"
            bubbleTone="warm"
            ariaLabel="有一位好友来访啦～"
          >
            <span className="tsq-spark grid h-3.5 w-3.5 place-items-center rounded-full bg-[#fff7dd]/75 shadow-[0_0_9px_rgba(242,196,80,.38)]" style={{ animationDelay: "-3.1s" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffcf4d]" />
            </span>
          </TreeHotspot>

          {/* 枝干嫩叶 · 点击 +生命值 */}
          <TreeHotspot
            className="left-[30%] top-[42%]"
            bubble="生命值 +5"
            ariaLabel="生命值 +5"
          >
            <span className="tsq-leaf-bud block drop-shadow-[0_3px_5px_rgba(45,120,45,.18)]">
              <Leaf className="h-5 w-5 -rotate-12 fill-[#ccefa6] text-[#5aa746]" />
            </span>
          </TreeHotspot>
          <TreeHotspot
            className="left-[68%] top-[48%]"
            bubble="生命值 +5"
            ariaLabel="生命值 +5"
          >
            <span className="tsq-leaf-bud block drop-shadow-[0_3px_5px_rgba(45,120,45,.16)]" style={{ animationDelay: "-1.8s" }}>
              <Leaf className="h-4.5 w-4.5 rotate-6 fill-[#d6f2ab] text-[#68ad4d]" />
            </span>
          </TreeHotspot>
        </div>
      </div>

      <div className="relative z-[3] h-[340px]" />
    </section>
  );
}
