import { randomUUID } from "node:crypto";
import type {
  BridgePact,
  MatchingProfile,
  Outcome,
  ParseResult,
  ValueNode,
} from "../domain/contracts";
import { rankCandidates, type RankedMatch } from "../domain/matching";
import {
  confirmPact as confirmPactState,
  createConsentRecord,
  finishPact as finishPactState,
  submitConsent as submitConsentState,
  type ConsentDecision,
  type ConsentRecord,
} from "../domain/workflow";
import {
  getDemoScenario,
  type DemoScenario,
} from "./scenarios";

export type DemoStage =
  | "created"
  | "intent_active"
  | "matches_ready"
  | "waiting_other"
  | "rejected"
  | "pact_draft"
  | "pact_active"
  | "completed"
  | "exited";

export type DemoSession = {
  id: string;
  scenarioId: string;
  viewerPersonaId: string;
  profiles: MatchingProfile[];
  sourceTexts: Record<string, string>;
  activeIntentPersonaIds: string[];
  matches: RankedMatch[];
  consent?: ConsentRecord;
  pact?: BridgePact;
  outcomes: Outcome[];
  createdAt: string;
  updatedAt: string;
};

export type TreeView = {
  personaId: string;
  offers: ValueNode[];
  needs: ValueNode[];
  goals: ValueNode[];
  outcomes: Outcome[];
};

