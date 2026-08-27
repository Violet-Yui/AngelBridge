"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/lib/tsq/data";
import { cn } from "@/utils/utils";

const STATUS_KEYS: BridgeStatus[] = ["pending", "accepted", "rejected"];
const TYPE_ORDER: BridgeType[] = ["coop", "friend", "swap"];

export default function BridgePage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BridgeStatus>("pending");
  const [invites, setInvites] = useState<Invite[]>(INVITES);
  const router = useRouter();

  const grouped = useMemo(() => {
    const list = invites.filter((i) => i.status === status);
    return TYPE_ORDER.map((type) => ({
      type,
      items: list.filter((i) => i.type === type),
    })).filter((g) => g.items.length > 0);
  }, [invites, status]);

  function resolve(id: string, accept: boolean) {
    setInvites((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: accept ? "accepted" : "rejected" } : i,
      ),
    );
    toast(accept ? t("tsq.bridge.toastAccept") : t("tsq.bridge.toastReject"));
    if (accept) router.push(`/messages/${id}`);
  }

  const counts = STATUS_KEYS.map((key) => ({
    key,
    n: invites.filter((i) => i.status === key).length,
  }));

  return (
    <AppShell>
      <PageHeader title={t("tsq.bridge.title")} subtitle={t("tsq.bridge.subtitle")} />

      <div className="mt-3 flex gap-2 px-4">
        {counts.map((c) => (
          <button
            key={c.key}
            onClick={() => setStatus(c.key)}
            data-el={`bridge-status-${c.key}`}
            className={cn(
              "flex-1 rounded-full py-2 text-sm active:scale-95",
              status === c.key
                ? "bg-[color:var(--primary)] font-semibold text-white shadow-[0_6px_16px_rgba(88,169,66,0.28)]"
                : "border border-[color:var(--border)] bg-white text-neutral-600",
            )}
          >
            {t(`tsq.bridge.${c.key}`)}{" "}
            {c.n > 0 && <span className="opacity-80">· {c.n}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-5 px-4">
        {grouped.length === 0 && (
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
                <span className={cn("grid h-6 w-6 place-items-center rounded-lg", meta.cls)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-[15px] font-semibold">
                  {t(`tsq.bridge.${g.type}`)}
                  {t("tsq.bridge.inviteSuffix")}
                </h2>
                <span className="text-[13px] text-muted-foreground">
                  {g.items.length} {t("tsq.bridge.count")}
                </span>
              </div>
              <div className="space-y-3">
                {g.items.map((inv) => (
                  <InviteCard key={inv.id} inv={inv} onResolve={resolve} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
