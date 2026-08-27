import { randomUUID } from "node:crypto";
import type {
  BridgePact,
  DisclosurePolicy,
  Intent,
  MatchingProfile,
  Outcome,
  ParseResult,
  ValueNode,
} from "../domain/contracts";
import { rankCandidates, type RankedMatch } from "../domain/matching";
import type { AiMatchAssessmentProvider } from "../ai-matching/provider";
import {
  rankCandidatesWithAi,
  type HybridRankedMatch,
} from "../ai-matching/hybrid-matching";
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
  | "no_matches"
  | "matches_ready"
  | "waiting_other"
  | "rejected"
  | "pact_draft"
  | "pact_active"
  | "completed"
  | "exited";

export type SessionMatch = RankedMatch | HybridRankedMatch;
export type MatchingMode = "rule" | "fixture_ai";

export type MatchConnection = {
  consent: ConsentRecord;
  pact?: BridgePact;
};

export type DemoSession = {
  id: string;
  scenarioId: string;
  viewerPersonaId: string;
  profiles: MatchingProfile[];
  sourceTexts: Record<string, string>;
  activeIntentPersonaIds: string[];
  intents: Record<string, Intent>;
  confirmedNodeIds: Record<string, string[]>;
  disclosurePolicies: Record<string, DisclosurePolicy>;
  treeDisclosures: Record<string, "private" | "tree_only" | "summary" | "detailed">;
  matches: SessionMatch[];
  matchingMode?: MatchingMode;
  matchingAttemptedAt?: string;
  connections: Record<string, MatchConnection>;
  selectedMatchId?: string;
  outcomes: Outcome[];
  createdAt: string;
  updatedAt: string;
};

