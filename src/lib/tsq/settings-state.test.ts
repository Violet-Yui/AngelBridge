import { expect, test } from "bun:test";
import { createSettingsState, settingsReducer } from "./settings-state";

const savedSettings = {
  notifications: true,
  publicProfile: true,
  language: "zh-CN" as const,
};

test("settings load failure can retry without losing a later successful result", () => {
  const failed = settingsReducer(createSettingsState(), { type: "loadFailed" });
  expect(failed.status).toBe("loadError");

  const retrying = settingsReducer(failed, { type: "loadStarted" });
  expect(retrying.status).toBe("loading");

  const loaded = settingsReducer(retrying, { type: "loadSucceeded", settings: savedSettings });
  expect(loaded.status).toBe("ready");
  expect(loaded.dirty).toBe(false);
});

test("settings save failure keeps the edited draft ready to retry", () => {
  const loaded = settingsReducer(createSettingsState(), { type: "loadSucceeded", settings: savedSettings });
  const edited = settingsReducer(loaded, { type: "toggle", key: "notifications" });
  expect(edited.dirty).toBe(true);
  expect(edited.draft?.notifications).toBe(false);

  const saving = settingsReducer(edited, { type: "saveStarted" });
  const failed = settingsReducer(saving, { type: "saveFailed" });
  expect(failed.status).toBe("saveError");
  expect(failed.dirty).toBe(true);
  expect(failed.draft?.notifications).toBe(false);
});

test("successful settings save clears the dirty state", () => {
  const loaded = settingsReducer(createSettingsState(), { type: "loadSucceeded", settings: savedSettings });
  const edited = settingsReducer(loaded, { type: "toggle", key: "publicProfile" });
  const saved = settingsReducer(edited, { type: "saveSucceeded", settings: edited.draft! });

  expect(saved.status).toBe("saved");
  expect(saved.dirty).toBe(false);
  expect(saved.persisted).toEqual(saved.draft);
});
