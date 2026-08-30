"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, FileText, Leaf, MessageCircle, PawPrint, PenLine, ShieldCheck, Sparkles, Star, Trees, X } from "lucide-react";
import { LIFE_TREE_ASSETS, CURRENT_LIFE_TREE_STAGE } from "@/lib/tsq/life-tree-assets";
import { getPetVisual } from "@/lib/tsq/pets";
import { usePetStore } from "@/stores/pet-store";
import { cn } from "@/utils/utils";
import { useDashboard } from "@/hooks/use-dashboard";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";
import { DEFAULT_MY_POSTS } from "@/lib/tsq/my-default-posts";

const KIND_TAG: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

function statusLabel(status?: string, completedCount = 0, discoveryVisible = true) {
  if (status === "deleted") return "已删除·已隐藏";
  if (status === "completed") return discoveryVisible ? `已完成${completedCount || 1}次·成果展示` : `已完成${completedCount || 1}次·仅自己可见`;
  return completedCount > 0 ? `已有履约完成${completedCount}次·匹配中` : "匹配中";
}

type PostRow = {
  id: string;
  href: string;
  kind: "green" | "warm" | "purple";
  title: string;
  meta: string;
  emoji: string;
  image?: string;
  count: number;
};

export function MeProfileSections() {
  const { dashboard } = useDashboard();
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const appliedPet = usePetStore((s) => s.appliedPet);
  const petName = usePetStore((s) => s.appliedPetName);
  const [tab, setTab] = useState<"tree" | "posts" | "pet">("tree");
  const [showAllPosts, setShowAllPosts] = useState(false);

  useEffect(() => {
    angelbridgeApi.getMyPublications().then((publications) => {
      const rows = publications.map((publication) => ({
      id: publication.publicationId,
      href: `/discover/${publication.publicationId}`,
      kind: publication.kind === "offer" ? "green" : publication.kind === "need" ? "warm" : "purple",
      title: publication.title,
      meta: `${publication.category} · ${statusLabel(publication.status, publication.completedPactCount, publication.discoveryVisible)}`,
      emoji: publication.kind === "offer" ? "🌱" : publication.kind === "need" ? "✨" : "🤝",
      image: publication.images[0]?.url,
      count: 0,
      } satisfies PostRow));
      if (rows.length > 0 || !isMatureShowcaseSession()) {
        setAllPosts(rows);
        return;
      }
      setAllPosts(DEFAULT_MY_POSTS.map((post) => ({
        id: post.id,
        href: `/mine/${post.id}`,
        kind: post.kind,
        title: post.title,
        meta: `${post.channelLabel} · ${statusLabel(post.status, post.completedCount, post.discoveryVisible)}`,
        emoji: post.emoji,
        image: post.images[0],
        count: post.likes,
      })));
    }).catch(() => setAllPosts([]));
  }, []);

  const completedPacts = dashboard?.stats.completedPacts ?? 0;
  const currentGrowth = dashboard?.account.growthScore ?? 100;
  const currentLife = 5 + completedPacts * 10;
  const growthBonus = completedPacts * 20;
  const treeAsset = LIFE_TREE_ASSETS[CURRENT_LIFE_TREE_STAGE];
  const pet = getPetVisual(appliedPet);
  const interests = dashboard?.account.interestTags ?? [];
  const cardPosts = allPosts.filter((p) => !p.meta.includes("已删除")).slice(0, 2);
  const latestLogs = dashboard?.recentGrowth.slice(0, 3) ?? [];
  const matureShowcase = isMatureShowcaseSession();
  const visibleGrowth = latestLogs.length > 0 || !matureShowcase ? latestLogs : [
    { eventId: "showcase-growth-1", title: "完成与创意工作室的品牌共创桥约", delta: 40 },
    { eventId: "showcase-growth-2", title: "发布拍摄空间与设计支持需求", delta: 15 },
    { eventId: "showcase-growth-3", title: "新增长期共创伙伴 1 位", delta: 20 },
  ];

  return (
    <div className="space-y-4 px-4 pt-5">
      <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white/58 p-3 shadow-[0_18px_45px_rgba(55,95,42,0.10)] backdrop-blur-xl">
        <nav className="grid grid-cols-3 rounded-[22px] border border-white/70 bg-white/72 p-1 shadow-[0_8px_20px_rgba(55,95,42,0.08)] backdrop-blur-xl">
          <Segment active={tab === "tree"} onClick={() => setTab("tree")} icon={<Trees className="h-4 w-4" />} label="人生树" />
          <Segment active={tab === "posts"} onClick={() => setTab("posts")} icon={<MessageCircle className="h-4 w-4" />} label="动态" />
          <Segment active={tab === "pet"} onClick={() => setTab("pet")} icon={<PawPrint className="h-4 w-4" />} label="灵宠" />
        </nav>

        <div className="mt-3 h-[332px] overflow-hidden rounded-[26px] bg-white/42 p-3 ring-1 ring-white/70">
          {tab === "tree" && <TreePanel treeAsset={treeAsset} currentGrowth={currentGrowth} currentLife={currentLife} growthBonus={growthBonus} interests={interests} />}
          {tab === "posts" && <PostsPanel posts={cardPosts} total={allPosts.length} onShowAll={() => setShowAllPosts(true)} />}
          {tab === "pet" && <PetPanel pet={pet} petName={petName} />}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/52 p-4 shadow-[0_14px_34px_rgba(55,95,42,0.08)] backdrop-blur-xl">
        <SectionHead icon={<Sparkles className="h-4 w-4" />} title="最近成长" sub="由真实互助触发" />
        <div className="mt-3 grid grid-cols-2 gap-2"><MiniStat label="信用状态" value="优秀" tone="green" icon={<ShieldCheck className="h-4 w-4" />} /><MiniStat label="完成桥约" value={completedPacts} tone="green" icon={<Star className="h-4 w-4" />} /></div>
        {visibleGrowth.length > 0 && <div className="mt-3 space-y-2 border-t border-white/80 pt-3">{visibleGrowth.map((g) => <div key={g.eventId} className="flex items-center gap-2 rounded-2xl bg-white/60 px-3 py-2"><span className="h-1.5 w-1.5 rounded-full bg-[#58A942]" /><span className="min-w-0 flex-1 truncate text-[13px] text-[#20351d]">{g.title}</span><b className="text-[13px] text-[#58A942]">+{g.delta}</b></div>)}</div>}
      </section>

      {showAllPosts && <AllPostsSheet posts={allPosts} onClose={() => setShowAllPosts(false)} />}
    </div>
  );
}

