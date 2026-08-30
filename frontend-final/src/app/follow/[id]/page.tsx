"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Heart, MessageCircle, Star } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { ReportSheet } from "@/components/tsq/report-sheet";
import { CommentSection } from "@/components/screens/comment-section";
import { findFollowPost } from "@/lib/tsq/follow-posts";
import { cn } from "@/utils/utils";

const BADGE_STYLE: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

export default function FollowPostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const post = findFollowPost(params.id);
  const [reportOpen, setReportOpen] = useState(false);
  if (!post) notFound();

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-[color:var(--bg-canvas)]/90 px-3 py-2 backdrop-blur">
        <button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full active:scale-90"><ChevronLeft className="h-5 w-5" /></button>
        <Link href={`/discover/user/${post.handle}`} className="flex min-w-0 items-center gap-2 active:opacity-70">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[15px]">{post.avatar}</span>
          <span className="flex min-w-0 flex-col"><span className="truncate text-[14px] font-semibold leading-tight">{post.author}</span><span className="truncate text-[11px] text-muted-foreground">{post.place}</span></span>
        </Link>
      </header>
      <div className="relative h-60 overflow-hidden bg-[#f4faef]">
        <Image src={post.image} alt={post.title} fill sizes="430px" className="object-cover" />
        <span className={cn("absolute left-3 top-3 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm", BADGE_STYLE[post.kind])}>关注动态</span>
        {post.match && <span className="absolute right-3 top-3 rounded-lg bg-[#ee7bff] px-2 py-1 text-[12px] font-bold text-white shadow-sm">{post.match}</span>}
      </div>
      <main className="px-4 pt-4">
        <h1 className="text-[20px] font-black leading-snug text-[#20351d]">{post.title}</h1>
        <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#4d5f49]">{post.desc}</p>
        <div className="mt-4 grid gap-2 rounded-[24px] bg-white/82 p-3 shadow-[0_12px_28px_rgba(55,95,42,0.08)] ring-1 ring-white/80">
          {post.facts.map((fact) => <div key={fact.label} className="flex gap-3 rounded-2xl bg-[#f7fbf1] px-3 py-2"><b className="w-16 shrink-0 text-[13px] text-[#2F7D32]">{fact.label}</b><span className="min-w-0 flex-1 text-[13px] leading-relaxed text-[#20351d]">{fact.value}</span></div>)}
        </div>
        <div className="mt-4 flex items-center gap-3 text-[12px] text-neutral-500"><span>{post.place}</span><span>·</span><span>{post.time}</span></div>
        <div className="mt-4 flex items-center gap-2.5">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white py-2.5 text-[14px] font-semibold text-neutral-600 active:scale-95"><Heart className="h-5 w-5" />点赞 {post.likes}</button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white py-2.5 text-[14px] font-semibold text-neutral-600 active:scale-95"><Star className="h-5 w-5" />收藏</button>
          <Link href="#comments" className="grid h-11 shrink-0 place-items-center rounded-full border border-[color:var(--border)] bg-white px-4 text-neutral-600 active:scale-95"><MessageCircle className="h-5 w-5" /></Link>
          <button onClick={() => setReportOpen(true)} aria-label="举报" className="grid h-11 shrink-0 place-items-center rounded-full border border-[color:var(--border)] bg-white px-4 text-[13px] font-bold text-neutral-600 active:scale-95">举报</button>
        </div>
      </main>
      <div id="comments"><CommentSection initial={post.comments} /></div>
      {reportOpen && <ReportSheet title="举报这个帖子" onClose={() => setReportOpen(false)} />}
    </AppShell>
  );
}
