"use client";

const TOKEN_KEY = "angelbridge_token";
const SESSION_KEY = "angelbridge_session";

export type AngelBridgeSession = {
  accountId: string;
  personaId: string;
  nickname: string;
  token: string;
  demographicsComplete: boolean;
  accountKind: "real" | "showcase";
  avatarUrl: string | null;
  gender: "m" | "f" | "other" | null;
  birthDate: string | null;
  city: string | null;
  profileIntro: string;
  interestTags: string[];
  growthScore: number;
  [key: string]: unknown;
};

export function getToken(): string {
  return typeof window === "undefined" ? "" : localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getSession(): AngelBridgeSession | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(SESSION_KEY);
  return value ? JSON.parse(value) as AngelBridgeSession : null;
}

export function saveSession(session: AngelBridgeSession): void {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function isMatureShowcaseSession(
  session: AngelBridgeSession | null = getSession(),
): boolean {
  return session?.accountKind === "showcase" &&
    (session.nickname === "设计小站" || session.nickname === "摄影师小林");
}
