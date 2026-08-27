import { describe, expect, test } from "bun:test";
import { getMatchHref, isTabActive } from "./navigation";

describe("homepage navigation", () => {
  test("creates a stable discover link for a match card", () => {
    expect(getMatchHref("m1")).toBe("/discover?match=m1");
  });

  test("marks nested routes active for the matching tab", () => {
    expect(isTabActive("/bridge/detail", "/bridge")).toBe(true);
    expect(isTabActive("/discover", "/")).toBe(false);
  });
});
