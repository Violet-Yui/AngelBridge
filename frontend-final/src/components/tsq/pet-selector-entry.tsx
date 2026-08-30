"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

export function PetSelectorEntry() {
  return (
    <Link
      href="/pets"
      aria-label="选择灵宠"
      data-el="pet-selector-entry"
      className="absolute left-4 top-0 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/80 bg-white/75 text-[color:var(--deep)] shadow-[0_8px_18px_rgba(55,95,42,.12)] backdrop-blur-md transition-transform active:scale-95"
    >
      <Bot className="h-5 w-5" />
      <span className="absolute -right-1 -top-1 rounded-full bg-[color:var(--deep)] px-1 py-0.5 text-[8px] font-bold leading-none text-white">AI</span>
    </Link>
  );
}
