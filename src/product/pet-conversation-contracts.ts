import { z } from "zod";

export const PetConversationIntentSchema = z.enum([
  "organize",
  "explain_match",
  "next_step",
]);

export const PetTextTurnInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  intent: PetConversationIntentSchema,
  matchId: z.string().min(1).optional(),
}).superRefine((value, context) => {
  if (value.intent !== "explain_match" && value.matchId) {
    context.addIssue({
      code: "custom",
      path: ["matchId"],
      message: "matchId is only used when explaining a match",
    });
  }
});

export const PetTextTurnSchema = z.object({
  turnId: z.string().min(1),
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
  userText: z.string().min(1),
  assistantText: z.string().min(1),
  intent: PetConversationIntentSchema,
  relatedMatchId: z.string().min(1).nullable(),
  suggestedActions: z.array(z.string().min(1)),
  mode: z.literal("fixture"),
  createdAt: z.string().datetime(),
  isSynthetic: z.literal(true),
});

export type PetTextTurnInput = z.infer<typeof PetTextTurnInputSchema>;
export type PetTextTurn = z.infer<typeof PetTextTurnSchema>;
