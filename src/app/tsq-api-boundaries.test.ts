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
