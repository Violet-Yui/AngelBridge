import bridgePact from "../fixtures/bridge-pact.json";
import matchProof from "../fixtures/match-proof.json";
import parseResult from "../fixtures/parse-result.json";
import {
  BridgePactSchema,
  MatchingProfileSchema,
  MatchProofSchema,
  ParseResultSchema,
} from "../src/domain/contracts";
import { demoScenarios } from "../src/demo/scenarios";

ParseResultSchema.parse(parseResult);
MatchProofSchema.parse(matchProof);
BridgePactSchema.parse(bridgePact);
for (const scenario of demoScenarios) {
  for (const profile of scenario.profiles) {
    MatchingProfileSchema.parse(profile);
  }
}

console.log(
  "fixtures verified: ParseResult, MatchProof, BridgePact, 3 demo scenarios",
);
