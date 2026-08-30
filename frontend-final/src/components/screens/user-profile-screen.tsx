"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { ChevronLeft, Heart, MessageCircle, MapPin, Leaf, Sparkles, HandHeart, Gift } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { findCardsByAuthor, badgeOf, getPersona, type PersonCard } from "@/lib/tsq/data";
import { channelItemsByAuthor, type FeedItem } from "@/lib/tsq/channels";
import { LIFE_TREE_ASSETS, CURRENT_LIFE_TREE_STAGE } from "@/lib/tsq/life-tree-assets";
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

// 把两类内容归一为统一的展示条目
type FeedRow = {
  key: string;
  href: string;
  kind: string;
  emoji: string;
  image?: string;
  badge: string;
  title: string;
  likes: number;
  commentCount: number;
};

export function UserProfileScreen({ handle }: { handle: string }) {
  const router = useRouter();
  const cards = findCardsByAuthor(handle);
  const items = channelItemsByAuthor(handle);
  const [following, setFollowing] = useState(false);
  const [nourished, setNourished] = useState(false);
  const treeAsset = LIFE_TREE_ASSETS[CURRENT_LIFE_TREE_STAGE];
  const baseLife = 72 + (handle.length % 18);
  const lifeValue = baseLife + (nourished ? 5 : 0);

  const rows: FeedRow[] = [
    ...cards.map((p: PersonCard) => ({
      key: `d-${p.id}`,
      href: `/discover/${p.id}`,
      kind: p.kind,
      emoji: p.emoji,
      image: p.image,
      badge: badgeOf(p),
      title: p.title,
      likes: p.likes,
      commentCount: p.comments.length,
    })),
    ...items.map((it: FeedItem) => ({
      key: `c-${it.id}`,
      href: `/channel/${it.id}`,
      kind: it.kind,
      emoji: it.emoji,
      image: it.image,
      badge: it.category,
      title: it.title,
      likes: it.likes,
      commentCount: it.comments.length,
    })),
  ];

  if (rows.length === 0) {
    return (
      <AppShell>
        <div className="px-4 pt-6">
          <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
            <ChevronLeft className="h-4 w-4" /> 返回
          </button>
          <p className="text-center text-muted-foreground">找不到这位用户～</p>
        </div>
      </AppShell>
    );
  }

  // 用户资料取任一来源的第一条
  const src = cards[0] ?? items[0];
  const user = {
    author: src.author,
    authorBio: src.authorBio,
    place: src.place,
    emoji: src.emoji,
    kind: src.kind,
  };
  const totalLikes = rows.reduce((s, r) => s + r.likes, 0);
  const totalFav =
    cards.reduce((s, p) => s + p.favorites, 0) + items.reduce((s, i) => s + i.favorites, 0);
  const persona = getPersona(handle, user.authorBio);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-[color:var(--bg-canvas)]/90 px-3 py-2 backdrop-blur">
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="grid h-9 w-9 place-items-center rounded-full active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="truncate text-[15px] font-semibold">个人主页</span>
      </header>

      {/* 用户信息卡 */}
      <section className="px-4 pt-2">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-full text-3xl", BADGE_STYLE[user.kind])}>
            {user.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[18px] font-bold">{user.author}</h1>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{user.authorBio}</p>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-neutral-500">
              <MapPin className="h-3.5 w-3.5" />
              {user.place}
            </p>
          </div>
        </div>

        {/* 统计 */}
        <div className="mt-4 flex items-center justify-around rounded-2xl bg-white py-3 shadow-[var(--brand-shadow-sm)]">
          <Stat label="内容" value={rows.length} />
          <Divider />
          <Stat label="获赞" value={totalLikes} />
          <Divider />
          <Stat label="被收藏" value={totalFav} />
        </div>

        {/* 人生树 */}
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[#dbeed0] bg-[linear-gradient(135deg,rgba(255,255,255,.9),rgba(244,250,239,.86))] p-3.5 shadow-[var(--brand-shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="relative grid h-[104px] w-[104px] shrink-0 place-items-center overflow-hidden rounded-[22px] bg-white/70 ring-1 ring-white">
              <Image src={treeAsset.src} alt={`${user.author}的人生树`} width={104} height={104} className="h-full w-full object-contain p-2" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#2F7D32]">
                <Leaf className="h-4 w-4" /> TA 的人生树
              </div>
              <p className="text-[14px] font-semibold leading-snug text-[#20351d]">生命值 {lifeValue}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6b7b66]">好友可以访问并滋养彼此的人生树，让真实连接被看见。</p>
              <button
                onClick={() => {
                  if (!nourished) {
                    setNourished(true);
                    toast(`已为 ${user.author} 的人生树滋养 +5 🌿`);
                  } else {
                    toast("今天已经滋养过啦～");
                  }
                }}
                className={cn(
                  "mt-2 rounded-full px-3.5 py-1.5 text-[12px] font-bold active:scale-95",
                  nourished ? "bg-white text-[#58A942] ring-1 ring-[#cdebc0]" : "bg-[color:var(--primary)] text-white",
                )}
              >
                {nourished ? "已滋养 +5" : "滋养 TA 的树"}
              </button>
            </div>
          </div>
        </div>

        {/* 操作 */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setFollowing((v) => !v);
              toast(following ? "已取消关注" : "已关注 🌱");
            }}
            className={cn(
              "flex-1 rounded-full py-2.5 text-[14px] font-semibold active:scale-95",
              following
                ? "border border-[color:var(--border)] bg-white text-neutral-600"
                : "bg-[color:var(--primary)] text-white",
            )}
          >
            {following ? "已关注" : "+ 关注"}
          </button>
          <button
            onClick={() => router.push(`/messages/chat?thread=${encodeURIComponent(handle)}&name=${encodeURIComponent(user.author)}&avatar=${encodeURIComponent(user.emoji)}&handle=${encodeURIComponent(handle)}`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white py-2.5 text-[14px] font-semibold text-neutral-700 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            打个招呼
          </button>
        </div>
      </section>

      {/* TA 的个性特质 */}
      <section className="mt-5 px-4">
        <SectionTitle icon={<Sparkles className="h-4 w-4" />} title="个性特质" tone="purple" />
        <div className="flex flex-wrap gap-2">
          {persona.traits.map((tr) => (
            <span
              key={tr}
              className="rounded-full bg-[#eee8ff] px-3 py-1.5 text-[13px] font-medium text-[color:var(--purple)]"
            >
              {tr}
            </span>
          ))}
        </div>
      </section>

      {/* TA 的需求（想找 / 想要） */}
      <section className="mt-5 px-4">
        <SectionTitle icon={<HandHeart className="h-4 w-4" />} title="TA 的需求" tone="warm" />
        <div className="overflow-hidden rounded-[18px] glass-card">
          {persona.needs.map((n, i) => (
            <div
              key={n}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-3",
                i < persona.needs.length - 1 && "border-b border-[#f1f2ec]",
              )}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#bd7c10]" />
              <span className="min-w-0 flex-1 text-[14px] leading-snug">{n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TA 的资源（能提供 / 拥有） */}
      <section className="mt-5 px-4">
        <SectionTitle icon={<Gift className="h-4 w-4" />} title="TA 的资源" tone="green" />
        <div className="flex flex-wrap gap-2">
          {persona.resources.map((r) => (
            <span
              key={r}
              className="rounded-xl bg-[color:var(--soft)] px-3 py-2 text-[13px] font-medium text-[color:var(--deep)]"
            >
              {r}
            </span>
          ))}
        </div>
      </section>

      {/* TA 的内容 */}
      <section className="mt-5 px-4">
        <h2 className="mb-3 text-[15px] font-semibold">TA 的内容</h2>
        <div className="space-y-3">
          {rows.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className="flex gap-3 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white p-2.5 shadow-[var(--brand-shadow-sm)] active:scale-[0.99]"
            >
              <div className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br", COVER_STYLE[r.kind])}>
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-3xl">{r.emoji}</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cn("mb-1 w-fit rounded-md px-1.5 py-0.5 text-[10px] font-medium", BADGE_STYLE[r.kind])}>
                  {r.badge}
                </span>
                <h3 className="line-clamp-2 text-[14px] font-medium leading-snug">{r.title}</h3>
                <div className="mt-auto flex items-center gap-3 pt-1 text-[12px] text-neutral-500">
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3.5 w-3.5" /> {r.likes}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageCircle className="h-3.5 w-3.5" /> {r.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[17px] font-bold text-[color:var(--deep)]">{value}</span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-6 w-px bg-[color:var(--border)]" />;
}

function SectionTitle({
  icon,
  title,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "green" | "warm" | "purple";
}) {
  const toneCls =
    tone === "green"
      ? "bg-[color:var(--soft)] text-[color:var(--deep)]"
      : tone === "warm"
        ? "bg-[#fff4d9] text-[#bd7c10]"
        : "bg-[#eee8ff] text-[color:var(--purple)]";
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg", toneCls)}>{icon}</span>
      <h2 className="text-[15px] font-semibold">{title}</h2>
    </div>
  );
}
