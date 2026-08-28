import { z } from "zod";
import type { DemoBootstrap } from "../application/app-service";

const DemoRoleSchema = z.object({
  personaId: z.string().min(1),
  displayName: z.string().min(1),
  token: z.string().min(1),
  isViewer: z.boolean(),
});

const DemoSessionStateSchema = z.object({
  sessionId: z.string().min(1),
  scenarioId: z.string().min(1),
  viewerPersonaId: z.string().min(1),
  rolesByPersonaId: z.record(z.string(), DemoRoleSchema),
  activePersonaId: z.string().min(1),
  selectedMatchId: z.string().min(1).nullable(),
  selectedCounterpartId: z.string().min(1).nullable(),
});

export type DemoRole = z.infer<typeof DemoRoleSchema>;
export type DemoSessionState = z.infer<typeof DemoSessionStateSchema>;
export type DemoRoleKind = "viewer" | "counterpart";
export type DemoSessionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultStorage = (): DemoSessionStorage => {
  if (typeof sessionStorage === "undefined") {
    throw new Error("sessionStorage is unavailable; pass a storage implementation");
  }
  return sessionStorage;
};

export class DemoSessionStore {
  constructor(
    private readonly storage: DemoSessionStorage = defaultStorage(),
    private readonly storageKey = "angelbridge.demo-session",
  ) {}

  initialize(bootstrap: DemoBootstrap): DemoSessionState {
    const rolesByPersonaId = Object.fromEntries(
      bootstrap.roles.map((role) => [role.personaId, role]),
    );
    return this.write({
      sessionId: bootstrap.sessionId,
      scenarioId: bootstrap.scenarioId,
      viewerPersonaId: bootstrap.viewerPersonaId,
      rolesByPersonaId,
      activePersonaId: bootstrap.viewerPersonaId,
      selectedMatchId: null,
      selectedCounterpartId: null,
    });
  }

  get(): DemoSessionState {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) throw new Error("demo session has not been started");
    return DemoSessionStateSchema.parse(JSON.parse(raw));
  }

  getCurrentRole(): DemoRoleKind {
    const state = this.get();
    return state.activePersonaId === state.viewerPersonaId
      ? "viewer"
      : "counterpart";
  }

  getActiveRole(): DemoRole {
    const state = this.get();
    const role = state.rolesByPersonaId[state.activePersonaId];
    if (!role) throw new Error("active persona does not belong to this demo session");
    return role;
  }

  getViewerRole(): DemoRole {
    const state = this.get();
    const role = state.rolesByPersonaId[state.viewerPersonaId];
    if (!role) throw new Error("viewer persona does not belong to this demo session");
    return role;
  }

  selectMatch(matchId: string, counterpartId: string): DemoSessionState {
    const state = this.get();
    const role = state.rolesByPersonaId[counterpartId];
    if (!role || role.isViewer) {
      throw new Error("selected counterpart does not belong to this demo session");
    }
    return this.write({
      ...state,
      selectedMatchId: matchId,
      selectedCounterpartId: counterpartId,
    });
  }

  setRole(role: DemoRoleKind): DemoSessionState {
    const state = this.get();
    if (role === "viewer") {
      return this.write({ ...state, activePersonaId: state.viewerPersonaId });
    }
    if (!state.selectedCounterpartId) {
      throw new Error("select a match before switching to the counterpart role");
    }
    return this.write({
      ...state,
      activePersonaId: state.selectedCounterpartId,
    });
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
  }

  private write(input: DemoSessionState): DemoSessionState {
    const state = DemoSessionStateSchema.parse(input);
    this.storage.setItem(this.storageKey, JSON.stringify(state));
    return state;
  }
}
