import type { ValueNode } from "../domain/contracts";
import type { DemoSession, MatchConnection } from "../demo/session-service";

export type DisclosureStage = "match_only" | "mutual_consent" | "pact_active";

export type ConnectionDisclosureView = {
  counterpartId: string;
  displayName: string;
  region: string | null;
  basicContact: string | null;
  exactLocation: string | null;
  visibleNodes: ValueNode[];
  disclosureStage: DisclosureStage;
  isSynthetic: true;
};

const clone = <T>(value: T): T => structuredClone(value);

export const projectConnectionDisclosure = (
  session: DemoSession,
  connection: MatchConnection,
  viewerId: string,
): ConnectionDisclosureView => {
  if (!connection.consent.partyIds.includes(viewerId)) {
    throw new Error("viewer is not a party to this connection");
  }
  const counterpartId = connection.consent.partyIds.find((id) => id !== viewerId)!;
  const counterpart = session.profiles.find(
    (profile) => profile.personaId === counterpartId,
  );
  if (!counterpart) throw new Error("counterpart profile is missing");
  const policy = session.disclosurePolicies[counterpartId];
  if (!policy) throw new Error("counterpart disclosure policy is missing");

  const mutual = connection.consent.state === "mutual_accepted";
  const pactActive = ["active", "completed"].includes(connection.pact?.status ?? "");
  const disclosureStage: DisclosureStage = pactActive
    ? "pact_active"
    : mutual
      ? "mutual_consent"
      : "match_only";

  return {
    counterpartId,
    displayName: counterpart.displayName,
    region:
      policy.matchLocationPrecision === "region"
        ? counterpart.constraints.locations[0] ?? null
        : null,
    basicContact:
      mutual && policy.contactDisclosure === "after_mutual_consent"
        ? `演示联系号：demo-${counterpartId}`
        : null,
    exactLocation:
      pactActive && policy.exactLocationDisclosure === "after_pact_active"
        ? connection.pact?.locationSummary ?? null
        : null,
    visibleNodes: clone(
      counterpart.nodes.filter(
        (node) =>
          node.visibility === "match_only" ||
          (mutual && node.visibility === "mutual_consent"),
      ),
    ),
    disclosureStage,
    isSynthetic: true,
  };
};
