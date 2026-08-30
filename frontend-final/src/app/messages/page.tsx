"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronDown, ChevronRight, UserPlus, Heart, AtSign } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { PageHeader } from "@/components/tsq/page-header";
import { CONVERSATIONS, type Conversation } from "@/lib/tsq/data";
import { getPetVisual, type PetVisual } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { cn } from "@/utils/utils";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import { toast } from "sonner";

const INTERACTION_NOTICES = [
  { label: "新的关注", count: 3, href: "/messages/notifications/follows", icon: UserPlus, cls: "from-[#eaf4ff] to-[#f8fbff] text-[#2679ff]", dot: "bg-[#2679ff]" },
  { label: "赞和收藏", count: 12, href: "/messages/notifications/likes", icon: Heart, cls: "from-[#fff4df] to-[#fffaf0] text-[#f28a2e]", dot: "bg-[#f2a93b]" },
  { label: "评论和@", count: 2, href: "/messages/notifications/comments", icon: AtSign, cls: "from-[#f1ebff] to-[#fbf8ff] text-[color:var(--purple)]", dot: "bg-[color:var(--purple)]" },
];

const MATURE_SHOWCASE_NAMES = new Set(["设计小站", "摄影师小林"]);
const SHOWCASE_FRIENDS = CONVERSATIONS.filter((item) => item.zone === "friend" && !MATURE_SHOWCASE_NAMES.has(item.name));
const SHOWCASE_STRANGERS = CONVERSATIONS.filter((item) => item.zone === "stranger" && !MATURE_SHOWCASE_NAMES.has(item.name));

type ConversationRow = Conversation & { matchId?: string };

