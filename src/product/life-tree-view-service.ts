import type { DemoSession, DemoStage } from "../demo/session-service";
import { getSelectedConnection, InMemoryDemoService } from "../demo/session-service";
import type { SessionMatch } from "../demo/session-service";
import {
  LifeTreeDetailSchema,
  LifeTreeOverviewSchema,
  type GrowthSummary,
  type LifeTreeDetail,
  type LifeTreeOverview,
  type PendingAction,
  type PetState,
  type RecommendationItem,
  type TreeDisclosure,
} from "./life-tree-contracts";

const growthByStage: Record<
  DemoStage,
  Pick<GrowthSummary, "score" | "stageLabel" | "nextMilestone">
> = {
  created: { score: 100, stageLabel: "整理资源", nextMilestone: "发布一个心愿" },
  intent_active: { score: 250, stageLabel: "心愿已发布", nextMilestone: "发现双向机会" },
  no_matches: { score: 250, stageLabel: "继续完善", nextMilestone: "补充条件后重新寻找" },
  matches_ready: { score: 450, stageLabel: "发现机会", nextMilestone: "回应一个连接" },
  waiting_other: { score: 550, stageLabel: "等待回应", nextMilestone: "达成双向意愿" },
  rejected: { score: 400, stageLabel: "继续寻找", nextMilestone: "发现新的机会" },
  pact_draft: { score: 650, stageLabel: "确认桥约", nextMilestone: "开始价值置换" },
  pact_active: { score: 800, stageLabel: "桥约进行中", nextMilestone: "完成本次置换" },
  completed: { score: 1000, stageLabel: "连接已达成", nextMilestone: null },
  exited: { score: 700, stageLabel: "桥约已结束", nextMilestone: "开启新的连接" },
};

const growthFor = (stage: DemoStage): GrowthSummary => ({
  ...growthByStage[stage],
  rulesetVersion: "demo-v1",
  isSynthetic: true,
});

const petFor = (stage: DemoStage, matchCount: number): PetState => {
  switch (stage) {
    case "created":
      return {
        mood: "encouraging",
        message: "主人，先选一个最想实现的心愿，我来帮你寻找双向机会。",
        suggestedAction: "发布心愿",
      };
    case "intent_active":
      return {
        mood: "thinking",
        message: "你的心愿已经出发，我正在寻找彼此都能受益的连接。",
        suggestedAction: "开始匹配",
      };
    case "no_matches":
      return {
        mood: "encouraging",
        message: "暂时没有满足双向条件的机会，可以调整心愿或重新开始演示。",
        suggestedAction: "调整心愿",
      };
    case "matches_ready":
      return {
        mood: "encouraging",
        message: `我找到了 ${matchCount} 个双向机会，先看看为什么适合你。`,
        suggestedAction: "查看机会",
      };
    case "waiting_other":
      return {
        mood: "idle",
        message: "你的意愿已经送达，等对方回应后我会继续搭桥。",
        suggestedAction: null,
      };
    case "rejected":
      return {
        mood: "encouraging",
        message: "这次没有达成双向意愿，我们继续寻找更合适的连接。",
        suggestedAction: "继续发现",
      };
    case "pact_draft":
      return {
        mood: "encouraging",
        message: "双方都愿意连接，确认桥约后就可以开始行动。",
        suggestedAction: "确认桥约",
      };
    case "pact_active":
      return {
        mood: "thinking",
        message: "桥约正在进行，完成承诺会让你的人生树留下新的成长记录。",
        suggestedAction: "完成桥约",
      };
    case "completed":
      return {
        mood: "celebrating",
        message: "一次价值置换已经完成，你们共同长出了一片新叶。",
        suggestedAction: null,
      };
    case "exited":
      return {
        mood: "idle",
        message: "这次桥约已经结束，保留经验，再寻找下一次合适的连接。",
        suggestedAction: "继续发现",
      };
  }
};

const recommendationFor = (
  session: DemoSession,
  match: SessionMatch,
  personaId: string,
): RecommendationItem => {
  const isViewer = match.proof.viewerId === personaId;
  const counterpartId = isViewer
    ? match.proof.candidateId
    : match.proof.viewerId;
  const counterpart = session.profiles.find(
    (profile) => profile.personaId === counterpartId,
  );
  if (!counterpart) {
    throw new Error(`match counterpart does not belong to session: ${counterpartId}`);
  }

  return {
    matchId: match.proof.matchId,
    candidateId: counterpartId,
    candidateDisplayName: counterpart.displayName,
    valueToYou: isViewer
      ? match.proof.valueToViewer
      : match.proof.valueToCandidate,
    valueToOther: isViewer
      ? match.proof.valueToCandidate
      : match.proof.valueToViewer,
    bridgeIndex: match.internalScore,
    scoreBasis:
      "assessment" in match
        ? [
            "AI 双向语义关系",
            "交付可行性",
            "软约束适配",
            "资料证据完整度",
            "资源更新时间",
          ]
        : ["双向供需互补度", "资料证据完整度", "资源更新时间"],
    proof: match.proof,
    ...("assessment" in match
      ? {
          assessment: match.assessment,
          scoreBreakdown: match.scoreBreakdown,
        }
      : {}),
    isSynthetic: true,
  };
};

