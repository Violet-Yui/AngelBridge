import { describe, expect, it, vi } from "vitest";
import { DoubaoArkMatchAssessmentProvider } from "../src/ai-matching/doubao-ark-provider";
import { FixtureAiMatchAssessmentProvider } from "../src/ai-matching/fixture-provider";
import {
  evaluateHybridMatch,
  scoreHybridAssessment,
} from "../src/ai-matching/hybrid-matching";
import type { AiMatchAssessmentProvider } from "../src/ai-matching/provider";
import {
  createAiMatchAssessmentProvider,
  LiveAiMatchEnvironmentSchema,
} from "../src/ai-matching/runtime";
import { demoScenarios } from "../src/demo/scenarios";
import { InMemoryDemoService } from "../src/demo/session-service";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const fixedNow = new Date("2026-08-27T09:00:00.000Z");

const createProvider = () =>
  new FixtureAiMatchAssessmentProvider({ now: () => fixedNow });

const createService = () =>
  new InMemoryDemoService({
    idFactory: () => "hybrid-session",
    now: () => fixedNow,
  });

describe("hybrid AI matching", () => {
  it("selects fixture mode explicitly and requires credentials for live mode", () => {
    expect(
      createAiMatchAssessmentProvider({ AI_MODE: "fixture" }),
    ).toBeInstanceOf(FixtureAiMatchAssessmentProvider);
    expect(
      LiveAiMatchEnvironmentSchema.safeParse({ AI_MODE: "live_ai" }).success,
    ).toBe(false);
    expect(
      LiveAiMatchEnvironmentSchema.safeParse({
        AI_MODE: "live_ai",
        AI_API_KEY: "ark-key",
        AI_MODEL: "doubao-model",
        AI_BASE_URL:
          "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      }).success,
    ).toBe(true);
  });

  it.each(demoScenarios)(
    "$title ranks the expected bilateral candidate with fixture AI",
    async (scenario) => {
      const service = createService();
      const session = service.createSession(scenario.id);
      service.activateIntent(session.id, scenario.viewerPersonaId);

      const matches = await service.runHybridMatching(
        session.id,
        createProvider(),
      );

      expect(matches).toHaveLength(3);
      expect(matches[0].candidateId).toBe(scenario.expectedCandidateId);
      expect(matches[0].internalScore).toBeGreaterThanOrEqual(90);
      expect(matches[0].internalScore).toBeLessThanOrEqual(95);
      expect(matches[1].internalScore).toBeGreaterThanOrEqual(76);
      expect(matches[1].internalScore).toBeLessThanOrEqual(86);
      expect(matches[2].internalScore).toBeGreaterThanOrEqual(64);
      expect(matches[2].internalScore).toBeLessThanOrEqual(74);
      expect(matches[0].internalScore).toBeGreaterThan(matches[1].internalScore);
      expect(matches[1].internalScore).toBeGreaterThan(matches[2].internalScore);
      expect(matches[1].proof.unknowns.length).toBeGreaterThan(0);
      expect(matches[2].proof.unknowns.length).toBeGreaterThan(0);

      const viewer = scenario.profiles.find(
        (profile) => profile.personaId === scenario.viewerPersonaId,
      )!;
      const lowCandidate = scenario.profiles.find(
        (profile) => profile.personaId.endsWith("-e"),
      )!;
      const lowEvaluation = await evaluateHybridMatch(
        viewer,
        lowCandidate,
        createProvider(),
        fixedNow,
      );
      expect(lowEvaluation.eligible).toBe(false);
      expect(
        matches.some((match) => match.candidateId === lowCandidate.personaId),
      ).toBe(false);
      expect(matches[0].assessment).toMatchObject({
        assessmentMode: "fixture",
        model: "fixture-hybrid-v1",
        isSynthetic: true,
      });
      expect(matches[0].scoreBreakdown).toMatchObject({
        algorithmVersion: "semantic-bridge-v0.3",
        tier: "ideal",
        bridgeIndex: matches[0].internalScore,
      });
      expect(matches[0].proof.evidence.length).toBeGreaterThanOrEqual(4);
      expect(service.getStage(session.id)).toBe("matches_ready");
      const recommendation = new LifeTreeViewService(
        service,
        () => fixedNow,
      ).getOverview(session.id, scenario.viewerPersonaId)
        .recommendations.items[0];
      expect(recommendation.assessment?.assessmentMode).toBe("fixture");
      expect(recommendation.scoreBreakdown?.bridgeIndex).toBe(
        matches[0].internalScore,
      );
    },
  );

  it("keeps the existing consent and pact flow after hybrid matching", async () => {
    const scenario = demoScenarios[0];
    const service = createService();
    const session = service.createSession(scenario.id);
    service.activateIntent(session.id, scenario.viewerPersonaId);
    const matches = await service.runHybridMatching(session.id, createProvider());
    const matchId = matches[0].proof.matchId;

    service.submitConsent(session.id, matchId, scenario.viewerPersonaId, "accepted");
    service.submitConsent(session.id, matchId, scenario.expectedCandidateId, "accepted");
    service.confirmPact(session.id, scenario.viewerPersonaId);
    service.confirmPact(session.id, scenario.expectedCandidateId);
    service.finishPact(session.id, "completed");

    expect(service.getStage(session.id)).toBe("completed");
    expect(
      service.getTree(session.id, scenario.viewerPersonaId).outcomes,
    ).toHaveLength(1);
  });

  it("rejects AI output that cites a node outside the requested profiles", async () => {
    const scenario = demoScenarios[0];
    const baseProvider = createProvider();
    const invalidProvider: AiMatchAssessmentProvider = {
      async assess(input) {
        const assessment = await baseProvider.assess(input);
        assessment.viewerToCandidate!.needNodeId = "invented:need:node";
        assessment.viewerToCandidate!.evidenceNodeIds = [
          "invented:need:node",
          assessment.viewerToCandidate!.offerNodeId,
        ];
        return assessment;
      },
    };

    await expect(
      evaluateHybridMatch(
        scenario.profiles[0],
        scenario.profiles[1],
        invalidProvider,
        fixedNow,
      ),
    ).rejects.toThrow("references a node outside");
  });

  it("does not call AI when deterministic hard gates reject a candidate", async () => {
    const scenario = demoScenarios[0];
    const rejectedCandidate = structuredClone(scenario.profiles[2]);
    rejectedCandidate.acceptedExchangeModes = ["money"];
    let providerCalled = false;
    const provider: AiMatchAssessmentProvider = {
      async assess() {
        providerCalled = true;
        throw new Error("provider should not be called");
      },
    };

    const evaluation = await evaluateHybridMatch(
      scenario.profiles[0],
      rejectedCandidate,
      provider,
      fixedNow,
    );

    expect(evaluation.eligible).toBe(false);
    expect(providerCalled).toBe(false);
  });

  it("maps one fixed assessment to one reproducible bridge index", async () => {
    const scenario = demoScenarios[0];
    const assessment = await createProvider().assess({
      viewer: scenario.profiles[0],
      candidate: scenario.profiles[1],
    });
    const nodes = [
      scenario.profiles[0].nodes.find(
        (node) => node.id === assessment.viewerToCandidate!.needNodeId,
      )!,
      scenario.profiles[1].nodes.find(
        (node) => node.id === assessment.viewerToCandidate!.offerNodeId,
      )!,
      scenario.profiles[1].nodes.find(
        (node) => node.id === assessment.candidateToViewer!.needNodeId,
      )!,
      scenario.profiles[0].nodes.find(
        (node) => node.id === assessment.candidateToViewer!.offerNodeId,
      )!,
    ];

    expect(scoreHybridAssessment(assessment, nodes, fixedNow)).toEqual(
      scoreHybridAssessment(assessment, nodes, fixedNow),
    );
  });

  it("converts a forced Doubao tool call into a structured assessment", async () => {
    const scenario = demoScenarios[0];
    const viewer = scenario.profiles[0];
    const candidate = scenario.profiles[1];
    const viewerNeed = viewer.nodes.find((node) => node.direction === "need")!;
    const candidateOffer = candidate.nodes.find((node) => node.direction === "offer")!;
    const toolArguments = {
      primaryPattern: "supply_demand",
      supportingPatterns: ["transactional"],
      partyBenefits: [
        {
          partyId: viewer.personaId,
          strength: "exact",
          basis: "resource",
          reason: "摄影服务可以回应品牌图片需求",
          evidenceNodeIds: [viewerNeed.id, candidateOffer.id],
          unknowns: [],
        },
        {
          partyId: candidate.personaId,
          strength: "strong",
          basis: "money",
          reason: "摄影师可以获得合理服务回报",
          evidenceNodeIds: [candidateOffer.id],
          unknowns: ["费用需要确认"],
        },
      ],
      executionFit: {
        level: "partial",
        reason: "双方需要确认拍摄清单和时间",
        evidenceNodeIds: [viewerNeed.id, candidateOffer.id],
        unknowns: ["拍摄时间"],
      },
      matchReasons: [{
        type: "value_to_you",
        text: "摄影服务回应品牌图片需求",
        evidenceNodeIds: [viewerNeed.id, candidateOffer.id],
      }],
      conflicts: [],
      confidence: "high",
    };
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      name: "assess_value_connection",
                      arguments: JSON.stringify(toolArguments),
                    },
                  },
                ],
              },
            },
          ],
        }),
    );
    const provider = new DoubaoArkMatchAssessmentProvider({
      apiKey: "ark-key",
      model: "doubao-model",
      fetchImpl: fetchMock as unknown as typeof fetch,
      now: () => fixedNow,
    });

    const assessment = await provider.assess({ viewer, candidate });

    expect(assessment).toMatchObject({
      viewerId: viewer.personaId,
      candidateId: candidate.personaId,
      assessmentMode: "live_ai",
      model: "doubao-model",
      isSynthetic: true,
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.temperature).toBe(0);
    expect(body.messages[0].content).toContain("关系模式");
    expect(body.messages[0].content).toContain("双向价值不是双方必须互换非金钱资源");
    expect(body.tool_choice.function.name).toBe(
      "assess_value_connection",
    );
  });
});
