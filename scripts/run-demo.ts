import { InMemoryDemoService } from "../src/demo/session-service";

const scenarioId = process.argv[2] ?? "studio-photography";
const service = new InMemoryDemoService({ idFactory: () => "demo-session" });

const session = service.createSession(scenarioId);
const parseResult = service.getParseResult(session.id, session.viewerPersonaId);
service.activateIntent(session.id, session.viewerPersonaId);

const [selectedMatch] = service.runMatching(session.id);
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
      parseResult,
      matchProof: selectedMatch.proof,
      pact,
      trees: pact.partyIds.map((personaId) =>
        service.getTree(session.id, personaId),
      ),
    },
    null,
    2,
  ),
);
