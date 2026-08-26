import { describe, expect, it } from "vitest";
import parseResult from "../fixtures/parse-result.json";
import {
  BridgePactSchema,
  MatchProofSchema,
  ParseResultSchema,
} from "../src/domain/contracts";
import bridgePact from "../fixtures/bridge-pact.json";
import matchProof from "../fixtures/match-proof.json";

describe("domain contracts", () => {
  it("accepts the three synthetic MVP fixtures", () => {
    expect(ParseResultSchema.parse(parseResult).isSynthetic).toBe(true);
    expect(MatchProofSchema.parse(matchProof).status).toBe("candidate");
    expect(BridgePactSchema.parse(bridgePact).status).toBe("draft");
  });

  it("rejects inconsistent source metadata", () => {
    expect(() =>
      ParseResultSchema.parse({ ...parseResult, isSynthetic: false }),
    ).toThrow();
  });

  it("accepts a live one-sided need", () => {
    const node = {
      ...parseResult.nodes[1],
      id: "live-need-room",
      personaId: "live-persona",
      isSynthetic: false,
    };
    const result = ParseResultSchema.parse({
      ...parseResult,
      personaId: "live-persona",
      sourceText: "我需要在杭州找一间房。",
      source: "live_ai",
      nodes: [node],
      intent: {
        ...parseResult.intent,
        offerNodeIds: [],
        needNodeIds: [node.id],
        goalNodeIds: [],
      },
      isSynthetic: false,
      datasetVersion: "live-v1",
    });

    expect(result.nodes).toHaveLength(1);
    expect(result.source).toBe("live_ai");
  });
});
