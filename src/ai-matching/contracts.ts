import { z } from "zod";
import { MatchReasonSchema, type MatchingProfile } from "../domain/contracts";

export const SemanticRelationSchema = z.enum([
  "exact",
  "strong",
  "partial",
  "weak",
  "none",
]);

export const DeliverabilitySchema = z.enum([
  "clear",
  "partial",
  "unclear",
]);

export const SoftConstraintRiskSchema = z.enum([
  "none",
  "needs_clarification",
  "high",
]);

export const AiAssessmentConfidenceSchema = z.enum([
  "high",
  "medium",
  "low",
]);

export const BridgeTierSchema = z.enum([
  "ideal",
  "feasible",
  "conditional",
]);

export const RelationshipPatternSchema = z.enum([
  "supply_demand",
  "transactional",
  "reciprocal_exchange",
  "criteria_fit",
  "collaboration",
  "mutual_affinity",
  "gift_support",
]);

export const BenefitBasisSchema = z.enum([
  "resource",
  "money",
  "opportunity",
  "criteria_satisfaction",
  "shared_goal",
  "relationship_value",
  "altruistic_goal",
]);

export const PartyBenefitSchema = z.object({
  partyId: z.string().min(1),
  strength: SemanticRelationSchema,
  basis: BenefitBasisSchema,
  reason: z.string().trim().min(1).max(160),
  evidenceNodeIds: z.array(z.string().min(1)).min(1).max(6),
  unknowns: z.array(z.string().trim().min(1).max(100)).max(6),
});

export const ExecutionAssessmentSchema = z.object({
  level: DeliverabilitySchema,
  reason: z.string().trim().min(1).max(160),
  evidenceNodeIds: z.array(z.string().min(1)).max(6),
  unknowns: z.array(z.string().trim().min(1).max(100)).max(6),
});

export const DirectionalMatchAssessmentSchema = z.object({
  semanticRelation: SemanticRelationSchema,
  deliverability: DeliverabilitySchema,
  softConstraintRisk: SoftConstraintRiskSchema,
  needNodeId: z.string().min(1),
  offerNodeId: z.string().min(1),
  reason: z.string().min(1),
  unknowns: z.array(z.string().min(1)),
  evidenceNodeIds: z.array(z.string().min(1)).min(2),
});

export const AiMatchAssessmentSchema = z.object({
  viewerId: z.string().min(1),
  candidateId: z.string().min(1),
  viewerToCandidate: DirectionalMatchAssessmentSchema.optional(),
  candidateToViewer: DirectionalMatchAssessmentSchema.optional(),
  primaryPattern: RelationshipPatternSchema.optional(),
  supportingPatterns: z.array(RelationshipPatternSchema).max(3).default([]),
  partyBenefits: z.array(PartyBenefitSchema).length(2).optional(),
  executionFit: ExecutionAssessmentSchema.optional(),
  conflicts: z.array(z.string().trim().min(1).max(100)).max(6).default([]),
  matchReasons: z.array(MatchReasonSchema).max(3).default([]),
  confidence: AiAssessmentConfidenceSchema,
  assessmentMode: z.enum(["fixture", "live_ai"]),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  isSynthetic: z.boolean(),
  datasetVersion: z.string().min(1),
}).superRefine((value, context) => {
  const hasLegacy = Boolean(value.viewerToCandidate && value.candidateToViewer);
  const hasRelationship = Boolean(
    value.primaryPattern && value.partyBenefits && value.executionFit,
  );
  if (!hasLegacy && !hasRelationship) {
    context.addIssue({
      code: "custom",
      message: "assessment requires either directional pairs or relationship benefits",
    });
  }
});

export const DirectionScoreBreakdownSchema = z.object({
  semanticRelation: z.number().min(0).max(1),
  deliverability: z.number().min(0).max(1),
  softConstraintFit: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
});

export const HybridScoreBreakdownSchema = z.object({
  viewerToCandidate: DirectionScoreBreakdownSchema,
  candidateToViewer: DirectionScoreBreakdownSchema,
  bilateralValue: z.number().min(0).max(1),
  balanceFactor: z.number().min(0).max(1).optional(),
  evidenceCompleteness: z.number().min(0).max(1),
  aiConfidence: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  overallConfidence: z.number().min(0).max(1),
  bridgeIndex: z.number().min(0).max(100),
  tier: BridgeTierSchema.optional(),
  algorithmVersion: z.enum(["hybrid-v0.2", "semantic-bridge-v0.3"]),
});

export type AiMatchAssessmentInput = {
  viewer: MatchingProfile;
  candidate: MatchingProfile;
};

export type SemanticRelation = z.infer<typeof SemanticRelationSchema>;
export type Deliverability = z.infer<typeof DeliverabilitySchema>;
export type SoftConstraintRisk = z.infer<typeof SoftConstraintRiskSchema>;
export type AiAssessmentConfidence = z.infer<
  typeof AiAssessmentConfidenceSchema
>;
export type BridgeTier = z.infer<typeof BridgeTierSchema>;
export type RelationshipPattern = z.infer<typeof RelationshipPatternSchema>;
export type PartyBenefit = z.infer<typeof PartyBenefitSchema>;
export type DirectionalMatchAssessment = z.infer<
  typeof DirectionalMatchAssessmentSchema
>;
export type AiMatchAssessment = z.infer<typeof AiMatchAssessmentSchema>;
export type DirectionScoreBreakdown = z.infer<
  typeof DirectionScoreBreakdownSchema
>;
export type HybridScoreBreakdown = z.infer<
  typeof HybridScoreBreakdownSchema
>;
