import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { AngelBridgeClient } from "../src/client/angelbridge-client";
import { AngelBridgeDemoClient } from "../src/client/angelbridge-demo-client";
import {
  DemoSessionStore,
  type DemoSessionStorage,
} from "../src/client/demo-session";
import { InMemoryDemoService } from "../src/demo/session-service";
import { createApiHandler } from "../src/http/api";
import type { LifeTreeDetail } from "../src/product/life-tree-contracts";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

class MemoryStorage implements DemoSessionStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const setup = () => {
  const demo = new InMemoryDemoService({ idFactory: () => "demo-client-session" });
  let token = 0;
  const app = new AngelBridgeApplication(
    demo,
    new LifeTreeViewService(demo),
    () => `demo-client-token-${++token}`,
  );
  const handler = createApiHandler(app);
  const fetcher: typeof fetch = async (input, init) => {
    const url = typeof input === "string" || input instanceof URL
      ? input.toString()
      : input.url;
    return handler(new Request(url, init));
  };
  const transport = new AngelBridgeClient("http://local.test", undefined, fetcher);
  const session = new DemoSessionStore(new MemoryStorage());
  return {
    client: new AngelBridgeDemoClient(transport, session),
    session,
    transport,
  };
};

describe("AngelBridgeDemoClient", () => {
  it("drives the I1-I3 product flow and preserves the selected counterpart role", async () => {
    const { client, session, transport } = setup();
    const bootstrap = await client.startDemo();

    expect(Object.keys(session.get().rolesByPersonaId)).toHaveLength(4);
    expect((await client.getDashboard()).stage).toBe("created");

    const parsed = await client.organizeWish("我有工作室，需要品牌摄影");
    const updatedNode = parsed.nodes[0];
    await client.publishIntent({
      intent: {
        ...parsed.intent,
        disclosurePolicy: {
          matchLocationPrecision: "region",
          contactDisclosure: "after_mutual_consent",
          exactLocationDisclosure: "after_pact_active",
        },
      },
      nodeUpdates: [{
        nodeId: updatedNode.id,
        value: {
          title: `${updatedNode.title}（已确认）`,
          description: updatedNode.description,
          keywords: updatedNode.keywords,
          deliverables: updatedNode.deliverables,
          visibility: updatedNode.visibility,
        },
      }],
    });

    expect((await client.getDashboard()).stage).toBe("intent_active");
    const viewer = bootstrap.roles.find((role) => role.isViewer)!;
    const tree = await transport.withToken(viewer.token).getTree(
      bootstrap.sessionId,
      true,
    ) as LifeTreeDetail;
    expect([...tree.offers, ...tree.needs, ...tree.goals]).toContainEqual(
      expect.objectContaining({ title: `${updatedNode.title}（已确认）` }),
    );

    const matches = await client.runMatching();
    expect(matches).toHaveLength(3);
    const selected = matches[1];
    const viewerDetail = await client.getMatchDetail(selected.matchId);
    expect(session.get()).toMatchObject({
      selectedMatchId: selected.matchId,
      selectedCounterpartId: selected.counterpartId,
    });

    client.setRole("counterpart");
    expect(client.getCurrentRole()).toBe("counterpart");
    const counterpartMatches = await client.getMatches();
    expect(counterpartMatches.map((match) => match.matchId)).toContain(selected.matchId);
    const counterpartDetail = await client.getMatchDetail(selected.matchId);
    expect(counterpartDetail.valueToYou).toEqual(viewerDetail.valueToOther);

    await client.resetDemo();
    expect(client.getSessionState()).toMatchObject({
      activePersonaId: bootstrap.viewerPersonaId,
      selectedMatchId: null,
      selectedCounterpartId: null,
    });
    expect((await client.getDashboard()).stage).toBe("created");
  });

  it("requires selecting a match before switching to the counterpart", async () => {
    const { client } = setup();
    await client.startDemo();

    expect(() => client.setRole("counterpart")).toThrow(
      "select a match before switching to the counterpart role",
    );
  });
});
