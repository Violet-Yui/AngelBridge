"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { AppShell } from "@/components/tsq/app-shell";
import { PageHeader } from "@/components/tsq/page-header";
import { CREATE_CHANNELS } from "@/lib/tsq/data";
import { cn } from "@/utils/utils";
import { useRouter } from "next/navigation";
import { tsqApi } from "@/lib/tsq/api";

const KIND_TAG: Record<string, string> = {
  green: "border-[color:var(--primary)] bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "border-[#f3d59a] bg-[#fff4d9] text-[#bd7c10]",
  purple: "border-[#cfc2f2] bg-[#eee8ff] text-[color:var(--purple)]",
};

export default function CreatePage() {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<string>("person");
  const [intent, setIntent] = useState<"have" | "want">("have");
  const [text, setText] = useState("");
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  function publish() {
    if (!text.trim()) {
      toast(t("tsq.create.empty"));
      return;
    }
    setPublishing(true);
    tsqApi.createPost({ channel, intent, text }).then(({ postId }) => {
      toast(t("tsq.create.published"), { description: text.trim() });
      router.push(`/create/success?postId=${postId}`);
    }).catch((e) => toast(e.message)).finally(() => setPublishing(false));
  }

  return (
    <AppShell>
      <PageHeader title={t("tsq.create.title")} subtitle={t("tsq.create.subtitle")} />

      <div className="space-y-5 px-4 pt-4">
        {/* 我拥有 / 我想要 */}
        <div className="flex gap-2">
          {(["have", "want"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setIntent(key)}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm active:scale-95",
                intent === key
                  ? "bg-[color:var(--primary)] font-semibold text-white shadow-[0_6px_16px_rgba(88,169,66,0.28)]"
                  : "border border-[color:var(--border)] bg-white text-neutral-600",
              )}
            >
              {t(`tsq.create.${key}`)}
            </button>
          ))}
        </div>

        {/* 选择频道 */}
        <section>
          <h2 className="mb-2.5 text-[15px] font-semibold">{t("tsq.create.pickChannel")}</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {CREATE_CHANNELS.map((c) => (
              <button
                key={c.key}
                onClick={() => setChannel(c.key)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition active:scale-95",
                  channel === c.key
                    ? KIND_TAG[c.kind]
                    : "border-[color:var(--border)] bg-white text-neutral-700",
                )}
              >
                <p className="text-[15px] font-semibold">{c.label}</p>
                <p className="mt-1 text-[12px] leading-snug opacity-80">{c.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 内容 */}
        <section>
          <h2 className="mb-2.5 text-[15px] font-semibold">
            {intent === "have" ? t("tsq.create.describeHave") : t("tsq.create.describeWant")}
          </h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={
              intent === "have"
                ? t("tsq.create.placeholderHave")
                : t("tsq.create.placeholderWant")
            }
            className="w-full resize-none rounded-2xl border border-[color:var(--border)] bg-white p-3.5 text-[15px] leading-relaxed outline-none focus:border-[color:var(--primary)]"
          />
        </section>

        <button
          onClick={publish}
          disabled={publishing}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-[16px] font-semibold text-white shadow-[0_8px_18px_rgba(88,169,66,0.32)] active:scale-[0.98]"
        >
          <Send className="h-4.5 w-4.5" /> {publishing ? "发布中…" : t("tsq.create.publish")}
        </button>
      </div>
    </AppShell>
  );
}
