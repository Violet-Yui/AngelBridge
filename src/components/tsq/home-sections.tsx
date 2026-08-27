"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Heart, Star, Briefcase, Users, Repeat2, X, Check } from "lucide-react";
import type { Match, Todo } from "@/lib/tsq/api";
import { getMatchHref } from "@/lib/tsq/navigation";
import { cn } from "@/utils/utils";

const KIND_STYLE: Record<string, string> = {
  green: "bg-[color:var(--soft)] text-[color:var(--deep)]",
  warm: "bg-[#fff4d9] text-[#bd7c10]",
  purple: "bg-[#eee8ff] text-[color:var(--purple)]",
};

const TODO_ICON = {
  job: Briefcase,
  coop: Users,
  swap: Repeat2,
} as const;

export function HomeSections({ matches, initialTodos }: { matches: Match[]; initialTodos: Todo[] }) {
  const { t } = useTranslation();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  function resolve(id: string, accept: boolean) {
    const todo = todos.find((x) => x.id === id);
    setTodos((prev) => prev.filter((x) => x.id !== id));
    if (todo) {
      toast(accept ? t("tsq.home.accepted") : t("tsq.home.rejected"), {
        description: todo.title,
      });
    }
  }

  return (
    <div className="relative z-[2] mt-8 px-4">
      {/* 三色资源入口 */}
      <div
        data-el="home-stats"
        className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-[color:var(--border)] bg-white shadow-[var(--brand-shadow-md)]"
      >
        <StatCell icon={<ShoppingBag className="h-4 w-4" />} kind="green" value={18} title={t("tsq.home.own")} sub={t("tsq.home.ownSub")} />
        <StatCell icon={<Heart className="h-4 w-4" />} kind="warm" value={8} title={t("tsq.home.wish")} sub={t("tsq.home.wishSub")} />
        <StatCell icon={<Star className="h-4 w-4" />} kind="purple" value={9} title={t("tsq.home.opp")} sub={t("tsq.home.oppSub")} />
      </div>

      <SectionTitle title={t("tsq.home.matchTitle")} href="/discover" cta={t("tsq.home.seeAll")} />
      <div className="tsq-noscroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {matches.map((m) => (
          <MatchCard key={m.id} m={m} interestedLabel={t("tsq.home.alsoInterested")} />
        ))}
      </div>

      <SectionTitle title={t("tsq.home.todoTitle")} href="/bridge" cta={t("tsq.home.seeAll")} />
      <div
        data-el="home-todos"
        className="rounded-[22px] border border-[color:var(--border)] bg-white p-3.5 shadow-[0_8px_22px_rgba(55,95,42,0.06)]"
      >
        {todos.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("tsq.home.todoEmpty")}
          </p>
        )}
        {todos.map((todo, i) => {
          const Icon = TODO_ICON[todo.kind];
          return (
            <div
              key={todo.id}
              data-el="home-todo-item"
              className={cn(
                "grid grid-cols-[40px_1fr] items-start gap-2.5 py-2.5",
                i < todos.length - 1 && "border-b border-[#f1f2ec]",
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff4d9] text-[#d68816]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <b className="text-[15px]">{todo.title}</b>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {todo.meta}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-neutral-600">
                  {todo.desc}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => resolve(todo.id, false)}
                    className="flex h-9 items-center gap-1 rounded-full bg-[#f5f5f1] px-4 text-[13px] text-neutral-600 active:scale-95"
                  >
                    <X className="h-4 w-4" /> {t("tsq.home.reject")}
                  </button>
                  <button
                    onClick={() => resolve(todo.id, true)}
                    className="flex h-9 items-center gap-1 rounded-full bg-[color:var(--primary)] px-4 text-[13px] font-medium text-white active:scale-95"
                  >
                    <Check className="h-4 w-4" /> {t("tsq.home.accept")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCell({
  icon,
  kind,
  value,
  title,
  sub,
}: {
  icon: React.ReactNode;
  kind: string;
  value: number;
  title: string;
  sub: string;
}) {
  return (
    <div className="border-r border-[#f0f1ec] px-1.5 py-3.5 text-center last:border-r-0">
      <span className={cn("mx-auto mb-1 grid h-9 w-9 place-items-center rounded-2xl", KIND_STYLE[kind])}>
        {icon}
      </span>
      <strong className="block text-2xl leading-tight">{value}</strong>
      <span className="text-[13px] text-neutral-600">{title}</span>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function SectionTitle({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-[19px] font-semibold leading-tight">{title}</h2>
      <Link href={href} className="text-sm text-[color:var(--deep)]">
        {cta} ›
      </Link>
    </div>
  );
}

function MatchCard({ m, interestedLabel }: { m: Match; interestedLabel: string }) {
  return (
    <Link
      href={getMatchHref(m.id)}
      data-el="home-match-card"
      aria-label={`${m.title}，匹配度 ${m.score}%`}
      className="group block w-[45%] shrink-0 snap-start rounded-[20px] outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2"
    >
      <article className="flex min-h-[136px] flex-col rounded-[20px] border border-[color:var(--border)] bg-white p-3 shadow-[var(--brand-shadow-sm)] transition-shadow group-hover:shadow-[var(--brand-shadow-md)]">
        <span className={cn("mb-auto inline-block w-fit rounded-full px-2 py-1 text-xs", KIND_STYLE[m.kind])}>
          {m.tag}
        </span>
        <strong className="mt-3 text-2xl text-[color:var(--deep)]">{m.score}%</strong>
        <p className="mt-0.5 text-[13px] font-medium leading-tight text-neutral-800">
          {m.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
          {m.reason}
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {m.interested} {interestedLabel}
        </p>
      </article>
    </Link>
  );
}
