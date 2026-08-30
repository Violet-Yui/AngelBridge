"use client";

import { getToken, saveSession, type AngelBridgeSession } from "@/lib/angelbridge-session";
import type { ConversationMessage, ConversationView, Dashboard, ImageAttachment, LifeTreeRecord, MatchView, PactDetail, PactView, PetOrganizeResult, PetTurn, PublicationDetail } from "@/lib/angelbridge-types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

type Envelope<T> = { data: T };
type ApiFailure = { error?: { code?: string; message?: string } };

export class AngelBridgeApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const token = getToken();
  if (authenticated && token) headers.set("x-demo-role-token", token);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await response.json() as Envelope<T> & ApiFailure;
  if (!response.ok) {
    throw new AngelBridgeApiError(
      response.status,
      body.error?.code ?? "request_failed",
      body.error?.message ?? "请求失败",
    );
  }
  return body.data;
}

const json = (value: unknown): RequestInit => ({ body: JSON.stringify(value) });

export const angelbridgeApi = {
  sendSmsCode(phone: string) {
    return request<{ purpose: "register" | "login"; expiresInSeconds: number; resendAfterSeconds: number }>(
      "/api/auth/sms/send-auto",
      { method: "POST", ...json({ phone }) },
      false,
    );
  },
  async login(phone: string, code: string) {
    const session = await request<AngelBridgeSession>(
      "/api/auth/sms/login",
      { method: "POST", ...json({ phone, code }) },
      false,
    );
    saveSession(session);
    return session;
  },
  async register(phone: string, code: string, nickname: string) {
    const session = await request<AngelBridgeSession>(
      "/api/auth/sms/register",
      { method: "POST", ...json({ phone, code, nickname }) },
      false,
    );
    saveSession(session);
    return session;
  },
  getAccount() {
    return request<AngelBridgeSession>("/api/me/account");
  },
  async updateAccount(input: Record<string, unknown>) {
    const session = await request<AngelBridgeSession>(
      "/api/me/account",
      { method: "PATCH", ...json(input) },
    );
    saveSession(session);
    return session;
  },
  uploadImage(image: File) {
    const form = new FormData();
    form.append("image", image);
    return request<ImageAttachment>(
      "/api/media/images",
      { method: "POST", body: form },
    );
  },
  getDashboard: () => request<Dashboard>("/api/dashboard"),
  getLifeTree: () => request<LifeTreeRecord | null>("/api/life-tree"),
  saveLifeTree: (input: Record<string, unknown>) => request<LifeTreeRecord>(
    "/api/life-tree", { method: "PUT", ...json(input) },
  ),
  diagnoseLifeTree: () => request<LifeTreeRecord>(
    "/api/life-tree/diagnose", { method: "POST" },
  ),
  getMyPublications: () => request<PublicationDetail[]>("/api/publications/mine"),
  getDiscoverPublications: () => request<PublicationDetail[]>("/api/publications/discover"),
  createPublication: (input: Record<string, unknown>) => request<{ publicationId: string; title: string; content: string }>(
    "/api/publications", { method: "POST", ...json(input) },
  ),
  publishPublication: (publicationId: string) => request<Record<string, unknown>>(
    `/api/publications/${publicationId}/publish`, { method: "POST" },
  ),
  getPublication: (publicationId: string) => request<PublicationDetail>(
    `/api/publications/${publicationId}`,
  ),
  decidePublicationAfterCompletion: (
    publicationId: string,
    input: { action: "continue_matching" } | { action: "close_matching"; discoveryVisible: boolean },
  ) => request<PublicationDetail>(
    `/api/publications/${publicationId}/completion-decision`, { method: "POST", ...json(input) },
  ),
  runPublicationMatching: (publicationId: string) => request<MatchView[]>(
    `/api/publications/${publicationId}/matches/run`, { method: "POST" },
  ),
  getMatches: () => request<MatchView[]>("/api/matches"),
  getMatch: (matchId: string) => request<MatchView>(`/api/matches/${matchId}`),
  decideMatch: (matchId: string, decision: "accepted" | "rejected") => request<MatchView>(
    `/api/matches/${matchId}/consent`, { method: "POST", ...json({ decision }) },
  ),
  getPacts: () => request<PactView[]>("/api/pacts"),
  getPact: (matchId: string) => request<PactDetail>(`/api/matches/${matchId}/pact`),
  updatePact: (matchId: string, input: Record<string, unknown>) => request<Record<string, unknown>>(
    `/api/matches/${matchId}/pact`, { method: "PATCH", ...json(input) },
  ),
  confirmPactStart: (matchId: string) => request<PactDetail>(
    `/api/matches/${matchId}/pact/start-confirmation`, { method: "POST" },
  ),
  confirmPactCompletion: (matchId: string) => request<PactDetail>(
    `/api/matches/${matchId}/pact/completion-confirmation`, { method: "POST" },
  ),
  getConversations: () => request<ConversationView[]>("/api/conversations"),
  getMessages: (conversationId: string) => request<ConversationMessage[]>(
    `/api/conversations/${conversationId}/messages`,
  ),
  sendMessage: (conversationId: string, text: string, images: unknown[] = []) => request<ConversationMessage>(
    `/api/conversations/${conversationId}/messages`, { method: "POST", ...json({ text, images }) },
  ),
  markConversationRead: (conversationId: string) => request<Record<string, unknown>>(
    `/api/conversations/${conversationId}/read`, { method: "POST" },
  ),
  getPetMessages: () => request<PetTurn[]>("/api/pet/messages"),
  sendPetMessage: (message: string, images: unknown[] = []) => request<PetTurn>(
    "/api/pet/messages", { method: "POST", ...json({ message, images }) },
  ),
  organizePetMessage: (message: string) => request<PetOrganizeResult>(
    "/api/pet/organize",
    { method: "POST", ...json({ context: "publish", message, images: [], currentDraft: null }) },
  ),
};

export async function subscribeConversation(
  conversationId: string,
  onMessage: (message: ConversationMessage) => void,
  signal: AbortSignal,
) {
  const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/events`, {
    headers: { "x-demo-role-token": getToken() },
    signal,
  });
  if (!response.ok || !response.body) throw new Error("实时消息连接失败");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (!block.includes("event: message")) continue;
      const data = block.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
      if (data) onMessage(JSON.parse(data) as ConversationMessage);
    }
  }
}