export default function MessagesPage() {
  const { t } = useTranslation();
  const [strangerOpen, setStrangerOpen] = useState(false);
  const appliedPet = usePetStore((s) => s.appliedPet);
  const appliedPetName = usePetStore((s) => s.appliedPetName);
  const xiaotianVisual = getPetVisual(appliedPet);

  const [hasPetMessages, setHasPetMessages] = useState(false);
  const [isMatureShowcase, setIsMatureShowcase] = useState(false);
  const [friends, setFriends] = useState<ConversationRow[]>([]);
  const [strangers, setStrangers] = useState<Conversation[]>([]);
  const strangerUnread = strangers.reduce((n, c) => n + c.unread, 0);

  useEffect(() => {
    const matureShowcase = isMatureShowcaseSession();
    if (matureShowcase) {
      Promise.resolve().then(() => {
        setIsMatureShowcase(true);
        setHasPetMessages(false);
        setFriends(SHOWCASE_FRIENDS);
        setStrangers(SHOWCASE_STRANGERS);
      });
      return;
    }
    angelbridgeApi.getPetMessages().then((turns) => setHasPetMessages(turns.length > 0))
      .catch((error) => toast.error(error instanceof Error ? error.message : "读取小天消息失败"));
    angelbridgeApi.getConversations().then((items) => setFriends(items.map((item) => ({
      id: item.conversationId,
      name: item.counterpartDisplayName,
      emoji: "🌱",
      last: item.lastMessage ?? "已经建立连接，打个招呼吧～",
      time: new Date(item.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      unread: item.unreadCount,
      zone: "friend" as const,
      matchId: item.matchId,
    })))).catch((error) => toast.error(error instanceof Error ? error.message : "读取消息失败"));
  }, []);

  const interactionNotices = INTERACTION_NOTICES.map((item) => ({ ...item, count: isMatureShowcase ? item.count : 0 }));

  return (
    <AppShell>
      <PageHeader title={t("tsq.messages.title")} subtitle={t("tsq.messages.subtitle")} />

      <div className="mt-3 space-y-5 px-4">
        {/* 小天 AI 置顶 */}
        <section>
          <Link
            href="/xiaotian/chat"
            data-el="message-ai"
            className="flex w-full items-center gap-3 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--soft)]/50 p-3.5 text-left active:scale-[0.99]"
          >
            <PetAvatar visual={xiaotianVisual} name={appliedPetName} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <b className="text-[15px] text-[color:var(--deep)]">{appliedPetName} · 智能助手</b>
                <span className="flex items-center gap-0.5 rounded-full bg-[color:var(--purple)]/15 px-1.5 py-0.5 text-[10px] text-[color:var(--purple)]">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-neutral-600">
                {hasPetMessages ? `查看与${appliedPetName}的聊天记录` : "暂无聊天记录，点击开始对话"}
              </p>
            </div>
            <ConvMeta time="" unread={0} />
          </Link>
        </section>

        {/* 互动通知 */}
        <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/48 p-3.5 shadow-[0_18px_46px_rgba(55,95,42,.12)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#d9f7c8]/70 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-20 w-20 rounded-full bg-[#fff0bb]/60 blur-2xl" />
          <div className="relative mb-3 flex items-center justify-between">
            <ZoneLabel title="互动通知" count={interactionNotices.reduce((n, item) => n + item.count, 0)} />
          </div>
          <div className="relative grid grid-cols-3 gap-2.5">
            {interactionNotices.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group relative overflow-hidden rounded-[22px] border border-white/75 bg-gradient-to-br p-3.5 shadow-[0_10px_26px_rgba(55,95,42,.08)] ring-1 ring-white/70 backdrop-blur-xl transition active:scale-[.98]",
                    index === 1 && "scale-[1.02] shadow-[0_14px_30px_rgba(242,169,59,.16)]",
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", item.cls)} />
                  <div className="relative">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/78 shadow-sm ring-1 ring-white/80">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black text-white shadow-sm", item.dot)}>{item.count}</span>
                    </div>
                    <b className="block text-[13px] font-black leading-tight text-[#071D3A]">{item.label}</b>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 好友 */}
        <section>
          <ZoneLabel title={t("tsq.messages.friends")} count={friends.length} />
          <div className="overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-white">
            {friends.map((c, i) => (
              <ConvRow key={c.id} c={c} last={i === friends.length - 1} xiaotianVisual={xiaotianVisual} xiaotianName={appliedPetName} />
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
                <ConvRow key={c.id} c={c} last={i === strangers.length - 1} muted xiaotianVisual={xiaotianVisual} xiaotianName={appliedPetName} />
              ))}
            </div>
          )}
        </section>
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
  xiaotianVisual,
  xiaotianName,
}: {
  c: ConversationRow;
  last: boolean;
  muted?: boolean;
  xiaotianVisual: PetVisual;
  xiaotianName: string;
}) {
  const { t } = useTranslation();
  const isAi = c.zone === "ai";
  return (
    <Link
      href={`/messages/chat?thread=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.name)}${c.matchId ? `&matchId=${encodeURIComponent(c.matchId)}` : ""}`}
      data-el="message-row"
      aria-label={t("tsq.messages.open", { name: isAi ? xiaotianName : c.name })}
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
        {isAi ? <PetAvatar visual={xiaotianVisual} name={xiaotianName} size={44} /> : c.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <b className="text-[15px]">{isAi ? `${xiaotianName} · 智能助手` : c.name}</b>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{isAi ? c.last.replaceAll("小天", xiaotianName) : c.last}</p>
      </div>
      <ConvMeta time={c.time} unread={c.unread} />
    </Link>
  );
}

function PetAvatar({ visual, name, size }: { visual: PetVisual; name: string; size: number }) {
  const rounded = size >= 48 ? "rounded-2xl" : "rounded-xl";
  return visual.type === "image" ? (
    <span className={cn("grid place-items-center overflow-hidden bg-white", rounded)} style={{ width: size, height: size }}>
      <Image src={visual.src} alt={name} width={size} height={size} className="h-full w-full object-cover" />
    </span>
  ) : (
    <span className={cn("grid place-items-center bg-white leading-none", rounded)} style={{ width: size, height: size, fontSize: size * 0.52 }} aria-label={name}>
      {visual.emoji}
    </span>
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
