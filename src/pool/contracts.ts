import { z } from "zod";
import {
  DisclosurePolicySchema,
  DomainSchema,
  ExchangeModeSchema,
  MatchConstraintsSchema,
  MatchingProfileSchema,
  MatchProofSchema,
  VisibilitySchema,
} from "../domain/contracts";
import {
  AiMatchAssessmentSchema,
  HybridScoreBreakdownSchema,
} from "../ai-matching/contracts";
import { ImageAttachmentSchema } from "../media/contracts";

export const ProfileValueInputSchema = z.object({
  domain: DomainSchema,
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  keywords: z.array(z.string().trim().min(1).max(30)).min(1).max(12),
  deliverables: z.array(z.string().trim().min(1).max(120)).max(10),
  visibility: VisibilitySchema.default("match_only"),
  images: z.array(ImageAttachmentSchema).max(6).default([]),
});

export const ProposedPactTermsSchema = z.object({
  firstAction: z.string().trim().min(1).max(200),
  completionCriteria: z.string().trim().min(1).max(300),
  exitRule: z.string().trim().min(1).max(200),
  otherNotes: z.string().trim().max(500).default(""),
});

const SavePoolProfileBaseSchema = z.object({
  bio: z.string().trim().max(500).default(""),
  offers: z.array(ProfileValueInputSchema).max(8).default([]),
  needs: z.array(ProfileValueInputSchema).max(8).default([]),
  goals: z.array(ProfileValueInputSchema).max(8).default([]),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1),
  constraints: MatchConstraintsSchema,
  disclosurePolicy: DisclosurePolicySchema,
  proposedPactTerms: ProposedPactTermsSchema.nullable().default(null),
});

export const SavePoolProfileInputSchema = SavePoolProfileBaseSchema.refine(
  (value) => value.offers.length + value.needs.length + value.goals.length > 0,
  "at least one offer, need or goal is required",
);

export const PoolProfileSchema = z.object({
  accountId: z.string().min(1),
  poolScope: z.enum(["live", "showcase"]).default("live"),
  bio: z.string(),
  avatarUrl: z.string().nullable().default(null),
  profile: MatchingProfileSchema,
  disclosurePolicy: DisclosurePolicySchema,
  proposedPactTerms: ProposedPactTermsSchema.nullable().default(null),
  status: z.enum(["draft", "active"]),
  updatedAt: z.string().datetime(),
  isSynthetic: z.literal(false),
});

export const PublicationCategorySchema = z.enum([
  "people",
  "items",
  "jobs",
  "idle",
  "experience",
  "space",
  "skills",
  "collaboration",
  "other",
]);

export const PublicationKindSchema = z.enum(["offer", "need", "exchange"]);

export const CreatePublicationInputSchema = SavePoolProfileBaseSchema.extend({
  title: z.string().trim().min(1).max(80).optional(),
  category: PublicationCategorySchema,
  kind: PublicationKindSchema,
}).refine(
  (value) => value.offers.length + value.needs.length + value.goals.length > 0,
  "at least one offer, need or goal is required",
);

export const UpdatePublicationInputSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  category: PublicationCategorySchema.optional(),
  kind: PublicationKindSchema.optional(),
  bio: z.string().trim().max(500).optional(),
  offers: z.array(ProfileValueInputSchema).max(8).optional(),
  needs: z.array(ProfileValueInputSchema).max(8).optional(),
  goals: z.array(ProfileValueInputSchema).max(8).optional(),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1).optional(),
  constraints: MatchConstraintsSchema.optional(),
  disclosurePolicy: DisclosurePolicySchema.optional(),
  proposedPactTerms: ProposedPactTermsSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "at least one field is required");

export const PublicationSchema = z.object({
  publicationId: z.string().min(1),
  authorAccountId: z.string().min(1),
  authorGrowthScore: z.number().default(100),
  poolScope: z.enum(["live", "showcase"]).default("live"),
  avatarUrl: z.string().nullable().default(null),
  title: z.string().min(1),
  content: z.string().min(1).max(1000),
  category: PublicationCategorySchema,
  kind: PublicationKindSchema,
  bio: z.string(),
  offers: z.array(ProfileValueInputSchema),
  needs: z.array(ProfileValueInputSchema),
  goals: z.array(ProfileValueInputSchema),
  acceptedExchangeModes: z.array(ExchangeModeSchema),
  constraints: MatchConstraintsSchema,
  disclosurePolicy: DisclosurePolicySchema,
  proposedPactTerms: ProposedPactTermsSchema.nullable().default(null),
  profile: MatchingProfileSchema,
  status: z.enum(["draft", "published", "paused", "completed", "deleted"]),
  discoveryVisible: z.boolean().default(true),
  completionDecisionAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable().default(null),
  isSynthetic: z.literal(false),
});