export const getSelectedConnection = (
  session: DemoSession,
): MatchConnection | undefined =>
  session.selectedMatchId
    ? session.connections[session.selectedMatchId]
    : undefined;

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
    const connection = getSelectedConnection(session);
    if (connection?.pact?.status === "completed") return "completed";
    if (connection?.pact?.status === "exited") return "exited";
    if (connection?.pact?.status === "active") return "pact_active";
    if (connection?.pact?.status === "draft") return "pact_draft";
    if (connection?.consent.state === "waiting_other") return "waiting_other";
    if (session.matches.length > 0) return "matches_ready";
    if (session.matchingAttemptedAt) return "no_matches";
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
      intent: clone(session.intents[personaId]),
      source: "fixture",
      isSynthetic: true,
      datasetVersion: profile.nodes[0].datasetVersion,
    };
  }

  setSourceText(sessionId: string, personaId: string, sourceText: string): ParseResult {
    const session = this.requireSession(sessionId);
    this.requireProfile(session, personaId);
    this.assertIntentEditable(session, personaId);
    session.sourceTexts[personaId] = sourceText;
    this.touch(session);
    return this.getParseResult(sessionId, personaId);
  }

  activateIntent(sessionId: string, personaId: string): DemoSession {
    const session = this.requireSession(sessionId);
    this.requireProfile(session, personaId);
    if (!session.activeIntentPersonaIds.includes(personaId)) {
      session.activeIntentPersonaIds.push(personaId);
      session.intents[personaId].status = "active";
      this.touch(session);
    }
    return clone(session);
  }

  runMatching(sessionId: string): RankedMatch[] {
    const session = this.requireSession(sessionId);
    if (!session.activeIntentPersonaIds.includes(session.viewerPersonaId)) {
      throw new Error("viewer intent must be active before matching");
    }
    if (session.matches.length > 0 && session.matchingMode === "rule") {
      return clone(session.matches as RankedMatch[]);
    }

    const viewer = this.profileForIntent(session, session.viewerPersonaId);
    const candidates = session.profiles.filter(
      (profile) =>
        profile.personaId !== viewer.personaId &&
        session.activeIntentPersonaIds.includes(profile.personaId),
    ).map((profile) => this.profileForIntent(session, profile.personaId));
    session.matches = rankCandidates(viewer, candidates, this.now());
    session.matchingMode = "rule";
    session.matchingAttemptedAt = this.now().toISOString();
    session.connections = {};
    session.selectedMatchId = undefined;
    session.outcomes = [];
    this.touch(session);
    return clone(session.matches);
  }

  async runHybridMatching(
    sessionId: string,
    provider: AiMatchAssessmentProvider,
  ): Promise<HybridRankedMatch[]> {
    const session = this.requireSession(sessionId);
    if (!session.activeIntentPersonaIds.includes(session.viewerPersonaId)) {
      throw new Error("viewer intent must be active before matching");
    }
    if (
      session.matches.length > 0 &&
      session.matchingMode === "fixture_ai" &&
      session.matches.every((match) => "assessment" in match)
    ) {
      return clone(session.matches as HybridRankedMatch[]);
    }

    const viewer = this.profileForIntent(session, session.viewerPersonaId);
    const candidates = session.profiles.filter(
      (profile) =>
        profile.personaId !== viewer.personaId &&
        session.activeIntentPersonaIds.includes(profile.personaId),
    ).map((profile) => this.profileForIntent(session, profile.personaId));
    const matches = await rankCandidatesWithAi(
      viewer,
      candidates,
      provider,
      this.now(),
    );
    session.matches = matches;
    session.matchingMode = "fixture_ai";
    session.matchingAttemptedAt = this.now().toISOString();
    session.connections = {};
    session.selectedMatchId = undefined;
    session.outcomes = [];
    this.touch(session);
    return clone(matches);
  }

  submitConsent(
    sessionId: string,
    matchId: string,
    actorId: string,
    decision: ConsentDecision,
  ): ConsentRecord {
    const session = this.requireSession(sessionId);
    if (session.matches.length === 0) {
      throw new Error("matching must run before consent");
    }
    const match = this.requireMatch(session, matchId);
    let connection = session.connections[matchId];
    if (!connection) {
      if (actorId !== match.proof.viewerId) {
        throw new Error("the viewer must initiate this connection first");
      }
      const selected = getSelectedConnection(session);
      if (selected && selected.consent.state !== "rejected") {
        throw new Error("another connection is already being progressed");
      }
      connection = {
        consent: createConsentRecord(match.proof.viewerId, match.candidateId),
      };
      session.connections[matchId] = connection;
      session.selectedMatchId = matchId;
    }

    const previousDecision = connection.consent.decisions[actorId];
    if (previousDecision === decision) return clone(connection.consent);
    if (previousDecision) throw new Error("party has already submitted another decision");

    connection.consent = submitConsentState(connection.consent, actorId, decision);
    match.proof.status = connection.consent.state;
    if (connection.consent.state === "mutual_accepted") {
      connection.pact = this.createPact(session, match);
    } else if (connection.consent.state === "rejected") {
      session.selectedMatchId = undefined;
    }
    this.touch(session);
    return clone(connection.consent);
  }

  confirmPact(sessionId: string, actorId: string): BridgePact {
    const session = this.requireSession(sessionId);
    const connection = getSelectedConnection(session);
    if (!connection?.pact) {
      throw new Error("mutual consent is required before pact confirmation");
    }
    const pact = connection.pact;

    if (pact.confirmations[actorId] === true) return clone(pact);

    const next = confirmPactState(
      {
        partyIds: pact.partyIds,
        state: pact.status,
        confirmations: pact.confirmations,
      },
      actorId,
    );
    pact.confirmations = Object.fromEntries(
      Object.entries(next.confirmations).filter(
        (entry): entry is [string, boolean] => entry[1] !== undefined,
      ),
    );
    pact.status = next.state;
    if (next.state === "active") {
      pact.activatedAt = this.now().toISOString();
    }
    this.touch(session);
    return clone(pact);
  }

  finishPact(
    sessionId: string,
    outcome: "completed" | "exited",
  ): BridgePact {
    const session = this.requireSession(sessionId);
    const connection = getSelectedConnection(session);
    if (!connection?.pact) {
      throw new Error("pact does not exist");
    }
    const pact = connection.pact;

    if (pact.status === outcome) return clone(pact);

    const next = finishPactState(
      {
        partyIds: pact.partyIds,
        state: pact.status,
        confirmations: pact.confirmations,
      },
      outcome,
    );
    const timestamp = this.now().toISOString();
    pact.status = next.state;
    if (outcome === "completed") {
      pact.completedAt = timestamp;
    } else {
      pact.exitedAt = timestamp;
    }
    session.outcomes = this.createOutcomes(session, pact, outcome, timestamp);
    this.touch(session);
    return clone(pact);
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

  updateValueNode(
    sessionId: string,
    personaId: string,
    nodeId: string,
    updates: Pick<ValueNode, "title" | "description" | "keywords" | "deliverables" | "visibility">,
  ): ValueNode {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    this.assertIntentEditable(session, personaId);
    const node = profile.nodes.find((item) => item.id === nodeId);
    if (!node) throw new Error(`value node does not belong to persona: ${nodeId}`);
    Object.assign(node, clone(updates), { updatedAt: this.now().toISOString() });
    session.confirmedNodeIds[personaId] = session.confirmedNodeIds[personaId]
      .filter((id) => id !== nodeId);
    this.touch(session);
    return clone(node);
  }

  deleteValueNode(sessionId: string, personaId: string, nodeId: string): void {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    this.assertIntentEditable(session, personaId);
    const index = profile.nodes.findIndex((item) => item.id === nodeId);
    if (index < 0) throw new Error(`value node does not belong to persona: ${nodeId}`);
    profile.nodes.splice(index, 1);
    const intent = session.intents[personaId];
    intent.offerNodeIds = intent.offerNodeIds.filter((id) => id !== nodeId);
    intent.needNodeIds = intent.needNodeIds.filter((id) => id !== nodeId);
    intent.goalNodeIds = intent.goalNodeIds.filter((id) => id !== nodeId);
    session.confirmedNodeIds[personaId] = session.confirmedNodeIds[personaId]
      .filter((id) => id !== nodeId);
    this.touch(session);
  }

  confirmValueNodes(sessionId: string, personaId: string, nodeIds: string[]): string[] {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    this.assertIntentEditable(session, personaId);
    const available = new Set(profile.nodes.map((node) => node.id));
    if (nodeIds.some((id) => !available.has(id))) {
      throw new Error("one or more value nodes do not belong to persona");
    }
    session.confirmedNodeIds[personaId] = [...new Set(nodeIds)];
    this.touch(session);
    return clone(session.confirmedNodeIds[personaId]);
  }

  updateIntent(
    sessionId: string,
    personaId: string,
    intent: Intent,
    disclosurePolicy: DisclosurePolicy,
  ): Intent {
    const session = this.requireSession(sessionId);
    const profile = this.requireProfile(session, personaId);
    this.assertIntentEditable(session, personaId);
    const available = new Set(profile.nodes.map((node) => node.id));
    const selectedIds = [...intent.offerNodeIds, ...intent.needNodeIds, ...intent.goalNodeIds];
    if (selectedIds.some((id) => !available.has(id))) {
      throw new Error("intent references a value node outside the persona");
    }
    const directionById = new Map(profile.nodes.map((node) => [node.id, node.direction]));
    const references = [
      [intent.offerNodeIds, "offer"],
      [intent.needNodeIds, "need"],
      [intent.goalNodeIds, "goal"],
    ] as const;
    for (const [ids, direction] of references) {
      if (ids.some((id) => directionById.get(id) !== direction)) {
        throw new Error(`intent ${direction} list contains a node with another direction`);
      }
    }
    session.intents[personaId] = clone({ ...intent, status: "draft" });
    session.disclosurePolicies[personaId] = clone(disclosurePolicy);
    profile.acceptedExchangeModes = clone(intent.acceptedExchangeModes);
    profile.constraints = clone(intent.constraints);
    this.touch(session);
    return clone(session.intents[personaId]);
  }

  setTreeDisclosure(
    sessionId: string,
    personaId: string,
    disclosure: "private" | "tree_only" | "summary" | "detailed",
  ): void {
    const session = this.requireSession(sessionId);
    this.requireProfile(session, personaId);
    session.treeDisclosures[personaId] = disclosure;
    this.touch(session);
  }

  updatePactTerms(
    sessionId: string,
    actorId: string,
    updates: Pick<BridgePact, "timeWindow" | "locationSummary" | "costOrDifference" | "firstAction" | "completionCriteria" | "exitRule">,
  ): BridgePact {
    const session = this.requireSession(sessionId);
    const connection = getSelectedConnection(session);
    if (!connection?.pact) throw new Error("pact does not exist");
    const pact = connection.pact;
    if (pact.status !== "draft") throw new Error("only a draft pact can be edited");
    if (!pact.partyIds.includes(actorId)) throw new Error("actor is not a party to this pact");
    Object.assign(pact, clone(updates));
    pact.confirmations = Object.fromEntries(
      pact.partyIds.map((partyId) => [partyId, false]),
    );
    this.touch(session);
    return clone(pact);
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
    const intents = Object.fromEntries(scenario.profiles.map((profile) => [
      profile.personaId,
      {
        offerNodeIds: profile.nodes.filter((node) => node.direction === "offer").map((node) => node.id),
        needNodeIds: profile.nodes.filter((node) => node.direction === "need").map((node) => node.id),
        goalNodeIds: profile.nodes.filter((node) => node.direction === "goal").map((node) => node.id),
        acceptedExchangeModes: clone(profile.acceptedExchangeModes),
        constraints: clone(profile.constraints),
        status: profile.personaId === scenario.viewerPersonaId ? "draft" : "active",
      } satisfies Intent,
    ]));
    return {
      id: sessionId,
      scenarioId: scenario.id,
      viewerPersonaId: scenario.viewerPersonaId,
      profiles: clone(scenario.profiles),
      sourceTexts: clone(scenario.sourceTexts),
      activeIntentPersonaIds: scenario.profiles
        .map((profile) => profile.personaId)
        .filter((personaId) => personaId !== scenario.viewerPersonaId),
      intents,
      confirmedNodeIds: Object.fromEntries(scenario.profiles.map((profile) => [
        profile.personaId,
        profile.personaId === scenario.viewerPersonaId ? [] : profile.nodes.map((node) => node.id),
      ])),
      disclosurePolicies: Object.fromEntries(scenario.profiles.map((profile) => [
        profile.personaId,
        {
          matchLocationPrecision: "region",
          contactDisclosure: "after_mutual_consent",
          exactLocationDisclosure: "after_pact_active",
        } satisfies DisclosurePolicy,
      ])),
      treeDisclosures: Object.fromEntries(scenario.profiles.map((profile) => [profile.personaId, "summary"])),
      matches: [],
      matchingMode: undefined,
      matchingAttemptedAt: undefined,
      connections: {},
      outcomes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private createPact(session: DemoSession, match: SessionMatch): BridgePact {
    const scenario = getDemoScenario(session.scenarioId);
    const candidateId = match.candidateId;
    const partyIds: [string, string] = [session.viewerPersonaId, candidateId];
    const templateCommitments = scenario.pact.commitments.filter((item) =>
      partyIds.includes(item.personaId),
    );
    const commitments = partyIds.map((personaId) => {
      const template = templateCommitments.find((item) => item.personaId === personaId);
      if (template) return template;
      const offerEvidence = match.proof.evidence
        .map((item) => session.profiles.flatMap((profile) => profile.nodes).find((node) => node.id === item.nodeId))
        .find((node) => node?.personaId === personaId && node.direction === "offer");
      if (!offerEvidence) throw new Error(`match evidence missing offer for persona: ${personaId}`);
      return {
        personaId,
        deliverable: offerEvidence.deliverables[0] ?? offerEvidence.title,
      };
    });

    return {
      pactId: `pact:${session.id}:${candidateId}`,
      matchId: match.proof.matchId,
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
      timeWindow: scenario.pact.timeWindow,
      locationSummary: scenario.pact.locationSummary,
      costOrDifference: scenario.pact.costOrDifference,
      firstAction: scenario.pact.firstAction,
      completionCriteria: clone(scenario.pact.completionCriteria),
      exitRule: scenario.pact.exitRule,
      createdAt: this.now().toISOString(),
      isSynthetic: true,
      datasetVersion: session.profiles[0].nodes[0].datasetVersion,
    };
  }

  private createOutcomes(
    session: DemoSession,
    pact: BridgePact,
    status: "completed" | "exited",
    timestamp: string,
  ): Outcome[] {
    const scenario = getDemoScenario(session.scenarioId);
    return pact.partyIds.map((personaId) => {
      const template = scenario.pact.outcomes[personaId];
      return {
        outcomeId: `outcome:${session.id}:${personaId}`,
        sessionId: session.id,
        pactId: pact.pactId,
        personaId,
        status,
        summary: template?.[status] ?? (status === "completed"
          ? "完成一次双向价值连接"
          : "完成一次连接评估，但本次未继续执行"),
        treeChange: template?.treeChange ?? "生命树记录一次价值连接经历",
        createdAt: timestamp,
        isSynthetic: true,
        datasetVersion: pact.datasetVersion,
      };
    });
  }

  private requireMatch(session: DemoSession, matchId: string): SessionMatch {
    const match = session.matches.find((item) => item.proof.matchId === matchId);
    if (!match) throw new Error(`match does not belong to session: ${matchId}`);
    return match;
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

  private profileForIntent(
    session: DemoSession,
    personaId: string,
  ): MatchingProfile {
    const profile = this.requireProfile(session, personaId);
    const intent = session.intents[personaId];
    const selected = new Set([
      ...intent.offerNodeIds,
      ...intent.needNodeIds,
      ...intent.goalNodeIds,
    ]);
    return {
      ...clone(profile),
      nodes: clone(profile.nodes.filter((node) => selected.has(node.id))),
      acceptedExchangeModes: clone(intent.acceptedExchangeModes),
      constraints: clone(intent.constraints),
    };
  }

  private assertIntentEditable(session: DemoSession, personaId: string): void {
    if (session.activeIntentPersonaIds.includes(personaId)) {
      throw new Error("active intent cannot be edited; reset the demo to create a new draft");
    }
  }

  private touch(session: DemoSession): void {
    session.updatedAt = this.now().toISOString();
  }
}
