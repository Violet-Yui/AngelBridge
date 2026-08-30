import { describe, expect, it } from "vitest";
import {
  confirmPact,
  createConsentRecord,
  createPactRecord,
  finishPact,
  submitConsent,
} from "../src/domain/workflow";

describe("consent and bridge pact workflow", () => {
  it("does not reach mutual acceptance after only one party accepts", () => {
    const record = submitConsent(
      createConsentRecord("persona-a", "persona-b"),
      "persona-a",
      "accepted",
    );

    expect(record.state).toBe("waiting_other");
  });

  it("reaches mutual acceptance only after both parties accept", () => {
    const waiting = submitConsent(
      createConsentRecord("persona-a", "persona-b"),
      "persona-a",
      "accepted",
    );
    const accepted = submitConsent(waiting, "persona-b", "accepted");

    expect(accepted.state).toBe("mutual_accepted");
  });

  it("makes rejection terminal", () => {
    const rejected = submitConsent(
      createConsentRecord("persona-a", "persona-b"),
      "persona-a",
      "rejected",
    );

    expect(rejected.state).toBe("rejected");
    expect(() => submitConsent(rejected, "persona-b", "accepted")).toThrow(
      "terminal",
    );
  });

  it("activates a pact only after both parties confirm", () => {
    const draft = confirmPact(
      createPactRecord("persona-a", "persona-b"),
      "persona-a",
    );
    expect(draft.state).toBe("draft");

    const active = confirmPact(draft, "persona-b");
    expect(active.state).toBe("active");
    expect(finishPact(active, "completed").state).toBe("completed");
  });

  it("cannot finish a draft pact", () => {
    expect(() =>
      finishPact(createPactRecord("persona-a", "persona-b"), "completed"),
    ).toThrow("only an active pact");
  });
});