const pendingActionsFor = (
  session: DemoSession,
  stage: DemoStage,
  personaId: string,
): PendingAction[] => {
  const connection = getSelectedConnection(session);
  const matchId = session.selectedMatchId ?? session.matches[0]?.proof.matchId;
  const pactId = connection?.pact?.pactId;

  if (stage === "created") {
    return [{
      id: `activate-intent:${personaId}`,
      kind: "activate_intent",
      title: "发布一个心愿",
      description: "选择本次想要置换的资源与需求，开始寻找双向机会。",
      actionLabel: "去发布",
    }];
  }
  if (stage === "intent_active") {
    return [{
      id: `start-matching:${personaId}`,
      kind: "start_matching",
      title: "寻找双向机会",
      description: "基于已确认的资源和心愿开始匹配。",
      actionLabel: "开始匹配",
    }];
  }
  if (stage === "no_matches") {
    return [];
  }
  if (stage === "matches_ready") {
    return [{
      id: `review-match:${personaId}`,
      kind: "review_match",
      title: "查看匹配理由",
      description: "先了解双方如何互相创造价值，再决定是否连接。",
      actionLabel: "查看机会",
      targetId: matchId,
    }];
  }
  if (stage === "waiting_other") {
    const decision = connection?.consent.decisions[personaId];
    return decision === "accepted"
      ? [{
          id: `wait-for-other:${personaId}`,
          kind: "wait_for_other",
          title: "等待对方回应",
          description: "你的连接意愿已经提交，对方同意后才能建立桥约。",
          actionLabel: null,
          targetId: matchId,
        }]
      : [{
          id: `review-match:${personaId}`,
          kind: "review_match",
          title: "回应连接邀请",
          description: "查看匹配证明，并决定是否愿意进一步连接。",
          actionLabel: "立即回应",
          targetId: matchId,
        }];
  }
  if (stage === "pact_draft") {
    const confirmed = connection?.pact?.confirmations[personaId] === true;
    return confirmed
      ? [{
          id: `wait-pact:${personaId}`,
          kind: "wait_for_other",
          title: "等待对方确认桥约",
          description: "你已经确认承诺，对方确认后桥约正式开始。",
          actionLabel: null,
          targetId: pactId,
        }]
      : [{
          id: `confirm-pact:${personaId}`,
          kind: "confirm_pact",
          title: "确认桥约",
          description: "核对双方承诺与置换方式后确认开始。",
          actionLabel: "确认桥约",
          targetId: pactId,
        }];
  }
  if (stage === "pact_active") {
    return [{
      id: `finish-pact:${personaId}`,
      kind: "finish_pact",
      title: "完成本次桥约",
      description: "双方履约后记录结果，让价值置换沉淀为成长。",
      actionLabel: "记录结果",
      targetId: pactId,
    }];
  }
  return [];
};

export class LifeTreeViewService {
  constructor(
    private readonly demo: InMemoryDemoService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  getOverview(
    sessionId: string,
    personaId: string,
    disclosure: TreeDisclosure = "summary",
  ): LifeTreeOverview {
    const session = this.demo.getSession(sessionId);
    const profile = session.profiles.find((item) => item.personaId === personaId);
    if (!profile) {
      throw new Error(`persona does not belong to session: ${personaId}`);
    }
    const stage = this.demo.getStage(sessionId);
    const tree = this.demo.getTree(sessionId, personaId);
    const recommendationItems = session.matches
      .slice(0, 3)
      .map((match) => recommendationFor(session, match, personaId));

    return LifeTreeOverviewSchema.parse({
      sessionId,
      personaId,
      displayName: profile.displayName,
      disclosure,
      stage,
      counts: {
        offers: tree.offers.length,
        needs: tree.needs.length,
        goals: tree.goals.length,
        opportunities: session.matches.length,
        outcomes: tree.outcomes.length,
      },
      growth: growthFor(stage),
      recommendations: {
        total: session.matches.length,
        items: recommendationItems,
      },
      pendingActions: pendingActionsFor(session, stage, personaId),
      pet: petFor(stage, session.matches.length),
      generatedAt: this.now().toISOString(),
      isSynthetic: true,
    });
  }

  getDetail(
    sessionId: string,
    personaId: string,
    disclosure: TreeDisclosure = "summary",
  ): LifeTreeDetail {
    const tree = this.demo.getTree(sessionId, personaId);
    return LifeTreeDetailSchema.parse({
      overview: this.getOverview(sessionId, personaId, disclosure),
      offers: tree.offers,
      needs: tree.needs,
      goals: tree.goals,
      outcomes: tree.outcomes,
    });
  }
}
