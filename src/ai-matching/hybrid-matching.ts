import type {
  MatchProof,
  MatchingProfile,
  ValueNode,
} from "../domain/contracts";
import {
  getHardGateReasons,
  type RejectedMatch,
  type RankedMatch,
} from "../domain/matching";
import {
  AiMatchAssessmentSchema,
  HybridScoreBreakdownSchema,
  type AiMatchAssessment,
  type DirectionScoreBreakdown,
  type DirectionalMatchAssessment,
  type HybridScoreBreakdown,
} from "./contracts";
import type { AiMatchAssessmentProvider } from "./provider";

export type HybridRankedMatch = RankedMatch & {
  assessment: AiMatchAssessment;
  scoreBreakdown: HybridScoreBreakdown;
};

export type HybridMatchEvaluation =
  | { eligible: true; result: HybridRankedMatch }
  | { eligible: false; rejection: RejectedMatch };

const semanticValues = {
  exact: 1,
  strong: 0.85,
  partial: 0.65,
  weak: 0.35,
  none: 0,
} as const;

const deliverabilityValues = {
  clear: 1,
  partial: 0.75,
  unclear: 0.4,
} as const;

const softConstraintFitValues = {
  none: 1,
  needs_clarification: 0.75,
  high: 0.35,
} as const;

const confidenceValues = {
  high: 1,
  medium: 0.7,
  low: 0.4,
} as const;

const round = (value: number, digits = 4): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const intersection = (left: string[], right: string[]): string[] => {
  const rightValues = new Set(right.map((value) => value.trim().toLowerCase()));
  return left.filter((value) => rightValues.has(value.trim().toLowerCase()));
};

const directionScore = (
  assessment: DirectionalMatchAssessment,
): DirectionScoreBreakdown => {
  const semanticRelation = semanticValues[assessment.semanticRelation];
  const deliverability = deliverabilityValues[assessment.deliverability];
  const softConstraintFit =
    softConstraintFitValues[assessment.softConstraintRisk];
  return {
    semanticRelation,
    deliverability,
    softConstraintFit,
    score: round(
      0.55 * semanticRelation +
        0.3 * deliverability +
        0.15 * softConstraintFit,
    ),
  };
};

const freshness = (nodes: ValueNode[], now: Date): number => {
  const averageTimestamp =
    nodes.reduce((sum, node) => sum + Date.parse(node.updatedAt), 0) /
    nodes.length;
  const ageInDays = Math.max(0, now.getTime() - averageTimestamp) / 86_400_000;
  return 1 / (1 + ageInDays / 30);
};

const requireNode = (
  profile: MatchingProfile,
  nodeId: string,
  direction: "need" | "offer",
): ValueNode => {
  const node = profile.nodes.find((item) => item.id === nodeId);
  if (!node) {
    throw new Error(
      `AI assessment references a node outside ${profile.personaId}: ${nodeId}`,
    );
  }
  if (node.direction !== direction) {
    throw new Error(
      `AI assessment references ${nodeId} as ${direction}, actual direction is ${node.direction}`,
    );
  }
  if (node.visibility === "private") {
    throw new Error(`AI assessment references a private node: ${nodeId}`);
  }
  return node;
};

const validateDirection = (
  direction: DirectionalMatchAssessment,
  needOwner: MatchingProfile,
  offerOwner: MatchingProfile,
): [ValueNode, ValueNode] => {
  const need = requireNode(needOwner, direction.needNodeId, "need");
  const offer = requireNode(offerOwner, direction.offerNodeId, "offer");
  const allowedEvidence = new Set([
    ...needOwner.nodes.map((node) => node.id),
    ...offerOwner.nodes.map((node) => node.id),
  ]);
  for (const nodeId of direction.evidenceNodeIds) {
    if (!allowedEvidence.has(nodeId)) {
      throw new Error(`AI assessment contains unknown evidence node: ${nodeId}`);
    }
  }
  if (
    !direction.evidenceNodeIds.includes(need.id) ||
    !direction.evidenceNodeIds.includes(offer.id)
  ) {
    throw new Error("AI assessment evidence must include its need and offer nodes");
  }
  return [need, offer];
};

const validateAssessment = (
  rawAssessment: AiMatchAssessment,
  viewer: MatchingProfile,
  candidate: MatchingProfile,
): { assessment: AiMatchAssessment; evidenceNodes: ValueNode[] } => {
  const assessment = AiMatchAssessmentSchema.parse(rawAssessment);
  if (
    assessment.viewerId !== viewer.personaId ||
    assessment.candidateId !== candidate.personaId
  ) {
    throw new Error("AI assessment parties do not match the requested profiles");
  }
  const firstDirection = validateDirection(
    assessment.viewerToCandidate,
    viewer,
    candidate,
  );
  const secondDirection = validateDirection(
    assessment.candidateToViewer,
    candidate,
    viewer,
  );
  return {
    assessment,
    evidenceNodes: [...firstDirection, ...secondDirection],
  };
};

