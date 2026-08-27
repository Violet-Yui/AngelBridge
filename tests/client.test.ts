import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { AngelBridgeClient, AngelBridgeClientError } from "../src/client/angelbridge-client";
import { InMemoryDemoService } from "../src/demo/session-service";
import { createApiHandler } from "../src/http/api";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const setup = () => {
  const demo = new InMemoryDemoService({ idFactory: () => "client-session" });
  let token = 0;
  const app = new AngelBridgeApplication(
    demo,
    new LifeTreeViewService(demo),
    () => `client-token-${++token}`,
  );
  const handler = createApiHandler(app);
  const fetcher: typeof fetch = async (input, init) => {
    const url = typeof input === "string" || input instanceof URL
      ? input.toString()
      : input.url;
    return handler(new Request(url, init));
  };
  return new AngelBridgeClient("http://local.test", undefined, fetcher);
};

describe("AngelBridgeClient", () => {
  it("drives typed frontend calls without exposing internal match records", async () => {
    const anonymous = setup();
    const bootstrap = await anonymous.createDemoSession("studio-photography");
    const viewer = bootstrap.roles.find((role) => role.isViewer)!;
    const client = anonymous.withToken(viewer.token);
    const parsed = await client.parse(bootstrap.sessionId, "我有工作室，需要品牌摄影");
    await client.confirmNodes(bootstrap.sessionId, parsed.nodes.map((node) => node.id));
    await client.updateIntent(bootstrap.sessionId, {
      ...parsed.intent,
      disclosurePolicy: {
        matchLocationPrecision: "region",
        contactDisclosure: "after_mutual_consent",
        exactLocationDisclosure: "after_pact_active",
      },
    });
    await client.activateIntent(bootstrap.sessionId);
    const cards = await client.runMatching(bootstrap.sessionId);

    expect(cards[0].counterpartDisplayName).toBeTruthy();
    expect(cards[0].matchId).toBeTruthy();
    const detail = await client.getMatch(bootstrap.sessionId, cards[0].matchId);
    expect(detail.proof.evidence.length).toBeGreaterThan(0);
  });

  it("turns API error envelopes into a typed client error", async () => {
    const client = setup().withToken("wrong-token");
    await expect(client.getDashboard("missing-session")).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    } satisfies Partial<AngelBridgeClientError>);
  });
});
