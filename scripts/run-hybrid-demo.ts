import { FixtureAiMatchAssessmentProvider } from "../src/ai-matching/fixture-provider";
import { InMemoryDemoService } from "../src/demo/session-service";
import { LifeTreeViewService } from "../src/product/life-tree-view-service";

const scenarioId = process.argv[2] ?? "studio-photography";
const fixedNow = new Date("2026-08-27T09:00:00.000Z");
const service = new InMemoryDemoService({
  idFactory: () => "hybrid-demo-session",
  now: () => fixedNow,
});
const provider = new FixtureAiMatchAssessmentProvider({ now: () => fixedNow });
const lifeTree = new LifeTreeViewService(service, () => fixedNow);

const session = service.createSession(scenarioId);
service.activateIntent(session.id, session.viewerPersonaId);
const [selectedMatch] = await service.runHybridMatching(session.id, provider);

service.submitConsent(session.id, selectedMatch.proof.matchId, session.viewerPersonaId, "accepted");
service.submitConsent(session.id, selectedMatch.proof.matchId, selectedMatch.candidateId, "accepted");
service.confirmPact(session.id, session.viewerPersonaId);
service.confirmPact(session.id, selectedMatch.candidateId);
const pact = service.finishPact(session.id, "completed");

console.log(
  JSON.stringify(
    {
      scenarioId,
      sessionId: session.id,
      stage: service.getStage(session.id),
      assessment: selectedMatch.assessment,
      scoreBreakdown: selectedMatch.scoreBreakdown,
      matchProof: selectedMatch.proof,
      pact,
      lifeTrees: pact.partyIds.map((personaId) =>
        lifeTree.getDetail(session.id, personaId, "detailed"),
      ),
    },
    null,
    2,
  ),
);