type ServiceOptions = {
  idFactory?: () => string;
  now?: () => Date;
};

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryDemoService {
  private readonly sessions = new Map<string, DemoSession>();
  private readonly idFactory: () => string;
  private readonly now: () => Date;

  constructor(options: ServiceOptions = {}) {
    this.idFactory = options.idFactory ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  createSession(scenarioId: string): DemoSession {
    const scenario = getDemoScenario(scenarioId);
    const timestamp = this.now().toISOString();
    const session = this.newSession(this.idFactory(), scenario, timestamp);
    this.sessions.set(session.id, session);
    return clone(session);
  }

  getSession(sessionId: string): DemoSession {
    return clone(this.requireSession(sessionId));
  }

  getStage(sessionId: string): DemoStage {
    const session = this.requireSession(sessionId);
    if (session.pact?.status === "completed") return "completed";
    if (session.pact?.status === "exited") return "exited";
    if (session.pact?.status === "active") return "pact_active";
    if (session.pact?.status === "draft") return "pact_draft";
    if (session.consent?.state === "rejected") return "rejected";
    if (session.consent?.state === "waiting_other") return "waiting_other";
    if (session.matches.length > 0) return "matches_ready";
    if (session.activeIntentPersonaIds.includes(session.viewerPersonaId)) {
      return "intent_active";
    }
    return "created";
  }

  getParseResult(sessionId: string, personaId: string): ParseResult {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    return {
      personaId,
      sourceText: session.sourceTexts[personaId],
      nodes: clone(profile.nodes),
      intent: {
        offerNodeIds: profile.nodes
          .filter((node) => node.direction === "offer")
          .map((node) => node.id),
        needNodeIds: profile.nodes
          .filter((node) => node.direction === "need")
          .map((node) => node.id),
        goalNodeIds: profile.nodes
          .filter((node) => node.direction === "goal")
          .map((node) => node.id),
        acceptedExchangeModes: clone(profile.acceptedExchangeModes),
        constraints: clone(profile.constraints),
        status: session.activeIntentPersonaIds.includes(personaId)
          ? "active"
          : "draft",
      },
      source: "fixture",
      isSynthetic: true,
      datasetVersion: profile.nodes[0].datasetVersion,
    };
  }

  activateIntent(sessionId: string, personaId: string): DemoSession {
    const session = this.requireSession(sessionId);
    this.requireProfile(session, personaId);
    if (!session.activeIntentPersonaIds.includes(personaId)) {
      session.activeIntentPersonaIds.push(personaId);
      this.touch(session);
    }
    return clone(session);
  }

  runMatching(sessionId: string): RankedMatch[] {
    const session = this.requireSession(sessionId);
    if (!session.activeIntentPersonaIds.includes(session.viewerPersonaId)) {
      throw new Error("viewer intent must be active before matching");
    }

    const viewer = this.requireProfile(session, session.viewerPersonaId);
    const candidates = session.profiles.filter(
      (profile) =>
        profile.personaId !== viewer.personaId &&
        session.activeIntentPersonaIds.includes(profile.personaId),
    );
    session.matches = rankCandidates(viewer, candidates, this.now());
    if (session.matches.length === 0) {
      throw new Error("scenario produced no eligible bilateral match");
    }
    const top = session.matches[0];
    session.consent = createConsentRecord(viewer.personaId, top.candidateId);
    session.pact = undefined;
    session.outcomes = [];
    this.touch(session);
    return clone(session.matches);
  }

  submitConsent(
    sessionId: string,
    actorId: string,
    decision: ConsentDecision,
  ): ConsentRecord {
    const session = this.requireSession(sessionId);
    if (!session.consent || session.matches.length === 0) {
      throw new Error("matching must run before consent");
    }

    session.consent = submitConsentState(session.consent, actorId, decision);
    session.matches[0].proof.status = session.consent.state;
    if (session.consent.state === "mutual_accepted") {
      session.pact = this.createPact(session);
    }
    this.touch(session);
    return clone(session.consent);
  }

  confirmPact(sessionId: string, actorId: string): BridgePact {
    const session = this.requireSession(sessionId);
    if (!session.pact) {
      throw new Error("mutual consent is required before pact confirmation");
    }

    const next = confirmPactState(
      {
        partyIds: session.pact.partyIds,
        state: session.pact.status,
        confirmations: session.pact.confirmations,
      },
      actorId,
    );
    session.pact.confirmations = Object.fromEntries(
      Object.entries(next.confirmations).filter(
        (entry): entry is [string, boolean] => entry[1] !== undefined,
      ),
    );
    session.pact.status = next.state;
    if (next.state === "active") {
      session.pact.activatedAt = this.now().toISOString();
    }
    this.touch(session);
    return clone(session.pact);
  }

  finishPact(
    sessionId: string,
    outcome: "completed" | "exited",
  ): BridgePact {
    const session = this.requireSession(sessionId);
    if (!session.pact) {
      throw new Error("pact does not exist");
    }

    const next = finishPactState(
      {
        partyIds: session.pact.partyIds,
        state: session.pact.status,
        confirmations: session.pact.confirmations,
      },
      outcome,
    );
    const timestamp = this.now().toISOString();
    session.pact.status = next.state;
    if (outcome === "completed") {
      session.pact.completedAt = timestamp;
    } else {
      session.pact.exitedAt = timestamp;
    }
    session.outcomes = this.createOutcomes(session, outcome, timestamp);
    this.touch(session);
    return clone(session.pact);
  }

  getTree(sessionId: string, personaId: string): TreeView {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    return {
      personaId,
      offers: clone(profile.nodes.filter((node) => node.direction === "offer")),
      needs: clone(profile.nodes.filter((node) => node.direction === "need")),
      goals: clone(profile.nodes.filter((node) => node.direction === "goal")),
      outcomes: clone(
        session.outcomes.filter((outcome) => outcome.personaId === personaId),
      ),
    };
  }

  resetSession(sessionId: string): DemoSession {
    const current = this.requireSession(sessionId);
    const scenario = getDemoScenario(current.scenarioId);
    const timestamp = this.now().toISOString();
    const reset = this.newSession(sessionId, scenario, timestamp);
    this.sessions.set(sessionId, reset);
    return clone(reset);
  }

  private newSession(
    sessionId: string,
    scenario: DemoScenario,
    timestamp: string,
  ): DemoSession {
    return {
      id: sessionId,
      scenarioId: scenario.id,
      viewerPersonaId: scenario.viewerPersonaId,
      profiles: clone(scenario.profiles),
      sourceTexts: clone(scenario.sourceTexts),
      activeIntentPersonaIds: scenario.profiles
        .map((profile) => profile.personaId)
        .filter((personaId) => personaId !== scenario.viewerPersonaId),
      matches: [],
      outcomes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private createPact(session: DemoSession): BridgePact {
    const scenario = getDemoScenario(session.scenarioId);
    const candidateId = session.matches[0].candidateId;
    const partyIds: [string, string] = [session.viewerPersonaId, candidateId];
    const commitments = scenario.pact.commitments.filter((item) =>
      partyIds.includes(item.personaId),
    );
    if (commitments.length !== 2) {
      throw new Error("scenario pact must define both parties' commitments");
    }

    return {
      pactId: `pact:${session.id}:${candidateId}`,
      matchId: session.matches[0].proof.matchId,
      partyIds,
      title: scenario.pact.title,
      status: "draft",
      exchangeModes: clone(scenario.pact.exchangeModes),
      commitments: clone(
        commitments.map((item) => ({
          partyId: item.personaId,
          deliverable: item.deliverable,
        })),
      ),
      confirmations: Object.fromEntries(
        partyIds.map((partyId) => [partyId, false]),
      ),
      createdAt: this.now().toISOString(),
      isSynthetic: true,
      datasetVersion: session.profiles[0].nodes[0].datasetVersion,
    };
  }

  private createOutcomes(
    session: DemoSession,
    status: "completed" | "exited",
    timestamp: string,
  ): Outcome[] {
    const scenario = getDemoScenario(session.scenarioId);
    return session.pact!.partyIds.map((personaId) => {
      const template = scenario.pact.outcomes[personaId];
      if (!template) {
        throw new Error(`scenario outcome missing for persona: ${personaId}`);
      }
      return {
        outcomeId: `outcome:${session.id}:${personaId}`,
        sessionId: session.id,
        pactId: session.pact!.pactId,
        personaId,
        status,
        summary: template[status],
        treeChange: template.treeChange,
        createdAt: timestamp,
        isSynthetic: true,
        datasetVersion: session.pact!.datasetVersion,
      };
    });
  }

  private requireSession(sessionId: string): DemoSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`unknown demo session: ${sessionId}`);
    }
    return session;
  }

  private requireProfile(
    session: DemoSession,
    personaId: string,
  ): MatchingProfile {
    const profile = session.profiles.find(
      (item) => item.personaId === personaId,
    );
    if (!profile) {
      throw new Error(`persona does not belong to session: ${personaId}`);
    }
    return profile;
  }

  private touch(session: DemoSession): void {
    session.updatedAt = this.now().toISOString();
  }
}
