import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { InMemoryDemoService } from "../src/demo/session-service";
import { createApiHandler } from "../src/http/api";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const createTestApi = () => {
  let id = 0;
  const demo = new InMemoryDemoService({
    idFactory: () => `http-session-${++id}`,
    now: () => new Date("2026-08-27T10:00:00.000Z"),
  });
  let token = 0;
  const app = new AngelBridgeApplication(
    demo,
    new LifeTreeViewService(demo, () => new Date("2026-08-27T10:00:00.000Z")),
    () => `http-token-${++token}`,
  );
  return createApiHandler(app);
};

const call = async (
  handle: ReturnType<typeof createTestApi>,
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
) => {
  const response = await handle(
    new Request(`http://local.test${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.token ? { "x-demo-role-token": options.token } : {}),
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
  );
  return { response, body: await response.json() as any };
};

describe("local HTTP API", () => {
  it("runs the frontend MVP flow entirely through HTTP", async () => {
    const handle = createTestApi();
    const created = await call(handle, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "studio-photography" },
    });
    expect(created.response.status).toBe(201);
    const bootstrap = created.body.data;
    const viewer = bootstrap.roles.find((role: any) => role.isViewer);
    const candidate = bootstrap.roles.find((role: any) => role.personaId === "studio-b");
    const base = `/api/sessions/${bootstrap.sessionId}`;

    const parsed = await call(handle, `${base}/parse`, {
      method: "POST",
      token: viewer.token,
      body: { text: "我有周末工作室，希望置换品牌摄影。" },
    });
    const nodeIds = parsed.body.data.nodes.map((node: any) => node.id);
    await call(handle, `${base}/nodes/confirm`, {
      method: "POST",
      token: viewer.token,
      body: { nodeIds },
    });
    await call(handle, `${base}/intent`, {
      method: "PUT",
      token: viewer.token,
      body: {
        ...parsed.body.data.intent,
        disclosurePolicy: {
          matchLocationPrecision: "region",
          contactDisclosure: "after_mutual_consent",
          exactLocationDisclosure: "after_pact_active",
        },
      },
    });
    await call(handle, `${base}/intent/activate`, { method: "POST", token: viewer.token });
    const matched = await call(handle, `${base}/matches/run`, {
      method: "POST",
      token: viewer.token,
    });
    expect(matched.body.data).toHaveLength(3);
    expect(matched.body.data[0].scoringMode).toBe("fixture_ai");
    const matchId = matched.body.data[0].matchId;

    await call(handle, `${base}/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: viewer.token,
      body: { decision: "accepted" },
    });
    const hiddenConnection = await call(handle, `${base}/connection`, {
      token: viewer.token,
    });
    expect(hiddenConnection.body.data.basicContact).toBeNull();
    const mutual = await call(handle, `${base}/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: candidate.token,
      body: { decision: "accepted" },
    });
    expect(mutual.body.data.state).toBe("mutual_accepted");
    const mutuallyVisible = await call(handle, `${base}/connection`, {
      token: viewer.token,
    });
    expect(mutuallyVisible.body.data.basicContact).toContain("demo-studio-b");
    expect(mutuallyVisible.body.data.exactLocation).toBeNull();

    await call(handle, `${base}/pact/confirm`, { method: "POST", token: viewer.token });
    const active = await call(handle, `${base}/pact/confirm`, {
      method: "POST",
      token: candidate.token,
    });
    expect(active.body.data.status).toBe("active");
    const activeConnection = await call(handle, `${base}/connection`, {
      token: viewer.token,
    });
    expect(activeConnection.body.data.exactLocation).toContain("北京朝阳");
    await call(handle, `${base}/pact/finish`, {
      method: "POST",
      token: viewer.token,
      body: { outcome: "completed" },
    });
    const tree = await call(handle, `${base}/tree?view=detail`, { token: viewer.token });
    expect(tree.body.data.overview.stage).toBe("completed");
    expect(tree.body.data.outcomes).toHaveLength(1);
  });

  it("provides a fixture voice turn without any external model API", async () => {
    const handle = createTestApi();
    const created = await call(handle, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "rural-content" },
    });
    const bootstrap = created.body.data;
    const viewer = bootstrap.roles.find((role: any) => role.isViewer);
    const base = `/api/sessions/${bootstrap.sessionId}`;
    const voice = await call(handle, `${base}/voice/turn`, {
      method: "POST",
      token: viewer.token,
      body: {
        audioBase64: Buffer.from("fixture-audio").toString("base64"),
        contentType: "audio/webm",
        fixtureTranscript: "我有田园空间，希望连接内容运营伙伴。",
      },
    });

    expect(voice.response.status).toBe(201);
    expect(voice.body.data.mode).toBe("fixture");
    expect(voice.body.data.transcript).toContain("田园空间");
    expect(voice.body.data.audio.contentType).toBe("audio/wav");
  });

  it("keeps pet text chat controlled, role-scoped and reviewable", async () => {
    const handle = createTestApi();
    const created = await call(handle, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "product-web" },
    });
    const bootstrap = created.body.data;
    const viewer = bootstrap.roles.find((role: any) => role.isViewer);
    const base = `/api/sessions/${bootstrap.sessionId}`;

    const next = await call(handle, `${base}/pet/turn`, {
      method: "POST",
      token: viewer.token,
      body: { message: "我下一步做什么？", intent: "next_step" },
    });
    expect(next.body.data.assistantText).toContain("发布一个心愿");
    expect(next.body.data.mode).toBe("fixture");

    const organized = await call(handle, `${base}/pet/turn`, {
      method: "POST",
      token: viewer.token,
      body: { message: "我能做产品策划，需要网站开发", intent: "organize" },
    });
    expect(organized.body.data.assistantText).toContain("拥有");

    const history = await call(handle, `${base}/pet/turns`, { token: viewer.token });
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data.map((turn: any) => turn.intent)).toEqual([
      "next_step",
      "organize",
    ]);
  });

  it("opens a role-scoped conversation only after mutual consent", async () => {
    const handle = createTestApi();
    const created = await call(handle, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "studio-photography" },
    });
    const bootstrap = created.body.data;
    const viewer = bootstrap.roles.find((role: any) => role.isViewer);
    const candidate = bootstrap.roles.find((role: any) => role.personaId === "studio-b");
    const base = `/api/sessions/${bootstrap.sessionId}`;
    const parsed = await call(handle, `${base}/parse`, {
      method: "POST",
      token: viewer.token,
      body: { text: "我有周末工作室，希望置换品牌摄影。" },
    });
    const nodeIds = parsed.body.data.nodes.map((node: any) => node.id);
    await call(handle, `${base}/nodes/confirm`, {
      method: "POST",
      token: viewer.token,
      body: { nodeIds },
    });
    await call(handle, `${base}/intent`, {
      method: "PUT",
      token: viewer.token,
      body: {
        ...parsed.body.data.intent,
        disclosurePolicy: {
          matchLocationPrecision: "region",
          contactDisclosure: "after_mutual_consent",
          exactLocationDisclosure: "after_pact_active",
        },
      },
    });
    await call(handle, `${base}/intent/activate`, { method: "POST", token: viewer.token });
    const matched = await call(handle, `${base}/matches/run`, { method: "POST", token: viewer.token });
    const matchId = matched.body.data[0].matchId;
    await call(handle, `${base}/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: viewer.token,
      body: { decision: "accepted" },
    });
    const beforeMutual = await call(handle, `${base}/conversations`, { token: viewer.token });
    expect(beforeMutual.body.data).toEqual([]);
    await call(handle, `${base}/matches/${encodeURIComponent(matchId)}/consent`, {
      method: "POST",
      token: candidate.token,
      body: { decision: "accepted" },
    });

    const conversations = await call(handle, `${base}/conversations`, { token: viewer.token });
    expect(conversations.body.data[0].conversationId).toBe(matchId);
    const sent = await call(handle, `${base}/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST",
      token: viewer.token,
      body: { text: "你好，我们先交换三张参考图吧。" },
    });
    expect(sent.response.status).toBe(201);
    await call(handle, `${base}/conversations/${encodeURIComponent(matchId)}/messages`, {
      method: "POST",
      token: candidate.token,
      body: { text: "可以，我今晚发给你。" },
    });
    const history = await call(handle, `${base}/conversations/${encodeURIComponent(matchId)}/messages`, {
      token: viewer.token,
    });
    expect(history.body.data.map((message: any) => message.text)).toEqual([
      "你好，我们先交换三张参考图吧。",
      "可以，我今晚发给你。",
    ]);
  });

  it("rejects missing credentials and invalid request bodies", async () => {
    const handle = createTestApi();
    const created = await call(handle, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "product-web" },
    });
    const base = `/api/sessions/${created.body.data.sessionId}`;
    expect((await call(handle, `${base}/status`)).response.status).toBe(401);
    const invalid = await call(handle, `${base}/parse`, {
      method: "POST",
      token: created.body.data.roles[0].token,
      body: { text: "" },
    });
    expect(invalid.response.status).toBe(400);
    expect(invalid.body.error.code).toBe("invalid_request");
  });
});
