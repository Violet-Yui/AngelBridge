import type { Settings } from "./types";

export type SettingsStatus = "loading" | "loadError" | "ready" | "saving" | "saved" | "saveError";
export type SettingsState = { status: SettingsStatus; persisted?: Settings; draft?: Settings; dirty: boolean };
type SettingsAction =
  | { type: "loadStarted" }
  | { type: "loadSucceeded"; settings: Settings }
  | { type: "loadFailed" }
  | { type: "toggle"; key: "notifications" | "publicProfile" }
  | { type: "saveStarted" }
  | { type: "saveSucceeded"; settings: Settings }
  | { type: "saveFailed" };

export function createSettingsState(): SettingsState { return { status: "loading", dirty: false }; }

export function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "loadStarted": return { ...state, status: "loading" };
    case "loadSucceeded": return { status: "ready", persisted: action.settings, draft: action.settings, dirty: false };
    case "loadFailed": return { ...state, status: "loadError" };
    case "toggle": {
      if (!state.draft) return state;
      const draft = { ...state.draft, [action.key]: !state.draft[action.key] };
      return { ...state, status: "ready", draft, dirty: JSON.stringify(draft) !== JSON.stringify(state.persisted) };
    }
    case "saveStarted": return { ...state, status: "saving" };
    case "saveSucceeded": return { status: "saved", persisted: action.settings, draft: action.settings, dirty: false };
    case "saveFailed": return { ...state, status: "saveError", dirty: true };
  }
}
