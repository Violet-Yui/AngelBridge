import type {
  UpdateIntentInput,
  UpdatePactInput,
  UpdateValueNodeInput,
} from "../application/contracts";
import type { DemoBootstrap } from "../application/app-service";
import type { MatchCardView, MatchDetailView } from "../product/match-view-models";
import type { LifeTreeDetail, LifeTreeOverview } from "../product/life-tree-contracts";
import type {
  BridgePact,
  Intent,
  ParseResult,
  ValueNode,
} from "../domain/contracts";
import type { ConsentRecord } from "../domain/workflow";
import type { ConnectionDisclosureView } from "../product/disclosure-view-service";
import type { PetTextTurn, PetTextTurnInput } from "../product/pet-conversation-contracts";
import type { ConversationMessage, ConversationSummary } from "../product/conversation-contracts";

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { code?: string; message?: string } };

export class AngelBridgeClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

export class AngelBridgeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  withToken(token: string): AngelBridgeClient {
    return new AngelBridgeClient(this.baseUrl, token, this.fetcher);
  }

  createDemoSession(scenarioId: string): Promise<DemoBootstrap> {
    return this.request("/api/demo/sessions", "POST", { scenarioId });
  }

  resetSession(sessionId: string): Promise<DemoBootstrap> {
    return this.request(this.sessionPath(sessionId, "reset"), "POST");
  }

  getDashboard(sessionId: string): Promise<LifeTreeOverview> {
    return this.request(this.sessionPath(sessionId, "dashboard"));
  }

  parse(sessionId: string, text: string): Promise<ParseResult> {
    return this.request(this.sessionPath(sessionId, "parse"), "POST", { text });
  }

  updateNode(
    sessionId: string,
    nodeId: string,
    input: UpdateValueNodeInput,
  ): Promise<ValueNode> {
    return this.request(
      this.sessionPath(sessionId, `nodes/${encodeURIComponent(nodeId)}`),
      "PATCH",
      input,
    );
  }

  confirmNodes(sessionId: string, nodeIds: string[]): Promise<{ nodeIds: string[]; confirmed: true }> {
    return this.request(this.sessionPath(sessionId, "nodes/confirm"), "POST", { nodeIds });
  }

  updateIntent(sessionId: string, input: UpdateIntentInput): Promise<Intent> {
    return this.request(this.sessionPath(sessionId, "intent"), "PUT", input);
  }

  activateIntent(sessionId: string): Promise<Intent> {
    return this.request(this.sessionPath(sessionId, "intent/activate"), "POST");
  }

  runMatching(sessionId: string, mode: "rule" | "fixture_ai" = "fixture_ai"): Promise<MatchCardView[]> {
    return this.request(this.sessionPath(sessionId, "matches/run"), "POST", { mode });
  }

  listMatches(sessionId: string): Promise<MatchCardView[]> {
    return this.request(this.sessionPath(sessionId, "matches"));
  }

  getMatch(sessionId: string, matchId: string): Promise<MatchDetailView> {
    return this.request(this.sessionPath(sessionId, `matches/${encodeURIComponent(matchId)}`));
  }

  submitConsent(sessionId: string, matchId: string, decision: "accepted" | "rejected"): Promise<ConsentRecord> {
    return this.request(
      this.sessionPath(sessionId, `matches/${encodeURIComponent(matchId)}/consent`),
      "POST",
      { decision },
    );
  }

  getPact(sessionId: string): Promise<BridgePact> {
    return this.request(this.sessionPath(sessionId, "pact"));
  }

  updatePact(sessionId: string, input: UpdatePactInput): Promise<BridgePact> {
    return this.request(this.sessionPath(sessionId, "pact"), "PATCH", input);
  }

  confirmPact(sessionId: string): Promise<BridgePact> {
    return this.request(this.sessionPath(sessionId, "pact/confirm"), "POST");
  }

  finishPact(sessionId: string, outcome: "completed" | "exited"): Promise<BridgePact> {
    return this.request(this.sessionPath(sessionId, "pact/finish"), "POST", { outcome });
  }

  getTree(sessionId: string, detailed = false): Promise<LifeTreeOverview | LifeTreeDetail> {
    return this.request(this.sessionPath(sessionId, `tree${detailed ? "?view=detail" : ""}`));
  }

  getConnection(sessionId: string): Promise<ConnectionDisclosureView> {
    return this.request(this.sessionPath(sessionId, "connection"));
  }

  sendPetText(sessionId: string, input: PetTextTurnInput): Promise<PetTextTurn> {
    return this.request(this.sessionPath(sessionId, "pet/turn"), "POST", input);
  }

  listPetTextTurns(sessionId: string): Promise<PetTextTurn[]> {
    return this.request(this.sessionPath(sessionId, "pet/turns"));
  }

  listConversations(sessionId: string): Promise<ConversationSummary[]> {
    return this.request(this.sessionPath(sessionId, "conversations"));
  }

  listConversationMessages(sessionId: string, conversationId: string): Promise<ConversationMessage[]> {
    return this.request(this.sessionPath(sessionId, `conversations/${encodeURIComponent(conversationId)}/messages`));
  }

  sendConversationMessage(sessionId: string, conversationId: string, text: string): Promise<ConversationMessage> {
    return this.request(
      this.sessionPath(sessionId, `conversations/${encodeURIComponent(conversationId)}/messages`),
      "POST",
      { text },
    );
  }

  private sessionPath(sessionId: string, resource: string): string {
    return `/api/sessions/${encodeURIComponent(sessionId)}/${resource}`;
  }

  private async request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers: {
        ...(this.token ? { "x-demo-role-token": this.token } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json() as ApiEnvelope<T> & ApiErrorEnvelope;
    if (!response.ok) {
      throw new AngelBridgeClientError(
        payload.error?.message ?? `request failed with status ${response.status}`,
        response.status,
        payload.error?.code ?? "request_failed",
      );
    }
    return payload.data;
  }
}
