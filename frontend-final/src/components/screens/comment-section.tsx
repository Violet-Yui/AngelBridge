"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, CornerDownRight, Send, SmilePlus, Trash2 } from "lucide-react";
import type { PostComment } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

// 当前登录用户（本地演示用）
const ME_HANDLE = "yiye";
const ME_NAME = "林一叶";
const ME_EMOJI = "🌿";

// 可选的表态类型
const REACTIONS = ["👍", "❤️", "😂", "🌱", "🎉"] as const;
type ReactionMap = Record<string, number>; // emoji -> 数量
type MyReactions = Record<string, string | null>; // commentId -> 我选中的表态

// 可复用评论区：支持添加评论 + 回复某条评论（楼中楼）+ 表态 + 删除自己的评论
export function CommentSection({
  initial,
}: {
  initial: PostComment[];
}) {
  const [comments, setComments] = useState<PostComment[]>(initial);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  // 每条评论的表态计数 & 我的表态选择
  const [reactions, setReactions] = useState<Record<string, ReactionMap>>({});
  const [myReactions, setMyReactions] = useState<MyReactions>({});
  const emojis = ["😊", "👍", "🌱", "✨", "🤝", "❤️"];

  function submit() {
    const text = draft.trim();
    if (!text) return;
    const me: PostComment = {
      id: `local-${Date.now()}`,
      author: ME_NAME,
      authorHandle: ME_HANDLE,
      emoji: ME_EMOJI,
      text,
      time: "刚刚",
      likes: 0,
      replies: [],
    };
    if (replyTo) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), me] } : c,
        ),
      );
      toast(`已回复 @${replyTo.author}`);
    } else {
      setComments((prev) => [me, ...prev]);
      toast("评论已发布～");
    }
    setDraft("");
    setReplyTo(null);
  }

  // 删除评论（仅限自己发布的）
  function removeComment(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    if (replyTo?.id === id) setReplyTo(null);
    toast("评论已删除");
  }

  // 表态：点击同一个表态取消，切换到别的表态则替换
  function toggleReaction(id: string, emoji: string) {
    setMyReactions((prevMy) => {
      const current = prevMy[id] ?? null;
      const next = current === emoji ? null : emoji;
      setReactions((prevR) => {
        const map = { ...(prevR[id] ?? {}) };
        if (current) map[current] = Math.max(0, (map[current] ?? 0) - 1);
        if (next) map[next] = (map[next] ?? 0) + 1;
        return { ...prevR, [id]: map };
      });
      return { ...prevMy, [id]: next };
    });
  }

  const total =
    comments.length + comments.reduce((s, c) => s + (c.replies?.length ?? 0), 0);

  return (
    <>
      {/* 评论列表 */}
      <section className="mt-5 border-t border-[color:var(--border)] px-4 pt-4 pb-2">
        <h2 className="mb-3 text-[15px] font-semibold">
          评论 {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </h2>
        {comments.length === 0 ? (
          <p className="pb-4 text-[13px] text-muted-foreground">还没有评论，来抢沙发吧～</p>
        ) : (
          <ul className="space-y-4 pb-2">
            {comments.map((c) => (
              <CommentRow
                key={c.id}
                c={c}
                mine={c.authorHandle === ME_HANDLE}
                onReply={setReplyTo}
                onDelete={removeComment}
                reactions={reactions[c.id] ?? {}}
                myReaction={myReactions[c.id] ?? null}
                onReact={toggleReaction}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 占位：为固定输入条留出空间，避免遮住最后一条评论 */}
      <div aria-hidden style={{ height: "64px" }} />

      {/* 底部输入条：紧贴在全局 TabBar 上方，层级高于 TabBar */}
      <div
        className="fixed inset-x-0 z-40 mx-auto max-w-[430px] border-t border-[color:var(--border)] bg-white/95 px-3 pb-2 pt-2 backdrop-blur"
        style={{ bottom: "calc(max(34px, env(safe-area-inset-bottom, 0px)) + 60px)" }}
      >
        {replyTo && (
          <div className="mb-1.5 flex items-center justify-between px-1 text-[12px] text-muted-foreground">
            <span className="truncate">回复 @{replyTo.author}</span>
            <button onClick={() => setReplyTo(null)} className="shrink-0 text-[color:var(--deep)]">
              取消
            </button>
          </div>
        )}
        {emojiOpen && (
          <div className="mb-2 flex gap-1.5 rounded-2xl bg-[color:var(--soft)]/45 p-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { setDraft((value) => `${value}${emoji}`); setEmojiOpen(false); }}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[16px] shadow-sm active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEmojiOpen((value) => !value)}
            aria-label="添加表情"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--soft)]/60 text-[color:var(--deep)] active:scale-90"
          >
            <SmilePlus className="h-4.5 w-4.5" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={replyTo ? `回复 @${replyTo.author}…` : "打字发评论…"}
            className="min-w-0 flex-1 rounded-full bg-[color:var(--soft)]/60 px-3.5 py-2.5 text-[14px] outline-none placeholder:text-neutral-400"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="发送"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--primary)] text-white active:scale-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function CommentRow({
  c,
  mine,
  onReply,
  onDelete,
  reactions,
  myReaction,
  onReact,
}: {
  c: PostComment;
  mine: boolean;
  onReply: (c: PostComment) => void;
  onDelete: (id: string) => void;
  reactions: ReactionMap;
  myReaction: string | null;
  onReact: (id: string, emoji: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const base = c.likes ?? 0;
  // 已有计数的表态（按固定顺序展示）
  const shown = REACTIONS.filter((e) => (reactions[e] ?? 0) > 0);

  return (
    <li className="flex gap-2.5">
      <NameLink handle={c.authorHandle}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[14px]">
          {c.emoji}
        </span>
      </NameLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <NameLink handle={c.authorHandle}>
            <span className="text-[13px] font-medium">{c.author}</span>
          </NameLink>
          {mine && (
            <span className="rounded-full bg-[color:var(--soft)]/70 px-1.5 py-0.5 text-[10px] text-[color:var(--deep)]">
              我
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[14px] leading-snug text-neutral-700">{c.text}</p>

        {/* 已选表态徽标 */}
        {shown.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {shown.map((e) => (
              <button
                key={e}
                onClick={() => onReact(c.id, e)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] active:scale-95",
                  myReaction === e
                    ? "border-[color:var(--primary)] bg-[color:var(--soft)]/60 text-[color:var(--deep)]"
                    : "border-[color:var(--border)] bg-white text-neutral-600",
                )}
              >
                <span>{e}</span>
                <span>{reactions[e]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center gap-4 text-[12px] text-muted-foreground">
          <span>{c.time}</span>
          <button
            onClick={() => onReply(c)}
            className="flex items-center gap-1 active:scale-95"
          >
            <CornerDownRight className="h-3.5 w-3.5" /> 回复
          </button>
          {/* 表态入口 */}
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex items-center gap-1 active:scale-95"
            >
              <SmilePlus className="h-3.5 w-3.5" /> 表态
            </button>
            {pickerOpen && (
              <div className="absolute bottom-full left-0 z-10 mb-1.5 flex gap-1 rounded-full border border-[color:var(--border)] bg-white p-1 shadow-md">
                {REACTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact(c.id, e); setPickerOpen(false); }}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-[16px] active:scale-90",
                      myReaction === e && "bg-[color:var(--soft)]/70",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            className="flex items-center gap-1 active:scale-95"
          >
            <Heart
              className={cn("h-3.5 w-3.5", liked && "fill-[color:var(--warm)] text-[color:var(--warm)]")}
            />
            {base + (liked ? 1 : 0) || ""}
          </button>
          {/* 删除（仅自己的评论） */}
          {mine && (
            <button
              onClick={() => onDelete(c.id)}
              className="flex items-center gap-1 text-[color:var(--warm)] active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" /> 删除
            </button>
          )}
        </div>

        {/* 楼中楼回复 */}
        {c.replies && c.replies.length > 0 && (
          <ul className="mt-2.5 space-y-2.5 border-l-2 border-[color:var(--soft)] pl-3">
            {c.replies.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[12px]">
                  {r.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium">{r.author}</span>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-700">{r.text}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{r.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function NameLink({
  handle,
  children,
}: {
  handle?: string;
  children: React.ReactNode;
}) {
  if (!handle) return <>{children}</>;
  return (
    <Link href={`/discover/user/${handle}`} className="active:opacity-70">
      {children}
    </Link>
  );
}
