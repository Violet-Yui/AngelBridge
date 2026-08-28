"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Ellipsis, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/tsq/app-shell";
import { ChatComposer } from "@/components/tsq/chat-composer";
import { ChatMessageList } from "@/components/tsq/chat-message-list";
import { tsqApi } from "@/lib/tsq/api";
import type { ThreadMessages } from "@/lib/tsq/types";

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { t } = useTranslation();
  const [data, setData] = useState<ThreadMessages>(); const [error, setError] = useState<string>(); const [text, setText] = useState(""); const [sending, setSending] = useState(false); const [threadId, setThreadId] = useState(""); const [menu, setMenu] = useState(false);
  useEffect(() => { let active = true; params.then(({ threadId: id }) => { setThreadId(id); return tsqApi.getThreadMessages(id); }).then((result) => active && setData(result)).catch((cause) => active && setError(cause.message)); return () => { active = false; }; }, [params]);
  async function sendMessage() { const body = text.trim(); if (!body || !data || sending) return; setSending(true); setError(undefined); try { const message = await tsqApi.sendMessage(threadId, { body }); setData((current) => current ? { ...current, messages: [...current.messages, message] } : current); setText(""); } catch (cause) { setError(cause instanceof Error ? cause.message : t("tsq.chat.sendFailed")); } finally { setSending(false); } }
  return <AppShell><header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--bg-canvas)] px-4"><Link href="/messages" aria-label={t("tsq.chat.back")} className="grid h-11 w-11 place-items-center rounded-full bg-white"><ArrowLeft className="h-5 w-5" /></Link><div className="min-w-0 flex-1"><h1 className="truncate text-[18px] font-bold">{data?.thread.title ?? t("tsq.messages.title")}</h1><p className="text-xs text-[color:var(--deep)]">{t("tsq.chat.online")}</p></div><button aria-label={t("tsq.chat.more")} onClick={() => setMenu((open) => !open)} className="grid h-11 w-11 place-items-center rounded-full bg-white"><Ellipsis className="h-5 w-5" /></button></header>{menu && <div className="absolute right-4 top-16 z-30 w-40 rounded-2xl bg-white p-2 shadow-[var(--brand-shadow-md)]"><Link href={`/messages/${threadId}/settings`} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm hover:bg-[color:var(--soft)]"><Settings2 className="h-4 w-4" />{t("tsq.chat.relationshipSettings")}</Link></div>}{error && !data ? <div className="m-4 rounded-2xl bg-white p-6 text-center text-sm text-muted-foreground">{error}</div> : !data ? <div className="m-4 h-40 animate-pulse rounded-2xl bg-[color:var(--soft)]" /> : <><ChatMessageList messages={data.messages} />{error && <p className="px-4 text-center text-xs text-destructive">{t("tsq.chat.sendFailed")}</p>}<ChatComposer value={text} onChange={setText} onSubmit={sendMessage} sending={sending} /></>}</AppShell>;
}
