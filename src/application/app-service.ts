import { randomUUID } from "node:crypto";
import type { DisclosurePolicy, Intent } from "../domain/contracts";
import { demoScenarios } from "../demo/scenarios";
import {
  InMemoryDemoService,
  getSelectedConnection,
  type DemoSession,
} from "../demo/session-service";
import { LifeTreeViewService } from "../product/life-tree-view-service";
import type { TreeDisclosure } from "../product/life-tree-contracts";
import type { UpdateIntentInput, UpdatePactInput } from "./contracts";
import {
  FixtureLanguageModelProvider,
  FixtureSpeechToTextProvider,
  FixtureTextToSpeechProvider,
} from "../voice/fixture-providers";
import { VoiceTurnService } from "../voice/voice-turn-service";
import type { VoiceTurnResponse } from "../voice/contracts";
import { projectConnectionDisclosure } from "../product/disclosure-view-service";
import { toMatchCardView, toMatchDetailView } from "../product/match-view-models";
import { FixtureAiMatchAssessmentProvider } from "../ai-matching/fixture-provider";
import {
  PetTextTurnSchema,
  type PetTextTurn,
  type PetTextTurnInput,
} from "../product/pet-conversation-contracts";
import type {
  ConversationMessage,
  ConversationSummary,
} from "../product/conversation-contracts";

export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export type DemoBootstrap = {
  sessionId: string;
  scenarioId: string;
  viewerPersonaId: string;
  roles: Array<{
    personaId: string;
    displayName: string;
    token: string;
    isViewer: boolean;
  }>;
  isSynthetic: true;
};

type Role = { sessionId: string; personaId: string };

export class AngelBridgeApplication {
  private readonly rolesByToken = new Map<string, Role>();
  private readonly tokensBySession = new Map<string, string[]>();
  private readonly voiceTurns: VoiceTurnResponse[] = [];
  private readonly petTextTurns: PetTextTurn[] = [];
  private readonly conversationMessages: ConversationMessage[] = [];

  constructor(
    readonly demo: InMemoryDemoService = new InMemoryDemoService(),
    readonly tree: LifeTreeViewService = new LifeTreeViewService(demo),
    private readonly tokenFactory: () => string = randomUUID,
  ) {}

  listScenarios() {
    return demoScenarios.map(({ id, title, summary, viewerPersonaId }) => ({
      id,
      title,
      summary,
      viewerPersonaId,
      isSynthetic: true as const,
    }));
  }

  createDemoSession(scenarioId: string): DemoBootstrap {
    let session: DemoSession;
    try {
      session = this.demo.createSession(scenarioId);
    } catch (error) {
      throw this.notFound(error);
    }
    const tokens: string[] = [];
    const roles = session.profiles.map((profile) => {
      const token = this.tokenFactory();
      tokens.push(token);
      this.rolesByToken.set(token, {
        sessionId: session.id,
        personaId: profile.personaId,
      });
      return {
        personaId: profile.personaId,
        displayName: profile.displayName,
        token,
        isViewer: profile.personaId === session.viewerPersonaId,
      };
    });
    this.tokensBySession.set(session.id, tokens);
    return {
      sessionId: session.id,
      scenarioId,
      viewerPersonaId: session.viewerPersonaId,
      roles,
      isSynthetic: true,
    };
  }

  getStatus(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const connection = getSelectedConnection(session);
    return {
      sessionId,
      personaId: role.personaId,
      stage: this.demo.getStage(sessionId),
      activeIntent: session.activeIntentPersonaIds.includes(role.personaId),
      confirmedNodeIds: session.confirmedNodeIds[role.personaId],
      selectedMatchId: session.selectedMatchId ?? null,
      consentState: connection?.consent.state ?? null,
      pactStatus: connection?.pact?.status ?? null,
      updatedAt: session.updatedAt,
      isSynthetic: true as const,
    };
  }

  resetSession(sessionId: string, token: string): DemoBootstrap {
    const role = this.authorize(sessionId, token);
    const before = this.demo.getSession(sessionId);
    if (role.personaId !== before.viewerPersonaId) {
      throw new ApplicationError("only the viewer role can reset a demo", 403, "forbidden");
    }
    this.demo.resetSession(sessionId);
    this.removeSessionTurns(this.voiceTurns, sessionId);
    this.removeSessionTurns(this.petTextTurns, sessionId);
    this.removeSessionTurns(this.conversationMessages, sessionId);
    const tokens = this.tokensBySession.get(sessionId) ?? [];
    const roles = before.profiles.map((profile, index) => ({
      personaId: profile.personaId,
      displayName: profile.displayName,
      token: tokens[index],
      isViewer: profile.personaId === before.viewerPersonaId,
    }));
    return {
      sessionId,
      scenarioId: before.scenarioId,
      viewerPersonaId: before.viewerPersonaId,
      roles,
      isSynthetic: true,
    };
  }

