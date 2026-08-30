"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Repeat2,
  Users,
  Handshake,
  ArrowLeftRight,
  X,
  Check,
  MessageCircle,
  Star,
  FileText,
  Flag,
} from "lucide-react";
import {
  type Invite,
  type BridgeType,
  type BridgeReview,
  type CompleteResult,
  BRIDGE_REVIEW_TAGS,
} from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

export const TYPE_META: Record<BridgeType, { icon: typeof Users; cls: string }> = {
  coop: { icon: Handshake, cls: "bg-[#eee8ff] text-[color:var(--purple)]" },
  friend: { icon: Users, cls: "bg-[color:var(--soft)] text-[color:var(--deep)]" },
  swap: { icon: Repeat2, cls: "bg-[#fff4d9] text-[#bd7c10]" },
};

const RESULT_LABEL: Record<CompleteResult, string> = {
  completed: "已完成",
  partial: "部分完成",
  failed: "未完成",
};

export function InviteCard({
  inv,
  onResolve,
  onStart,
  onComplete,
}: {
  inv: Invite;
  onResolve: (id: string, accept: boolean) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string, review: BridgeReview) => void;
}) {
  const { t } = useTranslation();
  const rejected = inv.status === "rejected";
  const byXiaotian = inv.source === "小天撮合";
  const [reviewOpen, setReviewOpen] = useState(false);
  const chatThread = inv.chatThread ?? (inv.id === "i3" ? "c2" : inv.id === "i4" ? "c4" : "c5");
  const postHref = inv.postHref ?? (inv.id === "i1" ? "/discover/p3" : inv.id === "i2" ? "/discover/p2" : inv.id === "i3" ? "/discover/p8" : inv.id === "i4" ? "/discover/p5" : "/discover/p1");

  return (
    <article
      data-el="bridge-invite-card"
      className={cn(
        "rounded-[20px] border border-[color:var(--border)] bg-white p-3.5 shadow-[0_8px_20px_rgba(55,95,42,0.06)]",
        rejected && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-sm text-[color:var(--deep)]">
            {inv.person.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-[15px]">{inv.person}</b>
            <p className="truncate text-[12px] text-muted-foreground">
              {inv.place} · {inv.time}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px]",
            byXiaotian ? "bg-[color:var(--soft)] text-[color:var(--deep)]" : "bg-neutral-100 text-neutral-500",
          )}
        >
          {byXiaotian && <Sparkles className="h-3 w-3 shrink-0" />}
          {inv.source}
        </span>
      </div>

      {inv.type === "swap" ? (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <ExchangeSide label={t("tsq.bridge.mineOffer")} value={inv.mine!} tone="green" />
          <div className="grid place-items-center text-[color:var(--warm)]">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <ExchangeSide label={t("tsq.bridge.theirsOffer")} value={inv.theirs!} tone="warm" />
        </div>
      ) : (
        <p className="mt-2.5 rounded-2xl bg-[color:var(--bg-canvas)] p-3 text-[13px] leading-relaxed text-neutral-700">
          {inv.desc}
        </p>
      )}

      {/* 待处理：查看对方帖子 / 接受 / 拒绝 */}
      {inv.status === "pending" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Link
            href={postHref}
            className="flex items-center justify-center gap-1 rounded-full border border-[#dbeed0] bg-white py-2.5 text-[12px] font-bold text-[#2F7D32] active:scale-95"
          >
            <FileText className="h-4 w-4" /> 查看详情
          </Link>
          <button
            onClick={() => onResolve(inv.id, false)}
            className="flex items-center justify-center gap-1 rounded-full bg-[#f5f5f1] py-2.5 text-[12px] text-neutral-600 active:scale-95"
          >
            <X className="h-4 w-4" /> {t("tsq.bridge.reject")}
          </button>
          <button
            onClick={() => onResolve(inv.id, true)}
            className="flex items-center justify-center gap-1 rounded-full bg-[color:var(--primary)] py-2.5 text-[12px] font-medium text-white active:scale-95"
          >
            <Check className="h-4 w-4" /> {t("tsq.bridge.accept")}
          </button>
        </div>
      )}

      {/* 已接受 / 进行中：进入聊天 / 查看双方履约确认 */}
      {(inv.status === "accepted" || inv.status === "ongoing") && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href={`/messages/chat?thread=${chatThread}`}
            className="flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--primary)] py-2.5 text-sm font-medium text-[color:var(--deep)] active:scale-95"
          >
            <MessageCircle className="h-4 w-4" /> {t("tsq.bridge.enterChat")}
          </Link>
          <Link
            href={`/bridge/schedule?matchId=${encodeURIComponent(inv.id)}`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] py-2.5 text-sm font-medium text-white active:scale-95"
          >
            <Check className="h-4 w-4" /> {inv.status === "accepted" ? "履约确认" : "完成确认"}
          </Link>
        </div>
      )}

      {/* 已完成：展示我的评价结果 */}
      {inv.status === "done" && inv.myReview && (
        <div className="mt-3 rounded-2xl bg-[color:var(--soft)]/40 p-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--deep)]">
            <Check className="h-4 w-4" /> {RESULT_LABEL[inv.myReview.result]} · 已评价
            <span className="ml-auto flex items-center gap-0.5 text-[#f5b625]">
              {Array.from({ length: inv.myReview.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-[#f5b625]" />
              ))}
            </span>
          </div>
          {inv.myReview.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {inv.myReview.tags.map((tg) => (
                <span key={tg} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[color:var(--deep)]">
                  {tg}
                </span>
              ))}
            </div>
          )}
          {inv.myReview.note && (
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-600">“{inv.myReview.note}”</p>
          )}
        </div>
      )}

      {rejected && (
        <p className="mt-3 text-center text-[13px] text-muted-foreground">{t("tsq.bridge.archived")}</p>
      )}

      {/* 完成确认 + 双向评价弹层 */}
      {reviewOpen && (
        <ReviewSheet
          person={inv.person}
          onClose={() => setReviewOpen(false)}
          onSubmit={(review) => {
            setReviewOpen(false);
            onComplete?.(inv.id, review);
          }}
        />
      )}
    </article>
  );
}

