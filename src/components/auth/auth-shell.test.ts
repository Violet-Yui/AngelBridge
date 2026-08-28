import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("authentication shell does not offer a return-to-home action", () => {
  const shell = readFileSync("src/components/auth/auth-shell.tsx", "utf8");

  expect(shell).not.toContain("返回首页");
  expect(shell).not.toContain("ArrowLeft");
});