export const scoreHybridAssessment = (
  assessment: AiMatchAssessment,
  evidenceNodes: ValueNode[],
  now: Date,
): HybridScoreBreakdown => {
  const viewerToCandidate = directionScore(assessment.viewerToCandidate);
  const candidateToViewer = directionScore(assessment.candidateToViewer);
  const bilateralValue = Math.sqrt(
    viewerToCandidate.score * candidateToViewer.score,
  );
  const evidenceCompleteness =
    evidenceNodes.reduce((sum, node) => sum + node.evidenceCompleteness, 0) /
    evidenceNodes.length;
  const aiConfidence = confidenceValues[assessment.confidence];
  const resourceFreshness = freshness(evidenceNodes, now);
  const overallConfidence =
    0.5 * evidenceCompleteness +
    0.3 * aiConfidence +
    0.2 * resourceFreshness;
  const bridgeIndex =
    100 * bilateralValue * (0.75 + 0.25 * overallConfidence);

  return HybridScoreBreakdownSchema.parse({
    viewerToCandidate,
    candidateToViewer,
    bilateralValue: round(bilateralValue),
    evidenceCompleteness: round(evidenceCompleteness),
    aiConfidence,
    freshness: round(resourceFreshness),
    overallConfidence: round(overallConfidence),
    bridgeIndex: round(bridgeIndex, 2),
    algorithmVersion: "hybrid-v0.2",
  });
};

const matchProofFor = (
  viewer: MatchingProfile,
  candidate: MatchingProfile,
  assessment: AiMatchAssessment,
  evidenceNodes: ValueNode[],
): MatchProof => {
  const sharedModes = intersection(
    viewer.acceptedExchangeModes,
    candidate.acceptedExchangeModes,
  );
  const sharedLocations = intersection(
    viewer.constraints.locations,
    candidate.constraints.locations,
  );
  const sharedAvailability = intersection(
    viewer.constraints.availability,
    candidate.constraints.availability,
  );
  const directions = [
    assessment.viewerToCandidate,
    assessment.candidateToViewer,
  ];
  const uniqueEvidenceNodes = [...new Map(
    evidenceNodes.map((node) => [node.id, node]),
  ).values()];

  return {
    matchId: `match:${viewer.personaId}:${candidate.personaId}`,
    viewerId: viewer.personaId,
    candidateId: candidate.personaId,
    status: "candidate",
    valueToViewer: [assessment.viewerToCandidate.reason],
    valueToCandidate: [assessment.candidateToViewer.reason],
    satisfiedConstraints: [
      `价值置换方式：${sharedModes.join("、")}`,
      ...(sharedLocations.length > 0
        ? [`地点：${sharedLocations.join("、")}`]
        : []),
      ...(sharedAvailability.length > 0
        ? [`时间：${sharedAvailability.join("、")}`]
        : []),
    ],
    conflicts: directions
      .filter((direction) => direction.softConstraintRisk === "high")
      .map((direction) => direction.reason),
    unknowns: [...new Set(directions.flatMap((direction) => direction.unknowns))],
    evidence: uniqueEvidenceNodes.map((node) => ({
      nodeId: node.id,
      summary: node.title,
    })),
    generatedAt: assessment.generatedAt,
    isSynthetic: true,
    datasetVersion: assessment.datasetVersion,
  };
};

export const evaluateHybridMatch = async (
  viewer: MatchingProfile,
  candidate: MatchingProfile,
  provider: AiMatchAssessmentProvider,
  now: Date,
): Promise<HybridMatchEvaluation> => {
  const hardGateReasons = getHardGateReasons(viewer, candidate);
  if (hardGateReasons.length > 0) {
    return {
      eligible: false,
      rejection: { candidateId: candidate.personaId, reasons: hardGateReasons },
    };
  }

  const validated = validateAssessment(
    await provider.assess({
      viewer: structuredClone(viewer),
      candidate: structuredClone(candidate),
    }),
    viewer,
    candidate,
  );
  if (
    validated.assessment.viewerToCandidate.semanticRelation === "none" ||
    validated.assessment.candidateToViewer.semanticRelation === "none"
  ) {
    return {
      eligible: false,
      rejection: {
        candidateId: candidate.personaId,
        reasons: ["AI 语义评估未形成双向价值连接"],
      },
    };
  }

  const scoreBreakdown = scoreHybridAssessment(
    validated.assessment,
    validated.evidenceNodes,
    now,
  );
  return {
    eligible: true,
    result: {
      candidateId: candidate.personaId,
      internalScore: scoreBreakdown.bridgeIndex,
      proof: matchProofFor(
        viewer,
        candidate,
        validated.assessment,
        validated.evidenceNodes,
      ),
      assessment: validated.assessment,
      scoreBreakdown,
    },
  };
};

export const rankCandidatesWithAi = async (
  viewer: MatchingProfile,
  candidates: MatchingProfile[],
  provider: AiMatchAssessmentProvider,
  now: Date,
): Promise<HybridRankedMatch[]> => {
  const evaluations = await Promise.all(
    candidates.map((candidate) =>
      evaluateHybridMatch(viewer, candidate, provider, now),
    ),
  );
  return evaluations
    .flatMap((evaluation) =>
      evaluation.eligible ? [evaluation.result] : [],
    )
    .sort(
      (left, right) =>
        right.internalScore - left.internalScore ||
        left.candidateId.localeCompare(right.candidateId),
    );
};
