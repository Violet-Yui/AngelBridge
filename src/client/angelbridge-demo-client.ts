import type {
  UpdateIntentInput,
  UpdateValueNodeInput,
} from "../application/contracts";
import type { DemoBootstrap } from "../application/app-service";
import type { Intent, ParseResult } from "../domain/contracts";
import type { LifeTreeOverview } from "../product/life-tree-contracts";
import type { MatchCardView, MatchDetailView } from "../product/match-view-models";
import { AngelBridgeClient } from "./angelbridge-client";
import {
  DemoSessionStore,
  type DemoRoleKind,
  type DemoSessionState,
} from "./demo-session";

export type PublishIntentDraft = {
  intent: UpdateIntentInput;
  nodeUpdates?: Array<{
    nodeId: string;
    value: UpdateValueNodeInput;
  }>;
};

export class AngelBridgeDemoClient {
  constructor(
    private readonly transport: AngelBridgeClient,
    private readonly session: DemoSessionStore,
  ) {}

  async startDemo(
    scenarioId = "studio-photography",
  ): Promise<DemoBootstrap> {
    const bootstrap = await this.transport.createDemoSession(scenarioId);
    this.session.initialize(bootstrap);
    return bootstrap;
  }

  getDashboard(): Promise<LifeTreeOverview> {
    const state = this.session.get();
    return this.currentClient().getDashboard(state.sessionId);
  }

  organizeWish(text: string): Promise<ParseResult> {
    const state = this.session.get();
    return this.viewerClient().parse(state.sessionId, text);
  }

  async publishIntent(draft: PublishIntentDraft): Promise<Intent> {
    const state = this.session.get();
    const client = this.viewerClient();
    for (const update of draft.nodeUpdates ?? []) {
      await client.updateNode(state.sessionId, update.nodeId, update.value);
    }
    const nodeIds = [...new Set([
      ...draft.intent.offerNodeIds,
      ...draft.intent.needNodeIds,
      ...draft.intent.goalNodeIds,
    ])];
    await client.confirmNodes(state.sessionId, nodeIds);
    await client.updateIntent(state.sessionId, draft.intent);
    return client.activateIntent(state.sessionId);
  }

  runMatching(): Promise<MatchCardView[]> {
    const state = this.session.get();
    return this.viewerClient().runMatching(state.sessionId, "fixture_ai");
  }

  getMatches(): Promise<MatchCardView[]> {
    const state = this.session.get();
    return this.currentClient().listMatches(state.sessionId);
  }

  async getMatchDetail(matchId: string): Promise<MatchDetailView> {
    const state = this.session.get();
    const detail = await this.currentClient().getMatch(state.sessionId, matchId);
    if (this.session.getCurrentRole() === "viewer") {
      this.session.selectMatch(detail.matchId, detail.counterpartId);
    }
    return detail;
  }

  async resetDemo(): Promise<DemoBootstrap> {
    const state = this.session.get();
    const bootstrap = await this.viewerClient().resetSession(state.sessionId);
    this.session.initialize(bootstrap);
    return bootstrap;
  }

  setRole(role: DemoRoleKind): DemoSessionState {
    return this.session.setRole(role);
  }

  getCurrentRole(): DemoRoleKind {
    return this.session.getCurrentRole();
  }

  getSessionState(): DemoSessionState {
    return this.session.get();
  }

  private currentClient(): AngelBridgeClient {
    return this.transport.withToken(this.session.getActiveRole().token);
  }

  private viewerClient(): AngelBridgeClient {
    return this.transport.withToken(this.session.getViewerRole().token);
  }
}
