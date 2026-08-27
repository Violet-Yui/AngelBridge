import { z } from "zod";
import type { MatchingProfile } from "../domain/contracts";

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
  viewerToCandidate: DirectionalMatchAssessmentSchema,
  candidateToViewer: DirectionalMatchAssessmentSchema,
  confidence: AiAssessmentConfidenceSchema,
  assessmentMode: z.enum(["fixture", "live_ai"]),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  generatedAt: z.string().datetime(),
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
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
  evidenceCompleteness: z.number().min(0).max(1),
  aiConfidence: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  overallConfidence: z.number().min(0).max(1),
  bridgeIndex: z.number().min(0).max(100),
  algorithmVersion: z.literal("hybrid-v0.2"),
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
