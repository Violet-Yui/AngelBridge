import { expect, test } from "bun:test";

const globalsCss = await Bun.file(new URL("./globals.css", import.meta.url)).text();

test("hides the document scrollbar without disabling page scrolling", () => {
  expect(globalsCss).toContain("html,\nbody");
  expect(globalsCss).toContain("*::-webkit-scrollbar");
  expect(globalsCss).toContain("scrollbar-width: none");
});
