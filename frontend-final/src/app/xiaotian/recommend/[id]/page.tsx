"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { HOME_MATCHES, type Match } from "@/lib/tsq/data";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { MatchView, PublicationDetail } from "@/lib/angelbridge-types";
import { cn } from "@/utils/utils";
import { getPublicationVisual } from "@/lib/tsq/publication-visual";

const POST_LINK: Record<string, string> = {
  m1: "/discover/p3",
  m2: "/channel/space1",
  m3: "/channel/job1",
  m4: "/channel/swap1",
};

const REASON_DETAIL: Record<string, string[]> = {
  m1: ["你的人生树里已经呈现出设计能力与共创意愿。", "这位资源设计师同样在寻找长期协作伙伴，供需关系比较顺。", "先从小项目共创切入，风险低，也更容易验证默契。"],
  m2: ["你的心愿里包含稳定空间、远程工作与生活质量。", "这套房源的采光、交通和居住感，贴近你当前阶段的需求。", "建议先确认通勤半径与预算，再判断是否继续沟通。"],
  m3: ["你正在探索新职业与远程工作可能性。", "这个产品经理机会与你的创意、组织和项目推进能力有重合。", "如果感兴趣，可以重点查看岗位要求和成长路径。"],
  m4: ["你拥有可交换的技能或资源，也希望获得新的服务支持。", "这个互换机会能把你的资产转化成对方需要的价值。", "适合先聊清楚交付边界，再决定是否搭桥。"],
};

export default function RecommendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [matchView, setMatchView] = useState<MatchView | null>(null);
  const [publication, setPublication] = useState<PublicationDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    angelbridgeApi.getMatch(id).then(async (result) => {
      const detail = result.counterpartPublicationId
        ? await angelbridgeApi.getPublication(result.counterpartPublicationId)
        : null;
      if (active) {
        setMatchView(result);
        setPublication(detail);
      }
    }).catch((error) => toast.error(error instanceof Error ? error.message : "读取匹配详情失败"))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [id]);

  // Static cards are only valid for the mature showcase routes. Do not flash
  // the first showcase card while a real user's match is being fetched.
  const fallback = HOME_MATCHES.find((item) => item.id === id);
  const publicationVisual = publication ? getPublicationVisual(publication) : null;
  const match: Match | undefined = matchView ? {
    id: matchView.matchId,
    kind: publicationVisual?.kind ?? "green",
    tag: matchView.primaryPattern ?? "匹配机会",
    scoreRange: `${Math.round(matchView.bridgeIndex)}%`,
    image: publication?.images[0]?.url ?? (publication ? "/brand/home-logo.png" : ""),
    visualEmoji: publicationVisual?.emoji ?? "🤝",
    title: matchView.counterpartPublicationTitle ?? matchView.counterpartDisplayName,
    reason: matchView.matchReasons[0]?.text ?? matchView.valueToYou[0] ?? "值得进一步连接",
    interested: 0,
  } : fallback;
  if (!match) {
    return (
      <FlowShell title="小天推荐" subtitle="为什么推荐这个资源" right="none">
        <p className="py-20 text-center text-sm text-muted-foreground">
          {loading ? "正在整理匹配结果…" : "这条匹配已不可用。"}
        </p>
      </FlowShell>
    );
  }
  const reasons = matchView?.matchReasons.slice(0, 3).map((reason) => reason.text)
    ?? REASON_DETAIL[match.id]
    ?? [match.reason];
  const postHref = matchView?.counterpartPublicationId
    ? `/discover/${matchView.counterpartPublicationId}`
    : POST_LINK[match.id] ?? "/discover";

  async function acceptMatch() {
    setSubmitting(true);
    try {
      // A recommendation can remain open after the counterpart has already
      // accepted. Treat the action as a safe retry and continue to the pact.
      if (matchView?.status === "mutual_accepted" || matchView?.yourDecision === "accepted") {
        router.push("/bridge");
        return;
      }
      await angelbridgeApi.decideMatch(id, "accepted");
      router.push("/bridge");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "邀请发送失败");
      setSubmitting(false);
    }
  }

  return (
    <FlowShell title="小天推荐" subtitle="为什么推荐这个资源" right="none">
      <section className="overflow-hidden rounded-[26px] border border-[color:var(--border)] bg-white/78 shadow-[var(--brand-shadow-md)] backdrop-blur-md">
        <div className="relative h-36 w-full overflow-hidden bg-[color:var(--soft)]">
          {match.image ? <Image src={match.image} alt={match.title} fill sizes="430px" className="object-cover" /> : <span className="grid h-full w-full place-items-center text-7xl opacity-90" aria-hidden>{match.visualEmoji ?? "🤝"}</span>}
          <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm", match.kind === "green" ? "bg-[#e8f4e0] text-[#4c8a37]" : match.kind === "warm" ? "bg-[#fdeede] text-[#bd7c10]" : "bg-[#eee8ff] text-[color:var(--purple)]")}>{match.tag}</span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <XiaotianAvatar size={42} />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-[#f4faef] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-[color:var(--deep)]">
                <Sparkles className="h-3.5 w-3.5" /> 小天这样判断
              </div>
              <h2 className="text-[18px] font-black leading-tight text-[#071D3A]">{match.title}</h2>
              <p className="mt-1 text-[13px] text-[#52636f]">匹配度 {match.scoreRange}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {reasons.map((reason, index) => (
              <div key={reason} className="flex gap-2.5 rounded-2xl bg-white/70 p-3 ring-1 ring-[#edf1e8]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">{index + 1}</span>
                <p className="text-[13px] leading-relaxed text-[#24321f]">{reason}</p>
              </div>
            ))}
          </div>

          <section className="mt-4 rounded-2xl border border-[#bde7cb] bg-[#f5fbf1] p-3">
            <p className="text-[13px] font-semibold text-[#071D3A]">是否确定让小天发出邀请？</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#58708c]">确认后小天会先转达你的边界和诉求，再进入牵线搭桥流程。</p>
            {declined ? (
              <div className="mt-3 rounded-2xl bg-white p-3 text-[13px] text-[#58708c] ring-1 ring-[#dfe7ee]">
                已暂不发出邀请。小天会保留这个推荐，你可以返回聊天继续调整需求。
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setDeclined(true)} className="flex h-10 items-center justify-center gap-1 rounded-full bg-white text-[13px] font-bold text-[#58708c] ring-1 ring-[#dfe7ee] active:scale-[.98]"><XCircle className="h-4 w-4" />暂不发出</button>
                <button disabled={submitting || !matchView} onClick={acceptMatch} className="flex h-10 items-center justify-center gap-1 rounded-full bg-[color:var(--primary)] text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(88,169,66,.22)] active:scale-[.98] disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />确定邀请</button>
              </div>
            )}
          </section>

          <Link href={postHref} className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-bold text-[#2679ff] ring-1 ring-[#cfe0ff] active:scale-[.98]">
            查看帖子详情 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </FlowShell>
  );
}
