"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Mic, Smile, Send, Check, CalendarClock, Route, Sparkles, Settings } from "lucide-react";
import { TSQ_ASSETS } from "@/lib/tsq/assets";
import { usePetStore } from "@/stores/pet-store";
import { getPetVisual, type PetVisual } from "@/lib/tsq/pets";
import { cn } from "@/utils/utils";
import { angelbridgeApi, subscribeConversation } from "@/lib/angelbridge-api";
import type { ConversationMessage } from "@/lib/angelbridge-types";
import { getSession } from "@/lib/angelbridge-session";
import { toast } from "sonner";

type Message = { id: string; side: "them" | "me" | "bridge"; time: string; text: string; };
type Thread = { name: string; status: string; emoji: string; messages: Message[]; xiaotian?: boolean; handle?: string };

const THREADS: Record<string, Thread> = {
  c2: { name: "设计小站", status: "桥约伙伴 · 在线", emoji: "🎨", handle: "designspot", messages: [
    { id: "1", side: "them", time: "12:18", text: "那我们周四下午视频对一下项目细节～" },
    { id: "2", side: "me", time: "12:20", text: "可以，我把提案先整理给你。" },
    { id: "3", side: "them", time: "12:22", text: "太好了，顺便看看品牌照片的方向。" },
    { id: "4", side: "bridge", time: "12:23", text: "桥约卡片：设计支持 ↔ 摄影合作 · 周四 15:00 · 西湖边咖啡馆" },
    { id: "5", side: "me", time: "12:24", text: "我已经留出时间了。" },
  ] },
  c3: { name: "小树芽", status: "好友 · 在线", emoji: "🎸", handle: "shuya", messages: [
    { id: "1", side: "them", time: "昨天 19:08", text: "今晚一起云练琴吗？" },
    { id: "2", side: "me", time: "昨天 19:10", text: "可以，我先调下音。" },
    { id: "3", side: "them", time: "昨天 19:11", text: "好呀，我发你一个和弦练习。" },
    { id: "4", side: "me", time: "昨天 19:13", text: "收到，等下见。" },
  ] },
  c4: { name: "植物研究所", status: "好友 · 交换中", emoji: "🪴", handle: "plantlab", messages: [
    { id: "1", side: "them", time: "昨天 16:42", text: "多肉已经打包好啦，约个时间交换～" },
    { id: "2", side: "me", time: "昨天 16:45", text: "我周六上午过去拿，顺便把土配好。" },
    { id: "3", side: "them", time: "昨天 16:46", text: "太好了，我也带了小盆。" },
    { id: "4", side: "bridge", time: "昨天 16:47", text: "桥约卡片：多肉盆栽 ↔ 设计课程名额 · 周六 10:30 · 江边集市" },
  ] },
  c5: { name: "胶片旅人", status: "陌生人 · 询问中", emoji: "📷", handle: "filmtraveler", messages: [
    { id: "1", side: "them", time: "周一 10:00", text: "在吗？想聊聊相机换课程的事。" },
    { id: "2", side: "me", time: "周一 10:03", text: "在的，你可以先说说相机型号。" },
    { id: "3", side: "them", time: "周一 10:05", text: "理光的，成色不错。" },
    { id: "4", side: "me", time: "周一 10:06", text: "我看看课程安排，晚点回你。" },
  ] },
};

const FALLBACK_THREAD: Thread = { name: "小林", status: "桥约伙伴 · 在线", emoji: "🌿", handle: "chengzi", messages: [
  { id: "1", side: "them", time: "14:18", text: "想一起做品牌拍摄。" },
  { id: "2", side: "me", time: "14:19", text: "可以，先约时间。" },
  { id: "3", side: "them", time: "14:20", text: "周六下午可以吗？" },
  { id: "4", side: "bridge", time: "14:21", text: "桥约卡片：拍摄 ↔ 课程 · 周六下午 · 西湖区咖啡馆" },
  { id: "5", side: "me", time: "14:22", text: "我把时间留给你。" },
] };

