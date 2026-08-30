"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/tsq/app-shell";
import { PageHeader } from "@/components/tsq/page-header";
import { InviteCard, TYPE_META } from "@/components/tsq/invite-card";
import {
  INVITES,
  type Invite,
  type BridgeStatus,
  type BridgeType,
  type BridgeReview,
} from "@/lib/tsq/data";
import { cn } from "@/utils/utils";
import { angelbridgeApi } from "@/lib/angelbridge-api";
import type { MatchView, PactView } from "@/lib/angelbridge-types";
import { isMatureShowcaseSession } from "@/lib/angelbridge-session";

// 桥约状态流：已接收 / 等待对方确认 / 进行中 / 已完成
const STATUS_KEYS = ["pending", "waiting", "accepted", "ongoing", "done"] as const;
type BridgeTab = (typeof STATUS_KEYS)[number];
const TYPE_ORDER: BridgeType[] = ["coop", "friend", "swap"];
const TAB_LABELS: Record<BridgeTab, string> = {
  pending: "已接收",
  waiting: "等待对方确认",
  accepted: "已确认",
  ongoing: "进行中",
  done: "已完成",
};

type WaitingInvite = { id: string; person: string; type: string; desc: string; createdAt: string };

const MATURE_SHOWCASE_NAMES = new Set(["设计小站", "摄影师小林"]);
const SHOWCASE_INVITES: Invite[] = [
  ...INVITES.filter((item) => !MATURE_SHOWCASE_NAMES.has(item.person) && item.status !== "rejected"),
  {
    id: "showcase-ongoing",
    status: "ongoing",
    type: "friend",
    source: "小天撮合",
    person: "南风",
    place: "北京 · 朝阳区",
    time: "今天",
    desc: "已约定周末一起参加城市漫步，桥约正在进行中。",
    chatThread: "c3",
  },
  {
    id: "showcase-done",
    status: "done",
    type: "coop",
    source: "对方发起",
    person: "创意工作室",
    place: "深圳 · 南山区",
    time: "昨天完成",
    desc: "完成了一次品牌内容共创，双方已确认履约。",
    myReview: {
      result: "completed",
      rating: 5,
      tags: ["沟通顺畅", "守时靠谱", "超出预期", "还会再合作"],
      note: "沟通细致，现场执行稳定，期待继续合作。",
    },
  },
];

const SHOWCASE_WAITING: WaitingInvite[] = [
  {
    id: "showcase-waiting-1",
    person: "产品经理交流小组",
    type: "合作邀约",
    desc: "你已通过小天发出加入交流小组的邀约，等待对方确认是否开放沟通。",
    createdAt: "今天 10:26 发起",
  },
  {
    id: "showcase-waiting-2",
    person: "品牌摄影师阿杰",
    type: "资源互助",
    desc: "你希望用周末工作室交换一组品牌照片，小天已转达你的交换边界。",
    createdAt: "今天 09:48 发起",
  },
];

const asType = (match: MatchView): BridgeType =>
  match.primaryPattern === "reciprocal_exchange" || (match.valueToYou.length > 0 && match.valueToOther.length > 0)
    ? "swap"
    : "coop";

function matchInvite(match: MatchView, chatThread?: string): Invite {
  const type = asType(match);
  return {
    id: match.matchId,
    status: "pending",
    type,
    source: "对方发起",
    person: match.counterpartDisplayName,
    place: "天使桥",
    time: "刚刚",
    mine: type === "swap" ? match.valueToYou[0] ?? "我的资源" : undefined,
    theirs: type === "swap" ? match.valueToOther[0] ?? "对方资源" : undefined,
    desc: type === "swap" ? undefined : match.valueToYou.join("；") || "对方希望与你进一步连接。",
    postHref: match.counterpartPublicationId ? `/discover/${match.counterpartPublicationId}` : undefined,
    chatThread,
  };
}

