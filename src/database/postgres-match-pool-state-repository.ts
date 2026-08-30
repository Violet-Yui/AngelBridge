import type { Pool } from "pg";
import {
  MatchPoolStateSchema,
  type MatchPoolState,
} from "../pool/contracts";
import type { MatchPoolStateRepository } from "../pool/repository";

type LegacyMatchSnapshot = {
  matches?: Record<string, {
    proof?: {
      matchReasons?: unknown[];
      valueToViewer?: unknown[];
      valueToCandidate?: unknown[];
    };
  }>;
};

const restoreLegacyMatchReasons = (snapshot: unknown): unknown => {
  const state = snapshot as LegacyMatchSnapshot;
  for (const match of Object.values(state.matches ?? {})) {
    const proof = match.proof;
    if (!proof || (proof.matchReasons?.length ?? 0) > 0) continue;
    const reasonFor = (values: unknown[]) => values
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);
    const viewerReason = reasonFor(proof.valueToViewer ?? []);
    const candidateReason = reasonFor(proof.valueToCandidate ?? []);
    proof.matchReasons = [
      ...(viewerReason ? [{
        type: "value_to_you" as const,
        text: viewerReason.trim().slice(0, 90),
        evidenceNodeIds: [],
      }] : []),
      ...(candidateReason ? [{
        type: "value_to_other" as const,
        text: candidateReason.trim().slice(0, 90),
        evidenceNodeIds: [],
      }] : []),
    ];
  }
  return snapshot;
};

export class PostgresMatchPoolStateRepository
implements MatchPoolStateRepository {
  constructor(private readonly pool: Pool) {}

  async load(): Promise<MatchPoolState | null> {
    const result = await this.pool.query<{ snapshot: unknown }>(
      "select snapshot from match_pool_snapshot where state_key = 'default'",
    );
    const row = result.rows[0];
    return row ? MatchPoolStateSchema.parse(restoreLegacyMatchReasons(row.snapshot)) : null;
  }

  async save(state: MatchPoolState): Promise<void> {
    const parsed = MatchPoolStateSchema.parse(state);
    await this.pool.query(
      `insert into match_pool_snapshot (
         state_key, snapshot_version, snapshot, created_at, updated_at
       ) values ('default', 1, $1::jsonb, now(), now())
       on conflict (state_key) do update
         set snapshot_version = excluded.snapshot_version,
             snapshot = excluded.snapshot,
             updated_at = now()`,
      [JSON.stringify(parsed)],
    );
  }

  async ping(): Promise<void> {
    await this.pool.query("select state_key from match_pool_snapshot limit 1");
  }
}
