"use client";

import type { ChatMessage } from "@/lib/tsq/api";

export function ChatMessageList({ messages }: { messages: ChatMessage[] }) {
  return <div className="space-y-3 px-4 py-5 pb-32" data-el="chat-message-list">
    {messages.map((message, index) => <div key={message.id}>
      {(index === 0 || messages[index - 1]?.createdAt !== message.createdAt) && <p className="mb-3 text-center text-[11px] text-muted-foreground">{message.createdAt}</p>}
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${message.senderId === "me" ? "ml-auto bg-[color:var(--primary)] text-white" : "bg-white text-foreground shadow-[var(--brand-shadow-sm)]"}`}>{message.body}<div className="mt-1 text-[10px] opacity-60">{message.status === "sent" ? "已送达" : message.createdAt}</div></div>
    </div>)}
  </div>;
}
