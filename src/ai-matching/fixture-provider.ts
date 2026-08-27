import type { MatchingProfile, ValueNode } from "../domain/contracts";
import {
  AiMatchAssessmentSchema,
  type AiAssessmentConfidence,
  type AiMatchAssessment,
  type AiMatchAssessmentInput,
  type Deliverability,
  type DirectionalMatchAssessment,
  type SemanticRelation,
  type SoftConstraintRisk,
} from "./contracts";
import type { AiMatchAssessmentProvider } from "./provider";

type NodePair = {
  need: ValueNode;
  offer: ValueNode;
  keywordOverlap: number;
  selectionScore: number;
};

const normalizedKeywords = (node: ValueNode): Set<string> =>
  new Set(node.keywords.map((keyword) => keyword.trim().toLowerCase()));

const keywordOverlap = (left: ValueNode, right: ValueNode): number => {
  const leftKeywords = normalizedKeywords(left);
  const rightKeywords = normalizedKeywords(right);
  const intersectionSize = [...leftKeywords].filter((keyword) =>
    rightKeywords.has(keyword),
  ).length;
  const unionSize = new Set([...leftKeywords, ...rightKeywords]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

const selectPair = (
  needOwner: MatchingProfile,
  offerOwner: MatchingProfile,
): NodePair => {
  const needs = needOwner.nodes.filter(
    (node) => node.direction === "need" && node.visibility !== "private",
  );
  const offers = offerOwner.nodes.filter(
    (node) => node.direction === "offer" && node.visibility !== "private",
  );
  const pairs = needs.flatMap((need) =>
    offers.map((offer) => {
      const overlap = keywordOverlap(need, offer);
      return {
        need,
        offer,
        keywordOverlap: overlap,
        selectionScore: overlap + (need.domain === offer.domain ? 0.25 : 0),
      };
    }),
  );
  const selected = pairs.sort(
    (left, right) =>
      right.selectionScore - left.selectionScore ||
      left.need.id.localeCompare(right.need.id) ||
      left.offer.id.localeCompare(right.offer.id),
  )[0];
  if (!selected) {
    throw new Error("fixture assessment requires a visible need and offer pair");
  }
  return selected;
};

const semanticRelationFor = (pair: NodePair): SemanticRelation => {
  if (pair.keywordOverlap >= 0.75) return "exact";
  if (pair.keywordOverlap >= 0.4) return "strong";
  if (pair.keywordOverlap > 0) return "partial";
  if (pair.need.domain === pair.offer.domain) return "weak";
  return "none";
};

const deliverabilityFor = (offer: ValueNode): Deliverability => {
  if (offer.deliverables.length > 0 && offer.evidenceCompleteness >= 0.8) {
    return "clear";
  }
  if (offer.deliverables.length > 0 || offer.evidenceCompleteness >= 0.6) {
    return "partial";
  }
  return "unclear";
};

const hasSharedValue = (left: string[], right: string[]): boolean => {
  if (left.length === 0 || right.length === 0) return false;
  const rightValues = new Set(right.map((value) => value.trim().toLowerCase()));
  return left.some((value) => rightValues.has(value.trim().toLowerCase()));
};

const softConstraintRiskFor = (
  left: MatchingProfile,
  right: MatchingProfile,
): SoftConstraintRisk => {
  const locationKnown = hasSharedValue(
    left.constraints.locations,
    right.constraints.locations,
  );
  const availabilityKnown = hasSharedValue(
    left.constraints.availability,
    right.constraints.availability,
  );
  return locationKnown && availabilityKnown ? "none" : "needs_clarification";
};

const confidenceFor = (nodes: ValueNode[]): AiAssessmentConfidence => {
  const average =
    nodes.reduce((total, node) => total + node.evidenceCompleteness, 0) /
    nodes.length;
  if (average >= 0.85) return "high";
  if (average >= 0.65) return "medium";
  return "low";
};

const assessmentFor = (
  pair: NodePair,
  needOwner: MatchingProfile,
  offerOwner: MatchingProfile,
): DirectionalMatchAssessment => {
  const deliverability = deliverabilityFor(pair.offer);
  const softConstraintRisk = softConstraintRiskFor(needOwner, offerOwner);
  const unknowns = [
    ...(deliverability === "clear" ? [] : ["具体交付内容需要双方确认"]),
    ...(softConstraintRisk === "none" ? [] : ["地点或时间细节需要双方确认"]),
  ];
  return {
    semanticRelation: semanticRelationFor(pair),
    deliverability,
    softConstraintRisk,
    needNodeId: pair.need.id,
    offerNodeId: pair.offer.id,
    reason: `“${pair.offer.title}”可以回应“${pair.need.title}”`,
    unknowns,
    evidenceNodeIds: [pair.need.id, pair.offer.id],
  };
};

type FixtureProviderOptions = {
  now?: () => Date;
};

export class FixtureAiMatchAssessmentProvider
  implements AiMatchAssessmentProvider
{
  private readonly now: () => Date;

  constructor(options: FixtureProviderOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  async assess(input: AiMatchAssessmentInput): Promise<AiMatchAssessment> {
    const allNodes = [...input.viewer.nodes, ...input.candidate.nodes];
    if (allNodes.some((node) => !node.isSynthetic)) {
      throw new Error("fixture assessment only accepts synthetic value nodes");
    }

    const viewerToCandidate = selectPair(input.viewer, input.candidate);
    const candidateToViewer = selectPair(input.candidate, input.viewer);
    const evidenceNodes = [
      viewerToCandidate.need,
      viewerToCandidate.offer,
      candidateToViewer.need,
      candidateToViewer.offer,
    ];

    return AiMatchAssessmentSchema.parse({
      viewerId: input.viewer.personaId,
      candidateId: input.candidate.personaId,
      viewerToCandidate: assessmentFor(
        viewerToCandidate,
        input.viewer,
        input.candidate,
      ),
      candidateToViewer: assessmentFor(
        candidateToViewer,
        input.candidate,
        input.viewer,
      ),
      confidence: confidenceFor(evidenceNodes),
      assessmentMode: "fixture",
      model: "fixture-hybrid-v1",
      promptVersion: "hybrid-match-v0.2",
      generatedAt: this.now().toISOString(),
      isSynthetic: true,
      datasetVersion: evidenceNodes[0].datasetVersion,
    });
  }
}