export function MessageChatScreen() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <MessageChatContent />
    </Suspense>
  );
}

function ChatLoading() {
  return (
    <div className="fixed inset-0 z-[60] mx-auto flex h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col gap-3 bg-white px-3" style={{ paddingTop: "calc(max(20px, env(safe-area-inset-top, 0px)) + 8px)" }}>
      <div className="h-[68px] animate-pulse rounded-[24px] bg-[color:var(--soft)]/70" />
      <div className="mt-2 h-16 w-2/3 animate-pulse rounded-[22px] bg-[color:var(--soft)]/50" />
      <div className="ml-auto h-14 w-1/2 animate-pulse rounded-[22px] bg-[color:var(--soft)]/60" />
      <div className="h-16 w-2/3 animate-pulse rounded-[22px] bg-[color:var(--soft)]/50" />
    </div>
  );
}

function MessageChatContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const key = params.get("thread") ?? "c2";
  const queryName = params.get("name");
  const queryAvatar = params.get("avatar");
  const queryHandle = params.get("handle");
  const matchId = params.get("matchId") ?? undefined;

  if (key === "xiaotian") {
    const xiaotianThread: Thread = {
      name: t("tsq.chat.xiaotianName"),
      status: t("tsq.chat.xiaotianStatus"),
      emoji: "🌱",
      xiaotian: true,
      messages: [
        { id: "1", side: "them", time: t("tsq.chat.justNow"), text: t("tsq.chat.xiaotianHi") },
        { id: "2", side: "them", time: t("tsq.chat.justNow"), text: "我为你新匹配到 3 个换物机会，要看看吗？" },
        { id: "3", side: "me", time: t("tsq.chat.justNow"), text: "好呀，帮我看看有没有能换胶片相机的。" },
        { id: "4", side: "them", time: t("tsq.chat.justNow"), text: "已经帮你筛了 2 个高匹配对象，我把你的「设计课程名额」作为可置换资源推荐了出去～" },
      ],
    };
    return <ChatFrame thread={xiaotianThread} />;
  }

  const thread = THREADS[key] ?? (queryName ? {
    name: queryName,
    status: "刚刚建立联系",
    emoji: queryAvatar || "🌿",
    handle: queryHandle || key,
    messages: [
      { id: "hello-1", side: "them", time: t("tsq.chat.justNow"), text: `你好，我是${queryName}。很高兴在天使桥认识你～` },
      { id: "hello-2", side: "bridge", time: t("tsq.chat.justNow"), text: `你可以先和${queryName}打个招呼，聊聊彼此的资源和需求。` },
    ],
  } satisfies Thread : FALLBACK_THREAD);
  return <ChatFrame thread={thread} conversationId={THREADS[key] ? undefined : key} matchId={matchId} />;
}

