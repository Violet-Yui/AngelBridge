import { expect, test } from "bun:test";
import { chatAttachmentOptions } from "./attachment-options";

test("chat attachment tray offers all four planned unavailable actions", () => {
  expect(chatAttachmentOptions.map((option) => option.id)).toEqual(["image", "camera", "location", "file"]);
  expect(chatAttachmentOptions.every((option) => option.available === false)).toBe(true);
});
