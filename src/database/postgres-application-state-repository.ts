import type { Pool } from "pg";
import {
  parseApplicationSessionSnapshot,
  type ApplicationSessionSnapshot,
  type ApplicationStateRepository,
} from "../persistence/application-state";

export class PostgresApplicationStateRepository
implements ApplicationStateRepository {
  constructor(private readonly pool: Pool) {}

  async findBySessionId(
    sessionId: string,
  ): Promise<ApplicationSessionSnapshot | null> {
    const result = await this.pool.query<{ snapshot: unknown }>(
      `select snapshot
         from application_session_snapshots
        where session_id = $1`,
      [sessionId],
    );
    const row = result.rows[0];
    return row ? parseApplicationSessionSnapshot(row.snapshot) : null;
  }

  async save(snapshot: ApplicationSessionSnapshot): Promise<void> {
    const parsed = parseApplicationSessionSnapshot(snapshot);
    await this.pool.query(
      `insert into application_session_snapshots (
         session_id, snapshot_version, snapshot, created_at, updated_at
       ) values ($1, $2, $3::jsonb, now(), now())
       on conflict (session_id) do update
         set snapshot_version = excluded.snapshot_version,
             snapshot = excluded.snapshot,
             updated_at = now()`,
      [parsed.sessionId, parsed.version, JSON.stringify(parsed)],
    );
  }

  async ping(): Promise<void> {
    await this.pool.query(
      "select snapshot_version from application_session_snapshots limit 1",
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
