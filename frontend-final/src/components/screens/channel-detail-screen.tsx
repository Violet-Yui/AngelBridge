"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Heart, Star } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { ReportSheet } from "@/components/tsq/report-sheet";
import { CommentSection } from "@/components/screens/comment-section";
import { findItem } from "@/lib/tsq/channels";
import { cn } from "@/utils/utils";

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


export function ChannelDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const item = findItem(id);

  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!item) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <p className="text-center text-muted-foreground">该内容不存在或已删除。</p>
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
        <Link href={`/discover/user/${item.authorHandle}`} className="flex min-w-0 items-center gap-2 active:opacity-70">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[15px]">
            {item.author.slice(0, 1)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-semibold leading-tight">{item.author}</span>
            <span className="truncate text-[11px] text-muted-foreground">{item.authorBio}</span>
          </span>
        </Link>
        <Link href={`/discover/user/${item.authorHandle}`} className="ml-auto shrink-0 rounded-full bg-[color:var(--primary)] px-3 py-1.5 text-[13px] font-semibold text-white active:scale-95">
          主页
        </Link>
      </header>

      {/* 封面 */}
      <div className={cn("relative overflow-hidden bg-gradient-to-br", COVER_STYLE[item.kind], "h-52")}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-7xl opacity-90" aria-hidden>{item.emoji}</span>
        )}
        <span className={cn("absolute left-3 top-3 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm", BADGE_STYLE[item.kind])}>
          {item.category}
        </span>
      </div>

      {/* 正文 */}
      <div className="px-4 pt-4">
        <h1 className="text-[19px] font-bold leading-snug">{item.title}</h1>

        {item.facts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.facts.map((f) => (
              <div key={f.label} className={cn("rounded-xl px-3 py-2", BADGE_STYLE[item.kind])}>
                <p className="text-[11px] opacity-70">{f.label}</p>
                <p className="text-[14px] font-semibold leading-tight">{f.value}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700">{item.desc}</p>
        <div className="mt-4 flex items-center gap-3 text-[12px] text-neutral-500">
          <span>{item.place}</span>
          <span>·</span>
          <span>{item.time}</span>
        </div>
      </div>

      {/* 简洁操作排 */}
      <div className="mt-4 flex items-center gap-2.5 px-4">
        <BigAction
          active={liked}
          activeCls="border-[color:var(--warm)] bg-[#fff4d9] text-[#bd7c10]"
          icon={<Heart className={cn("h-5 w-5", liked && "fill-[color:var(--warm)] text-[color:var(--warm)]")} />}
          label={`点赞 ${item.likes + (liked ? 1 : 0)}`}
          onClick={() => { setLiked((v) => !v); toast(liked ? "已取消点赞" : "已点赞 ❤️"); }}
        />
        <BigAction
          active={faved}
          activeCls="border-[#f5b625] bg-[#fff7e0] text-[#a9791a]"
          icon={<Star className={cn("h-5 w-5", faved && "fill-[#f5b625] text-[#f5b625]")} />}
          label={`收藏 ${item.favorites + (faved ? 1 : 0)}`}
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
      <CommentSection initial={item.comments} />
      {reportOpen && <ReportSheet title="举报这条内容" onClose={() => setReportOpen(false)} />}
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
