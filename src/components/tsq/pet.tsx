"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Gift, Target, TrendingUp, Sun, MessageCircle } from "lucide-react";
import { getZodiacPet } from "@/lib/tsq/pets";
import { getDockedPetPresentation } from "@/lib/tsq/pet-presentation";
import { usePetStore } from "@/stores/pet-store";
import { INVITES, ME } from "@/lib/tsq/data";

// 常驻悬浮的电子灵宠 + 气泡对话 + 可展开面板（好运包/匹配项/等级/心情）
export function Pet() {
  const { open, bubble, close, selectedPetId } = usePetStore();
  const router = useRouter();
  const { t } = useTranslation();
  const opportunityCount = INVITES.filter((invite) => invite.status === "pending").length;
  const bubbleText = bubble || t("tsq.pet.defaultBubble", { count: opportunityCount });
  const selectedPet = getZodiacPet(selectedPetId);
  const [position, setPosition] = useState({ x: 12, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, moved: false });
  const canvasWidth = typeof window === "undefined" ? 430 : Math.min(window.innerWidth, 430);
  const isDocked = position.x === 0 || position.x === canvasWidth - 48;
  const presentation = getDockedPetPresentation({ isDocked, dragging });

  useEffect(() => {
    const saved = window.localStorage.getItem("tsq-pet-position");
    if (saved) {
      try { setPosition(JSON.parse(saved)); } catch { /* use default */ }
    }
  }, []);

  function startDrag(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y, moved: false };
    setDragging(true);
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    const canvasWidth = Math.min(window.innerWidth, 430);
    const nextX = dragRef.current.originX + event.clientX - dragRef.current.startX;
    const nextY = dragRef.current.originY + event.clientY - dragRef.current.startY;
    dragRef.current.moved = dragRef.current.moved || Math.abs(event.clientX - dragRef.current.startX) > 5 || Math.abs(event.clientY - dragRef.current.startY) > 5;
    setPosition({ x: Math.min(Math.max(nextX, -48), canvasWidth - 24), y: Math.min(Math.max(nextY, -window.innerHeight + 180), window.innerHeight - 180) });
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    const canvasWidth = Math.min(window.innerWidth, 430);
    const nearLeft = position.x < 40;
    const nearRight = position.x > canvasWidth - 112;
    const dockX = nearLeft ? 0 : nearRight ? canvasWidth - 48 : position.x;
    const docked = { x: dockX, y: position.y };
    setPosition(docked);
    window.localStorage.setItem("tsq-pet-position", JSON.stringify(docked));
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
        className={presentation.containerClassName}
        style={{ ...presentation.containerStyle, left: "max(0px, calc(50% - 215px))", transform: `translateX(${position.x}px) translateY(${position.y}px)`, bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 84px)" }}
      >
        <div className="flex w-full items-end">
          <button
            data-el="pet-avatar"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={() => {
              if (dragRef.current.moved) { dragRef.current.moved = false; return; }
              close();
              router.push("/xiaotian/chat");
            }}
            className="relative shrink-0 cursor-grab touch-none active:scale-95"
            style={{ touchAction: "none" }}
            aria-label={t("tsq.pet.title")}
          >
            {!open && isDocked && opportunityCount > 0 && <span aria-label="有新通知" className="absolute right-1 top-1 z-10 h-3 w-3 rounded-full border-2 border-white bg-red-500" />}
            <Image
              src={selectedPet.image}
              alt={selectedPet.name}
              width={72}
              height={86}
              className="tsq-pet-float h-[86px] w-[72px] object-contain drop-shadow-[0_10px_18px_rgba(45,120,45,0.24)]"
              style={presentation.imageStyle}
              priority
            />
          </button>
        </div>
      </div>

      {!open && !isDocked && opportunityCount > 0 && <div className="fixed z-[46] max-w-[150px] rounded-2xl rounded-bl-sm border border-border bg-white px-2.5 py-1.5 text-xs leading-snug text-[color:var(--deep)] shadow-[0_8px_18px_rgba(55,95,42,0.1)]" style={{ left: "max(0px, calc(50% - 215px))", transform: `translateX(${position.x + 76}px) translateY(${position.y - 16}px)`, bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 100px)" }}>{bubbleText}</div>}

      {open && (
        <section
          data-el="pet-panel"
          className="fixed left-1/2 z-[47] w-[calc(100%_-_32px)] max-w-[398px] -translate-x-1/2 rounded-3xl border border-border bg-white p-4 shadow-[0_20px_50px_rgba(55,95,42,0.16)]"
          style={{ bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 82px)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-[color:var(--deep)]">
              <Sparkles className="h-4 w-4" /> {t("tsq.pet.title")}
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
            <MessageCircle className="h-4 w-4" /> 和小天说
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
