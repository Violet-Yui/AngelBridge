"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Gift,
  Target,
  TrendingUp,
  Sun,
  MessageCircle,
} from "lucide-react";
import { getPetVisual } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { ME } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

type PetPosition = { x: number; y: number };
type DragState = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
  lastClientX: number;
};

const PET_WIDTH = 72;
const PET_HEIGHT = 86;
const EDGE_GAP = 10;
const TOP_GAP = 64;
const BOTTOM_GAP = 112;
// 应用可视宽度上限（与外壳 max-w-[430px] 一致）
const APP_MAX_WIDTH = 430;
// 松手时手指横坐标落在应用左/右边缘这个感应带内，即判定为拖出 → 收起隐藏
const HIDE_EDGE_ZONE = 40;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// 计算居中应用容器在视口中的左右边界（宽屏下 app 居中，窄屏下贴满）
function getAppBounds(): { left: number; right: number } {
  if (typeof window === "undefined") return { left: 0, right: APP_MAX_WIDTH };
  const width = Math.min(window.innerWidth, APP_MAX_WIDTH);
  const left = (window.innerWidth - width) / 2;
  return { left, right: left + width };
}

function getInitialPosition(): PetPosition {
  if (typeof window === "undefined") return { x: EDGE_GAP, y: 420 };

  return {
    x: EDGE_GAP,
    y: clamp(
      window.innerHeight * 0.58,
      TOP_GAP,
      Math.max(TOP_GAP, window.innerHeight - PET_HEIGHT - BOTTOM_GAP),
    ),
  };
}

// 拖拽中允许水平方向越界（用于判定是否拖出隐藏），垂直方向仍限制在安全区
function dragPosition(position: PetPosition): PetPosition {
  if (typeof window === "undefined") return position;
  return {
    x: clamp(position.x, -PET_WIDTH, window.innerWidth),
    y: clamp(
      position.y,
      TOP_GAP,
      Math.max(TOP_GAP, window.innerHeight - PET_HEIGHT - BOTTOM_GAP),
    ),
  };
}

function clampPosition(position: PetPosition): PetPosition {
  if (typeof window === "undefined") return position;

  return {
    x: clamp(position.x, EDGE_GAP, window.innerWidth - PET_WIDTH - EDGE_GAP),
    y: clamp(
      position.y,
      TOP_GAP,
      Math.max(TOP_GAP, window.innerHeight - PET_HEIGHT - BOTTOM_GAP),
    ),
  };
}

function dockPosition(position: PetPosition): PetPosition {
  if (typeof window === "undefined") return position;
  const isLeft = position.x + PET_WIDTH / 2 < window.innerWidth / 2;

  return clampPosition({
    x: isLeft ? EDGE_GAP : window.innerWidth - PET_WIDTH - EDGE_GAP,
    y: position.y,
  });
}

