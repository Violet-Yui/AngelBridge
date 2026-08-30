import { describe, expect, it, vi } from "vitest";
import type { AiMatchAssessmentProvider } from "../src/ai-matching/provider";
import { AngelBridgeApplication } from "../src/application/app-service";
import { InMemoryAccountRepository } from "../src/auth/repository";
import { createApiHandler } from "../src/http/api";
import { InMemoryMatchPoolStateRepository } from "../src/pool/repository";

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

const profileA = {
  bio: "我运营一个周末工作室，希望用空间置换品牌摄影。",
  offers: [{
    domain: "space",
    title: "周末工作室两天使用权",
    description: "北京朝阳室内工作室，可提供下周末两天使用权。",
    keywords: ["工作室", "室内拍摄", "两天"],
    deliverables: ["下周末两天工作室使用权"],
    visibility: "match_only",
  }],
  needs: [{
    domain: "service",
    title: "品牌摄影服务",
    description: "需要完成一组可用于品牌宣传的照片。",
    keywords: ["品牌摄影", "照片交付"],
    deliverables: [],
    visibility: "match_only",
  }],
  goals: [],
  acceptedExchangeModes: ["barter", "collaboration"],
  constraints: { locations: ["北京朝阳"], availability: ["下周末"] },
  disclosurePolicy: {
    matchLocationPrecision: "region",
    contactDisclosure: "after_mutual_consent",
    exactLocationDisclosure: "after_pact_active",
  },
  proposedPactTerms: {
    firstAction: "先交换三张场地与作品参考图",
    completionCriteria: "交付一组品牌照片并完成基础精修",
    exitRule: "无法履约时提前二十四小时说明",
    otherNotes: "具体拍摄时间在聊天中确认",
  },
};

const profileB = {
  bio: "我是品牌摄影师，需要周末室内空间完成一组作品。",
  offers: [{
    domain: "service",
    title: "品牌摄影与基础精修",
    description: "提供品牌摄影和一组基础精修照片。",
    keywords: ["品牌摄影", "照片交付"],
    deliverables: ["一组品牌照片"],
    visibility: "match_only",
  }],
  needs: [{
    domain: "space",
    title: "室内拍摄工作室",
    description: "需要下周末可使用两天的室内拍摄空间。",
    keywords: ["工作室", "室内拍摄", "两天"],
    deliverables: [],
    visibility: "match_only",
  }],
  goals: [],
  acceptedExchangeModes: ["barter", "collaboration"],
  constraints: { locations: ["北京朝阳"], availability: ["下周末"] },
  disclosurePolicy: {
    matchLocationPrecision: "region",
    contactDisclosure: "after_mutual_consent",
    exactLocationDisclosure: "after_pact_active",
  },
};

const profileBWithSynonymousKeywords = {
  ...profileB,
  offers: profileB.offers.map((offer) => ({
    ...offer,
    title: "商业视觉内容制作",
    description: "为小型品牌完成一套可用于官网和社交媒体的商业影像成片。",
    keywords: ["商业影像", "视觉内容", "成片制作"],
  })),
  needs: profileB.needs.map((need) => ({
    ...need,
    title: "自然光室内创作场地",
    description: "寻找周末可进行产品拍摄的室内自然光场地。",
    keywords: ["创作场地", "自然采光", "产品拍摄"],
  })),
};

