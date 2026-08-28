import { expect, test } from "bun:test";

async function loadResourceApi() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return import(`./mock-api?case=${suffix}`) as Promise<typeof import("./mock-api")>;
}

test("updates a resource and returns the saved canonical record", async () => {
  const { getOwnerResources, updateResource } = await loadResourceApi();

  const saved = await updateResource("resource-0", {
    label: "健康习惯",
    value: "早睡 · 每周跑步",
    kind: "green",
    description: "可以分享作息规划与跑步经验。",
    visibility: "public",
  });

  expect(saved).toMatchObject({
    id: "resource-0",
    label: "健康习惯",
    value: "早睡 · 每周跑步",
    visibility: "public",
  });
  expect(saved.updatedAt.length).toBeGreaterThan(0);

  const resources = await getOwnerResources();
  expect(resources.find((item) => item.id === "resource-0")?.label).toBe("健康习惯");
});

test("rejects an update when a required field is blank", async () => {
  const { updateResource } = await loadResourceApi();

  expect(
    updateResource("resource-0", {
      label: " ",
      value: "早睡",
      kind: "green",
      description: "说明",
      visibility: "public",
    }),
  ).rejects.toMatchObject({ code: "VALIDATION" });
});

test("rejects an update for an unknown resource", async () => {
  const { updateResource } = await loadResourceApi();

  expect(
    updateResource("resource-missing", {
      label: "资源",
      value: "摘要",
      kind: "warm",
      description: "说明",
      visibility: "private",
    }),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});

test("public profile excludes matched-only and private resources", async () => {
  const { getPublicProfile, updateResource } = await loadResourceApi();

  await updateResource("resource-0", {
    label: "公开资源",
    value: "所有人可见",
    kind: "green",
    description: "公开说明",
    visibility: "public",
  });
  await updateResource("resource-1", {
    label: "匹配资源",
    value: "匹配对象可见",
    kind: "warm",
    description: "匹配说明",
    visibility: "matches",
  });
  await updateResource("resource-2", {
    label: "私人资源",
    value: "仅自己可见",
    kind: "purple",
    description: "私人说明",
    visibility: "private",
  });

  const profile = await getPublicProfile("user-yiye");
  expect(profile.resources.map((item) => item.id)).toContain("resource-0");
  expect(profile.resources.map((item) => item.id)).not.toContain("resource-1");
  expect(profile.resources.map((item) => item.id)).not.toContain("resource-2");
});
