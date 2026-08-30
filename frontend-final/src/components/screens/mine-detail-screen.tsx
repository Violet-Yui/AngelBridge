"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Eye, EyeOff, Gift, Heart, MapPin, ShieldCheck, Sparkles, Star, XCircle, Zap } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { CommentSection } from "@/components/screens/comment-section";
import { useProfileStore, type MyPost, type PostFormField } from "@/stores/profile-store";
import { ME } from "@/lib/tsq/data";
import { DEFAULT_MY_POSTS } from "@/lib/tsq/my-default-posts";
import { cn } from "@/utils/utils";

const BADGE_STYLE: Record<string, string> = { green: "bg-[color:var(--soft)] text-[color:var(--deep)]", warm: "bg-[#fff4d9] text-[#bd7c10]", purple: "bg-[#eee8ff] text-[color:var(--purple)]" };
const COVER_STYLE: Record<string, string> = { green: "from-[#eaf6e5] to-[#dcefd2]", warm: "from-[#fff5df] to-[#ffe9c2]", purple: "from-[#f0ebfd] to-[#e5dcfa]" };
const FIELD_ICON: Record<string, React.ReactNode> = { provide: <Gift className="h-4 w-4" />, offer: <Gift className="h-4 w-4" />, receive: <Star className="h-4 w-4" />, need: <Star className="h-4 w-4" />, location: <MapPin className="h-4 w-4" />, firstAction: <Zap className="h-4 w-4" />, standard: <ShieldCheck className="h-4 w-4" />, exit: <Sparkles className="h-4 w-4" />, notes: <Sparkles className="h-4 w-4" /> };
const FIELD_TONE: Record<string, string> = { provide: "bg-[#eaf8ee] text-[#27a35b]", offer: "bg-[#eaf8ee] text-[#27a35b]", receive: "bg-[#edf4ff] text-[#3778ff]", need: "bg-[#edf4ff] text-[#3778ff]", location: "bg-[#fff4df] text-[#ff9e36]", firstAction: "bg-[#f1e9ff] text-[#8b5cf6]", standard: "bg-[#eaf8ee] text-[#27a35b]", exit: "bg-[#fff0ef] text-[#ff6868]", notes: "bg-[#f1e9ff] text-[#8b5cf6]" };

function statusMeta(post: MyPost) {
  const status = post.status ?? "published";
  const count = post.completedCount ?? 0;
  const visible = post.discoveryVisible ?? post.publicDisplay ?? true;
  if (status === "deleted") return { title: "已删除", desc: "帖子已从个人动态、漫游页和新匹配中隐藏；历史聊天与桥约仍保留引用。", cls: "bg-[#fff0ef] text-[#b64545]", icon: <XCircle className="h-4 w-4" /> };
  if (status === "completed") return visible
    ? { title: `已完成 ${count || 1} 次 · 成果展示`, desc: "匹配已关闭，仍作为成果内容出现在找人/找物等漫游页，但不会再进入新匹配。", cls: "bg-[#eaf7ef] text-[#1f7a3a]", icon: <Eye className="h-4 w-4" /> }
    : { title: `已完成 ${count || 1} 次 · 不公开`, desc: "匹配已关闭，帖子仅自己可见，也不会再被小天用于新匹配。", cls: "bg-[#f4f1ec] text-[#7a6d5f]", icon: <EyeOff className="h-4 w-4" /> };
  if (count > 0 || post.needsPostResolution) return { title: `已有履约完成 ${count || 1} 次 · 匹配中`, desc: "桥约已完成，但帖子默认仍保持匹配中。你可以继续匹配、关闭匹配或删除帖子。", cls: "bg-[#fff4df] text-[#bd7c10]", icon: <ShieldCheck className="h-4 w-4" /> };
  return { title: "匹配中", desc: "帖子正在公开展示，并可被小天用于匹配推荐。", cls: "bg-[#edf4ff] text-[#3778ff]", icon: <Sparkles className="h-4 w-4" /> };
}

