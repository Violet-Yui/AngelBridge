import { z } from "zod";
import type { DemoSession } from "../demo/session-service";
import { VoiceTurnResponseSchema, type VoiceTurnResponse } from "../voice/contracts";
import { PetTextTurnSchema, type PetTextTurn } from "../product/pet-conversation-contracts";
import type { ConversationMessage } from "../product/conversation-contracts";

export type PersistedRole = {
  token: string;
  sessionId: string;
  personaId: string;
};

export type ApplicationSessionSnapshot = {
  version: 1;
  sessionId: string;
  session: DemoSession;
  roles: PersistedRole[];
  voiceTurns: VoiceTurnResponse[];
  petTextTurns: PetTextTurn[];
  conversationMessages: ConversationMessage[];
};

const PersistedRoleSchema = z.object({
  token: z.string().min(1),
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
});

const DemoSessionBoundarySchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  viewerPersonaId: z.string().min(1),
  profiles: z.array(z.unknown()).min(1),
  sourceTexts: z.record(z.string(), z.string()),
  activeIntentPersonaIds: z.array(z.string()),
  intents: z.record(z.string(), z.unknown()),
  confirmedNodeIds: z.record(z.string(), z.array(z.string())),
  disclosurePolicies: z.record(z.string(), z.unknown()),
  treeDisclosures: z.record(z.string(), z.string()),
  matches: z.array(z.unknown()),
  connections: z.record(z.string(), z.unknown()),
  outcomes: z.array(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).passthrough();

const ConversationMessageSchema = z.object({
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  sessionId: z.string().min(1),
  senderPersonaId: z.string().min(1),
  senderDisplayName: z.string().min(1),
  text: z.string().min(1).max(2000),
  createdAt: z.string().datetime(),
  isSynthetic: z.literal(true),
});

const ApplicationSessionSnapshotBoundarySchema = z.object({
  version: z.literal(1),
  sessionId: z.string().min(1),
  session: DemoSessionBoundarySchema,
  roles: z.array(PersistedRoleSchema).min(1),
  voiceTurns: z.array(VoiceTurnResponseSchema),
  petTextTurns: z.array(PetTextTurnSchema),
  conversationMessages: z.array(ConversationMessageSchema),
});

export const parseApplicationSessionSnapshot = (
  value: unknown,
): ApplicationSessionSnapshot => {
  const parsed = ApplicationSessionSnapshotBoundarySchema.parse(value);
  if (parsed.session.id !== parsed.sessionId) {
    throw new Error("application snapshot session id mismatch");
  }
  if (parsed.roles.some((role) => role.sessionId !== parsed.sessionId)) {
    throw new Error("application snapshot role belongs to another session");
  }
  return parsed as ApplicationSessionSnapshot;
};

export interface ApplicationStateRepository {
  findBySessionId(sessionId: string): Promise<ApplicationSessionSnapshot | null>;
  save(snapshot: ApplicationSessionSnapshot): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}
