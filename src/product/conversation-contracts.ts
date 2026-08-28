import { z } from "zod";

export const SendConversationMessageInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export type ConversationSummary = {
  conversationId: string;
  matchId: string;
  counterpartId: string;
  counterpartDisplayName: string;
  lastMessage: string | null;
  messageCount: number;
  updatedAt: string;
  isSynthetic: true;
};

export type ConversationMessage = {
  messageId: string;
  conversationId: string;
  sessionId: string;
  senderPersonaId: string;
  senderDisplayName: string;
  text: string;
  createdAt: string;
  isSynthetic: true;
};