function TreePanel({ treeAsset, currentGrowth, currentLife, growthBonus, interests }: { treeAsset: typeof LIFE_TREE_ASSETS[typeof CURRENT_LIFE_TREE_STAGE]; currentGrowth: number; currentLife: number; growthBonus: number; interests: string[] }) {
  return <div className="flex h-full flex-col"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-[17px] font-black text-[#20351d]">人生树成长卡</h2><p className="mt-0.5 text-[12px] text-[#6b7b66]">青苗期 · 探索阶段</p></div><Link href="/tree/edit" className="inline-flex items-center gap-1 rounded-full bg-white/78 px-3 py-1.5 text-[12px] font-bold text-[#2F7D32] ring-1 ring-[#dbeed0] active:scale-95"><PenLine className="h-3.5 w-3.5" /> 编辑</Link></div><div className="grid grid-cols-[118px_1fr] gap-3"><div className="relative flex h-[138px] items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_50%_55%,rgba(183,230,93,.24),transparent_64%)]"><Image src={treeAsset.src} alt="我的人生树" width={118} height={118} className="h-[118px] w-[118px] object-contain drop-shadow-[0_12px_18px_rgba(45,98,34,.12)]" /></div><div className="min-w-0 rounded-[22px] bg-white/58 p-3 ring-1 ring-white/70"><div className="mb-2 flex items-center gap-1.5"><Leaf className="h-4 w-4 text-[#58A942]" /><b className="text-[14px] text-[#20351d]">成长值 {currentGrowth} / 1500</b></div><div className="h-2 overflow-hidden rounded-full bg-[#e7f2df]"><div className="h-full rounded-full bg-gradient-to-r from-[#58A942] to-[#b7e65d]" style={{ width: `${Math.min(100, (currentGrowth / 1500) * 100)}%` }} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-center"><MiniStat label="生命值" value={currentLife} tone="warm" /><MiniStat label="桥约经验" value={`+${growthBonus}`} tone="green" /></div></div></div><div className="mt-3 flex-1 rounded-[22px] bg-white/64 p-3 ring-1 ring-white/70"><div className="mb-2"><b className="text-[14px] text-[#20351d]">画像关键词</b></div><Link href="/me/settings" className="block active:scale-[.99]">{interests.length > 0 ? <div className="flex flex-wrap gap-2">{interests.map((tag) => <span key={tag} className="rounded-full bg-[#eaf7df] px-2.5 py-1 text-[12px] font-semibold text-[#2F7D32]">{tag}</span>)}</div> : <span className="inline-flex bg-[#f4f5f2] px-2.5 py-1.5 text-[13px] text-[#7f877d]">＋ 添加兴趣标签</span>}</Link></div></div>;
}

function PostsPanel({ posts, total, onShowAll }: { posts: PostRow[]; total: number; onShowAll: () => void }) {
  return <div className="flex h-full flex-col"><SectionHead icon={<FileText className="h-4 w-4" />} title="帖子动态" sub={`共 ${total} 条`} /><div className="mt-3 space-y-3">{posts.map((p) => <PostItem key={p.id} post={p} />)}</div>{total === 0 ? <p className="mt-10 text-center text-[13px] text-[#6b7b66]">暂未发布帖子</p> : <button onClick={onShowAll} className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] py-2.5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(88,169,66,.22)] active:scale-95">查看全部 <ChevronRight className="h-3.5 w-3.5" /></button>}</div>;
}

