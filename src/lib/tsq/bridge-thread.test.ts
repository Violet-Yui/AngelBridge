import { expect, test } from "bun:test";
import { CONVERSATIONS, INVITES, type Invite } from "./data";

test("every bridge invitation resolves to an addressable conversation", () => {
  const conversationIds = new Set(CONVERSATIONS.map((conversation) => conversation.id));

  for (const invite of INVITES) {
    const threadId = (invite as Invite & { threadId?: string }).threadId;
    expect(threadId).toBeDefined();
    expect(conversationIds.has(threadId!)).toBe(true);
  }
});
