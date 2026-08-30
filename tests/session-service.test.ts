import { describe, expect, it } from "vitest";
import {
  BridgePactSchema,
  OutcomeSchema,
  ParseResultSchema,
} from "../src/domain/contracts";
import { demoScenarios, type DemoScenario } from "../src/demo/scenarios";
import { getSelectedConnection, InMemoryDemoService } from "../src/demo/session-service";

const fixedNow = new Date("2026-08-26T12:00:00.000Z");

const createService = () => {
  let nextId = 0;
  return new InMemoryDemoService({
    idFactory: () => `session-${++nextId}`,
    now: () => fixedNow,
  });
};

const completeScenario = (
  service: InMemoryDemoService,
  scenario: DemoScenario,
) => {
  const session = service.createSession(scenario.id);
  const viewerId = scenario.viewerPersonaId;

  expect(service.getStage(session.id)).toBe("created");
  expect(
    ParseResultSchema.parse(service.getParseResult(session.id, viewerId)).intent
      .status,
  ).toBe("draft");

  service.activateIntent(session.id, viewerId);
  expect(service.getStage(session.id)).toBe("intent_active");

  const matches = service.runMatching(session.id);
  expect(matches[0].candidateId).toBe(scenario.expectedCandidateId);
  expect(service.getStage(session.id)).toBe("matches_ready");

  const matchId = matches[0].proof.matchId;
  const waiting = service.submitConsent(session.id, matchId, viewerId, "accepted");
  expect(waiting.state).toBe("waiting_other");
  expect(getSelectedConnection(service.getSession(session.id))?.pact).toBeUndefined();
  expect(service.getStage(session.id)).toBe("waiting_other");

  const mutual = service.submitConsent(
    session.id,
    matchId,
    scenario.expectedCandidateId,
    "accepted",
  );
  expect(mutual.state).toBe("mutual_accepted");
  expect(
    BridgePactSchema.parse(getSelectedConnection(service.getSession(session.id))?.pact).status,
  ).toBe("draft");
  expect(service.getStage(session.id)).toBe("pact_draft");

  const oneConfirmed = service.confirmPact(session.id, viewerId);
  expect(oneConfirmed.status).toBe("draft");
  const active = service.confirmPact(
    session.id,
    scenario.expectedCandidateId,
  );
  expect(active.status).toBe("active");
  expect(service.getStage(session.id)).toBe("pact_active");

  const completed = service.finishPact(session.id, "completed");
  expect(completed.status).toBe("completed");
  expect(service.getStage(session.id)).toBe("completed");

  const viewerTree = service.getTree(session.id, viewerId);
  const candidateTree = service.getTree(
    session.id,
    scenario.expectedCandidateId,
  );
  expect(OutcomeSchema.parse(viewerTree.outcomes[0]).status).toBe("completed");
  expect(OutcomeSchema.parse(candidateTree.outcomes[0]).status).toBe(
    "completed",
  );

  return session.id;
};

