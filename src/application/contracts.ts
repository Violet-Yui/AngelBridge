import { z } from "zod";
import {
  DisclosurePolicySchema,
  ExchangeModeSchema,
  IntentSchema,
  VisibilitySchema,
} from "../domain/contracts";
import { TreeDisclosureSchema } from "../product/life-tree-contracts";

export const CreateDemoSessionInputSchema = z.object({
  scenarioId: z.string().min(1),
});

export const ParseFixtureInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export const UpdateValueNodeInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  keywords: z.array(z.string().trim().min(1).max(30)).min(1).max(12),
  deliverables: z.array(z.string().trim().min(1).max(120)).max(10),
  visibility: VisibilitySchema,
});

export const ConfirmValueNodesInputSchema = z.object({
  nodeIds: z.array(z.string().min(1)).min(1),
});

export const UpdateIntentInputSchema = z.object({
  offerNodeIds: z.array(z.string().min(1)),
  needNodeIds: z.array(z.string().min(1)),
  goalNodeIds: z.array(z.string().min(1)),
  acceptedExchangeModes: z.array(ExchangeModeSchema).min(1),
  constraints: z.object({
    locations: z.array(z.string().trim().min(1)).max(10),
    availability: z.array(z.string().trim().min(1)).max(10),
  }),
  disclosurePolicy: DisclosurePolicySchema,
}).superRefine((value, context) => {
  if (
    value.offerNodeIds.length + value.needNodeIds.length + value.goalNodeIds.length ===
    0
  ) {
    context.addIssue({
      code: "custom",
      path: ["offerNodeIds"],
      message: "intent must reference at least one value node",
    });
  }
});

export const ConsentInputSchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
});

export const RunMatchingInputSchema = z.object({
  mode: z.enum(["rule", "fixture_ai"]).default("fixture_ai"),
});

export const UpdatePactInputSchema = z.object({
  timeWindow: z.string().trim().min(1).nullable(),
  locationSummary: z.string().trim().min(1).nullable(),
  costOrDifference: z.string().trim().min(1).nullable(),
  firstAction: z.string().trim().min(1),
  completionCriteria: z.array(z.string().trim().min(1)).min(1).max(10),
  exitRule: z.string().trim().min(1),
});

export const FinishPactInputSchema = z.object({
  outcome: z.enum(["completed", "exited"]),
});

export const UpdateTreeDisclosureInputSchema = z.object({
  disclosure: TreeDisclosureSchema,
});

export const FixtureVoiceTurnInputSchema = z.object({
  audioBase64: z.string().min(1).max(14_000_000).regex(
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    "audioBase64 must be valid base64",
  ),
  contentType: z.string().startsWith("audio/"),
  fixtureTranscript: z.string().trim().min(1).max(2000),
});

export const ActiveIntentSchema = IntentSchema.extend({ status: z.literal("active") });

export type UpdateIntentInput = z.infer<typeof UpdateIntentInputSchema>;
export type UpdatePactInput = z.infer<typeof UpdatePactInputSchema>;
