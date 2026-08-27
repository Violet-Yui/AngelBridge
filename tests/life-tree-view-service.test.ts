import { describe, expect, it } from "vitest";
import { demoScenarios } from "../src/demo/scenarios";
import { InMemoryDemoService } from "../src/demo/session-service";
import {
  LifeTreeDetailSchema,
  LifeTreeOverviewSchema,
} from "../src/product/life-tree-contracts";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const fixedNow = new Date("2026-08-27T09:00:00.000Z");

const createServices = () => {
  const demo = new InMemoryDemoService({
    idFactory: () => "life-tree-session",
    now: () => fixedNow,
  });
  return {
    demo,
    lifeTree: new LifeTreeViewService(demo, () => fixedNow),
  };
};

describe("life tree view aggregation", () => {
  it("builds the home overview from the existing session without new state", () => {
    const { demo, lifeTree } = createServices();
    const scenario = demoScenarios[0];
    const session = demo.createSession(scenario.id);

    const overview = LifeTreeOverviewSchema.parse(
      lifeTree.getOverview(session.id, scenario.viewerPersonaId, "tree_only"),
    );

    expect(overview.disclosure).toBe("tree_only");
    expect(overview.stage).toBe("created");
    expect(overview.counts).toEqual({
      offers: 1,
      needs: 1,
      goals: 0,
      opportunities: 0,
      outcomes: 0,
    });
    expect(overview.growth).toMatchObject({
      score: 100,
      rulesetVersion: "demo-v1",
      isSynthetic: true,
    });
    expect(overview.pendingActions[0].kind).toBe("activate_intent");
    expect(overview.recommendations.items).toEqual([]);
  });

  it("shows explainable recommendations and party-specific pending actions", () => {
    const { demo, lifeTree } = createServices();
    const scenario = demoScenarios[0];
    const session = demo.createSession(scenario.id);

    demo.activateIntent(session.id, scenario.viewerPersonaId);
    const matches = demo.runMatching(session.id);

    const matched = lifeTree.getOverview(
      session.id,
      scenario.viewerPersonaId,
    );
    expect(matched.stage).toBe("matches_ready");
    expect(matched.recommendations.total).toBeGreaterThan(0);
    expect(matched.recommendations.items[0]).toMatchObject({
      candidateId: scenario.expectedCandidateId,
      isSynthetic: true,
    });
    expect(matched.recommendations.items[0].scoreBasis).toEqual([
      "双向供需互补度",
      "资料证据完整度",
      "资源更新时间",
    ]);

    demo.submitConsent(session.id, matches[0].proof.matchId, scenario.viewerPersonaId, "accepted");
    expect(
      lifeTree.getOverview(session.id, scenario.viewerPersonaId)
        .pendingActions[0].kind,
    ).toBe("wait_for_other");
    expect(
      lifeTree.getOverview(session.id, scenario.expectedCandidateId)
        .pendingActions[0].kind,
    ).toBe("review_match");
    const candidateRecommendation = lifeTree.getOverview(
      session.id,
      scenario.expectedCandidateId,
    ).recommendations.items[0];
    expect(candidateRecommendation.candidateId).toBe(
      scenario.viewerPersonaId,
    );
    expect(candidateRecommendation.valueToYou).toEqual(
      matched.recommendations.items[0].valueToOther,
    );
  });

  it("turns a completed bridge pact into outcomes and synthetic growth", () => {
    const { demo, lifeTree } = createServices();
    const scenario = demoScenarios[0];
    const session = demo.createSession(scenario.id);

    demo.activateIntent(session.id, scenario.viewerPersonaId);
    const matches = demo.runMatching(session.id);
    demo.submitConsent(session.id, matches[0].proof.matchId, scenario.viewerPersonaId, "accepted");
    demo.submitConsent(session.id, matches[0].proof.matchId, scenario.expectedCandidateId, "accepted");
    demo.confirmPact(session.id, scenario.viewerPersonaId);
    demo.confirmPact(session.id, scenario.expectedCandidateId);
    demo.finishPact(session.id, "completed");

    const detail = LifeTreeDetailSchema.parse(
      lifeTree.getDetail(session.id, scenario.viewerPersonaId, "detailed"),
    );

    expect(detail.overview.stage).toBe("completed");
    expect(detail.overview.growth.score).toBe(1000);
    expect(detail.overview.growth.nextMilestone).toBeNull();
    expect(detail.overview.counts.outcomes).toBe(1);
    expect(detail.overview.pendingActions).toEqual([]);
    expect(detail.overview.pet.mood).toBe("celebrating");
    expect(detail.outcomes).toHaveLength(1);
  });
});
