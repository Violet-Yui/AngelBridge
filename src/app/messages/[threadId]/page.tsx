"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { tsqApi } from "@/lib/tsq/api";
import type { ThreadMessages } from "@/lib/tsq/types";

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const [data, setData] = useState<ThreadMessages>(); const [error, setError] = useState<string>(); const [text, setText] = useState("");
  useEffect(() => { params.then(({ threadId }) => tsqApi.getThreadMessages(threadId).then(setData).catch((e) => setError(e.message))); }, [params]);
  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !data) return;
    setData((current) => current ? { ...current, messages: [...current.messages, { id: `local-${Date.now()}`, senderId: "me", body, createdAt: "刚刚", status: "sent" }] } : current);
    setText("");
  }
  return <AppShell><header className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 pb-3 pt-2"><Link href="/messages" aria-label="返回消息" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-4 w-4" /></Link><div><h1 className="text-[18px] font-bold">{data?.thread.title ?? "消息"}</h1><p className="text-xs text-muted-foreground">{data?.thread.updatedAt ?? "加载中"}</p></div></header>{error ? <div className="m-4 rounded-2xl bg-white p-6 text-center text-sm text-muted-foreground">{error}</div> : !data ? <div className="m-4 h-32 animate-pulse rounded-2xl bg-[#edf1eb]" /> : <><div className="space-y-3 px-4 py-5">{data.messages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${message.senderId === "me" ? "ml-auto bg-[color:var(--primary)] text-white" : "bg-white text-neutral-700 shadow-sm"}`}>{message.body}<div className="mt-1 text-[10px] opacity-60">{message.createdAt}</div></div>)}</div><form onSubmit={sendMessage} className="fixed bottom-20 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 gap-2 border-t border-[color:var(--border)] bg-[color:var(--bg-canvas)] p-3"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="写下你的消息…" className="min-w-0 flex-1 rounded-full border border-[color:var(--border)] bg-white px-4 py-2.5 text-sm outline-none" /><button aria-label="发送" className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--primary)] text-white"><Send className="h-4 w-4" /></button></form></>}</AppShell>;
}
