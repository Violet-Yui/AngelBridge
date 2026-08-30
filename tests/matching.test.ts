import { describe, expect, it } from "vitest";
import type { MatchingProfile, ValueNode } from "../src/domain/contracts";
import { evaluateMatch, rankCandidates } from "../src/domain/matching";

const node = (
  personaId: string,
  id: string,
  direction: "offer" | "need",
  title: string,
  keywords: string[],
  evidenceCompleteness = 0.9,
): ValueNode => ({
  id,
  personaId,
  direction,
  domain: "skill",
  title,
  description: title,
  keywords,
  deliverables: [],
  visibility: "match_only",
  evidenceCompleteness,
  updatedAt: "2026-08-26T10:00:00.000Z",
  isSynthetic: true,
  datasetVersion: "v1",
  images: [],
});

const profile = (
  personaId: string,
  displayName: string,
  offerKeywords: string[],
  needKeywords: string[],
  evidenceCompleteness = 0.9,
): MatchingProfile => ({
  personaId,
  displayName,
  personalityTags: [],
  interestTags: [],
  nodes: [
    node(
      personaId,
      `${personaId}-offer`,
      "offer",
      `可提供：${offerKeywords.join("、")}`,
      offerKeywords,
      evidenceCompleteness,
    ),
    node(
      personaId,
      `${personaId}-need`,
      "need",
      `需要：${needKeywords.join("、")}`,
      needKeywords,
      evidenceCompleteness,
    ),
  ],
  acceptedExchangeModes: ["skill_swap"],
  constraints: { locations: ["线上"], availability: ["周末"] },
});

const viewer = profile(
  "viewer",
  "体验者",
  ["产品策划", "MVP"],
  ["网页开发", "MVP"],
);
const now = new Date("2026-08-26T12:00:00.000Z");

describe("bilateral matching", () => {
  it("keeps only candidates that create clear value for both sides", () => {
    const reciprocal = profile(
      "candidate-a",
      "候选人 A",
      ["网页开发", "MVP"],
      ["产品策划", "MVP"],
    );
    const oneWayOnly = profile(
      "candidate-b",
      "候选人 B",
      ["网页开发", "MVP"],
      ["摄影"],
    );

    const ranked = rankCandidates(viewer, [oneWayOnly, reciprocal], now);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].candidateId).toBe("candidate-a");
    expect(ranked[0].proof).not.toHaveProperty("internalScore");
    expect(ranked[0].proof.valueToViewer[0]).toContain("网页");
    expect(ranked[0].proof.valueToCandidate[0]).toContain("产品");
  });

  it("applies hard gates before ranking", () => {
    const candidate = profile(
      "candidate-a",
      "候选人 A",
      ["网页开发", "MVP"],
      ["产品策划", "MVP"],
    );
    candidate.constraints.locations = ["线下杭州"];

    const result = evaluateMatch(viewer, candidate, now);

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.rejection.reasons).toContain("地点约束不一致");
    }
  });

  it("ranks deterministically by bilateral utility and evidence", () => {
    const stronger = profile(
      "candidate-z",
      "候选人 Z",
      ["网页开发", "MVP"],
      ["产品策划", "MVP"],
      0.95,
    );
    const weaker = profile(
      "candidate-a",
      "候选人 A",
      ["网页开发", "MVP"],
      ["产品策划", "MVP"],
      0.65,
    );

    const first = rankCandidates(viewer, [weaker, stronger], now);
    const second = rankCandidates(viewer, [stronger, weaker], now);

    expect(first.map((item) => item.candidateId)).toEqual([
      "candidate-z",
      "candidate-a",
    ]);
    expect(second).toEqual(first);
  });
});