  getDashboard(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const disclosure = this.demo.getSession(sessionId).treeDisclosures[role.personaId];
    return this.tree.getOverview(sessionId, role.personaId, disclosure);
  }

  parseFixture(sessionId: string, token: string, text: string) {
    const role = this.authorize(sessionId, token);
    return this.demo.setSourceText(sessionId, role.personaId, text);
  }

  updateNode(sessionId: string, token: string, nodeId: string, updates: Parameters<InMemoryDemoService["updateValueNode"]>[3]) {
    const role = this.authorize(sessionId, token);
    return this.demo.updateValueNode(sessionId, role.personaId, nodeId, updates);
  }

  deleteNode(sessionId: string, token: string, nodeId: string): void {
    const role = this.authorize(sessionId, token);
    this.demo.deleteValueNode(sessionId, role.personaId, nodeId);
  }

  confirmNodes(sessionId: string, token: string, nodeIds: string[]) {
    const role = this.authorize(sessionId, token);
    return {
      nodeIds: this.demo.confirmValueNodes(sessionId, role.personaId, nodeIds),
      confirmed: true as const,
    };
  }

  updateIntent(sessionId: string, token: string, input: UpdateIntentInput): Intent {
    const role = this.authorize(sessionId, token);
    const { disclosurePolicy, ...intentFields } = input;
    const intent: Intent = { ...intentFields, status: "draft" };
    return this.demo.updateIntent(
      sessionId,
      role.personaId,
      intent,
      disclosurePolicy as DisclosurePolicy,
    );
  }

  activateIntent(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const intent = session.intents[role.personaId];
    const selected = [
      ...intent.offerNodeIds,
      ...intent.needNodeIds,
      ...intent.goalNodeIds,
    ];
    if (intent.offerNodeIds.length === 0 || intent.needNodeIds.length === 0) {
      throw new ApplicationError(
        "an active bilateral intent requires at least one offer and one need",
        409,
        "incomplete_intent",
      );
    }
    const confirmed = new Set(session.confirmedNodeIds[role.personaId]);
    if (selected.length === 0 || selected.some((id) => !confirmed.has(id))) {
      throw new ApplicationError(
        "all value nodes selected by the intent must be confirmed first",
        409,
        "nodes_not_confirmed",
      );
    }
    this.demo.activateIntent(sessionId, role.personaId);
    return this.demo.getParseResult(sessionId, role.personaId).intent;
  }

  async runMatching(sessionId: string, token: string, mode: "rule" | "fixture_ai" = "fixture_ai") {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    if (role.personaId !== session.viewerPersonaId) {
      throw new ApplicationError("only the viewer role can start this demo match", 403, "forbidden");
    }
    const matches = mode === "fixture_ai"
      ? await this.demo.runHybridMatching(
          sessionId,
          new FixtureAiMatchAssessmentProvider(),
        )
      : this.demo.runMatching(sessionId);
    const updated = this.demo.getSession(sessionId);
    return matches.map((match) => toMatchCardView(updated, match, role.personaId));
  }

  listMatches(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    return session.matches.filter(
      (match) =>
        match.proof.viewerId === role.personaId ||
        match.proof.candidateId === role.personaId,
    ).map((match) => toMatchCardView(session, match, role.personaId));
  }

  getMatch(sessionId: string, token: string, matchId: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const match = session.matches.find(
      (item) => item.proof.matchId === matchId &&
        (item.proof.viewerId === role.personaId || item.proof.candidateId === role.personaId),
    );
    if (!match) throw new ApplicationError("match not found for this role", 404, "not_found");
    return toMatchDetailView(session, match, role.personaId);
  }

  submitConsent(sessionId: string, token: string, matchId: string, decision: "accepted" | "rejected") {
    const role = this.authorize(sessionId, token);
    this.getMatch(sessionId, token, matchId);
    return this.demo.submitConsent(sessionId, matchId, role.personaId, decision);
  }

  getConsent(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const consent = getSelectedConnection(session)?.consent;
    if (!consent || !consent.partyIds.includes(role.personaId)) {
      throw new ApplicationError("consent record not found for this role", 404, "not_found");
    }
    return consent;
  }

  getPact(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const pact = getSelectedConnection(this.demo.getSession(sessionId))?.pact;
    if (!pact || !pact.partyIds.includes(role.personaId)) {
      throw new ApplicationError("pact not found for this role", 404, "not_found");
    }
    return pact;
  }

