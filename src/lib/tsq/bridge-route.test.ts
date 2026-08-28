import { expect, test } from "bun:test";
import { getBridgeRoute, getBridgeThreadId } from "./bridge-route";

test("legacy bridge entries preserve their supplied invitation id", () => {
  expect(getBridgeRoute("detail", "i5")).toBe("/bridge/i5");
  expect(getBridgeRoute("confirm", "i5")).toBe("/bridge/i5/confirm");
  expect(getBridgeRoute("schedule", "i5")).toBe("/bridge/i5/schedule");
});

test("legacy bridge entries use a usable default when no id is supplied", () => {
  expect(getBridgeRoute("detail")).toBe("/bridge/i1");
});

test("each bridge result keeps its own conversation destination", () => {
  expect(getBridgeThreadId("i1")).toBe("c5");
  expect(getBridgeThreadId("i5")).toBe("c7");
});