const ConsentRecordSchema = z.object({
  partyIds: z.tuple([z.string().min(1), z.string().min(1)]),
  state: z.enum(["candidate", "waiting_other", "mutual_accepted", "rejected"]),
  decisions: z.record(
    z.string(),
    z.enum(["accepted", "rejected"]).optional(),
  ),
});

export const PoolMatchSchema = z.object({
  matchId: z.string().min(1),
  viewerId: z.string().min(1),
  candidateId: z.string().min(1),
  sourcePublicationId: z.string().min(1).nullable().default(null),
  targetPublicationId: z.string().min(1).nullable().default(null),
  internalScore: z.number().min(0).max(100),
  proof: MatchProofSchema,
  assessment: AiMatchAssessmentSchema.optional(),
  scoreBreakdown: HybridScoreBreakdownSchema.optional(),
  consent: ConsentRecordSchema,
  updatedAt: z.string().datetime(),
  isSynthetic: z.literal(false),
});

export const PoolMessageSchema = z.object({
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  senderPersonaId: z.string().min(1),
  senderDisplayName: z.string().min(1),
  type: z.enum([
    "text",
    "image",
    "pact_proposed",
    "pact_updated",
    "pact_start_confirmation",
    "pact_started",
    "pact_completion_confirmation",
    "pact_completed",
    "pact_exited",
  ]).default("text"),
  text: z.string().trim().max(2000),
  images: z.array(ImageAttachmentSchema).max(6).default([]),
  payload: z.record(z.string(), z.unknown()).nullable().default(null),
  createdAt: z.string().datetime(),
  isSynthetic: z.literal(false),
}).refine((value) => value.text.length > 0 || value.images.length > 0 || value.payload, {
  message: "message text or image is required",
});

export const PoolPetTurnSchema = z.object({
  turnId: z.string().min(1),
  accountId: z.string().min(1),
  userText: z.string().trim().max(2000),
  userImages: z.array(ImageAttachmentSchema).max(4).default([]),
  assistantText: z.string().trim().min(1),
  createdAt: z.string().datetime(),
  isSynthetic: z.literal(false),
}).refine((value) => value.userText.length > 0 || value.userImages.length > 0, {
  message: "message text or image is required",
});

export const PoolPactSchema = z.object({
  pactId: z.string().min(1),
  matchId: z.string().min(1),
  sourcePublicationId: z.string().min(1).nullable().default(null),
  targetPublicationId: z.string().min(1).nullable().default(null),
  partyIds: z.tuple([z.string().min(1), z.string().min(1)]),
  title: z.string().trim().min(1).max(100),
  firstAction: z.string().trim().min(1).max(200),
  completionCriteria: z.string().trim().min(1).max(300),
  exitRule: z.string().trim().min(1).max(200).default("如一方无法履约，应尽早在聊天中告知对方"),
  otherNotes: z.string().trim().max(500).default(""),
  status: z.enum(["waiting_start", "active", "waiting_completion", "completed", "exited"]),
  startConfirmations: z.record(z.string(), z.boolean()),
  completionConfirmations: z.record(z.string(), z.boolean()),
  rewarded: z.boolean().default(false),
  createdAt: z.string().datetime(),
  activatedAt: z.string().datetime().nullable().default(null),
  completedAt: z.string().datetime().nullable().default(null),
  isSynthetic: z.literal(false),
});

export const LifeTreeTagSchema = z.object({
  label: z.string().trim().min(1).max(30),
  visible: z.boolean().default(true),
});

export const SaveLifeTreeInputSchema = z.object({
  offers: z.array(LifeTreeTagSchema).max(20),
  needs: z.array(LifeTreeTagSchema).max(20),
  explorations: z.array(LifeTreeTagSchema).max(20),
});

export const LifeTreeDiagnosisSchema = z.object({
  completeness: z.number().int().min(0).max(100),
  matchClarity: z.number().int().min(0).max(100),
  review: z.string().trim().min(1).max(200),
});

export const LifeTreeRecordSchema = SaveLifeTreeInputSchema.extend({
  accountId: z.string().min(1),
  diagnosis: LifeTreeDiagnosisSchema.nullable().default(null),
  diagnosedAt: z.string().datetime().nullable().default(null),
  updatedAt: z.string().datetime(),
  isSynthetic: z.literal(false),
});

