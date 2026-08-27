"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, LoaderCircle, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FlowShell, XiaotianAvatar } from "@/components/tsq/flow-shell";
import { tsqApi } from "@/lib/tsq/api";
import type { XiaotianTask, XiaotianTaskStep } from "@/lib/tsq/types";

export default function XiaotianTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { t } = useTranslation();
  const [task, setTask] = useState<XiaotianTask>();
  const [error, setError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    params
      .then(({ taskId }) => tsqApi.getXiaotianTask(taskId))
      .then((result) => active && setTask(result))
      .catch((cause: Error) => active && setError(cause.message));
    return () => { active = false; };
  }, [params, reloadKey]);

  function handleReload() {
    setTask(undefined);
    setError(undefined);
    setReloadKey((value) => value + 1);
  }

  async function handleRetry() {
    if (!task || retrying) return;
    setRetrying(true);
    setError(undefined);
    try {
      setTask(await tsqApi.retryXiaotianTask(task.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("tsq.xiaotian.task.retryFailed"));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <FlowShell title={t("tsq.xiaotian.task.title")} subtitle={t("tsq.xiaotian.task.subtitle")} right="help">
      {!task && !error ? <TaskSkeleton /> : error ? (
        <StateCard
          message={error}
          action={t("tsq.xiaotian.task.tryAgain")}
          onAction={handleReload}
        />
      ) : task ? (
        <div data-el="xiaotian-task" className="space-y-3">
          <section data-el="xiaotian-task-overview" className="rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-md)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={task.status} />
                  <h2 className="text-[19px] font-bold text-[#071D3A]">{t(`tsq.xiaotian.task.status.${task.status}`)}</h2>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#58708c]">{task.summary}</p>
              </div>
              <XiaotianAvatar size={64} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf1eb]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2679ff] to-[#47b679] transition-[width]" style={{ width: `${task.progress}%` }} />
            </div>
            <p className="mt-1 text-right text-[12px] font-semibold text-[#2679ff]">{task.progress}%</p>
          </section>

          <section data-el="xiaotian-task-steps" className="rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
            <h2 className="mb-3 text-[17px] font-bold text-[#071D3A]">{t("tsq.xiaotian.task.progressTitle")}</h2>
            <div className="space-y-3">
              {task.steps.map((step) => <TaskStepRow key={step.id} step={step} />)}
            </div>
          </section>

          {task.status === "failed" ? (
            <section data-el="xiaotian-task-failed" className="rounded-[22px] border border-[#f4d5c7] bg-[#fff8f4] p-4 text-center shadow-[var(--brand-shadow-sm)]">
              <TriangleAlert className="mx-auto h-8 w-8 text-[#e66f45]" />
              <h2 className="mt-2 text-[16px] font-bold text-[#071D3A]">{t("tsq.xiaotian.task.failedTitle")}</h2>
              <p className="mt-1 text-[13px] text-[#7a5b50]">{task.errorMessage}</p>
              <button data-el="xiaotian-task-retry" type="button" onClick={handleRetry} disabled={retrying} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2679ff] px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
                {retrying ? t("tsq.xiaotian.task.retrying") : t("tsq.xiaotian.task.retry")}
              </button>
            </section>
          ) : (
            <section data-el="xiaotian-task-candidates" className="rounded-[22px] bg-white/88 p-4 shadow-[var(--brand-shadow-sm)]">
              <h2 className="text-[17px] font-bold text-[#071D3A]">
                {task.candidates.length > 0
                  ? t("tsq.xiaotian.task.candidateCount", { count: task.candidates.length })
                  : t("tsq.xiaotian.task.searchingTitle")}
              </h2>
              {task.candidates.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {task.candidates.map((candidate) => (
                    <Link key={candidate.id} data-el="xiaotian-task-candidate" href={`/bridge/${candidate.bridgeId}`} className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white p-2.5 active:scale-[.99]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--soft)] font-semibold text-[color:var(--deep)]">{candidate.name.slice(0, 1)}</span>
                      <div className="min-w-0 flex-1"><b className="block truncate text-[14px]">{candidate.name}</b><p className="truncate text-[12px] text-[#58708c]">{candidate.description}</p></div>
                      <span className="rounded-full bg-[#e8f2ff] px-2 py-1 text-[12px] font-semibold text-[#2679ff]">{candidate.score}%</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-[color:var(--border)] bg-white/70 p-5 text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#2679ff]" />
                  <p className="mt-2 text-[13px] text-[#58708c]">{t("tsq.xiaotian.task.searchingBody")}</p>
                </div>
              )}
            </section>
          )}
        </div>
      ) : null}
    </FlowShell>
  );
}

function StatusIcon({ status }: { status: XiaotianTask["status"] }) {
  if (status === "completed") return <CheckCircle2 className="h-6 w-6 text-[#23a56f]" />;
  if (status === "failed") return <TriangleAlert className="h-6 w-6 text-[#e66f45]" />;
  return <Sparkles className="h-6 w-6 animate-pulse text-[#2679ff]" />;
}

function TaskStepRow({ step }: { step: XiaotianTaskStep }) {
  const Icon = step.status === "done" ? CheckCircle2 : step.status === "active" ? LoaderCircle : step.status === "failed" ? TriangleAlert : Circle;
  const tone = step.status === "done" ? "text-[#23a56f]" : step.status === "active" ? "text-[#2679ff]" : step.status === "failed" ? "text-[#e66f45]" : "text-[#a7b0ba]";
  return <div className="flex items-center gap-3"><Icon className={`h-5 w-5 shrink-0 ${tone} ${step.status === "active" ? "animate-spin" : ""}`} /><span className={`text-[14px] ${step.status === "pending" ? "text-[#7b8794]" : "font-medium text-[#243b5a]"}`}>{step.label}</span></div>;
}

function TaskSkeleton() {
  return <div aria-label="加载中" className="space-y-3"><div className="h-36 animate-pulse rounded-[22px] bg-white/70" /><div className="h-48 animate-pulse rounded-[22px] bg-white/70" /><div className="h-28 animate-pulse rounded-[22px] bg-white/70" /></div>;
}

function StateCard({ message, action, onAction }: { message: string; action: string; onAction: () => void }) {
  return <div className="rounded-[22px] border border-dashed border-[color:var(--border)] bg-white p-7 text-center"><p className="text-[14px] text-[#58708c]">{message}</p><button type="button" onClick={onAction} className="mt-4 rounded-full bg-[#2679ff] px-5 py-2.5 text-[14px] font-semibold text-white">{action}</button></div>;
}
