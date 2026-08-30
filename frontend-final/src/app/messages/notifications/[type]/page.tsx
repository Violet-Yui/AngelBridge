"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, AtSign, Heart, UserPlus } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import { cn } from "@/utils/utils";

const DATA = {
  follows: {
    title: "新的关注",
    icon: UserPlus,
    tone: "bg-[#eaf4ff] text-[#2679ff]",
    items: [
      { name: "南风", avatar: "🌿", action: "关注了你", time: "刚刚", href: "/discover/user/nanfeng" },
      { name: "胶片旅人", avatar: "📷", action: "关注了你的人生树", time: "8 分钟前", href: "/discover/user/jiaopian" },
      { name: "设计小站", avatar: "🎨", action: "开始关注你的发布", time: "今天 12:20", href: "/discover/user/design" },
    ],
  },
  likes: {
    title: "赞和收藏",
    icon: Heart,
    tone: "bg-[#fff4df] text-[#f28a2e]",
    items: [
      { name: "小树芽", avatar: "🎸", action: "赞了你的帖子", time: "3 分钟前", href: "/messages/chat?thread=c3" },
      { name: "植物研究所", avatar: "🪴", action: "收藏了你的资源", time: "14 分钟前", href: "/messages/chat?thread=c4" },
      { name: "一叶", avatar: "🌳", action: "给你的桥约点了赞", time: "今天 10:48", href: "/growth" },
    ],
  },
  comments: {
    title: "评论和@",
    icon: AtSign,
    tone: "bg-[#f1ebff] text-[#8b5cf6]",
    items: [
      { name: "设计小站", avatar: "🎨", action: "评论了你的表单帖", time: "刚刚", href: "/messages/chat?thread=c2" },
      { name: "胶片旅人", avatar: "📷", action: "在评论里@了你", time: "25 分钟前", href: "/messages/chat?thread=c5" },
    ],
  },
} as const;

const MATURE_SHOWCASE_NAMES = new Set(["设计小站", "摄影师小林"]);

export default function NotificationTypePage() {
  const [isMatureShowcase, setIsMatureShowcase] = useState(false);
  const params = useParams<{ type: keyof typeof DATA }>();
  const data = DATA[params.type];
  useEffect(() => {
    setIsMatureShowcase(isMatureShowcaseSession());
  }, []);
  if (!data) notFound();
  const Icon = data.icon;
  const items = isMatureShowcase ? data.items.filter((item) => !MATURE_SHOWCASE_NAMES.has(item.name)) : [];
  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-[color:var(--bg-canvas)]/90 px-3 py-3 backdrop-blur">
        <Link href="/messages" aria-label="返回消息" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 active:scale-95"><ArrowLeft className="h-5 w-5" /></Link>
        <span className={cn("grid h-10 w-10 place-items-center rounded-full", data.tone)}><Icon className="h-5 w-5" /></span>
        <h1 className="text-[19px] font-black text-[#20351d]">{data.title}</h1>
      </header>
      <main className="space-y-3 px-4 pt-3">
        {items.map((item) => (
          <Link key={`${item.name}-${item.time}`} href={item.href} className="flex items-center gap-3 rounded-[22px] bg-white/82 p-3 shadow-[0_10px_26px_rgba(55,95,42,.08)] ring-1 ring-white/80 active:scale-[.99]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f2f7ed] text-2xl">{item.avatar}</span>
            <span className="min-w-0 flex-1"><b className="block text-[15px] text-[#20351d]">{item.name}</b><span className="mt-0.5 block truncate text-[13px] text-[#5f7159]">{item.action}</span></span>
            <span className="shrink-0 text-[12px] text-[#8a9785]">{item.time}</span>
          </Link>
        ))}
      </main>
    </AppShell>
  );
}