function pactInvite(pact: PactView, match: MatchView | undefined, chatThread?: string): Invite {
  const type = match ? asType(match) : "coop";
  const status: BridgeStatus = pact.status === "completed"
    ? "done"
    : pact.status === "active" || pact.status === "waiting_completion"
      ? "ongoing"
      : "accepted";
  return {
    id: pact.matchId,
    status,
    type,
    source: "小天撮合",
    person: pact.counterpartDisplayName,
    place: "天使桥",
    time: "最近",
    mine: type === "swap" ? pact.valueToYou[0] ?? "我的资源" : undefined,
    theirs: type === "swap" ? pact.valueToOther[0] ?? "对方资源" : undefined,
    desc: type === "swap" ? undefined : pact.valueToYou.join("；") || pact.title,
    postHref: match?.counterpartPublicationId ? `/discover/${match.counterpartPublicationId}` : undefined,
    chatThread,
  };
}

export default function BridgePage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BridgeTab>("pending");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [waitingInvites, setWaitingInvites] = useState<WaitingInvite[]>([]);
  const [messageTarget, setMessageTarget] = useState<WaitingInvite | null>(null);
  const [messageText, setMessageText] = useState("");

  const reload = useCallback(async () => {
    const [matches, pacts, conversations] = await Promise.all([
      angelbridgeApi.getMatches(),
      angelbridgeApi.getPacts(),
      angelbridgeApi.getConversations(),
    ]);
    const matchById = new Map(matches.map((item) => [item.matchId, item]));
    const conversationByMatch = new Map(conversations.map((item) => [item.matchId, item.conversationId]));
    const received = matches
      .filter((item) => item.yourDecision === null && item.counterpartDecision === "accepted")
      .map((item) => matchInvite(item, conversationByMatch.get(item.matchId)));
    const pactInvites = pacts.map((pact) => pactInvite(
      pact,
      matchById.get(pact.matchId),
      conversationByMatch.get(pact.matchId),
    ));
    const realInvites = [...received, ...pactInvites];
    const realWaiting = matches
      .filter((item) => item.yourDecision === "accepted" && item.counterpartDecision !== "accepted")
      .map((item) => ({
        id: item.matchId,
        person: item.counterpartDisplayName,
        type: "连接邀约",
        desc: item.valueToYou.join("；") || "小天已转达你的连接意向。",
        createdAt: "等待对方确认",
      }));
    const useShowcaseFixtures = realInvites.length === 0 && realWaiting.length === 0 && isMatureShowcaseSession();
    setInvites(useShowcaseFixtures ? SHOWCASE_INVITES : realInvites);
    setWaitingInvites(useShowcaseFixtures ? SHOWCASE_WAITING : realWaiting);
  }, []);

  useEffect(() => {
    void reload().catch((error) => toast.error(error instanceof Error ? error.message : "桥约读取失败"));
  }, [reload]);

  const grouped = useMemo(() => {
    if (status === "waiting") return [];
    const list = invites.filter((i) => i.status === status);
    return TYPE_ORDER.map((type) => ({
      type,
      items: list.filter((i) => i.type === type),
    })).filter((g) => g.items.length > 0);
  }, [invites, status]);

  // 接受 / 拒绝
  async function resolve(id: string, accept: boolean) {
    if (SHOWCASE_INVITES.some((item) => item.id === id)) {
      setInvites((list) => accept
        ? list.map((item) => item.id === id ? { ...item, status: "accepted" } : item)
        : list.filter((item) => item.id !== id));
      toast(accept ? t("tsq.bridge.toastAccept") : t("tsq.bridge.toastReject"));
      return;
    }
    await angelbridgeApi.decideMatch(id, accept ? "accepted" : "rejected");
    await reload();
    toast(accept ? t("tsq.bridge.toastAccept") : t("tsq.bridge.toastReject"));
  }

  // 推进到「进行中」
  function start(id: string) {
    setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: "ongoing" } : i)));
    toast("桥约已开始，完成后记得来确认～");
  }

  // 完成确认 + 双向评价 → 已完成
  function complete(id: string, review: BridgeReview) {
    setInvites((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "done", myReview: review } : i)),
    );
    toast("已完成并评价，成长值 +20 🌱");
  }

  const counts = STATUS_KEYS.map((key) => ({
    key,
    n: key === "waiting" ? waitingInvites.length : invites.filter((i) => i.status === key).length,
  }));

  return (
    <AppShell>
      <PageHeader title={t("tsq.bridge.title")} subtitle={t("tsq.bridge.subtitle")} />

      <div className="tsq-noscroll mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {counts.map((c) => (
          <button
            key={c.key}
            onClick={() => setStatus(c.key)}
            data-el={`bridge-status-${c.key}`}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1 rounded-full px-3.5 py-2 text-sm active:scale-95",
              status === c.key
                ? "bg-[color:var(--primary)] font-semibold text-white shadow-[0_6px_16px_rgba(88,169,66,0.28)]"
                : "border border-[color:var(--border)] bg-white text-neutral-600",
            )}
          >
            <span className="truncate">{TAB_LABELS[c.key]}</span>
            {c.n > 0 && <span className="shrink-0 opacity-80">· {c.n}</span>}
          </button>
        ))}
      </div>

      {status === "waiting" && (
        <section className="mx-4 mt-4 rounded-[22px] border border-[#dbeed0] bg-[#f6fbf1]/92 p-3.5 shadow-[var(--brand-shadow-sm)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#071D3A]">等待对方确认</h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">我发出的邀约，正在等待对方回应</p>
            </div>
            <span className="rounded-full bg-[#eaf7df] px-2.5 py-1 text-[12px] font-semibold text-[#2F7D32]">{waitingInvites.length} 个</span>
          </div>
          <div className="space-y-2.5">
            {waitingInvites.map((item) => (
              <article key={item.id} className="rounded-2xl bg-white/90 p-3 ring-1 ring-[#dbeed0]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-[14px] text-[#071D3A]">{item.person}</b>
                    <span className="mt-1 inline-block rounded-full bg-[#eaf7df] px-2 py-0.5 text-[11px] font-medium text-[#2F7D32]">{item.type}</span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-[#58A942]">{item.createdAt}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#45623f]">{item.desc}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={() => { setWaitingInvites((list) => list.filter((x) => x.id !== item.id)); toast("已撤回该邀约"); }} className="rounded-full bg-white py-2 text-[12px] font-bold text-[#45623f] ring-1 ring-[#dbeed0] active:scale-95">撤回</button>
                  <button onClick={() => setMessageTarget(item)} className="rounded-full bg-white py-2 text-[12px] font-bold text-[#2F7D32] ring-1 ring-[#cdebc0] active:scale-95">留言</button>
                  <button onClick={() => toast(`已提醒 ${item.person} 查看邀约`)} className="rounded-full bg-[color:var(--primary)] py-2 text-[12px] font-bold text-white shadow-sm active:scale-95">催促</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 space-y-5 px-4">
        {status !== "waiting" && grouped.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-[color:var(--border)] bg-white/60 py-14 text-center">
            <p className="text-sm text-muted-foreground">{t("tsq.bridge.empty")}</p>
          </div>
        )}
        {grouped.map((g) => {
          const meta = TYPE_META[g.type];
          const Icon = meta.icon;
          return (
            <section key={g.type}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-lg", meta.cls)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h2 className="truncate text-[15px] font-semibold">
                  {t(`tsq.bridge.${g.type}`)}
                  {t("tsq.bridge.inviteSuffix")}
                </h2>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {g.items.length} {t("tsq.bridge.count")}
                </span>
              </div>
              <div className="space-y-3">
                {g.items.map((inv) => (
                  <InviteCard
                    key={inv.id}
                    inv={inv}
                    onResolve={resolve}
                    onStart={start}
                    onComplete={complete}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {messageTarget && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/35 px-4 pb-6" onClick={() => setMessageTarget(null)}>
          <div className="w-full rounded-3xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[17px] font-bold text-[#071D3A]">给 {messageTarget.person} 留言</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">留言会跟随这次邀约一起发送，对方确认前可查看。</p>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} placeholder="补充一句你的来意、时间或边界…" className="mt-3 w-full resize-none rounded-2xl border border-[color:var(--border)] bg-[#fbfcf8] p-3 text-[14px] outline-none focus:border-[color:var(--primary)]" />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setMessageTarget(null)} className="flex-1 rounded-full bg-[#f3f5ef] py-3 text-[14px] font-bold text-[#58708c] active:scale-95">取消</button>
              <button onClick={() => {
                const note = messageText.trim();
                if (note) setWaitingInvites((list) => list.map((item) => item.id === messageTarget.id ? { ...item, desc: `${item.desc} · 留言：${note}` } : item));
                toast("留言已发送");
                setMessageText("");
                setMessageTarget(null);
              }} className="flex-1 rounded-full bg-[color:var(--primary)] py-3 text-[14px] font-bold text-white active:scale-95">发送留言</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