  updatePact(sessionId: string, token: string, input: UpdatePactInput) {
    const role = this.authorize(sessionId, token);
    return this.demo.updatePactTerms(sessionId, role.personaId, input);
  }

  confirmPact(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    return this.demo.confirmPact(sessionId, role.personaId);
  }

  finishPact(sessionId: string, token: string, outcome: "completed" | "exited") {
    const role = this.authorize(sessionId, token);
    const pact = this.getPact(sessionId, token);
    if (!pact.partyIds.includes(role.personaId)) {
      throw new ApplicationError("actor is not a party to this pact", 403, "forbidden");
    }
    return this.demo.finishPact(sessionId, outcome);
  }

  getTree(sessionId: string, token: string, detailed = false) {
    const role = this.authorize(sessionId, token);
    const disclosure = this.demo.getSession(sessionId).treeDisclosures[role.personaId];
    return detailed
      ? this.tree.getDetail(sessionId, role.personaId, disclosure)
      : this.tree.getOverview(sessionId, role.personaId, disclosure);
  }

  updateTreeDisclosure(sessionId: string, token: string, disclosure: TreeDisclosure) {
    const role = this.authorize(sessionId, token);
    this.demo.setTreeDisclosure(sessionId, role.personaId, disclosure);
    return { disclosure };
  }

  async processFixtureVoice(
    sessionId: string,
    token: string,
    input: { audioBase64: string; contentType: string; fixtureTranscript: string },
  ) {
    const role = this.authorize(sessionId, token);
    const parseResult = this.demo.setSourceText(
      sessionId,
      role.personaId,
      input.fixtureTranscript,
    );
    const service = new VoiceTurnService({
      mode: "fixture",
      providers: {
        speechToText: new FixtureSpeechToTextProvider(input.fixtureTranscript),
        languageModel: new FixtureLanguageModelProvider(
          parseResult,
          "主人，我已经把你的表达整理成资源与心愿，请确认后我就去搭桥。",
        ),
        textToSpeech: new FixtureTextToSpeechProvider(),
      },
    });
    const turn = await service.process({
      sessionId,
      personaId: role.personaId,
      audio: {
        bytes: Buffer.from(input.audioBase64, "base64"),
        contentType: input.contentType,
      },
    });
    this.voiceTurns.push(turn);
    return turn;
  }

  listVoiceTurns(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    return this.voiceTurns.filter(
      (turn) => turn.sessionId === sessionId && turn.personaId === role.personaId,
    );
  }

  processPetText(sessionId: string, token: string, input: PetTextTurnInput): PetTextTurn {
    const role = this.authorize(sessionId, token);
    let assistantText: string;
    let relatedMatchId: string | null = null;
    let suggestedActions: string[] = [];

    if (input.intent === "organize") {
      const parsed = this.demo.setSourceText(sessionId, role.personaId, input.message);
      const offers = parsed.nodes.filter((node) => node.direction === "offer").length;
      const needs = parsed.nodes.filter((node) => node.direction === "need").length;
      assistantText = `我已根据当前演示档案整理出 ${offers} 项拥有和 ${needs} 项需要。请先确认节点，再发布心愿。`;
      suggestedActions = ["确认资源与心愿", "发布心愿"];
    } else if (input.intent === "explain_match") {
      const session = this.demo.getSession(sessionId);
      const matchId = input.matchId ?? session.selectedMatchId ?? session.matches[0]?.proof.matchId;
      if (!matchId) {
        throw new ApplicationError("there is no match to explain", 409, "match_not_ready");
      }
      const match = this.getMatch(sessionId, token, matchId);
      relatedMatchId = matchId;
      assistantText = `${match.valueToYou[0]}；同时，${match.valueToOther[0]}。当前还需要确认：${match.proof.unknowns.join("、")}。`;
      suggestedActions = ["查看匹配依据", "回应连接"];
    } else {
      const dashboard = this.getDashboard(sessionId, token);
      const action = dashboard.pendingActions[0];
      assistantText = action
        ? `${action.title}：${action.description}`
        : dashboard.pet.message;
      suggestedActions = action?.actionLabel ? [action.actionLabel] : [];
      relatedMatchId = dashboard.recommendations.items[0]?.matchId ?? null;
    }

    const turn = PetTextTurnSchema.parse({
      turnId: randomUUID(),
      sessionId,
      personaId: role.personaId,
      userText: input.message,
      assistantText,
      intent: input.intent,
      relatedMatchId,
      suggestedActions,
      mode: "fixture",
      createdAt: new Date().toISOString(),
      isSynthetic: true,
    });
    this.petTextTurns.push(turn);
    return turn;
  }

