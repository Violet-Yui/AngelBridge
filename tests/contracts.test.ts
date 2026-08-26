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

  it("rejects a fixture that pretends to be real data", () => {
    expect(() =>
      ParseResultSchema.parse({ ...parseResult, isSynthetic: false }),
    ).toThrow();
  });
});
