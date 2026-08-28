"use client";

import { ImagePlus, Mic, Paperclip, Send, Smile } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChatAttachmentTray } from "./chat-attachment-tray";

export function ChatComposer({ value, onChange, onSubmit, sending }: { value: string; onChange: (value: string) => void; onSubmit: () => void; sending: boolean }) {
  const { t } = useTranslation();
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const canSend = value.trim().length > 0;
  return <div className="fixed bottom-20 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-[color:var(--border)] bg-[color:var(--bg-canvas)] p-3" data-el="chat-composer">
    {attachmentsOpen && <ChatAttachmentTray onClose={() => setAttachmentsOpen(false)} />}
    <div className="flex items-center gap-1"><button type="button" aria-label={t("tsq.chat.voice")} className="grid h-11 w-11 place-items-center rounded-full text-[color:var(--deep)]"><Mic className="h-5 w-5" /></button><button type="button" aria-label={t("tsq.chat.expression")} className="grid h-11 w-11 place-items-center rounded-full text-[color:var(--deep)]"><Smile className="h-5 w-5" /></button><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={t("tsq.chat.placeholder")} className="min-w-0 flex-1 rounded-full border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none" /><button type="button" aria-label={t("tsq.chat.attachments")} aria-expanded={attachmentsOpen} onClick={() => setAttachmentsOpen((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full text-[color:var(--deep)]"><Paperclip className="h-5 w-5" /></button><button type="button" aria-label={t("tsq.chat.send")} disabled={!canSend || sending} onClick={onSubmit} className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--primary)] text-white disabled:opacity-45"><Send className="h-5 w-5" /></button></div>
    <p className="mt-1 flex items-center gap-1 px-12 text-[10px] text-muted-foreground"><ImagePlus className="h-3.5 w-3.5" />{t("tsq.chat.unavailable")}</p>
  </div>;
}
