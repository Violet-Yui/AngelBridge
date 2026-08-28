import { INVITES } from "./data";

export type LegacyBridgeStep = "detail" | "confirm" | "schedule";

const DEFAULT_BRIDGE_ID = "i1";

export function getBridgeRoute(step: LegacyBridgeStep, id?: string): string {
  const bridgeId = id?.trim() || DEFAULT_BRIDGE_ID;
  const encodedId = encodeURIComponent(bridgeId);

  if (step === "detail") return `/bridge/${encodedId}`;
  return `/bridge/${encodedId}/${step}`;
}

export function getBridgeThreadId(bridgeId: string): string | undefined {
  return INVITES.find((invite) => invite.id === bridgeId)?.threadId;
}
