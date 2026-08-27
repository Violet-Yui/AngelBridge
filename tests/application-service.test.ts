import { describe, expect, it } from "vitest";
import { AngelBridgeApplication } from "../src/application/app-service";
import { InMemoryDemoService } from "../src/demo/session-service";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const createApplication = () => {
  let id = 0;
  const demo = new InMemoryDemoService({
    idFactory: () => `session-${++id}`,
    now: () => new Date("2026-08-27T10:00:00.000Z"),
  });
  let token = 0;
  return new AngelBridgeApplication(
    demo,
    new LifeTreeViewService(demo, () => new Date("2026-08-27T10:00:00.000Z")),
    () => `role-token-${++token}`,
  );
};

describe("AngelBridgeApplication", () => {
  it("enforces node confirmation and completes the bilateral fixture flow", async () => {
    const app = createApplication();
    const bootstrap = app.createDemoSession("studio-photography");
    const viewer = bootstrap.roles.find((role) => role.isViewer)!;
    const candidate = bootstrap.roles.find((role) => role.personaId === "studio-b")!;

    const parsed = app.parseFixture(
      bootstrap.sessionId,
      viewer.token,
      "我有周末工作室，想换品牌照片。",
    );
    expect(() => app.activateIntent(bootstrap.sessionId, viewer.token)).toThrow(
      "must be confirmed",
    );

    app.confirmNodes(
      bootstrap.sessionId,
      viewer.token,
      parsed.nodes.map((node) => node.id),
    );
    app.updateIntent(bootstrap.sessionId, viewer.token, {
      ...parsed.intent,
      disclosurePolicy: {
        matchLocationPrecision: "region",
        contactDisclosure: "after_mutual_consent",
        exactLocationDisclosure: "after_pact_active",
      },
    });
    app.activateIntent(bootstrap.sessionId, viewer.token);

    const matches = await app.runMatching(bootstrap.sessionId, viewer.token);
    expect(matches).toHaveLength(3);
    expect(matches[0].counterpartId).toBe("studio-b");
    const matchId = matches[0].matchId;

    app.submitConsent(bootstrap.sessionId, viewer.token, matchId, "accepted");
    app.submitConsent(bootstrap.sessionId, candidate.token, matchId, "accepted");

    const edited = app.updatePact(bootstrap.sessionId, viewer.token, {
      timeWindow: "本周六 10:00-18:00",
      locationSummary: "北京朝阳",
      costOrDifference: "优先互换",
      firstAction: "先发三张场地参考图",
      completionCriteria: ["交付 12 张精选照片"],
      exitRule: "提前 24 小时告知",
    });
    expect(edited.firstAction).toBe("先发三张场地参考图");

    app.confirmPact(bootstrap.sessionId, viewer.token);
    expect(app.confirmPact(bootstrap.sessionId, candidate.token).status).toBe("active");
    expect(app.finishPact(bootstrap.sessionId, viewer.token, "completed").status).toBe(
      "completed",
    );
    const tree = app.getTree(bootstrap.sessionId, viewer.token, true);
    expect("outcomes" in tree && tree.outcomes).toHaveLength(1);
  });

  it("keeps role tokens scoped to their session and match", () => {
    const app = createApplication();
    const first = app.createDemoSession("studio-photography");
    const second = app.createDemoSession("product-web");
    const firstViewer = first.roles.find((role) => role.isViewer)!;

    expect(() => app.getStatus(second.sessionId, firstViewer.token)).toThrow(
      "another session",
    );
  });
});
