import { expect, test } from "bun:test";

const mePageSource = await Bun.file(new URL("./page.tsx", import.meta.url)).text();
const profileHeaderSource = await Bun.file(
  new URL("../../components/tsq/profile-header.tsx", import.meta.url),
).text();

test("me page relies on AppShell for the single safe-area top inset", () => {
  expect(mePageSource).not.toContain(
    'style={{ paddingTop: "max(56px, env(safe-area-inset-top, 0px))" }}',
  );
});

test("me page lets the profile header paint its top spacing", () => {
  expect(mePageSource).toContain('<AppShell topInset="none">');
  expect(profileHeaderSource).toContain("pt-10");
});
