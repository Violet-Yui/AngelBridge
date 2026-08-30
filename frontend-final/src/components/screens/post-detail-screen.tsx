"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Eye, Heart, RotateCcw, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { ReportSheet } from "@/components/tsq/report-sheet";
import { CommentSection } from "@/components/screens/comment-section";
import { findCard, badgeOf, type PersonCard, type PersonCategory } from "@/lib/tsq/data";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { PublicationDetail } from "@/lib/angelbridge-types";
import { cn } from "@/utils/utils";
import { getPublicationVisual } from "@/lib/tsq/publication-visual";

const BADGE_STYLE: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

const COVER_STYLE: Record<string, string> = {
  green: "from-[#eaf6e5] to-[#dcefd2]",
  warm: "from-[#fff5df] to-[#ffe9c2]",
  purple: "from-[#f0ebfd] to-[#e5dcfa]",
};


export function PostDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const staticCard = findCard(id);
  const [publication, setPublication] = useState<PublicationDetail | null>(null);
  const [loading, setLoading] = useState(!staticCard);

  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (staticCard) return;
    let active = true;
    angelbridgeApi.getPublication(id).then((detail) => {
      if (active) setPublication(detail);
    }).catch((error) => toast.error(error instanceof Error ? error.message : "读取帖子失败"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, staticCard]);

  const categoryByType: Record<string, PersonCategory> = {
    people: "兴趣伙伴",
    collaboration: "合作伙伴",
    skills: "技能达人",
    experience: "技能达人",
  };
  const publicationVisual = publication ? getPublicationVisual(publication) : null;
  const card: PersonCard | undefined = publication ? {
    id: publication.publicationId,
    kind: publicationVisual!.kind,
    category: categoryByType[publication.category] ?? "合作伙伴",
    title: publication.title,
    desc: publication.content,
    place: publication.locationLabel,
    author: publication.author.displayName,
    authorHandle: publication.author.accountId,
    authorBio: publication.author.stageLabel ?? "",
    likes: 0,
    favorites: 0,
    emoji: publicationVisual!.emoji,
    // Real posts without an upload use the shared brand mark, never a
    // showcase fixture image. The same fallback is used by recommendations.
    image: publication.images[0]?.url ?? "/brand/home-logo.png",
    time: publication.publishedAt ? new Date(publication.publishedAt).toLocaleDateString("zh-CN") : "刚刚",
    comments: [],
  } : staticCard;
  const authorHref = publication?.viewerRole === "owner" ? "/me" : `/discover/user/${card?.authorHandle ?? ""}`;

  async function updateCompletionDecision(
    input: { action: "continue_matching" } | { action: "close_matching"; discoveryVisible: boolean },
  ) {
    if (!publication || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await angelbridgeApi.decidePublicationAfterCompletion(publication.publicationId, input);
      setPublication(updated);
      toast(input.action === "continue_matching" ? "已重新开放匹配" : "已关闭匹配并作为成果展示");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新匹配状态失败");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (!card && loading) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <p className="text-center text-muted-foreground">正在读取帖子…</p>
        </div>
      </AppShell>
    );
  }

  if (!card) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <p className="text-center text-muted-foreground">该帖子不存在或已删除。</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* 顶部返回栏 + 作者信息 */}
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-[color:var(--bg-canvas)]/90 px-3 py-2 backdrop-blur">
        <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full active:scale-90">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Link href={authorHref} className="flex min-w-0 items-center gap-2 active:opacity-70">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[15px]">
            {card.author.slice(0, 1)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
              <span className="truncate">{card.author}</span>
              {publication?.viewerRole !== "owner" && <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFollowed((value) => !value); }}
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold active:scale-95",
                  followed ? "bg-white text-[color:var(--deep)] ring-1 ring-[color:var(--border)]" : "bg-[color:var(--primary)] text-white",
                )}
              >
                {followed ? "已关注" : "关注"}
              </button>}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">{card.authorBio}</span>
          </span>
        </Link>
        <Link href={authorHref} className="ml-auto shrink-0 rounded-full bg-[color:var(--primary)] px-3 py-1.5 text-[13px] font-semibold text-white active:scale-95">
          主页
        </Link>
      </header>

      {/* 封面 */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br", COVER_STYLE[card.kind], "h-56")}>
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-7xl opacity-90" aria-hidden>{card.emoji}</span>
        )}
        <span className={cn("absolute left-3 top-3 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm", BADGE_STYLE[card.kind])}>
          {badgeOf(card)}
        </span>
        {publication?.hasCompletedPact && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#eaf7ef] px-3 py-1.5 text-[12px] font-bold text-[#1f7a3a] shadow-sm">
          <Eye className="h-4 w-4" /> 已完成 {publication.completedPactCount} 次 · 成果展示
        </span>}
      </div>

      {publication?.hasCompletedPact && <section className="mx-4 mt-4 rounded-[22px] border border-[#d7e8ce] bg-white/90 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf7ef] text-[#1f7a3a]"><Eye className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-[#20351d]">已完成 {publication.completedPactCount} 次 · 成果展示</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6b7b66]">{publication.status === "completed" ? "匹配已关闭，仍作为成果内容公开展示，但不会再进入新匹配。" : "该帖子已有履约完成记录，目前仍在匹配池中。"}</p>
          </div>
        </div>
        {publication.viewerRole === "owner" && publication.status === "completed" && <button disabled={updatingStatus} onClick={() => void updateCompletionDecision({ action: "continue_matching" })} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#cfe3c7] bg-white py-3 text-[14px] font-bold text-[#1f7a3a] active:scale-[.98] disabled:opacity-50"><RotateCcw className="h-4 w-4" />重新开放匹配</button>}
        {publication.viewerRole === "owner" && publication.status === "published" && <button disabled={updatingStatus} onClick={() => void updateCompletionDecision({ action: "close_matching", discoveryVisible: true })} className="mt-4 w-full rounded-full bg-[#62A75C] py-3 text-[14px] font-bold text-white active:scale-[.98] disabled:opacity-50">关闭匹配 · 保留成果展示</button>}
      </section>}

      {/* 正文 */}
      <div className="px-4 pt-4">
        <h1 className="text-[19px] font-bold leading-snug">{card.title}</h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700">{card.desc}</p>
        <div className="mt-4 flex items-center gap-3 text-[12px] text-neutral-500">
          <span>{card.place}</span>
          <span>·</span>
          <span>{card.time}</span>
        </div>
      </div>

      {(publication?.canInvite ?? true) && <div className="mx-4 mt-4 rounded-[20px] border border-[#dbeed0] bg-[#f4faef] p-3 shadow-[0_8px_18px_rgba(55,95,42,.06)]">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[color:var(--deep)]">
          <Sparkles className="h-4 w-4 text-[color:var(--primary)]" /> 想进一步连接这个人？
        </p>
        <button
          onClick={() => router.push(`/xiaotian/chat?mode=invite&from=post&id=${card.id}`)}
          className="mt-2.5 w-full rounded-full bg-[color:var(--primary)] py-2.5 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(88,169,66,.22)] active:scale-[.98]"
        >
          通过小天发起邀约
        </button>
      </div>}

      {/* 简洁操作排 */}
      <div className="mt-4 flex items-center gap-2.5 px-4">
        <BigAction
          active={liked}
          activeCls="border-[color:var(--warm)] bg-[#fff4d9] text-[#bd7c10]"
          icon={<Heart className={cn("h-5 w-5", liked && "fill-[color:var(--warm)] text-[color:var(--warm)]")} />}
          label={`点赞 ${card.likes + (liked ? 1 : 0)}`}
          onClick={() => { setLiked((v) => !v); toast(liked ? "已取消点赞" : "已点赞 ❤️"); }}
        />
        <BigAction
          active={faved}
          activeCls="border-[#f5b625] bg-[#fff7e0] text-[#a9791a]"
          icon={<Star className={cn("h-5 w-5", faved && "fill-[#f5b625] text-[#f5b625]")} />}
          label={`收藏 ${card.favorites + (faved ? 1 : 0)}`}
          onClick={() => { setFaved((v) => !v); toast(faved ? "已取消收藏" : "已收藏 ⭐"); }}
        />
        <button
          onClick={() => setReportOpen(true)}
          aria-label="举报"
          className="grid h-11 shrink-0 place-items-center rounded-full border border-[color:var(--border)] bg-white px-4 text-[13px] font-bold text-neutral-600 active:scale-95"
        >
          举报
        </button>
      </div>

      {/* 评论区（添加评论 + 回复评论入口） */}
      <CommentSection initial={card.comments} />
      {reportOpen && <ReportSheet title="举报这个帖子" onClose={() => setReportOpen(false)} />}
    </AppShell>
  );
}

function BigAction({
  active,
  activeCls,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  activeCls: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-[14px] font-semibold active:scale-95",
        active ? activeCls : "border-[color:var(--border)] bg-white text-neutral-600",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
