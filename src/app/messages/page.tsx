"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { PageHeader } from "@/components/tsq/page-header";
import { tsqApi } from "@/lib/tsq/api";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import { cn } from "@/utils/utils";

type Conversation = Awaited<ReturnType<typeof tsqApi.getMessageList>>[number];

export default function MessagesPage() {
  const { t } = useTranslation();
  const [strangerOpen, setStrangerOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState(false);

  const loadMessages = useCallback(() => {
    void tsqApi.getMessageList().then(
      (nextConversations) => {
        setConversations(nextConversations);
        setError(false);
      },
      () => setError(true),
    );
  }, []);

  useEffect(() => {
    let isCurrent = true;

    void tsqApi.getMessageList().then(
      (nextConversations) => {
        if (isCurrent) {
          setConversations(nextConversations);
          setError(false);
        }
      },
      () => {
        if (isCurrent) {
          setError(true);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  const ai = conversations?.filter((c) => c.zone === "ai") ?? [];
  const friends = conversations?.filter((c) => c.zone === "friend") ?? [];
  const strangers = conversations?.filter((c) => c.zone === "stranger") ?? [];
  const strangerUnread = strangers.reduce((n, c) => n + c.unread, 0);

  return (
    <AppShell>
      <PageHeader title={t("tsq.messages.title")} subtitle={t("tsq.messages.subtitle")} />

      <div className="mt-3 space-y-5 px-4">
        {!conversations && !error && <div data-el="messages-loading" className="mx-4 mt-3 h-28 animate-pulse rounded-[20px] bg-white/70" />}
        {error && <button data-el="messages-retry" onClick={loadMessages}>{t("tsq.messages.retry")}</button>}
        {conversations?.length === 0 && <p data-el="messages-empty">{t("tsq.messages.empty")}</p>}
        {conversations && conversations.length > 0 && (
          <>
        {/* 小天 AI 置顶 */}
        <section>
          {ai.map((c) => (
            <Link
              key={c.id}
              href="/xiaotian/chat"
              data-el="message-ai"
              className="flex w-full items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--soft)]/50 p-3.5 text-left active:scale-[0.99]"
            >
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white text-2xl shadow-sm">
                <Image src={TSQ_ASSETS.pet} alt="小天" width={48} height={48} className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <b className="text-[15px] text-[color:var(--deep)]">{c.name}</b>
                  <span className="flex items-center gap-0.5 rounded-full bg-[color:var(--purple)]/15 px-1.5 py-0.5 text-[10px] text-[color:var(--purple)]">
                    <Sparkles className="h-2.5 w-2.5" /> AI
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-neutral-600">{c.last}</p>
              </div>
              <ConvMeta time={c.time} unread={c.unread} />
            </Link>
          ))}
        </section>

        {/* 好友 */}
        <section>
          <ZoneLabel title={t("tsq.messages.friends")} count={friends.length} />
          <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white">
            {friends.map((c, i) => (
              <ConvRow key={c.id} c={c} last={i === friends.length - 1} />
            ))}
          </div>
        </section>

        {/* 陌生人（弱化可折叠） */}
        <section>
          <button
            onClick={() => setStrangerOpen((v) => !v)}
            data-el="message-stranger-toggle"
            className="mb-2 flex w-full items-center gap-1.5 text-[15px] font-semibold text-neutral-500"
          >
            {strangerOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {t("tsq.messages.strangers")}
            <span className="text-[13px] font-normal text-muted-foreground">
              {strangers.length}
              {strangerUnread > 0 && ` · ${strangerUnread} ${t("tsq.messages.unread")}`}
            </span>
          </button>
          {strangerOpen && (
            <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white/70">
              {strangers.map((c, i) => (
                <ConvRow key={c.id} c={c} last={i === strangers.length - 1} muted />
              ))}
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ZoneLabel({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
      {title}
      <span className="text-[13px] font-normal text-muted-foreground">{count}</span>
    </h2>
  );
}

function ConvRow({
  c,
  last,
  muted,
}: {
  c: Conversation;
  last: boolean;
  muted?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <button
      data-el="message-row"
      onClick={() => { toast(t("tsq.messages.open", { name: c.name })); router.push(`/messages/${c.id}`); }}
      className={cn(
        "flex w-full items-center gap-3 p-3.5 text-left active:bg-[color:var(--soft)]/30",
        !last && "border-b border-[#f1f2ec]",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-xl",
          muted ? "bg-neutral-100" : "bg-[color:var(--soft)]",
        )}
      >
        {c.zone === "ai" ? (
          <Image src={TSQ_ASSETS.pet} alt="小天" width={44} height={44} className="h-full w-full object-cover" />
        ) : (
          c.emoji
        )}
      </span>
      <div className="min-w-0 flex-1">
        <b className="text-[15px]">{c.name}</b>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{c.last}</p>
      </div>
      <ConvMeta time={c.time} unread={c.unread} />
    </button>
  );
}

function ConvMeta({ time, unread }: { time: string; unread: number }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-[12px] text-muted-foreground">{time}</span>
      {unread > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--warm)] px-1 text-[11px] font-semibold text-white">
          {unread}
        </span>
      )}
    </div>
  );
}
