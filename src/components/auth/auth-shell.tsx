import { Sparkles, TreePine } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main data-el="auth-page" className="relative isolate mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[var(--bg-canvas)] px-5 py-6 text-[var(--foreground)] md:my-6 md:min-h-[calc(100dvh-3rem)] md:rounded-[32px] md:border md:border-[color:var(--border)] md:shadow-[var(--brand-shadow-md)]">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_50%_-4%,rgba(121,199,99,.28),transparent_62%)]" />
      <div aria-hidden className="absolute -left-16 top-48 -z-10 h-48 w-48 rounded-full bg-[var(--soft)]/75 blur-3xl" />
      <div aria-hidden className="absolute -right-20 bottom-8 -z-10 h-56 w-56 rounded-full bg-[var(--warm)]/35 blur-3xl" />
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full flex-col justify-center">
        <section className="rounded-[32px] border border-white/80 bg-white/78 p-5 shadow-[0_22px_55px_rgba(66,111,53,.13)] backdrop-blur-xl sm:p-7">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[23px] bg-[linear-gradient(135deg,#f6ffe9,#dff5d4)] text-[var(--deep)] shadow-[0_10px_24px_rgba(88,169,66,.18)]">
              <TreePine className="h-8 w-8" strokeWidth={1.8} />
            </div>
            <p className="inline-flex items-center gap-1 rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-medium text-[var(--deep)]"><Sparkles className="h-3.5 w-3.5" />{eyebrow}</p>
            <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[var(--deep)]">{title}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
          </div>
          {children}
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-[var(--muted-foreground)]">天使桥 · 让每一次连接，都带来一点成长</p>
      </div>
    </main>
  );
}
