"use client";

import { toast } from "sonner";
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
} from "lucide-react";
import { type Invite, type BridgeType } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

export const TYPE_META: Record<BridgeType, { icon: typeof Users; cls: string }> = {
  coop: { icon: Handshake, cls: "bg-[#eee8ff] text-[color:var(--purple)]" },
  friend: { icon: Users, cls: "bg-[color:var(--soft)] text-[color:var(--deep)]" },
  swap: { icon: Repeat2, cls: "bg-[#fff4d9] text-[#bd7c10]" },
};

export function InviteCard({
  inv,
  onResolve,
}: {
  inv: Invite;
  onResolve: (id: string, accept: boolean) => void;
}) {
  const { t } = useTranslation();
  const rejected = inv.status === "rejected";
  const byXiaotian = inv.source === "小天撮合";

  return (
    <article
      data-el="bridge-invite-card"
      className={cn(
        "rounded-[20px] border border-[color:var(--border)] bg-white p-3.5 shadow-[0_8px_20px_rgba(55,95,42,0.06)]",
        rejected && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--soft)] text-sm text-[color:var(--deep)]">
            {inv.person.slice(0, 1)}
          </span>
          <div>
            <b className="text-[15px]">{inv.person}</b>
            <p className="text-[12px] text-muted-foreground">
              {inv.place} · {inv.time}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[11px]",
            byXiaotian
              ? "bg-[color:var(--soft)] text-[color:var(--deep)]"
              : "bg-neutral-100 text-neutral-500",
          )}
        >
          {byXiaotian && <Sparkles className="h-3 w-3" />}
          {inv.source}
        </span>
      </div>
      <Link href={`/bridge/${inv.id}`} className="mt-2 inline-block text-[12px] text-[color:var(--deep)]">查看桥约详情 ›</Link>

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

      {inv.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onResolve(inv.id, false)}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#f5f5f1] py-2.5 text-sm text-neutral-600 active:scale-95"
          >
            <X className="h-4 w-4" /> {t("tsq.bridge.reject")}
          </button>
          <button
            onClick={() => onResolve(inv.id, true)}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[color:var(--primary)] py-2.5 text-sm font-medium text-white active:scale-95"
          >
            <Check className="h-4 w-4" /> {t("tsq.bridge.accept")}
          </button>
        </div>
      )}
      {inv.status === "accepted" && (
        <button
          onClick={() => toast(t("tsq.messages.open", { name: inv.person }))}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[color:var(--primary)] py-2.5 text-sm font-medium text-[color:var(--deep)] active:scale-95"
        >
          <MessageCircle className="h-4 w-4" /> {t("tsq.bridge.enterChat")}
        </button>
      )}
      {rejected && (
        <p className="mt-3 text-center text-[13px] text-muted-foreground">
          {t("tsq.bridge.archived")}
        </p>
      )}
    </article>
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
      <p className="mt-1 text-[13px] font-medium leading-snug text-neutral-800">
        {value}
      </p>
    </div>
  );
}
