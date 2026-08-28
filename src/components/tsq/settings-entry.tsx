import Link from "next/link";
import { Settings } from "lucide-react";

export function SettingsEntry({ label }: { label: string }) {
  return (
    <Link
      data-el="me-settings-entry"
      href="/settings"
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/85 bg-white/78 text-[color:var(--deep)] shadow-[var(--brand-shadow-sm)] backdrop-blur-sm transition active:scale-95"
    >
      <Settings className="h-5 w-5" strokeWidth={1.8} />
    </Link>
  );
}
