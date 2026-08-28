"use client";

import Link from "next/link";
import { useCallback, useEffect, useReducer } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/tsq/app-shell";
import { tsqApi } from "@/lib/tsq/api";
import { createSettingsState, settingsReducer } from "@/lib/tsq/settings-state";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(settingsReducer, undefined, createSettingsState);
  const load = useCallback(async () => {
    dispatch({ type: "loadStarted" });
    try { dispatch({ type: "loadSucceeded", settings: await tsqApi.getSettings() }); }
    catch { dispatch({ type: "loadFailed" }); }
  }, []);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(initialLoadTimer);
  }, [load]);

  async function save() {
    if (!state.draft || !state.dirty || state.status === "saving") return;
    dispatch({ type: "saveStarted" });
    try { dispatch({ type: "saveSucceeded", settings: await tsqApi.updateSettings(state.draft) }); }
    catch { dispatch({ type: "saveFailed" }); }
  }

  return <AppShell>
    <header data-el="settings-header" className="flex items-center gap-3 px-4 pb-3 pt-2">
      <Link href="/me" aria-label={t("tsq.settings.back")} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"><ArrowLeft className="h-5 w-5" /></Link>
      <div><h1 className="text-[22px] font-bold">{t("tsq.settings.title")}</h1><p className="text-xs text-muted-foreground">{t("tsq.settings.subtitle")}</p></div>
    </header>
    {state.status === "loading" && <SettingsSkeleton />}
    {state.status === "loadError" && <section data-el="settings-load-error" className="mx-4 rounded-[24px] border border-[color:var(--border)] bg-white p-6 text-center shadow-sm"><p className="font-medium text-[var(--deep)]">{t("tsq.settings.loadFailed")}</p><p className="mt-2 text-sm text-muted-foreground">{t("tsq.settings.loadFailedHint")}</p><button type="button" onClick={load} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[color:var(--primary)] px-5 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />{t("tsq.settings.retry")}</button></section>}
    {state.draft && state.status !== "loading" && state.status !== "loadError" && <div data-el="settings-form" className="space-y-3 px-4">
      <SettingRow label={t("tsq.settings.notifications")} description={t("tsq.settings.notificationsHint")} checked={state.draft.notifications} onClick={() => dispatch({ type: "toggle", key: "notifications" })} />
      <SettingRow label={t("tsq.settings.publicProfile")} description={t("tsq.settings.publicProfileHint")} checked={state.draft.publicProfile} onClick={() => dispatch({ type: "toggle", key: "publicProfile" })} />
      <div className="rounded-[20px] border border-[color:var(--border)] bg-white p-4"><p className="text-sm font-medium">{t("tsq.settings.language")}</p><p className="mt-1 text-sm text-muted-foreground">{state.draft.language === "zh-CN" ? t("language.zhCN") : t("language.enUS")}</p></div>
      <button type="button" onClick={save} disabled={!state.dirty || state.status === "saving"} className="h-12 w-full rounded-full bg-[color:var(--primary)] px-4 text-sm font-semibold text-white disabled:opacity-45">{state.status === "saving" ? t("tsq.settings.saving") : state.status === "saveError" ? t("tsq.settings.retrySave") : t("tsq.settings.save")}</button>
      {state.status === "saved" && <p role="status" className="text-center text-sm text-[var(--deep)]">{t("tsq.settings.saved")}</p>}
      {state.status === "saveError" && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{t("tsq.settings.saveFailed")}</p>}
    </div>}
  </AppShell>;
}

function SettingsSkeleton() { return <div data-el="settings-loading" aria-label="loading" className="space-y-3 px-4"><div className="h-24 animate-pulse rounded-[20px] bg-white/70" /><div className="h-24 animate-pulse rounded-[20px] bg-white/70" /><div className="h-20 animate-pulse rounded-[20px] bg-white/70" /></div>; }

function SettingRow({ label, description, checked, onClick }: { label: string; description: string; checked: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={checked} onClick={onClick} className="flex min-h-20 w-full items-center justify-between gap-4 rounded-[20px] border border-[color:var(--border)] bg-white p-4 text-left"><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span><span aria-hidden className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${checked ? "bg-[color:var(--primary)]" : "bg-neutral-200"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : ""}`} /></span></button>;
}
