import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("chat detail keeps API access and relationship settings navigation", () => {
  const page = readFileSync("src/app/messages/[threadId]/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getThreadMessages");
  expect(page).toContain('href={`/messages/${threadId}/settings`}');
  expect(page).not.toContain('@/lib/tsq/data');
});

test("chat composer has labelled attachment controls and a disabled send state", () => {
  const composer = readFileSync("src/components/tsq/chat-composer.tsx", "utf8");
  expect(composer).toContain('aria-label={t("tsq.chat.attachments")}');
  expect(composer).toContain("disabled={!canSend || sending}");
});

test("relationship settings use typed API calls and confirm blocking", () => {
  const page = readFileSync("src/app/messages/[threadId]/settings/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getRelationshipSettings");
  expect(page).toContain("tsqApi.updateRelationshipSettings");
  expect(page).toContain("aria-pressed");
  expect(page).toContain("blockConfirm");
});

test("report route submits selected reasons through tsqApi", () => {
  const page = readFileSync("src/app/messages/[threadId]/report/page.tsx", "utf8");
  expect(page).toContain("tsqApi.submitConversationReport");
  expect(page).toContain("reasons.length === 0");
  expect(page).toContain("evidenceUnavailable");
});
