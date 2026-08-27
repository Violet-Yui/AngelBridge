"use client";

import { type FormEvent, useState } from "react";
import Image from "next/image";
import { Mic, Pencil, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { tsqApi } from "@/lib/tsq/api";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import type { ChatMessage } from "@/lib/tsq/types";

const initialMessageKeys = [
  ["xiaotian", "tsq.xiaotian.messages.welcome"],
  ["me", "tsq.xiaotian.messages.offer"],
  ["xiaotian", "tsq.xiaotian.messages.timeQuestion"],
  ["me", "tsq.xiaotian.messages.timeAnswer"],
  ["xiaotian", "tsq.xiaotian.messages.locationQuestion"],
  ["me", "tsq.xiaotian.messages.locationAnswer"],
  ["xiaotian", "tsq.xiaotian.messages.exchangeQuestion"],
  ["me", "tsq.xiaotian.messages.exchangeAnswer"],
] as const;

export default function XiaotianChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessageKeys.map(([senderId, key], index) => ({
      id: `initial-${index}`,
      senderId,
      body: t(key),
      createdAt: "",
      status: "sent",
    })),
  );
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || pending) return;

    const optimisticId = `pending-${Date.now()}`;
    setMessages((current) => [
      ...current.filter((message) => message.status !== "failed"),
      { id: optimisticId, senderId: "me", body, createdAt: t("tsq.xiaotian.justNow"), status: "sending" },
    ]);
    setDraft("");
    setError(undefined);
    setPending(true);

    try {
      const result = await tsqApi.sendXiaotianMessage({ body });
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticId),
        result.userMessage,
        result.reply,
      ]);
    } catch (cause) {
      setMessages((current) => current.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ));
      setDraft(body);
      setError(cause instanceof Error ? cause.message : t("tsq.xiaotian.sendFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <FlowShell title={t("tsq.xiaotian.title")} subtitle={t("tsq.xiaotian.subtitle")} right="bell">
      <section data-el="xiaotian-chat" className="relative overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white/72 shadow-[var(--brand-shadow-md)] backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#e9f7ff] to-transparent" />
        <div className="relative max-h-[calc(100dvh-260px)] space-y-3 overflow-y-auto px-3 pb-4 pt-4">
          {messages.map((message) => (
            <ChatBubble key={message.id} from={message.senderId === "me" ? "me" : "ai"} text={message.body} status={message.status} />
          ))}
          {pending && <ChatBubble from="ai" text={t("tsq.xiaotian.thinking")} status="sending" />}
          <article className="rounded-[18px] border border-[#f1dba7] bg-[#fff8ea] p-3 shadow-[0_8px_16px_rgba(180,120,40,.08)]">
            <div className="mb-2 flex items-center justify-between">
              <b className="text-[16px] text-[#071D3A]">{t("tsq.xiaotian.summaryTitle")}</b>
              <Pencil className="h-4 w-4 text-[#2679ff]" />
            </div>
            <ul className="space-y-1.5 text-[13px] leading-relaxed text-[#243b5a]">
              <li>• {t("tsq.xiaotian.summaryOffer")}</li>
              <li>• {t("tsq.xiaotian.summaryNeed")}</li>
              <li>• {t("tsq.xiaotian.summaryBoundary")}</li>
            </ul>
          </article>
        </div>
      </section>
      <form data-el="xiaotian-chat-form" onSubmit={handleSubmit} className="mt-3">
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white p-2 shadow-[var(--brand-shadow-sm)]">
          <input
            data-el="xiaotian-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={t("tsq.xiaotian.inputLabel")}
            placeholder={t("tsq.xiaotian.placeholder")}
            className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[#243b5a] outline-none placeholder:text-muted-foreground"
          />
          <Mic className="h-5 w-5 text-neutral-500" />
          <button
            data-el="xiaotian-chat-send"
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label={pending ? t("tsq.xiaotian.sending") : t("tsq.xiaotian.send")}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#5B8DEF] text-white shadow-[0_8px_18px_rgba(91,141,239,.28)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className={`h-5 w-5 ${pending ? "animate-pulse" : ""}`} />
          </button>
        </div>
        {error && <p role="alert" className="mt-2 px-3 text-[12px] text-red-600">{error} · {t("tsq.xiaotian.retryHint")}</p>}
      </form>
    </FlowShell>
  );
}

function ChatBubble({ from, text, status = "sent" }: { from: "ai" | "me"; text: string; status?: ChatMessage["status"] }) {
  const isMe = from === "me";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <XiaotianAvatar size={38} />}
      <div className={`max-w-[74%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_6px_14px_rgba(55,95,42,.08)] ${isMe ? "rounded-br-sm bg-[#ccefdc] text-[#153b2a]" : "rounded-bl-sm bg-white text-[#243b5a]"} ${status === "failed" ? "border border-red-200" : ""}`}>
        {text}
      </div>
      {isMe && <span className="grid h-8 w-8 place-items-center rounded-full border border-[#e3c27c] bg-[#9dc4e4] text-white"><Image src={TSQ_ASSETS.pet} alt="你" width={22} height={22} className="opacity-0" />你</span>}
    </div>
  );
}
