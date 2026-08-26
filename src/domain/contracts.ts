import { z } from "zod";

export const DirectionSchema = z.enum(["offer", "need", "goal"]);
export const DomainSchema = z.enum([
  "space",
  "item",
  "skill",
  "service",
  "opportunity",
  "growth",
]);
export const VisibilitySchema = z.enum([
  "private",
  "match_only",
  "mutual_consent",
]);
export const ExchangeModeSchema = z.enum([
  "money",
  "barter",
  "skill_swap",
  "collaboration",
  "gift",
]);

export const ValueNodeSchema = z.object({
  id: z.string().min(1),
  personaId: z.string().min(1),
  direction: DirectionSchema,
  domain: DomainSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  deliverables: z.array(z.string().min(1)),
  visibility: VisibilitySchema,
  evidenceCompleteness: z.number().min(0).max(1),
  updatedAt: z.string().datetime(),
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
});

export const MatchConstraintsSchema = z.object({
  locations: z.array(z.string().min(1)),
  availability: z.array(z.string().min(1)),
});

export const IntentSchema = z.object({
  offerNodeIds: z.array(z.string().min(1)).min(1),
  needNodeIds: z.array(z.string().min(1)).min(1),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1),
  constraints: MatchConstraintsSchema,
  status: z.enum(["draft", "active"]),
});

export const ParseResultSchema = z.object({
  personaId: z.string().min(1),
  sourceText: z.string().min(1),
  nodes: z.array(ValueNodeSchema).min(2),
  intent: IntentSchema,
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
});

export const MatchProofSchema = z.object({
  matchId: z.string().min(1),
  viewerId: z.string().min(1),
  candidateId: z.string().min(1),
  status: z.enum([
    "candidate",
    "waiting_other",
    "mutual_accepted",
    "rejected",
  ]),
  valueToViewer: z.array(z.string().min(1)).min(1),
  valueToCandidate: z.array(z.string().min(1)).min(1),
  satisfiedConstraints: z.array(z.string().min(1)),
  conflicts: z.array(z.string().min(1)),
  unknowns: z.array(z.string().min(1)),
  evidence: z.array(
    z.object({
      nodeId: z.string().min(1),
      summary: z.string().min(1),
    }),
  ),
  generatedAt: z.string().datetime(),
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
});

export const BridgePactSchema = z.object({
  pactId: z.string().min(1),
  matchId: z.string().min(1),
  partyIds: z.tuple([z.string().min(1), z.string().min(1)]),
  title: z.string().min(1),
  status: z.enum(["draft", "active", "completed", "exited"]),
  exchangeModes: z.array(ExchangeModeSchema).min(1),
  commitments: z.array(
    z.object({
      partyId: z.string().min(1),
      deliverable: z.string().min(1),
      dueAt: z.string().datetime().optional(),
    }),
  ).min(2),
  confirmations: z.record(z.string(), z.boolean()),
  createdAt: z.string().datetime(),
  activatedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  exitedAt: z.string().datetime().optional(),
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
});

export const OutcomeSchema = z.object({
  outcomeId: z.string().min(1),
  sessionId: z.string().min(1),
  pactId: z.string().min(1),
  personaId: z.string().min(1),
  status: z.enum(["completed", "exited"]),
  summary: z.string().min(1),
  treeChange: z.string().min(1),
  createdAt: z.string().datetime(),
  isSynthetic: z.literal(true),
  datasetVersion: z.string().min(1),
});

export const MatchingProfileSchema = z.object({
  personaId: z.string().min(1),
  displayName: z.string().min(1),
  nodes: z.array(ValueNodeSchema).min(2),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1),
  constraints: MatchConstraintsSchema,
});

export type ValueNode = z.infer<typeof ValueNodeSchema>;
export type ParseResult = z.infer<typeof ParseResultSchema>;
export type MatchProof = z.infer<typeof MatchProofSchema>;
export type BridgePact = z.infer<typeof BridgePactSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;
export type MatchingProfile = z.infer<typeof MatchingProfileSchema>;
export type ExchangeMode = z.infer<typeof ExchangeModeSchema>;
