"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { login, register } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) await login({ email, password });
      else await register({ email, password, name });
      router.push("/");
    } catch {
      setError(t(isLogin ? "auth.invalidCredentials" : "auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow={t("auth.eyebrow")} title={t(isLogin ? "auth.welcomeBack" : "auth.joinTitle")} description={t("auth.description")}>
      <div data-el="auth-mode-switch" className="mb-5 grid grid-cols-2 rounded-2xl bg-[var(--soft)]/85 p-1">
        {(["login", "register"] as const).map((item) => <button key={item} type="button" onClick={() => { setMode(item); setError(""); }} className={`h-10 rounded-xl text-sm transition ${mode === item ? "bg-white font-semibold text-[var(--deep)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--deep)]"}`}>{t(`auth.${item}`)}</button>)}
      </div>
      <form data-el="auth-form" onSubmit={submit} className="space-y-4">
        {!isLogin && <Field label={t("auth.nickname")} icon={<UserRound />}><input data-el="auth-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("auth.nicknamePlaceholder")} /></Field>}
        <Field label={t("auth.email")} icon={<Mail />}><input data-el="auth-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></Field>
        <Field label={t("auth.password")} icon={<KeyRound />} action={<button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={t(showPassword ? "auth.hidePassword" : "auth.showPassword")} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--soft)]">{showPassword ? <EyeOff /> : <Eye />}</button>}><input data-el="auth-password" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("auth.passwordHint")} /></Field>
        {isLogin && <div className="flex justify-end"><Link href="/auth/forgot-password" className="text-xs font-medium text-[var(--deep)] underline-offset-4 hover:underline">{t("auth.forgotPassword")}</Link></div>}
        {error && <p data-el="auth-error" role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button data-el="auth-submit" disabled={loading} className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--deep))] font-semibold text-white shadow-[0_12px_22px_rgba(47,125,50,.24)] transition hover:brightness-105 disabled:opacity-60">{loading ? t("auth.processing") : t(isLogin ? "auth.loginAction" : "auth.registerAction")}</button>
      </form>
      <div className="mt-5 rounded-2xl bg-[var(--soft)]/65 px-4 py-3 text-center text-xs leading-5 text-[var(--muted-foreground)]">{isLogin ? t("auth.loginNote") : t("auth.registerNote")}</div>
    </AuthShell>
  );
}

function Field({ label, icon, action, children }: { label: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[var(--deep)]"><span className="mb-2 block">{label}</span><span className="flex h-12 items-center rounded-2xl border border-[var(--border)] bg-white/90 px-3 focus-within:border-[var(--ring)] focus-within:ring-2 focus-within:ring-[var(--ring)]/20"><span className="mr-2 text-[var(--deep)] [&_svg]:h-4 [&_svg]:w-4">{icon}</span><span className="min-w-0 flex-1 [&_input]:h-10 [&_input]:w-full [&_input]:bg-transparent [&_input]:text-base [&_input]:outline-none [&_input::placeholder]:text-[var(--muted-foreground)]">{children}</span>{action}</span></label>;
}
