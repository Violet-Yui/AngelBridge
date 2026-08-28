import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("homepage reads its product data through tsqApi", () => {
  const page = readFileSync("src/app/page.tsx", "utf8");
  const hero = readFileSync("src/components/tsq/life-tree-hero.tsx", "utf8");
  const sections = readFileSync("src/components/tsq/home-sections.tsx", "utf8");
  expect(page).toContain("tsqApi.getHome");
  expect(`${hero}\n${sections}`).not.toContain('@/lib/tsq/data');
});

test("message list reads conversations through tsqApi", () => {
  const page = readFileSync("src/app/messages/page.tsx", "utf8");
  expect(page).toContain("tsqApi.getMessageList");
  expect(page).not.toContain("CONVERSATIONS");
});

test("message retry uses one guarded loading path", () => {
  const page = readFileSync("src/app/messages/page.tsx", "utf8");
  expect(page).toContain("const [isLoading, setIsLoading] = useState(false)");
  expect(page).toContain("if (inFlightRef.current) return");
  expect(page.match(/tsqApi.getMessageList/g)?.length).toBe(1);
  expect(page).toContain("disabled={isLoading}");
});

test("message mount load cancels Strict Mode replay before dispatch", () => {
  const page = readFileSync("src/app/messages/page.tsx", "utf8");
  expect(page).toContain("const initialLoadTimer = window.setTimeout");
  expect(page).toContain("window.clearTimeout(initialLoadTimer)");
});

test("growth log reads product data through tsqApi", () => {
  const page = readFileSync("src/app/growth/page.tsx", "utf8");

  expect(page).toContain("tsqApi.getGrowthLog");
  expect(page).not.toContain("@/lib/tsq/data");
});

test("growth retry uses one guarded loading path", () => {
  const page = readFileSync("src/app/growth/page.tsx", "utf8");

  expect(page).toContain("if (inFlightRef.current) return");
  expect(page.match(/tsqApi.getGrowthLog/g)?.length).toBe(1);
  expect(page).toContain("disabled={isLoading}");
  expect(page).toContain("window.clearTimeout(initialLoadTimer)");
});

test("home pending actions navigate on accept and remove on reject", () => {
  const source = readFileSync("src/components/tsq/home-sections.tsx", "utf8");
  expect(source).toContain("router.push");
  expect(source).toContain("setTodos((prev) => prev.filter");
  expect(source).toContain("/messages/${todo.threadId}");
  expect(source).not.toContain('todo.kind === "coop"');
  expect(source).not.toContain('todo.kind === "swap"');
});

test("bridge acceptance routes through each invitation's conversation id", () => {
  const source = readFileSync("src/app/bridge/page.tsx", "utf8");

  expect(source).toContain("invite.threadId");
  expect(source).toContain("router.push(`/messages/${invite.threadId}`)");
});

test("bridge result returns to its bridge-specific conversation", () => {
  const source = readFileSync("src/app/bridge/[id]/result/page.tsx", "utf8");

  expect(source).toContain("getBridgeThreadId");
  expect(source).toContain("/messages/${threadId ?? ''}");
});

test("pet supports edge-docked drag and persisted position", () => {
  const source = readFileSync("src/components/tsq/pet.tsx", "utf8");
  expect(source).toContain("onPointerDown");
  expect(source).toContain("touchAction: \"none\"");
  expect(source).toContain("localStorage.setItem");
  expect(source).toContain("Math.min");
  expect(source).toContain("canvasWidth - 48");
  expect(source).toContain("calc(50% - 215px)");
  expect(source).toContain("const nearLeft");
  expect(source).toContain("const nearRight");
  expect(source).toContain("isDocked");
  expect(source).toContain("bg-red-500");
  expect(source).toContain("opportunityCount > 0");
  expect(source).toContain("position.x + 76");
  expect(source).toContain("getDockedPetPresentation");
  expect(source).not.toContain("rotate(45deg)");
  expect(source).not.toContain("clipPath:");
  expect(source).toContain("aria-label={t(\"tsq.pet.title\")}");
});
