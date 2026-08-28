import { expect, test } from "bun:test";
import {
  getHome,
  getMessageList,
  getRelationshipSettings,
  submitConversationReport,
  tsqApi,
  updateRelationshipSettings,
} from "./api";

test("home overview returns profile, matches, and pending todos", async () => {
  const home = await getHome();
  expect(home.profile.name).toBe("林一叶");
  expect(home.profile.followers).toBe(12);
  expect(home.matches.length).toBeGreaterThan(0);
  expect(home.todos.every((todo) => todo.id.length > 0)).toBe(true);
});

test("message list returns addressable conversations", async () => {
  const conversations = await getMessageList();
  expect(conversations.length).toBeGreaterThan(0);
  expect(conversations.every((thread) => thread.id && thread.name)).toBe(true);
});

test("relationship settings retain a saved mute preference per thread", async () => {
  const saved = await updateRelationshipSettings("c2", { muted: true, blocked: false });

  expect(saved).toEqual({ muted: true, blocked: false });
  expect(await getRelationshipSettings("c2")).toEqual(saved);
});

test("conversation report requires a reason and returns an addressable receipt", async () => {
  await expect(
    submitConversationReport({ threadId: "c2", reasons: [] }),
  ).rejects.toMatchObject({ code: "VALIDATION" });

  const result = await submitConversationReport({
    threadId: "c2",
    reasons: ["fraud"],
    description: "信息与实际不符",
  });

  expect(result.reportId).toMatch(/^report-/);
  expect(result.submittedAt).toBeTruthy();
});

test("discover detail returns a card-shaped record", async () => {
  const detail = await tsqApi.getDiscoverDetail("p1");

  expect(detail.id).toBe("p1");
  expect(detail.title).toContain("摄影");
  expect(detail.author.name).toBe("橙子汽水");
  expect(detail.reasons.length).toBeGreaterThan(0);
});

test("thread messages returns a stable conversation and message list", async () => {
  const thread = await tsqApi.getThreadMessages("c2");

  expect(thread.thread.id).toBe("c2");
  expect(thread.thread.title).toBe("设计小站");
  expect(thread.messages.length).toBeGreaterThan(0);
  expect(thread.messages[0].status).toBe("sent");
});

test("create post returns an addressable post id", async () => {
  const result = await tsqApi.createPost({
    channel: "person",
    intent: "have",
    text: "寻找长期共创的设计伙伴",
  });

  expect(result.postId).toMatch(/^post-/);
});

test("unknown records surface a typed not-found error", async () => {
  await expect(tsqApi.getDiscoverDetail("missing")).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});

test("bridge detail exposes status, reasons, and next action", async () => {
  const bridge = await tsqApi.getBridgeDetail("i1");
  expect(bridge.id).toBe("i1");
  expect(bridge.status).toBe("pending");
  expect(bridge.reasons.length).toBeGreaterThan(0);
  expect(bridge.nextAction).toContain("参考图");
});

test("bridge actions return the updated bridge id", async () => {
  const confirmed = await tsqApi.confirmBridge("i1", { agree: true });
  expect(confirmed.id).toBe("i1");
  expect(confirmed.status).toBe("accepted");
  const scheduled = await tsqApi.scheduleBridge("i1", { slot: "周六 10:00" });
  expect(scheduled.status).toBe("scheduled");
});

test("tree overview returns growth and milestones", async () => {
  const tree = await tsqApi.getTreeOverview();
  expect(tree.growth).toBe(1280);
  expect(tree.level).toBe(12);
  expect(tree.milestones.length).toBeGreaterThan(0);
});

test("profile update preserves an addressable user profile", async () => {
  const profile = await tsqApi.updateProfile({ name: "林一叶", bio: "持续创造与连接" });
  expect(profile.id).toBe("me");
  expect(profile.bio).toBe("持续创造与连接");
});

test("resource and need details are addressable", async () => {
  const resource = await tsqApi.getResourceDetail("resource-0");
  expect(resource.id).toBe("resource-0");
  expect(resource.label).toBe("健康");
  const need = await tsqApi.getNeedDetail("need-0");
  expect(need.id).toBe("need-0");
  expect(need.status).toBe("open");
});

test("settings and notifications expose backend-ready shapes", async () => {
  const settings = await tsqApi.getSettings();
  expect(settings.notifications).toBe(true);
  const notifications = await tsqApi.getNotifications();
  expect(notifications.length).toBeGreaterThan(0);
  expect(notifications[0].id).toBeTruthy();
});

test("xiaotian chat returns addressable user and assistant messages", async () => {
  const result = await tsqApi.sendXiaotianMessage({
    body: "我想找一位周末可以合作的摄影师",
  });

  expect(result.userMessage.senderId).toBe("me");
  expect(result.userMessage.body).toBe("我想找一位周末可以合作的摄影师");
  expect(result.userMessage.status).toBe("sent");
  expect(result.reply.senderId).toBe("xiaotian");
  expect(result.reply.body.length).toBeGreaterThan(0);
  expect(result.reply.status).toBe("sent");
});

test("xiaotian chat rejects an empty message without losing the typed contract", async () => {
  await expect(tsqApi.sendXiaotianMessage({ body: "   " })).rejects.toMatchObject({
    code: "VALIDATION",
  });
});

test("xiaotian task exposes progress steps and addressable candidates", async () => {
  const task = await tsqApi.getXiaotianTask("task-ready");

  expect(task.id).toBe("task-ready");
  expect(task.status).toBe("completed");
  expect(task.progress).toBe(100);
  expect(task.steps.every((step) => step.status === "done")).toBe(true);
  expect(task.candidates.length).toBe(3);
  expect(task.candidates[0].bridgeId).toBe("i1");
});

test("retrying a failed xiaotian task returns it to a running state", async () => {
  const failed = await tsqApi.getXiaotianTask("task-failed");
  expect(failed.status).toBe("failed");
  expect(failed.errorMessage).toBeTruthy();

  const retried = await tsqApi.retryXiaotianTask("task-failed");
  expect(retried.id).toBe("task-failed");
  expect(retried.status).toBe("running");
  expect(retried.progress).toBeGreaterThan(0);
  expect(retried.errorMessage).toBeUndefined();
});

test("unknown xiaotian tasks surface a typed not-found error", async () => {
  await expect(tsqApi.getXiaotianTask("missing")).rejects.toMatchObject({
    code: "NOT_FOUND",
  });
});