export const MatchPoolStateSchema = z.object({
  version: z.literal(1),
  profiles: z.record(z.string(), PoolProfileSchema),
  publications: z.record(z.string(), PublicationSchema).default({}),
  matches: z.record(z.string(), PoolMatchSchema),
  messages: z.array(PoolMessageSchema),
  conversationReads: z.record(
    z.string(),
    z.record(z.string(), z.string().min(1)),
  ).default({}),
  petTurns: z.array(PoolPetTurnSchema).default([]),
  pacts: z.record(z.string(), PoolPactSchema).default({}),
  lifeTrees: z.record(z.string(), LifeTreeRecordSchema).default({}),
});

export const PoolConsentInputSchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
});

export const PublicationCompletionDecisionInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("continue_matching") }),
  z.object({
    action: z.literal("close_matching"),
    discoveryVisible: z.boolean(),
  }),
]);

export const UpdatePoolPactInputSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  firstAction: z.string().trim().min(1).max(200).optional(),
  completionCriteria: z.string().trim().min(1).max(300).optional(),
  exitRule: z.string().trim().min(1).max(200).optional(),
  otherNotes: z.string().trim().max(500).optional(),
}).refine((value) => Object.keys(value).length > 0, "at least one pact field is required");

export const PoolMessageInputSchema = z.object({
  text: z.string().trim().max(2000).default(""),
  images: z.array(ImageAttachmentSchema).max(6).default([]),
}).refine((value) => value.text.length > 0 || value.images.length > 0, {
  message: "message text or image is required",
});

export const PoolPetTurnInputSchema = z.object({
  message: z.string().trim().max(2000).default(""),
  images: z.array(ImageAttachmentSchema).max(4).default([]),
}).refine((value) => value.message.length > 0 || value.images.length > 0, {
  message: "message text or image is required",
});

export const PetOrganizeNodeSchema = z.object({
  role: z.enum([
    "offer",
    "need",
    "goal",
    "attribute",
    "criterion",
    "consideration",
    "constraint",
  ]),
  domain: DomainSchema,
  text: z.string().trim().min(1).max(120),
  evidenceText: z.string().trim().min(1).max(200),
});

export const PetOrganizeDraftSchema = z.object({
  title: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(500),
  nodes: z.array(PetOrganizeNodeSchema).min(1).max(12),
  exchangeModes: z.array(ExchangeModeSchema).max(5),
  constraints: z.array(z.string().trim().min(1).max(100)).max(8),
});

export const PetOrganizeInputSchema = z.object({
  context: z.enum(["profile", "publish"]),
  message: z.string().trim().min(1).max(2000),
  images: z.array(ImageAttachmentSchema).max(4).default([]),
  currentDraft: PetOrganizeDraftSchema.nullable().default(null),
});

export const PetOrganizeResultSchema = z.object({
  assistantReply: z.string().trim().min(1).max(500),
  draft: PetOrganizeDraftSchema,
  missingFields: z.array(z.string().trim().min(1).max(80)).max(6),
  suggestedQuestions: z.array(z.string().trim().min(1).max(100)).max(3),
});

export type SavePoolProfileInput = z.infer<typeof SavePoolProfileInputSchema>;
export type PoolProfile = z.infer<typeof PoolProfileSchema>;
export type Publication = z.infer<typeof PublicationSchema>;
export type CreatePublicationInput = z.infer<typeof CreatePublicationInputSchema>;
export type UpdatePublicationInput = z.infer<typeof UpdatePublicationInputSchema>;
export type PoolMatch = z.infer<typeof PoolMatchSchema>;
export type PoolMessage = z.infer<typeof PoolMessageSchema>;
export type PoolPetTurn = z.infer<typeof PoolPetTurnSchema>;
export type PoolPact = z.infer<typeof PoolPactSchema>;
export type LifeTreeRecord = z.infer<typeof LifeTreeRecordSchema>;
export type SaveLifeTreeInput = z.infer<typeof SaveLifeTreeInputSchema>;
export type LifeTreeDiagnosis = z.infer<typeof LifeTreeDiagnosisSchema>;
export type MatchPoolState = z.infer<typeof MatchPoolStateSchema>;
export type PetOrganizeInput = z.infer<typeof PetOrganizeInputSchema>;
export type PetOrganizeResult = z.infer<typeof PetOrganizeResultSchema>;
