import type { DemoSession } from "../demo/session-service";

export interface SessionRepository {
  create(session: DemoSession): Promise<void>;
  findById(sessionId: string): Promise<DemoSession | null>;
  save(session: DemoSession): Promise<void>;
}

export type PetConversationTurn = {
  turnId: string;
  sessionId: string;
  personaId: string;
  userText: string;
  assistantText: string;
  intent: "organize" | "explain_match" | "next_step";
  relatedMatchId: string | null;
  suggestedActions: string[];
  createdAt: string;
  isSynthetic: boolean;
};

export interface PetConversationRepository {
  append(turn: PetConversationTurn): Promise<void>;
  listByPersona(sessionId: string, personaId: string): Promise<PetConversationTurn[]>;
}