function PostItem({ post }: { post: PostRow }) {
  return <Link href={post.href} className="flex gap-3 overflow-hidden rounded-2xl bg-white/78 p-2.5 shadow-[var(--brand-shadow-sm)] ring-1 ring-white/70 active:scale-[0.99]"><div className={cn("grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl text-3xl", KIND_TAG[post.kind])}>{post.image ? <img src={post.image} alt="" className="h-full w-full object-cover" /> : post.emoji}</div><div className="flex min-w-0 flex-1 flex-col"><span className="mb-1 w-fit max-w-full truncate rounded-md bg-[#eef8e6] px-1.5 py-0.5 text-[10px] font-medium text-[#2F7D32]">{post.meta}</span><h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#20351d]">{post.title}</h3><p className="mt-auto pt-1 text-[12px] text-[#6b7b66]">{post.count} 人互动</p></div></Link>;
}

function AllPostsSheet({ posts, onClose }: { posts: PostRow[]; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 mx-auto flex max-w-[var(--app-max-width)] items-end bg-black/35" onClick={onClose}><section className="max-h-[78dvh] w-full rounded-t-[30px] bg-[#f5faef] p-4 pb-[max(22px,env(safe-area-inset-bottom,0px))] shadow-[0_-20px_60px_rgba(0,0,0,.16)]" onClick={(e) => e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><div><h2 className="text-[18px] font-black text-[#20351d]">全部历史帖子</h2><p className="text-[12px] text-[#6b7b66]">包含不同履约状态的发帖记录</p></div><button onClick={onClose} aria-label="关闭" className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#758274] active:scale-95"><X className="h-4.5 w-4.5" /></button></div><div className="tsq-noscroll max-h-[calc(78dvh-90px)] space-y-3 overflow-y-auto pr-1">{posts.map((p) => <PostItem key={p.id} post={p} />)}</div></section></div>;
}

function PetPanel({ pet, petName }: { pet: ReturnType<typeof getPetVisual>; petName: string }) {
  return <div className="flex h-full flex-col"><SectionHead icon={<PawPrint className="h-4 w-4" />} title="灵宠形象设置" sub="守护、提醒和陪伴" /><div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[24px] bg-white/70 p-4 text-center ring-1 ring-white/70"><div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[30px] bg-[#f4faef]">{pet.type === "image" ? <img src={pet.src} alt={petName} className="h-full w-full object-contain p-2" /> : <span className="text-6xl">{pet.emoji}</span>}</div><h2 className="mt-3 text-[19px] font-black text-[#20351d]">{petName}</h2><p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-[#6b7b66]">TA 会陪你观察匹配机会、记录桥约闭环，并在需要时提醒你。</p><Link href="/pets" className="mt-4 inline-flex items-center gap-1 rounded-full bg-[color:var(--primary)] px-4 py-2 text-[13px] font-bold text-white active:scale-95">去设置 <ChevronRight className="h-3.5 w-3.5" /></Link></div></div>;
}

function Segment({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={cn("flex items-center justify-center gap-1.5 rounded-[18px] py-2.5 text-[14px] font-bold transition active:scale-95", active ? "bg-white text-[#2F7D32] shadow-sm" : "text-[#60705b]")}>{icon}{label}</button>;
}

function MiniStat({ label, value, tone, icon }: { label: string; value: number | string; tone: "green" | "warm"; icon?: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/66 px-3 py-2 text-center ring-1 ring-white/70"><b className={cn("flex items-center justify-center gap-1 text-[18px]", tone === "green" ? "text-[#58A942]" : "text-[#f2a93b]")}>{icon}{value}</b><span className="mt-0.5 block text-[11px] text-[#6b7b66]">{label}</span></div>;
}

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-xl bg-[#eaf7df] text-[#2F7D32]">{icon}</span><h2 className="shrink-0 text-[17px] font-black text-[#20351d]">{title}</h2><span className="truncate text-[12px] text-[#6b7b66]">{sub}</span></div>;
}