describe("real shared match pool", () => {
  it("uses the configured AI provider for real account matching", async () => {
    const accounts = new InMemoryAccountRepository();
    const poolState = new InMemoryMatchPoolStateRepository();
    const assess = vi.fn<AiMatchAssessmentProvider["assess"]>(async ({
      viewer,
      candidate,
    }) => {
      const viewerNeed = viewer.nodes.find((node) => node.direction === "need")!;
      const viewerOffer = viewer.nodes.find((node) => node.direction === "offer")!;
      const candidateNeed = candidate.nodes.find((node) => node.direction === "need")!;
      const candidateOffer = candidate.nodes.find((node) => node.direction === "offer")!;
      return {
        viewerId: viewer.personaId,
        candidateId: candidate.personaId,
        viewerToCandidate: {
          semanticRelation: "exact",
          deliverability: "clear",
          softConstraintRisk: "none",
          needNodeId: viewerNeed.id,
          offerNodeId: candidateOffer.id,
          reason: "对方的摄影服务可以响应你的品牌照片需求",
          unknowns: ["需要确认具体拍摄清单"],
          evidenceNodeIds: [viewerNeed.id, candidateOffer.id],
        },
        candidateToViewer: {
          semanticRelation: "exact",
          deliverability: "clear",
          softConstraintRisk: "none",
          needNodeId: candidateNeed.id,
          offerNodeId: viewerOffer.id,
          reason: "你的周末工作室可以响应对方的拍摄空间需求",
          unknowns: ["需要确认现场设备"],
          evidenceNodeIds: [candidateNeed.id, viewerOffer.id],
        },
        matchReasons: [
          {
            type: "value_to_you",
            text: "对方的资源回应了你的需要",
            evidenceNodeIds: [viewerNeed.id, candidateOffer.id],
          },
          {
            type: "value_to_other",
            text: "你的资源回应了对方的需要",
            evidenceNodeIds: [candidateNeed.id, viewerOffer.id],
          },
        ],
        supportingPatterns: [],
        conflicts: [],
        confidence: "high",
        assessmentMode: "live_ai",
        model: "doubao-seed-2-0-lite-260428",
        promptVersion: "hybrid-match-v0.2",
        generatedAt: "2026-08-28T09:00:00.000Z",
        isSynthetic: false,
        datasetVersion: "user-v1",
      };
    });
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
      { assess },
    );

    const registeredA = await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "AI用户A", pin: "1234" },
    });
    const registeredB = await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "AI用户B", pin: "5678" },
    });
    const tokenA = registeredA.body.data.token;
    const tokenB = registeredB.body.data.token;
    await call(handle, "/api/me/profile", { method: "PUT", token: tokenA, body: profileA });
    await call(handle, "/api/me/profile", {
      method: "PUT",
      token: tokenB,
      body: profileBWithSynonymousKeywords,
    });
    await call(handle, "/api/me/account", {
      method: "PATCH",
      token: tokenA,
      body: { personalityTags: ["创意驱动", "长期主义"] },
    });
    await call(handle, "/api/me/account", {
      method: "PATCH",
      token: tokenB,
      body: { personalityTags: ["创意驱动", "温柔倾听"] },
    });
    await call(handle, "/api/me/profile/activate", { method: "POST", token: tokenA });
    await call(handle, "/api/me/profile/activate", { method: "POST", token: tokenB });

    const matches = await call(handle, "/api/matches/run", {
      method: "POST",
      token: tokenA,
    });

    expect(matches.response.status).toBe(200);
    expect(assess).toHaveBeenCalledOnce();
    const assessedProfiles = assess.mock.calls[0][0];
    expect(assessedProfiles.viewer.personalityTags).toEqual(["创意驱动", "长期主义"]);
    expect(assessedProfiles.candidate.personalityTags).toEqual(["创意驱动", "温柔倾听"]);
    expect(assessedProfiles.viewer.nodes.flatMap((node) => node.keywords)).not.toContain(
      "商业影像",
    );
    expect(assessedProfiles.candidate.nodes.flatMap((node) => node.keywords)).not.toContain(
      "品牌摄影",
    );
    expect(matches.body.data).toHaveLength(1);
    expect(matches.body.data[0]).toMatchObject({
      counterpartDisplayName: "AI用户B",
      valueToYou: ["对方的摄影服务可以响应你的品牌照片需求"],
      valueToOther: ["你的周末工作室可以响应对方的拍摄空间需求"],
      isSynthetic: false,
    });
    await call(handle, "/api/me/account", {
      method: "PATCH",
      token: tokenA,
      body: { personalityTags: ["理性务实"] },
    });
    expect((await call(handle, "/api/matches", { token: tokenA })).body.data).toEqual([]);
  });

  it("lets two independent users publish real profiles, discover each other and restore chat", async () => {
    const accounts = new InMemoryAccountRepository();
    const poolState = new InMemoryMatchPoolStateRepository();
    const first = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
    );

    const registeredA = await call(first, "/api/auth/register", {
      method: "POST",
      body: { nickname: "小树", pin: "1234" },
    });
    const registeredB = await call(first, "/api/auth/register", {
      method: "POST",
      body: { nickname: "阿桥", pin: "5678" },
    });
    expect(registeredA.response.status).toBe(201);
    expect(registeredB.response.status).toBe(201);
    expect(registeredA.body.data.joinCode).toBeUndefined();
    expect(registeredA.body.data.sessionId).toBeUndefined();
    expect(registeredA.body.data.isSynthetic).toBe(false);

    const tokenA = registeredA.body.data.token;
    const tokenB = registeredB.body.data.token;
    const savedA = await call(first, "/api/me/profile", {
      method: "PUT",
      token: tokenA,
      body: {
        ...profileA,
        offers: [{ ...profileA.offers[0], description: "" }],
      },
    });
    const savedB = await call(first, "/api/me/profile", {
      method: "PUT",
      token: tokenB,
      body: profileB,
    });
    expect(savedA.body.data.profile.nodes.every((node: any) => !node.isSynthetic)).toBe(true);
    expect(savedA.body.data.profile.nodes[0].description).toBe(profileA.offers[0].title);
    expect(savedB.body.data.profile.displayName).toBe("阿桥");

    const beforeActive = await call(first, "/api/matches/run", {
      method: "POST",
      token: tokenA,
    });
    expect(beforeActive.response.status).toBe(409);
    expect(beforeActive.body.error.code).toBe("profile_not_active");

    await call(first, "/api/me/profile/activate", { method: "POST", token: tokenA });
    await call(first, "/api/me/profile/activate", { method: "POST", token: tokenB });
    const matchesA = await call(first, "/api/matches/run", {
      method: "POST",
      token: tokenA,
    });
    expect(matchesA.body.data).toHaveLength(1);
    expect(matchesA.body.data[0].counterpartDisplayName).toBe("阿桥");
    expect(matchesA.body.data[0].isSynthetic).toBe(false);
    expect(matchesA.body.data[0].bridgeIndex).toBeGreaterThan(0);

    const matchesB = await call(first, "/api/matches", { token: tokenB });
    expect(matchesB.body.data).toHaveLength(1);
    expect(matchesB.body.data[0].counterpartDisplayName).toBe("小树");
    const matchId = matchesA.body.data[0].matchId;

    await call(first, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: tokenA,
      body: { decision: "accepted" },
    });
    const waitingForB = await call(first, "/api/matches", { token: tokenB });
    expect(waitingForB.body.data[0].status).toBe("waiting_other");
    expect(waitingForB.body.data[0].yourDecision).toBeNull();
    expect((await call(first, "/api/conversations", { token: tokenA })).body.data).toEqual([]);
    const blockedMessage = await call(
      first,
      `/api/conversations/${encodeURIComponent(matchId)}/messages`,
      { method: "POST", token: tokenA, body: { text: "现在能聊吗？" } },
    );
    expect(blockedMessage.response.status).toBe(409);

    await call(first, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: tokenB,
      body: { decision: "accepted" },
    });
    const draftPact = await call(
      first,
      `/api/matches/${encodeURIComponent(matchId)}/pact`,
      { token: tokenA },
    );
    expect(draftPact.body.data).toMatchObject(profileA.proposedPactTerms);
    const pactList = await call(first, "/api/pacts", { token: tokenA });
    expect(pactList.body.data).toHaveLength(1);
    expect(pactList.body.data[0]).toMatchObject({
      matchId,
      counterpartDisplayName: "阿桥",
      nextAction: "confirm_start",
    });
    await call(first, `/api/matches/${encodeURIComponent(matchId)}/pact/start-confirmation`, {
      method: "POST",
      token: tokenA,
    });
    const activePact = await call(
      first,
      `/api/matches/${encodeURIComponent(matchId)}/pact/start-confirmation`,
      { method: "POST", token: tokenB },
    );
    expect(activePact.body.data.status).toBe("active");
    await call(first, `/api/matches/${encodeURIComponent(matchId)}/pact/completion-confirmation`, {
      method: "POST",
      token: tokenA,
    });
    const completedPact = await call(
      first,
      `/api/matches/${encodeURIComponent(matchId)}/pact/completion-confirmation`,
      { method: "POST", token: tokenB },
    );
    expect(completedPact.body.data.status).toBe("completed");
    const completedDashboard = await call(first, "/api/dashboard", { token: tokenA });
    expect(completedDashboard.body.data.account.growthScore).toBe(120);
    expect(completedDashboard.body.data.recentGrowth).toEqual([
      expect.objectContaining({
        type: "pact_completed",
        delta: 20,
        matchId,
      }),
    ]);
    await call(first, `/api/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST",
      token: tokenA,
      body: {
        text: "你好，我们先交换三张参考图吧。",
        images: [{
          url: "/api/media/33333333-3333-4333-8333-333333333333",
          mimeType: "image/jpeg",
          fileName: "reference.jpg",
        }],
      },
    });
    await call(first, `/api/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST",
      token: tokenB,
      body: { text: "可以，我今晚发给你。" },
    });

    const second = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
    );
    const loginA = await call(second, "/api/auth/login", {
      method: "POST",
      body: { nickname: "小树", pin: "1234" },
    });
    const loginB = await call(second, "/api/auth/login", {
      method: "POST",
      body: { nickname: "阿桥", pin: "5678" },
    });
    expect(loginA.body.data.token).toBe(tokenA);
    expect(loginB.body.data.token).toBe(tokenB);

    const restored = await call(
      second,
      `/api/conversations/${encodeURIComponent(matchId)}/messages`,
      { token: loginB.body.data.token },
    );
    expect(restored.body.data.map((message: any) => message.text)).toEqual([
      "你好，我们先交换三张参考图吧。",
      "可以，我今晚发给你。",
    ]);
    expect(restored.body.data.map((message: any) => message.senderDisplayName)).toEqual([
      "小树",
      "阿桥",
    ]);
    expect(restored.body.data[0].images[0].fileName).toBe("reference.jpg");

    const changedTags = await call(second, "/api/me/account", {
      method: "PATCH",
      token: tokenA,
      body: { personalityTags: ["成长型", "长期主义"] },
    });
    expect(changedTags.body.data.personalityTags).toEqual(["成长型", "长期主义"]);
    expect((await call(second, "/api/conversations", { token: tokenA })).body.data)
      .toHaveLength(1);
    expect((await call(second, "/api/me/profile", { token: tokenA }))
      .body.data.profile.personalityTags).toEqual(["成长型", "长期主义"]);
  });

  it("streams a persisted message to the other accepted participant", async () => {
    const accounts = new InMemoryAccountRepository();
    const poolState = new InMemoryMatchPoolStateRepository();
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      poolState,
    );
    const registeredA = await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "实时用户A", pin: "1234" },
    });
    const registeredB = await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "实时用户B", pin: "5678" },
    });
    const tokenA = registeredA.body.data.token;
    const tokenB = registeredB.body.data.token;
    await call(handle, "/api/me/profile", { method: "PUT", token: tokenA, body: profileA });
    await call(handle, "/api/me/profile", { method: "PUT", token: tokenB, body: profileB });
    await call(handle, "/api/me/profile/activate", { method: "POST", token: tokenA });
    await call(handle, "/api/me/profile/activate", { method: "POST", token: tokenB });
    const matches = await call(handle, "/api/matches/run", { method: "POST", token: tokenA });
    const matchId = matches.body.data[0].matchId;
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: tokenA,
      body: { decision: "accepted" },
    });
    await call(handle, `/api/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: tokenB,
      body: { decision: "accepted" },
    });

    const abortController = new AbortController();
    const streamResponse = await handle(new Request(
      `http://local.test/api/conversations/${encodeURIComponent(matchId)}/events`,
      {
        headers: { "x-demo-role-token": tokenB },
        signal: abortController.signal,
      },
    ));
    expect(streamResponse.headers.get("content-type")).toContain("text/event-stream");
    const reader = streamResponse.body!.getReader();
    const ready = new TextDecoder().decode((await reader.read()).value);
    expect(ready).toContain("event: ready");

    const sent = await call(handle, `/api/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST",
      token: tokenA,
      body: { text: "这条消息应该即时到达。" },
    });
    const event = new TextDecoder().decode((await reader.read()).value);
    expect(event).toContain("event: message");
    expect(event).toContain(sent.body.data.messageId);
    expect(event).toContain("这条消息应该即时到达。");
    abortController.abort();
  });

  it("keeps independent nicknames unique", async () => {
    const accounts = new InMemoryAccountRepository();
    const handle = createApiHandler(
      new AngelBridgeApplication(),
      undefined,
      accounts,
      new InMemoryMatchPoolStateRepository(),
    );
    await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "用户A", pin: "1234" },
    });
    const duplicate = await call(handle, "/api/auth/register", {
      method: "POST",
      body: { nickname: "用户A", pin: "5678" },
    });
    expect(duplicate.response.status).toBe(409);
    expect(duplicate.body.error.code).toBe("nickname_taken");
  });
});
