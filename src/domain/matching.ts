import type {
  MatchProof,
  MatchingProfile,
  ValueNode,
} from "./contracts";

type ValuePair = {
  need: ValueNode;
  offer: ValueNode;
  utility: number;
};

export type RankedMatch = {
  candidateId: string;
  internalScore: number;
  proof: MatchProof;
};

export type RejectedMatch = {
  candidateId: string;
  reasons: string[];
};

export type MatchEvaluation =
  | { eligible: true; result: RankedMatch }
  | { eligible: false; rejection: RejectedMatch };

const intersection = (left: string[], right: string[]) => {
  const rightSet = new Set(right.map((value) => value.trim().toLowerCase()));
  return left.filter((value) => rightSet.has(value.trim().toLowerCase()));
};

const pairUtility = (need: ValueNode, offer: ValueNode): number | null => {
  if (
    need.direction !== "need" ||
    offer.direction !== "offer" ||
    need.domain !== offer.domain ||
    need.visibility === "private" ||
    offer.visibility === "private"
  ) {
    return null;
  }

  const needKeywords = new Set(
    need.keywords.map((keyword) => keyword.trim().toLowerCase()),
  );
  const offerKeywords = new Set(
    offer.keywords.map((keyword) => keyword.trim().toLowerCase()),
  );
  const overlap = [...needKeywords].filter((keyword) => offerKeywords.has(keyword));
  if (overlap.length === 0) {
    return null;
  }

  const unionSize = new Set([...needKeywords, ...offerKeywords]).size;
  return 0.5 + 0.5 * (overlap.length / unionSize);
};

const bestPair = (needs: ValueNode[], offers: ValueNode[]): ValuePair | null => {
  const pairs = needs.flatMap((need) =>
    offers.flatMap((offer) => {
      const utility = pairUtility(need, offer);
      return utility === null ? [] : [{ need, offer, utility }];
    }),
  );

  return pairs.sort(
    (left, right) =>
      right.utility - left.utility ||
      left.need.id.localeCompare(right.need.id) ||
      left.offer.id.localeCompare(right.offer.id),
  )[0] ?? null;
};

const freshness = (nodes: ValueNode[], now: Date): number => {
  const averageTimestamp =
    nodes.reduce((sum, node) => sum + Date.parse(node.updatedAt), 0) /
    nodes.length;
  const ageInDays = Math.max(0, now.getTime() - averageTimestamp) / 86_400_000;
  return 1 / (1 + ageInDays / 30);
};

const hardGateReasons = (
  viewer: MatchingProfile,
  candidate: MatchingProfile,
): string[] => {
  const reasons: string[] = [];
  if (
    intersection(viewer.acceptedExchangeModes, candidate.acceptedExchangeModes)
      .length === 0
  ) {
    reasons.push("双方接受的价值置换方式不一致");
  }
  if (
    viewer.constraints.locations.length > 0 &&
    candidate.constraints.locations.length > 0 &&
    intersection(viewer.constraints.locations, candidate.constraints.locations)
      .length === 0
  ) {
    reasons.push("地点约束不一致");
  }
  if (
    viewer.constraints.availability.length > 0 &&
    candidate.constraints.availability.length > 0 &&
    intersection(
      viewer.constraints.availability,
      candidate.constraints.availability,
    ).length === 0
  ) {
    reasons.push("可用时间不一致");
  }
  return reasons;
};

export const evaluateMatch = (
  viewer: MatchingProfile,
  candidate: MatchingProfile,
  now: Date,
): MatchEvaluation => {
  const reasons = hardGateReasons(viewer, candidate);
  if (reasons.length > 0) {
    return {
      eligible: false,
      rejection: { candidateId: candidate.personaId, reasons },
    };
  }

  const viewerNeedsCandidateOffer = bestPair(
    viewer.nodes.filter((node) => node.direction === "need"),
    candidate.nodes.filter((node) => node.direction === "offer"),
  );
  const candidateNeedsViewerOffer = bestPair(
    candidate.nodes.filter((node) => node.direction === "need"),
    viewer.nodes.filter((node) => node.direction === "offer"),
  );

  if (!viewerNeedsCandidateOffer || !candidateNeedsViewerOffer) {
    return {
      eligible: false,
      rejection: {
        candidateId: candidate.personaId,
        reasons: ["未形成双方都清晰受益的价值连接"],
      },
    };
  }

  const evidenceNodes = [
    viewerNeedsCandidateOffer.need,
    viewerNeedsCandidateOffer.offer,
    candidateNeedsViewerOffer.need,
    candidateNeedsViewerOffer.offer,
  ];
  const evidenceCompleteness =
    evidenceNodes.reduce((sum, node) => sum + node.evidenceCompleteness, 0) /
    evidenceNodes.length;
  const internalScore =
    Math.round(
      viewerNeedsCandidateOffer.utility *
        candidateNeedsViewerOffer.utility *
        evidenceCompleteness *
        freshness(evidenceNodes, now) *
        10_000,
    ) / 100;

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

  const proof: MatchProof = {
    matchId: `match:${viewer.personaId}:${candidate.personaId}`,
    viewerId: viewer.personaId,
    candidateId: candidate.personaId,
    status: "candidate",
    valueToViewer: [
      `${candidate.displayName}可提供「${viewerNeedsCandidateOffer.offer.title}」，回应你的「${viewerNeedsCandidateOffer.need.title}」`,
    ],
    valueToCandidate: [
      `你可提供「${candidateNeedsViewerOffer.offer.title}」，回应对方的「${candidateNeedsViewerOffer.need.title}」`,
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
    conflicts: [],
    unknowns: ["具体交付范围与时间需双方确认"],
    evidence: evidenceNodes.map((node) => ({
      nodeId: node.id,
      summary: node.title,
    })),
    generatedAt: now.toISOString(),
    isSynthetic: true,
    datasetVersion: evidenceNodes[0].datasetVersion,
  };

  return {
    eligible: true,
    result: { candidateId: candidate.personaId, internalScore, proof },
  };
};

export const rankCandidates = (
  viewer: MatchingProfile,
  candidates: MatchingProfile[],
  now: Date,
): RankedMatch[] =>
  candidates
    .map((candidate) => evaluateMatch(viewer, candidate, now))
    .flatMap((evaluation) =>
      evaluation.eligible ? [evaluation.result] : [],
    )
    .sort(
      (left, right) =>
        right.internalScore - left.internalScore ||
        left.candidateId.localeCompare(right.candidateId),
    );
