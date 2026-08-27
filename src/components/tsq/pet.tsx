"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Sparkles, Gift, Target, TrendingUp, Sun, MessageCircle } from "lucide-react";
import { getZodiacPet } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { ME } from "@/lib/tsq/data";

// 常驻悬浮的电子灵宠 + 气泡对话 + 可展开面板（好运包/匹配项/等级/心情）
export function Pet() {
  const { open, bubble, close, selectedPetId } = usePetStore();
  const router = useRouter();
  const { t } = useTranslation();
  const bubbleText = bubble || t("tsq.pet.defaultBubble");
  const selectedPet = getZodiacPet(selectedPetId);

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
        className="pointer-events-none fixed left-1/2 z-[46] w-full max-w-[430px] -translate-x-1/2 px-3"
        style={{ bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 84px)" }}
      >
        <div className="pointer-events-auto flex w-full items-end gap-1.5">
          <button
            data-el="pet-avatar"
            onClick={() => {
              close();
              router.push("/xiaotian/chat");
            }}
            className="relative shrink-0 active:scale-95"
            aria-label={t("tsq.pet.title")}
          >
            <Image
              src={selectedPet.image}
              alt={selectedPet.name}
              width={72}
              height={86}
              className="tsq-pet-float h-[86px] w-[72px] object-contain drop-shadow-[0_10px_18px_rgba(45,120,45,0.24)]"
              priority
            />
          </button>
          {!open && (
            <div className="mb-4 max-w-[150px] rounded-2xl rounded-bl-sm border border-border bg-white px-2.5 py-1.5 text-xs leading-snug text-[color:var(--deep)] shadow-[0_8px_18px_rgba(55,95,42,0.1)]">
              {bubbleText}
            </div>
          )}
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
