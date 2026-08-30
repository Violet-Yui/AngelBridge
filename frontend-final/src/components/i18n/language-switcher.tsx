"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import {
  changeLocale,
  getLocalePreference,
  normalizeLocale,
  type LocaleCode,
  type LocalePreference,
} from "@/i18n";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const subscribePreference = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      window.addEventListener("angelbridge-locale-preference-changed", sync);
      window.addEventListener("storage", sync);
      return () => {
        i18n.off("languageChanged", sync);
        window.removeEventListener("angelbridge-locale-preference-changed", sync);
        window.removeEventListener("storage", sync);
      };
    },
    [i18n],
  );

  useSyncExternalStore(
    subscribePreference,
    getLocalePreference,
    () => "system" as LocalePreference,
  );

  const activeLocale = normalizeLocale(i18n.resolvedLanguage || i18n.language) ?? "zh-CN";
  const isChinese = activeLocale === "zh-CN";
  const nextLocale: LocaleCode = isChinese ? "en-US" : "zh-CN";

  return (
    <button
      type="button"
      aria-label={isChinese ? "切换到英文" : "Switch to Chinese"}
      onClick={() => void changeLocale(nextLocale)}
      className="grid h-8 min-w-8 place-items-center rounded-full border border-white/70 bg-white/80 px-2 text-[12px] font-bold text-[color:var(--deep)] shadow-[0_6px_14px_rgba(55,95,42,.10)] backdrop-blur active:scale-95"
      title={isChinese ? "切换到英文" : "Switch to Chinese"}
    >
      {isChinese ? "中" : "EN"}
    </button>
  );
}