export function MinePostDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const post = useProfileStore((s) => s.myPosts.find((p) => p.id === id)) ?? DEFAULT_MY_POSTS.find((p) => p.id === id);
  const updatePostStatus = useProfileStore((s) => s.updatePostStatus);
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);
  const [closeChoiceOpen, setCloseChoiceOpen] = useState(false);

  if (!post) {
    return <AppShell><div className="px-4 pt-6"><button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-neutral-500"><ChevronLeft className="h-4 w-4" /> 返回</button><p className="text-center text-muted-foreground">该内容不存在或已删除。</p></div></AppShell>;
  }

  const currentPost = post;
  const meta = statusMeta(currentPost);

  function markMatched() {
    updatePostStatus(id, { status: "published", matchedAt: "刚刚", completedCount: (currentPost.completedCount ?? 0) + 1, needsPostResolution: true, matchClosed: false, publicDisplay: true, discoveryVisible: true });
    toast("已记录一次履约完成，帖子默认仍保持匹配中");
  }
  function keepInviting() {
    updatePostStatus(id, { status: "published", needsPostResolution: false, matchClosed: false, publicDisplay: true, discoveryVisible: true });
    toast("已继续匹配，并清除本次待处理提示");
  }
  function closeAndShow() {
    updatePostStatus(id, { status: "completed", needsPostResolution: false, matchClosed: true, publicDisplay: true, discoveryVisible: true });
    setCloseChoiceOpen(false);
    toast("已关闭匹配，并作为成果继续展示");
  }
  function closeAndHide() {
    updatePostStatus(id, { status: "completed", needsPostResolution: false, matchClosed: true, publicDisplay: false, discoveryVisible: false });
    setCloseChoiceOpen(false);
    toast("已关闭匹配，并停止公开展示");
  }
  function deletePost() {
    updatePostStatus(id, { status: "deleted", needsPostResolution: false, matchClosed: true, publicDisplay: false, discoveryVisible: false });
    setCloseChoiceOpen(false);
    toast("已删除帖子；历史聊天与桥约仍保留引用");
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-[color:var(--bg-canvas)]/90 px-3 py-2 backdrop-blur"><button onClick={() => router.back()} aria-label="返回" className="grid h-9 w-9 place-items-center rounded-full active:scale-90"><ChevronLeft className="h-5 w-5" /></button><Link href="/me" className="flex min-w-0 items-center gap-2 active:opacity-70"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--soft)] text-[15px]">🌳</span><span className="flex min-w-0 flex-col"><span className="truncate text-[14px] font-semibold leading-tight">{ME.name}</span><span className="truncate text-[11px] text-muted-foreground">{ME.stage}</span></span></Link><Link href="/me" className="ml-auto shrink-0 rounded-full bg-[color:var(--primary)] px-3 py-1.5 text-[13px] font-semibold text-white active:scale-95">主页</Link></header>

      <div className={cn("relative overflow-hidden bg-gradient-to-br", COVER_STYLE[post.kind], "h-52")}>{post.images[0] ? <img src={post.images[0]} alt={post.title} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-7xl opacity-90" aria-hidden>{post.emoji}</span>}<span className={cn("absolute left-3 top-3 rounded-lg px-2 py-1 text-[12px] font-medium shadow-sm backdrop-blur-sm", BADGE_STYLE[post.kind])}>{post.channelLabel}</span><span className={cn("absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold shadow-sm backdrop-blur-sm", meta.cls)}>{meta.icon}{meta.title}</span></div>

      <div className="px-4 pt-4"><section className="mb-4 rounded-[22px] border border-[#e1ead1] bg-white/86 p-4 shadow-sm"><div className="flex items-start gap-3"><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", meta.cls)}>{meta.icon}</span><div className="min-w-0 flex-1"><h2 className="text-[16px] font-black text-[#20351d]">{meta.title}</h2><p className="mt-1 text-[13px] leading-relaxed text-[#6b7b66]">{meta.desc}</p></div></div><div className="mt-4 space-y-2">{(post.status ?? "published") !== "deleted" && (post.completedCount ?? 0) === 0 && <button onClick={markMatched} className="w-full rounded-full bg-[#62A75C] py-3 text-[14px] font-bold text-white active:scale-95">演示：记录一次履约完成</button>}{post.needsPostResolution && post.status !== "deleted" && <div className="grid grid-cols-3 gap-2"><button onClick={keepInviting} className="rounded-full border border-[#dce8d6] bg-white py-3 text-[12px] font-bold text-[#5f7159] active:scale-95">继续匹配</button><button onClick={() => setCloseChoiceOpen(true)} className="rounded-full bg-[#62A75C] py-3 text-[12px] font-bold text-white active:scale-95">关闭匹配</button><button onClick={deletePost} className="rounded-full bg-[#fff0ef] py-3 text-[12px] font-bold text-[#b64545] active:scale-95">删除帖子</button></div>}{post.status === "completed" && (post.discoveryVisible ?? post.publicDisplay ?? true) && <button onClick={keepInviting} className="w-full rounded-full border border-[#dce8d6] bg-white py-3 text-[14px] font-bold text-[#1f7a3a] active:scale-95">重新开放匹配</button>}{post.status === "completed" && !(post.discoveryVisible ?? post.publicDisplay ?? true) && <button onClick={closeAndShow} className="w-full rounded-full bg-[#62A75C] py-3 text-[14px] font-bold text-white active:scale-95">改为成果展示</button>}{post.status === "deleted" && <p className="rounded-2xl bg-[#fff0ef] px-3 py-2 text-[12px] font-semibold text-[#b64545]">已从个人动态、漫游和新匹配中隐藏。</p>}</div></section><h1 className="text-[19px] font-bold leading-snug">{post.title}</h1><p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700">{post.text}</p>{post.images.length > 1 && <div className="mt-3 grid grid-cols-3 gap-2">{post.images.slice(1).map((src, i) => <div key={i} className="aspect-square overflow-hidden rounded-xl border border-[color:var(--border)]"><img src={src} alt="" className="h-full w-full object-cover" /></div>)}</div>}<div className="mt-4 flex items-center gap-3 text-[12px] text-neutral-500"><span>{post.place}</span><span>·</span><span>{post.time}</span></div></div>

      <div className="mt-4 flex items-center gap-2.5 px-4"><BigAction active={liked} activeCls="border-[color:var(--warm)] bg-[#fff4d9] text-[#bd7c10]" icon={<Heart className={cn("h-5 w-5", liked && "fill-[color:var(--warm)] text-[color:var(--warm)]")} />} label={`点赞 ${post.likes + (liked ? 1 : 0)}`} onClick={() => { setLiked((v) => !v); toast(liked ? "已取消点赞" : "已点赞 ❤️"); }} /><BigAction active={faved} activeCls="border-[#f5b625] bg-[#fff7e0] text-[#a9791a]" icon={<Star className={cn("h-5 w-5", faved && "fill-[#f5b625] text-[#f5b625]")} />} label={`收藏 ${post.favorites + (faved ? 1 : 0)}`} onClick={() => { setFaved((v) => !v); toast(faved ? "已取消收藏" : "已收藏 ⭐"); }} /></div>
      <CommentSection initial={post.comments} />

      {closeChoiceOpen && <div className="fixed inset-0 z-50 mx-auto flex max-w-[var(--app-max-width)] items-end bg-black/40" onClick={() => setCloseChoiceOpen(false)}><div className="w-full rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}><h3 className="text-[18px] font-black text-[#20351d]">关闭匹配后，帖子是否继续展示？</h3><p className="mt-2 text-[13px] leading-relaxed text-[#6b7b66]">关闭匹配会把状态设为已完成。选择继续展示：作为成果内容出现在找人/找物等漫游页，但不再进入新匹配；选择不展示：仅自己可见。</p><div className="mt-5 space-y-2"><button onClick={closeAndShow} className="flex w-full items-center justify-between rounded-2xl bg-[#eaf7ef] px-4 py-3 text-left text-[14px] font-bold text-[#1f7a3a] active:scale-[.99]"><span>关闭匹配 · 继续成果展示</span><Eye className="h-4 w-4" /></button><button onClick={closeAndHide} className="flex w-full items-center justify-between rounded-2xl bg-[#f4f1ec] px-4 py-3 text-left text-[14px] font-bold text-[#6f6359] active:scale-[.99]"><span>关闭匹配 · 不公开展示</span><EyeOff className="h-4 w-4" /></button><button onClick={deletePost} className="flex w-full items-center justify-between rounded-2xl bg-[#fff0ef] px-4 py-3 text-left text-[14px] font-bold text-[#b64545] active:scale-[.99]"><span>删除帖子 · 隐藏所有入口</span><XCircle className="h-4 w-4" /></button><button onClick={() => setCloseChoiceOpen(false)} className="mt-2 w-full rounded-full py-3 text-[14px] font-semibold text-[#758274]">取消</button></div></div></div>}

      
    </AppShell>
  );
}

function StructuredPost({ fields }: { fields: PostFormField[] }) { return <div className="mt-3 divide-y divide-[#edf1e9] overflow-hidden rounded-[24px] bg-white shadow-[0_12px_28px_rgba(55,95,42,0.08)] ring-1 ring-white/80">{fields.map((field) => <div key={field.key} className="flex gap-3 p-3.5"><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", FIELD_TONE[field.key] ?? "bg-[#eef3ea] text-[#5f7159]")}>{FIELD_ICON[field.key] ?? <Sparkles className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-1 text-[14px] font-black text-[#20351d]">{field.label}{field.required && <span className="text-[#ff6868]">*</span>}</div><p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[#263b22]">{field.value || "未填写"}</p></div></div>)}</div>; }
function BigAction({ active, activeCls, icon, label, onClick }: { active: boolean; activeCls: string; icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-[14px] font-semibold active:scale-95", active ? activeCls : "border-[color:var(--border)] bg-white text-neutral-600")}>{icon}{label}</button>; }
