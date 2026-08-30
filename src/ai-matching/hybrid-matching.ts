import type {
  MatchProof,
  MatchingProfile,
  ValueNode,
} from "../domain/contracts";
import {
  getHardGateReasons,
  MAX_RECOMMENDATIONS,
  type RejectedMatch,
  type RankedMatch,
} from "../domain/matching";
import {
  AiMatchAssessmentSchema,
  HybridScoreBreakdownSchema,
  type AiMatchAssessment,
  type BridgeTier,
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

export const MIN_RECOMMENDED_BRIDGE_INDEX = 60;

const semanticValues = {
  exact: 1,
  strong: 0.84,
  partial: 0.62,
  weak: 0.15,
  none: 0,
} as const;

const deliverabilityValues = {
  clear: 1,
  partial: 0.7,
  unclear: 0.3,
} as const;

const softConstraintFitValues = {
  none: 1,
  needs_clarification: 0.65,
  high: 0.2,
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
      0.6 * semanticRelation +
        0.25 * deliverability +
        0.15 * softConstraintFit,
    ),
  };
};

const bridgeTierFor = (bridgeIndex: number): BridgeTier => {
  if (bridgeIndex >= 88) return "ideal";
  if (bridgeIndex >= 72) return "feasible";
  return "conditional";
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

const requireEvidenceNode = (
  profiles: MatchingProfile[],
  nodeId: string,
): ValueNode => {
  const node = profiles.flatMap((profile) => profile.nodes)
    .find((item) => item.id === nodeId);
  if (!node) throw new Error(`AI assessment contains unknown evidence node: ${nodeId}`);
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
  if (assessment.partyBenefits && assessment.executionFit) {
    const benefitParties = new Set(assessment.partyBenefits.map((item) => item.partyId));
    if (
      !benefitParties.has(viewer.personaId) ||
      !benefitParties.has(candidate.personaId)
    ) {
      throw new Error("AI assessment benefits must cover both parties");
    }
    const evidenceIds = [
      ...assessment.partyBenefits.flatMap((item) => item.evidenceNodeIds),
      ...assessment.executionFit.evidenceNodeIds,
      ...assessment.matchReasons.flatMap((item) => item.evidenceNodeIds),
    ];
    return {
      assessment,
      evidenceNodes: [...new Map(
        evidenceIds.map((nodeId) => {
          const node = requireEvidenceNode([viewer, candidate], nodeId);
          return [node.id, node] as const;
        }),
      ).values()],
    };
  }
  const firstDirection = validateDirection(
    assessment.viewerToCandidate!,
    viewer,
    candidate,
  );
  const secondDirection = validateDirection(
    assessment.candidateToViewer!,
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
  const relationshipBenefits = assessment.partyBenefits;
  const execution = assessment.executionFit;
  const genericScore = (strength: keyof typeof semanticValues): DirectionScoreBreakdown => {
    const semanticRelation = semanticValues[strength];
    const deliverability = deliverabilityValues[execution?.level ?? "partial"];
    const softConstraintFit = assessment.conflicts.length > 0
      ? 0.2
      : (execution?.unknowns.length ?? 0) > 0 ? 0.65 : 1;
    return {
      semanticRelation,
      deliverability,
      softConstraintFit,
      score: round(0.7 * semanticRelation + 0.2 * deliverability + 0.1 * softConstraintFit),
    };
  };
  const viewerToCandidate = relationshipBenefits
    ? genericScore(relationshipBenefits[0].strength)
    : directionScore(assessment.viewerToCandidate!);
  const candidateToViewer = relationshipBenefits
    ? genericScore(relationshipBenefits[1].strength)
    : directionScore(assessment.candidateToViewer!);
  const directionSum = viewerToCandidate.score + candidateToViewer.score;
  const bilateralValue = directionSum === 0
    ? 0
    : (2 * viewerToCandidate.score * candidateToViewer.score) / directionSum;
  const balanceFactor =
    1 - 0.15 * Math.abs(viewerToCandidate.score - candidateToViewer.score);
  const evidenceCompleteness =
    evidenceNodes.reduce((sum, node) => sum + node.evidenceCompleteness, 0) /
    evidenceNodes.length;
  const aiConfidence = confidenceValues[assessment.confidence];
  const resourceFreshness = freshness(evidenceNodes, now);
  const overallConfidence =
    0.45 * evidenceCompleteness +
    0.35 * aiConfidence +
    0.2 * resourceFreshness;
  let bridgeIndex = Math.min(
    96,
    Math.round(
      100 *
        bilateralValue *
        balanceFactor *
        (0.9 + 0.1 * overallConfidence),
    ),
  );
  if (viewerToCandidate.semanticRelation === semanticValues.weak ||
      candidateToViewer.semanticRelation === semanticValues.weak) {
    bridgeIndex = Math.min(71, bridgeIndex);
  }

  return HybridScoreBreakdownSchema.parse({
    viewerToCandidate,
    candidateToViewer,
    bilateralValue: round(bilateralValue),
    balanceFactor: round(balanceFactor),
    evidenceCompleteness: round(evidenceCompleteness),
    aiConfidence,
    freshness: round(resourceFreshness),
    overallConfidence: round(overallConfidence),
    bridgeIndex,
    tier: bridgeTierFor(bridgeIndex),
    algorithmVersion: "semantic-bridge-v0.3",
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
  ].filter((item): item is DirectionalMatchAssessment => Boolean(item));
  const uniqueEvidenceNodes = [...new Map(
    evidenceNodes.map((node) => [node.id, node]),
  ).values()];

  return {
    matchId: `match:${viewer.personaId}:${candidate.personaId}`,
    viewerId: viewer.personaId,
    candidateId: candidate.personaId,
    status: "candidate",
    valueToViewer: assessment.partyBenefits
      ? [assessment.partyBenefits.find((item) => item.partyId === viewer.personaId)!.reason]
      : [assessment.viewerToCandidate!.reason],
    valueToCandidate: assessment.partyBenefits
      ? [assessment.partyBenefits.find((item) => item.partyId === candidate.personaId)!.reason]
      : [assessment.candidateToViewer!.reason],
    matchReasons: assessment.matchReasons.length > 0
      ? assessment.matchReasons
      : [
          {
            type: "value_to_you",
            text: assessment.viewerToCandidate!.reason,
            evidenceNodeIds: assessment.viewerToCandidate!.evidenceNodeIds,
          },
          {
            type: "value_to_other",
            text: assessment.candidateToViewer!.reason,
            evidenceNodeIds: assessment.candidateToViewer!.evidenceNodeIds,
          },
        ],
    satisfiedConstraints: [
      `价值置换方式：${sharedModes.join("、")}`,
      ...(sharedLocations.length > 0
        ? [`地点：${sharedLocations.join("、")}`]
        : []),
      ...(sharedAvailability.length > 0
        ? [`时间：${sharedAvailability.join("、")}`]
        : []),
    ],
    conflicts: assessment.conflicts.length > 0
      ? assessment.conflicts
      : directions
        .filter((direction) => direction.softConstraintRisk === "high")
        .map((direction) => direction.reason),
    unknowns: [...new Set([
      ...directions.flatMap((direction) => direction.unknowns),
      ...(assessment.partyBenefits?.flatMap((item) => item.unknowns) ?? []),
      ...(assessment.executionFit?.unknowns ?? []),
    ])],
    evidence: uniqueEvidenceNodes.map((node) => ({
      nodeId: node.id,
      summary: node.title,
    })),
    generatedAt: assessment.generatedAt,
    isSynthetic: evidenceNodes.every((node) => node.isSynthetic),
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
  const isFixture = [...viewer.nodes, ...candidate.nodes].every((node) => node.isSynthetic);
  if (isFixture) {
    if (
      viewer.constraints.locations.length > 0 &&
      candidate.constraints.locations.length > 0 &&
      intersection(viewer.constraints.locations, candidate.constraints.locations).length === 0
    ) hardGateReasons.push("地点约束不一致");
    if (
      viewer.constraints.availability.length > 0 &&
      candidate.constraints.availability.length > 0 &&
      intersection(viewer.constraints.availability, candidate.constraints.availability).length === 0
    ) hardGateReasons.push("可用时间不一致");
  }
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
  const strengths = validated.assessment.partyBenefits
    ?.map((item) => item.strength) ?? [
      validated.assessment.viewerToCandidate!.semanticRelation,
      validated.assessment.candidateToViewer!.semanticRelation,
    ];
  if (
    strengths.includes("none") ||
    strengths.every((strength) => strength === "weak") ||
    validated.assessment.conflicts.length > 0
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
  limit = MAX_RECOMMENDATIONS,
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
    .filter((match) => match.internalScore >= MIN_RECOMMENDED_BRIDGE_INDEX)
    .sort(
      (left, right) => {
        const scoreDifference = right.internalScore - left.internalScore;
        if (scoreDifference !== 0) return scoreDifference;
        const unknownCount = (assessment: AiMatchAssessment) =>
          assessment.partyBenefits
            ? assessment.partyBenefits.flatMap((item) => item.unknowns).length +
              (assessment.executionFit?.unknowns.length ?? 0)
            : assessment.viewerToCandidate!.unknowns.length +
              assessment.candidateToViewer!.unknowns.length;
        const leftUnknowns = unknownCount(left.assessment);
        const rightUnknowns = unknownCount(right.assessment);
        if (leftUnknowns !== rightUnknowns) return leftUnknowns - rightUnknowns;
        const evidenceDifference =
          right.scoreBreakdown.evidenceCompleteness -
          left.scoreBreakdown.evidenceCompleteness;
        if (evidenceDifference !== 0) return evidenceDifference;
        return left.candidateId.localeCompare(right.candidateId);
      },
    )
    .slice(0, limit);
};