function ChatFrame({ thread, conversationId, matchId }: { thread: Thread; conversationId?: string; matchId?: string }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0;
  const appliedPet = usePetStore((s) => s.appliedPet);
  const appliedPetName = usePetStore((s) => s.appliedPetName);
  // 通过 useSyncExternalStore 判断是否已在客户端水合，避免 SSR/CSR 形象不一致
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  // 小天会话中所有灵宠头像/形象跟随用户已保存的灵宠设置；水合前用默认小天避免 hydration 抖动
  const xiaotianVisual: PetVisual = isClient ? getPetVisual(appliedPet) : { type: "image", src: TSQ_ASSETS.pet };
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const [remoteMessages, setRemoteMessages] = useState<Message[] | null>(conversationId ? [] : null);
  const [bridgeStatus, setBridgeStatus] = useState<"pending" | "accepted" | "reschedule">("pending");
  const messages = useMemo(
    () => remoteMessages ?? [...thread.messages, ...extraMessages],
    [thread.messages, extraMessages, remoteMessages],
  );

  useEffect(() => {
    if (!conversationId) return;
    const accountId = getSession()?.accountId;
    const controller = new AbortController();
    const toUiMessage = (message: ConversationMessage): Message => ({
      id: message.messageId,
      side: message.type !== "text" && message.type !== "image"
        ? "bridge"
        : message.senderPersonaId === accountId ? "me" : "them",
      time: new Date(message.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      text: message.text || (message.images.length > 0 ? "[图片]" : "桥约状态已更新"),
    });
    angelbridgeApi.getMessages(conversationId).then((items) => {
      setRemoteMessages(items.map(toUiMessage));
      if (items.length > 0) void angelbridgeApi.markConversationRead(conversationId);
    }).catch((error) => toast.error(error instanceof Error ? error.message : "读取聊天失败"));
    void subscribeConversation(conversationId, (incoming) => {
      const next = toUiMessage(incoming);
      setRemoteMessages((current) => current?.some((item) => item.id === next.id)
        ? current
        : [...(current ?? []), next]);
      if (incoming.senderPersonaId !== accountId) void angelbridgeApi.markConversationRead(conversationId);
    }, controller.signal).catch((error) => {
      if (!controller.signal.aborted) console.error("SSE 连接中断", error);
    });
    return () => controller.abort();
  }, [conversationId]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    if (conversationId) {
      const localId = `local-${Date.now()}`;
      setRemoteMessages((current) => [...(current ?? []), {
        id: localId,
        side: "me",
        time: t("tsq.chat.justNow"),
        text,
      }]);
      setDraft("");
      try {
        const sent = await angelbridgeApi.sendMessage(conversationId, text);
        const next: Message = {
          id: sent.messageId,
          side: "me",
          time: new Date(sent.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          text: sent.text,
        };
        setRemoteMessages((current) => {
          const withoutLocal = (current ?? []).filter((item) => item.id !== localId);
          return withoutLocal.some((item) => item.id === next.id) ? withoutLocal : [...withoutLocal, next];
        });
      } catch (error) {
        setRemoteMessages((current) => (current ?? []).filter((item) => item.id !== localId));
        toast.error(error instanceof Error ? error.message : "发送失败");
      }
      return;
    }
    setExtraMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        side: "me",
        time: t("tsq.chat.justNow"),
        text,
      },
    ]);
    setDraft("");
  }

  function updateBridgeStatus(status: "accepted" | "reschedule") {
    setBridgeStatus(status);
    setExtraMessages((current) => [
      ...current,
      {
        id: `bridge-${status}-${Date.now()}`,
        side: "me",
        time: t("tsq.chat.justNow"),
        text: status === "accepted" ? t("tsq.chat.acceptedReply") : t("tsq.chat.rescheduleReply"),
      },
    ]);
  }

  return (
    <div
      data-el="chat-detail-page"
      className="fixed inset-0 z-[60] mx-auto flex h-[100dvh] w-full max-w-[var(--app-max-width)] flex-col bg-white pb-[max(18px,env(safe-area-inset-bottom,0px))]"
    >
      {/* 顶部会话栏：固定不随消息滚动 */}
      <header
        data-el="chat-header"
        className="relative z-10 shrink-0 border-b border-[color:var(--border)]/60 bg-white/85 px-3.5 backdrop-blur-xl"
        style={{ paddingTop: "calc(max(28px, env(safe-area-inset-top, 0px)) + 14px)", paddingBottom: "16px" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/messages" data-el="chat-back" aria-label={t("tsq.chat.back")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--soft)]/70 text-[color:var(--deep)] active:scale-95"><ArrowLeft className="h-5 w-5" /></Link>
          {thread.xiaotian ? (
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_18px_rgba(69,103,50,.15)]">{xiaotianVisual.type === "image" ? <Image src={xiaotianVisual.src} alt={thread.name} width={44} height={44} className="h-full w-full object-cover" /> : <span className="text-2xl leading-none">{xiaotianVisual.emoji}</span>}</span>
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#fff1d1] to-[#9fd58b] text-2xl shadow-[0_8px_18px_rgba(69,103,50,.15)]">{thread.emoji}</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate text-[17px] font-bold tracking-tight text-[color:var(--deep)]">{thread.xiaotian ? `${appliedPetName} · 智能助手` : thread.name}{thread.xiaotian && <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[color:var(--purple)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--purple)]"><Sparkles className="h-2.5 w-2.5" />AI</span>}</h1>
            <p className="truncate text-[12px] text-muted-foreground">{thread.status}</p>
          </div>
          {thread.xiaotian ? (
            <Link href="/pets" aria-label="灵宠设置" data-el="xiaotian-pet-settings" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)]/70 text-[color:var(--deep)] active:scale-95">
              <Settings className="h-4.5 w-4.5" />
            </Link>
          ) : (
            <div className="rounded-full bg-[color:var(--soft)]/70 px-3 py-1 text-[12px] font-semibold text-[color:var(--deep)]">{t("tsq.chat.oneToOne")}</div>
          )}
        </div>
      </header>

      {/* 消息区：唯一可滚动区域 */}
      <main data-el="chat-message-list" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-8 pt-5 tsq-noscroll">
        <div className="mx-auto w-fit rounded-full bg-[color:var(--soft)]/60 px-3 py-1 text-[11px] text-muted-foreground shadow-sm">{t("tsq.chat.todayFlow")}</div>
        {messages.map((message) => message.side === "bridge" ? <BridgeCard key={message.id} status={bridgeStatus} onStatusChange={updateBridgeStatus} time={message.time} text={message.text} matchId={matchId} /> : <ChatRow key={message.id} message={message} xiaotian={thread.xiaotian} visual={xiaotianVisual} profileHref={thread.handle ? `/discover/user/${thread.handle}` : undefined} />)}
      </main>

      {/* 底部输入栏：始终固定在底部，不随滚动消失 */}
      <footer
        data-el="chat-composer"
        className="relative z-10 mx-3 mb-3 shrink-0 rounded-[26px] border border-[color:var(--border)]/70 bg-white/92 px-3 pt-3 shadow-[0_12px_28px_rgba(38,68,32,.12)] backdrop-blur-xl"
        style={{ paddingBottom: "max(18px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-end gap-2">
          <button type="button" aria-label={t("tsq.chat.voice")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--deep)] active:scale-95"><Mic className="h-5 w-5" /></button>
          <button type="button" aria-label={t("tsq.chat.emoji")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--deep)] active:scale-95"><Smile className="h-5 w-5" /></button>
          <div className="flex min-h-10 flex-1 items-center rounded-[999px] bg-[color:var(--soft)]/50 px-4 py-2 shadow-inner"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" aria-label={t("tsq.chat.input")} placeholder={t("tsq.chat.input")} /></div>
          <button type="button" aria-label={t("tsq.chat.add")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[color:var(--deep)] active:scale-95"><Plus className="h-5 w-5" /></button>
          <button
            type="button"
            onClick={sendMessage}
            disabled={!canSend}
            aria-label={t("tsq.chat.send")}
            data-el="chat-send"
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-200",
              canSend
                ? "scale-100 bg-[color:var(--primary)] text-white shadow-[0_10px_20px_rgba(95,174,109,.4)] active:scale-90"
                : "scale-90 cursor-not-allowed bg-[color:var(--soft)] text-muted-foreground shadow-none",
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

function ChatRow({ message, xiaotian, visual, profileHref }: { message: Message; xiaotian?: boolean; visual?: PetVisual; profileHref?: string }) {
  const isMe = message.side === "me";
  const avatar = isMe ? (
    <div className="grid h-8 w-8 place-items-center rounded-2xl bg-[color:var(--soft)] text-[17px] shadow-sm">🌱</div>
  ) : xiaotian ? (
    <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm">{visual?.type === "emoji" ? <span className="text-lg leading-none">{visual.emoji}</span> : <Image src={visual?.type === "image" ? visual.src : TSQ_ASSETS.pet} alt="灵宠助手" width={32} height={32} className="h-full w-full object-cover" />}</span>
  ) : profileHref ? (
    <Link href={profileHref} aria-label="查看对方主页" className="grid h-8 w-8 place-items-center rounded-2xl bg-white text-lg shadow-sm active:scale-95">🌿</Link>
  ) : (
    <div className="grid h-8 w-8 place-items-center rounded-2xl bg-white text-lg shadow-sm">🌿</div>
  );
  return (
    <div className={cn("flex px-1", isMe ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[76%] flex-col gap-1.5", isMe ? "items-end" : "items-start")}>
        {avatar}
        <div className={cn("whitespace-pre-line rounded-[22px] px-4 py-2.5 text-[14px] leading-relaxed shadow-[0_8px_18px_rgba(53,92,48,.12)]", isMe ? "rounded-tr-sm bg-[linear-gradient(145deg,#A7D982,#5FAE6D)] text-[#153316]" : "rounded-tl-sm bg-white/92 text-[color:var(--deep)]")}>{message.text}</div>
        <div className={cn("text-[11px] text-muted-foreground", isMe ? "text-right" : "text-left")}>{message.time}</div>
      </div>
    </div>
  );
}

function BridgeCard({ time, text, status, onStatusChange, matchId }: { time: string; text: string; status: "pending" | "accepted" | "reschedule"; onStatusChange: (status: "accepted" | "reschedule") => void; matchId?: string }) {
  const { t } = useTranslation();
  const isAccepted = status === "accepted";
  const isRescheduled = status === "reschedule";
  return <article data-el="bridge-chat-card" className="mx-1 rounded-[24px] border border-[#efdfb9] bg-[linear-gradient(145deg,rgba(255,248,232,.98),rgba(255,239,199,.88))] p-3 shadow-[0_18px_38px_rgba(88,122,58,.12)]"><div className="flex items-center justify-between"><div className="text-[13px] font-bold text-[color:var(--deep)]">🪵 {t("tsq.chat.bridgeTip")}</div><span className="rounded-full bg-[#A86B36]/12 px-2 py-0.5 text-[11px] font-semibold text-[#A86B36]">{time}</span></div><p className="mt-2 text-[13px] leading-relaxed text-[#5e684a]">{text}</p>{matchId ? <Link href={`/bridge/schedule?matchId=${encodeURIComponent(matchId)}`} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] px-3 py-2 text-[12px] font-semibold text-white active:scale-95"><Route className="h-3.5 w-3.5" />查看真实桥约状态</Link> : (isAccepted || isRescheduled) ? <div className="mt-3 space-y-2"><div className="flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-2 text-[12px] font-semibold text-[color:var(--deep)]">{isAccepted ? <Check className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}{isAccepted ? t("tsq.chat.accepted") : t("tsq.chat.rescheduled")}</div><Link href={isAccepted ? "/bridge/confirm" : "/bridge/schedule"} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] px-3 py-2 text-[12px] font-semibold text-white active:scale-95"><Route className="h-3.5 w-3.5" />{isAccepted ? t("tsq.chat.enterBridge") : t("tsq.chat.openSchedule")}</Link></div> : <div className="mt-3 flex gap-2"><button onClick={() => onStatusChange("accepted")} className="flex items-center gap-1 rounded-full bg-[#A86B36] px-3 py-1.5 text-[12px] font-semibold text-[#FFF6DD] active:scale-95"><Check className="h-3.5 w-3.5" />{t("tsq.chat.accept")}</button><button onClick={() => onStatusChange("reschedule")} className="flex items-center gap-1 rounded-full bg-[color:var(--soft)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--deep)] active:scale-95"><CalendarClock className="h-3.5 w-3.5" />{t("tsq.chat.reschedule")}</button></div>}</article>;
}
