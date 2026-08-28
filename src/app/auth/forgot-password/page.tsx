"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { requestPasswordReset } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try { await requestPasswordReset({ email }); setSent(true); } finally { setLoading(false); }
  }

  return <AuthShell eyebrow={t("auth.eyebrow")} title={t("auth.forgotTitle")} description={t("auth.forgotDescription")}>
    {sent ? <div data-el="forgot-password-success" className="rounded-3xl bg-[var(--soft)]/75 p-5 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-[var(--deep)] shadow-sm"><Send className="h-5 w-5" /></div><h2 className="mt-4 font-semibold text-[var(--deep)]">{t("auth.resetRequestSent")}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t("auth.resetRequestSentHint", { email })}</p><Link href={`/auth/reset-password?email=${encodeURIComponent(email)}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--deep)] px-5 text-sm font-medium text-white">{t("auth.enterResetCode")}</Link></div> : <form data-el="forgot-password-form" onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium text-[var(--deep)]"><span className="mb-2 block">{t("auth.email")}</span><span className="flex h-12 items-center rounded-2xl border border-[var(--border)] bg-white/90 px-3 focus-within:border-[var(--ring)] focus-within:ring-2 focus-within:ring-[var(--ring)]/20"><Mail className="mr-2 h-4 w-4 text-[var(--deep)]" /><input data-el="forgot-password-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted-foreground)]" /></span></label><button data-el="forgot-password-submit" disabled={loading} className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--deep))] font-semibold text-white shadow-[0_12px_22px_rgba(47,125,50,.24)] disabled:opacity-60">{loading ? t("auth.processing") : t("auth.sendResetCode")}</button></form>}
    <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]"><Link href="/auth" className="font-medium text-[var(--deep)] hover:underline">{t("auth.backToLogin")}</Link></p>
  </AuthShell>;
}
