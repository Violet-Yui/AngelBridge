import bridgePact from "../fixtures/bridge-pact.json";
import matchProof from "../fixtures/match-proof.json";
import parseResult from "../fixtures/parse-result.json";
import {
  BridgePactSchema,
  MatchProofSchema,
  ParseResultSchema,
} from "../src/domain/contracts";

ParseResultSchema.parse(parseResult);
MatchProofSchema.parse(matchProof);
BridgePactSchema.parse(bridgePact);

console.log("fixtures verified: ParseResult, MatchProof, BridgePact");