// 常驻悬浮的电子灵宠 + 气泡对话 + 可拖拽贴边停靠 / 拖出隐藏
export function Pet() {
  const { open, close } = usePetStore();
  const appliedPet = usePetStore((s) => s.appliedPet);
  const appliedPetName = usePetStore((s) => s.appliedPetName);
  const petVisual = getPetVisual(appliedPet);
  const router = useRouter();
  const { t } = useTranslation();
  const petRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [position, setPosition] = useState<PetPosition>(() => getInitialPosition());
  const [dragging, setDragging] = useState(false);
  const [dockedSide, setDockedSide] = useState<"left" | "right">("left");
  // 隐藏态：拖出边界后小天收起，仅保留边缘的 AI 唤醒小圆标
  const [hiddenSide, setHiddenSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (hiddenSide) return;
      setPosition((current) => {
        const next = dockPosition(current);
        setDockedSide(next.x + PET_WIDTH / 2 < window.innerWidth / 2 ? "left" : "right");
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hiddenSide]);

  const finishDrag = useCallback((pointerId?: number) => {
    const activeDrag = dragRef.current;
    if (!activeDrag) return;

    const releaseX = activeDrag.lastClientX;
    dragRef.current = null;
    setDragging(false);

    // 用松手时手指的横坐标相对应用左右边界判定，避免抓握偏移/坐标钳制造成误判
    const { left, right } = getAppBounds();
    const outLeft = releaseX <= left + HIDE_EDGE_ZONE;
    const outRight = releaseX >= right - HIDE_EDGE_ZONE;

    if (outLeft || outRight) {
      setHiddenSide(outLeft ? "left" : "right");
    } else {
      setPosition((current) => {
        const next = dockPosition(current);
        setDockedSide(next.x + PET_WIDTH / 2 < window.innerWidth / 2 ? "left" : "right");
        return next;
      });
    }

    if (typeof pointerId === "number") {
      try {
        petRef.current?.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
  }, []);

  // 从隐藏态唤醒小天，回到对应侧的停靠位置
  const wakePet = useCallback(() => {
    const side = hiddenSide;
    setHiddenSide(null);
    setPosition((current) => {
      const docked = dockPosition({
        x: side === "right" ? window.innerWidth : 0,
        y: current.y,
      });
      setDockedSide(side ?? "left");
      return docked;
    });
  }, [hiddenSide]);

  // —— 隐藏态：仅渲染边缘的 AI 唤醒小圆标（不显示小天与气泡） —— //
  if (hiddenSide) {
    return (
      <button
        type="button"
        data-el="pet-wake-tab"
        aria-label={t("tsq.pet.wake")}
        onClick={wakePet}
        className={cn(
          "fixed top-1/2 z-[46] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[color:var(--deep)] text-[10px] font-bold text-white shadow-[0_6px_16px_rgba(55,95,42,.32)] backdrop-blur-md transition-transform active:scale-90",
          hiddenSide === "left"
            ? "left-0 -translate-x-1/3 rounded-l-none"
            : "right-0 translate-x-1/3 rounded-r-none",
        )}
      >
        AI
      </button>
    );
  }

  return (
    <>
      {open && (
        <button
          aria-label={t("tsq.pet.collapse")}
          data-el="pet-scrim"
          onClick={close}
          className="fixed inset-0 z-[45] bg-black/5"
        />
      )}

      <div
        data-el="pet-dock-layer"
        className="pointer-events-none fixed z-[46]"
        style={{
          left: position.x,
          top: position.y,
          transition: dragging
            ? "none"
            : "left 450ms cubic-bezier(.18,.88,.24,1.12), top 450ms cubic-bezier(.18,.88,.24,1.12)",
        }}
      >
        <div
          className={cn(
            "pointer-events-auto flex items-end gap-1.5",
            dockedSide === "right" && "flex-row-reverse",
          )}
        >
          <button
            ref={petRef}
            data-el="pet-avatar"
            onPointerDown={(event) => {
              if (open) close();
              const rect = event.currentTarget.getBoundingClientRect();
              dragRef.current = {
                pointerId: event.pointerId,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                moved: false,
                lastClientX: event.clientX,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const activeDrag = dragRef.current;
              if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
              activeDrag.moved = true;
              activeDrag.lastClientX = event.clientX;
              setPosition(
                dragPosition({
                  x: event.clientX - activeDrag.offsetX,
                  y: event.clientY - activeDrag.offsetY,
                }),
              );
            }}
            onPointerUp={(event) => {
              const activeDrag = dragRef.current;
              if (!activeDrag) return;
              const shouldOpenChat = !activeDrag.moved;
              finishDrag(event.pointerId);

              if (shouldOpenChat) {
                close();
                router.push("/xiaotian/chat");
              }
            }}
            onPointerCancel={(event) => finishDrag(event.pointerId)}
            className={cn(
              "relative h-[86px] w-[72px] touch-none rounded-[24px] border-0 bg-transparent p-0 shadow-none",
              "transition-transform active:scale-95",
              dragging
                ? "cursor-grabbing scale-[1.08] rotate-[-2deg]"
                : "cursor-grab tsq-pet-float tsq-pet-live",
            )}
            aria-label={t("tsq.pet.dragLabel")}
          >
            <span className="tsq-pet-body relative block h-full w-full">
              {/* 统一的半透明圆形玻璃底座，使悬浮球在任何位置都一致美观 */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 z-0 mx-auto h-[68px] w-[68px] rounded-full border border-white/70 bg-white/45 shadow-[0_8px_20px_rgba(45,120,45,0.18)] backdrop-blur-md"
              />
              {petVisual.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={petVisual.src}
                  alt={appliedPetName}
                  className="relative z-[1] h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(45,120,45,0.24)] select-none"
                  draggable={false}
                />
              ) : (
                <span
                  className="relative z-[1] grid h-full w-full place-items-center text-[54px] drop-shadow-[0_10px_18px_rgba(45,120,45,0.24)] select-none"
                  aria-label={appliedPetName}
                >
                  {petVisual.emoji}
                </span>
              )}
            </span>
            <span className="absolute -right-1 -top-1 z-10 rounded-full bg-[color:var(--deep)] px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm">AI</span>
          </button>
        </div>
      </div>

      {open && (
        <section
          data-el="pet-panel"
          className="fixed inset-x-4 z-[47] rounded-3xl border border-border bg-white p-4 shadow-[0_20px_50px_rgba(55,95,42,0.16)]"
          style={{ bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 82px)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-[color:var(--deep)]">
              <Sparkles className="h-4 w-4" /> 灵宠{appliedPetName}
            </div>
            <button onClick={close} className="text-sm text-[color:var(--deep)]">
              {t("tsq.pet.collapse")}
            </button>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {t("tsq.pet.note")}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <PetPill icon={<Gift className="h-4 w-4" />} label={t("tsq.pet.luck")} value={ME.luck} />
            <PetPill icon={<Target className="h-4 w-4" />} label={t("tsq.pet.match")} value={9} />
            <PetPill icon={<TrendingUp className="h-4 w-4" />} label={t("tsq.pet.level")} value={`Lv.${ME.level}`} />
            <PetPill icon={<Sun className="h-4 w-4" />} label={t("tsq.pet.mood")} value={ME.mood} />
          </div>
          <Link href="/xiaotian/chat" onClick={close} data-el="pet-chat-entry" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(88,169,66,.24)] active:scale-95">
            <MessageCircle className="h-4 w-4" /> 和{appliedPetName}说
          </Link>
        </section>
      )}
    </>
  );
}

function PetPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-[color:var(--soft)]/60 px-1 py-2.5 text-[color:var(--deep)]">
      {icon}
      <span className="text-base font-bold leading-none">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
