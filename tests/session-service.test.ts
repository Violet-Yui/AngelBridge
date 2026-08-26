import { describe, expect, it } from "vitest";
import {
  BridgePactSchema,
  OutcomeSchema,
  ParseResultSchema,
} from "../src/domain/contracts";
import { demoScenarios, type DemoScenario } from "../src/demo/scenarios";
import { InMemoryDemoService } from "../src/demo/session-service";

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

  const waiting = service.submitConsent(session.id, viewerId, "accepted");
  expect(waiting.state).toBe("waiting_other");
  expect(service.getSession(session.id).pact).toBeUndefined();
  expect(service.getStage(session.id)).toBe("waiting_other");

  const mutual = service.submitConsent(
    session.id,
    scenario.expectedCandidateId,
    "accepted",
  );
  expect(mutual.state).toBe("mutual_accepted");
  expect(
    BridgePactSchema.parse(service.getSession(session.id).pact).status,
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
    expect(reset.pact).toBeUndefined();
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
});
