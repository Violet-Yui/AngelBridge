"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resetPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useTranslation();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await resetPassword({ email, code, password }); router.push("/auth"); } catch { setError(t("auth.resetError")); } finally { setLoading(false); } }
  return <AuthShell eyebrow={t("auth.eyebrow")} title={t("auth.resetTitle")} description={t("auth.resetDescription")}><form data-el="reset-password-form" onSubmit={submit} className="space-y-4"><AuthInput label={t("auth.email")} icon={<Mail />} value={email} onChange={setEmail} type="email" autoComplete="email" placeholder="name@example.com" /><AuthInput label={t("auth.resetCode")} icon={<ShieldCheck />} value={code} onChange={setCode} placeholder={t("auth.resetCodePlaceholder")} /><AuthInput label={t("auth.newPassword")} icon={<KeyRound />} value={password} onChange={setPassword} type="password" minLength={8} autoComplete="new-password" placeholder={t("auth.passwordHint")} />{error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button data-el="reset-password-submit" disabled={loading} className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--deep))] font-semibold text-white shadow-[0_12px_22px_rgba(47,125,50,.24)] disabled:opacity-60">{loading ? t("auth.processing") : t("auth.resetAction")}</button></form><p className="mt-5 text-center text-sm text-[var(--muted-foreground)]"><Link href="/auth/forgot-password" className="font-medium text-[var(--deep)] hover:underline">{t("auth.sendAgain")}</Link></p></AuthShell>;
}

function AuthInput({ label, icon, value, onChange, type = "text", minLength, autoComplete, placeholder }: { label: string; icon: React.ReactNode; value: string; onChange: (value: string) => void; type?: string; minLength?: number; autoComplete?: string; placeholder: string }) { return <label className="block text-sm font-medium text-[var(--deep)]"><span className="mb-2 block">{label}</span><span className="flex h-12 items-center rounded-2xl border border-[var(--border)] bg-white/90 px-3 focus-within:border-[var(--ring)] focus-within:ring-2 focus-within:ring-[var(--ring)]/20"><span className="mr-2 text-[var(--deep)] [&_svg]:h-4 [&_svg]:w-4">{icon}</span><input required type={type} minLength={minLength} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted-foreground)]" /></span></label>; }