  listPetTextTurns(sessionId: string, token: string): PetTextTurn[] {
    const role = this.authorize(sessionId, token);
    return this.petTextTurns.filter(
      (turn) => turn.sessionId === sessionId && turn.personaId === role.personaId,
    );
  }

  getConnectionDisclosure(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const connection = getSelectedConnection(session);
    const consent = connection?.consent;
    if (!consent || !consent.partyIds.includes(role.personaId)) {
      throw new ApplicationError("connection not found for this role", 404, "not_found");
    }
    return projectConnectionDisclosure(session, connection, role.personaId);
  }

  getInbox(sessionId: string, token: string) {
    const role = this.authorize(sessionId, token);
    const overview = this.getDashboard(sessionId, token);
    return {
      personaId: role.personaId,
      unreadCount: overview.pendingActions.length,
      items: overview.pendingActions.map((action) => ({
        id: action.id,
        title: action.title,
        summary: action.description,
        actionLabel: action.actionLabel,
        targetId: action.targetId ?? null,
      })),
      isSynthetic: true as const,
    };
  }

  listConversations(sessionId: string, token: string): ConversationSummary[] {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const connection = getSelectedConnection(session);
    if (!connection || connection.consent.state !== "mutual_accepted") return [];
    if (!connection.consent.partyIds.includes(role.personaId)) {
      throw new ApplicationError("conversation is not available for this role", 403, "forbidden");
    }
    const matchId = session.selectedMatchId!;
    const counterpartId = connection.consent.partyIds.find((id) => id !== role.personaId)!;
    const counterpart = session.profiles.find((profile) => profile.personaId === counterpartId)!;
    const messages = this.messagesFor(sessionId, matchId);
    return [{
      conversationId: matchId,
      matchId,
      counterpartId,
      counterpartDisplayName: counterpart.displayName,
      lastMessage: messages.at(-1)?.text ?? null,
      messageCount: messages.length,
      updatedAt: messages.at(-1)?.createdAt ?? session.updatedAt,
      isSynthetic: true,
    }];
  }

  listConversationMessages(sessionId: string, token: string, conversationId: string): ConversationMessage[] {
    this.requireConversation(sessionId, token, conversationId);
    return structuredClone(this.messagesFor(sessionId, conversationId));
  }

  sendConversationMessage(
    sessionId: string,
    token: string,
    conversationId: string,
    text: string,
  ): ConversationMessage {
    const { role, session } = this.requireConversation(sessionId, token, conversationId);
    const sender = session.profiles.find((profile) => profile.personaId === role.personaId)!;
    const message: ConversationMessage = {
      messageId: randomUUID(),
      conversationId,
      sessionId,
      senderPersonaId: role.personaId,
      senderDisplayName: sender.displayName,
      text,
      createdAt: new Date().toISOString(),
      isSynthetic: true,
    };
    this.conversationMessages.push(message);
    return structuredClone(message);
  }

  private authorize(sessionId: string, token: string): Role {
    if (!token) throw new ApplicationError("missing demo role token", 401, "unauthorized");
    const role = this.rolesByToken.get(token);
    if (!role) throw new ApplicationError("invalid demo role token", 401, "unauthorized");
    if (role.sessionId !== sessionId) {
      throw new ApplicationError("demo role token belongs to another session", 403, "forbidden");
    }
    return role;
  }

  private requireConversation(sessionId: string, token: string, conversationId: string) {
    const role = this.authorize(sessionId, token);
    const session = this.demo.getSession(sessionId);
    const connection = session.connections[conversationId];
    if (!connection || connection.consent.state !== "mutual_accepted") {
      throw new ApplicationError("mutual consent is required before messaging", 409, "conversation_not_ready");
    }
    if (!connection.consent.partyIds.includes(role.personaId)) {
      throw new ApplicationError("conversation is not available for this role", 403, "forbidden");
    }
    return { role, session };
  }

  private messagesFor(sessionId: string, conversationId: string): ConversationMessage[] {
    return this.conversationMessages.filter(
      (message) => message.sessionId === sessionId && message.conversationId === conversationId,
    );
  }

  private removeSessionTurns<T extends { sessionId: string }>(turns: T[], sessionId: string): void {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index].sessionId === sessionId) turns.splice(index, 1);
    }
  }

  private notFound(error: unknown): ApplicationError {
    return new ApplicationError(
      error instanceof Error ? error.message : "resource not found",
      404,
      "not_found",
    );
  }
}
