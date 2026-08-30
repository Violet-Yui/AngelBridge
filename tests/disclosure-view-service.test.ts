import { describe, expect, it } from "vitest";
import { demoScenarios } from "../src/demo/scenarios";
import { InMemoryDemoService, getSelectedConnection } from "../src/demo/session-service";
import { projectConnectionDisclosure } from "../src/product/disclosure-view-service";

describe("boundary disclosure projection", () => {
  it("reveals only fields and nodes allowed by the current connection stage", () => {
    const service = new InMemoryDemoService({
      idFactory: () => "disclosure-session",
      now: () => new Date("2026-08-27T10:00:00.000Z"),
    });
    const scenario = demoScenarios[0];
    const created = service.createSession(scenario.id);
    service.activateIntent(created.id, scenario.viewerPersonaId);
    const match = service.runMatching(created.id)[0];

    const sessionForVisibility = service.getSession(created.id);
    const counterpart = sessionForVisibility.profiles.find(
      (profile) => profile.personaId === match.candidateId,
    )!;
    counterpart.nodes[0].visibility = "private";
    counterpart.nodes[1].visibility = "mutual_consent";
    service.submitConsent(
      created.id,
      match.proof.matchId,
      scenario.viewerPersonaId,
      "accepted",
    );

    // Visibility variants are injected into a read model to isolate projection behavior.
    const waitingSession = service.getSession(created.id);
    waitingSession.profiles.find(
      (profile) => profile.personaId === match.candidateId,
    )!.nodes = counterpart.nodes;
    const waitingConnection = getSelectedConnection(waitingSession)!;
    const waiting = projectConnectionDisclosure(
      waitingSession,
      waitingConnection,
      scenario.viewerPersonaId,
    );
    expect(waiting.basicContact).toBeNull();
    expect(waiting.exactLocation).toBeNull();
    expect(waiting.visibleNodes.every((node) => node.visibility === "match_only")).toBe(true);

    service.submitConsent(
      created.id,
      match.proof.matchId,
      match.candidateId,
      "accepted",
    );
    const mutualSession = service.getSession(created.id);
    mutualSession.profiles.find(
      (profile) => profile.personaId === match.candidateId,
    )!.nodes = counterpart.nodes;
    const mutual = projectConnectionDisclosure(
      mutualSession,
      getSelectedConnection(mutualSession)!,
      scenario.viewerPersonaId,
    );
    expect(mutual.basicContact).toContain(match.candidateId);
    expect(mutual.visibleNodes.some((node) => node.visibility === "mutual_consent")).toBe(true);
    expect(mutual.visibleNodes.some((node) => node.visibility === "private")).toBe(false);
  });

  it("honors a hidden region policy", () => {
    const service = new InMemoryDemoService({ idFactory: () => "hidden-region" });
    const scenario = demoScenarios[0];
    const created = service.createSession(scenario.id);
    service.activateIntent(created.id, scenario.viewerPersonaId);
    const match = service.runMatching(created.id)[0];
    service.submitConsent(created.id, match.proof.matchId, scenario.viewerPersonaId, "accepted");
    const session = service.getSession(created.id);
    session.disclosurePolicies[match.candidateId].matchLocationPrecision = "hidden";

    expect(
      projectConnectionDisclosure(
        session,
        getSelectedConnection(session)!,
        scenario.viewerPersonaId,
      ).region,
    ).toBeNull();
  });
});
