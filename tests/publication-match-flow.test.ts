import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { InMemoryAccountRepository } from "../src/auth/repository";
import { createApiHandler } from "../src/http/api";
import { InMemoryMatchPoolStateRepository } from "../src/pool/repository";
import type { PetChatContext, PetChatProvider } from "../src/pet-ai/provider";

const call = async (
  handle: (request: Request) => Promise<Response>,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) => {
  const response = await handle(new Request(`http://local.test${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { "x-demo-role-token": options.token } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  }));
  return { response, body: await response.json() as any };
};

const publication = (
  title: string,
  offer: { domain: "space" | "service"; title: string; keywords: string[] },
  need: { domain: "space" | "service"; title: string; keywords: string[] },
) => ({
  title,
  category: "collaboration",
  kind: "exchange",
  bio: title,
  offers: [{
    ...offer,
    description: offer.title,
    deliverables: [offer.title],
    visibility: "match_only",
  }],
  needs: [{
    ...need,
    description: need.title,
    deliverables: [],
    visibility: "match_only",
  }],
  goals: [],
  acceptedExchangeModes: ["barter", "collaboration"],
  constraints: { locations: ["温州"], availability: ["周末"] },
  disclosurePolicy: {
    matchLocationPrecision: "region",
    contactDisclosure: "after_mutual_consent",
    exactLocationDisclosure: "after_pact_active",
  },
  proposedPactTerms: {
    firstAction: "先交换参考资料",
    completionCriteria: "双方确认约定内容已经完成",
    exitRule: "无法履约时提前说明",
    otherNotes: "",
  },
});

let lastReplyContext: PetChatContext | null = null;

const publicationAi: PetChatProvider = {
  async reply(context) {
    lastReplyContext = context;
    return "好的";
  },
  async organize(context) {
    const form = JSON.parse(context.message.split("\n").at(-1)!) as {
      titleHint: string | null;
      bio: string;
      offers: Array<{ title: string }>;
    };
    return {
      assistantReply: "已整理",
      draft: {
        title: form.titleHint ?? form.offers[0].title,
        summary: form.bio,
        nodes: [{
          role: "offer",
          domain: "service",
          text: form.offers[0].title,
          evidenceText: form.offers[0].title,
        }],
        exchangeModes: [],
        constraints: [],
      },
      missingFields: [],
      suggestedQuestions: [],
    };
  },
  async diagnoseLifeTree() {
    return {
      completeness: 88,
      matchClarity: 82,
      review: "把宽泛标签细化为可识别的真实能力，会更容易连接到合适机会。",
    };
  },
};

describe("publication based match flow", () => {
  it("matches two concrete publications and writes pact cards into their conversation", async () => {
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      new InMemoryAccountRepository(),
      new InMemoryMatchPoolStateRepository(),
      undefined,
      undefined,
      undefined,
      undefined,
      publicationAi,
    );
    const a = await call(handle, "/api/auth/register", {
      method: "POST", body: { nickname: "空间主人", pin: "1234" },
    });
    const b = await call(handle, "/api/auth/register", {
      method: "POST", body: { nickname: "摄影师", pin: "5678" },
    });
    const tokenA = a.body.data.token;
    const tokenB = b.body.data.token;
    await call(handle, "/api/life-tree", {
      method: "PUT",
      token: tokenA,
      body: {
        offers: [{ label: "UI 设计", visible: true }],
        needs: [{ label: "合作伙伴", visible: true }],
        explorations: [{ label: "新技能", visible: false }],
      },
    });
    const diagnosedTree = await call(handle, "/api/life-tree/diagnose", {
      method: "POST", token: tokenA,
    });
    expect(diagnosedTree.body.data).toMatchObject({
      diagnosis: { completeness: 88, matchClarity: 82 },
      offers: [{ label: "UI 设计", visible: true }],
    });
    const createdA = await call(handle, "/api/publications", {
      method: "POST",
      token: tokenA,
      body: publication(
        "周末工作室换品牌摄影",
        { domain: "space", title: "周末工作室", keywords: ["工作室", "周末"] },
        { domain: "service", title: "品牌摄影", keywords: ["品牌摄影"] },
      ),
    });
    const createdB = await call(handle, "/api/publications", {
      method: "POST",
      token: tokenB,
      body: publication(
        "品牌摄影换拍摄空间",
        { domain: "service", title: "品牌摄影", keywords: ["品牌摄影"] },
        { domain: "space", title: "周末工作室", keywords: ["工作室", "周末"] },
      ),
    });
    const publicationA = createdA.body.data.publicationId;
    const publicationB = createdB.body.data.publicationId;
    await call(handle, `/api/publications/${publicationA}/publish`, {
      method: "POST", token: tokenA,
    });
    await call(handle, `/api/publications/${publicationB}/publish`, {
      method: "POST", token: tokenB,
    });
    const visitorDetail = await call(handle, `/api/publications/${publicationB}`, {
      token: tokenA,
    });
    expect(visitorDetail.body.data).toMatchObject({
      viewerRole: "visitor",
      title: "品牌摄影换拍摄空间",
      formData: null,
      canInvite: true,
    });
    const ownerDynamics = await call(handle, "/api/me/publications", { token: tokenA });
    expect(ownerDynamics.body.data).toEqual([
      expect.objectContaining({
        publicationId: publicationA,
        viewerRole: "owner",
        content: "周末工作室换品牌摄影",
      }),
    ]);
    const matches = await call(handle, `/api/publications/${publicationA}/matches/run`, {
      method: "POST", token: tokenA,
    });
    expect(matches.response.status).toBe(200);
    expect(matches.body.data).toHaveLength(1);
    expect(matches.body.data[0]).toMatchObject({
      publicationId: publicationA,
      counterpartPublicationId: publicationB,
      publicationTitle: "周末工作室换品牌摄影",
      counterpartPublicationTitle: "品牌摄影换拍摄空间",
    });

    const matchId = matches.body.data[0].matchId;
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST", token: tokenA, body: { decision: "accepted" },
    });
    expect((await call(handle, `/api/matches/${encodeURIComponent(matchId)}`, {
      token: tokenA,
    })).body.data).toMatchObject({
      yourDecision: "accepted",
      counterpartDecision: null,
      invitationDirection: "sent",
    });
    expect((await call(handle, `/api/matches/${encodeURIComponent(matchId)}`, {
      token: tokenB,
    })).body.data).toMatchObject({
      yourDecision: null,
      counterpartDecision: "accepted",
      invitationDirection: "received",
    });
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST", token: tokenB, body: { decision: "accepted" },
    });
    expect((await call(handle, `/api/matches/${encodeURIComponent(matchId)}`, {
      token: tokenB,
    })).body.data.invitationDirection).toBe("mutual");
    const afterConsent = await call(
      handle,
      `/api/conversations/${encodeURIComponent(matchId)}/messages`,
      { token: tokenA },
    );
    expect(afterConsent.body.data.at(-1)).toMatchObject({
      type: "pact_proposed",
      payload: { nextAction: "confirm_start" },
    });
    expect((await call(handle, "/api/conversations", { token: tokenA })).body.data[0].unreadCount)
      .toBeGreaterThan(0);
    await call(handle, `/api/conversations/${encodeURIComponent(matchId)}/read`, {
      method: "POST", token: tokenA,
    });
    expect((await call(handle, "/api/conversations", { token: tokenA })).body.data[0])
      .toMatchObject({ unreadCount: 0, lastReadAt: expect.any(String) });
    await call(handle, `/api/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST", token: tokenB, body: { text: "hello", images: [] },
    });
    expect((await call(handle, "/api/conversations", { token: tokenA })).body.data[0].unreadCount)
      .toBe(1);
    await call(handle, `/api/conversations/${encodeURIComponent(matchId)}/read`, {
      method: "POST", token: tokenA,
    });
    await call(handle, "/api/pet/messages", {
      method: "POST", token: tokenA, body: { message: "我的进展怎么样？", images: [] },
    });
    expect(lastReplyContext?.productContext).toMatchObject({
      account: { accountId: a.body.data.accountId, nickname: a.body.data.nickname },
      publications: [expect.objectContaining({ publicationId: publicationA })],
      matches: [expect.objectContaining({ matchId })],
      pacts: [expect.objectContaining({ matchId })],
      conversations: [expect.objectContaining({ conversationId: matchId, unreadCount: 0 })],
    });

    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/pact/start-confirmation`, {
      method: "POST", token: tokenA,
    });
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/pact/start-confirmation`, {
      method: "POST", token: tokenB,
    });
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/pact/completion-confirmation`, {
      method: "POST", token: tokenA,
    });
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/pact/completion-confirmation`, {
      method: "POST", token: tokenB,
    });
    const messages = await call(
      handle,
      `/api/conversations/${encodeURIComponent(matchId)}/messages`,
      { token: tokenA },
    );
    expect(messages.body.data.map((item: any) => item.type)).toContain("pact_started");
    expect(messages.body.data.at(-1)).toMatchObject({
      type: "pact_completed",
      payload: { growthDelta: 20 },
    });
    const completedOwnerDetail = await call(handle, `/api/publications/${publicationA}`, {
      token: tokenA,
    });
    expect(completedOwnerDetail.body.data).toMatchObject({
      viewerRole: "owner",
      hasCompletedPact: true,
      completedPactCount: 1,
      completionDecisionRequired: true,
    });
    const closed = await call(
      handle,
      `/api/publications/${publicationA}/completion-decision`,
      {
        method: "POST",
        token: tokenA,
        body: { action: "close_matching", discoveryVisible: false },
      },
    );
    expect(closed.body.data).toMatchObject({
      status: "completed",
      discoveryVisible: false,
      completionDecisionRequired: false,
    });
    expect((await call(handle, `/api/publications/${publicationA}`, { token: tokenB })).response.status)
      .toBe(404);
    expect((await call(handle, "/api/dashboard", { token: tokenA })).body.data)
      .toMatchObject({ account: { growthScore: 120 }, publicationCount: 1 });
  });
});
