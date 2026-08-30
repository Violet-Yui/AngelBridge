import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { createApiHandler } from "../src/http/api";
import type {
  ApplicationSessionSnapshot,
  ApplicationStateRepository,
} from "../src/persistence/application-state";

class MemoryStateRepository implements ApplicationStateRepository {
  private readonly snapshots = new Map<string, ApplicationSessionSnapshot>();

  async findBySessionId(sessionId: string) {
    return structuredClone(this.snapshots.get(sessionId) ?? null);
  }

  async save(snapshot: ApplicationSessionSnapshot) {
    this.snapshots.set(snapshot.sessionId, structuredClone(snapshot));
  }

  async ping() {}
  async close() {}
}

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

describe("application persistence", () => {
  it("restores tokens, completed workflow and chat from an application snapshot", async () => {
    const first = new AngelBridgeApplication();
    const bootstrap = first.createDemoSession("studio-photography");
    const viewer = bootstrap.roles.find((role) => role.isViewer)!;
    const candidate = bootstrap.roles.find((role) => role.personaId === "studio-b")!;
    const parsed = first.parseFixture(bootstrap.sessionId, viewer.token, "周末工作室置换品牌摄影");
    first.confirmNodes(
      bootstrap.sessionId,
      viewer.token,
      parsed.nodes.map((node) => node.id),
    );
    first.updateIntent(bootstrap.sessionId, viewer.token, {
      ...parsed.intent,
      disclosurePolicy: {
        matchLocationPrecision: "region",
        contactDisclosure: "after_mutual_consent",
        exactLocationDisclosure: "after_pact_active",
      },
    });
    first.activateIntent(bootstrap.sessionId, viewer.token);
    const matches = await first.runMatching(bootstrap.sessionId, viewer.token);
    const matchId = matches[0].matchId;
    first.submitConsent(bootstrap.sessionId, viewer.token, matchId, "accepted");
    first.submitConsent(bootstrap.sessionId, candidate.token, matchId, "accepted");
    first.sendConversationMessage(
      bootstrap.sessionId,
      viewer.token,
      matchId,
      "先交换三张参考图。",
    );
    first.confirmPact(bootstrap.sessionId, viewer.token);
    first.confirmPact(bootstrap.sessionId, candidate.token);
    first.finishPact(bootstrap.sessionId, viewer.token, "completed");

    const second = new AngelBridgeApplication();
    second.restoreSessionSnapshot(first.exportSessionSnapshot(bootstrap.sessionId));

    expect(second.getStatus(bootstrap.sessionId, viewer.token).stage).toBe("completed");
    expect(
      second.listConversationMessages(bootstrap.sessionId, viewer.token, matchId)[0].text,
    ).toBe("先交换三张参考图。");
    const tree = second.getTree(bootstrap.sessionId, viewer.token, true);
    expect("outcomes" in tree ? tree.outcomes : []).toHaveLength(1);
  });

  it("persists successful HTTP mutations and restores lazily after restart", async () => {
    const repository = new MemoryStateRepository();
    const first = createApiHandler(new AngelBridgeApplication(), repository);
    const created = await call(first, "/api/demo/sessions", {
      method: "POST",
      body: { scenarioId: "product-web" },
    });
    const bootstrap = created.body.data;
    const viewer = bootstrap.roles.find((role: any) => role.isViewer);
    const base = `/api/sessions/${bootstrap.sessionId}`;

    const second = createApiHandler(new AngelBridgeApplication(), repository);
    const dashboard = await call(second, `${base}/dashboard`, { token: viewer.token });
    expect(dashboard.response.status).toBe(200);
    const turn = await call(second, `${base}/pet/turn`, {
      method: "POST",
      token: viewer.token,
      body: { message: "下一步做什么？", intent: "next_step" },
    });
    expect(turn.response.status).toBe(201);

    const third = createApiHandler(new AngelBridgeApplication(), repository);
    const history = await call(third, `${base}/pet/turns`, { token: viewer.token });
    expect(history.response.status).toBe(200);
    expect(history.body.data).toHaveLength(1);
  });
});