// 完成确认 + 双向评价（是否完成 → 星级 → 体验标签 → 文字反馈）
function ReviewSheet({
  person,
  onClose,
  onSubmit,
}: {
  person: string;
  onClose: () => void;
  onSubmit: (review: BridgeReview) => void;
}) {
  const [result, setResult] = useState<CompleteResult>("completed");
  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  function toggleTag(tg: string) {
    setTags((cur) => (cur.includes(tg) ? cur.filter((x) => x !== tg) : [...cur, tg]));
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/40" onClick={onClose}>
      <div className="glass-sheet max-h-[86vh] w-full overflow-y-auto rounded-t-3xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[17px] font-bold">完成确认 · 评价 {person}</h3>
          <button onClick={onClose} aria-label="关闭" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 是否完成 */}
        <p className="mb-2 text-[13px] font-semibold">这次桥约完成得怎么样？</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(["completed", "partial", "failed"] as CompleteResult[]).map((r) => (
            <button
              key={r}
              onClick={() => setResult(r)}
              className={cn(
                "rounded-xl border py-2.5 text-[13px] font-medium active:scale-95",
                result === r
                  ? "border-[color:var(--primary)] bg-[color:var(--soft)] text-[color:var(--deep)]"
                  : "border-[color:var(--border)] bg-white text-neutral-600",
              )}
            >
              {RESULT_LABEL[r]}
            </button>
          ))}
        </div>

        {/* 星级 */}
        <p className="mb-2 text-[13px] font-semibold">体验评分</p>
        <div className="mb-4 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} 星`} className="active:scale-90">
              <Star className={cn("h-7 w-7", n <= rating ? "fill-[#f5b625] text-[#f5b625]" : "text-neutral-300")} />
            </button>
          ))}
        </div>

        {/* 体验标签 */}
        <p className="mb-2 text-[13px] font-semibold">体验标签（可多选）</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {BRIDGE_REVIEW_TAGS.map((tg) => (
            <button
              key={tg}
              onClick={() => toggleTag(tg)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] active:scale-95",
                tags.includes(tg)
                  ? "border-[color:var(--primary)] bg-[color:var(--soft)] text-[color:var(--deep)]"
                  : "border-[color:var(--border)] bg-white text-neutral-600",
              )}
            >
              {tg}
            </button>
          ))}
        </div>

        {/* 文字反馈 */}
        <p className="mb-2 text-[13px] font-semibold">文字反馈（选填）</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="说点什么，帮助对方也帮助小天更懂你…"
          className="mb-4 w-full resize-none rounded-2xl border border-[color:var(--border)] bg-white p-3 text-[14px] outline-none focus:border-[color:var(--primary)]"
        />

        <button
          onClick={() => onSubmit({ result, rating, tags, note: note.trim() })}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-[16px] font-semibold text-white active:scale-[0.98]"
        >
          <Check className="h-5 w-5" /> 提交完成确认与评价
        </button>
        <p className="mt-2 flex items-center justify-center gap-1 text-[12px] text-muted-foreground">
          <Flag className="h-3.5 w-3.5" /> 遇到问题？可在评价后发起争议或投诉
        </p>
      </div>
    </div>
  );
}

function ExchangeSide({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "warm";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-2.5 text-center",
        tone === "green"
          ? "border-[color:var(--border)] bg-[color:var(--soft)]/50"
          : "border-[#f3e2c2] bg-[#fff8ea]",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-medium leading-snug text-neutral-800">{value}</p>
    </div>
  );
}
