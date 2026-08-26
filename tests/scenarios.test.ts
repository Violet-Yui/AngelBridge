import { describe, expect, it } from "vitest";
import { MatchingProfileSchema } from "../src/domain/contracts";
import { rankCandidates } from "../src/domain/matching";
import { demoScenarios } from "../src/demo/scenarios";

const now = new Date("2026-08-26T12:00:00.000Z");

describe("synthetic demo scenario catalog", () => {
  it("contains three reusable scenarios with one viewer and three candidates", () => {
    expect(demoScenarios).toHaveLength(3);
    expect(new Set(demoScenarios.map((scenario) => scenario.id)).size).toBe(3);

    for (const scenario of demoScenarios) {
      expect(scenario.profiles).toHaveLength(4);
      expect(
        scenario.profiles.some(
          (profile) => profile.personaId === scenario.viewerPersonaId,
        ),
      ).toBe(true);
      expect(
        scenario.profiles.some(
          (profile) => profile.personaId === scenario.expectedCandidateId,
        ),
      ).toBe(true);

      for (const profile of scenario.profiles) {
        MatchingProfileSchema.parse(profile);
        expect(profile.nodes.some((node) => node.direction === "offer")).toBe(
          true,
        );
        expect(profile.nodes.some((node) => node.direction === "need")).toBe(
          true,
        );
        expect(scenario.sourceTexts[profile.personaId]).toBeTruthy();
      }
    }
  });

  it.each(demoScenarios)(
    "$title keeps the intended reciprocal candidate first",
    (scenario) => {
      const viewer = scenario.profiles.find(
        (profile) => profile.personaId === scenario.viewerPersonaId,
      )!;
      const candidates = scenario.profiles.filter(
        (profile) => profile.personaId !== scenario.viewerPersonaId,
      );

      const ranked = rankCandidates(viewer, candidates, now);

      expect(ranked[0].candidateId).toBe(scenario.expectedCandidateId);
      expect(ranked[0].proof.valueToViewer).toHaveLength(1);
      expect(ranked[0].proof.valueToCandidate).toHaveLength(1);
      expect(ranked[0].proof).not.toHaveProperty("internalScore");
    },
  );
});
