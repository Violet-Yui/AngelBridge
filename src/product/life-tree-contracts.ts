import { z } from "zod";
import {
  MatchProofSchema,
  OutcomeSchema,
  ValueNodeSchema,
} from "../domain/contracts";
import {
  AiMatchAssessmentSchema,
  HybridScoreBreakdownSchema,
} from "../ai-matching/contracts";

export const TreeDisclosureSchema = z.enum([
  "private",
  "tree_only",
  "summary",
  "detailed",
]);

export const GrowthSummarySchema = z.object({
  score: z.number().int().min(0).max(1000),
  stageLabel: z.string().min(1),
  nextMilestone: z.string().min(1).nullable(),
  rulesetVersion: z.literal("demo-v1"),
  isSynthetic: z.literal(true),
});

export const RecommendationItemSchema = z.object({
  matchId: z.string().min(1),
  candidateId: z.string().min(1),
  candidateDisplayName: z.string().min(1),
  valueToYou: z.array(z.string().min(1)).min(1),
  valueToOther: z.array(z.string().min(1)).min(1),
  bridgeIndex: z.number().min(0).max(100),
  scoreBasis: z.array(z.string().min(1)).min(1),
  proof: MatchProofSchema,
  assessment: AiMatchAssessmentSchema.optional(),
  scoreBreakdown: HybridScoreBreakdownSchema.optional(),
  isSynthetic: z.literal(true),
});

export const RecommendationCollectionSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(RecommendationItemSchema).max(3),
});

export const PendingActionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "activate_intent",
    "start_matching",
    "review_match",
    "wait_for_other",
    "confirm_pact",
    "finish_pact",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  actionLabel: z.string().min(1).nullable(),
  targetId: z.string().min(1).optional(),
});

export const PetStateSchema = z.object({
  mood: z.enum(["idle", "thinking", "encouraging", "celebrating"]),
  message: z.string().min(1),
  suggestedAction: z.string().min(1).nullable(),
});

export const LifeTreeCountsSchema = z.object({
  offers: z.number().int().nonnegative(),
  needs: z.number().int().nonnegative(),
  goals: z.number().int().nonnegative(),
  opportunities: z.number().int().nonnegative(),
  outcomes: z.number().int().nonnegative(),
});

export const LifeTreeOverviewSchema = z.object({
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
  displayName: z.string().min(1),
  disclosure: TreeDisclosureSchema,
  stage: z.enum([
    "created",
    "intent_active",
    "no_matches",
    "matches_ready",
    "waiting_other",
    "rejected",
    "pact_draft",
    "pact_active",
    "completed",
    "exited",
  ]),
  counts: LifeTreeCountsSchema,
  growth: GrowthSummarySchema,
  recommendations: RecommendationCollectionSchema,
  pendingActions: z.array(PendingActionSchema),
  pet: PetStateSchema,
  generatedAt: z.string().datetime(),
  isSynthetic: z.literal(true),
});

export const LifeTreeDetailSchema = z.object({
  overview: LifeTreeOverviewSchema,
  offers: z.array(ValueNodeSchema),
  needs: z.array(ValueNodeSchema),
  goals: z.array(ValueNodeSchema),
  outcomes: z.array(OutcomeSchema),
});

export type TreeDisclosure = z.infer<typeof TreeDisclosureSchema>;
export type GrowthSummary = z.infer<typeof GrowthSummarySchema>;
export type RecommendationItem = z.infer<typeof RecommendationItemSchema>;
export type RecommendationCollection = z.infer<
  typeof RecommendationCollectionSchema
>;
export type PendingAction = z.infer<typeof PendingActionSchema>;
export type PetState = z.infer<typeof PetStateSchema>;
export type LifeTreeOverview = z.infer<typeof LifeTreeOverviewSchema>;
export type LifeTreeDetail = z.infer<typeof LifeTreeDetailSchema>;
