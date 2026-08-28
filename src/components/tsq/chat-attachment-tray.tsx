"use client";

import { Camera, FileText, ImagePlus, MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { chatAttachmentOptions } from "./attachment-options";

const icons = { image: ImagePlus, camera: Camera, location: MapPin, file: FileText };

export function ChatAttachmentTray({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return <section data-el="chat-attachment-tray" aria-label={t("tsq.chat.attachments")} className="mb-3 rounded-[22px] border border-[color:var(--border)] bg-white p-3 shadow-[var(--brand-shadow-md)]">
    <div className="mb-2 flex items-center justify-between px-1"><p className="text-xs font-medium text-[color:var(--deep)]">{t("tsq.chat.attachments")}</p><button type="button" onClick={onClose} aria-label={t("common.close")} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground"><X className="h-4 w-4" /></button></div>
    <div className="grid grid-cols-4 gap-2">
      {chatAttachmentOptions.map((option) => {
        const Icon = icons[option.id];
        return <button key={option.id} type="button" onClick={() => toast(t("tsq.chat.unavailable"))} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[color:var(--soft)]/60 text-[color:var(--deep)] active:scale-95"><Icon className="h-5 w-5" /><span className="text-[11px]">{t(option.labelKey)}</span></button>;
      })}
    </div>
  </section>;
}
