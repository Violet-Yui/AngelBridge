"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Mic, Pencil, Send, Sparkles, XCircle, SmilePlus, Plus, Image as ImageIcon, MapPin, CalendarDays } from "lucide-react";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { findCard } from "@/lib/tsq/data";
import { usePetStore } from "@/stores/pet-store";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { PetOrganizeDraft } from "@/lib/angelbridge-types";
import { toast } from "sonner";

type Msg = { id: string; from: "ai" | "me"; text: string };

const INITIAL: Msg[] = [
  { id: "m0", from: "ai", text: "你好，我是小天 🌱\n有什么想法都可以和我说，我会帮你一起梳理。" },
  { id: "m1", from: "me", text: "我有一个周末闲置工作室，想换一组品牌照片。" },
  { id: "m2", from: "ai", text: "明白啦，我先帮你整理意图。你的工作室可用时间是？" },
  { id: "m3", from: "me", text: "周六和周日白天都可以。" },
  { id: "m4", from: "ai", text: "地点方便公开到什么程度？是否接受仅展示区域信息？" },
  { id: "m5", from: "me", text: "可以先展示区域，不先公开具体门牌。" },
];

export default function XiaotianChatPage() {
  const router = useRouter();
  const search = useSearchParams();
  const petName = usePetStore((s) => s.appliedPetName);
  const inviteMode = search.get("mode") === "invite";
  const sourceCard = findCard(search.get("id") || "");
  const [cancelled, setCancelled] = useState(false);
  const inviteMessages = useMemo<Msg[]>(() => {
    if (inviteMode) {
      return [
        { id: "p0", from: "ai", text: `我看到你想通过我发起邀约，我先帮你把请求整理清楚。` },
        { id: "p1", from: "ai", text: `邀约对象：${sourceCard?.author || "这位发布者"}\n你关注的内容：${sourceCard?.title || "帖子里的互助资源"}\n你的请求：希望建立一次安全、边界清晰的初步沟通，由${petName}先转达来意，再进入双方确认。` },
      ];
    }
    return [{ id: "welcome", from: "ai", text: `你好呀，我是${petName} 🌱 今天想让我帮你找点什么？` }];
  }, [inviteMode, sourceCard, petName]);
  const [messages, setMessages] = useState<Msg[]>(inviteMessages);
  const [hasPetTurns, setHasPetTurns] = useState(false);
  const [organizedDraft, setOrganizedDraft] = useState<PetOrganizeDraft | null>(null);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [toolOpen, setToolOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (inviteMode) {
      setMessages(inviteMessages);
      return;
    }
    let active = true;
    angelbridgeApi.getPetMessages().then((turns) => {
      if (!active) return;
      setHasPetTurns(turns.length > 0);
      setMessages(turns.length === 0 ? inviteMessages : turns.flatMap((turn) => [
        { id: `${turn.turnId}:me`, from: "me" as const, text: turn.userText || "[图片]" },
        { id: `${turn.turnId}:ai`, from: "ai" as const, text: turn.assistantText },
      ]));
      if (turns.length > 0) {
        void updateOrganizedDraft(turns.map((turn) => turn.userText)).catch((error) => {
          toast.error(error instanceof Error ? error.message : "整理卡片更新失败");
        });
      }
    }).catch((error) => toast.error(error instanceof Error ? error.message : "读取小天对话失败"));
    return () => { active = false; };
  }, [inviteMessages, inviteMode]);

  function confirmInvite() {
    setMessages((cur) => [...cur, { id: `me-confirm-${Date.now()}`, from: "me", text: `确认，请${petName}帮我发出邀请。` }]);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      router.push("/xiaotian/bridging?source=invite");
    }, 850);
  }

  function cancelInvite() {
    setCancelled(true);
    setMessages((cur) => [...cur, { id: `me-cancel-${Date.now()}`, from: "me", text: "先不发出邀请。" }, { id: `ai-cancel-${Date.now()}`, from: "ai", text: "好的，我不会发出邀请。你可以继续修改需求，或回到推荐理由看看其他连接方式。" }]);
  }

  async function sendText(text: string) {
    const body = text.trim();
    if (!body || typing) return;
    const mine: Msg = { id: `me-${Date.now()}`, from: "me", text: body };
    setMessages((cur) => [...cur, mine]);
    setDraft("");
    setEmojiOpen(false);
    setToolOpen(false);
    setTyping(true);
    try {
      const turn = await angelbridgeApi.sendPetMessage(body);
      setHasPetTurns(true);
      setMessages((cur) => [...cur, { id: `${turn.turnId}:ai`, from: "ai", text: turn.assistantText }]);
      setTyping(false);
      await updateOrganizedDraft([
        ...messages.filter((message) => message.from === "me").map((message) => message.text),
        body,
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "小天暂时没有回复");
    } finally {
      setTyping(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendText(draft);
  }

  async function updateOrganizedDraft(userTexts: string[]): Promise<PetOrganizeDraft | null> {
    const message = userTexts.filter(Boolean).slice(-6).join("\n").slice(-2000);
    if (!message) return null;
    const result = await angelbridgeApi.organizePetMessage(message);
    setOrganizedDraft(result.draft);
    return result.draft;
  }

  async function editIntent(event?: { preventDefault(): void }) {
    event?.preventDefault();
    const currentDraft = organizedDraft ?? await updateOrganizedDraft(messages.filter((message) => message.from === "me").map((message) => message.text));
    if (currentDraft) sessionStorage.setItem("xiaotian-create-draft", JSON.stringify(currentDraft));
    router.push("/create?source=xiaotian");
  }

  function startVoice() {
    setVoiceActive(true);
    setEmojiOpen(false);
    setToolOpen(false);
    window.setTimeout(() => {
      setVoiceActive(false);
      sendText("语音：我想再补充一下我的需求边界。");
    }, 1000);
  }

  return (
    <FlowShell title="天使桥" subtitle={`和${petName}说`} right="bell">
      <section
        data-el="xiaotian-chat"
        className="relative overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-white/90 shadow-[var(--brand-shadow-md)] backdrop-blur-md"
      >
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#DDEED2] to-transparent" />
        <div
          ref={scrollRef}
          className="relative max-h-[calc(100dvh-300px)] space-y-3 overflow-y-auto px-3 pb-4 pt-4"
        >
          {messages.map((m) => (
            <ChatBubble key={m.id} from={m.from} text={m.text} />
          ))}

          {typing && (
            <div className="flex items-end gap-2">
              <XiaotianAvatar size={38} />
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/90 px-4 py-3 shadow-[0_6px_14px_rgba(55,95,42,.08)]">
                <Dot delay="0s" /><Dot delay=".15s" /><Dot delay=".3s" />
              </div>
            </div>
          )}

          {inviteMode ? (
            <article className="rounded-[18px] border border-[#bde7cb] bg-[#f5fbf1] p-3 shadow-[0_8px_16px_rgba(55,95,42,.08)]">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
                <b className="text-[16px] text-[#273027]">请确认是否发出邀请</b>
              </div>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-[#273027]">
                <li>• {petName}会先转达你的来意，不直接公开隐私联系方式。</li>
                <li>• 对方同意后，会进入“{petName}牵线搭桥”并展示双方确认状态。</li>
                <li>• 双方确认成功后，履行安排会自动进入“桥约”。</li>
              </ul>
              {cancelled ? (
                <Link href="/xiaotian/recommend/m4" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-[14px] font-bold text-[#65A85A] ring-1 ring-[#E0E9DC] active:scale-[.98]">
                  返回推荐理由
                </Link>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={cancelInvite}
                    disabled={typing}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-[14px] font-bold text-[#58708c] ring-1 ring-[#dfe7ee] active:scale-[.98] disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" /> 暂不邀请
                  </button>
                  <button
                    type="button"
                    onClick={confirmInvite}
                    disabled={typing}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#65A85A] to-[#8EBB82] py-2.5 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(101,168,90,.24)] active:scale-[.98] disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" /> 确定邀请
                  </button>
                </div>
              )}
            </article>
          ) : hasPetTurns ? (
            <article className="rounded-[18px] border border-[#DDEED2] bg-[#F3F8EE] p-3 shadow-[0_8px_16px_rgba(55,95,42,.08)]">
              <div className="mb-2 flex items-center justify-between">
                <b className="text-[16px] text-[#273027]">{petName}整理中 🌱</b>
                <Link href="/xiaotian/intent" aria-label="编辑意图">
                  <button type="button" onClick={editIntent}><Pencil className="h-4 w-4 text-[#65A85A]" /></button>
                </Link>
              </div>
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-[#273027]">
                <OrganizedLine
                  label="我提供"
                  value={organizedDraft?.nodes.filter((node) => node.role === "offer").map((node) => node.text).join("、") ?? ""}
                />
                <OrganizedLine
                  label="我需要"
                  value={organizedDraft?.nodes.filter((node) => node.role === "need").map((node) => node.text).join("、") ?? ""}
                />
                <OrganizedLine
                  label="隐私边界"
                  value={[
                    ...(organizedDraft?.nodes.filter((node) => node.role === "constraint").map((node) => node.text) ?? []),
                    ...(organizedDraft?.constraints ?? []),
                  ].filter((text) => /隐私|公开|地址|门牌|联系方式/.test(text)).join("；")}
                />
              </ul>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={editIntent}
                  className="flex-1 rounded-full bg-white py-2.5 text-center text-[13px] font-semibold text-[#65A85A] ring-1 ring-[#E0E9DC] active:opacity-70"
                >
                  编辑意图
                </button>
                <Link
                  href="/xiaotian/recommend/m4"
                  className="flex-1 rounded-full bg-[#65A85A] py-2.5 text-center text-[13px] font-bold text-white active:scale-[.98]"
                >
                  了解详情
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="fixed left-1/2 z-30 w-[calc(100%_-_24px)] max-w-[calc(var(--app-max-width)_-_24px)] -translate-x-1/2 rounded-[28px] border border-[#E0E9DC] bg-white/90 p-2 shadow-[var(--brand-shadow-sm)] backdrop-blur-md"
        style={{ bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 78px)" }}
      >
        {voiceActive && (
          <div className="mb-2 rounded-2xl bg-[#eaf7ef] px-3 py-2 text-center text-[13px] font-semibold text-[#23a56f]">
            正在听你说话…松开后将转成文字
          </div>
        )}
        {emojiOpen && (
          <div className="mb-2 flex gap-1.5 rounded-2xl bg-[#f7fbf4] p-2">
            {["😊", "👍", "🌱", "✨", "🤝", "❤️"].map((emoji) => (
              <button key={emoji} type="button" onClick={() => setDraft((v) => `${v}${emoji}`)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-[16px] shadow-sm active:scale-90">
                {emoji}
              </button>
            ))}
          </div>
        )}
        {toolOpen && (
          <div className="mb-2 grid grid-cols-3 gap-2 rounded-2xl bg-[#f7fbf4] p-2">
            <button type="button" onClick={() => sendText("我想补充一张参考图片。")} className="rounded-2xl bg-white p-2 text-[12px] font-semibold text-[#45623f] shadow-sm active:scale-95"><ImageIcon className="mx-auto mb-1 h-4 w-4" />图片</button>
            <button type="button" onClick={() => sendText("我想补充一个地点范围。")} className="rounded-2xl bg-white p-2 text-[12px] font-semibold text-[#45623f] shadow-sm active:scale-95"><MapPin className="mx-auto mb-1 h-4 w-4" />地点</button>
            <button type="button" onClick={() => sendText("我想补充可约时间。")} className="rounded-2xl bg-white p-2 text-[12px] font-semibold text-[#45623f] shadow-sm active:scale-95"><CalendarDays className="mx-auto mb-1 h-4 w-4" />时间</button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={startVoice} aria-label="语音输入" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef8e6] text-[#45623f] active:scale-90">
            <Mic className="h-4.5 w-4.5" />
          </button>
          <button type="button" onClick={() => { setEmojiOpen((v) => !v); setToolOpen(false); }} aria-label="表情" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef8e6] text-[#45623f] active:scale-90">
            <SmilePlus className="h-4.5 w-4.5" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="输入消息"
            placeholder="输入消息"
            className="min-w-0 flex-1 rounded-full bg-[#f5f8f1] px-3.5 py-2.5 text-[16px] text-[#273027] outline-none placeholder:text-[#8b9589]"
          />
          <button type="button" onClick={() => { setToolOpen((v) => !v); setEmojiOpen(false); }} aria-label="更多" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef8e6] text-[#45623f] active:scale-90">
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || typing}
            aria-label="发送"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef8e6] text-[#65A85A] transition active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </FlowShell>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-[#8EBB82]"
      style={{ animationDelay: delay, animationDuration: "1s" }}
    />
  );
}

function OrganizedLine({ label, value }: { label: string; value: string }) {
  return (
    <li>
      • {label}：{value || <span className="text-[#9aa397]">待填写</span>}
    </li>
  );
}

function ChatBubble({ from, text }: { from: "ai" | "me"; text: string }) {
  const isMe = from === "me";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <XiaotianAvatar size={38} />}
      <div
        className={`max-w-[74%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-[0_6px_14px_rgba(55,95,42,.08)] ${
          isMe ? "rounded-br-sm bg-[#DDF2E5] text-[#273027]" : "rounded-bl-sm bg-white/90 text-[#273027]"
        }`}
      >
        {text}
      </div>
      {isMe && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#8EBB82] text-[13px] font-semibold text-white">
          你
        </span>
      )}
    </div>
  );
}