describe("in-memory demo session", () => {
  it.each(demoScenarios)(
    "$title runs from a new session to outcomes on both trees",
    (scenario) => {
      completeScenario(createService(), scenario);
    },
  );

  it("keeps sessions isolated and resets only the selected session", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const completedSessionId = completeScenario(service, scenario);
    const untouched = service.createSession(scenario.id);

    expect(service.getStage(completedSessionId)).toBe("completed");
    expect(service.getStage(untouched.id)).toBe("created");

    const reset = service.resetSession(completedSessionId);

    expect(reset.id).toBe(completedSessionId);
    expect(reset.matches).toEqual([]);
    expect(getSelectedConnection(reset)?.pact).toBeUndefined();
    expect(reset.outcomes).toEqual([]);
    expect(service.getStage(completedSessionId)).toBe("created");
    expect(service.getStage(untouched.id)).toBe("created");
  });

  it("returns copies so callers cannot mutate stored session state", () => {
    const service = createService();
    const session = service.createSession(demoScenarios[0].id);

    session.activeIntentPersonaIds.push(session.viewerPersonaId);

    expect(service.getStage(session.id)).toBe("created");
  });

  it("lets the viewer progress a lower-ranked candidate independently", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    service.activateIntent(session.id, scenario.viewerPersonaId);
    const matches = service.runMatching(session.id);
    const selected = matches[1];

    service.submitConsent(
      session.id,
      selected.proof.matchId,
      scenario.viewerPersonaId,
      "accepted",
    );
    service.submitConsent(
      session.id,
      selected.proof.matchId,
      selected.candidateId,
      "accepted",
    );

    const progressed = service.getSession(session.id);
    expect(progressed.selectedMatchId).toBe(selected.proof.matchId);
    expect(progressed.connections[selected.proof.matchId].pact?.partyIds).toEqual([
      scenario.viewerPersonaId,
      selected.candidateId,
    ]);
    expect(progressed.matches[0].proof.status).toBe("candidate");
  });

  it("invalidates node confirmation after editing and locks an active intent", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    const viewer = session.profiles.find(
      (profile) => profile.personaId === scenario.viewerPersonaId,
    )!;
    const node = viewer.nodes[0];

    service.confirmValueNodes(session.id, scenario.viewerPersonaId, [node.id]);
    service.updateValueNode(session.id, scenario.viewerPersonaId, node.id, {
      title: `${node.title}（已修改）`,
      description: node.description,
      keywords: node.keywords,
      deliverables: node.deliverables,
      visibility: node.visibility,
    });
    expect(
      service.getSession(session.id).confirmedNodeIds[scenario.viewerPersonaId],
    ).not.toContain(node.id);

    service.activateIntent(session.id, scenario.viewerPersonaId);
    expect(() =>
      service.setSourceText(
        session.id,
        scenario.viewerPersonaId,
        "激活后不可再改",
      ),
    ).toThrow("active intent cannot be edited");
  });

  it("treats repeated matching, consent, confirmation and completion as idempotent", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    service.activateIntent(session.id, scenario.viewerPersonaId);
    const firstMatches = service.runMatching(session.id);
    expect(service.runMatching(session.id)).toEqual(firstMatches);

    const match = firstMatches[0];
    const waiting = service.submitConsent(
      session.id,
      match.proof.matchId,
      scenario.viewerPersonaId,
      "accepted",
    );
    expect(
      service.submitConsent(
        session.id,
        match.proof.matchId,
        scenario.viewerPersonaId,
        "accepted",
      ),
    ).toEqual(waiting);
    service.submitConsent(
      session.id,
      match.proof.matchId,
      match.candidateId,
      "accepted",
    );
    const once = service.confirmPact(session.id, scenario.viewerPersonaId);
    expect(service.confirmPact(session.id, scenario.viewerPersonaId)).toEqual(once);
    service.confirmPact(session.id, match.candidateId);
    const completed = service.finishPact(session.id, "completed");
    expect(service.finishPact(session.id, "completed")).toEqual(completed);
  });

  it("returns an explicit no-match stage instead of failing the session", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    const currentIntent = session.intents[scenario.viewerPersonaId];
    service.updateIntent(
      session.id,
      scenario.viewerPersonaId,
      {
        ...currentIntent,
        constraints: {
          locations: ["火星基地"],
          availability: ["火星时间"],
        },
        status: "draft",
      },
      session.disclosurePolicies[scenario.viewerPersonaId],
    );
    service.activateIntent(session.id, scenario.viewerPersonaId);

    expect(service.runMatching(session.id)).toEqual([]);
    expect(service.getStage(session.id)).toBe("no_matches");
  });

  it("can reject one candidate and then select another", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    service.activateIntent(session.id, scenario.viewerPersonaId);
    const matches = service.runMatching(session.id);

    const rejected = service.submitConsent(
      session.id,
      matches[0].proof.matchId,
      scenario.viewerPersonaId,
      "rejected",
    );
    expect(rejected.state).toBe("rejected");
    expect(service.getStage(session.id)).toBe("matches_ready");

    const next = service.submitConsent(
      session.id,
      matches[1].proof.matchId,
      scenario.viewerPersonaId,
      "accepted",
    );
    expect(next.state).toBe("waiting_other");
    expect(service.getSession(session.id).selectedMatchId).toBe(
      matches[1].proof.matchId,
    );
  });

  it("records an exited pact without producing a completed outcome", () => {
    const service = createService();
    const scenario = demoScenarios[0];
    const session = service.createSession(scenario.id);
    service.activateIntent(session.id, scenario.viewerPersonaId);
    const match = service.runMatching(session.id)[0];
    service.submitConsent(session.id, match.proof.matchId, scenario.viewerPersonaId, "accepted");
    service.submitConsent(session.id, match.proof.matchId, match.candidateId, "accepted");
    service.confirmPact(session.id, scenario.viewerPersonaId);
    service.confirmPact(session.id, match.candidateId);

    expect(service.finishPact(session.id, "exited").status).toBe("exited");
    expect(service.getStage(session.id)).toBe("exited");
    expect(service.getTree(session.id, scenario.viewerPersonaId).outcomes[0].status).toBe("exited");
  });
});
