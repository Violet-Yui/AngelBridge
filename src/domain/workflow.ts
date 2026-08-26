export type MatchState =
  | "candidate"
  | "waiting_other"
  | "mutual_accepted"
  | "rejected";
export type ConsentDecision = "accepted" | "rejected";

export type ConsentRecord = {
  partyIds: [string, string];
  state: MatchState;
  decisions: Record<string, ConsentDecision | undefined>;
};

export const createConsentRecord = (
  partyA: string,
  partyB: string,
): ConsentRecord => ({
  partyIds: [partyA, partyB],
  state: "candidate",
  decisions: {},
});

export const submitConsent = (
  record: ConsentRecord,
  actorId: string,
  decision: ConsentDecision,
): ConsentRecord => {
  if (!record.partyIds.includes(actorId)) {
    throw new Error("actor is not a party to this match");
  }
  if (record.state === "mutual_accepted" || record.state === "rejected") {
    throw new Error(`match is already terminal: ${record.state}`);
  }
  if (record.decisions[actorId]) {
    throw new Error("party has already submitted a decision");
  }

  const decisions = { ...record.decisions, [actorId]: decision };
  if (decision === "rejected") {
    return { ...record, decisions, state: "rejected" };
  }

  const bothAccepted = record.partyIds.every(
    (partyId) => decisions[partyId] === "accepted",
  );
  return {
    ...record,
    decisions,
    state: bothAccepted ? "mutual_accepted" : "waiting_other",
  };
};

export type PactState = "draft" | "active" | "completed" | "exited";
export type PactRecord = {
  partyIds: [string, string];
  state: PactState;
  confirmations: Record<string, boolean | undefined>;
};

export const createPactRecord = (
  partyA: string,
  partyB: string,
): PactRecord => ({
  partyIds: [partyA, partyB],
  state: "draft",
  confirmations: {},
});

export const confirmPact = (
  record: PactRecord,
  actorId: string,
): PactRecord => {
  if (record.state !== "draft") {
    throw new Error(`only a draft pact can be confirmed: ${record.state}`);
  }
  if (!record.partyIds.includes(actorId)) {
    throw new Error("actor is not a party to this pact");
  }
  if (record.confirmations[actorId]) {
    throw new Error("party has already confirmed the pact");
  }

  const confirmations = { ...record.confirmations, [actorId]: true };
  const bothConfirmed = record.partyIds.every(
    (partyId) => confirmations[partyId] === true,
  );
  return {
    ...record,
    confirmations,
    state: bothConfirmed ? "active" : "draft",
  };
};

export const finishPact = (
  record: PactRecord,
  outcome: "completed" | "exited",
): PactRecord => {
  if (record.state !== "active") {
    throw new Error(`only an active pact can finish: ${record.state}`);
  }
  return { ...record, state: outcome };
};
